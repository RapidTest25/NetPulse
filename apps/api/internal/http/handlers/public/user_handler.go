package public

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/rapidtest/netpulse-api/internal/repository/postgres"
	"github.com/rapidtest/netpulse-api/internal/utils"
)

// UserHandler handles public user profile requests.
type UserHandler struct {
	usersRepo      *postgres.UsersRepo
	postsRepo      *postgres.PostsRepo
	engagementRepo *postgres.EngagementRepo
}

func NewUserHandler(usersRepo *postgres.UsersRepo, postsRepo *postgres.PostsRepo, engagementRepo *postgres.EngagementRepo) *UserHandler {
	return &UserHandler{usersRepo: usersRepo, postsRepo: postsRepo, engagementRepo: engagementRepo}
}

// GetPublicProfile returns a public-facing user profile.
func (h *UserHandler) GetPublicProfile(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		utils.JSONError(w, http.StatusBadRequest, "user id required")
		return
	}

	user, err := h.usersRepo.FindByID(r.Context(), id)
	if err != nil {
		utils.JSONError(w, http.StatusNotFound, "user not found")
		return
	}

	// Get user's published posts count and total stats
	authorStats := h.usersRepo.GetAuthorPublicStats(r.Context(), id)

	// Build the primary role
	role := "VIEWER"
	if len(user.Roles) > 0 {
		priority := map[string]int{"OWNER": 5, "ADMIN": 4, "EDITOR": 3, "AUTHOR": 2, "VIEWER": 1}
		best := user.Roles[0]
		for _, ro := range user.Roles[1:] {
			if priority[ro.Name] > priority[best.Name] {
				best = ro
			}
		}
		role = best.Name
	}

	profile := map[string]interface{}{
		"id":               user.ID,
		"name":             user.Name,
		"avatar":           user.Avatar,
		"bio":              user.Bio,
		"website":          user.Website,
		"location":         user.Location,
		"social_twitter":   user.SocialTwitter,
		"social_github":    user.SocialGithub,
		"social_linkedin":  user.SocialLinkedin,
		"social_facebook":  user.SocialFacebook,
		"social_instagram": user.SocialInstagram,
		"social_youtube":   user.SocialYoutube,
		"role":             role,
		"created_at":       user.CreatedAt,
		"stats":            authorStats,
	}

	utils.JSONResponse(w, http.StatusOK, profile)
}

// GetPublicUserPosts returns published posts by a user.
func (h *UserHandler) GetPublicUserPosts(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		utils.JSONError(w, http.StatusBadRequest, "user id required")
		return
	}

	page := utils.QueryInt(r, "page", 1)
	limit := utils.QueryInt(r, "limit", 10)
	result, err := h.postsRepo.FindPublishedByAuthor(r.Context(), id, page, limit)
	if err != nil {
		utils.JSONError(w, http.StatusInternalServerError, "failed to load posts")
		return
	}

	utils.JSONResponse(w, http.StatusOK, result)
}
