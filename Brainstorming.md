# NetPulse — Brainstorming (Opsi C: Next.js + Go API + Postgres + Redis + Cloudflare)

## 1) Visi Produk

**RapidWire** = blog seputar _network & dunia internet_ yang:

- SEO kuat (mudah tembus Google)
- Multi-author + workflow editorial (draft → review → publish)
- Admin panel kompleks (semua controller lengkap)
- Siap AdSense & monetisasi (slot iklan, ads.txt, aturan tampil iklan)
- Aman (auth kuat, audit log, enkripsi data sensitif)
- Tahan traffic & basic anti-DDoS (CDN/WAF + rate limit + caching)

---

## 2) Target User & Role

### Tipe user

- **Pengunjung**: baca artikel, cari, share
- **Member (opsional)**: subscribe newsletter, bookmark (bisa phase 2)
- **Author**: nulis draft, edit milik sendiri
- **Editor/Reviewer**: review, request changes, schedule publish
- **Admin/Owner**: manage user/role, kategori, iklan, setting, audit

### RBAC (Role-Based Access Control)

Role minimal:

- `OWNER`
- `ADMIN`
- `EDITOR`
- `AUTHOR`
- `VIEWER` (internal, opsional)

Permission contoh:

- Post: `create`, `edit_any`, `publish`, `schedule`, `delete`
- User: `invite`, `disable`, `reset_2fa`, `set_role`
- Ads: `manage_slots`, `manage_ads_txt`
- Settings: `site_config`, `seo_defaults`

---

## 3) Konten & Workflow Editorial

### State artikel

- `DRAFT`
- `IN_REVIEW`
- `CHANGES_REQUESTED`
- `SCHEDULED`
- `PUBLISHED`
- `ARCHIVED`

### Fitur konten (Phase 1)

- Post (markdown/MDX) + cover image
- Category + Tag + Series (opsional)
- Slug unik + canonical
- Revisions (riwayat)
- Autosave draft
- Internal notes (khusus tim)

### Fitur konten (Phase 2)

- Komentar + moderation
- Newsletter
- Multi-language (ID/EN)

---

## 4) SEO & AdSense Readiness

### SEO wajib

- SSR/ISR untuk halaman post & category
- `sitemap.xml` otomatis
- `robots.txt`
- OpenGraph + Twitter cards
- Canonical + structured data (Article schema)
- Internal linking (related posts)

### AdSense readiness checklist (produk)

- Halaman legal: `Privacy Policy`, `Terms`, `Contact`, `About`
- `ads.txt` di root domain (managed dari admin)
- Slot iklan:
  - `header`
  - `in_article_1` (mis. setelah paragraf ke-3)
  - `sidebar`
  - `footer`
- Rule iklan:
  - nonaktif di halaman tertentu (legal pages)
  - nonaktif untuk kategori tertentu (opsional)

---

## 5) Arsitektur Teknis (Opsi C)

### Frontend

- **Next.js** (App Router)
- Strategy:
  - Public pages: SSG/ISR (cepat, SEO top)
  - Admin pages: SSR (auth required) atau SPA di `/admin`
- Image optimization (Next Image) + CDN

### Backend API

- **Golang** (Echo/Fiber/Chi)
- Modul:
  - Auth & Session
  - Content (posts/categories/tags)
  - Media upload
  - Ads & Config
  - Audit log

### Database

- **Postgres**
- **Redis**
  - rate limiting
  - caching query populer
  - session/refresh token storage (opsional)
  - queue ringan (opsional)

### Edge / Infra

- **Cloudflare**:
  - CDN caching
  - WAF rules
  - bot fight mode / challenge
  - rate limit (lapisan pertama)
- Origin:
  - Nginx (opsional) sebagai reverse proxy
  - Docker compose / k8s (phase 2)

---

## 6) Security Design

### Auth

- Password: **Argon2id** hashing (bukan encrypt)
- Login:
  - email + password
  - 2FA (TOTP) untuk admin/editor (phase 1 atau 2)
- Token:
  - access token pendek (15m)
  - refresh token panjang (7–30d) + rotate
  - simpan refresh token hash di DB/Redis

### Proteksi umum

- Rate limit endpoint sensitif: login, register/invite, upload
- CSRF (kalau pakai cookie-based session)
- XSS: sanitize output + strict CSP
- Upload:
  - validasi mime
  - scanning (phase 2)
  - signed URL (jika pakai S3/R2)

### Encryption data sensitif (field-level)

Gunakan AES-GCM untuk:

- API keys integrasi
- secret per-user tertentu
  Kunci:
- environment variable + rotation plan (phase 2)

### Audit & Monitoring

- Audit log: siapa melakukan apa, kapan, dari IP mana
- Alert: repeated failed login, suspicious publish spike
- Log: structured JSON

---

## 7) Model Data (High-Level)

Entitas inti:

- `users`
- `roles`, `permissions`, `role_permissions`, `user_roles`
- `posts`
- `post_revisions`
- `categories`, `tags`, `post_tags`, `series`, `post_series`
- `media`
- `site_settings`
- `ad_slots`, `ads_txt`
- `audit_logs`

---

## 8) API Surface (Draft)

### Public

- `GET /posts` (filter category/tag, pagination)
- `GET /posts/:slug`
- `GET /categories`
- `GET /tags`
- `GET /sitemap.xml` (atau generated via Next)

### Admin

- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`

- `POST /admin/posts`
- `PATCH /admin/posts/:id`
- `POST /admin/posts/:id/submit-review`
- `POST /admin/posts/:id/publish`
- `POST /admin/posts/:id/schedule`

- `POST /admin/users/invite`
- `PATCH /admin/users/:id/role`

- `GET /admin/audit-logs`
- `GET /admin/settings`
- `PATCH /admin/settings`

- `GET /admin/ads/slots`
- `PATCH /admin/ads/slots`
- `GET /admin/ads/ads-txt`
- `PATCH /admin/ads/ads-txt`

---

## 9) Admin Panel Modules (Controller List)

- Dashboard (stats, drafts, scheduled)
- Posts (CRUD + workflow + revisions)
- Categories & Tags
- Media Library
- Users & Roles (RBAC)
- Ads Manager (slots + ads.txt)
- SEO Defaults (site title, meta default, OG image)
- Site Settings (branding, theme, social links)
- Audit Log Viewer
- Security (2FA settings, session list, rate limit status)

---

## 10) Performance Plan

- ISR/SSG untuk public pages (Next)
- Redis cache:
  - `posts:list:category:page`
  - `post:slug`
- Cache invalidation:
  - publish/schedule → purge Redis + Cloudflare purge by tag/URL
- DB indexing:
  - index on `slug`, `status`, `published_at`, `category_id`
- Search (Phase 2):
  - Postgres full-text search atau Meilisearch

---

## 11) MVP Scope (Phase 1: cepat rilis)

Wajib:

- Multi-author + RBAC basic
- Workflow: draft → review → publish + schedule
- SEO: sitemap, OG, canonical, schema
- Ads manager: slot + ads.txt
- Cloudflare + rate limit login
- Audit log basic

Nice-to-have:

- Revisions diff
- 2FA untuk admin
- Search basic

---

## 12) Pertanyaan Keputusan (biar desain final mantap)

(isi nanti pas kita lanjut implementasi)

- Editor review wajib atau optional?
- Konten pakai Markdown/MDX atau rich text editor?
- Media storage: local disk dulu atau langsung Cloudflare R2/S3?
- Comment ada di Phase 1 atau Phase 2?
