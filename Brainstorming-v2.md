# NetPulse — Brainstorming v2: Ekspansi Produk, Ads Custom & Admin Power

> Dokumen ini adalah kelanjutan dari `Brainstorming.md` (v1). Fokus utama: perluasan platform dari **media/blog** menjadi **media + marketplace jasa/produk digital**, penguatan sistem iklan custom, dan peningkatan kontrol admin.

---

## Daftar Isi

1. [Analisis Kondisi Saat Ini](#1-analisis-kondisi-saat-ini)
2. [Opsi Produk/Jasa yang Bisa Dijual](#2-opsi-produkjasa-yang-bisa-dijual)
3. [Rekomendasi: Digital Services Marketplace](#3-rekomendasi-digital-services-marketplace)
4. [Sistem Iklan Custom (Self-Serve Ads)](#4-sistem-iklan-custom-self-serve-ads)
5. [Penguatan Admin Panel](#5-penguatan-admin-panel)
6. [Model Data Baru](#6-model-data-baru)
7. [API Surface Baru](#7-api-surface-baru)
8. [Roadmap Implementasi](#8-roadmap-implementasi)

---

## 1) Analisis Kondisi Saat Ini

### Yang Sudah Ada

| Fitur | Status | Catatan |
|---|---|---|
| Blog/Artikel + Workflow Editorial | ✅ Selesai | Draft → Review → Publish, revisions, series |
| Multi-Author + RBAC | ✅ Selesai | OWNER, ADMIN, EDITOR, AUTHOR, VIEWER |
| SEO (sitemap, OG, schema) | ✅ Selesai | SSR/ISR, meta tags |
| Ads Manager | ⚠️ Basic | Hanya menyimpan kode AdSense per slot, tidak ada tracking/campaign |
| Affiliate System | ✅ Selesai | Referral, komisi, payout, fraud detection |
| Engagement (like, comment, view, save) | ✅ Selesai | Full tracking + analytics |
| Admin Panel | ⚠️ Cukup | 15 halaman, tapi belum ada product/order management |
| User Panel | ✅ Selesai | Profile, author studio, saved posts, affiliate |

### Yang Belum Ada (Gap)

- **Tidak ada produk/jasa** yang bisa dijual
- **Ads hanya Google AdSense** — tidak bisa pasang iklan custom dari klien langsung
- **Tidak ada order/transaksi** — tidak ada alur pembelian
- **Tidak ada payment integration**
- **Admin belum bisa**: manage kampanye iklan custom, kelola order/produk, lihat revenue dari berbagai sumber

---

## 2) Opsi Produk/Jasa yang Bisa Dijual

Mengingat NetPulse adalah platform media seputar **network & dunia internet**, berikut opsi produk/jasa yang relevan dan realistis:

### Opsi A: Jasa Development & Akademik

**Cocok karena**: Demand tinggi di kalangan mahasiswa, UMKM, dan startup. Audience NetPulse adalah orang-orang yang sudah familiar dengan dunia IT.

Contoh jasa:
- **Pembuatan Website** — company profile, landing page, e-commerce, portfolio
- **Pembuatan Aplikasi Mobile** — Android (Kotlin/Flutter), iOS, cross-platform
- **Pembuatan Aplikasi Web** — dashboard, SaaS, sistem informasi, ERP custom
- **Pembuatan Aplikasi Desktop** — tools, POS system, inventory management
- **Jasa Tugas Kuliah / Skripsi** — coding tugas pemrograman, laporan, implementasi skripsi/TA
- **Jasa Bug Fixing & Debugging** — perbaiki error di proyek yang sudah ada
- **Jasa Deploy & Hosting** — deploy aplikasi ke VPS, cloud, Docker, CI/CD setup
- **Jasa Desain UI/UX** — wireframe, mockup, prototype Figma

### Opsi B: Produk Digital

**Cocok karena**: Margin tinggi, tidak perlu logistik fisik.

Contoh produk:
- **Source Code / Template Aplikasi** — starter kit Next.js, Laravel, Flutter, dll
- **Template Website** — landing page, portfolio, toko online (siap pakai)
- **E-Book / Course** — tutorial programming, web development, mobile dev
- **UI Kit / Design Assets** — komponen Figma, icon pack, ilustrasi
- **Tools / Scripts** — automation scripts, boilerplate, CLI tools
- **Video Tutorial Premium** — konten eksklusif berbayar (React, Go, dll)
- **Cheat Sheet / Checklists** — programming cheat sheet, deployment checklist (PDF)

### Opsi C: Kombinasi (Marketplace Jasa + Produk Digital) ⭐ REKOMENDASI

**Alasan**:
- Diversifikasi revenue (tidak hanya ads)
- Author/penulis bisa juga jadi penyedia jasa → meningkatkan engagement
- Produk digital bisa dibuat sekali, dijual berulang (passive income)
- Bisa mulai kecil, scale up

### Opsi D: Membership / Subscription

**Cocok jika**: Ingin model recurring revenue.

- **Free tier**: Baca artikel biasa
- **Premium tier** (bulanan): Akses artikel premium, download resource, konsultasi priority
- **Enterprise tier**: Bulk konsultasi, dedicated support

### Opsi E: Job Board / Freelance Network

- Posting lowongan kerja developer/designer
- Freelancer directory
- Fee per posting atau berlangganan

---

## 3) Rekomendasi: Digital Services Marketplace

Saya merekomendasikan **Opsi C** — kombinasi marketplace jasa + produk digital. Berikut desain detailnya:

### 3.1 Konsep

NetPulse menjadi **"Media + Marketplace"** untuk dunia development & akademik:
- Pengunjung datang baca artikel tentang IT/tech (traffic driver)
- Di artikel ada CTA ke jasa pembuatan aplikasi/website terkait (konversi)
- Author bisa juga menawarkan jasa development mereka (ecosystem)
- Admin bisa list jasa milik tim sendiri (primary revenue)
- Mahasiswa yang butuh bantuan tugas/skripsi bisa langsung order

### 3.2 Tipe Listing

```
┌──────────────────────────────────────────────────────────┐
│                       LISTINGS                           │
├────────────────┬──────────────┬──────────────────────────┤
│    SERVICE     │   DIGITAL    │      ACADEMIC            │
│    (Jasa)      │  (Produk)    │   (Tugas/Skripsi)        │
├────────────────┼──────────────┼──────────────────────────┤
│ - Buat Website │ - Source Code│ - Tugas Pemrograman      │
│ - Buat Apk Mob │ - Template   │ - Implementasi Skripsi   │
│ - Buat Web App │ - E-Book     │ - Laporan Praktikum      │
│ - Bug Fixing   │ - UI Kit     │ - Konsultasi Coding      │
│ - Deploy/Host  │ - Course     │ - Review & Debugging TA  │
└────────────────┴──────────────┴──────────────────────────┘
```

### 3.3 Alur Pembelian (untuk Service/Consultation)

```
Pengunjung → Lihat Listing → Pilih Paket → Isi Form Order
    → Bayar (transfer/invoice) → Admin Konfirmasi Pembayaran
    → Jasa Dikerjakan → Diselesaikan → Review/Rating
```

**Catatan**: Untuk phase 1, payment TIDAK harus otomatis. Bisa manual:
- User pesan → Dapat invoice/nomor rekening
- User transfer → Upload bukti bayar
- Admin verifikasi → Status berubah ke "PAID"
- Ini lebih realistis untuk awal tanpa integrasi payment gateway

### 3.4 Alur Pembelian (untuk Digital Product)

```
Pengunjung → Lihat Produk → Bayar → Dapat Link Download
    → Akses di "Pembelian Saya"
```

### 3.5 Struktur Listing

Setiap listing punya:
- **Judul** + **Slug** (SEO-friendly URL)
- **Deskripsi** (rich text, seperti artikel)
- **Tipe**: `SERVICE` | `DIGITAL_PRODUCT` | `ACADEMIC`
- **Kategori listing** (bisa reuse kategori yang ada atau buat baru)
- **Cover image** + **Gallery** (multiple gambar)
- **Harga**: fixed price / starting from / custom quote
- **Paket/Tier** (opsional): Basic, Standard, Premium
- **Status**: `DRAFT` | `ACTIVE` | `PAUSED` | `ARCHIVED`
- **Penjual**: Admin/perusahaan atau Author yang disetujui
- **Tag/Skills** terkait
- **FAQ** per listing
- **Waktu pengerjaan estimasi** (untuk jasa)
- **File attachment** (untuk produk digital — file yang di-download setelah bayar)

### 3.6 Sistem Order

```
ORDER STATES:
┌─────────┐    ┌──────────┐    ┌────────────┐    ┌──────────────┐
│ PENDING  │ →  │ PAID     │ →  │ IN_PROGRESS│ →  │  COMPLETED   │
└─────────┘    └──────────┘    └────────────┘    └──────────────┘
                    │                                    │
                    ▼                                    ▼
              ┌──────────┐                        ┌──────────┐
              │ CANCELLED│                        │ REFUNDED │
              └──────────┘                        └──────────┘
```

### 3.7 Pricing Packages (Contoh Listing)

**Contoh 1: Jasa Pembuatan Website**
```json
{
  "listing": "Pembuatan Website Company Profile",
  "packages": [
    {
      "name": "Basic",
      "price": 1500000,
      "description": "Landing page 1 halaman, responsive, SEO dasar",
      "delivery_days": 5,
      "features": ["1 halaman", "Responsive design", "SEO dasar", "1x revisi"]
    },
    {
      "name": "Standard",
      "price": 3500000,
      "description": "Website 5 halaman + CMS + form kontak",
      "delivery_days": 10,
      "features": ["5 halaman", "CMS (admin panel)", "Form kontak", "Google Analytics", "3x revisi"]
    },
    {
      "name": "Premium",
      "price": 7000000,
      "description": "Website custom + fitur lanjutan + 1 bulan maintenance",
      "delivery_days": 14,
      "features": ["Semua fitur Standard", "Unlimited halaman", "Blog", "WhatsApp integration", "30 hari maintenance", "5x revisi"]
    }
  ]
}
```

**Contoh 2: Jasa Tugas Kuliah**
```json
{
  "listing": "Jasa Tugas Pemrograman & Skripsi",
  "packages": [
    {
      "name": "Tugas Biasa",
      "price": 150000,
      "description": "Tugas pemrograman sederhana (1 file/modul)",
      "delivery_days": 2,
      "features": ["1 bahasa pemrograman", "Kode bersih & berkomentaR", "Penjelasan singkat"]
    },
    {
      "name": "Tugas Kompleks / Proyek",
      "price": 500000,
      "description": "Proyek multi-file, database, UI",
      "delivery_days": 5,
      "features": ["Full project", "Database included", "UI/Frontend", "Dokumentasi", "1x revisi"]
    },
    {
      "name": "Skripsi / Tugas Akhir",
      "price": 2000000,
      "description": "Implementasi aplikasi untuk skripsi/TA lengkap",
      "delivery_days": 14,
      "features": ["Full stack app", "Database design", "Dokumentasi lengkap", "Bimbingan penggunaan", "3x revisi", "Source code + deploy"]
    }
  ]
}
```

---

## 4) Sistem Iklan Custom (Self-Serve Ads)

### 4.1 Masalah Saat Ini

Sistem ads yang ada sekarang (`ad_slots` table) hanya menyimpan **kode embed** (Google AdSense script). Tidak ada:
- Kampanye iklan custom
- Tracking impression/click
- Scheduling (tanggal mulai/selesai)
- Targeting (kategori tertentu, halaman tertentu)
- Pelaporan ke pengiklan

### 4.2 Desain Sistem Ads Custom

**Konsep**: Admin bisa membuat **Ad Campaign** untuk klien yang bayar langsung (bukan lewat Google). Setiap campaign punya banner, link tujuan, jadwal, dan tracking.

#### Flow

```
Klien Hubungi Admin → Nego Harga/Paket → Admin Buat Campaign
    → Upload Banner + Set Link → Set Jadwal & Targeting
    → Campaign Aktif → Tracking Impression & Click
    → Admin Lihat Report → Kirim Report ke Klien
```

#### Tipe Iklan

| Tipe | Deskripsi | Contoh Posisi |
|---|---|---|
| **BANNER** | Gambar statis / animasi + link | Header, sidebar, footer |
| **NATIVE** | Tampil seperti artikel biasa (sponsored content) | Di antara list artikel |
| **POPUP** | Modal/popup saat masuk halaman | Overlay |
| **INLINE** | Di dalam artikel (antara paragraf) | In-article |
| **STICKY** | Tetap terlihat saat scroll | Bottom bar, sidebar sticky |

#### Prioritas Rendering

```
IF custom_ad exists for this slot & position & is_active & within_schedule:
    → Tampilkan custom ad (prioritas klien yang bayar langsung)
ELSE IF google_adsense slot is_active:
    → Tampilkan Google AdSense code
ELSE:
    → Kosong / house ad (promosi internal)
```

Jadi **iklan custom selalu diprioritaskan** di atas Google AdSense. Masuk akal karena klien langsung bayar lebih.

### 4.3 Fitur Campaign Management

- **Create Campaign**: Nama, klien, budget, tanggal mulai/selesai
- **Upload Creative**: Banner image (berbagai ukuran), alt text
- **Set Target URL**: Link tujuan saat diklik (bisa UTM tracking)
- **Targeting Rules**: 
  - Tampil di kategori tertentu saja
  - Tampil di semua halaman
  - Exclude halaman tertentu (legal pages)
- **Scheduling**: Auto start/stop berdasarkan tanggal
- **Impression/Click Tracking**: Hitung berapa kali dilihat & diklik
- **Status**: `DRAFT` | `ACTIVE` | `PAUSED` | `COMPLETED` | `EXPIRED`
- **Reporting**: CTR (click-through rate), total impressions, total clicks, unique clicks per hari

### 4.4 Contoh Alur di Admin Panel

```
Admin → Monetisasi → Iklan

TAB 1: Ad Slots (yang sudah ada — untuk Google AdSense)
TAB 2: Campaigns (BARU — untuk iklan custom)
TAB 3: Reports (BARU — analytics iklan)

--- Buat Campaign Baru ---
Nama Campaign:     [Promo Hosting ABC            ]
Nama Klien:        [PT Hosting Indonesia          ]
Posisi:            [Header ▼]  [Sidebar ▼]
Banner:            [Upload gambar...]
Link Tujuan:       [https://hostingabc.com?utm=netpulse]
Tanggal Mulai:     [2026-03-01]
Tanggal Selesai:   [2026-03-31]
Target Kategori:   [✓ Semua]  [ ] Cloud  [ ] Networking
Budget (opsional): [Rp 5.000.000]
Status:            [Active ▼]
                   [💾 Simpan Campaign]
```

---

## 5) Penguatan Admin Panel

### 5.1 Modul Admin yang Sudah Ada (15 halaman)

| Modul | Status |
|---|---|
| Dashboard (stats, traffic, top posts) | ✅ |
| Artikel (CRUD + workflow) | ✅ |
| Media Library | ✅ |
| Kategori | ✅ |
| Komentar (moderasi) | ✅ |
| Iklan (slot AdSense) | ⚠️ Basic |
| Afiliasi | ✅ |
| Users | ✅ |
| Roles | ✅ |
| Permintaan Author | ✅ |
| SEO | ✅ |
| Integrasi/N8N | ✅ |
| Pengaturan | ✅ |
| Legal & Kebijakan | ✅ |
| Audit Log | ✅ |

### 5.2 Modul Admin BARU yang Perlu Ditambahkan

#### A. Marketplace Management

| Modul Baru | Prioritas | Deskripsi |
|---|---|---|
| **Listings** (Produk/Jasa) | 🔴 Tinggi | CRUD listing, set harga, paket, status, upload file |
| **Orders** | 🔴 Tinggi | Lihat semua order, konfirmasi pembayaran, update status, refund |
| **Categories Listing** | 🟡 Sedang | Kategori khusus untuk marketplace (terpisah dari blog categories) |
| **Reviews** | 🟡 Sedang | Moderasi review dari pembeli |
| **Customers** | 🟢 Rendah | Daftar pembeli + riwayat pembelian |

#### B. Ads Campaign Management

| Modul Baru | Prioritas | Deskripsi |
|---|---|---|
| **Campaigns** | 🔴 Tinggi | CRUD campaign iklan custom, upload banner, set jadwal |
| **Ads Reports** | 🔴 Tinggi | Impression, click, CTR per campaign per hari |
| **Advertisers** | 🟡 Sedang | Daftar pengiklan/klien + riwayat campaign |

#### C. Revenue & Finance

| Modul Baru | Prioritas | Deskripsi |
|---|---|---|
| **Revenue Dashboard** | 🔴 Tinggi | Total pendapatan dari semua sumber (order, ads, affiliate) |
| **Invoices** | 🟡 Sedang | Generate invoice untuk klien ads & order jasa |
| **Payout Management** | ✅ Ada | Sudah ada di affiliate (bisa di-extend) |

#### D. Communication & CRM

| Modul Baru | Prioritas | Deskripsi |
|---|---|---|
| **Inbox / Messages** | 🟡 Sedang | Pesan antara admin ↔ customer terkait order |
| **Notifications Center** | 🟡 Sedang | Manage template notifikasi (email, in-app) |
| **Newsletter** | 🟢 Rendah | Kirim newsletter ke subscriber |

### 5.3 Enhanced Admin Dashboard

Dashboard saat ini hanya menampilkan stats artikel. Dengan fitur baru, dashboard harus diperluas:

```
┌─────────────────────────────────────────────────────────────────┐
│                        ADMIN DASHBOARD                          │
├───────────────┬───────────────┬──────────────┬─────────────────┤
│ 💰 Revenue    │ 📦 Orders     │ 📝 Artikel   │ 👥 Users        │
│ Rp 15.5jt    │ 12 pending    │ 45 published │ 234 total       │
│ bulan ini    │ 3 in progress │ 5 draft      │ 12 new today    │
├───────────────┴───────────────┴──────────────┴─────────────────┤
│                                                                 │
│  📊 Revenue Chart (30 hari)                                     │
│  ┌─────────────────────────────────────────┐                   │
│  │  ▁▂▃▅▆▇█▇▆▅▃▂▁▂▃▅▆▇▆▅▃▂▁▂▃▅▆▇        │                   │
│  │  Jan 20                        Feb 19   │                   │
│  └─────────────────────────────────────────┘                   │
│                                                                 │
│  Revenue by Source:                                             │
│  ├── 📦 Jasa/Produk:  Rp 8.200.000  (53%)                     │
│  ├── 📢 Iklan Custom:  Rp 4.500.000  (29%)                    │
│  ├── 🔗 Affiliate:     Rp 1.800.000  (12%)                    │
│  └── 🅰️ Google Ads:    Rp 1.000.000  (6%)                     │
│                                                                 │
├─────────────────────────────────┬───────────────────────────────┤
│  🔔 Butuh Aksi                 │  📦 Order Terbaru             │
│  • 3 order pending pembayaran  │  #001 Setup Jaringan - PAID   │
│  • 2 review baru               │  #002 E-Book CCNA - PENDING   │
│  • 1 campaign expired           │  #003 Konsultasi VPN - DONE  │
│  • 5 komentar belum moderasi   │  #004 Template Mikrotik - NEW │
└─────────────────────────────────┴───────────────────────────────┘
```

### 5.4 Admin Sidebar Baru (Revisi)

```
📊 Dashboard

📝 KONTEN
├── Artikel
├── Media Library
├── Kategori
└── Komentar

🛒 MARKETPLACE
├── Listings (Jasa & Produk)
├── Orders
├── Reviews
└── Customers

📢 MONETISASI
├── Ad Slots (Google AdSense)
├── Campaigns (Iklan Custom)   ← BARU
├── Ads Reports                ← BARU
├── Afiliasi
└── Revenue Dashboard          ← BARU

👥 PENGGUNA
├── Users
├── Roles & Permissions
└── Permintaan Author

⚙️ SISTEM
├── SEO
├── Integrasi / N8N
├── Pengaturan Umum
├── Legal & Kebijakan
├── Notifications             ← BARU
└── Audit Log
```

---

## 6) Model Data Baru

### 6.1 Marketplace Tables

```sql
-- ========================================
-- LISTINGS (Jasa / Produk Digital)
-- ========================================
CREATE TABLE listings (
    id              TEXT PRIMARY KEY DEFAULT encode(gen_random_bytes(16), 'hex'),
    title           TEXT NOT NULL,
    slug            TEXT NOT NULL UNIQUE,
    description     TEXT DEFAULT '',          -- rich text (HTML)
    excerpt         TEXT DEFAULT '',          -- ringkasan singkat
    type            TEXT NOT NULL DEFAULT 'SERVICE',  -- SERVICE | DIGITAL_PRODUCT | ACADEMIC
    cover_url       TEXT DEFAULT '',
    status          TEXT NOT NULL DEFAULT 'DRAFT',    -- DRAFT | ACTIVE | PAUSED | ARCHIVED
    
    -- Pricing
    price           BIGINT DEFAULT 0,         -- harga dalam Rupiah (sen)
    price_type      TEXT DEFAULT 'FIXED',     -- FIXED | STARTING_FROM | CUSTOM_QUOTE
    currency        TEXT DEFAULT 'IDR',
    
    -- Jasa specific
    delivery_days   INT DEFAULT 0,            -- estimasi hari pengerjaan
    
    -- Digital product specific  
    file_url        TEXT DEFAULT '',           -- URL file untuk download (encrypted)
    file_name       TEXT DEFAULT '',
    file_size       BIGINT DEFAULT 0,
    download_count  INT DEFAULT 0,
    
    -- Meta
    seller_id       TEXT REFERENCES users(id),
    category_id     TEXT,                     -- listing category
    meta_title      TEXT DEFAULT '',
    meta_description TEXT DEFAULT '',
    
    -- Stats
    view_count      INT DEFAULT 0,
    order_count     INT DEFAULT 0,
    rating_avg      DECIMAL(3,2) DEFAULT 0,
    rating_count    INT DEFAULT 0,
    
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE listing_packages (
    id              TEXT PRIMARY KEY DEFAULT encode(gen_random_bytes(16), 'hex'),
    listing_id      TEXT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,             -- "Basic", "Standard", "Premium"
    price           BIGINT NOT NULL,
    description     TEXT DEFAULT '',
    delivery_days   INT DEFAULT 0,
    sort_order      INT DEFAULT 0,
    is_popular      BOOLEAN DEFAULT false,     -- highlight badge
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE listing_package_features (
    id              TEXT PRIMARY KEY DEFAULT encode(gen_random_bytes(16), 'hex'),
    package_id      TEXT NOT NULL REFERENCES listing_packages(id) ON DELETE CASCADE,
    feature         TEXT NOT NULL,
    included        BOOLEAN DEFAULT true,      -- true = termasuk, false = tidak
    sort_order      INT DEFAULT 0
);

CREATE TABLE listing_images (
    id              TEXT PRIMARY KEY DEFAULT encode(gen_random_bytes(16), 'hex'),
    listing_id      TEXT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    url             TEXT NOT NULL,
    alt_text        TEXT DEFAULT '',
    sort_order      INT DEFAULT 0
);

CREATE TABLE listing_faqs (
    id              TEXT PRIMARY KEY DEFAULT encode(gen_random_bytes(16), 'hex'),
    listing_id      TEXT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    question        TEXT NOT NULL,
    answer          TEXT NOT NULL,
    sort_order      INT DEFAULT 0
);

CREATE TABLE listing_tags (
    listing_id      TEXT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    tag_id          TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (listing_id, tag_id)
);

-- Kategori khusus marketplace
CREATE TABLE listing_categories (
    id              TEXT PRIMARY KEY DEFAULT encode(gen_random_bytes(16), 'hex'),
    name            TEXT NOT NULL UNIQUE,
    slug            TEXT NOT NULL UNIQUE,
    description     TEXT DEFAULT '',
    icon            TEXT DEFAULT '',           -- icon name/class
    parent_id       TEXT REFERENCES listing_categories(id),
    sort_order      INT DEFAULT 0,
    is_active       BOOLEAN DEFAULT true
);

-- ========================================
-- ORDERS
-- ========================================
CREATE TABLE orders (
    id              TEXT PRIMARY KEY DEFAULT encode(gen_random_bytes(16), 'hex'),
    order_number    TEXT NOT NULL UNIQUE,      -- "ORD-20260219-001"
    
    -- Buyer
    buyer_id        TEXT REFERENCES users(id),
    buyer_name      TEXT NOT NULL,
    buyer_email     TEXT NOT NULL,
    buyer_phone     TEXT DEFAULT '',
    
    -- Listing & Package
    listing_id      TEXT NOT NULL REFERENCES listings(id),
    package_id      TEXT REFERENCES listing_packages(id),
    listing_title   TEXT NOT NULL,             -- snapshot at order time
    package_name    TEXT DEFAULT '',           -- snapshot
    
    -- Pricing
    amount          BIGINT NOT NULL,           -- total harga
    currency        TEXT DEFAULT 'IDR',
    
    -- Status
    status          TEXT NOT NULL DEFAULT 'PENDING',
    -- PENDING → AWAITING_PAYMENT → PAID → IN_PROGRESS → COMPLETED → REVIEWED
    -- Alternatif: CANCELLED, REFUNDED, DISPUTED
    
    -- Payment
    payment_method  TEXT DEFAULT '',           -- BANK_TRANSFER | EWALLET | etc
    payment_proof   TEXT DEFAULT '',           -- URL bukti transfer
    paid_at         TIMESTAMPTZ,
    
    -- Delivery (untuk digital product)
    download_url    TEXT DEFAULT '',
    download_count  INT DEFAULT 0,
    
    -- Notes
    buyer_notes     TEXT DEFAULT '',           -- catatan dari pembeli
    admin_notes     TEXT DEFAULT '',           -- catatan internal admin
    
    -- Timestamps
    completed_at    TIMESTAMPTZ,
    cancelled_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE order_messages (
    id              TEXT PRIMARY KEY DEFAULT encode(gen_random_bytes(16), 'hex'),
    order_id        TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    sender_id       TEXT NOT NULL REFERENCES users(id),
    message         TEXT NOT NULL,
    attachment_url  TEXT DEFAULT '',
    is_admin        BOOLEAN DEFAULT false,
    read_at         TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- REVIEWS
-- ========================================
CREATE TABLE listing_reviews (
    id              TEXT PRIMARY KEY DEFAULT encode(gen_random_bytes(16), 'hex'),
    listing_id      TEXT NOT NULL REFERENCES listings(id),
    order_id        TEXT NOT NULL REFERENCES orders(id),
    reviewer_id     TEXT NOT NULL REFERENCES users(id),
    rating          INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title           TEXT DEFAULT '',
    comment         TEXT DEFAULT '',
    is_verified     BOOLEAN DEFAULT true,      -- verified purchase
    is_visible      BOOLEAN DEFAULT true,      -- admin moderation
    admin_reply     TEXT DEFAULT '',
    replied_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(order_id)  -- 1 review per order
);
```

### 6.2 Ads Campaign Tables

```sql
-- ========================================
-- AD CAMPAIGNS (Iklan Custom)
-- ========================================

-- Pengiklan / klien
CREATE TABLE advertisers (
    id              TEXT PRIMARY KEY DEFAULT encode(gen_random_bytes(16), 'hex'),
    name            TEXT NOT NULL,
    company         TEXT DEFAULT '',
    email           TEXT DEFAULT '',
    phone           TEXT DEFAULT '',
    website         TEXT DEFAULT '',
    notes           TEXT DEFAULT '',
    total_spent     BIGINT DEFAULT 0,          -- total yang sudah dibayar
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ad_campaigns (
    id              TEXT PRIMARY KEY DEFAULT encode(gen_random_bytes(16), 'hex'),
    name            TEXT NOT NULL,
    advertiser_id   TEXT REFERENCES advertisers(id),
    
    -- Creative
    type            TEXT NOT NULL DEFAULT 'BANNER',  -- BANNER | NATIVE | POPUP | INLINE | STICKY
    banner_url      TEXT DEFAULT '',                  -- URL gambar banner
    banner_alt      TEXT DEFAULT '',
    headline        TEXT DEFAULT '',                  -- untuk native ad
    description     TEXT DEFAULT '',                  -- untuk native ad
    target_url      TEXT NOT NULL,                    -- link tujuan saat diklik
    
    -- Placement
    position        TEXT NOT NULL DEFAULT 'sidebar',  -- header | sidebar | in_article | footer | popup
    slot_id         TEXT REFERENCES ad_slots(id),     -- opsional, link ke slot yang ada
    
    -- Schedule
    start_date      DATE NOT NULL,
    end_date        DATE,                             -- NULL = sampai di-stop manual
    
    -- Targeting
    target_categories TEXT[] DEFAULT '{}',             -- array kategori slug, kosong = semua
    exclude_paths     TEXT[] DEFAULT '{}',             -- path yang di-exclude (misal /privacy)
    
    -- Budget & Pricing
    budget          BIGINT DEFAULT 0,                 -- total budget
    cost_model      TEXT DEFAULT 'FLAT',              -- FLAT (bayar flat) | CPM | CPC
    cost_value      BIGINT DEFAULT 0,                 -- harga per model (misal per 1000 impression)
    
    -- Status
    status          TEXT NOT NULL DEFAULT 'DRAFT',    -- DRAFT | ACTIVE | PAUSED | COMPLETED | EXPIRED
    
    -- Stats (denormalized for quick access)
    total_impressions BIGINT DEFAULT 0,
    total_clicks      BIGINT DEFAULT 0,
    
    -- Priority (untuk resolve konflik di slot yang sama)
    priority        INT DEFAULT 10,                   -- semakin tinggi = semakin diprioritaskan
    
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Tracking per hari (untuk report)
CREATE TABLE ad_campaign_stats (
    id              TEXT PRIMARY KEY DEFAULT encode(gen_random_bytes(16), 'hex'),
    campaign_id     TEXT NOT NULL REFERENCES ad_campaigns(id) ON DELETE CASCADE,
    date            DATE NOT NULL,
    impressions     INT DEFAULT 0,
    clicks          INT DEFAULT 0,
    unique_clicks   INT DEFAULT 0,
    UNIQUE(campaign_id, date)
);

-- Click log detail (opsional, untuk anti-fraud)
CREATE TABLE ad_clicks (
    id              TEXT PRIMARY KEY DEFAULT encode(gen_random_bytes(16), 'hex'),
    campaign_id     TEXT NOT NULL REFERENCES ad_campaigns(id) ON DELETE CASCADE,
    ip_address      TEXT DEFAULT '',
    user_agent      TEXT DEFAULT '',
    referer         TEXT DEFAULT '',
    page_url        TEXT DEFAULT '',
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ad_campaigns_status ON ad_campaigns(status);
CREATE INDEX idx_ad_campaigns_dates ON ad_campaigns(start_date, end_date);
CREATE INDEX idx_ad_campaigns_position ON ad_campaigns(position);
CREATE INDEX idx_ad_campaign_stats_date ON ad_campaign_stats(campaign_id, date);
```

### 6.3 Revenue/Finance Tables

```sql
-- ========================================
-- REVENUE TRACKING (Unified)
-- ========================================
CREATE TABLE revenue_entries (
    id              TEXT PRIMARY KEY DEFAULT encode(gen_random_bytes(16), 'hex'),
    source          TEXT NOT NULL,             -- ORDER | AD_CAMPAIGN | AFFILIATE | ADSENSE
    reference_id    TEXT DEFAULT '',           -- order_id / campaign_id / etc
    amount          BIGINT NOT NULL,
    currency        TEXT DEFAULT 'IDR',
    description     TEXT DEFAULT '',
    recorded_at     DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_revenue_source ON revenue_entries(source);
CREATE INDEX idx_revenue_date ON revenue_entries(recorded_at);
```

---

## 7) API Surface Baru

### 7.1 Public API (Marketplace)

```
GET  /listings                          # List active listings (filter: type, category, sort)
GET  /listings/:slug                    # Detail listing
GET  /listings/:id/reviews              # Reviews sebuah listing
GET  /listing-categories                # Kategori marketplace
```

### 7.2 User API (Authenticated buyer)

```
POST /user/orders                       # Buat order baru
GET  /user/orders                       # List my orders
GET  /user/orders/:id                   # Detail order
POST /user/orders/:id/payment-proof     # Upload bukti bayar
POST /user/orders/:id/review            # Submit review
GET  /user/orders/:id/download          # Download digital product (if PAID)
POST /user/orders/:id/messages          # Kirim pesan terkait order
GET  /user/orders/:id/messages          # Lihat pesan
```

### 7.3 Admin API (Marketplace)

```
# Listings
GET    /admin/listings                  # List semua (termasuk DRAFT)
POST   /admin/listings                  # Buat listing baru
GET    /admin/listings/:id              # Detail
PUT    /admin/listings/:id              # Update
DELETE /admin/listings/:id              # Hapus
PATCH  /admin/listings/:id/status       # Ubah status
POST   /admin/listings/:id/packages     # Tambah paket
PUT    /admin/listings/:id/packages/:pid # Update paket
DELETE /admin/listings/:id/packages/:pid # Hapus paket
POST   /admin/listings/:id/images       # Upload gambar
DELETE /admin/listings/:id/images/:iid  # Hapus gambar
POST   /admin/listings/:id/faqs         # Tambah FAQ
PUT    /admin/listings/:id/faqs/:fid    # Update FAQ
DELETE /admin/listings/:id/faqs/:fid    # Hapus FAQ

# Orders
GET    /admin/orders                    # List semua order (filter: status, date)
GET    /admin/orders/:id                # Detail order
PATCH  /admin/orders/:id/status         # Update status (PAID, IN_PROGRESS, COMPLETED, etc)
POST   /admin/orders/:id/messages       # Kirim pesan ke pembeli
GET    /admin/orders/stats              # Ringkasan: total, pending, completed, revenue

# Reviews
GET    /admin/reviews                   # List semua review
PATCH  /admin/reviews/:id/visibility    # Show/hide review
POST   /admin/reviews/:id/reply        # Reply review

# Listing Categories
GET    /admin/listing-categories
POST   /admin/listing-categories
PUT    /admin/listing-categories/:id
DELETE /admin/listing-categories/:id
```

### 7.4 Admin API (Ads Campaign)

```
# Advertisers
GET    /admin/advertisers               # List pengiklan
POST   /admin/advertisers               # Tambah pengiklan
PUT    /admin/advertisers/:id           # Update
DELETE /admin/advertisers/:id           # Hapus

# Campaigns
GET    /admin/campaigns                 # List campaign (filter: status, advertiser)
POST   /admin/campaigns                 # Buat campaign baru
GET    /admin/campaigns/:id             # Detail + stats
PUT    /admin/campaigns/:id             # Update
DELETE /admin/campaigns/:id             # Hapus
PATCH  /admin/campaigns/:id/status      # Ubah status (activate, pause, etc)

# Campaign Tracking (dipanggil oleh frontend saat render ad)
POST   /ads/impression                  # Record impression { campaign_id }
POST   /ads/click                       # Record click { campaign_id }

# Campaign Reports
GET    /admin/campaigns/:id/report      # Daily stats untuk 1 campaign
GET    /admin/campaigns/report/summary  # Ringkasan semua campaign
```

### 7.5 Public Ads Display API (Revisi)

```
GET  /ads/display?position=header&category=networking
```

Response:
```json
{
  "source": "campaign",
  "campaign_id": "abc123",
  "type": "BANNER",
  "banner_url": "/uploads/ads/banner-hosting.jpg",
  "target_url": "https://hostingabc.com?utm=netpulse",
  "headline": "",
  "tracking_pixel": "/ads/impression?cid=abc123"
}
```

Jika tidak ada campaign aktif, fallback ke AdSense slot:
```json
{
  "source": "adsense",
  "code": "<script async src=\"https://pagead2.googlesyndication.com/...\"></script>"
}
```

### 7.6 Admin API (Revenue)

```
GET  /admin/revenue/dashboard           # Total revenue by source, chart data
GET  /admin/revenue/entries             # List semua revenue entries (filter: source, date range)
POST /admin/revenue/entries             # Manual entry (misal Google AdSense earning)
```

---

## 8) Roadmap Implementasi

### Phase 1: Foundation (2-3 minggu)

**Fokus**: Ads Campaign + Admin Power

| Task | Estimasi |
|---|---|
| Migration: `ad_campaigns`, `advertisers`, `ad_campaign_stats`, `ad_clicks` | 1 hari |
| Domain model: Campaign, Advertiser | 1 hari |
| Repository: Campaign CRUD, stats tracking | 2 hari |
| Handlers: Admin campaign management | 2 hari |
| Frontend: Campaign management page (admin) | 3 hari |
| Public ads display API (campaign + fallback AdSense) | 1 hari |
| Frontend: Render campaign ads in article/sidebar | 1 hari |
| Impression/click tracking endpoint | 1 hari |
| Campaign reports page (admin) | 2 hari |

### Phase 2: Marketplace Core (3-4 minggu)

**Fokus**: Listing + Order

| Task | Estimasi |
|---|---|
| Migration: `listings`, `listing_packages`, `orders`, `listing_reviews`, etc | 1 hari |
| Domain models: Listing, Order, Review | 2 hari |
| Repository: Listing CRUD, Order lifecycle | 3 hari |
| Handlers: Admin listing management | 3 hari |
| Handlers: Public listing view, User order flow | 2 hari |
| Frontend: Admin listing CRUD page | 3 hari |
| Frontend: Admin order management page | 3 hari |
| Frontend: Public listing page (catalog + detail) | 3 hari |
| Frontend: User order flow (checkout + my orders) | 3 hari |
| Frontend: Review system | 2 hari |

### Phase 3: Revenue & Polish (1-2 minggu)

**Fokus**: Revenue tracking, enhanced dashboard, notifikasi

| Task | Estimasi |
|---|---|
| Migration: `revenue_entries` | 0.5 hari |
| Revenue dashboard (admin) | 2 hari |
| Enhanced admin dashboard (gabungan stats) | 2 hari |
| Email notifications (order status, campaign expiry) | 2 hari |
| Order messaging system | 2 hari |

### Phase 4: Advanced (opsional, setelah launch)

- Payment gateway integration (Midtrans / Xendit)
- Membership/subscription tier
- Digital product DRM (signed URLs, download limit)
- Advertiser self-serve portal (klien buat campaign sendiri)
- Invoice PDF auto-generation
- Multi-currency support

---

## 9) Pertanyaan Keputusan

Sebelum implementasi, ada beberapa keputusan yang perlu diambil:

1. **Siapa yang boleh buat listing?**
   - Hanya Admin/Owner? (lebih terkontrol)
   - Author juga boleh? (jadi marketplace multi-vendor → lebih kompleks)
   - **Saran**: Phase 1 hanya Admin, Phase 2 buka untuk Author dengan approval

2. **Payment method Phase 1?**
   - Manual transfer + upload bukti (simple, tanpa integrasi)
   - Langsung integrasi payment gateway (Midtrans/Xendit)?
   - **Saran**: Manual dulu. Integrasi payment gateway di Phase 4

3. **Kategori listing terpisah atau gabung dengan kategori blog?**
   - Terpisah (lebih fleksibel, tidak bingung)
   - Gabung (lebih simple, tapi bisa membingungkan)
   - **Saran**: Terpisah — `listing_categories` table sendiri

4. **Digital product delivery?**
   - Simple download link (setelah PAID, bisa download)
   - Signed URL dengan expiry (lebih aman)
   - **Saran**: Simple download link dulu, signed URL di Phase 4

5. **Apakah ada komisi untuk Author yang jual jasa?** (jika multi-vendor)
   - Flat fee per transaksi
   - Persentase dari harga
   - **Saran**: Tentukan nanti kalau sudah multi-vendor

---

## 10) Ringkasan Eksekutif

| Aspek | Sekarang | Setelah Ekspansi |
|---|---|---|
| **Revenue Stream** | Hanya Google AdSense | AdSense + Iklan Custom + Marketplace + Affiliate |
| **Konten** | Artikel/Blog | Artikel + Jasa Development + Jasa Akademik + Produk Digital |
| **Ads** | Embed kode AdSense | AdSense + Campaign custom dengan tracking |
| **Admin Control** | 15 modul | 20+ modul (+ marketplace, campaign, revenue) |
| **User Journey** | Baca → Share | Baca → Order Jasa Buat Web/App → Pesan Jasa Tugas → Download Produk → Review |
| **Monetisasi** | Pasif (ads) | Aktif (jual jasa/produk) + Pasif (ads + affiliate) |

Platform berevolusi dari **"Blog IT"** menjadi **"Ecosystem Development: Media + Jasa Pembuatan App/Web + Jasa Akademik + Advertising Network"**.
