-- Migration 0006: Enhanced Affiliate System v2
-- Adds: hold period, available/locked balances, provider_name, how_it_works,
--        payment_reference, proof_url, balance adjustments, anti-fraud flags
-- Run: psql -U rapidwire -d rapidwire -f migrations/0006_affiliate_system_v2.sql

BEGIN;

-- ══════════════════════════════════════════════════════════
-- 1. Enhance affiliate_settings with new fields
-- ══════════════════════════════════════════════════════════
ALTER TABLE affiliate_settings
  ADD COLUMN IF NOT EXISTS referral_hold_days INTEGER NOT NULL DEFAULT 7,
  ADD COLUMN IF NOT EXISTS how_it_works_md TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS terms_md TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS payout_rules_md TEXT NOT NULL DEFAULT '';

-- Migrate old terms_text → terms_md if terms_md is empty
UPDATE affiliate_settings
SET terms_md = terms_text,
    how_it_works_md = '## Cara Kerja Program Afiliasi

1. **Daftar** — Aktifkan profil afiliasi Anda
2. **Bagikan** — Sebarkan link referral unik Anda
3. **Dapatkan Komisi** — Dapatkan komisi untuk setiap referral yang terverifikasi
4. **Cairkan** — Ajukan pencairan saldo kapan saja setelah memenuhi syarat minimum'
WHERE id = 1 AND terms_md = '';

-- Update payout_schedule CHECK to include MANUAL
ALTER TABLE affiliate_settings
  DROP CONSTRAINT IF EXISTS affiliate_settings_payout_schedule_check;
ALTER TABLE affiliate_settings
  ADD CONSTRAINT affiliate_settings_payout_schedule_check
  CHECK (payout_schedule IN ('MANUAL', 'WEEKLY', 'BIWEEKLY', 'MONTHLY'));

-- Update commission_type CHECK to include FIXED_PER_VERIFIED_REFERRAL
ALTER TABLE affiliate_settings
  DROP CONSTRAINT IF EXISTS affiliate_settings_commission_type_check;
ALTER TABLE affiliate_settings
  ADD CONSTRAINT affiliate_settings_commission_type_check
  CHECK (commission_type IN ('PERCENTAGE', 'FIXED', 'FIXED_PER_VERIFIED_REFERRAL'));

-- ══════════════════════════════════════════════════════════
-- 2. Enhance affiliate_profiles with available/locked balances + flags
-- ══════════════════════════════════════════════════════════
ALTER TABLE affiliate_profiles
  ADD COLUMN IF NOT EXISTS available_balance DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS locked_balance DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS provider_name VARCHAR(100) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_suspicious BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS blocked_reason TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMPTZ;

-- ══════════════════════════════════════════════════════════
-- 3. Enhance affiliate_commissions (affiliate_events) with hold tracking
-- ══════════════════════════════════════════════════════════
ALTER TABLE affiliate_commissions
  ADD COLUMN IF NOT EXISTS hold_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS released_at TIMESTAMPTZ;

-- ══════════════════════════════════════════════════════════
-- 4. Enhance payout_requests with payment proof
-- ══════════════════════════════════════════════════════════
ALTER TABLE payout_requests
  ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(255) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS proof_url TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS note TEXT NOT NULL DEFAULT '';

-- Add unique partial index: only ONE active payout per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_payout_requests_active_per_user
  ON payout_requests (user_id)
  WHERE status IN ('PENDING', 'APPROVED');

-- ══════════════════════════════════════════════════════════
-- 5. Create affiliate_balance_adjustments table for audit
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS affiliate_balance_adjustments (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id     VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    admin_id    VARCHAR(64) NOT NULL REFERENCES users(id),
    amount      DECIMAL(12,2) NOT NULL,
    balance_type VARCHAR(20) NOT NULL CHECK (balance_type IN ('pending', 'available', 'paid')),
    reason      TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_balance_adjustments_user ON affiliate_balance_adjustments(user_id);

-- ══════════════════════════════════════════════════════════
-- 6. Create function to release held commissions
-- ══════════════════════════════════════════════════════════
-- This can be called by a cron job or scheduled task
CREATE OR REPLACE FUNCTION release_held_commissions() RETURNS INTEGER AS $$
DECLARE
    released_count INTEGER := 0;
    rec RECORD;
BEGIN
    FOR rec IN
        SELECT ac.id, ac.affiliate_id, ac.amount, ap.user_id
        FROM affiliate_commissions ac
        JOIN affiliate_profiles ap ON ap.id = ac.affiliate_id
        WHERE ac.status = 'PENDING'
          AND ac.hold_until IS NOT NULL
          AND ac.hold_until <= NOW()
          AND ac.released_at IS NULL
    LOOP
        -- Mark commission as released
        UPDATE affiliate_commissions
        SET status = 'APPROVED', released_at = NOW()
        WHERE id = rec.id;

        -- Move from pending to available balance
        UPDATE affiliate_profiles
        SET pending_balance = pending_balance - rec.amount,
            available_balance = available_balance + rec.amount,
            updated_at = NOW()
        WHERE id = rec.affiliate_id;

        released_count := released_count + 1;
    END LOOP;

    RETURN released_count;
END;
$$ LANGUAGE plpgsql;

-- ══════════════════════════════════════════════════════════
-- 7. Add referral click tracking table
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS referral_clicks (
    id          BIGSERIAL PRIMARY KEY,
    referrer_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ip_address  VARCHAR(45) NOT NULL,
    user_agent  TEXT NOT NULL DEFAULT '',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_referral_clicks_referrer ON referral_clicks(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_clicks_ip ON referral_clicks(ip_address, created_at);

COMMIT;
