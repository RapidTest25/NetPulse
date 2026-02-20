package author

import (
	"net/http"

	"github.com/rapidtest/netpulse-api/internal/domain/authorrequest"
	"github.com/rapidtest/netpulse-api/internal/http/middleware"
	"github.com/rapidtest/netpulse-api/internal/repository/postgres"
	"github.com/rapidtest/netpulse-api/internal/utils"
)

// AuthorRequestHandler handles user-side author request operations.
type AuthorRequestHandler struct {
	repo     *postgres.AuthorRequestRepo
	auditRepo interface{ Log(ctx interface{}, userID, action, entity, entityID, details, ip string) }
}

func NewAuthorRequestHandler(repo *postgres.AuthorRequestRepo) *AuthorRequestHandler {
	return &AuthorRequestHandler{repo: repo}
}

// Create submits a new author request.
func (h *AuthorRequestHandler) Create(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)
	if userID == "" {
		utils.JSONError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	// Check role — if already AUTHOR or higher, reject
	role := middleware.GetUserRole(r)
	if role == "AUTHOR" || role == "EDITOR" || role == "ADMIN" || role == "OWNER" {
		utils.JSONError(w, http.StatusBadRequest, "you already have author or higher privileges")
		return
	}

	// Check if user already has a pending request
	hasPending, _ := h.repo.HasPending(r.Context(), userID)
	if hasPending {
		utils.JSONError(w, http.StatusConflict, "you already have a pending author request")
		return
	}

	var input authorrequest.CreateAuthorRequestInput
	if err := utils.DecodeJSON(r, &input); err != nil {
		utils.JSONError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if input.Reason == "" {
		utils.JSONError(w, http.StatusBadRequest, "reason is required")
		return
	}

	ar, err := h.repo.Create(r.Context(), userID, input.Reason)
	if err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to create author request")
		return
	}

	utils.JSONResponse(w, http.StatusCreated, ar)
}

// GetStatus returns the current user's latest author request status.
func (h *AuthorRequestHandler) GetStatus(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)
	if userID == "" {
		utils.JSONError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	ar, err := h.repo.GetByUserID(r.Context(), userID)
	if err != nil {
		// No request found
		utils.JSONResponse(w, http.StatusOK, map[string]interface{}{
			"has_request": false,
			"status":      nil,
		})
		return
	}

	utils.JSONResponse(w, http.StatusOK, map[string]interface{}{
		"has_request": true,
		"request":     ar,
	})
}
