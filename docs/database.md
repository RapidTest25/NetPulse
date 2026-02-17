# NetPulse — Database Documentation

## ERD (Entity Relationship)

### Core Tables

- `users` — User accounts
- `roles` — RBAC roles (OWNER, ADMIN, EDITOR, AUTHOR, VIEWER)
- `permissions` — Granular permissions
- `role_permissions` — Role-permission mapping
- `user_roles` — User-role mapping
- `posts` — Blog articles with editorial workflow
- `post_revisions` — Version history
- `categories` — Post categories
- `tags` — Post tags
- `post_tags` — Post-tag junction
- `series` — Article series
- `post_series` — Post-series junction
- `media` — Uploaded files
- `site_settings` — Key-value site configuration
- `ad_slots` — AdSense slot management
- `audit_logs` — Audit trail

## Full-Text Search

Posts have a `search_vector` column (tsvector) with a GIN index.

**Weights**:

- A: title (highest relevance)
- B: excerpt
- C: body

**Trigger**: Auto-updates on INSERT/UPDATE via `posts_search_vector_update()`

**Query**: Uses `websearch_to_tsquery` for user-friendly search syntax.

## Indexes

| Table | Column(s)     | Type  | Purpose            |
| ----- | ------------- | ----- | ------------------ |
| posts | slug          | btree | Fast slug lookup   |
| posts | status        | btree | Filter by status   |
| posts | published_at  | btree | Sort by date       |
| posts | author_id     | btree | Filter by author   |
| posts | category_id   | btree | Filter by category |
| posts | search_vector | gin   | Full-text search   |
| users | email         | btree | Login lookup       |

## Migration Strategy

Migrations are in `apps/api/migrations/` with sequential numbering.
Run via `scripts/migrate.sh` using psql.
