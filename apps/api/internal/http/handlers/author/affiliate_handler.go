package author

import (
	"net/http"

	"github.com/rapidtest/netpulse-api/internal/domain/affiliate"
	"github.com/rapidtest/netpulse-api/internal/http/middleware"
	"github.com/rapidtest/netpulse-api/internal/repository/postgres"
	"github.com/rapidtest/netpulse-api/internal/security"
	"github.com/rapidtest/netpulse-api/internal/utils"
)

// AffiliateHandler handles user-facing affiliate operations.
type AffiliateHandler struct {
	affiliateRepo *postgres.AffiliateRepo
	referralRepo  *postgres.ReferralRepo
	auditRepo     *postgres.AuditRepo
	encryptionKey []byte
}

func NewAffiliateHandler(aRepo *postgres.AffiliateRepo, rRepo *postgres.ReferralRepo, auditRepo *postgres.AuditRepo, encKey []byte) *AffiliateHandler {
	return &AffiliateHandler{
		affiliateRepo: aRepo,
		referralRepo:  rRepo,
		auditRepo:     auditRepo,
		encryptionKey: encKey,
	}
}

// ──────────────────────────────────────────────────────────
// GET /user/affiliate/me – comprehensive profile endpoint
// ──────────────────────────────────────────────────────────

func (h *AffiliateHandler) GetProfile(w http.ResponseWriter, r *http.Request) {
	userID, _ := r.Context().Value(middleware.CtxUserID).(string)

	profile, err := h.affiliateRepo.GetProfileByUserID(r.Context(), userID)
	if err != nil {
		utils.JSONResponse(w, http.StatusOK, map[string]interface{}{
			"enrolled": false,
			"profile":  nil,
		})
		return
	}

	// Decrypt payout info and build masked versions for the user
	if profile.PayoutNameEncrypted != "" {
		if dec, err := security.Decrypt(profile.PayoutNameEncrypted, h.encryptionKey); err == nil {
			profile.PayoutNameMasked = affiliate.MaskString(dec)
		}
	}
	if profile.PayoutNumberEncrypted != "" {
		if dec, err := security.Decrypt(profile.PayoutNumberEncrypted, h.encryptionKey); err == nil {
			profile.PayoutNumberMasked = affiliate.MaskString(dec)
		}
	}
	// Never send raw decrypted to the user – only masked
	profile.PayoutName = ""
	profile.PayoutNumber = ""

	utils.JSONResponse(w, http.StatusOK, map[string]interface{}{
		"enrolled": true,
		"profile":  profile,
	})
}

// ──────────────────────────────────────────────────────────
// POST /user/affiliate/enroll
// ──────────────────────────────────────────────────────────

func (h *AffiliateHandler) Enroll(w http.ResponseWriter, r *http.Request) {
	userID, _ := r.Context().Value(middleware.CtxUserID).(string)

	// Check if already enrolled
	existing, _ := h.affiliateRepo.GetProfileByUserID(r.Context(), userID)
	if existing != nil {
		utils.JSONError(w, http.StatusConflict, "already enrolled in affiliate program")
		return
	}

	// Check if affiliate program is enabled
	settings, err := h.affiliateRepo.GetSettings(r.Context())
	if err != nil || !settings.Enabled {
		utils.JSONError(w, http.StatusBadRequest, "affiliate program is not currently available")
		return
	}

	var input affiliate.EnrollInput
	if err := utils.DecodeJSON(r, &input); err != nil {
		utils.JSONError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if msg := input.Validate(); msg != "" {
		utils.JSONError(w, http.StatusBadRequest, msg)
		return
	}

	// Encrypt payout info
	nameEnc, err := security.Encrypt(input.AccountName, h.encryptionKey)
	if err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "encryption error")
		return
	}
	numEnc, err := security.Encrypt(input.AccountNumber, h.encryptionKey)
	if err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "encryption error")
		return
	}

	profile := &affiliate.AffiliateProfile{
		UserID:                userID,
		Status:                "PENDING",
		PayoutMethod:          input.PayoutMethod,
		ProviderName:          input.ProviderName,
		PayoutNameEncrypted:   nameEnc,
		PayoutNumberEncrypted: numEnc,
	}

	if err := h.affiliateRepo.CreateProfile(r.Context(), profile); err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to enroll: "+err.Error())
		return
	}

	h.auditRepo.Log(r.Context(), userID, "enroll", "affiliate", userID, "User enrolled in affiliate program", r.RemoteAddr)
	utils.JSONResponse(w, http.StatusCreated, map[string]string{"message": "enrolled successfully, pending approval"})
}

// ──────────────────────────────────────────────────────────
// GET /user/affiliate/stats
// ──────────────────────────────────────────────────────────

func (h *AffiliateHandler) GetStats(w http.ResponseWriter, r *http.Request) {
	userID, _ := r.Context().Value(middleware.CtxUserID).(string)

	stats, err := h.affiliateRepo.GetUserStats(r.Context(), userID)
	if err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to get stats")
		return
	}

	utils.JSONResponse(w, http.StatusOK, stats)
}

// ──────────────────────────────────────────────────────────
// GET /user/affiliate/settings – public program info
// ──────────────────────────────────────────────────────────

func (h *AffiliateHandler) GetSettings(w http.ResponseWriter, r *http.Request) {
	settings, err := h.affiliateRepo.GetSettings(r.Context())
	if err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to get settings")
		return
	}

	// Only return public info
	utils.JSONResponse(w, http.StatusOK, map[string]interface{}{
		"enabled":            settings.Enabled,
		"commission_type":    settings.CommissionType,
		"commission_value":   settings.CommissionValue,
		"payout_minimum":     settings.PayoutMinimum,
		"payout_schedule":    settings.PayoutSchedule,
		"referral_hold_days": settings.ReferralHoldDays,
		"cookie_days":        settings.CookieDays,
		"how_it_works_md":    settings.HowItWorksMD,
		"terms_md":           settings.TermsMD,
		"payout_rules_md":    settings.PayoutRulesMD,
		"terms_text":         settings.TermsText,
	})
}

// ──────────────────────────────────────────────────────────
// POST /user/affiliate/payout-request
// ──────────────────────────────────────────────────────────

func (h *AffiliateHandler) RequestPayout(w http.ResponseWriter, r *http.Request) {
	userID, _ := r.Context().Value(middleware.CtxUserID).(string)

	profile, err := h.affiliateRepo.GetProfileByUserID(r.Context(), userID)
	if err != nil {
		utils.JSONError(w, http.StatusBadRequest, "not enrolled in affiliate program")
		return
	}
	if profile.Status != "APPROVED" {
		utils.JSONError(w, http.StatusBadRequest, "affiliate profile must be approved")
		return
	}
	if profile.IsBlocked {
		utils.JSONError(w, http.StatusForbidden, "your affiliate account is blocked")
		return
	}

	settings, err := h.affiliateRepo.GetSettings(r.Context())
	if err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to check settings")
		return
	}

	var input affiliate.PayoutRequestInput
	if err := utils.DecodeJSON(r, &input); err != nil {
		utils.JSONError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if input.Amount <= 0 {
		utils.JSONError(w, http.StatusBadRequest, "amount must be greater than zero")
		return
	}
	if input.Amount > profile.AvailableBalance {
		utils.JSONError(w, http.StatusBadRequest, "amount exceeds available balance")
		return
	}
	if profile.AvailableBalance < settings.PayoutMinimum {
		utils.JSONError(w, http.StatusBadRequest, "minimum payout amount not reached")
		return
	}

	// Check if user already has an active (non-terminal) payout request
	hasActive, _ := h.affiliateRepo.HasActivePayout(r.Context(), userID)
	if hasActive {
		utils.JSONError(w, http.StatusConflict, "you already have a pending payout request")
		return
	}

	pr := &affiliate.PayoutRequest{
		UserID:      userID,
		AffiliateID: profile.ID,
		Amount:      input.Amount,
		Note:        input.Note,
	}

	if err := h.affiliateRepo.CreatePayoutRequest(r.Context(), pr); err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to create payout request")
		return
	}

	h.auditRepo.Log(r.Context(), userID, "payout_request", "affiliate", profile.ID, "Payout request submitted", r.RemoteAddr)
	utils.JSONResponse(w, http.StatusCreated, map[string]string{"message": "payout request submitted"})
}

// ──────────────────────────────────────────────────────────
// GET /user/affiliate/payouts – payout history
// ──────────────────────────────────────────────────────────

func (h *AffiliateHandler) ListPayouts(w http.ResponseWriter, r *http.Request) {
	userID, _ := r.Context().Value(middleware.CtxUserID).(string)

	page := utils.QueryInt(r, "page", 1)
	limit := utils.QueryInt(r, "limit", 20)

	payouts, total, err := h.affiliateRepo.ListPayoutsByUser(r.Context(), userID, page, limit)
	if err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to list payouts")
		return
	}

	if payouts == nil {
		payouts = []affiliate.PayoutRequest{}
	}

	utils.JSONResponse(w, http.StatusOK, map[string]interface{}{
		"items":       payouts,
		"total":       total,
		"page":        page,
		"limit":       limit,
		"total_pages": totalPages(total, limit),
	})
}

// ──────────────────────────────────────────────────────────
// GET /user/affiliate/commissions – earnings history
// ──────────────────────────────────────────────────────────

func (h *AffiliateHandler) ListCommissions(w http.ResponseWriter, r *http.Request) {
	userID, _ := r.Context().Value(middleware.CtxUserID).(string)

	profile, err := h.affiliateRepo.GetProfileByUserID(r.Context(), userID)
	if err != nil {
		utils.JSONError(w, http.StatusBadRequest, "not enrolled in affiliate program")
		return
	}

	page := utils.QueryInt(r, "page", 1)
	limit := utils.QueryInt(r, "limit", 20)

	commissions, total, err := h.affiliateRepo.ListCommissions(r.Context(), profile.ID, page, limit)
	if err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to list commissions")
		return
	}

	if commissions == nil {
		commissions = []affiliate.Commission{}
	}

	utils.JSONResponse(w, http.StatusOK, map[string]interface{}{
		"items":       commissions,
		"total":       total,
		"page":        page,
		"limit":       limit,
		"total_pages": totalPages(total, limit),
	})
}

// ──────────────────────────────────────────────────────────
// PATCH /user/affiliate/payout-info – update payout method
// ──────────────────────────────────────────────────────────

func (h *AffiliateHandler) UpdatePayout(w http.ResponseWriter, r *http.Request) {
	userID, _ := r.Context().Value(middleware.CtxUserID).(string)

	var input affiliate.EnrollInput
	if err := utils.DecodeJSON(r, &input); err != nil {
		utils.JSONError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if msg := input.Validate(); msg != "" {
		utils.JSONError(w, http.StatusBadRequest, msg)
		return
	}

	nameEnc, err := security.Encrypt(input.AccountName, h.encryptionKey)
	if err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "encryption error")
		return
	}
	numEnc, err := security.Encrypt(input.AccountNumber, h.encryptionKey)
	if err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "encryption error")
		return
	}

	if err := h.affiliateRepo.UpdateProfilePayout(r.Context(), userID, input.PayoutMethod, input.ProviderName, nameEnc, numEnc); err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to update payout info")
		return
	}

	h.auditRepo.Log(r.Context(), userID, "update_payout_info", "affiliate", userID, "Updated payout info", r.RemoteAddr)
	utils.JSONResponse(w, http.StatusOK, map[string]string{"message": "payout info updated"})
}

func totalPages(total, limit int) int {
	if limit <= 0 {
		return 0
	}
	return (total + limit - 1) / limit
}
