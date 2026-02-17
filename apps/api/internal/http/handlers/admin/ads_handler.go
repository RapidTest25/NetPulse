package admin

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/rapidtest/netpulse-api/internal/http/middleware"
	"github.com/rapidtest/netpulse-api/internal/repository/postgres"
	"github.com/rapidtest/netpulse-api/internal/utils"
)

type AdsHandler struct {
	adsRepo   *postgres.AdsRepo
	auditRepo *postgres.AuditRepo
}

func NewAdsHandler(adsRepo *postgres.AdsRepo, auditRepo *postgres.AuditRepo) *AdsHandler {
	return &AdsHandler{adsRepo: adsRepo, auditRepo: auditRepo}
}

// List returns all ad slots.
func (h *AdsHandler) List(w http.ResponseWriter, r *http.Request) {
	items, err := h.adsRepo.FindAll(r.Context())
	if err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to load ad slots")
		return
	}
	utils.JSONResponse(w, http.StatusOK, map[string]interface{}{"items": items})
}

// Create adds a new ad slot.
func (h *AdsHandler) Create(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Name     string `json:"name"`
		Code     string `json:"code"`
		Position string `json:"position"`
		IsActive bool   `json:"is_active"`
	}
	if err := utils.DecodeJSON(r, &body); err != nil {
		utils.JSONError(w, http.StatusBadRequest, "invalid body")
		return
	}
	if body.Name == "" {
		utils.JSONError(w, http.StatusBadRequest, "name is required")
		return
	}
	if body.Position == "" {
		body.Position = "inline"
	}

	slot, err := h.adsRepo.Create(r.Context(), body.Name, body.Code, body.Position, body.IsActive)
	if err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to create ad slot")
		return
	}

	userID := middleware.GetUserID(r)
	_ = h.auditRepo.Log(r.Context(), userID, "create", "ad_slot", slot.ID, slot.Name, r.RemoteAddr)

	utils.JSONResponse(w, http.StatusCreated, slot)
}

// Update modifies an existing ad slot.
func (h *AdsHandler) Update(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	var body struct {
		Name     string `json:"name"`
		Code     string `json:"code"`
		Position string `json:"position"`
		IsActive bool   `json:"is_active"`
	}
	if err := utils.DecodeJSON(r, &body); err != nil {
		utils.JSONError(w, http.StatusBadRequest, "invalid body")
		return
	}

	if err := h.adsRepo.Update(r.Context(), id, body.Name, body.Code, body.Position, body.IsActive); err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to update ad slot")
		return
	}

	userID := middleware.GetUserID(r)
	_ = h.auditRepo.Log(r.Context(), userID, "update", "ad_slot", id, body.Name, r.RemoteAddr)

	utils.JSONResponse(w, http.StatusOK, map[string]string{"message": "updated"})
}

// Delete removes an ad slot.
func (h *AdsHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	if err := h.adsRepo.Delete(r.Context(), id); err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to delete ad slot")
		return
	}

	userID := middleware.GetUserID(r)
	_ = h.auditRepo.Log(r.Context(), userID, "delete", "ad_slot", id, "", r.RemoteAddr)

	utils.JSONResponse(w, http.StatusOK, map[string]string{"message": "deleted"})
}

// Toggle switches the active status of an ad slot.
func (h *AdsHandler) Toggle(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	slot, err := h.adsRepo.ToggleActive(r.Context(), id)
	if err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to toggle ad slot")
		return
	}

	userID := middleware.GetUserID(r)
	action := "disable"
	if slot.IsActive {
		action = "enable"
	}
	_ = h.auditRepo.Log(r.Context(), userID, action, "ad_slot", id, slot.Name, r.RemoteAddr)

	utils.JSONResponse(w, http.StatusOK, slot)
}
