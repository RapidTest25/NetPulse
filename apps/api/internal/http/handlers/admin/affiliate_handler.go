package admin

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/rapidtest/netpulse-api/internal/domain/affiliate"
	"github.com/rapidtest/netpulse-api/internal/http/middleware"
	"github.com/rapidtest/netpulse-api/internal/repository/postgres"
	"github.com/rapidtest/netpulse-api/internal/security"
	"github.com/rapidtest/netpulse-api/internal/utils"
)

// AffiliateHandler handles admin affiliate management endpoints.
type AffiliateHandler struct {
	affiliateRepo *postgres.AffiliateRepo
	auditRepo     *postgres.AuditRepo
	encryptionKey []byte
}

func NewAffiliateHandler(aRepo *postgres.AffiliateRepo, auditRepo *postgres.AuditRepo, encKey []byte) *AffiliateHandler {
	return &AffiliateHandler{
		affiliateRepo: aRepo,
		auditRepo:     auditRepo,
		encryptionKey: encKey,
	}
}

// ──────────────────────────────────────────────────────────
// Settings
// ──────────────────────────────────────────────────────────

func (h *AffiliateHandler) GetSettings(w http.ResponseWriter, r *http.Request) {
	settings, err := h.affiliateRepo.GetSettings(r.Context())
	if err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to get settings")
		return
	}
	utils.JSONResponse(w, http.StatusOK, settings)
}

func (h *AffiliateHandler) UpdateSettings(w http.ResponseWriter, r *http.Request) {
	userID, _ := r.Context().Value(middleware.CtxUserID).(string)

	var input affiliate.UpdateSettingsInput
	if err := utils.DecodeJSON(r, &input); err != nil {
		utils.JSONError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if err := h.affiliateRepo.UpdateSettings(r.Context(), input); err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to update settings")
		return
	}

	h.auditRepo.Log(r.Context(), userID, "update", "affiliate_settings", "1", "Updated affiliate settings", r.RemoteAddr)
	utils.JSONResponse(w, http.StatusOK, map[string]string{"message": "settings updated"})
}

// ──────────────────────────────────────────────────────────
// Stats & Affiliates listing
// ──────────────────────────────────────────────────────────

func (h *AffiliateHandler) GetStats(w http.ResponseWriter, r *http.Request) {
	stats, err := h.affiliateRepo.GetAdminStats(r.Context())
	if err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to get stats")
		return
	}
	utils.JSONResponse(w, http.StatusOK, stats)
}

func (h *AffiliateHandler) ListAffiliates(w http.ResponseWriter, r *http.Request) {
	filter := affiliate.AffiliateListFilter{
		Status: utils.QueryString(r, "status", ""),
		Search: utils.QueryString(r, "search", ""),
		Page:   utils.QueryInt(r, "page", 1),
		Limit:  utils.QueryInt(r, "limit", 20),
	}

	profiles, total, err := h.affiliateRepo.ListProfiles(r.Context(), filter)
	if err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to list affiliates")
		return
	}

	if profiles == nil {
		profiles = []affiliate.AffiliateProfile{}
	}

	// Decrypt payout info for admin view
	for i := range profiles {
		if profiles[i].PayoutNameEncrypted != "" {
			if dec, err := security.Decrypt(profiles[i].PayoutNameEncrypted, h.encryptionKey); err == nil {
				profiles[i].PayoutName = dec
			}
		}
		if profiles[i].PayoutNumberEncrypted != "" {
			if dec, err := security.Decrypt(profiles[i].PayoutNumberEncrypted, h.encryptionKey); err == nil {
				profiles[i].PayoutNumber = dec
			}
		}
	}

	limit := filter.Limit
	if limit < 1 {
		limit = 20
	}
	utils.JSONResponse(w, http.StatusOK, map[string]interface{}{
		"items":       profiles,
		"total":       total,
		"page":        filter.Page,
		"limit":       limit,
		"total_pages": (total + limit - 1) / limit,
	})
}

// ──────────────────────────────────────────────────────────
// Affiliate status & moderation
// ──────────────────────────────────────────────────────────

func (h *AffiliateHandler) UpdateAffiliateStatus(w http.ResponseWriter, r *http.Request) {
	userID, _ := r.Context().Value(middleware.CtxUserID).(string)
	profileID := chi.URLParam(r, "id")

	var input struct {
		Status string `json:"status"`
	}
	if err := utils.DecodeJSON(r, &input); err != nil {
		utils.JSONError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	validStatuses := map[string]bool{"APPROVED": true, "REJECTED": true, "SUSPENDED": true}
	if !validStatuses[input.Status] {
		utils.JSONError(w, http.StatusBadRequest, "invalid status, must be APPROVED, REJECTED, or SUSPENDED")
		return
	}

	if err := h.affiliateRepo.UpdateProfileStatus(r.Context(), profileID, input.Status); err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to update status")
		return
	}

	h.auditRepo.Log(r.Context(), userID, "update_status", "affiliate", profileID, "Affiliate status: "+input.Status, r.RemoteAddr)
	utils.JSONResponse(w, http.StatusOK, map[string]string{"message": "status updated"})
}

// BlockAffiliate blocks or unblocks an affiliate user.
func (h *AffiliateHandler) BlockAffiliate(w http.ResponseWriter, r *http.Request) {
	adminID, _ := r.Context().Value(middleware.CtxUserID).(string)
	targetUserID := chi.URLParam(r, "id")

	var input struct {
		Blocked bool   `json:"blocked"`
		Reason  string `json:"reason"`
	}
	if err := utils.DecodeJSON(r, &input); err != nil {
		utils.JSONError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if input.Blocked && input.Reason == "" {
		utils.JSONError(w, http.StatusBadRequest, "reason is required when blocking")
		return
	}

	if err := h.affiliateRepo.BlockAffiliate(r.Context(), targetUserID, input.Blocked, input.Reason); err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to update block status")
		return
	}

	action := "unblocked"
	if input.Blocked {
		action = "blocked"
	}
	h.auditRepo.Log(r.Context(), adminID, "block_affiliate", "affiliate", targetUserID, "Affiliate "+action+": "+input.Reason, r.RemoteAddr)
	utils.JSONResponse(w, http.StatusOK, map[string]string{"message": "affiliate " + action})
}

// FlagSuspicious flags or unflags an affiliate.
func (h *AffiliateHandler) FlagSuspicious(w http.ResponseWriter, r *http.Request) {
	adminID, _ := r.Context().Value(middleware.CtxUserID).(string)
	targetUserID := chi.URLParam(r, "id")

	var input struct {
		Suspicious bool `json:"suspicious"`
	}
	if err := utils.DecodeJSON(r, &input); err != nil {
		utils.JSONError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if err := h.affiliateRepo.FlagSuspicious(r.Context(), targetUserID, input.Suspicious); err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to update suspicious flag")
		return
	}

	h.auditRepo.Log(r.Context(), adminID, "flag_suspicious", "affiliate", targetUserID, "Suspicious flag updated", r.RemoteAddr)
	utils.JSONResponse(w, http.StatusOK, map[string]string{"message": "suspicious flag updated"})
}

// AdjustBalance adjusts an affiliate's balance (credit or debit).
func (h *AffiliateHandler) AdjustBalance(w http.ResponseWriter, r *http.Request) {
	adminID, _ := r.Context().Value(middleware.CtxUserID).(string)
	targetUserID := chi.URLParam(r, "id")

	var input affiliate.AdjustBalanceInput
	if err := utils.DecodeJSON(r, &input); err != nil {
		utils.JSONError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if msg := input.Validate(); msg != "" {
		utils.JSONError(w, http.StatusBadRequest, msg)
		return
	}

	if err := h.affiliateRepo.AdjustBalance(r.Context(), targetUserID, adminID, input); err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to adjust balance: "+err.Error())
		return
	}

	h.auditRepo.Log(r.Context(), adminID, "adjust_balance", "affiliate", targetUserID, "Balance adjusted: "+input.Reason, r.RemoteAddr)
	utils.JSONResponse(w, http.StatusOK, map[string]string{"message": "balance adjusted"})
}

// ──────────────────────────────────────────────────────────
// Payouts – state machine (approve / reject / mark-paid)
// ──────────────────────────────────────────────────────────

func (h *AffiliateHandler) ListPayouts(w http.ResponseWriter, r *http.Request) {
	filter := affiliate.PayoutListFilter{
		Status: utils.QueryString(r, "status", ""),
		Page:   utils.QueryInt(r, "page", 1),
		Limit:  utils.QueryInt(r, "limit", 20),
	}

	payouts, total, err := h.affiliateRepo.ListAllPayouts(r.Context(), filter)
	if err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to list payouts")
		return
	}

	if payouts == nil {
		payouts = []affiliate.PayoutRequest{}
	}

	limit := filter.Limit
	if limit < 1 {
		limit = 20
	}
	utils.JSONResponse(w, http.StatusOK, map[string]interface{}{
		"items":       payouts,
		"total":       total,
		"page":        filter.Page,
		"limit":       limit,
		"total_pages": (total + limit - 1) / limit,
	})
}

// ApprovePayout approves a PENDING payout request → locks the user's balance.
func (h *AffiliateHandler) ApprovePayout(w http.ResponseWriter, r *http.Request) {
	adminID, _ := r.Context().Value(middleware.CtxUserID).(string)
	payoutID := chi.URLParam(r, "id")

	var input struct {
		AdminNote string `json:"admin_note"`
	}
	_ = utils.DecodeJSON(r, &input)

	if err := h.affiliateRepo.ApprovePayout(r.Context(), payoutID, input.AdminNote, adminID); err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to approve payout: "+err.Error())
		return
	}

	h.auditRepo.Log(r.Context(), adminID, "approve_payout", "payout", payoutID, "Payout approved", r.RemoteAddr)
	utils.JSONResponse(w, http.StatusOK, map[string]string{"message": "payout approved"})
}

// RejectPayout rejects a payout → returns locked balance to available.
func (h *AffiliateHandler) RejectPayout(w http.ResponseWriter, r *http.Request) {
	adminID, _ := r.Context().Value(middleware.CtxUserID).(string)
	payoutID := chi.URLParam(r, "id")

	var input struct {
		AdminNote string `json:"admin_note"`
	}
	if err := utils.DecodeJSON(r, &input); err != nil {
		utils.JSONError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if input.AdminNote == "" {
		utils.JSONError(w, http.StatusBadRequest, "admin_note is required when rejecting")
		return
	}

	if err := h.affiliateRepo.RejectPayout(r.Context(), payoutID, input.AdminNote, adminID); err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to reject payout: "+err.Error())
		return
	}

	h.auditRepo.Log(r.Context(), adminID, "reject_payout", "payout", payoutID, "Payout rejected: "+input.AdminNote, r.RemoteAddr)
	utils.JSONResponse(w, http.StatusOK, map[string]string{"message": "payout rejected"})
}

// MarkPaid marks an approved payout as PAID with payment reference / proof.
func (h *AffiliateHandler) MarkPaid(w http.ResponseWriter, r *http.Request) {
	adminID, _ := r.Context().Value(middleware.CtxUserID).(string)
	payoutID := chi.URLParam(r, "id")

	var input struct {
		AdminNote        string `json:"admin_note"`
		PaymentReference string `json:"payment_reference"`
		ProofURL         string `json:"proof_url"`
	}
	if err := utils.DecodeJSON(r, &input); err != nil {
		utils.JSONError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if err := h.affiliateRepo.MarkPaid(r.Context(), payoutID, input.AdminNote, adminID, input.PaymentReference, input.ProofURL); err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to mark paid: "+err.Error())
		return
	}

	h.auditRepo.Log(r.Context(), adminID, "mark_paid", "payout", payoutID, "Payout marked as paid", r.RemoteAddr)
	utils.JSONResponse(w, http.StatusOK, map[string]string{"message": "payout marked as paid"})
}

// ReleaseHeldCommissions manually triggers the release of held commissions.
func (h *AffiliateHandler) ReleaseHeldCommissions(w http.ResponseWriter, r *http.Request) {
	adminID, _ := r.Context().Value(middleware.CtxUserID).(string)

	released, err := h.affiliateRepo.ReleaseHeldCommissions(r.Context())
	if err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to release commissions: "+err.Error())
		return
	}

	h.auditRepo.Log(r.Context(), adminID, "release_commissions", "affiliate", "system", "Released held commissions", r.RemoteAddr)
	utils.JSONResponse(w, http.StatusOK, map[string]interface{}{
		"message":  "held commissions released",
		"released": released,
	})
}
