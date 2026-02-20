package admin

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/rapidtest/netpulse-api/internal/domain/authorrequest"
	"github.com/rapidtest/netpulse-api/internal/http/middleware"
	"github.com/rapidtest/netpulse-api/internal/repository/postgres"
	"github.com/rapidtest/netpulse-api/internal/utils"
)

// AuthorRequestAdminHandler handles admin-side author request operations.
type AuthorRequestAdminHandler struct {
	repo      *postgres.AuthorRequestRepo
	auditRepo *postgres.AuditRepo
}

func NewAuthorRequestAdminHandler(repo *postgres.AuthorRequestRepo, auditRepo *postgres.AuditRepo) *AuthorRequestAdminHandler {
	return &AuthorRequestAdminHandler{repo: repo, auditRepo: auditRepo}
}

// List returns paginated author requests for admin review.
func (h *AuthorRequestAdminHandler) List(w http.ResponseWriter, r *http.Request) {
	status := utils.QueryString(r, "status", "")
	page := utils.QueryInt(r, "page", 1)
	limit := utils.QueryInt(r, "limit", 10)

	result, err := h.repo.List(r.Context(), authorrequest.AuthorRequestFilter{
		Status: status,
		Page:   page,
		Limit:  limit,
	})
	if err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to fetch author requests")
		return
	}

	utils.JSONResponse(w, http.StatusOK, result)
}

// Review approves or rejects an author request.
func (h *AuthorRequestAdminHandler) Review(w http.ResponseWriter, r *http.Request) {
	adminID := middleware.GetUserID(r)
	requestID := chi.URLParam(r, "id")
	if requestID == "" {
		utils.JSONError(w, http.StatusBadRequest, "missing request id")
		return
	}

	var input authorrequest.ReviewAuthorRequestInput
	if err := utils.DecodeJSON(r, &input); err != nil {
		utils.JSONError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if input.Status != "APPROVED" && input.Status != "REJECTED" {
		utils.JSONError(w, http.StatusBadRequest, "status must be APPROVED or REJECTED")
		return
	}

	err := h.repo.Review(r.Context(), requestID, adminID, input.Status, input.AdminNote)
	if err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to review author request")
		return
	}

	// Audit log
	if h.auditRepo != nil {
		_ = h.auditRepo.Log(r.Context(), adminID, "author_request."+input.Status, "author_request", requestID, input.AdminNote, middleware.ExtractIP(r))
	}

	utils.JSONResponse(w, http.StatusOK, map[string]string{"message": "author request " + input.Status})
}

// GetByID returns a specific author request.
func (h *AuthorRequestAdminHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	requestID := chi.URLParam(r, "id")
	if requestID == "" {
		utils.JSONError(w, http.StatusBadRequest, "missing request id")
		return
	}

	ar, err := h.repo.GetByID(r.Context(), requestID)
	if err != nil {
		utils.JSONError(w, http.StatusNotFound, "author request not found")
		return
	}

	utils.JSONResponse(w, http.StatusOK, ar)
}
