package admin

import (
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/rapidtest/netpulse-api/internal/domain/posts"
	"github.com/rapidtest/netpulse-api/internal/http/middleware"
	"github.com/rapidtest/netpulse-api/internal/repository/postgres"
	"github.com/rapidtest/netpulse-api/internal/utils"
)

type PostsHandler struct {
	svc       *posts.Service
	auditRepo *postgres.AuditRepo
}

func NewPostsHandler(svc *posts.Service, auditRepo *postgres.AuditRepo) *PostsHandler {
	return &PostsHandler{svc: svc, auditRepo: auditRepo}
}

// List returns all posts (admin view, all statuses).
func (h *PostsHandler) List(w http.ResponseWriter, r *http.Request) {
	filter := posts.PostListFilter{
		Status:   posts.PostStatus(utils.QueryString(r, "status", "")),
		Page:     utils.QueryInt(r, "page", 1),
		Limit:    utils.QueryInt(r, "limit", 20),
		Sort:     utils.QueryString(r, "sort", "newest"),
		AuthorID: utils.QueryString(r, "author", ""),
	}

	result, err := h.svc.List(r.Context(), filter)
	if err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to list posts")
		return
	}

	utils.JSONResponse(w, http.StatusOK, result)
}

// GetByID returns a post by ID.
func (h *PostsHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	post, err := h.svc.GetByID(r.Context(), id)
	if err != nil {
		utils.JSONError(w, http.StatusNotFound, "post not found")
		return
	}
	utils.JSONResponse(w, http.StatusOK, post)
}

// Create creates a new draft post.
func (h *PostsHandler) Create(w http.ResponseWriter, r *http.Request) {
	var input posts.CreatePostInput
	if err := utils.DecodeJSON(r, &input); err != nil {
		utils.JSONError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	authorID, _ := r.Context().Value(middleware.CtxUserID).(string)

	post, err := h.svc.Create(r.Context(), input, authorID)
	if err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to create post")
		return
	}

	_ = h.auditRepo.Log(r.Context(), authorID, "create", "post", post.ID, "", r.RemoteAddr)

	utils.JSONResponse(w, http.StatusCreated, post)
}

// Update modifies a post.
func (h *PostsHandler) Update(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	var input posts.UpdatePostInput
	if err := utils.DecodeJSON(r, &input); err != nil {
		utils.JSONError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	post, err := h.svc.Update(r.Context(), id, input)
	if err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to update post")
		return
	}

	userID, _ := r.Context().Value(middleware.CtxUserID).(string)
	_ = h.auditRepo.Log(r.Context(), userID, "update", "post", id, "", r.RemoteAddr)

	utils.JSONResponse(w, http.StatusOK, post)
}

// Delete removes a post.
func (h *PostsHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	if err := h.svc.Delete(r.Context(), id); err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to delete post")
		return
	}

	userID, _ := r.Context().Value(middleware.CtxUserID).(string)
	_ = h.auditRepo.Log(r.Context(), userID, "delete", "post", id, "", r.RemoteAddr)

	utils.JSONResponse(w, http.StatusOK, map[string]string{"message": "deleted"})
}

// SubmitReview transitions a post to IN_REVIEW.
func (h *PostsHandler) SubmitReview(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	if err := h.svc.SubmitReview(r.Context(), id); err != nil {
		utils.JSONError(w, http.StatusBadRequest, err.Error())
		return
	}

	userID, _ := r.Context().Value(middleware.CtxUserID).(string)
	_ = h.auditRepo.Log(r.Context(), userID, "submit_review", "post", id, "", r.RemoteAddr)

	utils.JSONResponse(w, http.StatusOK, map[string]string{"message": "submitted for review"})
}

// Publish transitions a post to PUBLISHED.
func (h *PostsHandler) Publish(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	if err := h.svc.Publish(r.Context(), id); err != nil {
		utils.JSONError(w, http.StatusBadRequest, err.Error())
		return
	}

	userID, _ := r.Context().Value(middleware.CtxUserID).(string)
	_ = h.auditRepo.Log(r.Context(), userID, "publish", "post", id, "", r.RemoteAddr)

	utils.JSONResponse(w, http.StatusOK, map[string]string{"message": "published"})
}

// Schedule sets a post to publish at a future time.
func (h *PostsHandler) Schedule(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	var body struct {
		ScheduledAt time.Time `json:"scheduled_at"`
	}
	if err := utils.DecodeJSON(r, &body); err != nil {
		utils.JSONError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if err := h.svc.Schedule(r.Context(), id, body.ScheduledAt); err != nil {
		utils.JSONError(w, http.StatusBadRequest, err.Error())
		return
	}

	userID, _ := r.Context().Value(middleware.CtxUserID).(string)
	_ = h.auditRepo.Log(r.Context(), userID, "schedule", "post", id, "", r.RemoteAddr)

	utils.JSONResponse(w, http.StatusOK, map[string]string{"message": "scheduled"})
}
