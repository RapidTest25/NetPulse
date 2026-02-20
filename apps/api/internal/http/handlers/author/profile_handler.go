package author

import (
	"crypto/rand"
	"encoding/hex"
	"net/http"
	"time"

	"github.com/rapidtest/netpulse-api/internal/http/middleware"
	"github.com/rapidtest/netpulse-api/internal/repository/postgres"
	"github.com/rapidtest/netpulse-api/internal/security"
	"github.com/rapidtest/netpulse-api/internal/utils"
	"github.com/rs/zerolog/log"
)

// ProfileHandler handles user profile operations.
type ProfileHandler struct {
	usersRepo *postgres.UsersRepo
	authRepo  *postgres.AuthRepo
	auditRepo *postgres.AuditRepo
}

func NewProfileHandler(usersRepo *postgres.UsersRepo, authRepo *postgres.AuthRepo, auditRepo *postgres.AuditRepo) *ProfileHandler {
	return &ProfileHandler{usersRepo: usersRepo, authRepo: authRepo, auditRepo: auditRepo}
}

// GetMe returns the current user's profile.
func (h *ProfileHandler) GetMe(w http.ResponseWriter, r *http.Request) {
	userID, _ := r.Context().Value(middleware.CtxUserID).(string)
	if userID == "" {
		utils.JSONError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	user, err := h.usersRepo.FindByID(r.Context(), userID)
	if err != nil {
		utils.JSONError(w, http.StatusNotFound, "user not found")
		return
	}

	utils.JSONResponse(w, http.StatusOK, user)
}

// UpdateMe updates the current user's profile.
func (h *ProfileHandler) UpdateMe(w http.ResponseWriter, r *http.Request) {
	userID, _ := r.Context().Value(middleware.CtxUserID).(string)
	if userID == "" {
		utils.JSONError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	var input struct {
		Name            *string `json:"name,omitempty"`
		Bio             *string `json:"bio,omitempty"`
		Avatar          *string `json:"avatar,omitempty"`
		Website         *string `json:"website,omitempty"`
		Location        *string `json:"location,omitempty"`
		SocialTwitter   *string `json:"social_twitter,omitempty"`
		SocialGithub    *string `json:"social_github,omitempty"`
		SocialLinkedin  *string `json:"social_linkedin,omitempty"`
		SocialFacebook  *string `json:"social_facebook,omitempty"`
		SocialInstagram *string `json:"social_instagram,omitempty"`
		SocialYoutube   *string `json:"social_youtube,omitempty"`
	}
	if err := utils.DecodeJSON(r, &input); err != nil {
		utils.JSONError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	user, err := h.usersRepo.FindByID(r.Context(), userID)
	if err != nil {
		utils.JSONError(w, http.StatusNotFound, "user not found")
		return
	}

	if input.Name != nil {
		user.Name = *input.Name
	}
	if input.Bio != nil {
		user.Bio = *input.Bio
	}
	if input.Avatar != nil {
		user.Avatar = *input.Avatar
	}
	if input.Website != nil {
		user.Website = *input.Website
	}
	if input.Location != nil {
		user.Location = *input.Location
	}
	if input.SocialTwitter != nil {
		user.SocialTwitter = *input.SocialTwitter
	}
	if input.SocialGithub != nil {
		user.SocialGithub = *input.SocialGithub
	}
	if input.SocialLinkedin != nil {
		user.SocialLinkedin = *input.SocialLinkedin
	}
	if input.SocialFacebook != nil {
		user.SocialFacebook = *input.SocialFacebook
	}
	if input.SocialInstagram != nil {
		user.SocialInstagram = *input.SocialInstagram
	}
	if input.SocialYoutube != nil {
		user.SocialYoutube = *input.SocialYoutube
	}

	if err := h.usersRepo.UpdateProfile(r.Context(), user); err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to update profile")
		return
	}

	h.auditRepo.Log(r.Context(), userID, "update_profile", "user", userID, "User updated profile", r.RemoteAddr)
	utils.JSONResponse(w, http.StatusOK, user)
}

// RequestEmailChange initiates an email change — generates a verification token
// that the user must confirm (simulating email delivery).
func (h *ProfileHandler) RequestEmailChange(w http.ResponseWriter, r *http.Request) {
	userID, _ := r.Context().Value(middleware.CtxUserID).(string)
	if userID == "" {
		utils.JSONError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	var input struct {
		NewEmail string `json:"new_email"`
		Password string `json:"password"`
	}
	if err := utils.DecodeJSON(r, &input); err != nil || input.NewEmail == "" || input.Password == "" {
		utils.JSONError(w, http.StatusBadRequest, "new_email and password are required")
		return
	}

	// Verify current password
	user, err := h.usersRepo.FindByID(r.Context(), userID)
	if err != nil {
		utils.JSONError(w, http.StatusNotFound, "user not found")
		return
	}

	// Verify password
	if !security.CheckPassword(input.Password, user.PasswordHash) {
		utils.JSONError(w, http.StatusForbidden, "password salah")
		return
	}

	// Check if new email is already in use
	exists, _ := h.usersRepo.EmailExists(r.Context(), input.NewEmail)
	if exists {
		utils.JSONError(w, http.StatusConflict, "email sudah digunakan oleh akun lain")
		return
	}

	// Generate verification token
	tokenBytes := make([]byte, 32)
	rand.Read(tokenBytes)
	token := hex.EncodeToString(tokenBytes)

	err = h.authRepo.StoreEmailChangeToken(r.Context(), userID, input.NewEmail, token, time.Now().Add(1*time.Hour))
	if err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "gagal membuat permintaan ganti email")
		return
	}

	log.Info().Str("user_id", userID).Str("token", token).Str("new_email", input.NewEmail).Msg("email change token generated")

	h.auditRepo.Log(r.Context(), userID, "request_email_change", "user", userID, "User requested email change", r.RemoteAddr)

	// In production, send the token via email to the OLD email.
	// For dev, return it in response.
	utils.JSONResponse(w, http.StatusOK, map[string]string{
		"message":      "Kode verifikasi telah dikirim ke email Anda saat ini",
		"verify_token": token, // Remove in production — send via email
	})
}

// ChangePassword allows an authenticated user to change their password.
func (h *ProfileHandler) ChangePassword(w http.ResponseWriter, r *http.Request) {
	userID, _ := r.Context().Value(middleware.CtxUserID).(string)
	if userID == "" {
		utils.JSONError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	var input struct {
		CurrentPassword string `json:"current_password"`
		NewPassword     string `json:"new_password"`
	}
	if err := utils.DecodeJSON(r, &input); err != nil || input.CurrentPassword == "" || input.NewPassword == "" {
		utils.JSONError(w, http.StatusBadRequest, "current_password and new_password are required")
		return
	}

	// Fetch user
	user, err := h.usersRepo.FindByID(r.Context(), userID)
	if err != nil {
		utils.JSONError(w, http.StatusNotFound, "user not found")
		return
	}

	// Verify current password
	if !security.CheckPassword(input.CurrentPassword, user.PasswordHash) {
		utils.JSONError(w, http.StatusForbidden, "password saat ini salah")
		return
	}

	// Validate new password strength
	if len(input.NewPassword) < 8 {
		utils.JSONError(w, http.StatusBadRequest, "password baru minimal 8 karakter")
		return
	}

	// Hash new password
	hash, err := security.HashPassword(input.NewPassword)
	if err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "gagal memproses password baru")
		return
	}

	// Update password in database
	if err := h.usersRepo.UpdatePassword(r.Context(), userID, hash); err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "gagal menyimpan password baru")
		return
	}

	h.auditRepo.Log(r.Context(), userID, "change_password", "user", userID, "User changed password", r.RemoteAddr)

	utils.JSONResponse(w, http.StatusOK, map[string]string{
		"message": "Password berhasil diubah",
	})
}

// ConfirmEmailChange verifies the token and updates the email.
func (h *ProfileHandler) ConfirmEmailChange(w http.ResponseWriter, r *http.Request) {
	userID, _ := r.Context().Value(middleware.CtxUserID).(string)
	if userID == "" {
		utils.JSONError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	var input struct {
		Token string `json:"token"`
	}
	if err := utils.DecodeJSON(r, &input); err != nil || input.Token == "" {
		utils.JSONError(w, http.StatusBadRequest, "token diperlukan")
		return
	}

	confirmedUserID, newEmail, err := h.authRepo.VerifyEmailChangeToken(r.Context(), input.Token)
	if err != nil {
		utils.JSONError(w, http.StatusBadRequest, "token tidak valid atau sudah kedaluwarsa")
		return
	}

	// Ensure the token belongs to the currently logged-in user
	if confirmedUserID != userID {
		utils.JSONError(w, http.StatusForbidden, "token tidak sesuai dengan akun Anda")
		return
	}

	// Double-check email is still available
	exists, _ := h.usersRepo.EmailExists(r.Context(), newEmail)
	if exists {
		utils.JSONError(w, http.StatusConflict, "email sudah digunakan oleh akun lain")
		return
	}

	// Update email
	if err := h.usersRepo.UpdateEmail(r.Context(), userID, newEmail); err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "gagal mengubah email")
		return
	}

	h.auditRepo.Log(r.Context(), userID, "confirm_email_change", "user", userID, "User changed email to "+newEmail, r.RemoteAddr)

	// Return updated user
	user, _ := h.usersRepo.FindByID(r.Context(), userID)
	utils.JSONResponse(w, http.StatusOK, user)
}