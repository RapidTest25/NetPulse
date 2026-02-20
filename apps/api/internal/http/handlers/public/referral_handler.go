package public

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/rapidtest/netpulse-api/internal/repository/postgres"
	"github.com/rapidtest/netpulse-api/internal/utils"
)

// ReferralHandler handles the public referral redirect endpoint.
type ReferralHandler struct {
	referralRepo  *postgres.ReferralRepo
	affiliateRepo *postgres.AffiliateRepo
	frontendURL   string
}

func NewReferralHandler(rRepo *postgres.ReferralRepo, aRepo *postgres.AffiliateRepo, frontendURL string) *ReferralHandler {
	return &ReferralHandler{
		referralRepo:  rRepo,
		affiliateRepo: aRepo,
		frontendURL:   frontendURL,
	}
}

// HandleReferralRedirect validates the referral code and returns info for the frontend
// to set a cookie + redirect. GET /ref/{code}
func (h *ReferralHandler) HandleReferralRedirect(w http.ResponseWriter, r *http.Request) {
	code := chi.URLParam(r, "code")
	if code == "" {
		utils.JSONError(w, http.StatusBadRequest, "referral code is required")
		return
	}

	// Check code exists and maps to a real user
	referrerID, err := h.referralRepo.FindReferrerByCode(r.Context(), code)
	if err != nil || referrerID == "" {
		utils.JSONError(w, http.StatusNotFound, "invalid referral code")
		return
	}

	// Fetch settings for cookie_days
	settings, err := h.affiliateRepo.GetSettings(r.Context())
	if err != nil || !settings.Enabled {
		utils.JSONError(w, http.StatusBadRequest, "affiliate program is not currently available")
		return
	}

	// Return the code + redirect URL for the frontend to handle
	utils.JSONResponse(w, http.StatusOK, map[string]interface{}{
		"valid":       true,
		"code":        code,
		"cookie_days": settings.CookieDays,
		"redirect_to": h.frontendURL + "/auth/register?ref=" + code,
	})
}
