package admin

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/rapidtest/netpulse-api/internal/http/middleware"
	"github.com/rapidtest/netpulse-api/internal/repository/postgres"
	"github.com/rapidtest/netpulse-api/internal/utils"
)

type RolesHandler struct {
	rolesRepo *postgres.RolesRepo
	auditRepo *postgres.AuditRepo
}

func NewRolesHandler(rolesRepo *postgres.RolesRepo, auditRepo *postgres.AuditRepo) *RolesHandler {
	return &RolesHandler{rolesRepo: rolesRepo, auditRepo: auditRepo}
}

// List handles GET /admin/roles
func (h *RolesHandler) List(w http.ResponseWriter, r *http.Request) {
	roles, err := h.rolesRepo.FindAll(r.Context())
	if err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to list roles")
		return
	}
	utils.JSONResponse(w, http.StatusOK, map[string]interface{}{"items": roles})
}

// Permissions handles GET /admin/roles/permissions
func (h *RolesHandler) Permissions(w http.ResponseWriter, r *http.Request) {
	perms, err := h.rolesRepo.FindAllPermissions(r.Context())
	if err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to list permissions")
		return
	}
	utils.JSONResponse(w, http.StatusOK, map[string]interface{}{"items": perms})
}

// UpdatePermissions handles PUT /admin/roles/{id}/permissions
func (h *RolesHandler) UpdatePermissions(w http.ResponseWriter, r *http.Request) {
	roleID := chi.URLParam(r, "id")

	var body struct {
		PermissionIDs []string `json:"permission_ids"`
	}
	if err := utils.DecodeJSON(r, &body); err != nil {
		utils.JSONError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if err := h.rolesRepo.SetRolePermissions(r.Context(), roleID, body.PermissionIDs); err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to update permissions")
		return
	}

	adminID := middleware.GetUserID(r)
	_ = h.auditRepo.Log(r.Context(), adminID, "update_permissions", "role", roleID, "", r.RemoteAddr)

	utils.JSONResponse(w, http.StatusOK, map[string]string{"message": "permissions updated"})
}
