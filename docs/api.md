# NetPulse — API Documentation

## Base URL

- Development: `http://localhost:8080`
- Production: `https://api.netpulse.com`

## Authentication

All admin endpoints require `Authorization: Bearer <access_token>` header.

---

## Public Endpoints

### GET /health

Health check.

**Response**: `{ "status": "ok", "postgres": true, "redis": true }`

### GET /posts

List published posts.

**Query Parameters**:
| Param | Type | Default | Description |
|----------|--------|----------|----------------------|
| page | int | 1 | Page number |
| limit | int | 10 | Items per page (max 50) |
| sort | string | newest | `newest` or `oldest` |
| category | string | | Filter by category ID |
| tag | string | | Filter by tag ID |

**Response**: `{ items: Post[], page, limit, total, total_pages }`

### GET /posts/:slug

Get a single published post by slug.

### GET /categories

List all categories.

### GET /tags

List all tags.

### GET /search?q=...

Full-text search across published posts.

**Query**: `q` (required, max 120 chars), `page`, `limit`, `sort` (relevance|newest)

### GET /search/suggest?q=...

Autocomplete suggestions (min 2 chars).

---

## Auth Endpoints

### POST /auth/login

**Body**: `{ "email": "...", "password": "..." }`
**Response**: `{ "access_token": "...", "refresh_token": "...", "expires_in": 900 }`

### POST /auth/refresh

**Body**: `{ "refresh_token": "..." }`

### POST /auth/logout

---

## Admin Endpoints (Protected)

### Posts

- `GET /admin/posts` — List all posts (any status)
- `POST /admin/posts` — Create draft
- `GET /admin/posts/:id` — Get by ID
- `PATCH /admin/posts/:id` — Update
- `DELETE /admin/posts/:id` — Delete
- `POST /admin/posts/:id/submit-review` — Submit for review
- `POST /admin/posts/:id/publish` — Publish
- `POST /admin/posts/:id/schedule` — Schedule (`{ "scheduled_at": "..." }`)

### Users

- `GET /admin/users` — List users
- `POST /admin/users/invite` — Invite user
- `GET /admin/users/:id` — Get user
- `PATCH /admin/users/:id/role` — Change role
- `PATCH /admin/users/:id/disable` — Disable account

### Settings

- `GET /admin/settings` — Get all settings
- `PATCH /admin/settings` — Update settings (`{ "key": "value" }`)
