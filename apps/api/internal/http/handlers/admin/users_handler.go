package admin

import (
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/rapidtest/netpulse-api/internal/domain/users"
	"github.com/rapidtest/netpulse-api/internal/http/middleware"
	"github.com/rapidtest/netpulse-api/internal/repository/postgres"
	"github.com/rapidtest/netpulse-api/internal/security"
	"github.com/rapidtest/netpulse-api/internal/utils"
)

type UsersHandler struct {
	usersRepo    *postgres.UsersRepo
	rolesRepo    *postgres.RolesRepo
	auditRepo    *postgres.AuditRepo
	referralRepo *postgres.ReferralRepo
	authRepo     *postgres.AuthRepo
}

func NewUsersHandler(
	usersRepo *postgres.UsersRepo,
	rolesRepo *postgres.RolesRepo,
	auditRepo *postgres.AuditRepo,
	referralRepo *postgres.ReferralRepo,
	authRepo *postgres.AuthRepo,
) *UsersHandler {
	return &UsersHandler{
		usersRepo:    usersRepo,
		rolesRepo:    rolesRepo,
		auditRepo:    auditRepo,
		referralRepo: referralRepo,
		authRepo:     authRepo,
	}
}

// List returns users with optional filtering.
func (h *UsersHandler) List(w http.ResponseWriter, r *http.Request) {
	search := utils.QueryString(r, "search", "")

	// If no filters, use simple listing
	if search == "" && utils.QueryString(r, "role", "") == "" {
		page := utils.QueryInt(r, "page", 1)
		limit := utils.QueryInt(r, "limit", 20)
		result, total, err := h.usersRepo.FindAll(r.Context(), page, limit)
		if err != nil {
			utils.JSONError(w, http.StatusInternalServerError, "failed to list users")
			return
		}
		utils.JSONResponse(w, http.StatusOK, map[string]interface{}{
			"items": result, "total": total, "page": page, "limit": limit,
		})
		return
	}

	// Filtered listing
	filter := users.UserFilter{
		Search: search,
		Role:   utils.QueryString(r, "role", ""),
		Page:   utils.QueryInt(r, "page", 1),
		Limit:  utils.QueryInt(r, "limit", 20),
	}
	if v := utils.QueryString(r, "verified", ""); v != "" {
		b := v == "true"
		filter.Verified = &b
	}
	if v := utils.QueryString(r, "active", ""); v != "" {
		b := v == "true"
		filter.Active = &b
	}

	result, err := h.usersRepo.FindAllFiltered(r.Context(), filter)
	if err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to list users")
		return
	}
	utils.JSONResponse(w, http.StatusOK, result)
}

// GetByID returns a user by ID with referral stats.
func (h *UsersHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	user, err := h.usersRepo.FindByID(r.Context(), id)
	if err != nil {
		utils.JSONError(w, http.StatusNotFound, "user not found")
		return
	}

	// Load referral stats
	totalReferrals, verifiedReferrals, _ := h.referralRepo.GetUserReferralStats(r.Context(), id)
	referralStats := map[string]int{"total": totalReferrals, "verified": verifiedReferrals}

	// Load sessions
	sessions, _ := h.authRepo.GetUserSessions(r.Context(), id)

	utils.JSONResponse(w, http.StatusOK, map[string]interface{}{
		"user":           user,
		"referral_stats": referralStats,
		"sessions":       sessions,
	})
}

// Invite creates a new user with a temporary password.
func (h *UsersHandler) Invite(w http.ResponseWriter, r *http.Request) {
	var input users.InviteUserInput
	if err := utils.DecodeJSON(r, &input); err != nil {
		utils.JSONError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	// Generate temporary password
	tempPassword := utils.NewID()[:12]
	hash, err := security.HashPassword(tempPassword)
	if err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to hash password")
		return
	}

	referralCode, _ := security.GenerateReferralCode()
	now := time.Now()
	user := &users.User{
		ID:           utils.NewID(),
		Email:        input.Email,
		Name:         input.Name,
		PasswordHash: hash,
		IsActive:     true,
		ReferralCode: referralCode,
		CreatedAt:    now,
		UpdatedAt:    now,
	}

	if err := h.usersRepo.Create(r.Context(), user); err != nil {
		utils.JSONError(w, http.StatusConflict, "user already exists or creation failed")
		return
	}

	// Assign role
	roleID, err := h.rolesRepo.FindByName(r.Context(), input.Role)
	if err == nil {
		_ = h.usersRepo.SetRole(r.Context(), user.ID, roleID)
	}

	adminID := middleware.GetUserID(r)
	_ = h.auditRepo.Log(r.Context(), adminID, "invite", "user", user.ID, input.Role, r.RemoteAddr)

	utils.JSONResponse(w, http.StatusCreated, map[string]interface{}{
		"user":          user,
		"temp_password": tempPassword,
	})
}

// UpdateRole changes a user's role.
func (h *UsersHandler) UpdateRole(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	var body struct {
		Role string `json:"role"`
	}
	if err := utils.DecodeJSON(r, &body); err != nil {
		utils.JSONError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	roleID, err := h.rolesRepo.FindByName(r.Context(), body.Role)
	if err != nil {
		utils.JSONError(w, http.StatusBadRequest, "invalid role")
		return
	}

	// Clear existing roles and set new one
	_ = h.usersRepo.ClearRoles(r.Context(), id)
	if err := h.usersRepo.SetRole(r.Context(), id, roleID); err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to update role")
		return
	}

	adminID := middleware.GetUserID(r)
	_ = h.auditRepo.Log(r.Context(), adminID, "update_role", "user", id, body.Role, r.RemoteAddr)

	utils.JSONResponse(w, http.StatusOK, map[string]string{"message": "role updated"})
}

// Disable deactivates a user account.
func (h *UsersHandler) Disable(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	if err := h.usersRepo.DisableUser(r.Context(), id); err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to disable user")
		return
	}

	// Revoke all sessions
	_ = h.authRepo.RevokeAllUserTokens(r.Context(), id)

	adminID := middleware.GetUserID(r)
	_ = h.auditRepo.Log(r.Context(), adminID, "disable", "user", id, "", r.RemoteAddr)

	utils.JSONResponse(w, http.StatusOK, map[string]string{"message": "user disabled"})
}

// Enable reactivates a user account.
func (h *UsersHandler) Enable(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	if err := h.usersRepo.EnableUser(r.Context(), id); err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to enable user")
		return
	}

	adminID := middleware.GetUserID(r)
	_ = h.auditRepo.Log(r.Context(), adminID, "enable", "user", id, "", r.RemoteAddr)

	utils.JSONResponse(w, http.StatusOK, map[string]string{"message": "user enabled"})
}

// Sessions returns active sessions for a user.
func (h *UsersHandler) Sessions(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	sessions, err := h.authRepo.GetUserSessions(r.Context(), id)
	if err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to load sessions")
		return
	}
	utils.JSONResponse(w, http.StatusOK, map[string]interface{}{"items": sessions})
}

// RevokeSession revokes a specific user session.
func (h *UsersHandler) RevokeSession(w http.ResponseWriter, r *http.Request) {
	userID := chi.URLParam(r, "id")
	sessionID := chi.URLParam(r, "sessionId")

	if err := h.authRepo.RevokeSession(r.Context(), sessionID, userID); err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to revoke session")
		return
	}

	adminID := middleware.GetUserID(r)
	_ = h.auditRepo.Log(r.Context(), adminID, "revoke_session", "user", userID, sessionID, r.RemoteAddr)

	utils.JSONResponse(w, http.StatusOK, map[string]string{"message": "session revoked"})
}
