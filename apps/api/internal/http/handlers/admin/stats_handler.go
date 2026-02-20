package admin

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/rapidtest/netpulse-api/internal/repository/postgres"
	"github.com/rapidtest/netpulse-api/internal/utils"
)

type StatsHandler struct {
	engagementRepo *postgres.EngagementRepo
}

func NewStatsHandler(engagementRepo *postgres.EngagementRepo) *StatsHandler {
	return &StatsHandler{engagementRepo: engagementRepo}
}

// Dashboard handles GET /admin/stats/dashboard
func (h *StatsHandler) Dashboard(w http.ResponseWriter, r *http.Request) {
	stats, err := h.engagementRepo.GetDashboardStats(r.Context())
	if err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to load stats")
		return
	}
	utils.JSONResponse(w, http.StatusOK, stats)
}

// TopPosts handles GET /admin/stats/top-posts
func (h *StatsHandler) TopPosts(w http.ResponseWriter, r *http.Request) {
	orderBy := utils.QueryString(r, "order_by", "views")
	limit := utils.QueryInt(r, "limit", 10)
	if limit > 50 {
		limit = 50
	}

	posts, err := h.engagementRepo.GetTopPosts(r.Context(), orderBy, limit)
	if err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to load top posts")
		return
	}
	utils.JSONResponse(w, http.StatusOK, map[string]interface{}{"items": posts})
}

// PostStats handles GET /admin/stats/posts/{id}
func (h *StatsHandler) PostStats(w http.ResponseWriter, r *http.Request) {
	postID := chi.URLParam(r, "id")
	if postID == "" {
		utils.JSONError(w, http.StatusBadRequest, "post ID required")
		return
	}

	stats, err := h.engagementRepo.GetPostDetailStats(r.Context(), postID)
	if err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to load post stats")
		return
	}
	utils.JSONResponse(w, http.StatusOK, stats)
}

// TrafficOverview handles GET /admin/stats/traffic
func (h *StatsHandler) TrafficOverview(w http.ResponseWriter, r *http.Request) {
	stats, err := h.engagementRepo.GetTrafficOverview(r.Context())
	if err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to load traffic stats")
		return
	}
	utils.JSONResponse(w, http.StatusOK, stats)
}
