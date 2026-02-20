package public

import (
	"crypto/sha256"
	"encoding/hex"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/rapidtest/netpulse-api/internal/domain/comments"
	"github.com/rapidtest/netpulse-api/internal/http/middleware"
	"github.com/rapidtest/netpulse-api/internal/repository/postgres"
	redisRepo "github.com/rapidtest/netpulse-api/internal/repository/redis"
	"github.com/rapidtest/netpulse-api/internal/utils"
)

type EngagementHandler struct {
	commentsRepo   *postgres.CommentsRepo
	engagementRepo *postgres.EngagementRepo
	engCache       *redisRepo.EngagementCache
	auditRepo      *postgres.AuditRepo
}

func NewEngagementHandler(
	commentsRepo *postgres.CommentsRepo,
	engagementRepo *postgres.EngagementRepo,
	engCache *redisRepo.EngagementCache,
	auditRepo *postgres.AuditRepo,
) *EngagementHandler {
	return &EngagementHandler{
		commentsRepo:   commentsRepo,
		engagementRepo: engagementRepo,
		engCache:       engCache,
		auditRepo:      auditRepo,
	}
}

// ListComments handles GET /posts/{id}/comments
func (h *EngagementHandler) ListComments(w http.ResponseWriter, r *http.Request) {
	postID := chi.URLParam(r, "id")
	if postID == "" {
		utils.JSONError(w, http.StatusBadRequest, "post ID required")
		return
	}

	page := utils.QueryInt(r, "page", 1)
	limit := utils.QueryInt(r, "limit", 20)
	if limit > 50 {
		limit = 50
	}

	result, err := h.commentsRepo.FindByPost(r.Context(), postID, page, limit)
	if err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to load comments")
		return
	}

	// Load replies for each comment (max 3 preview)
	for i := range result.Items {
		if result.Items[i].ReplyCount > 0 {
			replies, err := h.commentsRepo.FindReplies(r.Context(), result.Items[i].ID, 3)
			if err == nil {
				result.Items[i].Replies = replies
			}
		}
	}

	utils.JSONResponse(w, http.StatusOK, result)
}

// CreateComment handles POST /posts/{id}/comments
func (h *EngagementHandler) CreateComment(w http.ResponseWriter, r *http.Request) {
	postID := chi.URLParam(r, "id")
	if postID == "" {
		utils.JSONError(w, http.StatusBadRequest, "post ID required")
		return
	}

	var input comments.CreateCommentInput
	if err := utils.DecodeJSON(r, &input); err != nil {
		utils.JSONError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	// Validate content
	input.Content = strings.TrimSpace(input.Content)
	if len(input.Content) < 3 {
		utils.JSONError(w, http.StatusBadRequest, "comment must be at least 3 characters")
		return
	}
	if len(input.Content) > 5000 {
		utils.JSONError(w, http.StatusBadRequest, "comment must not exceed 5000 characters")
		return
	}

	// Sanitize — strip any HTML tags (basic)
	input.Content = sanitizeText(input.Content)

	ip := middleware.ExtractIP(r)
	ua := r.UserAgent()

	// Check if authenticated
	userID := middleware.GetUserID(r)
	var userIDPtr *string
	if userID != "" {
		userIDPtr = &userID
	} else {
		// Guest comment — validate guest fields
		input.GuestName = strings.TrimSpace(input.GuestName)
		if len(input.GuestName) < 2 || len(input.GuestName) > 100 {
			utils.JSONError(w, http.StatusBadRequest, "guest name must be 2-100 characters")
			return
		}
	}

	comment := &comments.Comment{
		ID:        utils.NewID(),
		PostID:    postID,
		UserID:    userIDPtr,
		ParentID:  input.ParentID,
		GuestName: input.GuestName,
		GuestEmail: input.GuestEmail,
		Content:   input.Content,
		Status:    comments.StatusPending,
		IPAddress: ip,
		UserAgent: ua,
	}

	// Auto-approve if authenticated and verified
	if userID != "" {
		comment.Status = comments.StatusApproved
	}

	err := h.commentsRepo.Create(r.Context(), comment)
	if err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to create comment")
		return
	}

	// Increment comment count if approved
	if comment.Status == comments.StatusApproved {
		h.engagementRepo.IncrementComments(r.Context(), postID, 1)
	}

	utils.JSONResponse(w, http.StatusCreated, comment)
}

// ToggleLike handles POST /posts/{id}/like
func (h *EngagementHandler) ToggleLike(w http.ResponseWriter, r *http.Request) {
	postID := chi.URLParam(r, "id")
	if postID == "" {
		utils.JSONError(w, http.StatusBadRequest, "post ID required")
		return
	}

	ip := middleware.ExtractIP(r)
	userID := middleware.GetUserID(r)

	var userIDPtr *string
	guestKey := ""

	if userID != "" {
		userIDPtr = &userID
	} else {
		// Guest like — generate fingerprint key
		guestKey = generateGuestKey(ip, r.UserAgent())
	}

	// Check if already liked
	hasLiked, _ := h.engagementRepo.HasLiked(r.Context(), postID, userIDPtr, guestKey)

	if hasLiked {
		// Unlike
		removed, _ := h.engagementRepo.RemoveLike(r.Context(), postID, userIDPtr, guestKey)
		if removed {
			h.engagementRepo.IncrementLikes(r.Context(), postID, -1)
			if guestKey != "" {
				h.engCache.RemoveGuestLike(r.Context(), postID, guestKey)
			}
		}
		// Read from post_stats (consistent with GetPostStats)
		stats, _ := h.engagementRepo.GetStats(r.Context(), postID)
		utils.JSONResponse(w, http.StatusOK, map[string]interface{}{
			"liked":       false,
			"likes_count": stats.LikesCount,
		})
	} else {
		// Like
		added, _ := h.engagementRepo.AddLike(r.Context(), postID, userIDPtr, guestKey)
		if added {
			h.engagementRepo.IncrementLikes(r.Context(), postID, 1)
			if guestKey != "" {
				h.engCache.SetGuestLike(r.Context(), postID, guestKey)
			}
		}
		// Read from post_stats (consistent with GetPostStats)
		stats, _ := h.engagementRepo.GetStats(r.Context(), postID)
		utils.JSONResponse(w, http.StatusOK, map[string]interface{}{
			"liked":       true,
			"likes_count": stats.LikesCount,
		})
	}
}

// RecordView handles POST /posts/{id}/view
func (h *EngagementHandler) RecordView(w http.ResponseWriter, r *http.Request) {
	postID := chi.URLParam(r, "id")
	if postID == "" {
		utils.JSONError(w, http.StatusBadRequest, "post ID required")
		return
	}

	ip := middleware.ExtractIP(r)
	ua := r.UserAgent()
	referrer := r.Header.Get("Referer")

	// Check dedupe via Redis (30-minute TTL)
	isDupe, _ := h.engCache.IsViewDuplicate(r.Context(), postID, ip, ua)
	if isDupe {
		// Still return success — client doesn't need to know
		stats, _ := h.engagementRepo.GetStats(r.Context(), postID)
		utils.JSONResponse(w, http.StatusOK, stats)
		return
	}

	// Record view
	ipHash := hashIP(ip)
	h.engagementRepo.RecordView(r.Context(), postID, ipHash, ua, referrer)
	h.engagementRepo.IncrementViews(r.Context(), postID)

	stats, _ := h.engagementRepo.GetStats(r.Context(), postID)
	utils.JSONResponse(w, http.StatusOK, stats)
}

// GetPostStats handles GET /posts/{id}/stats (public stats)
func (h *EngagementHandler) GetPostStats(w http.ResponseWriter, r *http.Request) {
	postID := chi.URLParam(r, "id")
	if postID == "" {
		utils.JSONError(w, http.StatusBadRequest, "post ID required")
		return
	}

	stats, err := h.engagementRepo.GetStats(r.Context(), postID)
	if err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to get stats")
		return
	}

	// Check if current user has liked
	userID := middleware.GetUserID(r)
	ip := middleware.ExtractIP(r)
	var userIDPtr *string
	guestKey := ""
	if userID != "" {
		userIDPtr = &userID
	} else {
		guestKey = generateGuestKey(ip, r.UserAgent())
	}
	hasLiked, _ := h.engagementRepo.HasLiked(r.Context(), postID, userIDPtr, guestKey)

	utils.JSONResponse(w, http.StatusOK, map[string]interface{}{
		"views_count":    stats.ViewsCount,
		"likes_count":    stats.LikesCount,
		"comments_count": stats.CommentsCount,
		"has_liked":      hasLiked,
	})
}

// generateGuestKey creates a deterministic key for guest dedup.
func generateGuestKey(ip, ua string) string {
	h := sha256.Sum256([]byte(ip + "|" + ua))
	return hex.EncodeToString(h[:12])
}

// hashIP creates a privacy-preserving hash of an IP address.
func hashIP(ip string) string {
	h := sha256.Sum256([]byte(ip + "|netpulse-salt"))
	return hex.EncodeToString(h[:16])
}

// sanitizeText removes HTML tags from text (basic sanitization).
func sanitizeText(s string) string {
	// Simple tag removal
	result := strings.Builder{}
	inTag := false
	for _, ch := range s {
		if ch == '<' {
			inTag = true
			continue
		}
		if ch == '>' {
			inTag = false
			continue
		}
		if !inTag {
			result.WriteRune(ch)
		}
	}
	return result.String()
}
