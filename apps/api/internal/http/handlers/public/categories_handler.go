package public

import (
	"net/http"

	"github.com/rapidtest/netpulse-api/internal/repository/postgres"
	"github.com/rapidtest/netpulse-api/internal/utils"
)

type CategoriesHandler struct {
	repo *postgres.CategoriesRepo
}

func NewCategoriesHandler(repo *postgres.CategoriesRepo) *CategoriesHandler {
	return &CategoriesHandler{repo: repo}
}

func (h *CategoriesHandler) List(w http.ResponseWriter, r *http.Request) {
	cats, err := h.repo.FindAll(r.Context())
	if err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to fetch categories")
		return
	}
	utils.JSONResponse(w, http.StatusOK, cats)
}
