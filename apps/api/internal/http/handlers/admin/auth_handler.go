package admin

import (
	"net/http"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/rapidtest/netpulse-api/internal/config"
	"github.com/rapidtest/netpulse-api/internal/domain/auth"
	"github.com/rapidtest/netpulse-api/internal/domain/users"
	"github.com/rapidtest/netpulse-api/internal/http/middleware"
	"github.com/rapidtest/netpulse-api/internal/repository/postgres"
	redisRepo "github.com/rapidtest/netpulse-api/internal/repository/redis"
	"github.com/rapidtest/netpulse-api/internal/security"
	"github.com/rapidtest/netpulse-api/internal/utils"
	"github.com/rs/zerolog/log"
)

type AuthHandler struct {
	usersRepo    *postgres.UsersRepo
	authRepo     *postgres.AuthRepo
	referralRepo *postgres.ReferralRepo
	auditRepo    *postgres.AuditRepo
	tokenSvc     *security.TokenService
	engCache     *redisRepo.EngagementCache
	cfg          *config.Config
}

func NewAuthHandler(
	usersRepo *postgres.UsersRepo,
	authRepo *postgres.AuthRepo,
	referralRepo *postgres.ReferralRepo,
	auditRepo *postgres.AuditRepo,
	tokenSvc *security.TokenService,
	engCache *redisRepo.EngagementCache,
	cfg *config.Config,
) *AuthHandler {
	return &AuthHandler{
		usersRepo:    usersRepo,
		authRepo:     authRepo,
		referralRepo: referralRepo,
		auditRepo:    auditRepo,
		tokenSvc:     tokenSvc,
		engCache:     engCache,
		cfg:          cfg,
	}
}

// Register handles POST /auth/register
func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var input auth.RegisterInput
	if err := utils.DecodeJSON(r, &input); err != nil {
		utils.JSONError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	ip := middleware.ExtractIP(r)
	input.Email = strings.TrimSpace(strings.ToLower(input.Email))
	input.Name = strings.TrimSpace(input.Name)

	// Validate input
	if err := auth.ValidateEmail(input.Email); err != nil {
		utils.JSONError(w, http.StatusBadRequest, err.Error())
		return
	}
	if err := auth.ValidateName(input.Name); err != nil {
		utils.JSONError(w, http.StatusBadRequest, err.Error())
		return
	}
	if err := auth.ValidatePassword(input.Password); err != nil {
		utils.JSONError(w, http.StatusBadRequest, err.Error())
		return
	}

	// Check if email already exists
	exists, _ := h.usersRepo.EmailExists(r.Context(), input.Email)
	if exists {
		utils.JSONError(w, http.StatusConflict, "email already registered")
		return
	}

	// Hash password
	passwordHash, err := security.HashPassword(input.Password)
	if err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to process password")
		return
	}

	// Generate referral code
	referralCode, _ := security.GenerateReferralCode()

	// Check referral
	var referredBy *string
	if input.ReferralCode != "" {
		// Check IP-based referral abuse
		abused, _ := h.engCache.CheckReferralIPLimit(r.Context(), ip, 5)
		if abused {
			utils.JSONError(w, http.StatusTooManyRequests, "too many referral registrations from this IP")
			return
		}

		referrerID, err := h.referralRepo.FindReferrerByCode(r.Context(), input.ReferralCode)
		if err == nil && referrerID != "" {
			referredBy = &referrerID
		}
	}

	// Create user
	now := time.Now().UTC()
	userID := utils.NewID()

	userObj := &users.User{
		ID: userID, Email: input.Email, Name: input.Name,
		PasswordHash: passwordHash, IsActive: true,
		ReferralCode: referralCode, ReferredBy: referredBy,
		CreatedAt: now, UpdatedAt: now,
	}

	err = h.usersRepo.Create(r.Context(), userObj)
	if err != nil {
		log.Error().Err(err).Msg("failed to create user")
		utils.JSONError(w, http.StatusInternalServerError, "failed to create account")
		return
	}

	// Assign default role (VIEWER)
	roleID := "role_viewer"
	h.usersRepo.SetRole(r.Context(), userID, roleID)

	// Record referral if applicable
	if referredBy != nil {
		h.referralRepo.RecordReferral(r.Context(), *referredBy, userID, ip)
	}

	// Generate email verification token
	verifyToken, _ := security.GenerateSecureToken(32)
	h.authRepo.StoreEmailVerificationToken(r.Context(), userID, verifyToken, now.Add(24*time.Hour))

	// Log audit
	h.auditRepo.Log(r.Context(), userID, "user.register", "user", userID, "new registration: "+input.Email, ip)

	// In production, send email. For dev, return token in response.
	log.Info().Str("user_id", userID).Str("verify_token", verifyToken).Msg("email verification token generated")

	utils.JSONResponse(w, http.StatusCreated, map[string]interface{}{
		"message":       "account created, please verify your email",
		"user_id":       userID,
		"referral_code": referralCode,
		"verify_token":  verifyToken, // Remove in production — send via email
	})
}

// VerifyEmail handles POST /auth/verify-email
func (h *AuthHandler) VerifyEmail(w http.ResponseWriter, r *http.Request) {
	var input auth.VerifyEmailInput
	if err := utils.DecodeJSON(r, &input); err != nil || input.Token == "" {
		utils.JSONError(w, http.StatusBadRequest, "token is required")
		return
	}

	ip := middleware.ExtractIP(r)

	userID, err := h.authRepo.VerifyEmailToken(r.Context(), input.Token)
	if err != nil {
		utils.JSONError(w, http.StatusBadRequest, "invalid or expired verification token")
		return
	}

	// Mark referral as verified
	h.referralRepo.MarkVerified(r.Context(), userID)

	// Log audit
	h.auditRepo.Log(r.Context(), userID, "user.email_verified", "user", userID, "", ip)

	utils.JSONResponse(w, http.StatusOK, map[string]string{
		"message": "email verified successfully",
	})
}

// ResendVerification handles POST /auth/resend-verification
func (h *AuthHandler) ResendVerification(w http.ResponseWriter, r *http.Request) {
	var input auth.ResendVerificationInput
	if err := utils.DecodeJSON(r, &input); err != nil || input.Email == "" {
		utils.JSONError(w, http.StatusBadRequest, "email is required")
		return
	}

	input.Email = strings.TrimSpace(strings.ToLower(input.Email))

	user, err := h.usersRepo.FindByEmail(r.Context(), input.Email)
	if err != nil {
		// Don't reveal if email exists
		utils.JSONResponse(w, http.StatusOK, map[string]string{
			"message": "if the email exists, a verification link has been sent",
		})
		return
	}

	if user.IsEmailVerified() {
		utils.JSONResponse(w, http.StatusOK, map[string]string{
			"message": "email is already verified",
		})
		return
	}

	verifyToken, _ := security.GenerateSecureToken(32)
	h.authRepo.StoreEmailVerificationToken(r.Context(), user.ID, verifyToken, time.Now().Add(24*time.Hour))

	log.Info().Str("user_id", user.ID).Str("verify_token", verifyToken).Msg("resend verification token")

	utils.JSONResponse(w, http.StatusOK, map[string]interface{}{
		"message":      "verification link sent",
		"verify_token": verifyToken, // Remove in production
	})
}

// Login handles POST /auth/login
func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := utils.DecodeJSON(r, &input); err != nil {
		utils.JSONError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	ip := middleware.ExtractIP(r)
	input.Email = strings.TrimSpace(strings.ToLower(input.Email))

	user, err := h.usersRepo.FindByEmail(r.Context(), input.Email)
	if err != nil {
		h.auditRepo.Log(r.Context(), "", "auth.login_failed", "auth", "", "email not found: "+input.Email, ip)
		utils.JSONError(w, http.StatusUnauthorized, "invalid credentials")
		return
	}

	if !user.IsActive || user.DisabledAt != nil {
		h.auditRepo.Log(r.Context(), user.ID, "auth.login_failed", "auth", user.ID, "account disabled", ip)
		utils.JSONError(w, http.StatusForbidden, "account is disabled")
		return
	}

	if !security.CheckPassword(input.Password, user.PasswordHash) {
		h.auditRepo.Log(r.Context(), user.ID, "auth.login_failed", "auth", user.ID, "wrong password", ip)
		utils.JSONError(w, http.StatusUnauthorized, "invalid credentials")
		return
	}

	role := user.PrimaryRole()

	// Generate token family for rotation tracking
	familyID := utils.NewID()

	accessToken, err := h.tokenSvc.GenerateAccessToken(user.ID, role)
	if err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to generate token")
		return
	}

	refreshToken, err := h.tokenSvc.GenerateRefreshToken(user.ID, role)
	if err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to generate token")
		return
	}

	// Store refresh token hash in DB
	expiresAt := time.Now().Add(h.tokenSvc.RefreshExpiry())
	ua := r.UserAgent()
	h.authRepo.StoreRefreshToken(r.Context(), user.ID, refreshToken, familyID, ip, ua, expiresAt)

	// Create session
	h.authRepo.CreateSession(r.Context(), user.ID, familyID, ip, ua)

	// Audit log
	h.auditRepo.Log(r.Context(), user.ID, "auth.login", "auth", user.ID, "", ip)

	utils.JSONResponse(w, http.StatusOK, auth.AuthResponse{
		User: auth.UserInfo{
			ID:              user.ID,
			Email:           user.Email,
			Name:            user.Name,
			Avatar:          user.Avatar,
			EmailVerifiedAt: user.EmailVerifiedAt,
			Role:            role,
			ReferralCode:    user.ReferralCode,
			AuthProvider:    user.AuthProvider,
		},
		Tokens: auth.TokenPair{
			AccessToken:  accessToken,
			RefreshToken: refreshToken,
			ExpiresIn:    int64(h.tokenSvc.AccessExpiry().Seconds()),
		},
	})
}

// Refresh handles POST /auth/refresh with token rotation.
func (h *AuthHandler) Refresh(w http.ResponseWriter, r *http.Request) {
	var body struct {
		RefreshToken string `json:"refresh_token"`
	}
	if err := utils.DecodeJSON(r, &body); err != nil || body.RefreshToken == "" {
		utils.JSONError(w, http.StatusBadRequest, "refresh_token is required")
		return
	}

	ip := middleware.ExtractIP(r)

	// Validate the refresh token JWT
	claims, err := h.tokenSvc.ValidateRefreshToken(body.RefreshToken)
	if err != nil {
		utils.JSONError(w, http.StatusUnauthorized, "invalid refresh token")
		return
	}

	// Check if token exists in DB and is not revoked
	storedToken, err := h.authRepo.ValidateRefreshToken(r.Context(), body.RefreshToken)
	if err != nil {
		// Token reuse detected — revoke entire family
		log.Warn().Str("user_id", claims.UserID).Msg("refresh token reuse detected, revoking family")
		// We can't get familyID here since the token isn't in DB anymore
		// Revoke all user tokens as a safety measure
		h.authRepo.RevokeAllUserTokens(r.Context(), claims.UserID)
		h.auditRepo.Log(r.Context(), claims.UserID, "auth.token_reuse_detected", "auth", claims.UserID, "", ip)
		utils.JSONError(w, http.StatusUnauthorized, "token has been revoked")
		return
	}

	// Revoke the old refresh token
	h.authRepo.RevokeRefreshToken(r.Context(), storedToken.RefreshTokenHash)

	// Generate new token pair
	accessToken, err := h.tokenSvc.GenerateAccessToken(claims.UserID, claims.Role)
	if err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to generate token")
		return
	}

	newRefresh, err := h.tokenSvc.GenerateRefreshToken(claims.UserID, claims.Role)
	if err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to generate token")
		return
	}

	// Store new refresh token with same family
	expiresAt := time.Now().Add(h.tokenSvc.RefreshExpiry())
	h.authRepo.StoreRefreshToken(r.Context(), claims.UserID, newRefresh, storedToken.FamilyID, ip, r.UserAgent(), expiresAt)

	// Update session activity
	h.authRepo.UpdateSessionActivity(r.Context(), storedToken.FamilyID)

	utils.JSONResponse(w, http.StatusOK, auth.TokenPair{
		AccessToken:  accessToken,
		RefreshToken: newRefresh,
		ExpiresIn:    int64(h.tokenSvc.AccessExpiry().Seconds()),
	})
}

// Logout handles POST /auth/logout
func (h *AuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
	var body struct {
		RefreshToken string `json:"refresh_token"`
	}
	if err := utils.DecodeJSON(r, &body); err == nil && body.RefreshToken != "" {
		// Revoke the refresh token
		storedToken, err := h.authRepo.ValidateRefreshToken(r.Context(), body.RefreshToken)
		if err == nil {
			h.authRepo.RevokeRefreshToken(r.Context(), storedToken.RefreshTokenHash)
		}
	}

	userID := middleware.GetUserID(r)
	if userID != "" {
		ip := middleware.ExtractIP(r)
		h.auditRepo.Log(r.Context(), userID, "auth.logout", "auth", userID, "", ip)
	}

	utils.JSONResponse(w, http.StatusOK, map[string]string{"message": "logged out"})
}

// GetSessions handles GET /auth/sessions
func (h *AuthHandler) GetSessions(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)
	if userID == "" {
		utils.JSONError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	sessions, err := h.authRepo.GetUserSessions(r.Context(), userID)
	if err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to get sessions")
		return
	}

	utils.JSONResponse(w, http.StatusOK, map[string]interface{}{"sessions": sessions})
}

// RevokeSession handles DELETE /auth/sessions/{id}
func (h *AuthHandler) RevokeSession(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)
	if userID == "" {
		utils.JSONError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	sessionID := chi.URLParam(r, "id")
	if sessionID == "" {
		utils.JSONError(w, http.StatusBadRequest, "session ID required")
		return
	}

	h.authRepo.RevokeSession(r.Context(), sessionID, userID)
	utils.JSONResponse(w, http.StatusOK, map[string]string{"message": "session revoked"})
}


