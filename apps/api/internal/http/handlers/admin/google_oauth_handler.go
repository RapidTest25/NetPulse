package admin

import (
	"context"
	"encoding/json"
	"io"
	"net/http"
	"time"

	"github.com/rs/zerolog/log"

	"github.com/rapidtest/netpulse-api/internal/config"
	"github.com/rapidtest/netpulse-api/internal/domain/auth"
	"github.com/rapidtest/netpulse-api/internal/domain/users"
	"github.com/rapidtest/netpulse-api/internal/http/middleware"
	"github.com/rapidtest/netpulse-api/internal/repository/postgres"
	"github.com/rapidtest/netpulse-api/internal/security"
	"github.com/rapidtest/netpulse-api/internal/utils"
)

// GoogleOAuthHandler handles Google OAuth2 login/register.
type GoogleOAuthHandler struct {
	usersRepo    *postgres.UsersRepo
	authRepo     *postgres.AuthRepo
	referralRepo *postgres.ReferralRepo
	auditRepo    *postgres.AuditRepo
	tokenSvc     *security.TokenService
	cfg          *config.Config
}

func NewGoogleOAuthHandler(
	usersRepo *postgres.UsersRepo,
	authRepo *postgres.AuthRepo,
	referralRepo *postgres.ReferralRepo,
	auditRepo *postgres.AuditRepo,
	tokenSvc *security.TokenService,
	cfg *config.Config,
) *GoogleOAuthHandler {
	return &GoogleOAuthHandler{
		usersRepo:    usersRepo,
		authRepo:     authRepo,
		referralRepo: referralRepo,
		auditRepo:    auditRepo,
		tokenSvc:     tokenSvc,
		cfg:          cfg,
	}
}

// GoogleTokenRequest is the request body for POST /auth/google.
type GoogleTokenRequest struct {
	AccessToken  string `json:"access_token"`
	ReferralCode string `json:"referral_code,omitempty"`
}

// GoogleUserInfo represents the user info from Google's API.
type GoogleUserInfo struct {
	Sub           string `json:"sub"`
	Email         string `json:"email"`
	EmailVerified bool   `json:"email_verified"`
	Name          string `json:"name"`
	Picture       string `json:"picture"`
	GivenName     string `json:"given_name"`
	FamilyName    string `json:"family_name"`
}

// HandleGoogleLogin handles POST /auth/google.
// Accepts a Google access_token, validates with Google userinfo API,
// then logs in an existing user or creates a new one.
func (h *GoogleOAuthHandler) HandleGoogleLogin(w http.ResponseWriter, r *http.Request) {
	var req GoogleTokenRequest
	if err := utils.DecodeJSON(r, &req); err != nil {
		utils.JSONError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.AccessToken == "" {
		utils.JSONError(w, http.StatusBadRequest, "access_token is required")
		return
	}

	ip := middleware.ExtractIP(r)

	// Verify the access token with Google's userinfo endpoint
	googleUser, err := verifyGoogleAccessToken(req.AccessToken)
	if err != nil {
		log.Warn().Err(err).Msg("Google token verification failed")
		utils.JSONError(w, http.StatusUnauthorized, "invalid Google token")
		return
	}

	if googleUser.Email == "" || googleUser.Sub == "" {
		utils.JSONError(w, http.StatusUnauthorized, "could not retrieve Google user info")
		return
	}

	// Try to find existing user by Google sub
	user, err := h.usersRepo.FindByGoogleSub(r.Context(), googleUser.Sub)
	if err != nil {
		// Not found by Google sub, try by email
		user, err = h.usersRepo.FindByEmail(r.Context(), googleUser.Email)
		if err != nil {
			// New user — register with Google
			user, err = h.createGoogleUser(r.Context(), googleUser, req.ReferralCode, ip)
			if err != nil {
				log.Error().Err(err).Msg("Failed to create Google OAuth user")
				utils.JSONError(w, http.StatusInternalServerError, "failed to create account")
				return
			}
			h.auditRepo.Log(r.Context(), user.ID, "auth.google_register", "auth", user.ID, "new user via Google OAuth", ip)
		} else {
			// Existing user found by email — link Google account
			if err := h.usersRepo.LinkGoogleAccount(r.Context(), user.ID, googleUser.Sub, googleUser.Picture); err != nil {
				log.Error().Err(err).Msg("Failed to link Google account")
			}
			user.AuthProvider = "google"
			user.GoogleSub = &googleUser.Sub
			if user.Avatar == "" {
				user.Avatar = googleUser.Picture
			}
			h.auditRepo.Log(r.Context(), user.ID, "auth.google_link", "auth", user.ID, "linked Google account", ip)
		}
	}

	// Check if account is disabled
	if !user.IsActive || user.DisabledAt != nil {
		h.auditRepo.Log(r.Context(), user.ID, "auth.google_login_failed", "auth", user.ID, "account disabled", ip)
		utils.JSONError(w, http.StatusForbidden, "account is disabled")
		return
	}

	// Generate tokens
	role := user.PrimaryRole()
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

	// Store refresh token
	expiresAt := time.Now().Add(h.tokenSvc.RefreshExpiry())
	ua := r.UserAgent()
	h.authRepo.StoreRefreshToken(r.Context(), user.ID, refreshToken, familyID, ip, ua, expiresAt)
	h.authRepo.CreateSession(r.Context(), user.ID, familyID, ip, ua)

	h.auditRepo.Log(r.Context(), user.ID, "auth.google_login", "auth", user.ID, "", ip)

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

// verifyGoogleAccessToken validates a Google access token using the userinfo endpoint.
func verifyGoogleAccessToken(accessToken string) (*GoogleUserInfo, error) {
	resp, err := http.Get("https://www.googleapis.com/oauth2/v3/userinfo?access_token=" + accessToken)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode != http.StatusOK {
		return nil, &googleAPIError{Status: resp.StatusCode, Body: string(body)}
	}

	var userInfo GoogleUserInfo
	if err := json.Unmarshal(body, &userInfo); err != nil {
		return nil, err
	}

	return &userInfo, nil
}

type googleAPIError struct {
	Status int
	Body   string
}

func (e *googleAPIError) Error() string {
	return "Google API error: " + e.Body
}

// createGoogleUser creates a new user from Google OAuth info.
func (h *GoogleOAuthHandler) createGoogleUser(ctx context.Context, g *GoogleUserInfo, referralCode, ip string) (*users.User, error) {
	now := time.Now()
	userID := utils.NewID()

	// Generate referral code for new user
	refCode, err := security.GenerateReferralCode()
	if err != nil {
		refCode = userID[:8]
	}

	var referredBy *string
	if referralCode != "" {
		referrerID, err := h.referralRepo.FindReferrerByCode(ctx, referralCode)
		if err == nil && referrerID != "" {
			referredBy = &referrerID
		}
	}

	user := &users.User{
		ID:              userID,
		Email:           g.Email,
		Name:            g.Name,
		PasswordHash:    "",
		Avatar:          g.Picture,
		IsActive:        true,
		EmailVerifiedAt: &now,
		ReferralCode:    refCode,
		ReferredBy:      referredBy,
		AuthProvider:    "google",
		GoogleSub:       &g.Sub,
		CreatedAt:       now,
		UpdatedAt:       now,
	}

	if err := h.usersRepo.Create(ctx, user); err != nil {
		return nil, err
	}

	// Assign AUTHOR role (default for Google OAuth users)
	h.usersRepo.SetRole(ctx, userID, "role_author")

	// Record referral if applicable
	if referredBy != nil {
		h.referralRepo.RecordReferral(ctx, *referredBy, userID, ip)
	}

	// Set roles for response
	user.Roles = []users.Role{{ID: "role_author", Name: "AUTHOR"}}

	return user, nil
}
