-- Migration 0006: User features — saves/bookmarks, author requests, site settings extensions
-- Adds saves, author_requests tables, and extends site_settings for legal/affiliate content

BEGIN;

-- ══════════════════════════════════════════════════════
-- SAVES / BOOKMARKS
-- ══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS saves (
    id         TEXT PRIMARY KEY DEFAULT encode(gen_random_bytes(16), 'hex'),
    user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id    TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_saves_user_post ON saves(user_id, post_id);
CREATE INDEX IF NOT EXISTS idx_saves_user ON saves(user_id);
CREATE INDEX IF NOT EXISTS idx_saves_post ON saves(post_id);

-- ══════════════════════════════════════════════════════
-- AUTHOR REQUESTS
-- ══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS author_requests (
    id          TEXT PRIMARY KEY DEFAULT encode(gen_random_bytes(16), 'hex'),
    user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status      TEXT NOT NULL DEFAULT 'PENDING'
                CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    reason      TEXT NOT NULL DEFAULT '',          -- user's reason for requesting
    admin_note  TEXT NOT NULL DEFAULT '',           -- admin feedback on approval/rejection
    reviewed_by TEXT REFERENCES users(id),          -- admin who reviewed
    reviewed_at TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_author_requests_user   ON author_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_author_requests_status ON author_requests(status);

-- ══════════════════════════════════════════════════════
-- EXTEND SITE SETTINGS — legal, affiliate how-it-works
-- ══════════════════════════════════════════════════════
INSERT INTO site_settings (key, value) VALUES
    ('affiliate_how_it_works', ''),
    ('social_facebook', ''),
    ('social_instagram', ''),
    ('social_youtube', ''),
    ('social_linkedin', ''),
    ('footer_text', ''),
    ('about_page', '')
ON CONFLICT (key) DO NOTHING;

-- ══════════════════════════════════════════════════════
-- ADD POST STATS for saves
-- ══════════════════════════════════════════════════════
ALTER TABLE post_stats ADD COLUMN IF NOT EXISTS saves_count BIGINT NOT NULL DEFAULT 0;

-- ══════════════════════════════════════════════════════
-- ADDITIONAL PERMISSIONS for new features
-- ══════════════════════════════════════════════════════
INSERT INTO permissions (id, name, module) VALUES
    (encode(gen_random_bytes(16), 'hex'), 'author_requests.manage', 'users'),
    (encode(gen_random_bytes(16), 'hex'), 'legal.manage',          'settings'),
    (encode(gen_random_bytes(16), 'hex'), 'saves.own',             'engagement'),
    (encode(gen_random_bytes(16), 'hex'), 'likes.own',             'engagement')
ON CONFLICT (name) DO NOTHING;

-- Grant new permissions to ADMIN/OWNER
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'role_owner', id FROM permissions
WHERE name IN ('author_requests.manage', 'legal.manage', 'saves.own', 'likes.own')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT 'role_admin', id FROM permissions
WHERE name IN ('author_requests.manage', 'legal.manage', 'saves.own', 'likes.own')
ON CONFLICT DO NOTHING;

-- All users get saves/likes
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'role_viewer', id FROM permissions
WHERE name IN ('saves.own', 'likes.own')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT 'role_author', id FROM permissions
WHERE name IN ('saves.own', 'likes.own')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT 'role_editor', id FROM permissions
WHERE name IN ('saves.own', 'likes.own')
ON CONFLICT DO NOTHING;

COMMIT;
