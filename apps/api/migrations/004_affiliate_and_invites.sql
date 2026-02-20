-- Migration 004: Affiliate system + Invite system tables
-- Run: psql -U rapidwire -d rapidwire -f migrations/004_affiliate_and_invites.sql

BEGIN;

-- ── Affiliate Settings (singleton config) ────────────────────
CREATE TABLE IF NOT EXISTS affiliate_settings (
    id              SERIAL PRIMARY KEY,
    enabled         BOOLEAN NOT NULL DEFAULT false,
    commission_type VARCHAR(20) NOT NULL DEFAULT 'PERCENTAGE' CHECK (commission_type IN ('PERCENTAGE', 'FIXED')),
    commission_value DECIMAL(10,2) NOT NULL DEFAULT 10.00,
    cookie_days     INTEGER NOT NULL DEFAULT 30,
    payout_minimum  DECIMAL(10,2) NOT NULL DEFAULT 100000.00,
    payout_schedule VARCHAR(20) NOT NULL DEFAULT 'MONTHLY' CHECK (payout_schedule IN ('WEEKLY', 'BIWEEKLY', 'MONTHLY')),
    terms_text      TEXT NOT NULL DEFAULT '',
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default settings row if not exists
INSERT INTO affiliate_settings (id, enabled, commission_type, commission_value, cookie_days, payout_minimum, payout_schedule, terms_text)
VALUES (1, false, 'PERCENTAGE', 10.00, 30, 100000.00, 'MONTHLY', 'Syarat dan ketentuan program afiliasi.')
ON CONFLICT (id) DO NOTHING;

-- ── Affiliate Profiles ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS affiliate_profiles (
    id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id               VARCHAR(64) NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    status                VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED')),
    payout_method         VARCHAR(50) NOT NULL DEFAULT '',        -- e.g. 'BANK_TRANSFER', 'E_WALLET'
    payout_name_encrypted TEXT NOT NULL DEFAULT '',
    payout_number_encrypted TEXT NOT NULL DEFAULT '',
    total_earnings        DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    total_paid            DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    pending_balance       DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    approved_at           TIMESTAMPTZ,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_profiles_user_id ON affiliate_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_profiles_status ON affiliate_profiles(status);

-- ── Affiliate Commissions (tracks each commission event) ─────
CREATE TABLE IF NOT EXISTS affiliate_commissions (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    affiliate_id    UUID NOT NULL REFERENCES affiliate_profiles(id) ON DELETE CASCADE,
    referral_event_id BIGINT REFERENCES referral_events(id),
    amount          DECIMAL(12,2) NOT NULL,
    description     TEXT NOT NULL DEFAULT '',
    status          VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'PAID', 'REJECTED')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_affiliate ON affiliate_commissions(affiliate_id);

-- ── Payout Requests ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payout_requests (
    id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id           VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    affiliate_id      UUID NOT NULL REFERENCES affiliate_profiles(id) ON DELETE CASCADE,
    amount            DECIMAL(12,2) NOT NULL,
    status            VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'PROCESSING', 'PAID', 'REJECTED')),
    admin_note        TEXT NOT NULL DEFAULT '',
    requested_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at      TIMESTAMPTZ,
    processed_by      VARCHAR(64) REFERENCES users(id),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payout_requests_user ON payout_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_payout_requests_status ON payout_requests(status);

-- ── Invites (enhanced) ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS invites (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email           VARCHAR(255) NOT NULL,
    token_hash      VARCHAR(128) NOT NULL UNIQUE,
    role_id         VARCHAR(64) NOT NULL REFERENCES roles(id),
    invited_by      VARCHAR(64) NOT NULL REFERENCES users(id),
    message         TEXT NOT NULL DEFAULT '',
    expires_at      TIMESTAMPTZ NOT NULL,
    used_at         TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invites_email ON invites(email);
CREATE INDEX IF NOT EXISTS idx_invites_token ON invites(token_hash);

-- ── Add new permissions for author & affiliate ───────────────
INSERT INTO permissions (id, name, module) VALUES
    (gen_random_uuid()::text, 'posts.create_own', 'posts'),
    (gen_random_uuid()::text, 'posts.edit_own', 'posts'),
    (gen_random_uuid()::text, 'posts.delete_own', 'posts'),
    (gen_random_uuid()::text, 'posts.view_own', 'posts'),
    (gen_random_uuid()::text, 'posts.edit_any', 'posts'),
    (gen_random_uuid()::text, 'posts.delete_any', 'posts'),
    (gen_random_uuid()::text, 'posts.publish', 'posts'),
    (gen_random_uuid()::text, 'posts.review', 'posts'),
    (gen_random_uuid()::text, 'affiliate.manage', 'affiliate'),
    (gen_random_uuid()::text, 'affiliate.view_own', 'affiliate'),
    (gen_random_uuid()::text, 'affiliate.payouts', 'affiliate'),
    (gen_random_uuid()::text, 'invites.manage', 'invites')
ON CONFLICT DO NOTHING;

-- ── Grant author permissions to AUTHOR role ────────────────
DO $$
DECLARE
    author_role_id TEXT;
    perm_id TEXT;
BEGIN
    SELECT id INTO author_role_id FROM roles WHERE name = 'AUTHOR' LIMIT 1;
    IF author_role_id IS NOT NULL THEN
        FOR perm_id IN SELECT id FROM permissions WHERE name IN ('posts.create_own', 'posts.edit_own', 'posts.delete_own', 'posts.view_own', 'affiliate.view_own')
        LOOP
            INSERT INTO role_permissions (role_id, permission_id) VALUES (author_role_id, perm_id) ON CONFLICT DO NOTHING;
        END LOOP;
    END IF;
END $$;

-- ── Grant editor permissions to EDITOR role ────────────────
DO $$
DECLARE
    editor_role_id TEXT;
    perm_id TEXT;
BEGIN
    SELECT id INTO editor_role_id FROM roles WHERE name = 'EDITOR' LIMIT 1;
    IF editor_role_id IS NOT NULL THEN
        FOR perm_id IN SELECT id FROM permissions WHERE name IN ('posts.create_own', 'posts.edit_own', 'posts.delete_own', 'posts.view_own', 'posts.edit_any', 'posts.review', 'posts.publish', 'affiliate.view_own')
        LOOP
            INSERT INTO role_permissions (role_id, permission_id) VALUES (editor_role_id, perm_id) ON CONFLICT DO NOTHING;
        END LOOP;
    END IF;
END $$;

-- ── Grant admin permissions to ADMIN role ────────────────
DO $$
DECLARE
    admin_role_id TEXT;
    perm_id TEXT;
BEGIN
    SELECT id INTO admin_role_id FROM roles WHERE name = 'ADMIN' LIMIT 1;
    IF admin_role_id IS NOT NULL THEN
        FOR perm_id IN SELECT id FROM permissions WHERE name IN ('posts.create_own', 'posts.edit_own', 'posts.delete_own', 'posts.view_own', 'posts.edit_any', 'posts.delete_any', 'posts.review', 'posts.publish', 'affiliate.manage', 'affiliate.view_own', 'affiliate.payouts', 'invites.manage')
        LOOP
            INSERT INTO role_permissions (role_id, permission_id) VALUES (admin_role_id, perm_id) ON CONFLICT DO NOTHING;
        END LOOP;
    END IF;
END $$;

COMMIT;
