package author

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/rapidtest/netpulse-api/internal/domain/saves"
	"github.com/rapidtest/netpulse-api/internal/http/middleware"
	"github.com/rapidtest/netpulse-api/internal/repository/postgres"
	"github.com/rapidtest/netpulse-api/internal/utils"
)

// UserFeaturesHandler handles saves, likes, and comment history for authenticated users.
type UserFeaturesHandler struct {
	savesRepo *postgres.SavesRepo
}

func NewUserFeaturesHandler(savesRepo *postgres.SavesRepo) *UserFeaturesHandler {
	return &UserFeaturesHandler{savesRepo: savesRepo}
}

// ListSaved returns the user's saved/bookmarked posts.
func (h *UserFeaturesHandler) ListSaved(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)
	if userID == "" {
		utils.JSONError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	page := utils.QueryInt(r, "page", 1)
	limit := utils.QueryInt(r, "limit", 10)

	result, err := h.savesRepo.ListByUser(r.Context(), saves.SaveFilter{
		UserID: userID,
		Page:   page,
		Limit:  limit,
	})
	if err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to fetch saved posts")
		return
	}

	utils.JSONResponse(w, http.StatusOK, result)
}

// ListLiked returns posts liked by the user.
func (h *UserFeaturesHandler) ListLiked(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)
	if userID == "" {
		utils.JSONError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	page := utils.QueryInt(r, "page", 1)
	limit := utils.QueryInt(r, "limit", 10)

	result, err := h.savesRepo.ListLikedByUser(r.Context(), userID, page, limit)
	if err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to fetch liked posts")
		return
	}

	utils.JSONResponse(w, http.StatusOK, result)
}

// ListMyComments returns the user's comment history.
func (h *UserFeaturesHandler) ListMyComments(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)
	if userID == "" {
		utils.JSONError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	page := utils.QueryInt(r, "page", 1)
	limit := utils.QueryInt(r, "limit", 10)

	items, total, err := h.savesRepo.ListCommentsByUser(r.Context(), userID, page, limit)
	if err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to fetch comments")
		return
	}

	totalPages := 0
	if limit > 0 {
		totalPages = (total + limit - 1) / limit
	}

	utils.JSONResponse(w, http.StatusOK, map[string]interface{}{
		"items":       items,
		"total":       total,
		"page":        page,
		"limit":       limit,
		"total_pages": totalPages,
	})
}

// ToggleSave saves or unsaves a post for the current user.
func (h *UserFeaturesHandler) ToggleSave(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)
	if userID == "" {
		utils.JSONError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	postID := chi.URLParam(r, "id")
	if postID == "" {
		utils.JSONError(w, http.StatusBadRequest, "missing post id")
		return
	}

	h.savesRepo.EnsurePostStats(r.Context(), postID)

	saved, count, err := h.savesRepo.Toggle(r.Context(), userID, postID)
	if err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to toggle save")
		return
	}

	utils.JSONResponse(w, http.StatusOK, saves.SaveResponse{
		Saved:      saved,
		SavesCount: count,
	})
}

// CheckSaved checks if the current user has saved a specific post.
func (h *UserFeaturesHandler) CheckSaved(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)
	if userID == "" {
		utils.JSONError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	postID := chi.URLParam(r, "id")
	if postID == "" {
		utils.JSONError(w, http.StatusBadRequest, "missing post id")
		return
	}

	saved, _ := h.savesRepo.IsSaved(r.Context(), userID, postID)
	utils.JSONResponse(w, http.StatusOK, map[string]bool{"saved": saved})
}
