-- NetPulse: Engagement, Auth Tokens, Email Verification, Referrals, Comments, Likes, Views
-- Migration 0004

-- ══════════════════════════════════════════════════════
-- ALTER USERS: add email verification, referral, soft delete
-- ══════════════════════════════════════════════════════
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code     TEXT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by       TEXT REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS disabled_at       TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio               TEXT DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);
CREATE INDEX IF NOT EXISTS idx_users_referred_by   ON users(referred_by);

-- ══════════════════════════════════════════════════════
-- AUTH TOKENS — refresh token rotation tracking
-- ══════════════════════════════════════════════════════
CREATE TABLE auth_tokens (
    id                 BIGSERIAL PRIMARY KEY,
    user_id            TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token_hash TEXT NOT NULL,
    family_id          TEXT NOT NULL,  -- token family for rotation detection
    expires_at         TIMESTAMPTZ NOT NULL,
    revoked_at         TIMESTAMPTZ,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ip_address         TEXT DEFAULT '',
    user_agent         TEXT DEFAULT ''
);

CREATE INDEX idx_auth_tokens_user    ON auth_tokens(user_id);
CREATE INDEX idx_auth_tokens_family  ON auth_tokens(family_id);
CREATE INDEX idx_auth_tokens_hash    ON auth_tokens(refresh_token_hash);

-- ══════════════════════════════════════════════════════
-- EMAIL VERIFICATION TOKENS
-- ══════════════════════════════════════════════════════
CREATE TABLE email_verification_tokens (
    id         BIGSERIAL PRIMARY KEY,
    user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at    TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_email_verification_user  ON email_verification_tokens(user_id);
CREATE INDEX idx_email_verification_hash  ON email_verification_tokens(token_hash);

-- ══════════════════════════════════════════════════════
-- PASSWORD RESET TOKENS
-- ══════════════════════════════════════════════════════
CREATE TABLE password_reset_tokens (
    id         BIGSERIAL PRIMARY KEY,
    user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at    TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_password_reset_user ON password_reset_tokens(user_id);
CREATE INDEX idx_password_reset_hash ON password_reset_tokens(token_hash);

-- ══════════════════════════════════════════════════════
-- COMMENTS
-- ══════════════════════════════════════════════════════
CREATE TABLE comments (
    id          TEXT PRIMARY KEY DEFAULT encode(gen_random_bytes(16), 'hex'),
    post_id     TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id     TEXT REFERENCES users(id) ON DELETE SET NULL,
    parent_id   TEXT REFERENCES comments(id) ON DELETE CASCADE,
    guest_name  TEXT DEFAULT '',
    guest_email TEXT DEFAULT '',
    content     TEXT NOT NULL,
    status      TEXT NOT NULL DEFAULT 'PENDING'
                CHECK (status IN ('PENDING', 'APPROVED', 'SPAM', 'REJECTED')),
    ip_address  TEXT DEFAULT '',
    user_agent  TEXT DEFAULT '',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at  TIMESTAMPTZ
);

CREATE INDEX idx_comments_post     ON comments(post_id);
CREATE INDEX idx_comments_user     ON comments(user_id);
CREATE INDEX idx_comments_parent   ON comments(parent_id);
CREATE INDEX idx_comments_status   ON comments(status);
CREATE INDEX idx_comments_created  ON comments(created_at DESC);

-- ══════════════════════════════════════════════════════
-- LIKES
-- ══════════════════════════════════════════════════════
CREATE TABLE likes (
    id         TEXT PRIMARY KEY DEFAULT encode(gen_random_bytes(16), 'hex'),
    post_id    TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id    TEXT REFERENCES users(id) ON DELETE CASCADE,
    guest_key  TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique: one like per user per post
CREATE UNIQUE INDEX idx_likes_user_post  ON likes(post_id, user_id) WHERE user_id IS NOT NULL;
-- Unique: one like per guest per post
CREATE UNIQUE INDEX idx_likes_guest_post ON likes(post_id, guest_key)  WHERE guest_key != '' AND user_id IS NULL;
CREATE INDEX idx_likes_post ON likes(post_id);

-- ══════════════════════════════════════════════════════
-- POST STATS (denormalized counters for performance)
-- ══════════════════════════════════════════════════════
CREATE TABLE post_stats (
    post_id        TEXT PRIMARY KEY REFERENCES posts(id) ON DELETE CASCADE,
    views_count    BIGINT NOT NULL DEFAULT 0,
    likes_count    BIGINT NOT NULL DEFAULT 0,
    comments_count BIGINT NOT NULL DEFAULT 0,
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Initialize stats for existing posts
INSERT INTO post_stats (post_id, views_count, likes_count, comments_count)
SELECT id, 0, 0, 0 FROM posts
ON CONFLICT (post_id) DO NOTHING;

-- ══════════════════════════════════════════════════════
-- VIEWS LOG (optional — for analytics; daily aggregate)
-- ══════════════════════════════════════════════════════
CREATE TABLE post_views (
    id         BIGSERIAL PRIMARY KEY,
    post_id    TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    ip_hash    TEXT NOT NULL DEFAULT '',
    user_agent TEXT DEFAULT '',
    referrer   TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_post_views_post    ON post_views(post_id);
CREATE INDEX idx_post_views_created ON post_views(created_at DESC);

-- ══════════════════════════════════════════════════════
-- REFERRAL EVENTS (tracking)
-- ══════════════════════════════════════════════════════
CREATE TABLE referral_events (
    id              BIGSERIAL PRIMARY KEY,
    referrer_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    referred_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ip_address      TEXT DEFAULT '',
    verified        BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_referral_events_referrer ON referral_events(referrer_id);
CREATE INDEX idx_referral_events_referred ON referral_events(referred_id);

-- ══════════════════════════════════════════════════════
-- USER SESSIONS (active session management)
-- ══════════════════════════════════════════════════════
CREATE TABLE user_sessions (
    id          TEXT PRIMARY KEY DEFAULT encode(gen_random_bytes(16), 'hex'),
    user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_family TEXT NOT NULL,
    ip_address  TEXT DEFAULT '',
    user_agent  TEXT DEFAULT '',
    last_used   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at  TIMESTAMPTZ
);

CREATE INDEX idx_user_sessions_user ON user_sessions(user_id);

-- ══════════════════════════════════════════════════════
-- ADDITIONAL PERMISSIONS (granular)
-- ══════════════════════════════════════════════════════
INSERT INTO permissions (id, name, module) VALUES
    ('perm_post_edit_own2',    'posts.edit_own',       'posts'),
    ('perm_post_edit_any2',    'posts.edit_any',       'posts'),
    ('perm_post_delete_own',   'posts.delete_own',     'posts'),
    ('perm_post_delete_any',   'posts.delete_any',     'posts'),
    ('perm_comments_moderate', 'comments.moderate',    'comments'),
    ('perm_comments_create',   'comments.create',      'comments'),
    ('perm_users_manage',      'users.manage',         'users'),
    ('perm_roles_manage',      'roles.manage',         'roles'),
    ('perm_settings_manage',   'settings.manage',      'settings'),
    ('perm_referral_view',     'referral.view',        'referral'),
    ('perm_stats_view',        'stats.view',           'stats')
ON CONFLICT (id) DO NOTHING;

-- Assign new permissions to OWNER/ADMIN
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'role_owner', id FROM permissions
WHERE id IN ('perm_post_edit_own2','perm_post_edit_any2','perm_post_delete_own','perm_post_delete_any',
             'perm_comments_moderate','perm_comments_create','perm_users_manage','perm_roles_manage',
             'perm_settings_manage','perm_referral_view','perm_stats_view')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT 'role_admin', id FROM permissions
WHERE id IN ('perm_post_edit_own2','perm_post_edit_any2','perm_post_delete_own','perm_post_delete_any',
             'perm_comments_moderate','perm_comments_create','perm_users_manage','perm_roles_manage',
             'perm_settings_manage','perm_referral_view','perm_stats_view')
ON CONFLICT DO NOTHING;

-- EDITOR gets comment moderation + post edit/delete
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'role_editor', id FROM permissions
WHERE id IN ('perm_post_edit_own2','perm_post_edit_any2','perm_post_delete_own','perm_post_delete_any',
             'perm_comments_moderate','perm_comments_create','perm_stats_view')
ON CONFLICT DO NOTHING;

-- AUTHOR gets own edit/delete + comment create
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'role_author', id FROM permissions
WHERE id IN ('perm_post_edit_own2','perm_post_delete_own','perm_comments_create')
ON CONFLICT DO NOTHING;

-- ══════════════════════════════════════════════════════
-- ADS.TXT — stored in site_settings already (key='ads_txt')
-- Add additional ad slot settings
-- ══════════════════════════════════════════════════════
INSERT INTO site_settings (key, value) VALUES
    ('default_comment_status', 'PENDING'),
    ('allow_guest_comments', 'true'),
    ('allow_guest_likes', 'true'),
    ('require_email_verification', 'true'),
    ('referral_enabled', 'true'),
    ('privacy_policy', ''),
    ('terms_of_service', ''),
    ('contact_info', '')
ON CONFLICT (key) DO NOTHING;

-- ══════════════════════════════════════════════════════
-- SOFT DELETE SUPPORT — add deleted_at to posts
-- ══════════════════════════════════════════════════════
ALTER TABLE posts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
