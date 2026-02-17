package admin

import (
	"net/http"

	"github.com/rapidtest/netpulse-api/internal/http/middleware"
	"github.com/rapidtest/netpulse-api/internal/repository/postgres"
	"github.com/rapidtest/netpulse-api/internal/utils"
)

type SettingsHandler struct {
	settingsRepo *postgres.SettingsRepo
	auditRepo    *postgres.AuditRepo
}

func NewSettingsHandler(settingsRepo *postgres.SettingsRepo, auditRepo *postgres.AuditRepo) *SettingsHandler {
	return &SettingsHandler{settingsRepo: settingsRepo, auditRepo: auditRepo}
}

// Get returns all site settings.
func (h *SettingsHandler) Get(w http.ResponseWriter, r *http.Request) {
	settings, err := h.settingsRepo.GetAll(r.Context())
	if err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to fetch settings")
		return
	}
	utils.JSONResponse(w, http.StatusOK, settings)
}

// Update modifies site settings.
func (h *SettingsHandler) Update(w http.ResponseWriter, r *http.Request) {
	var body map[string]string
	if err := utils.DecodeJSON(r, &body); err != nil {
		utils.JSONError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	for key, value := range body {
		if err := h.settingsRepo.Set(r.Context(), key, value); err != nil {
			utils.JSONError(w, http.StatusInternalServerError, "failed to update settings")
			return
		}
	}

	userID, _ := r.Context().Value(middleware.CtxUserID).(string)
	_ = h.auditRepo.Log(r.Context(), userID, "update", "settings", "", "", r.RemoteAddr)

	utils.JSONResponse(w, http.StatusOK, map[string]string{"message": "settings updated"})
}
