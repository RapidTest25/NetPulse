# NetPulse — Comprehensive Codebase Report

> Generated from a full exploration of every source file in the repository.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack & Versions](#2-technology-stack--versions)
3. [Repository Structure](#3-repository-structure)
4. [Go API (`apps/api`)](#4-go-api-appsapi)
   - 4.1 [Entry Point & Config](#41-entry-point--config)
   - 4.2 [Bootstrap / Wiring](#42-bootstrap--wiring)
   - 4.3 [Domain Models (13 packages)](#43-domain-models-13-packages)
   - 4.4 [Security Layer](#44-security-layer)
   - 4.5 [HTTP Middleware](#45-http-middleware)
   - 4.6 [Repository Layer (Postgres + Redis)](#46-repository-layer-postgres--redis)
   - 4.7 [HTTP Handlers (27 files)](#47-http-handlers-27-files)
   - 4.8 [Utilities & Observability](#48-utilities--observability)
5. [Database Schema (SQL Migrations)](#5-database-schema-sql-migrations)
6. [Next.js Web App (`apps/web`)](#6-nextjs-web-app-appsweb)
   - 6.1 [Stack & Configuration](#61-stack--configuration)
   - 6.2 [Route Map (46 pages)](#62-route-map-46-pages)
   - 6.3 [Components (13 files)](#63-components-13-files)
   - 6.4 [Lib / API Clients](#64-lib--api-clients)
   - 6.5 [TypeScript Types](#65-typescript-types)
   - 6.6 [Styling](#66-styling)
7. [Shared Types Package](#7-shared-types-package)
8. [Infrastructure & DevOps](#8-infrastructure--devops)
9. [Scripts](#9-scripts)
10. [Patterns & Conventions](#10-patterns--conventions)
11. [Implementation Status](#11-implementation-status)
12. [Potential Issues & Notes](#12-potential-issues--notes)

---

## 1. Project Overview

**NetPulse** is a full-stack blogging/CMS platform focused on networking and internet technology content. It features:

- Multi-author content publishing with an editorial review workflow
- RBAC with 5 roles: OWNER → ADMIN → EDITOR → AUTHOR → VIEWER
- JWT authentication with refresh token rotation and family-based reuse detection
- Google OAuth login with account linking
- Full-text search with Postgres `tsvector` + autocomplete suggestions
- Engagement system: views (deduplicated), likes (user + guest), threaded comments with moderation
- Affiliate/referral program with commission tracking, hold periods, payout management, and anti-fraud features
- Media uploads, ad slot management, site settings, audit logging
- Author request workflow (VIEWER → request AUTHOR role → admin review)

**Language**: Indonesian (UI copy, comments, seed data). Technical code in English.

---

## 2. Technology Stack & Versions

### Backend (Go API)

| Package | Version | Purpose |
|---------|---------|---------|
| Go | 1.22 | Language runtime |
| `go-chi/chi/v5` | v5.2.1 | HTTP router |
| `jackc/pgx/v5` | v5.7.4 | PostgreSQL driver + connection pool |
| `redis/go-redis/v9` | v9.7.3 | Redis client |
| `rs/zerolog` | v1.33.0 | Structured JSON logging |
| `golang-jwt/jwt/v5` | v5.2.1 | JWT token generation/validation |
| `joho/godotenv` | v1.5.1 | Environment variable loading |
| `rs/cors` | v1.11.1 | CORS middleware |
| `google.golang.org/api` (oauth2) | v0.214.0 | Google OAuth verification |
| `golang.org/x/crypto` | v0.32.0 | Argon2id password hashing |
| `golang.org/x/text` | v0.21.0 | Unicode-aware slugification |

### Frontend (Next.js Web)

| Package | Version | Purpose |
|---------|---------|---------|
| Next.js | ^15.1.0 | React framework (App Router) |
| React | ^19.0.0 | UI library |
| Tailwind CSS | ^4.0.0 | Utility-first CSS |
| TypeScript | ^5.7.0 | Type safety |
| clsx | ^2.1.1 | Conditional classNames |

### Infrastructure

| Service | Version | Purpose |
|---------|---------|---------|
| PostgreSQL | 16-alpine | Primary database |
| Redis | 7-alpine | Cache, rate limiting, deduplication |
| Docker Compose | 3.9 | Service orchestration |
| Nginx | - | Reverse proxy (config defined) |

---

## 3. Repository Structure

```
NetPulse/
├── apps/
│   ├── api/                    # Go backend (75 .go files)
│   │   ├── cmd/server/main.go  # Entry point
│   │   ├── internal/
│   │   │   ├── bootstrap/      # DB, Redis, Logger, HTTP wiring
│   │   │   ├── config/         # Config + env loading
│   │   │   ├── domain/         # 13 domain packages (models + business logic)
│   │   │   ├── http/
│   │   │   │   ├── handlers/   # 27 handler files (admin/public/author)
│   │   │   │   └── middleware/ # 5 middleware files
│   │   │   ├── observability/  # Metrics + tracing (stubs)
│   │   │   ├── repository/
│   │   │   │   ├── postgres/   # 10 repo files (~3000+ LoC)
│   │   │   │   └── redis/      # 3 repo files (cache, engagement, ratelimit)
│   │   │   ├── security/       # Tokens, passwords, encryption
│   │   │   └── utils/          # JSON helpers, slugify, time
│   │   └── migrations/         # 10 SQL migration files
│   └── web/                    # Next.js frontend (74 .ts/.tsx files)
│       └── src/
│           ├── app/            # 46 pages + 3 layouts (App Router)
│           ├── components/     # 13 reusable components
│           ├── lib/            # 5 client libraries
│           ├── types/          # Shared TypeScript interfaces
│           └── styles/         # Tailwind globals
├── packages/
│   └── shared-types/           # Shared DTOs between front/back documentation
├── scripts/                    # 4 shell scripts (dev, migrate, seed, backup)
├── infra/                      # Nginx, Cloudflare, Docker configs
├── docs/                       # Architecture, API, security, runbook docs
└── docker-compose.yml          # Multi-service orchestration
```

---

## 4. Go API (`apps/api`)

### 4.1 Entry Point & Config

**`cmd/server/main.go`** — Application entry point:
1. Loads config from `.env` via godotenv
2. Initializes zerolog logger (console for dev, JSON for prod)
3. Connects PostgreSQL (pgxpool) + Redis (fail-open)
4. Creates HTTP router via `bootstrap.NewHTTPRouter()`
5. Starts `http.Server` with graceful shutdown (10s timeout)
6. Server timeouts: ReadTimeout=15s, WriteTimeout=15s, IdleTimeout=60s

**`internal/config/config.go` + `env.go`** — Configuration:
- `Config` struct with sub-structs: `PostgresConfig`, `RedisConfig`, `APIConfig`, `JWTConfig`, `EncryptionConfig`, `MediaConfig`, `GoogleOAuthConfig`
- All loaded from environment variables with sensible defaults
- Helper methods: `DatabaseDSN()`, `RedisAddr()`, `IsProd()`
- Defaults: port 8080, JWT access 15min, refresh 720h (30 days), DB pool max 20 / min 2

### 4.2 Bootstrap / Wiring

**`internal/bootstrap/http.go`** (~300 lines) — Central dependency wiring:
- Creates all **18+ repository** instances
- Creates `posts.Service` (the only domain with a service layer)
- Creates all **20+ handler** instances
- Defines the **complete route tree** with middleware chains
- Middleware stack: Logger → RequestID → CORS → SecurityHeaders → Recovery → RateLimit

**`internal/bootstrap/db.go`** — PostgreSQL connection pool:
- pgxpool with configurable max/min connections, max lifetime (30min)
- Returns `*pgxpool.Pool`

**`internal/bootstrap/redis.go`** — Redis client:
- **Fail-open pattern**: if Redis is unavailable, app continues without caching
- Logs warning on connection failure instead of crashing

**`internal/bootstrap/logger.go`** — Zerolog setup:
- Development: `ConsoleWriter` (human-readable, colored)
- Production: JSON output to stdout

### 4.3 Domain Models (13 packages)

All in `internal/domain/`:

| Package | Key Types | Lines | Notes |
|---------|-----------|-------|-------|
| `users` | `User` (22+ fields), `UserFilter`, `InviteUserInput` | ~100 | Social links, Google OAuth, `PrimaryRole()` method |
| `auth` | `RegisterInput`, `AuthToken`, `EmailVerificationToken`, `UserSession`, `TokenPair`, `AuthResponse`, `UserInfo` | ~80 | Token family tracking for rotation |
| `auth/validation.go` | Password policy, email validation | ~100 | 8+ chars, upper/lower/digit/symbol, common password blacklist |
| `posts` | `Post` (6 statuses), `Category`, `Tag`, `Author`, `CreatePostInput`, `UpdatePostInput`, `PostListFilter`, `PostListResult`, `SearchResult`, `SuggestResult` | ~180 | Status enum: DRAFT→IN_REVIEW→CHANGES_REQUESTED→SCHEDULED→PUBLISHED→ARCHIVED |
| `posts/service.go` | `Service` struct with `Repository` + `CacheRepository` interfaces | ~200 | Business logic layer, cache invalidation on mutations |
| `posts/policy.go` | `CanEdit`, `CanPublish`, `CanDelete`, `CanSubmitReview` | ~50 | Authorization rules based on role + ownership |
| `comments` | `Comment` (4 statuses), `CommentFilter`, `ModerateCommentInput`, `BulkModerateInput` | ~100 | Threaded (parent_id), guest + authenticated, soft delete |
| `engagement` | `PostStats`, `Like`, `DashboardStats`, `TopPost`, `TrafficOverview` | ~120 | Hourly/daily breakdowns, referrer stats |
| `affiliate` | `AffiliateSettings`, `AffiliateProfile`, `Commission`, `PayoutRequest`, `EnrollInput`, `AdjustBalanceInput`, `AffiliateStats`, `AdminAffiliateStats` | ~266 | Full affiliate program with encrypted payout info, hold periods, balance management, `MaskString()` helper |
| `referral` | `ReferralEvent`, `ReferralStats`, `TopReferrer`, `UserReferralInfo` | ~60 | |
| `audit` | `AuditLog` | ~30 | User/action/entity/details/IP tracking |
| `saves` | `Save`, `SaveResponse`, `SaveFilter`, `SaveListResult` | ~60 | Bookmark system with joined post info |
| `settings` | `SiteSetting`, 18 predefined keys | ~50 | Key-value pairs for site config |
| `authorrequest` | `AuthorRequest` (PENDING/APPROVED/REJECTED), `CreateAuthorRequestInput`, `ReviewAuthorRequestInput`, `AuthorRequestFilter` | ~60 | Admin review workflow |
| `roles` | `Role`, `Permission` (with module grouping) | ~30 | |
| `ads` | `AdSlot` (name/code/position/is_active) | ~20 | |

### 4.4 Security Layer

**`internal/security/tokens.go`** — JWT Token Service:
- `GenerateAccessToken(userID, role)` — HS256, custom claims (`uid`, `role`), configurable expiry (default 15min)
- `GenerateRefreshToken(userID, role)` — Same algo, longer expiry (default 720h)
- `ValidateAccessToken(token)` / `ValidateRefreshToken(token)` — Returns typed claims
- Custom `Claims` struct extends `jwt.RegisteredClaims` with `UserID` and `Role`

**`internal/security/password.go`** — Password Security:
- **Argon2id** hashing (OWASP-recommended params: time=3, memory=64MB, threads=4, saltLength=16, keyLength=32)
- `HashPassword(password)` / `CheckPassword(password, hash)` — includes bcrypt backward compat stub
- `ValidatePasswordStrength(password)` — 8+ chars, upper, lower, digit, symbol
- `GenerateSecureToken(length)` — crypto/rand hex token
- `GenerateReferralCode()` — Format: `RW-XXXXXX` (alphanumeric)

**`internal/security/encryption.go`** — Data Encryption:
- AES-GCM `Encrypt(plaintext, key)` / `Decrypt(ciphertext, key)`
- Used for affiliate payout info (bank account names/numbers)

### 4.5 HTTP Middleware

| File | Middleware | Description |
|------|-----------|-------------|
| `auth.go` | `AuthMiddleware` | Extracts `Bearer` token, validates JWT, sets `CtxUserID` + `CtxUserRole` in context |
| `auth.go` | `RequireRole(roles...)` | Role-based access control |
| `rbac.go` | `PermissionLoader` | Loads user permissions from DB (joins `user_roles → role_permissions → permissions`) on each request |
| `rbac.go` | `RBAC(permission)` | Permission-based check, OWNER bypasses all |
| `rbac.go` | `RequireEmailVerified` | Blocks unverified users |
| `rbac.go` | Helper functions | `GetUserID`, `GetUserRole`, `HasPermission`, `HasAnyPermission`, `RBACOwnOrAny` |
| `ratelimit.go` | `RedisRateLimit(max, window)` | Sliding window rate limiter using Redis sorted sets |
| `ratelimit.go` | `ExtractIP()` | IP extraction chain: CF-Connecting-IP → X-Forwarded-For → X-Real-IP → RemoteAddr |
| `security_headers.go` | `SecurityHeaders` | X-Content-Type-Options, X-Frame-Options (SAMEORIGIN), X-XSS-Protection, Referrer-Policy, Permissions-Policy |
| `request_id.go` | Request logging | Logs method, path, status, bytes, latency, IP per request via zerolog |

### 4.6 Repository Layer (Postgres + Redis)

#### Postgres Repositories (`internal/repository/postgres/`)

**`repos.go`** — Mega-file (~926 lines) containing 6 repositories:
- `CategoriesRepo` — `FindAll()`, `FindBySlug()`, `FindByID()`, `Create()`, `Update()`, `Delete()`
- `TagsRepo` — `FindAll()`, `FindBySlug()`, `Create()`, `Update()`, `Delete()`
- `UsersRepo` — `FindByEmail`, `FindByID`, `FindAll`, `FindAllFiltered`, `Create`, `FindByGoogleSub`, `LinkGoogleAccount`, `SetRole`, `ClearRoles`, `UpdatePassword`, `DisableUser`, `EnableUser`, `EmailExists`, `UpdateEmail`, `UpdateProfile`, `GetAuthorPublicStats` + internal `loadUserPermissions`
- `RolesRepo` — `FindByName`, `FindAll`, `FindAllPermissions`, `SetRolePermissions`, `HasPermission`
- `AuditRepo` — `Log`, `FindAll` (with filtering by user/action/entity/search)
- `SettingsRepo` — `GetAll`, `Set` (key-value upsert)
- `MediaRepo` — `FindAll`, `Create`, `Delete`, `FindByID`
- `AdsRepo` — `FindAll`, `FindActive`, `Create`, `Update`, `Delete`, `ToggleActive`

**`posts_repo.go`** — Posts repository:
- `FindAll(filter)` — Dynamic SQL with optional status, category, tag, author, sort, pagination
- `FindBySlug`, `FindByID`, `Create`, `Update` (with search_vector regeneration), `Delete`
- `UpdateStatus` — Status transition
- `Search(query)` — Postgres full-text search using `websearch_to_tsquery`, weighted ranking (title A, excerpt B, body C)
- `Suggest(prefix)` — Autocomplete using prefix matching
- `FindPublishedByAuthor` — Public author posts

**`auth_repo.go`** — Auth token management:
- `StoreRefreshToken` — SHA-256 hashed storage with family_id tracking
- `ValidateRefreshToken` / `RevokeRefreshToken` / `RevokeTokenFamily` / `RevokeAllUserTokens`
- `CleanExpiredTokens` — Housekeeping
- `StoreEmailVerificationToken` / `VerifyEmailToken`
- `StoreEmailChangeToken` / `VerifyEmailChangeToken`
- `CreateSession` / `GetUserSessions` / `RevokeSession` / `UpdateSessionActivity`

**`engagement_repo.go`** — Engagement metrics:
- `GetStats`, `IncrementViews/Likes/Comments` (atomic upsert via `ON CONFLICT DO UPDATE`)
- `AddLike` / `RemoveLike` / `HasLiked` (user + guest support)
- `RecordView` — Logs each view with IP hash, user agent, referrer
- `GetDashboardStats` — Aggregated totals across all posts
- `GetTopPosts(orderBy, limit)` — Sortable by views/likes/comments
- `GetTrafficOverview` — Daily views (30 days), hourly views (24h), top referrers, top pages
- `GetPostDetailStats` — Per-post breakdown

**`comments_repo.go`** — Comments:
- `Create`, `FindByID`, `FindByPost` (with reply counts), `FindReplies`
- `FindAll` (admin filtered by post/status/search), `UpdateStatus`, `BulkUpdateStatus`, `SoftDelete`, `CountByPost`

**`affiliate_repo.go`** (~815 lines) — Full affiliate system:
- Settings: `GetSettings`, `UpdateSettings`
- Profiles: `GetProfileByUserID`, `CreateProfile`, `UpdateProfileStatus`, `UpdateProfilePayout`, `BlockAffiliate`, `FlagSuspicious`, `ListProfiles`
- Commissions: `GrantCommission` (transactional with hold period), `ListCommissions`, `ReleaseHeldCommissions` (calls DB function)
- Payouts: `HasActivePayout`, `CreatePayoutRequest`, `GetPayoutByID`, `ListPayoutsByUser`, `ListAllPayouts`, `ApprovePayout` (transactional balance movement), `RejectPayout`, `MarkPaid`
- Stats: `GetUserStats`, `GetAdminStats`
- Balance: `AdjustBalance` (admin credit/debit with audit trail)

**`referral_repo.go`** — Referral tracking:
- `RecordReferral`, `MarkVerified`, `GetStats`, `GetUserReferralStats`, `CheckIPReferralLimit`, `FindReferrerByCode`

**`saves_repo.go`** — Bookmarks + user features:
- `Toggle` (save/unsave with counter update), `IsSaved`, `ListByUser`, `GetSaveCount`, `EnsurePostStats`
- `ListLikedByUser`, `ListCommentsByUser`

**`author_request_repo.go`** — Author request workflow:
- `Create`, `GetByUserID`, `HasPending`, `List`, `Review` (auto-grants AUTHOR role on approval), `GetByID`

#### Redis Repositories (`internal/repository/redis/`)

**`cache.go`** — Generic caching:
- `Get[T]` / `Set` / `Delete` / `DeleteByPrefix` (using SCAN for wildcard invalidation)

**`engagement.go`** — Engagement dedup/tracking:
- `IsViewDuplicate(postID, ipHash)` — 30-minute TTL per IP per post
- `IsLikeDuplicate(postID, guestKey)` — Prevents rapid toggle
- `SetGuestLike` / `RemoveGuestLike` — 24-hour TTL for guest likes
- `CheckReferralIPLimit(ip, maxPerIP)` — Anti-fraud referral check

**`ratelimit.go`** — Sliding window rate limiter:
- `Allow(key, max, window)` — Uses sorted sets with timestamps
- `IsRateLimited(key, max, window)` — Read-only check
- **Fail-open**: returns allowed on Redis errors

### 4.7 HTTP Handlers (27 files)

#### Public Handlers (`handlers/public/`)

| Handler | Endpoints | Description |
|---------|-----------|-------------|
| `posts_handler.go` | `GET /posts`, `GET /posts/{slug}` | List published posts (filtered), get by slug |
| `engagement_handler.go` | `GET /posts/{id}/comments`, `POST /posts/{id}/comments`, `POST /posts/{id}/like`, `POST /posts/{id}/view`, `GET /posts/{id}/stats` | Comments (with reply preview), toggle like (user+guest), deduplicated views, post stats with has_liked |
| `categories_handler.go` | `GET /categories` | List all categories |
| `tags_handler.go` | `GET /tags` | List all tags |
| `search_handler.go` | `GET /search`, `GET /search/suggest` | Full-text search + autocomplete (2-120 chars) |
| `user_handler.go` | `GET /users/{id}`, `GET /users/{id}/posts` | Public user profile + published posts |
| `referral_handler.go` | `GET /ref/{code}` | Validate referral code, return redirect URL + cookie_days |
| `health_handler.go` | `GET /health` | DB + Redis ping check, returns ok/degraded |

#### Auth Handlers (`handlers/admin/`)

| Handler | Endpoints | Description |
|---------|-----------|-------------|
| `auth_handler.go` (~500 lines) | `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `POST /auth/verify-email`, `POST /auth/resend-verification`, `GET /auth/sessions`, `DELETE /auth/sessions/{id}` | Full auth flow: register (validate, Argon2id hash, referral check with IP abuse prevention, assign VIEWER role, generate email verification token), login (credential check, family-based token pair, session creation, audit log), refresh (rotation with reuse detection — revokes all tokens on reuse), logout, session management |
| `google_oauth_handler.go` | `POST /auth/google` | Validates Google access_token via userinfo API, finds/creates/links user, auto-assigns AUTHOR role, auto-verifies email |

#### Admin Handlers (`handlers/admin/`)

| Handler | Endpoints | Description |
|---------|-----------|-------------|
| `posts_handler.go` | CRUD + `POST /submit-review`, `POST /publish`, `POST /schedule` | Full post lifecycle with audit logging |
| `users_handler.go` | List, GetByID, Invite, UpdateRole, Disable, Enable, Sessions, RevokeSession | User management with temp password generation |
| `comments_handler.go` | List, Moderate, BulkModerate, Delete | Comment moderation with engagement counter sync |
| `stats_handler.go` | Dashboard, TopPosts, PostStats, TrafficOverview | Analytics endpoints |
| `referral_handler.go` | Stats | Referral statistics |
| `roles_handler.go` | List, Permissions, UpdatePermissions | Role/permission management |
| `audit_handler.go` | List | Audit log browser with filtering |
| `media_handler.go` | List, Upload, Delete | File upload (10MB max, year/month dirs), allowed: jpg/png/gif/svg/webp/mp4/webm/pdf |
| `ads_handler.go` | List, Create, Update, Delete, Toggle | Ad slot management |
| `affiliate_handler.go` (~300 lines) | GetSettings, UpdateSettings, GetStats, ListAffiliates, UpdateAffiliateStatus, BlockAffiliate, FlagSuspicious, AdjustBalance, ListPayouts, ApprovePayout, RejectPayout, MarkPaid, ReleaseHeldCommissions | Full admin affiliate management with payout state machine |
| `settings_handler.go` | Get, Update | Key-value site settings |
| `author_request_handler.go` | List, Review, GetByID | Admin-side author request review |

#### Author/User Handlers (`handlers/author/`)

| Handler | Endpoints | Description |
|---------|-----------|-------------|
| `profile_handler.go` | `GET /user/me`, `PATCH /user/me`, `POST /user/me/request-email-change`, `POST /user/me/confirm-email-change`, `POST /user/me/change-password` | Profile management, email change (with password verification + token), password change |
| `posts_handler.go` | List, GetByID, Create, Update, Delete, SubmitReview, Stats | Author's own posts only — edit restricted to DRAFT/CHANGES_REQUESTED, delete restricted to DRAFT |
| `user_features_handler.go` | ListSaved, ListLiked, ListMyComments, ToggleSave, CheckSaved | User engagement features |
| `affiliate_handler.go` (~300 lines) | GetProfile, Enroll, GetStats, GetSettings, RequestPayout, ListPayouts, ListCommissions, UpdatePayout | User-facing affiliate operations with encrypted payout display (masked) |
| `author_request_handler.go` | Create, GetStatus | Submit author request, check status |

### 4.8 Utilities & Observability

**`internal/utils/`**:
- `JSONResponse` / `JSONError` / `DecodeJSON` — Standard JSON helpers
- `QueryInt` / `QueryString` — URL query parameter extraction with defaults
- `NewID()` — 16-byte crypto/rand hex ID
- `Slugify(title)` — Unicode-aware, diacritics stripping, max 80 chars, handles CJK/Cyrillic
- `FormatISO(t)` / `NowUTC()` — Time utilities

**`internal/observability/`**:
- `metrics.go` — **PLACEHOLDER** (empty `InitMetrics()`, TODO comments)
- `tracing.go` — **PLACEHOLDER** (empty `InitTracing()`, TODO comments)

---

## 5. Database Schema (SQL Migrations)

10 migration files defining the complete schema:

### Tables Created

| Migration | Tables | Key Features |
|-----------|--------|--------------|
| `0001_init.sql` | `users`, `roles`, `permissions`, `role_permissions`, `user_roles`, `site_settings`, `audit_logs` | Extensions: pgcrypto, uuid-ossp. Seeds 5 roles (OWNER/ADMIN/EDITOR/AUTHOR/VIEWER) + 12 permissions. IDs via `encode(gen_random_bytes(16), 'hex')` |
| `0002_posts.sql` | `categories`, `tags`, `series`, `posts`, `post_tags`, `post_series`, `post_revisions`, `media` | Full-text search via `TSVECTOR` + trigger (`posts_search_vector_update`). Weighted: title=A, excerpt=B, body=C. GIN index. Seeds 5 categories + 10 tags |
| `0003_ads.sql` | `ad_slots` | 4 default positions: header, in_article_1, sidebar, footer |
| `0004_engagement.sql` | `auth_tokens`, `email_verification_tokens`, `password_reset_tokens`, `comments`, `likes`, `post_stats`, `post_views`, `referral_events`, `user_sessions` | ALTER users: adds email_verified_at, referral_code, referred_by, disabled_at, bio. Unique indices for one-like-per-user and one-like-per-guest. Denormalized post_stats counters. 11 additional permissions |
| `0005_google_oauth.sql` | - | ALTER users: adds auth_provider (default 'local'), google_sub, makes password_hash nullable |
| `0006_user_features.sql` | `saves`, `author_requests` | Bookmark system + author request workflow. Extends site_settings with 7 new keys. Adds saves_count to post_stats. 4 new permissions |
| `0006_affiliate_system_v2.sql` | `affiliate_balance_adjustments`, `referral_clicks` | Enhances affiliate system: hold periods, available/locked balances, anti-fraud flags, payout proof. DB function: `release_held_commissions()` |
| `0007_user_social_profile.sql` | - | ALTER users: adds 8 social profile fields (website, location, twitter, github, etc.) |
| `0008_email_change.sql` | `email_change_requests` | Email change token workflow |
| `004_affiliate_and_invites.sql` | `affiliate_settings`, `affiliate_profiles`, `affiliate_commissions`, `payout_requests`, `invites` | Core affiliate system tables + invite system. Encrypted payout fields. DO blocks for role-permission grants |

### Database Diagram (Simplified)

```
users ──┬── user_roles ── roles ── role_permissions ── permissions
        ├── posts ──┬── post_tags ── tags
        │           ├── post_series ── series
        │           ├── comments (self-ref parent_id)
        │           ├── likes
        │           ├── post_stats (denormalized)
        │           ├── post_views
        │           ├── post_revisions
        │           └── saves
        ├── auth_tokens (family-based rotation)
        ├── user_sessions
        ├── email_verification_tokens
        ├── password_reset_tokens
        ├── email_change_requests
        ├── referral_events
        ├── referral_clicks
        ├── affiliate_profiles ──┬── affiliate_commissions
        │                        └── payout_requests
        ├── affiliate_balance_adjustments
        ├── author_requests
        ├── audit_logs
        ├── invites
        └── media

site_settings (key-value)
ad_slots
affiliate_settings (singleton)
categories
tags
series
```

### Notable Schema Features
- **Text-based IDs**: Most tables use `encode(gen_random_bytes(16), 'hex')` — 32-char hex strings
- **Affiliate tables** use UUID (`gen_random_uuid()`) — inconsistent with the rest
- **Full-text search**: Trigger-based `search_vector` update on posts
- **Soft delete**: Comments use `deleted_at`, users use `disabled_at`
- **Denormalized counters**: `post_stats` table for views/likes/comments/saves counts

---

## 6. Next.js Web App (`apps/web`)

### 6.1 Stack & Configuration

- **Next.js 15.1** with App Router
- **React 19** (latest)
- **Tailwind CSS v4** (using `@import "tailwindcss"` + `@theme` blocks)
- **TypeScript 5.7**
- **ISR**: `revalidate = 60` on public pages
- **SSG-safe**: API calls have fallback data for build-time when API is offline
- Root layout: `lang="id"`, metadata with OG tags, site name "NetPulse"

### 6.2 Route Map (46 pages)

#### Public Routes `(public)/`
| Route | Description |
|-------|-------------|
| `/` (page.tsx) | Homepage: hero section with search, category grid, latest 6 posts |
| `/blog` | Blog listing page |
| `/posts/[slug]` | Post detail with SEO metadata, reading time, related posts, comments, likes, views, share, ads |
| `/categories` | Categories listing |
| `/tags` | Tags listing |
| `/about` | About page |
| `/terms` | Terms of service |
| `/u/[id]` | Public user profile |

#### Auth Routes `(auth)/`
| Route | Description |
|-------|-------------|
| `/auth/login` | Login page |
| `/auth/register` | Registration page |
| `/auth/verify-email` | Email verification |
| `/auth/forgot-password` | Password reset request |
| `/auth/reset-password` | Password reset form |

#### User Routes `(user)/` (auth required)
| Route | Description |
|-------|-------------|
| `/me` | User dashboard |
| `/me/profile` | Profile settings |
| `/me/settings` | Account settings |
| `/me/settings/security` | Security settings |
| `/me/articles` | Author's article list |
| `/me/posts` | Post management |
| `/me/posts/new` | Create new post |
| `/me/posts/[id]` | Edit post |
| `/me/saved` | Saved/bookmarked posts |
| `/me/likes` | Liked posts |
| `/me/comments` | Comment history |
| `/me/affiliate` | Affiliate dashboard |
| `/me/request-author` | Author request submission |
| `/write` | Write new post (editor) |
| `/write/[id]` | Edit existing post |

#### Admin Routes `(admin)/` (OWNER/ADMIN only)
| Route | Description |
|-------|-------------|
| `/admin` | Dashboard with stats cards, traffic chart, top posts, quick actions |
| `/admin/posts` | Post management |
| `/admin/posts/new` | Create post |
| `/admin/posts/[id]` | Edit post |
| `/admin/users` | User management |
| `/admin/comments` | Comment moderation |
| `/admin/categories` | Category management |
| `/admin/media` | Media library |
| `/admin/ads` | Ad slot management |
| `/admin/affiliate` | Affiliate management |
| `/admin/roles` | Role/permission management |
| `/admin/settings` | Site settings |
| `/admin/legal` | Legal pages |
| `/admin/seo` | SEO settings |
| `/admin/integrations` | Integration/N8N settings |
| `/admin/audit-logs` | Audit log browser |
| `/admin/author-requests` | Author request review |

#### Special Routes
| Route | Description |
|-------|-------------|
| `/ref/[code]` | Referral redirect page |
| `/api/...` | Next.js API routes (if any) |

### 6.3 Components (13 files)

| Component | Description |
|-----------|-------------|
| `layout/Navbar.tsx` (~700 lines) | Full-featured navbar: responsive, auto-hide on scroll, inline search with autocomplete + full search results, profile menu, mobile drawer |
| `layout/Footer.tsx` | Site footer |
| `layout/SearchBar.tsx` | Standalone search bar (hero variant) |
| `layout/ProfileMenu.tsx` | User profile dropdown |
| `ui/PostCard.tsx` | Post card with cover image, category badge (color-coded), author avatar, date |
| `editor/MarkdownEditor.tsx` (~508 lines) | Full markdown editor: toolbar (bold/italic/heading/link/image/code/table/list/quote/hr), live preview, image upload via drag-and-drop, keyboard shortcuts (Ctrl+B/I/K), word count + reading time, mobile write/preview tabs |
| `engagement/CommentSection.tsx` (~322 lines) | Threaded comment system: form (guest + authenticated), reply UI, pagination, relative time display |
| `engagement/Engagement.tsx` | `LikeButton`, `ViewTracker`, `PostStatsBar` components |
| `engagement/ArticleWidgets.tsx` | `ShareAndEngagement`, `NewsletterForm` |
| `engagement/ShareModal.tsx` | Share modal |
| `ads/AdSlot.tsx` | `HeaderAd`, `SidebarAd`, `FooterAd`, `ArticleBodyWithAds` |
| `admin/CommandPalette.tsx` | Admin command palette |
| `admin/NotificationDropdown.tsx` | Admin notification dropdown |

### 6.4 Lib / API Clients

| File | Description |
|------|-------------|
| `api-client.ts` | Public-facing SSR/SSG API client using `fetch` with ISR (revalidate: 60s). Methods: `getPosts`, `getPostBySlug`, `getCategories`, `getTags`, `search`, `suggest`, `getUserProfile`, `getUserPosts`, `getPublicSettings`. Fallback data for build-time safety. |
| `auth.ts` (~247 lines) | Client-side auth utilities: `localStorage`-based token/user storage, `login`, `loginWithGoogle`, `register`, `verifyEmail`, `resendVerification`, `refreshAccessToken` (with full rotation), `logout`, `forgotPassword`. Uses `authFetch` wrapper with auto-refresh on 401. |
| `auth-api.ts` (~498 lines) | Comprehensive API client: `authAPI` (login/register/google/logout), `userAPI` (profile, posts CRUD, affiliate ops, saved/liked/comments, author-request), `adminAPI` (all admin endpoints). Auto-refresh on 401, redirects to login on failure. |
| `engagement-client.ts` | Engagement API: `getComments`, `createComment`, `toggleLike`, `recordView`, `getStats`. Handles auth headers optionally. |
| `env.ts` | Environment helpers: `apiUrl`, `siteUrl`, `isProd` |

### 6.5 TypeScript Types

**`types/index.ts`** (~350+ lines) — Comprehensive type definitions:
- `Post`, `PostStatus`, `Category`, `Tag`, `Author`
- `PaginatedResult<T>`
- `TokenPair`, `AuthResponse`, `UserInfo`, `User`, `Role`, `Permission`
- `Comment`, `CommentStatus`, `PostStats`, `LikeResponse`
- `DashboardStats`, `TopPost`, `ReferralStats`, `TopReferrer`
- `AuditLogEntry`, `UserSession`
- `AffiliateSettings`, `AffiliateSettingsUpdate`, `AffiliateProfile`, `EnrollInput`, `Commission`, `AffiliateStats`, `TopAffiliate`, `AdminAffiliateStats`, `PayoutRequest`, `PayoutRequestInput`, `AdjustBalanceInput`, `BalanceAdjustment`
- `AuthorStats`, `SavedPost`, `SaveResponse`, `AuthorRequest`, `AuthorRequestStatus`
- `UserComment`, `PublicSiteSettings`

### 6.6 Styling

**`globals.css`** (224 lines):
- Custom design tokens via Tailwind v4 `@theme` block
- Brand colors: indigo palette (50-950) as `--color-brand-*`
- Surface colors, success/warning/danger palettes
- Prose typography styles for article body (h2, h3, p, a, code, pre, blockquote, lists, tables, images)
- Smooth scrolling, font smoothing, custom selection color

---

## 7. Shared Types Package

**`packages/shared-types/`** — `@netpulse/shared-types` v0.1.0

TypeScript-only package (no runtime dependencies) for documentation/type sharing:

- `src/index.ts`: `PostStatus`, `PostDTO`, `PaginatedResponse<T>`, `SearchSuggestion`, `APIError`
- `src/dto/index.ts`: `PostDTO`, `CreatePostDTO`, `UpdatePostDTO`, `CategoryDTO`, `TagDTO`, `UserDTO`, `TokenPairDTO`

Not currently imported by the web app (web uses its own `types/index.ts`).

---

## 8. Infrastructure & DevOps

### Docker Compose (`docker-compose.yml`)

4 services:
1. **postgres** (16-alpine): Port 5432, volume `pgdata`, health check via `pg_isready`
2. **redis** (7-alpine): Port 6379, volume `redisdata`, health check via `redis-cli ping`
3. **api**: Builds from `apps/api/Dockerfile`, port 8080, depends on postgres+redis (healthy)
4. **web**: Builds from `infra/docker/web.Dockerfile`, port 3000, depends on api

### Makefile

Targets: `dev-up`, `dev-down`, `api-run`, `web-dev`, `migrate-up`, `migrate-down`, `seed`, `backup`, `clean`, `build`

### Nginx (`infra/nginx/nginx.conf`)

Reverse proxy configuration forwarding to api (port 8080) and web (port 3000).

### Cloudflare (`infra/cloudflare/`)

Documentation for: cache rules, rate limit rules, WAF rules.

### Dockerfiles

- `apps/api/Dockerfile`: Multi-stage Go build, scratch runtime
- `infra/docker/web.Dockerfile`: Next.js build + standalone output

---

## 9. Scripts

| Script | Purpose |
|--------|---------|
| `scripts/dev.sh` | Start dev environment: check Docker, copy .env, start postgres+redis, run migrations, print instructions |
| `scripts/migrate.sh` | Run SQL migrations: loads .env, iterates `*.sql` files in order, supports `up` (default) and `down` (TODO) |
| `scripts/backup_db.sh` | Database backup: `pg_dump | gzip`, stores in `./backups/`, retains last 10 |
| `scripts/seed.sh` (~828 lines) | Comprehensive seeder: creates 6 users (OWNER/EDITOR/2×AUTHOR/2×VIEWER), 3 series, 8+ posts (various statuses), engagement data (views/likes/comments), affiliate profiles, commissions, referral events, author requests. Uses pre-computed Argon2id hashes. |

---

## 10. Patterns & Conventions

### Architecture Patterns
1. **Clean(ish) Architecture**: Domain models → Repository interfaces → Postgres/Redis implementations → Handlers
2. **Only `posts` has a Service layer** — all other domains go Handler → Repository directly
3. **Handler receives repository** instances (dependency injection via constructor)
4. **Central wiring** in `bootstrap/http.go` (no DI framework)

### Naming Conventions
- **Go files**: `snake_case.go`
- **Go packages**: single lowercase word
- **Go structs/methods**: PascalCase
- **DB columns**: `snake_case`
- **JSON responses**: `snake_case`
- **API routes**: kebab-case (`/audit-logs`, `/author-request`)
- **TypeScript files**: kebab-case with extensions `.ts` / `.tsx`

### Error Handling
- Go: errors are returned up the call chain, handlers convert to HTTP JSON errors
- No custom error types — uses `fmt.Errorf` and `errors.New`
- Redis operations fail-open (degrade gracefully)

### Authentication Flow
1. Register → hash Argon2id → create user → assign VIEWER → generate email verification token
2. Login → verify credentials → generate token pair (access + refresh) → create session → audit log
3. Refresh → validate refresh token → check not revoked → generate new pair → revoke old token → **if reused, revoke entire family**
4. Google OAuth → validate via Google API → find/create/link user → grant AUTHOR role → auto-verify email

### Post Workflow
```
DRAFT → IN_REVIEW → CHANGES_REQUESTED → (back to DRAFT)
             ↓
         PUBLISHED → ARCHIVED
             ↑
         SCHEDULED → (auto-publish at scheduled_at)
```

### Affiliate Payout State Machine
```
PENDING → APPROVED → PROCESSING → PAID
    ↓         ↓
 REJECTED  REJECTED (returns balance to available)
```

---

## 11. Implementation Status

### Fully Implemented ✅
- User registration, login, logout, session management
- Google OAuth (login + register + account linking)
- Email verification flow
- JWT access/refresh with rotation + reuse detection
- RBAC with 5 roles + granular permissions
- Post CRUD with editorial workflow (DRAFT → IN_REVIEW → PUBLISHED)
- Full-text search + autocomplete
- Categories, tags, series
- Comments (threaded, guest + authenticated, moderation, bulk actions)
- Likes (user + guest, toggle)
- Views (deduplicated via Redis, 30min TTL)
- Post stats (denormalized counters)
- Saves/bookmarks
- Media upload (10MB limit, file type validation)
- Ad slot management
- Site settings (key-value)
- Audit logging
- Author request workflow (VIEWER → AUTHOR)
- Full affiliate system (enrollment, commissions, hold periods, payouts, anti-fraud)
- Referral tracking with IP abuse detection
- Admin dashboard with traffic analytics
- Rate limiting (Redis sliding window)
- Security headers
- Public user profiles with social links
- Email change workflow
- Password change
- User invite system
- Comprehensive seed data

### Partially Implemented / Stubs 🔶
- **Observability**: `metrics.go` and `tracing.go` are empty TODO stubs
- **Password reset**: Token table exists, `forgotPassword`/`resetPassword` in frontend auth, but backend handler not found
- **Scheduled post auto-publish**: Status exists but no cron/scheduler implementation found
- **Held commission auto-release**: DB function exists but no cron/scheduler to call it
- **Down migrations**: `migrate.sh down` says "TODO"
- **Series**: Tables + seed data exist but no handler endpoints for CRUD
- **Post revisions**: Table exists but no repository/handler implementation
- **Invites**: Table exists, permissions exist, but handler implementation not found in the handler files
- **Shared types package**: Not imported by web app

### Not Implemented ❌
- **Email sending**: No email service integration (verification tokens returned in API response — dev mode)
- **2FA/TOTP**: Fields exist in users table but no implementation
- **Metrics/Tracing**: OpenTelemetry/Prometheus placeholders only
- **Tests**: No Go test files, `npm test` echoes "No tests yet"
- **CI/CD pipeline**: No GitHub Actions or similar
- **Image optimization**: No CDN integration for uploaded media
- **Webhook/N8N integration**: Admin page exists but no backend implementation

---

## 12. Potential Issues & Notes

### Schema Inconsistencies
1. **Mixed ID types**: Most tables use `encode(gen_random_bytes(16), 'hex')` (TEXT), but affiliate tables use `gen_random_uuid()` (UUID). `email_change_requests` uses UUID for both `id` and `user_id` columns referencing `users(id)` which is TEXT — this will cause a type mismatch error.
2. **Duplicate migration numbering**: Both `0006_user_features.sql` and `0006_affiliate_system_v2.sql` share the `0006` prefix.
3. **Legacy migration**: `004_affiliate_and_invites.sql` (without leading zero) runs alongside `0004_engagement.sql`.
4. **Duplicate permission names**: Multiple migrations insert permissions with different ID formats (some use hardcoded IDs, some use `gen_random_uuid()`), with `ON CONFLICT DO NOTHING` safety.

### Security Notes
5. **Token in response**: Email verification tokens are returned directly in the register API response (dev convenience — should be emailed in production).
6. **No CSRF protection**: API relies on Bearer tokens only (acceptable for SPA + API architecture).
7. **localStorage for tokens**: JWTs stored in localStorage (vulnerable to XSS, but standard SPA pattern).
8. **Encryption key**: AES-GCM key loaded from env var — rotation mechanism not implemented.

### Code Quality
9. **Large files**: `repos.go` (926 lines), `seed.sh` (828 lines), `Navbar.tsx` (699 lines), `admin/page.tsx` (830 lines) could benefit from splitting.
10. **Duplicate auth code**: Both `auth.ts` and `auth-api.ts` implement login/register/refresh — overlapping functionality.
11. **No service layer for most domains**: Only `posts` has a service — other domains have handlers calling repos directly.
12. **Error swallowing**: Many handlers ignore subsidiary errors (e.g., `_ = h.auditRepo.Log(...)`)

### Performance
13. **N+1 queries**: Some list endpoints load permissions per-user in the query (via `loadUserPermissions`)
14. **No connection pool config for Redis**: Uses default Redis client settings
15. **Global rate limit only**: No per-endpoint rate limit configuration (single `max` and `window` for all)

---

*End of report.*
