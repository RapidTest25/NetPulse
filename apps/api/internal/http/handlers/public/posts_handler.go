package public

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/rapidtest/netpulse-api/internal/domain/posts"
	"github.com/rapidtest/netpulse-api/internal/utils"
)

type PostsHandler struct {
	svc *posts.Service
}

func NewPostsHandler(svc *posts.Service) *PostsHandler {
	return &PostsHandler{svc: svc}
}

// List returns paginated published posts.
func (h *PostsHandler) List(w http.ResponseWriter, r *http.Request) {
	filter := posts.PostListFilter{
		Status:     posts.StatusPublished,
		CategoryID: utils.QueryString(r, "category", ""),
		TagID:      utils.QueryString(r, "tag", ""),
		Page:       utils.QueryInt(r, "page", 1),
		Limit:      utils.QueryInt(r, "limit", 10),
		Sort:       utils.QueryString(r, "sort", "newest"),
	}

	result, err := h.svc.List(r.Context(), filter)
	if err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to fetch posts")
		return
	}

	utils.JSONResponse(w, http.StatusOK, result)
}

// GetBySlug returns a single published post.
func (h *PostsHandler) GetBySlug(w http.ResponseWriter, r *http.Request) {
	slug := chi.URLParam(r, "id")
	if slug == "" {
		utils.JSONError(w, http.StatusBadRequest, "slug is required")
		return
	}

	post, err := h.svc.GetBySlug(r.Context(), slug)
	if err != nil {
		utils.JSONError(w, http.StatusNotFound, "post not found")
		return
	}

	utils.JSONResponse(w, http.StatusOK, post)
}
