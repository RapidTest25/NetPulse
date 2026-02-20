-- =====================================================
-- Migration 0009: Marketplace V4 — NetPulse Store
-- Listings, Packages, Orders, Portfolio, Payments,
-- Notification Templates, Comment Likes (FB-style)
-- =====================================================

-- ── Listing Categories ───────────────────────────────
CREATE TABLE IF NOT EXISTS listing_categories (
    id          TEXT PRIMARY KEY DEFAULT encode(gen_random_bytes(16), 'hex'),
    name        TEXT NOT NULL,
    slug        TEXT NOT NULL UNIQUE,
    icon        TEXT DEFAULT '',
    description TEXT DEFAULT '',
    sort_order  INT DEFAULT 0,
    is_active   BOOLEAN DEFAULT true,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Listings ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS listings (
    id              TEXT PRIMARY KEY DEFAULT encode(gen_random_bytes(16), 'hex'),
    title           TEXT NOT NULL,
    slug            TEXT NOT NULL UNIQUE,
    description     TEXT DEFAULT '',
    short_desc      TEXT DEFAULT '',
    cover_url       TEXT DEFAULT '',
    listing_type    TEXT NOT NULL DEFAULT 'SERVICE',
        -- SERVICE | DIGITAL_PRODUCT | ACADEMIC
    category_id     TEXT REFERENCES listing_categories(id) ON DELETE SET NULL,
    
    -- Pricing
    base_price      BIGINT NOT NULL DEFAULT 0,
    
    -- SEO
    meta_title      TEXT DEFAULT '',
    meta_desc       TEXT DEFAULT '',
    
    -- Features
    features        TEXT[] DEFAULT '{}',
    tech_stack      TEXT[] DEFAULT '{}',
    
    -- Delivery
    estimated_days  INT DEFAULT 7,
    auto_delivery   BOOLEAN DEFAULT false,
    delivery_file_url   TEXT DEFAULT '',
    delivery_file_name  TEXT DEFAULT '',
    delivery_file_size  BIGINT DEFAULT 0,
    delivery_expiry_days INT DEFAULT 7,
    delivery_max_downloads INT DEFAULT 5,
    delivery_email_template TEXT DEFAULT '',
    delivery_wa_template    TEXT DEFAULT '',
    
    -- Status
    is_featured     BOOLEAN DEFAULT false,
    is_active       BOOLEAN DEFAULT true,
    sort_order      INT DEFAULT 0,
    
    -- Stats
    total_orders    INT DEFAULT 0,
    avg_rating      DECIMAL(3,2) DEFAULT 0,
    review_count    INT DEFAULT 0,
    
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_listings_slug ON listings(slug);
CREATE INDEX IF NOT EXISTS idx_listings_type ON listings(listing_type);
CREATE INDEX IF NOT EXISTS idx_listings_category ON listings(category_id);
CREATE INDEX IF NOT EXISTS idx_listings_active ON listings(is_active);

-- ── Listing Packages ─────────────────────────────────
CREATE TABLE IF NOT EXISTS listing_packages (
    id          TEXT PRIMARY KEY DEFAULT encode(gen_random_bytes(16), 'hex'),
    listing_id  TEXT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    description TEXT DEFAULT '',
    price       BIGINT NOT NULL,
    features    TEXT[] DEFAULT '{}',
    estimated_days INT DEFAULT 7,
    max_revisions  INT DEFAULT 1,
    sort_order  INT DEFAULT 0,
    is_active   BOOLEAN DEFAULT true,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_packages_listing ON listing_packages(listing_id);

-- ── Listing FAQ ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS listing_faq (
    id          TEXT PRIMARY KEY DEFAULT encode(gen_random_bytes(16), 'hex'),
    listing_id  TEXT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    question    TEXT NOT NULL,
    answer      TEXT NOT NULL,
    sort_order  INT DEFAULT 0
);

-- ── Portfolio Items ──────────────────────────────────
CREATE TABLE IF NOT EXISTS portfolio_items (
    id                  TEXT PRIMARY KEY DEFAULT encode(gen_random_bytes(16), 'hex'),
    listing_id          TEXT REFERENCES listings(id) ON DELETE SET NULL,
    title               TEXT NOT NULL,
    description         TEXT DEFAULT '',
    
    -- Preview
    preview_type        TEXT NOT NULL DEFAULT 'SCREENSHOT',
        -- IFRAME | SCREENSHOT | VIDEO
    preview_url         TEXT DEFAULT '',
    
    -- Images
    desktop_screenshot  TEXT DEFAULT '',
    mobile_screenshot   TEXT DEFAULT '',
    
    -- Meta
    client_name         TEXT DEFAULT '',
    tech_stack          TEXT[] DEFAULT '{}',
    
    is_featured         BOOLEAN DEFAULT false,
    sort_order          INT DEFAULT 0,
    is_active           BOOLEAN DEFAULT true,
    
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ── Portfolio Images ─────────────────────────────────
CREATE TABLE IF NOT EXISTS portfolio_images (
    id              TEXT PRIMARY KEY DEFAULT encode(gen_random_bytes(16), 'hex'),
    portfolio_id    TEXT NOT NULL REFERENCES portfolio_items(id) ON DELETE CASCADE,
    url             TEXT NOT NULL,
    alt_text        TEXT DEFAULT '',
    sort_order      INT DEFAULT 0
);

-- ── Payment Settings ─────────────────────────────────
CREATE TABLE IF NOT EXISTS payment_settings (
    id              TEXT PRIMARY KEY DEFAULT encode(gen_random_bytes(16), 'hex'),
    gateway         TEXT NOT NULL UNIQUE,
        -- TRIPAY | PAYDISINI
    api_key         TEXT NOT NULL DEFAULT '',
    merchant_code   TEXT DEFAULT '',
    private_key     TEXT DEFAULT '',
    is_active       BOOLEAN DEFAULT true,
    is_sandbox      BOOLEAN DEFAULT false,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── Payment Methods ──────────────────────────────────
CREATE TABLE IF NOT EXISTS payment_methods (
    id              TEXT PRIMARY KEY DEFAULT encode(gen_random_bytes(16), 'hex'),
    gateway         TEXT NOT NULL,
    code            TEXT NOT NULL,
    name            TEXT NOT NULL,
    icon_url        TEXT DEFAULT '',
    fee_flat        BIGINT DEFAULT 0,
    fee_percent     DECIMAL(5,2) DEFAULT 0,
    min_amount      BIGINT DEFAULT 0,
    max_amount      BIGINT DEFAULT 0,
    is_active       BOOLEAN DEFAULT true,
    sort_order      INT DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pm_gateway ON payment_methods(gateway);

-- ── Orders ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
    id              TEXT PRIMARY KEY DEFAULT encode(gen_random_bytes(16), 'hex'),
    order_number    TEXT NOT NULL UNIQUE,

    -- Buyer (guest)
    buyer_name      TEXT NOT NULL,
    buyer_email     TEXT DEFAULT '',
    buyer_phone     TEXT DEFAULT '',

    -- Access
    access_token    TEXT NOT NULL,

    -- Listing
    listing_id      TEXT NOT NULL REFERENCES listings(id),
    package_id      TEXT REFERENCES listing_packages(id),
    listing_title   TEXT NOT NULL,
    package_name    TEXT DEFAULT '',
    listing_type    TEXT NOT NULL DEFAULT 'SERVICE',

    -- Pricing
    amount          BIGINT NOT NULL,
    currency        TEXT DEFAULT 'IDR',

    -- Status
    status          TEXT NOT NULL DEFAULT 'PENDING_PAYMENT',
        -- PENDING_PAYMENT | PAID | IN_PROGRESS | COMPLETED | EXPIRED | CANCELLED | REFUNDED

    -- Payment
    paid_at         TIMESTAMPTZ,

    -- Delivery
    delivery_method     TEXT DEFAULT '',
    delivery_sent_at    TIMESTAMPTZ,
    download_url        TEXT DEFAULT '',
    download_expires_at TIMESTAMPTZ,
    download_count      INT DEFAULT 0,
    max_downloads       INT DEFAULT 5,

    -- Deliverable (for services)
    deliverable_url     TEXT DEFAULT '',
    deliverable_notes   TEXT DEFAULT '',

    -- Buyer notes
    buyer_notes     TEXT DEFAULT '',
    buyer_files     TEXT[] DEFAULT '{}',

    -- Admin
    admin_notes     TEXT DEFAULT '',
    assigned_to     TEXT REFERENCES users(id),

    -- Timestamps
    completed_at    TIMESTAMPTZ,
    cancelled_at    TIMESTAMPTZ,
    expired_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),

    -- Constraint: at least one contact required
    CONSTRAINT order_contact_required CHECK (buyer_email != '' OR buyer_phone != '')
);

CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_email ON orders(buyer_email);
CREATE INDEX IF NOT EXISTS idx_orders_phone ON orders(buyer_phone);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_listing ON orders(listing_id);
CREATE INDEX IF NOT EXISTS idx_orders_assigned ON orders(assigned_to);
CREATE INDEX IF NOT EXISTS idx_orders_token ON orders(access_token);

-- ── Payment Transactions ─────────────────────────────
CREATE TABLE IF NOT EXISTS payment_transactions (
    id              TEXT PRIMARY KEY DEFAULT encode(gen_random_bytes(16), 'hex'),
    order_id        TEXT NOT NULL REFERENCES orders(id),

    -- Gateway
    gateway         TEXT NOT NULL,
    gateway_ref     TEXT DEFAULT '',
    gateway_url     TEXT DEFAULT '',

    -- Payment detail
    method          TEXT NOT NULL,
    amount          BIGINT NOT NULL,
    fee             BIGINT DEFAULT 0,
    total           BIGINT NOT NULL,

    -- VA / QRIS
    pay_code        TEXT DEFAULT '',
    qr_url          TEXT DEFAULT '',

    -- Status
    status          TEXT NOT NULL DEFAULT 'PENDING',
        -- PENDING | PAID | EXPIRED | FAILED | REFUNDED

    -- Timestamps
    expired_at      TIMESTAMPTZ,
    paid_at         TIMESTAMPTZ,

    -- Raw webhook data
    callback_data   JSONB DEFAULT '{}',

    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pt_order ON payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_pt_gateway_ref ON payment_transactions(gateway_ref);
CREATE INDEX IF NOT EXISTS idx_pt_status ON payment_transactions(status);

-- ── Listing Reviews ──────────────────────────────────
CREATE TABLE IF NOT EXISTS listing_reviews (
    id              TEXT PRIMARY KEY DEFAULT encode(gen_random_bytes(16), 'hex'),
    listing_id      TEXT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    order_id        TEXT NOT NULL REFERENCES orders(id),
    reviewer_name   TEXT NOT NULL,
    reviewer_email  TEXT DEFAULT '',
    rating          INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    content         TEXT DEFAULT '',
    is_verified     BOOLEAN DEFAULT true,
    is_visible      BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_listing ON listing_reviews(listing_id);

-- ── Comment Likes (FB-style) ─────────────────────────
CREATE TABLE IF NOT EXISTS comment_likes (
    id          TEXT PRIMARY KEY DEFAULT encode(gen_random_bytes(16), 'hex'),
    comment_id  TEXT NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    guest_key   TEXT NOT NULL DEFAULT '',
    ip_hash     TEXT DEFAULT '',
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(comment_id, guest_key)
);

-- ── Notification Templates ───────────────────────────
CREATE TABLE IF NOT EXISTS notification_templates (
    id          TEXT PRIMARY KEY DEFAULT encode(gen_random_bytes(16), 'hex'),
    event       TEXT NOT NULL,
    channel     TEXT NOT NULL,
    subject     TEXT DEFAULT '',
    body        TEXT NOT NULL,
    is_active   BOOLEAN DEFAULT true,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(event, channel)
);

-- ── Seed: Default Payment Settings ──────────────────
INSERT INTO payment_settings (id, gateway, api_key, is_active, is_sandbox) VALUES
    ('ps_tripay', 'TRIPAY', '', true, true),
    ('ps_paydisini', 'PAYDISINI', '', true, true)
ON CONFLICT (gateway) DO NOTHING;

-- ── Seed: Default Payment Methods ───────────────────
INSERT INTO payment_methods (id, gateway, code, name, fee_flat, fee_percent, sort_order) VALUES
    ('pm_qris', 'TRIPAY', 'QRIS', 'QRIS', 0, 0.70, 1),
    ('pm_bca', 'TRIPAY', 'BCAVA', 'BCA Virtual Account', 4000, 0, 2),
    ('pm_bni', 'TRIPAY', 'BNIVA', 'BNI Virtual Account', 4000, 0, 3),
    ('pm_bri', 'TRIPAY', 'BRIVA', 'BRI Virtual Account', 4000, 0, 4),
    ('pm_bsi', 'TRIPAY', 'BSIVA', 'BSI Virtual Account', 4000, 0, 5),
    ('pm_mandiri', 'TRIPAY', 'MANDIRIVA', 'Mandiri Virtual Account', 4000, 0, 6),
    ('pm_dana', 'PAYDISINI', 'DANA', 'Dana', 0, 1.50, 7),
    ('pm_gopay', 'PAYDISINI', 'GOPAY', 'GoPay', 0, 2.00, 8),
    ('pm_shopeepay', 'TRIPAY', 'SHOPEEPAY', 'ShopeePay', 0, 1.50, 9)
ON CONFLICT DO NOTHING;

-- ── Seed: Default Notification Templates ─────────────
INSERT INTO notification_templates (id, event, channel, subject, body) VALUES
    ('nt_order_email', 'ORDER_CREATED', 'EMAIL',
     'Pesanan #{{order_number}} Berhasil Dibuat',
     'Hai {{buyer_name}},

Pesanan Anda telah dibuat:
- {{listing_title}} ({{package_name}})
- Total: Rp {{amount}}

Silakan selesaikan pembayaran.
Cek status: {{tracking_url}}'),

    ('nt_paid_email', 'PAYMENT_RECEIVED', 'EMAIL',
     'Pembayaran #{{order_number}} Diterima ✅',
     'Hai {{buyer_name}},

Pembayaran sebesar Rp {{amount}} telah kami terima.
Pesanan Anda sedang kami proses.

Cek status: {{tracking_url}}'),

    ('nt_completed_email', 'ORDER_COMPLETED', 'EMAIL',
     'Pesanan #{{order_number}} Selesai 🎉',
     'Hai {{buyer_name}},

Pesanan Anda telah selesai!

{{download_url}}

Berikan review: {{review_url}}
Terima kasih! 🙏'),

    ('nt_delivery_email', 'AUTO_DELIVERY', 'EMAIL',
     'File {{listing_title}} Siap Didownload 📥',
     'Hai {{buyer_name}},

Terima kasih sudah membeli {{listing_title}}! 🎉

Download: {{download_url}}
Berlaku {{expiry_days}} hari.

Ada pertanyaan? Hubungi WA kami.'),

    ('nt_order_wa', 'ORDER_CREATED', 'WHATSAPP', '',
     'Hai {{buyer_name}}! 👋
Pesanan #{{order_number}} berhasil dibuat.
{{listing_title}} - Rp {{amount}}

Bayar: {{payment_url}}
Cek status: {{tracking_url}}'),

    ('nt_paid_wa', 'PAYMENT_RECEIVED', 'WHATSAPP', '',
     'Hai {{buyer_name}}! ✅
Pembayaran #{{order_number}} diterima.
Sedang kami proses. Terima kasih! 🙏'),

    ('nt_delivery_wa', 'AUTO_DELIVERY', 'WHATSAPP', '',
     'Hai {{buyer_name}}! 🎉
{{listing_title}} siap!
Download: {{download_url}}
Berlaku {{expiry_days}} hari.')
ON CONFLICT (event, channel) DO NOTHING;

-- ── Seed: Default Listing Categories ─────────────────
INSERT INTO listing_categories (id, name, slug, icon, sort_order) VALUES
    ('lc_web', 'Website Development', 'website-development', '💻', 1),
    ('lc_mobile', 'Mobile App', 'mobile-app', '📱', 2),
    ('lc_academic', 'Tugas Akademik', 'tugas-akademik', '🎓', 3),
    ('lc_template', 'Template & Source Code', 'template-source-code', '📦', 4),
    ('lc_uiux', 'UI/UX Design', 'ui-ux-design', '🎨', 5),
    ('lc_bugfix', 'Bug Fixing & Maintenance', 'bug-fixing', '🐛', 6)
ON CONFLICT DO NOTHING;

-- ── Update comments to auto-publish (FB-style) ──────
-- Change default status from PENDING to APPROVED
ALTER TABLE comments ALTER COLUMN status SET DEFAULT 'APPROVED';

-- Add likes_count to comments for denormalization
ALTER TABLE comments ADD COLUMN IF NOT EXISTS likes_count INT DEFAULT 0;
