package admin

import (
	"net/http"

	"github.com/rapidtest/netpulse-api/internal/repository/postgres"
	"github.com/rapidtest/netpulse-api/internal/utils"
)

type ReferralHandler struct {
	referralRepo *postgres.ReferralRepo
}

func NewReferralHandler(referralRepo *postgres.ReferralRepo) *ReferralHandler {
	return &ReferralHandler{referralRepo: referralRepo}
}

// Stats handles GET /admin/referrals/stats
func (h *ReferralHandler) Stats(w http.ResponseWriter, r *http.Request) {
	stats, err := h.referralRepo.GetStats(r.Context())
	if err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to load referral stats")
		return
	}
	utils.JSONResponse(w, http.StatusOK, stats)
}
