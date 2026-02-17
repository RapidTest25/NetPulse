package author

import (
	"math"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/rapidtest/netpulse-api/internal/domain/posts"
	"github.com/rapidtest/netpulse-api/internal/http/middleware"
	"github.com/rapidtest/netpulse-api/internal/repository/postgres"
	"github.com/rapidtest/netpulse-api/internal/utils"
)

// PostsHandler handles author-facing post operations.
type PostsHandler struct {
	postsSvc *posts.Service
	auditRepo *postgres.AuditRepo
}

func NewPostsHandler(postsSvc *posts.Service, auditRepo *postgres.AuditRepo) *PostsHandler {
	return &PostsHandler{postsSvc: postsSvc, auditRepo: auditRepo}
}

// List returns only the authenticated author's posts.
func (h *PostsHandler) List(w http.ResponseWriter, r *http.Request) {
	userID, _ := r.Context().Value(middleware.CtxUserID).(string)
	if userID == "" {
		utils.JSONError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	filter := posts.PostListFilter{
		AuthorID: userID,
		Page:     utils.QueryInt(r, "page", 1),
		Limit:    utils.QueryInt(r, "limit", 20),
		Sort:     utils.QueryString(r, "sort", "newest"),
	}

	status := utils.QueryString(r, "status", "")
	if status != "" {
		filter.Status = posts.PostStatus(status)
	}

	result, err := h.postsSvc.List(r.Context(), filter)
	if err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to list posts")
		return
	}

	utils.JSONResponse(w, http.StatusOK, result)
}

// GetByID returns a specific post owned by the author.
func (h *PostsHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	userID, _ := r.Context().Value(middleware.CtxUserID).(string)
	postID := chi.URLParam(r, "id")

	post, err := h.postsSvc.GetByID(r.Context(), postID)
	if err != nil {
		utils.JSONError(w, http.StatusNotFound, "post not found")
		return
	}

	// Authors can only view their own posts
	if post.AuthorID != userID {
		utils.JSONError(w, http.StatusForbidden, "you can only view your own posts")
		return
	}

	utils.JSONResponse(w, http.StatusOK, post)
}

// Create creates a new draft post for the author.
func (h *PostsHandler) Create(w http.ResponseWriter, r *http.Request) {
	userID, _ := r.Context().Value(middleware.CtxUserID).(string)
	if userID == "" {
		utils.JSONError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	var input posts.CreatePostInput
	if err := utils.DecodeJSON(r, &input); err != nil {
		utils.JSONError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if input.Title == "" || input.Body == "" {
		utils.JSONError(w, http.StatusBadRequest, "title and body are required")
		return
	}

	post, err := h.postsSvc.Create(r.Context(), input, userID)
	if err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to create post: "+err.Error())
		return
	}

	h.auditRepo.Log(r.Context(), userID, "create", "post", post.ID, "Author created post: "+post.Title, r.RemoteAddr)
	utils.JSONResponse(w, http.StatusCreated, post)
}

// Update updates an author's own post (only if DRAFT or CHANGES_REQUESTED).
func (h *PostsHandler) Update(w http.ResponseWriter, r *http.Request) {
	userID, _ := r.Context().Value(middleware.CtxUserID).(string)
	postID := chi.URLParam(r, "id")

	post, err := h.postsSvc.GetByID(r.Context(), postID)
	if err != nil {
		utils.JSONError(w, http.StatusNotFound, "post not found")
		return
	}

	if post.AuthorID != userID {
		utils.JSONError(w, http.StatusForbidden, "you can only edit your own posts")
		return
	}

	if post.Status != posts.StatusDraft && post.Status != posts.StatusChangesRequested {
		utils.JSONError(w, http.StatusBadRequest, "post can only be edited in DRAFT or CHANGES_REQUESTED status")
		return
	}

	var input posts.UpdatePostInput
	if err := utils.DecodeJSON(r, &input); err != nil {
		utils.JSONError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	updated, err := h.postsSvc.Update(r.Context(), postID, input)
	if err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to update post")
		return
	}

	h.auditRepo.Log(r.Context(), userID, "update", "post", postID, "Author updated post", r.RemoteAddr)
	utils.JSONResponse(w, http.StatusOK, updated)
}

// Delete deletes an author's own draft post.
func (h *PostsHandler) Delete(w http.ResponseWriter, r *http.Request) {
	userID, _ := r.Context().Value(middleware.CtxUserID).(string)
	postID := chi.URLParam(r, "id")

	post, err := h.postsSvc.GetByID(r.Context(), postID)
	if err != nil {
		utils.JSONError(w, http.StatusNotFound, "post not found")
		return
	}

	if post.AuthorID != userID {
		utils.JSONError(w, http.StatusForbidden, "you can only delete your own posts")
		return
	}

	if post.Status != posts.StatusDraft {
		utils.JSONError(w, http.StatusBadRequest, "only draft posts can be deleted")
		return
	}

	if err := h.postsSvc.Delete(r.Context(), postID); err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to delete post")
		return
	}

	h.auditRepo.Log(r.Context(), userID, "delete", "post", postID, "Author deleted draft post", r.RemoteAddr)
	utils.JSONResponse(w, http.StatusOK, map[string]string{"message": "post deleted"})
}

// SubmitReview submits drafts for editorial review.
func (h *PostsHandler) SubmitReview(w http.ResponseWriter, r *http.Request) {
	userID, _ := r.Context().Value(middleware.CtxUserID).(string)
	postID := chi.URLParam(r, "id")

	post, err := h.postsSvc.GetByID(r.Context(), postID)
	if err != nil {
		utils.JSONError(w, http.StatusNotFound, "post not found")
		return
	}

	if post.AuthorID != userID {
		utils.JSONError(w, http.StatusForbidden, "you can only submit your own posts for review")
		return
	}

	if err := h.postsSvc.SubmitReview(r.Context(), postID); err != nil {
		utils.JSONError(w, http.StatusBadRequest, err.Error())
		return
	}

	h.auditRepo.Log(r.Context(), userID, "submit_review", "post", postID, "Author submitted post for review", r.RemoteAddr)
	utils.JSONResponse(w, http.StatusOK, map[string]string{"message": "post submitted for review"})
}

// Stats returns the author's aggregated stats.
func (h *PostsHandler) Stats(w http.ResponseWriter, r *http.Request) {
	userID, _ := r.Context().Value(middleware.CtxUserID).(string)

	// Get counts by status
	allPosts, err := h.postsSvc.List(r.Context(), posts.PostListFilter{
		AuthorID: userID,
		Page:     1,
		Limit:    1,
	})
	if err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to get stats")
		return
	}

	// Get published specifically
	published, _ := h.postsSvc.List(r.Context(), posts.PostListFilter{
		AuthorID: userID,
		Status:   posts.StatusPublished,
		Page:     1,
		Limit:    1,
	})

	drafts, _ := h.postsSvc.List(r.Context(), posts.PostListFilter{
		AuthorID: userID,
		Status:   posts.StatusDraft,
		Page:     1,
		Limit:    1,
	})

	inReview, _ := h.postsSvc.List(r.Context(), posts.PostListFilter{
		AuthorID: userID,
		Status:   posts.StatusInReview,
		Page:     1,
		Limit:    1,
	})

	_ = math.Ceil // keep import

	stats := map[string]interface{}{
		"total_posts": allPosts.Total,
		"published":   0,
		"drafts":      0,
		"in_review":   0,
	}
	if published != nil {
		stats["published"] = published.Total
	}
	if drafts != nil {
		stats["drafts"] = drafts.Total
	}
	if inReview != nil {
		stats["in_review"] = inReview.Total
	}

	utils.JSONResponse(w, http.StatusOK, stats)
}
