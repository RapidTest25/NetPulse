package public

import (
	"net/http"

	"github.com/rapidtest/netpulse-api/internal/repository/postgres"
	"github.com/rapidtest/netpulse-api/internal/utils"
)

type TagsHandler struct {
	repo *postgres.TagsRepo
}

func NewTagsHandler(repo *postgres.TagsRepo) *TagsHandler {
	return &TagsHandler{repo: repo}
}

func (h *TagsHandler) List(w http.ResponseWriter, r *http.Request) {
	tags, err := h.repo.FindAll(r.Context())
	if err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to fetch tags")
		return
	}
	utils.JSONResponse(w, http.StatusOK, tags)
}
