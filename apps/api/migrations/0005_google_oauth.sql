-- 0005_google_oauth.sql
-- Add Google OAuth support fields to users table

-- Auth provider: 'local' (email/password) or 'google'
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(20) NOT NULL DEFAULT 'local';

-- Google subject ID (unique identifier from Google)
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_sub VARCHAR(255);

-- Make password_hash nullable for OAuth users
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

-- Email verified at (may already exist from previous migration, safe to skip)
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;

-- Bio column (may already exist)
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT '';

-- Referral code (may already exist)
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code TEXT DEFAULT '';

-- Referred by (may already exist)
ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by TEXT;

-- Disabled at (may already exist)
ALTER TABLE users ADD COLUMN IF NOT EXISTS disabled_at TIMESTAMPTZ;

-- Unique constraint on google_sub (only one account per Google ID)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_sub ON users(google_sub) WHERE google_sub IS NOT NULL;

-- Index on auth_provider for filtering
CREATE INDEX IF NOT EXISTS idx_users_auth_provider ON users(auth_provider);
