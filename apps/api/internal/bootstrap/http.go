package bootstrap

import (
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/go-chi/httprate"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"

	"github.com/rapidtest/netpulse-api/internal/config"
	"github.com/rapidtest/netpulse-api/internal/domain/posts"
	"github.com/rapidtest/netpulse-api/internal/http/handlers"
	adminHandlers "github.com/rapidtest/netpulse-api/internal/http/handlers/admin"
	authorHandlers "github.com/rapidtest/netpulse-api/internal/http/handlers/author"
	publicHandlers "github.com/rapidtest/netpulse-api/internal/http/handlers/public"
	"github.com/rapidtest/netpulse-api/internal/http/middleware"
	"github.com/rapidtest/netpulse-api/internal/repository/postgres"
	redisRepo "github.com/rapidtest/netpulse-api/internal/repository/redis"
	"github.com/rapidtest/netpulse-api/internal/security"
)

// NewHTTP wires up all dependencies and returns a configured router.
func NewHTTP(cfg *config.Config, db *pgxpool.Pool, rdb *redis.Client) http.Handler {
	r := chi.NewRouter()

	// ── Global middleware ────────────────────────────────
	r.Use(chimw.RequestID)
	r.Use(middleware.RequestLogger)
	r.Use(chimw.Recoverer)
	r.Use(middleware.SecurityHeaders)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000", "http://localhost:3001", cfg.BaseURL},
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-Request-ID"},
		ExposedHeaders:   []string{"X-Request-ID"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// ── Repositories ─────────────────────────────────────
	postsRepo := postgres.NewPostsRepo(db)
	categoriesRepo := postgres.NewCategoriesRepo(db)
	tagsRepo := postgres.NewTagsRepo(db)
	usersRepo := postgres.NewUsersRepo(db)
	rolesRepo := postgres.NewRolesRepo(db)
	auditRepo := postgres.NewAuditRepo(db)
	settingsRepo := postgres.NewSettingsRepo(db)
	authRepo := postgres.NewAuthRepo(db)
	commentsRepo := postgres.NewCommentsRepo(db)
	engagementRepo := postgres.NewEngagementRepo(db)
	referralRepo := postgres.NewReferralRepo(db)
	mediaRepo := postgres.NewMediaRepo(db)
	adsRepo := postgres.NewAdsRepo(db)
	affiliateRepo := postgres.NewAffiliateRepo(db)
	inviteRepo := postgres.NewInviteRepo(db)
	cacheRepo := redisRepo.NewCache(rdb)
	engCache := redisRepo.NewEngagementCache(rdb)
	rateLimiter := redisRepo.NewRateLimiter(rdb)

	// ── Security ─────────────────────────────────────────
	tokenSvc := security.NewTokenService(cfg)
	encKeyBytes := []byte(cfg.EncryptionKey)

	// ── Services ─────────────────────────────────────────
	postsSvc := posts.NewService(postsRepo, cacheRepo)

	// ── Permission loader ────────────────────────────────
	permLoader := middleware.NewPermissionLoader(db)

	// ── Handlers ─────────────────────────────────────────
	healthH := handlers.NewHealthHandler(db, rdb)
	publicPostsH := publicHandlers.NewPostsHandler(postsSvc)
	publicCategoriesH := publicHandlers.NewCategoriesHandler(categoriesRepo)
	publicTagsH := publicHandlers.NewTagsHandler(tagsRepo)
	publicSearchH := publicHandlers.NewSearchHandler(postsRepo, cacheRepo)
	engagementH := publicHandlers.NewEngagementHandler(commentsRepo, engagementRepo, engCache, auditRepo)

	adminAuthH := adminHandlers.NewAuthHandler(usersRepo, authRepo, referralRepo, auditRepo, tokenSvc, engCache, cfg)
	adminPostsH := adminHandlers.NewPostsHandler(postsSvc, auditRepo)
	adminUsersH := adminHandlers.NewUsersHandler(usersRepo, rolesRepo, auditRepo, referralRepo, authRepo)
	adminSettingsH := adminHandlers.NewSettingsHandler(settingsRepo, auditRepo)
	adminCommentsH := adminHandlers.NewCommentsHandler(commentsRepo, engagementRepo, auditRepo)
	adminStatsH := adminHandlers.NewStatsHandler(engagementRepo)
	adminReferralH := adminHandlers.NewReferralHandler(referralRepo)
	adminRolesH := adminHandlers.NewRolesHandler(rolesRepo, auditRepo)
	adminAuditH := adminHandlers.NewAuditHandler(auditRepo)
	adminMediaH := adminHandlers.NewMediaHandler(mediaRepo, auditRepo, cfg.BaseURL)
	adminAdsH := adminHandlers.NewAdsHandler(adsRepo, auditRepo)
	adminAffiliateH := adminHandlers.NewAffiliateHandler(affiliateRepo, auditRepo, encKeyBytes)

	// Google OAuth handler
	googleOAuthH := adminHandlers.NewGoogleOAuthHandler(usersRepo, authRepo, referralRepo, auditRepo, tokenSvc, cfg)

	// Public referral handler
	publicReferralH := publicHandlers.NewReferralHandler(referralRepo, affiliateRepo, cfg.BaseURL)

	// Public user profile handler
	publicUserH := publicHandlers.NewUserHandler(usersRepo, postsRepo, engagementRepo)

	// New repos
	savesRepo := postgres.NewSavesRepo(db)
	authorRequestRepo := postgres.NewAuthorRequestRepo(db)

	// Author/User panel handlers
	authorPostsH := authorHandlers.NewPostsHandler(postsSvc, auditRepo)
	authorAffiliateH := authorHandlers.NewAffiliateHandler(affiliateRepo, referralRepo, auditRepo, encKeyBytes)
	authorProfileH := authorHandlers.NewProfileHandler(usersRepo, authRepo, auditRepo)
	userFeaturesH := authorHandlers.NewUserFeaturesHandler(savesRepo)
	userAuthorReqH := authorHandlers.NewAuthorRequestHandler(authorRequestRepo)

	// Admin author requests handler
	adminAuthorReqH := adminHandlers.NewAuthorRequestAdminHandler(authorRequestRepo, auditRepo)
	_ = inviteRepo // available for future enhanced invite flow

	// ── Auth middleware ──────────────────────────────────
	authMW := middleware.NewAuthMiddleware(tokenSvc)

	// ── Rate limiters ────────────────────────────────────
	_ = rateLimiter // will be used when Redis rate limiting is needed

	// ── Routes ───────────────────────────────────────────

	// Static file serving for uploads
	fileServer := http.FileServer(http.Dir("./uploads"))
	r.Get("/uploads/*", func(w http.ResponseWriter, r *http.Request) {
		r.URL.Path = strings.TrimPrefix(r.URL.Path, "/uploads")
		fileServer.ServeHTTP(w, r)
	})

	// Health
	r.Get("/health", healthH.Health)

	// Public API
	r.Route("/posts", func(r chi.Router) {
		r.Use(httprate.LimitByIP(60, 1*time.Minute))
		r.Get("/", publicPostsH.List)

		r.Route("/{id}", func(r chi.Router) {
			r.Get("/", publicPostsH.GetBySlug)
			r.Get("/comments", engagementH.ListComments)
			r.Post("/comments", engagementH.CreateComment)
			r.Post("/like", engagementH.ToggleLike)
			r.Post("/view", engagementH.RecordView)
			r.Get("/stats", engagementH.GetPostStats)

			// Authenticated save/unsave (within public posts route)
			r.Group(func(r chi.Router) {
				r.Use(authMW.Authenticate)
				r.Post("/save", userFeaturesH.ToggleSave)
				r.Get("/saved", userFeaturesH.CheckSaved)
			})
		})
	})

	r.Route("/categories", func(r chi.Router) {
		r.Get("/", publicCategoriesH.List)
	})

	r.Route("/tags", func(r chi.Router) {
		r.Get("/", publicTagsH.List)
	})

	r.Route("/search", func(r chi.Router) {
		r.Use(httprate.LimitByIP(30, 1*time.Minute))
		r.Get("/", publicSearchH.Search)
		r.Get("/suggest", publicSearchH.Suggest)
	})

	// Public referral redirect
	r.Get("/ref/{code}", publicReferralH.HandleReferralRedirect)

	// Public user profiles
	r.Route("/users/{id}", func(r chi.Router) {
		r.Get("/", publicUserH.GetPublicProfile)
		r.Get("/posts", publicUserH.GetPublicUserPosts)
	})

	// Auth
	r.Route("/auth", func(r chi.Router) {
		r.Use(httprate.LimitByIP(10, 1*time.Minute))
		r.Post("/register", adminAuthH.Register)
		r.Post("/login", adminAuthH.Login)
		r.Post("/refresh", adminAuthH.Refresh)
		r.Post("/verify-email", adminAuthH.VerifyEmail)
		r.Post("/resend-verification", adminAuthH.ResendVerification)
		r.Post("/google", googleOAuthH.HandleGoogleLogin)

		// Protected auth routes
		r.Group(func(r chi.Router) {
			r.Use(authMW.Authenticate)
			r.Post("/logout", adminAuthH.Logout)
			r.Get("/sessions", adminAuthH.GetSessions)
			r.Delete("/sessions/{id}", adminAuthH.RevokeSession)
		})
	})

	// Admin API (protected)
	r.Route("/admin", func(r chi.Router) {
		r.Use(authMW.Authenticate)
		r.Use(permLoader.LoadPermissions)

		r.Route("/posts", func(r chi.Router) {
			r.Get("/", adminPostsH.List)
			r.Post("/", adminPostsH.Create)
			r.Get("/{id}", adminPostsH.GetByID)
			r.Patch("/{id}", adminPostsH.Update)
			r.Delete("/{id}", adminPostsH.Delete)
			r.Post("/{id}/submit-review", adminPostsH.SubmitReview)
			r.Post("/{id}/publish", adminPostsH.Publish)
			r.Post("/{id}/schedule", adminPostsH.Schedule)
		})

		r.Route("/users", func(r chi.Router) {
			r.Use(middleware.RBAC("users.manage"))
			r.Get("/", adminUsersH.List)
			r.Post("/invite", adminUsersH.Invite)
			r.Get("/{id}", adminUsersH.GetByID)
			r.Patch("/{id}/role", adminUsersH.UpdateRole)
			r.Patch("/{id}/disable", adminUsersH.Disable)
			r.Patch("/{id}/enable", adminUsersH.Enable)
			r.Get("/{id}/sessions", adminUsersH.Sessions)
			r.Delete("/{id}/sessions/{sessionId}", adminUsersH.RevokeSession)
		})

		r.Route("/comments", func(r chi.Router) {
			r.Use(middleware.RBAC("comments.moderate"))
			r.Get("/", adminCommentsH.List)
			r.Patch("/{id}/moderate", adminCommentsH.Moderate)
			r.Post("/bulk-moderate", adminCommentsH.BulkModerate)
			r.Delete("/{id}", adminCommentsH.Delete)
		})

		r.Route("/roles", func(r chi.Router) {
			r.Use(middleware.RBAC("roles.manage"))
			r.Get("/", adminRolesH.List)
			r.Get("/permissions", adminRolesH.Permissions)
			r.Put("/{id}/permissions", adminRolesH.UpdatePermissions)
		})

		r.Route("/stats", func(r chi.Router) {
			r.Use(middleware.RBAC("stats.view"))
			r.Get("/dashboard", adminStatsH.Dashboard)
			r.Get("/top-posts", adminStatsH.TopPosts)
			r.Get("/traffic", adminStatsH.TrafficOverview)
			r.Get("/posts/{id}", adminStatsH.PostStats)
		})

		r.Route("/referrals", func(r chi.Router) {
			r.Use(middleware.RBAC("referral.view"))
			r.Get("/stats", adminReferralH.Stats)
		})

		r.Route("/audit-logs", func(r chi.Router) {
			r.Use(middleware.RBAC("stats.view"))
			r.Get("/", adminAuditH.List)
		})

		r.Route("/media", func(r chi.Router) {
			r.Get("/", adminMediaH.List)
			r.Post("/upload", adminMediaH.Upload)
			r.Delete("/{id}", adminMediaH.Delete)
		})

		r.Route("/ads", func(r chi.Router) {
			r.Get("/", adminAdsH.List)
			r.Post("/", adminAdsH.Create)
			r.Put("/{id}", adminAdsH.Update)
			r.Delete("/{id}", adminAdsH.Delete)
			r.Patch("/{id}/toggle", adminAdsH.Toggle)
		})

		r.Route("/settings", func(r chi.Router) {
			r.Use(middleware.RBAC("settings.manage"))
			r.Get("/", adminSettingsH.Get)
			r.Patch("/", adminSettingsH.Update)
		})

		// ── Admin Author Requests ────────────────────────
		r.Route("/author-requests", func(r chi.Router) {
			r.Use(middleware.RBAC("author_requests.manage"))
			r.Get("/", adminAuthorReqH.List)
			r.Get("/{id}", adminAuthorReqH.GetByID)
			r.Post("/{id}/review", adminAuthorReqH.Review)
		})

		// ── Admin Affiliate Management ──────────────────
		r.Route("/affiliate", func(r chi.Router) {
			r.Use(middleware.RBAC("affiliate.manage"))
			r.Get("/settings", adminAffiliateH.GetSettings)
			r.Patch("/settings", adminAffiliateH.UpdateSettings)
			r.Get("/stats", adminAffiliateH.GetStats)
			r.Get("/affiliates", adminAffiliateH.ListAffiliates)
			r.Patch("/affiliates/{id}/status", adminAffiliateH.UpdateAffiliateStatus)
			r.Patch("/affiliates/{id}/block", adminAffiliateH.BlockAffiliate)
			r.Patch("/affiliates/{id}/suspicious", adminAffiliateH.FlagSuspicious)
			r.Post("/affiliates/{id}/adjust-balance", adminAffiliateH.AdjustBalance)
			r.Get("/payouts", adminAffiliateH.ListPayouts)
			r.Post("/payouts/{id}/approve", adminAffiliateH.ApprovePayout)
			r.Post("/payouts/{id}/reject", adminAffiliateH.RejectPayout)
			r.Post("/payouts/{id}/mark-paid", adminAffiliateH.MarkPaid)
			r.Post("/release-commissions", adminAffiliateH.ReleaseHeldCommissions)
		})
	})

	// ── User Panel API (authenticated users) ─────────────
	r.Route("/user", func(r chi.Router) {
		r.Use(authMW.Authenticate)
		r.Use(permLoader.LoadPermissions)

		// Profile
		r.Get("/me", authorProfileH.GetMe)
		r.Patch("/me", authorProfileH.UpdateMe)

		// Email change
		r.Post("/me/change-email", authorProfileH.RequestEmailChange)
		r.Post("/me/confirm-email", authorProfileH.ConfirmEmailChange)

		// Password change
		r.Post("/change-password", authorProfileH.ChangePassword)

		// Author Studio - own posts
		r.Route("/posts", func(r chi.Router) {
			r.Get("/", authorPostsH.List)
			r.Post("/", authorPostsH.Create)
			r.Get("/stats", authorPostsH.Stats)
			r.Get("/{id}", authorPostsH.GetByID)
			r.Patch("/{id}", authorPostsH.Update)
			r.Delete("/{id}", authorPostsH.Delete)
			r.Post("/{id}/submit-review", authorPostsH.SubmitReview)
		})

		// ── User features: saves, likes, comments ──────
		r.Get("/saved", userFeaturesH.ListSaved)
		r.Get("/likes", userFeaturesH.ListLiked)
		r.Get("/comments", userFeaturesH.ListMyComments)

		// ── Author request ───────────────────────────────
		r.Post("/author-request", userAuthorReqH.Create)
		r.Get("/author-request", userAuthorReqH.GetStatus)

		// Affiliate
		r.Route("/affiliate", func(r chi.Router) {
			r.Get("/settings", authorAffiliateH.GetSettings)
			r.Get("/me", authorAffiliateH.GetProfile)
			r.Post("/enroll", authorAffiliateH.Enroll)
			r.Get("/stats", authorAffiliateH.GetStats)
			r.Post("/payout-request", authorAffiliateH.RequestPayout)
			r.Get("/payouts", authorAffiliateH.ListPayouts)
			r.Get("/commissions", authorAffiliateH.ListCommissions)
			r.Patch("/payout-info", authorAffiliateH.UpdatePayout)
		})
	})

	// ── Post save/unsave (authenticated) ────────────────
	// ── Public active ads (for rendering in frontend) ───
	r.Get("/ads/active", func(w http.ResponseWriter, r *http.Request) {
		items, err := adsRepo.FindActive(r.Context())
		if err != nil {
			http.Error(w, "failed to load ads", 500)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Cache-Control", "public, max-age=300")
		w.WriteHeader(200)
		json.NewEncoder(w).Encode(map[string]interface{}{"items": items})
	})

	// ── Public site settings (legal pages, etc.) ────────
	r.Get("/settings/public", func(w http.ResponseWriter, r *http.Request) {
		settings, err := settingsRepo.GetAll(r.Context())
		if err != nil {
			http.Error(w, "failed to load settings", 500)
			return
		}
		// Only expose public-safe settings
		public := map[string]string{}
		publicKeys := []string{"site_title", "site_description", "site_logo", "privacy_policy", "terms_of_service", "about_page", "affiliate_how_it_works", "social_twitter", "social_github", "social_facebook", "social_instagram", "social_youtube", "social_linkedin", "footer_text", "contact_email"}
		for _, k := range publicKeys {
			if v, ok := settings[k]; ok {
				public[k] = v
			}
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(200)
		json.NewEncoder(w).Encode(public)
	})

	return r
}
