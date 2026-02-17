package public

import (
	"net/http"

	"github.com/rapidtest/netpulse-api/internal/domain/posts"
	"github.com/rapidtest/netpulse-api/internal/repository/postgres"
	redisRepo "github.com/rapidtest/netpulse-api/internal/repository/redis"
	"github.com/rapidtest/netpulse-api/internal/utils"
)

type SearchHandler struct {
	postsRepo *postgres.PostsRepo
	cache     *redisRepo.Cache
}

func NewSearchHandler(postsRepo *postgres.PostsRepo, cache *redisRepo.Cache) *SearchHandler {
	return &SearchHandler{postsRepo: postsRepo, cache: cache}
}

// Search handles GET /search?q=...&page=1&limit=10&sort=relevance
func (h *SearchHandler) Search(w http.ResponseWriter, r *http.Request) {
	q := utils.QueryString(r, "q", "")
	if q == "" || len(q) > 120 {
		utils.JSONError(w, http.StatusBadRequest, "query parameter 'q' is required (max 120 chars)")
		return
	}

	page := utils.QueryInt(r, "page", 1)
	limit := utils.QueryInt(r, "limit", 10)
	sort := utils.QueryString(r, "sort", "relevance")

	result, err := h.postsRepo.Search(r.Context(), q, page, limit, sort)
	if err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "search failed")
		return
	}

	utils.JSONResponse(w, http.StatusOK, result)
}

// Suggest handles GET /search/suggest?q=...&limit=5
func (h *SearchHandler) Suggest(w http.ResponseWriter, r *http.Request) {
	q := utils.QueryString(r, "q", "")
	if q == "" || len(q) < 2 || len(q) > 80 {
		utils.JSONResponse(w, http.StatusOK, []interface{}{})
		return
	}

	limit := utils.QueryInt(r, "limit", 5)

	results, err := h.postsRepo.Suggest(r.Context(), q, limit)
	if err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "suggest failed")
		return
	}

	if results == nil {
		results = make([]posts.SuggestResult, 0)
	}

	utils.JSONResponse(w, http.StatusOK, results)
}
