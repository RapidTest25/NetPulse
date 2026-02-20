package admin

import (
	"net/http"

	"github.com/rapidtest/netpulse-api/internal/repository/postgres"
	"github.com/rapidtest/netpulse-api/internal/utils"
)

type AuditHandler struct {
	auditRepo *postgres.AuditRepo
}

func NewAuditHandler(auditRepo *postgres.AuditRepo) *AuditHandler {
	return &AuditHandler{auditRepo: auditRepo}
}

// List handles GET /admin/audit-logs
func (h *AuditHandler) List(w http.ResponseWriter, r *http.Request) {
	filter := postgres.AuditFilter{
		UserID: utils.QueryString(r, "user_id", ""),
		Action: utils.QueryString(r, "action", ""),
		Entity: utils.QueryString(r, "entity", ""),
		Search: utils.QueryString(r, "search", ""),
		Page:   utils.QueryInt(r, "page", 1),
		Limit:  utils.QueryInt(r, "limit", 20),
	}
	if filter.Limit > 100 {
		filter.Limit = 100
	}

	result, err := h.auditRepo.FindAll(r.Context(), filter)
	if err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to list audit logs")
		return
	}
	utils.JSONResponse(w, http.StatusOK, result)
}
