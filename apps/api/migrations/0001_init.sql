-- NetPulse: Initial schema setup
-- Extensions & base tables

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Users ────────────────────────────────────────────
CREATE TABLE users (
    id          TEXT PRIMARY KEY DEFAULT encode(gen_random_bytes(16), 'hex'),
    email       TEXT NOT NULL UNIQUE,
    name        TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    avatar      TEXT DEFAULT '',
    is_active   BOOLEAN NOT NULL DEFAULT true,
    two_factor_enabled BOOLEAN NOT NULL DEFAULT false,
    two_factor_secret  TEXT DEFAULT '',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);

-- ── Roles & Permissions ──────────────────────────────
CREATE TABLE roles (
    id   TEXT PRIMARY KEY DEFAULT encode(gen_random_bytes(16), 'hex'),
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE permissions (
    id     TEXT PRIMARY KEY DEFAULT encode(gen_random_bytes(16), 'hex'),
    name   TEXT NOT NULL UNIQUE,
    module TEXT NOT NULL
);

CREATE TABLE role_permissions (
    role_id       TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id TEXT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE user_roles (
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- ── Seed default roles ───────────────────────────────
INSERT INTO roles (id, name) VALUES
    ('role_owner',  'OWNER'),
    ('role_admin',  'ADMIN'),
    ('role_editor', 'EDITOR'),
    ('role_author', 'AUTHOR'),
    ('role_viewer', 'VIEWER');

-- ── Seed default permissions ─────────────────────────
INSERT INTO permissions (id, name, module) VALUES
    ('perm_post_create',    'post:create',     'posts'),
    ('perm_post_edit_own',  'post:edit_own',   'posts'),
    ('perm_post_edit_any',  'post:edit_any',   'posts'),
    ('perm_post_publish',   'post:publish',    'posts'),
    ('perm_post_schedule',  'post:schedule',   'posts'),
    ('perm_post_delete',    'post:delete',     'posts'),
    ('perm_user_invite',    'user:invite',     'users'),
    ('perm_user_disable',   'user:disable',    'users'),
    ('perm_user_set_role',  'user:set_role',   'users'),
    ('perm_ads_manage',     'ads:manage',      'ads'),
    ('perm_settings_edit',  'settings:edit',   'settings'),
    ('perm_audit_view',     'audit:view',      'audit');

-- ── Assign permissions to roles ──────────────────────
-- OWNER gets everything
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'role_owner', id FROM permissions;

-- ADMIN gets everything except some owner-only
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'role_admin', id FROM permissions;

-- EDITOR
INSERT INTO role_permissions (role_id, permission_id) VALUES
    ('role_editor', 'perm_post_create'),
    ('role_editor', 'perm_post_edit_any'),
    ('role_editor', 'perm_post_publish'),
    ('role_editor', 'perm_post_schedule'),
    ('role_editor', 'perm_post_delete');

-- AUTHOR
INSERT INTO role_permissions (role_id, permission_id) VALUES
    ('role_author', 'perm_post_create'),
    ('role_author', 'perm_post_edit_own');

-- ── Site Settings ────────────────────────────────────
CREATE TABLE site_settings (
    key        TEXT PRIMARY KEY,
    value      TEXT NOT NULL DEFAULT '',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO site_settings (key, value) VALUES
    ('site_title', 'NetPulse'),
    ('site_description', 'Blog seputar network & dunia internet'),
    ('site_logo', ''),
    ('default_og_image', ''),
    ('social_twitter', ''),
    ('social_github', ''),
    ('ads_txt', '');

-- ── Audit Logs ───────────────────────────────────────
CREATE TABLE audit_logs (
    id         BIGSERIAL PRIMARY KEY,
    user_id    TEXT NOT NULL,
    action     TEXT NOT NULL,
    entity     TEXT NOT NULL,
    entity_id  TEXT DEFAULT '',
    details    TEXT DEFAULT '',
    ip_address TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user    ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);
