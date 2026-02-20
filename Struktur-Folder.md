# NetPulse — Struktur Folder Repo (Monorepo)

> Target: Opsi C (Next.js + Go API + Postgres + Redis + Cloudflare)
> Fokus: rapi, scalable, siap production, mudah di-maintain.

---

## 0) Root

netpulse/
├─ apps/
├─ packages/
├─ infra/
├─ docs/
├─ scripts/
├─ .github/
├─ .env.example
├─ docker-compose.yml
├─ Makefile
├─ README.md
└─ LICENSE

---

## 1) Apps

### 1.1 Web (Next.js)

apps/web/
├─ src/
│ ├─ app/
│ │ ├─ (public)/
│ │ │ ├─ page.tsx
│ │ │ ├─ posts/
│ │ │ │ └─ [slug]/
│ │ │ │ └─ page.tsx
│ │ │ ├─ categories/
│ │ │ ├─ tags/
│ │ │ └─ series/
│ │ ├─ (admin)/
│ │ │ ├─ admin/
│ │ │ │ ├─ layout.tsx
│ │ │ │ ├─ page.tsx
│ │ │ │ ├─ posts/
│ │ │ │ ├─ media/
│ │ │ │ ├─ users/
│ │ │ │ ├─ roles/
│ │ │ │ ├─ ads/
│ │ │ │ ├─ seo/
│ │ │ │ ├─ settings/
│ │ │ │ └─ audit-logs/
│ │ ├─ api/
│ │ │ ├─ sitemap/route.ts
│ │ │ └─ robots/route.ts
│ │ └─ layout.tsx
│ ├─ components/
│ │ ├─ ui/
│ │ ├─ layout/
│ │ ├─ editor/
│ │ └─ ads/
│ ├─ features/
│ │ ├─ posts/
│ │ ├─ auth/
│ │ ├─ admin/
│ │ └─ seo/
│ ├─ lib/
│ │ ├─ api-client.ts
│ │ ├─ auth.ts
│ │ ├─ env.ts
│ │ └─ validators/
│ ├─ styles/
│ └─ types/
├─ public/
│ ├─ images/
│ └─ favicon.ico
├─ next.config.ts
├─ package.json
└─ tsconfig.json

Catatan:

- Halaman public fokus SEO: SSG/ISR.
- Halaman admin: SSR/SPA dengan auth (token/cookie httpOnly).

---

### 1.2 API (Golang)

apps/api/
├─ cmd/
│ └─ server/
│ └─ main.go
├─ internal/
│ ├─ config/
│ │ ├─ config.go
│ │ └─ env.go
│ ├─ bootstrap/
│ │ ├─ http.go
│ │ ├─ db.go
│ │ ├─ redis.go
│ │ └─ logger.go
│ ├─ http/
│ │ ├─ middleware/
│ │ │ ├─ auth.go
│ │ │ ├─ rbac.go
│ │ │ ├─ rate_limit.go
│ │ │ ├─ request_id.go
│ │ │ ├─ security_headers.go
│ │ │ └─ recover.go
│ │ ├─ routes/
│ │ │ ├─ public.go
│ │ │ └─ admin.go
│ │ └─ handlers/
│ │ ├─ health_handler.go
│ │ ├─ public/
│ │ │ ├─ posts_handler.go
│ │ │ ├─ categories_handler.go
│ │ │ └─ tags_handler.go
│ │ └─ admin/
│ │ ├─ auth_handler.go
│ │ ├─ posts_handler.go
│ │ ├─ media_handler.go
│ │ ├─ users_handler.go
│ │ ├─ roles_handler.go
│ │ ├─ ads_handler.go
│ │ ├─ seo_handler.go
│ │ ├─ settings_handler.go
│ │ └─ audit_logs_handler.go
│ ├─ domain/
│ │ ├─ posts/
│ │ │ ├─ model.go
│ │ │ ├─ service.go
│ │ │ └─ policy.go
│ │ ├─ users/
│ │ ├─ roles/
│ │ ├─ ads/
│ │ ├─ settings/
│ │ └─ audit/
│ ├─ repository/
│ │ ├─ postgres/
│ │ │ ├─ posts_repo.go
│ │ │ ├─ users_repo.go
│ │ │ ├─ roles_repo.go
│ │ │ ├─ ads_repo.go
│ │ │ ├─ settings_repo.go
│ │ │ └─ audit_repo.go
│ │ └─ redis/
│ │ ├─ cache.go
│ │ ├─ rate_limit_store.go
│ │ └─ session_store.go
│ ├─ security/
│ │ ├─ password.go # argon2id/bcrypt wrapper
│ │ ├─ tokens.go # access/refresh logic
│ │ ├─ encryption.go # AES-GCM field encryption
│ │ └─ totp.go # 2FA (opsional)
│ ├─ utils/
│ │ ├─ timeutil.go
│ │ ├─ slug.go
│ │ └─ paginator.go
│ └─ observability/
│ ├─ metrics.go
│ └─ tracing.go
├─ migrations/
│ ├─ 0001_init.sql
│ ├─ 0002_posts.sql
│ └─ 0003_rbac.sql
├─ api/
│ └─ openapi.yaml
├─ test/
│ ├─ integration/
│ └─ fixtures/
├─ go.mod
├─ go.sum
└─ Dockerfile

Catatan:

- Struktur `internal/` menjaga boundary (tidak bocor sebagai public package).
- Handlers tipis → panggil Service/Domain.
- Repository pisah Postgres & Redis.

---

## 2) Packages (shared)

packages/
├─ shared-types/
│ ├─ src/
│ │ ├─ dto/
│ │ └─ index.ts
│ └─ package.json
└─ eslint-config/ (opsional)
└─ package.json

Tujuan:

- DTO/Type yang dipakai bareng FE & BE (jika kamu mau konsisten).

---

## 3) Infra (deploy & ops)

infra/
├─ cloudflare/
│ ├─ waf-rules.md
│ ├─ rate-limit.md
│ └─ cache-rules.md
├─ nginx/
│ ├─ nginx.conf
│ └─ sites-enabled/
├─ docker/
│ ├─ web.Dockerfile
│ └─ api.Dockerfile
└─ k8s/ (phase 2)
├─ web.yaml
├─ api.yaml
├─ postgres.yaml
└─ redis.yaml

---

## 4) Docs

docs/
├─ architecture.md
├─ api.md
├─ database.md
├─ security.md
├─ seo-adsense.md
├─ runbook.md
└─ decisions/
├─ 0001-tech-stack.md
└─ 0002-auth-strategy.md

---

## 5) Scripts

scripts/
├─ dev.sh
├─ migrate.sh
├─ seed.sh
└─ backup_db.sh

---

## 6) File penting

.env.example
docker-compose.yml
Makefile

### docker-compose.yml (minimal service)

- postgres
- redis
- api
- web

---

## 7) Naming & Konvensi

- Endpoint admin selalu prefix: `/admin/*`
- Public API: `/posts`, `/categories`, `/tags`
- Semua config via env (12-factor)
- Log JSON + request_id untuk tracing

---

## 8) Next step (setelah folder jadi)

- Buat `docker-compose.yml` + `.env.example`
- Buat `openapi.yaml` draft
- Buat migrasi DB awal (`0001_init.sql`)
