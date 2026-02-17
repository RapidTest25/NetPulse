package admin

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/rapidtest/netpulse-api/internal/domain/comments"
	"github.com/rapidtest/netpulse-api/internal/http/middleware"
	"github.com/rapidtest/netpulse-api/internal/repository/postgres"
	"github.com/rapidtest/netpulse-api/internal/utils"
)

type CommentsHandler struct {
	commentsRepo   *postgres.CommentsRepo
	engagementRepo *postgres.EngagementRepo
	auditRepo      *postgres.AuditRepo
}

func NewCommentsHandler(commentsRepo *postgres.CommentsRepo, engagementRepo *postgres.EngagementRepo, auditRepo *postgres.AuditRepo) *CommentsHandler {
	return &CommentsHandler{commentsRepo: commentsRepo, engagementRepo: engagementRepo, auditRepo: auditRepo}
}

// List handles GET /admin/comments
func (h *CommentsHandler) List(w http.ResponseWriter, r *http.Request) {
	filter := comments.CommentFilter{
		PostID: utils.QueryString(r, "post_id", ""),
		Status: comments.CommentStatus(utils.QueryString(r, "status", "")),
		Search: utils.QueryString(r, "search", ""),
		Page:   utils.QueryInt(r, "page", 1),
		Limit:  utils.QueryInt(r, "limit", 20),
	}

	result, err := h.commentsRepo.FindAll(r.Context(), filter)
	if err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to load comments")
		return
	}

	utils.JSONResponse(w, http.StatusOK, result)
}

// Moderate handles PATCH /admin/comments/{id}
func (h *CommentsHandler) Moderate(w http.ResponseWriter, r *http.Request) {
	commentID := chi.URLParam(r, "id")
	if commentID == "" {
		utils.JSONError(w, http.StatusBadRequest, "comment ID required")
		return
	}

	var input comments.ModerateCommentInput
	if err := utils.DecodeJSON(r, &input); err != nil {
		utils.JSONError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	// Validate status
	switch input.Status {
	case comments.StatusApproved, comments.StatusRejected, comments.StatusSpam, comments.StatusPending:
	default:
		utils.JSONError(w, http.StatusBadRequest, "invalid status")
		return
	}

	// Get original comment to check if status changed
	original, err := h.commentsRepo.FindByID(r.Context(), commentID)
	if err != nil {
		utils.JSONError(w, http.StatusNotFound, "comment not found")
		return
	}

	err = h.commentsRepo.UpdateStatus(r.Context(), commentID, input.Status)
	if err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to update comment")
		return
	}

	// Update comment count
	if original.Status == comments.StatusApproved && input.Status != comments.StatusApproved {
		h.engagementRepo.IncrementComments(r.Context(), original.PostID, -1)
	} else if original.Status != comments.StatusApproved && input.Status == comments.StatusApproved {
		h.engagementRepo.IncrementComments(r.Context(), original.PostID, 1)
	}

	userID := middleware.GetUserID(r)
	ip := middleware.ExtractIP(r)
	h.auditRepo.Log(r.Context(), userID, "comment.moderate", "comment", commentID,
		"status changed to "+string(input.Status), ip)

	utils.JSONResponse(w, http.StatusOK, map[string]string{"message": "comment updated"})
}

// BulkModerate handles POST /admin/comments/bulk
func (h *CommentsHandler) BulkModerate(w http.ResponseWriter, r *http.Request) {
	var input comments.BulkModerateInput
	if err := utils.DecodeJSON(r, &input); err != nil {
		utils.JSONError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if len(input.IDs) == 0 {
		utils.JSONError(w, http.StatusBadRequest, "no comment IDs provided")
		return
	}

	err := h.commentsRepo.BulkUpdateStatus(r.Context(), input.IDs, input.Status)
	if err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to update comments")
		return
	}

	userID := middleware.GetUserID(r)
	ip := middleware.ExtractIP(r)
	h.auditRepo.Log(r.Context(), userID, "comment.bulk_moderate", "comment", "",
		"bulk status changed to "+string(input.Status), ip)

	utils.JSONResponse(w, http.StatusOK, map[string]string{"message": "comments updated"})
}

// Delete handles DELETE /admin/comments/{id}
func (h *CommentsHandler) Delete(w http.ResponseWriter, r *http.Request) {
	commentID := chi.URLParam(r, "id")
	if commentID == "" {
		utils.JSONError(w, http.StatusBadRequest, "comment ID required")
		return
	}

	original, err := h.commentsRepo.FindByID(r.Context(), commentID)
	if err != nil {
		utils.JSONError(w, http.StatusNotFound, "comment not found")
		return
	}

	err = h.commentsRepo.SoftDelete(r.Context(), commentID)
	if err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to delete comment")
		return
	}

	if original.Status == comments.StatusApproved {
		h.engagementRepo.IncrementComments(r.Context(), original.PostID, -1)
	}

	userID := middleware.GetUserID(r)
	ip := middleware.ExtractIP(r)
	h.auditRepo.Log(r.Context(), userID, "comment.delete", "comment", commentID, "", ip)

	utils.JSONResponse(w, http.StatusOK, map[string]string{"message": "comment deleted"})
}
