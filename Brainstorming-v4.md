# NetPulse — Brainstorming v4: Landing Page Premium, Payment Gateway & Auto-Delivery

> Dokumen ini adalah kelanjutan dari `Brainstorming-v3.md`. Fokus utama: **landing page marketplace yang bagus & informatif** (inspirasi dari gambar), **live preview modal**, **integrasi payment gateway (Tripay + Paydisini)**, **auto-delivery produk digital**, **login tersembunyi**, dan **halaman ubah password admin**.

---

## Daftar Isi

1. [Perubahan Besar dari v3](#1-perubahan-besar-dari-v3)
2. [Blog — Cleanup Detail](#2-blog--cleanup-detail)
3. [Marketplace — Arsitektur Halaman (Minimalis tapi Fungsional)](#3-marketplace--arsitektur-halaman)
4. [Landing Page Marketplace (Premium Design)](#4-landing-page-marketplace-premium-design)
5. [Live Preview Modal](#5-live-preview-modal)
6. [Sistem Order (Revisi — Email/Telp Required)](#6-sistem-order-revisi--emailtelp-required)
7. [Tracking Transaksi (Multi-method)](#7-tracking-transaksi-multi-method)
8. [Payment Gateway — Tripay & Paydisini](#8-payment-gateway--tripay--paydisini)
9. [Auto-Delivery Produk Digital](#9-auto-delivery-produk-digital)
10. [Admin Panel (Revisi — Password & Settings)](#10-admin-panel-revisi--password--settings)
11. [Login Tersembunyi](#11-login-tersembunyi)
12. [Model Data (Revisi)](#12-model-data-revisi)
13. [API Surface (Revisi)](#13-api-surface-revisi)
14. [Roadmap Implementasi (Revisi)](#14-roadmap-implementasi-revisi)
15. [Keputusan Final](#15-keputusan-final)

---

## 1) Perubahan Besar dari v3

| Aspek | v3 (Lama) | v4 (Baru) | Alasan |
|---|---|---|---|
| **Author profile view** | Ada halaman view profile | ❌ **Dihapus** | Tidak perlu, blog hanya untuk baca |
| **Login link** | Mudah diakses di navbar/footer | **Tersembunyi** — URL rahasia | Hanya internal team yang tahu |
| **Admin change password** | ❌ Tidak ada | ✅ **Halaman ubah password** | Keamanan admin |
| **Order contact info** | Email + Phone required | **Email ATAU Phone** — minimal 1 | Fleksibel, tapi tetap bisa dihubungi |
| **Tracking transaksi** | Email + order number | **Email, No. Telp, ATAU No. TRX** | Multiple cara lookup |
| **Landing page** | Basic listing grid | **Premium landing page** (ala screenshot) | Informatif, high-converting |
| **Live preview** | ❌ Tidak ada | ✅ **Modal preview** untuk produk | Lihat hasil tanpa pindah halaman |
| **Payment** | Manual transfer + upload bukti | **Tripay + Paydisini** (otomatis) | QRIS, BCA, Dana, GoPay, dll |
| **Auto-delivery** | ❌ Manual | ✅ **Auto kirim** ke email/WA setelah bayar | Template, source code auto terkirim |
| **Halaman marketplace** | Banyak halaman terpisah | **Minimal halaman**, mobile-friendly | Fokus konversi, bukan navigasi |

---

## 2) Blog — Cleanup Detail

### 2.1 Yang DIHAPUS Tambahan (dari v3)

#### Detail Profile View — HAPUS

Sebelumnya di blog ada halaman view profile author (misal `/author/[username]`). Ini **dihapus**:

- ❌ Halaman `/author/[username]` atau `/profile/[id]`
- ❌ Sidebar "Tentang Author" yang link ke profile page
- ✅ **Yang tetap**: nama author di artikel → tapi TIDAK link ke profile page, hanya teks biasa
- ✅ **Yang tetap**: avatar + nama di byline artikel (tapi tidak clickable)

```diff
  Artikel:
  ┌──────────────────────────────────────┐
  │ "Cara Setup VPN di Ubuntu"            │
  │                                       │
- │  👤 Ahmad Khadafi  [→ Lihat Profile]  │  ← DIHAPUS
+ │  👤 Ahmad Khadafi                     │  ← Hanya text, TIDAK clickable
  │  📅 20 Feb 2026 · 5 menit baca       │
  └──────────────────────────────────────┘
```

### 2.2 Tidak Ada Link ke Login di Manapun

Di blog (`netpulse.com`), **TIDAK ADA** satupun link yang mengarah ke halaman login:
- ❌ Navbar: tidak ada tombol "Login" / "Masuk"
- ❌ Footer: tidak ada link "Admin" / "Login"
- ❌ Sidebar: tidak ada link login
- ❌ Halaman 404 / error: tidak ada link ke login

Pengunjung biasa tidak perlu tahu bahwa ada admin panel.

---

## 3) Marketplace — Arsitektur Halaman

### 3.1 Prinsip: Minimal Halaman, Maksimal Fungsi

Terinspirasi dari screenshot landing page, marketplace ini dirancang **single-page dominant** — hampir semua informasi ada di 1 halaman, dengan modal untuk detail & checkout.

### 3.2 Peta Halaman (Revisi — Lebih Ramping)

```
app.netpulse.com/
├── /                               # Landing page (ALL-IN-ONE)
│                                   #   → Hero, kategori, listing unggulan,
│                                   #   → testimonial, FAQ, CTA
│                                   #   → Scroll ke section masing-masing
│
├── /[slug]                         # Detail listing (bisa jasa / produk)
│                                   #   → Deskripsi, paket, FAQ, review
│                                   #   → Tombol "Live Preview" → modal
│                                   #   → Tombol "Order Sekarang" → modal/section checkout
│
├── /order/track                    # Cek status pesanan (form: email/phone/trx)
│
├── /order/[orderNumber]            # Detail transaksi (via token)
│                                   #   → Status, pembayaran, review
│
└── /kebijakan                      # Terms & privacy (opsional, bisa footer modal)
```

**Total halaman: hanya 4-5 halaman utama** — bukan belasan halaman.

### 3.3 Kenapa Minimalis?

| Sebelumnya (v3) | Sekarang (v4) | Alasan |
|---|---|---|
| `/jasa` (katalog jasa) | ❌ Dihapus — ada di landing | Satu halaman cukup |
| `/produk` (katalog produk) | ❌ Dihapus — ada di landing | Filter di landing page |
| `/jasa/[slug]/order` | ❌ Dihapus — checkout di modal | Tidak perlu halaman baru |
| `/kategori/[slug]` | ❌ Dihapus — filter di landing | Tab/filter di landing |
| `/tentang` | ❌ Dihapus — section di landing | About section |
| `/kontak` | ❌ Dihapus — WhatsApp floating | Click to WA |
| `/syarat-ketentuan` | Merge → `/kebijakan` | 1 halaman legal saja |

---

## 4) Landing Page Marketplace (Premium Design)

### 4.1 Section-by-Section Layout

Terinspirasi dari gambar yang kamu share (landing page engine), berikut structure landing page yang **mobile-friendly** dan **high-converting**:

```
app.netpulse.com/
│
├── SECTION 1: HERO
│   "Jasa Pembuatan Aplikasi, Website & Bantuan Tugas Kuliah 🚀"
│   Subheadline + CTA utama + social proof (rating + jumlah klien)
│
├── SECTION 2: TRUST BADGES  
│   Tags/badge: ⚡ Cepat, 💎 Kualitas Terjamin, 🔒 Garansi Revisi,
│   📱 Mobile Friendly, 🎓 Berpengalaman, 💬 Support 24/7
│
├── SECTION 3: PROBLEMS SOLVED
│   "Sering Ngadepin Hal Ini?"
│   Pain points target audience + solusi yang ditawarkan
│
├── SECTION 4: KATEGORI JASA
│   "Bisa Untuk Kebutuhan Apa Aja? 🤔"
│   Tags cloud: Website, Mobile App, Web App, Tugas Kuliah, Skripsi,
│   Landing Page, E-Commerce, Bug Fixing, Deploy, UI/UX, dll
│
├── SECTION 5: LIVE RESULTS (Portfolio/Showcase)
│   "Lihat Nih, Hasilnya Sekeren Apa 👀"
│   Card grid dengan screenshot hasil + tombol [Live Preview 🔗]
│   → Klik = buka modal preview (iframe / screenshot carousel)
│
├── SECTION 6: COMPARISON
│   "Pilih Cara Kamu Buat Aplikasi/Website 🤔"
│   Perbandingan: Hire Agency vs Freelancer vs NetPulse Studio
│   → NetPulse = solusi terbaik (highlighted)
│
├── SECTION 7: LISTING UNGGULAN
│   "Jasa & Produk Terlaris ⭐"
│   Card listing dengan harga, rating, tombol detail
│   Filter tabs: Semua | Jasa Dev | Akademik | Produk Digital
│
├── SECTION 8: PRICING HIGHLIGHT  
│   "Investasi Sekali, Hasil Maksimal 💎"
│   Pricing card termurah / paling populer + CTA
│
├── SECTION 9: TESTIMONIALS
│   "Apa Kata Mereka? 💬"
│   Carousel review dari klien sebelumnya
│
├── SECTION 10: FAQ
│   Accordion FAQ umum
│
├── SECTION 11: CTA FINAL
│   "Siap Mulai Project?" + form quick order atau link WA
│
└── FOOTER
    Link ke blog, kebijakan, sosial media, WA floating button
```

### 4.2 Section Detail — HERO

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│  [Tab: Semua | 💻 Jasa Dev | 🎓 Akademik | 📦 Produk Digital]  │
│                                                                  │
│            Butuh Aplikasi, Website, atau                         │
│           Bantuan Tugas Kuliah? 🚀                               │
│                                                                  │
│     Kami bantu buatkan dengan cepat, profesional,                │
│     dan harga bersahabat. Tanpa ribet.                          │
│                                                                  │
│       ┌──────────────────────────────┐                          │
│       │  Lihat Jasa & Produk 👇     │  ← smooth scroll         │
│       └──────────────────────────────┘                          │
│                                                                  │
│     ⭐ 4.9/5 rating · 100+ project selesai · 50+ klien puas    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.3 Section Detail — TRUST BADGES

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│  ┌───────────┐ ┌─────────────────┐ ┌──────────────┐            │
│  │⚡ CEPAT    │ │💎 KUALITAS PRO  │ │🔒 GARANSI    │            │
│  └───────────┘ └─────────────────┘ └──────────────┘            │
│  ┌───────────────┐ ┌─────────────┐ ┌────────────────┐          │
│  │📱 MOBILE FIRST│ │🎓 AKADEMIK  │ │💬 SUPPORT 24/7 │          │
│  └───────────────┘ └─────────────┘ └────────────────┘          │
│  ┌───────────────┐ ┌──────────────────┐ ┌──────────────┐       │
│  │🔄 FREE REVISI │ │✅ FULL SOURCE CODE│ │🎯 ANTI RIBET │       │
│  └───────────────┘ └──────────────────┘ └──────────────┘       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.4 Section Detail — PROBLEMS SOLVED

```
┌─────────────────────────────────────────────────────────────────┐
│                    PROBLEMS SOLVED                               │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 😰 Sering Ngadepin Hal Ini?                              │   │
│  │                                                           │   │
│  │ Niat bikin aplikasi/website, eh stuck di proses.          │   │
│  │ Bingung mulai dari mana, budget terbatas,                 │   │
│  │ waktu deadline mepet.                                     │   │
│  │                                                           │   │
│  │  ⓘ  Tugas kuliah numpuk, gak sempat ngoding sendiri     │   │
│  │  ⓘ  Hire freelancer mahal, hasilnya gak sesuai           │   │
│  │  ⓘ  Belajar sendiri tapi gak ada waktu                   │   │
│  │  ⓘ  Deadline mepet, butuh cepat selesai                  │   │
│  │                                                           │   │
│  │  ┌────────────────────────────────────────────────────┐  │   │
│  │  │ Saatnya serahkan ke tim profesional yang paham     │  │   │
│  │  │ kebutuhan kamu. Fokus ke hal penting lainnya. 🎯  │  │   │
│  │  └────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 4.5 Section Detail — KATEGORI

```
┌─────────────────────────────────────────────────────────────────┐
│         Bisa Untuk Kebutuhan Apa Aja? 🤔                        │
│    Dari tugas kuliah sampai aplikasi bisnis profesional          │
│                                                                  │
│  ┌──────────┐ ┌──────────────┐ ┌───────────┐ ┌──────────────┐  │
│  │💻 WEBSITE │ │📱 MOBILE APP │ │🌐 WEB APP │ │🎓 TUGAS/TA   │  │
│  └──────────┘ └──────────────┘ └───────────┘ └──────────────┘  │
│  ┌──────────────┐ ┌──────────┐ ┌─────────────┐ ┌────────────┐ │
│  │🛒 E-COMMERCE │ │🎨 UI/UX  │ │📄 SKRIPSI   │ │🐛 BUG FIX  │ │
│  └──────────────┘ └──────────┘ └─────────────┘ └────────────┘ │
│  ┌────────────────┐ ┌──────────────┐ ┌───────────────┐         │
│  │🚀 LANDING PAGE │ │📦 SOURCE CODE│ │⚙️ DEPLOY/HOST │         │
│  └────────────────┘ └──────────────┘ └───────────────┘         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.6 Section Detail — LIVE RESULTS (Portfolio)

```
┌─────────────────────────────────────────────────────────────────┐
│                    LIVE RESULT                                   │
│        Liat Nih, Hasilnya Sekeren Apa 👀                        │
│   Bukan cuma omong doang, ini buktinya                          │
│                                                                  │
│  ┌────────────────────────┐  ┌────────────────────────┐         │
│  │ ┌──────────────────┐  │  │ ┌──────────────────┐  │         │
│  │ │  [Screenshot      │  │  │ │  [Screenshot      │  │         │
│  │ │   Desktop +       │  │  │ │   Desktop +       │  │         │
│  │ │   Mobile]         │  │  │ │   Mobile]         │  │         │
│  │ └──────────────────┘  │  │ └──────────────────┘  │         │
│  │ Hasil Project 1       │  │ Hasil Project 2       │         │
│  │ ┌──────────────────┐  │  │ ┌──────────────────┐  │         │
│  │ │  Live Preview 🔗 │  │  │ │  Live Preview 🔗 │  │         │
│  │ └──────────────────┘  │  │ └──────────────────┘  │         │
│  └────────────────────────┘  └────────────────────────┘         │
│                                                                  │
│  → Klik "Live Preview" = BUKA MODAL (lihat Section 5)           │
└─────────────────────────────────────────────────────────────────┘
```

### 4.7 Section Detail — COMPARISON

```
┌─────────────────────────────────────────────────────────────────┐
│                    COMPARISON                                    │
│      Pilih Cara Kamu Buat Aplikasi/Website 🤔                   │
│                                                                  │
│  ┌──────────────────────────────────────┐                       │
│  │  Hire Agency (Pro)                    │                       │
│  │  • Biaya mulai Rp 5jt — 50jt         │                       │
│  │  • Nunggu lama (1-3 bulan)            │                       │
│  │  • Revisi terbatas                    │                       │
│  │  • Project baru harus bayar lagi      │                       │
│  └──────────────────────────────────────┘                       │
│                    ↓                                             │
│  ┌──────────────────────────────────────┐                       │
│  │  Hire Freelancer / Web Dev            │                       │
│  │  • Biaya Rp 1.5jt — 5jt              │                       │
│  │  • Respon lambat / sering hilang      │                       │
│  │  • Kualitas gak konsisten             │                       │
│  │  • No support setelah jadi            │                       │
│  └──────────────────────────────────────┘                       │
│                    ↓                                             │
│  ┌──────────────────────────────────────┐  ← SOLUSI TERBAIK    │
│  │  ✅ NetPulse Studio                   │                       │
│  │  ✅ Harga Terjangkau: mulai Rp 150rb │                       │
│  │  ✅ Cepat: 2-14 hari selesai          │                       │
│  │  ✅ Kualitas: desain rapi & pro       │                       │
│  │  ✅ Garansi Revisi                    │                       │
│  │  ✅ Full Source Code                  │                       │
│  │  ✅ Support setelah selesai           │                       │
│  └──────────────────────────────────────┘                       │
└─────────────────────────────────────────────────────────────────┘
```

### 4.8 Section Detail — LISTING UNGGULAN

```
┌─────────────────────────────────────────────────────────────────┐
│           Jasa & Produk Terlaris ⭐                              │
│                                                                  │
│  [Semua] [💻 Jasa Dev] [🎓 Akademik] [📦 Produk Digital]       │
│                                                                  │
│  ┌─────────────────────┐  ┌─────────────────────┐               │
│  │ 🌐 Pembuatan Website │  │ 🎓 Jasa Tugas       │               │
│  │ Company Profile      │  │ Pemrograman         │               │
│  │                      │  │                      │               │
│  │ Mulai Rp 1.500.000   │  │ Mulai Rp 150.000    │               │
│  │ ⭐ 4.8 (23 review)   │  │ ⭐ 4.9 (45 review)  │               │
│  │ ⏱️ 5-14 hari         │  │ ⏱️ 2-14 hari        │               │
│  │                      │  │                      │               │
│  │ [🔎 Detail]          │  │ [🔎 Detail]         │               │
│  └─────────────────────┘  └─────────────────────┘               │
│                                                                  │
│  → Klik "Detail" = navigasi ke /[slug]                          │
└─────────────────────────────────────────────────────────────────┘
```

### 4.9 Section Detail — PRICING HIGHLIGHT

```
┌─────────────────────────────────────────────────────────────────┐
│                   SPECIAL OFFER                                  │
│       Investasi Kecil, Hasil Maksimal 💎                        │
│                                                                  │
│   PERBANDINGAN BIAYA                                             │
│   ─────────────────────────────────────                          │
│   Jasa Agency (Pro)       5jt — 50jt                             │
│   Hire Freelancer         1.5jt — 5jt                            │
│   ✅ NetPulse Studio      Mulai Rp 150.000                      │
│                                                                  │
│  ┌──────────────────────────────────────┐                       │
│  │  Paket Tugas Kuliah                   │                       │
│  │  PAKET BASIC                          │                       │
│  │           Rp 150.000                  │                       │
│  │                                       │                       │
│  │  YANG ANDA DAPATKAN:                  │                       │
│  │  ✅ Kode bersih & berkomentaR         │                       │
│  │  ✅ Penjelasan singkat                │                       │
│  │  ✅ 1 bahasa pemrograman              │                       │
│  │  ✅ 1x revisi                         │                       │
│  │                                       │                       │
│  │    [🛒 Order Sekarang]               │                       │
│  └──────────────────────────────────────┘                       │
│                                                                  │
│  ┌──────────────────────────────────────┐  ⭐ PALING LENGKAP   │
│  │  Paket Skripsi / Tugas Akhir         │                       │
│  │  PAKET PREMIUM                        │                       │
│  │           Rp 2.000.000               │                       │
│  │                                       │                       │
│  │  SEMUA FITUR BASIC + UPGRADE:         │                       │
│  │  ✅ Full stack application            │                       │
│  │  ✅ Database design                   │                       │
│  │  ✅ Dokumentasi lengkap               │                       │
│  │  ✅ Bimbingan penggunaan              │                       │
│  │  ✅ 3x revisi                         │                       │
│  │  ✅ Source code + deploy              │                       │
│  │                                       │                       │
│  │    [🛒 Order Sekarang]               │                       │
│  └──────────────────────────────────────┘                       │
└─────────────────────────────────────────────────────────────────┘
```

### 4.10 Mobile-First Design Principles

Semua section dirancang **mobile-first**:
- Card stack vertikal di mobile (1 kolom)
- Horizontal scroll / grid 2 kolom di tablet
- Grid 3-4 kolom di desktop
- Tombol CTA selalu full-width di mobile
- **Sticky bottom bar** di mobile: harga + "Order Sekarang"
- Font size cukup besar di mobile (16px+ body)
- Touch target minimal 44x44px
- Scroll smooth antar section

---

## 5) Live Preview Modal

### 5.1 Konsep

Untuk listing yang punya **hasil portfolio / demo** (terutama website, landing page, template), user bisa klik **"Live Preview"** → muncul **modal fullscreen** berisi preview.

### 5.2 Tipe Preview

| Tipe Listing | Preview Method | Implementasi |
|---|---|---|
| Website / Landing Page | **iframe** live URL | `<iframe src="https://demo.client.com" />` |
| Template / Source Code | **Screenshot carousel** | Slide gambar hasil |
| Aplikasi Mobile | **Screenshot carousel** + video | Gambar mockup HP |
| Tugas / Akademik | **Screenshot** hasil | Before/after, code snippet |

### 5.3 UI Modal Preview

```
┌─────────────────────────────────────────────────────────────────┐
│  PREVIEW WEBSITE HASIL PAKAI NETPULSE STUDIO      [← Kembali]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                                                          │   │
│   │              [IFRAME / SCREENSHOT]                        │   │
│   │                                                          │   │
│   │     Website client yang sudah jadi                       │   │
│   │     Responsive preview: Desktop + Mobile                 │   │
│   │                                                          │   │
│   │                                                          │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│   Di mobile: screenshot yang bisa di-zoom + swipe               │
│   Di desktop: iframe dengan toggle Desktop/Tablet/Mobile view   │
│                                                                  │
│   ┌────────────────────────────────────────┐                    │
│   │   [💻 Desktop]  [📱 Tablet]  [📱 Mobile]  │  ← toggle view  │
│   └────────────────────────────────────────┘                    │
│                                                                  │
│   Hasil Project: "Website Company Profile PT ABC"               │
│   ┌──────────────────────────────────────┐                      │
│   │       [🛒 Pesan Jasa Serupa →]       │                      │
│   └──────────────────────────────────────┘                      │
└─────────────────────────────────────────────────────────────────┘
```

### 5.4 Data Model untuk Portfolio/Preview

```sql
-- Portfolio items (hasil karya) yang bisa di-preview
CREATE TABLE portfolio_items (
    id              TEXT PRIMARY KEY DEFAULT encode(gen_random_bytes(16), 'hex'),
    listing_id      TEXT REFERENCES listings(id) ON DELETE SET NULL,  -- link ke listing terkait
    title           TEXT NOT NULL,
    description     TEXT DEFAULT '',
    
    -- Preview
    preview_type    TEXT NOT NULL DEFAULT 'SCREENSHOT',  -- IFRAME | SCREENSHOT | VIDEO
    preview_url     TEXT DEFAULT '',           -- URL untuk iframe (live site)
    
    -- Images
    desktop_screenshot TEXT DEFAULT '',        -- screenshot desktop
    mobile_screenshot  TEXT DEFAULT '',        -- screenshot mobile
    
    -- Meta
    client_name     TEXT DEFAULT '',           -- nama klien (opsional, bisa anonim)
    tech_stack      TEXT[] DEFAULT '{}',       -- ["Next.js", "Tailwind", "Go"]
    
    is_featured     BOOLEAN DEFAULT false,
    sort_order      INT DEFAULT 0,
    is_active       BOOLEAN DEFAULT true,
    
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Gallery gambar per portfolio
CREATE TABLE portfolio_images (
    id              TEXT PRIMARY KEY DEFAULT encode(gen_random_bytes(16), 'hex'),
    portfolio_id    TEXT NOT NULL REFERENCES portfolio_items(id) ON DELETE CASCADE,
    url             TEXT NOT NULL,
    alt_text        TEXT DEFAULT '',
    sort_order      INT DEFAULT 0
);
```

---

## 6) Sistem Order (Revisi — Email/Telp Required)

### 6.1 Form Order — Contact Fleksibel

Pembeli wajib mengisi **MINIMAL 1** dari email atau nomor telepon (boleh keduanya):

```
┌─────────────────────────────────────────────────────────────────┐
│                       FORM ORDER                                 │
│                                                                  │
│  Pilih Paket:                                                    │
│  ○ Paket Basic — Rp 150.000                                     │
│  ● Paket Kompleks — Rp 500.000        [Lihat Detail]            │
│  ○ Paket Skripsi — Rp 2.000.000       [Lihat Detail]            │
│                                                                  │
│  ── Lengkapi Data ──                                            │
│                                                                  │
│  NAMA LENGKAP *                                                  │
│  [Contoh: Ahmad                                             ]    │
│                                                                  │
│  NO. WHATSAPP AKTIF                                              │
│  [🇮🇩 +62  | 812345678                                     ]    │
│                                                                  │
│  EMAIL AKTIF                                                     │
│  [contoh@gmail.com — untuk kirim link akses & file         ]    │
│                                                                  │
│  ⚠️ Isi minimal salah satu: Email atau No. WhatsApp              │
│                                                                  │
│  CATATAN / BRIEF                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Jelaskan kebutuhan Anda...                               │   │
│  │ (tugas apa, bahasa pemrograman, deadline, dll)           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  [📎 Upload file pendukung]  (opsional — PDF, gambar, zip)      │
│                                                                  │
│  ── 💳 Metode Pembayaran ──                                     │
│                                                                  │
│  ○ 📱 QRIS         (semua e-wallet & m-banking)                 │
│  ○ 🏦 BCA          (Bank Central Asia)                          │
│  ○ 💙 Dana                                                      │
│  ○ 💚 GoPay                                                     │
│  ○ 🧡 ShopeePay                                                 │
│  ○ 🏦 BNI Virtual Account                                       │
│  ○ 🏦 BRI Virtual Account                                       │
│  ○ 🏦 BSI Virtual Account                                       │
│  ○ 🏦 Bank Mandiri Virtual Account                               │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │          [🛒 Bayar Sekarang — Rp 500.000]                │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  🔒 Pembayaran diproses melalui Tripay / Paydisini (aman)      │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 Validasi Contact

```
Rule:
├── buyer_name      → WAJIB (min 2 karakter)
├── buyer_email     → OPSIONAL tapi...
├── buyer_phone     → OPSIONAL tapi...
└── CONSTRAINT: minimal 1 dari email/phone harus diisi

Logika di backend:
if buyer_email == "" && buyer_phone == "" {
    return error("Isi minimal email atau nomor WhatsApp")
}
```

### 6.3 Fungsi Contact Info

| Contact | Digunakan Untuk |
|---|---|
| **Email** | Kirim invoice, link tracking order, kirim file digital product, notifikasi status |
| **WhatsApp** | Notifikasi WA (via API), komunikasi langsung, kirim file deliverable |
| **Keduanya** | Ideal — user dapat notif di kedua channel |

---

## 7) Tracking Transaksi (Multi-method)

### 7.1 Cara Cek Status Pesanan

Pembeli bisa cek pesanan dengan **3 cara** (salah satu cukup):

```
app.netpulse.com/order/track

┌─────────────────────────────────────────────────────────────────┐
│               📦 Cek Status Pesanan                              │
│                                                                  │
│  Masukkan salah satu:                                            │
│                                                                  │
│  ┌─ Tab 1: No. Transaksi ──────────────────────────────────┐    │
│  │  No. Transaksi *  [TRX-20260220-001                   ] │    │
│  │                   [🔍 Cek Status]                       │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─ Tab 2: Email ──────────────────────────────────────────┐    │
│  │  Email *  [ahmad@email.com                            ] │    │
│  │           [🔍 Cari Pesanan]                             │    │
│  │  → Tampilkan semua order terkait email ini              │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─ Tab 3: No. WhatsApp ──────────────────────────────────┐    │
│  │  No. WhatsApp *  [+62812345678                        ] │    │
│  │                  [🔍 Cari Pesanan]                      │    │
│  │  → Tampilkan semua order terkait nomor ini              │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 Hasil Tracking

**Jika cari via No. TRX** → langsung tampil detail 1 transaksi.

**Jika cari via Email / Phone** → tampil **list semua transaksi** terkait:

```
┌─────────────────────────────────────────────────────────────────┐
│  📦 Pesanan untuk ahmad@email.com                                │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  TRX-20260220-001             20 Feb 2026               │   │
│  │  Jasa Tugas Pemrograman Java  ● SELESAI                 │   │
│  │  Rp 150.000                   [Lihat Detail →]          │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │  TRX-20260218-003             18 Feb 2026               │   │
│  │  Pembuatan Website Portfolio   ◐ DIKERJAKAN             │   │
│  │  Rp 3.500.000                 [Lihat Detail →]          │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │  TRX-20260215-007             15 Feb 2026               │   │
│  │  Template Next.js Starter     ● SELESAI                 │   │
│  │  Rp 200.000                   [Lihat Detail →]          │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 7.3 Keamanan Tracking

- **Via No. TRX**: langsung tampil detail (TRX number sudah cukup unik + rahasia)
- **Via Email/Phone**: tampilkan list order tapi **JANGAN** tampilkan info sensitif (payment proof, admin notes) — hanya status, judul, harga
- **Untuk detail lengkap**: tetap butuh access token dari email/WA (link yang dikirim saat order)
- **Rate limit**: max 5 lookup per menit per IP (anti-brute-force)

---

## 8) Payment Gateway — Tripay & Paydisini

### 8.1 Kenapa 2 Gateway?

| Gateway | Kelebihan | Channel |
|---|---|---|
| **Tripay** | Lengkap, stabil, banyak channel | QRIS, VA (BCA, BNI, BRI, Mandiri, BSI), E-wallet (Dana, OVO, ShopeePay, LinkAja) |
| **Paydisini** | Murah fee-nya, simple | QRIS, Dana, GoPay, OVO, bank transfer |

**Strategi**: Gunakan Tripay sebagai **primary**, Paydisini sebagai **fallback/alternatif**. Admin bisa pilih gateway mana yang aktif per metode pembayaran dari dashboard.

### 8.2 Alur Pembayaran Otomatis

```
┌─────────────────────────────────────────────────────────────────┐
│                  ALUR PEMBAYARAN OTOMATIS                        │
│                                                                  │
│  1. Pembeli isi form order + pilih metode pembayaran             │
│                  │                                               │
│  2. Backend      ▼                                               │
│     → Buat order di DB (status: PENDING_PAYMENT)                │
│     → Panggil API Tripay/Paydisini: create transaction          │
│     → Dapat: payment_url / VA number / QRIS code               │
│                  │                                               │
│  3. Frontend     ▼                                               │
│     → Redirect ke halaman pembayaran Tripay/Paydisini           │
│     → ATAU tampilkan QR code / VA number langsung               │
│                  │                                               │
│  4. Pembeli bayar (via app bank, e-wallet, scan QRIS)           │
│                  │                                               │
│  5. Callback     ▼                                               │
│     → Tripay/Paydisini kirim webhook ke backend                 │
│     → Backend verifikasi signature webhook                       │
│     → Update order status: PENDING_PAYMENT → PAID               │
│     → Kirim notifikasi ke pembeli (email/WA)                    │
│     → Jika produk digital → AUTO DELIVERY (lihat section 9)    │
│                  │                                               │
│  6. Admin lihat di dashboard: order baru masuk + sudah PAID     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 8.3 Config di Admin Panel

Admin bisa mengatur payment gateway dari dashboard:

```
Admin → Sistem → Pengaturan Pembayaran

┌─────────────────────────────────────────────────────────────────┐
│                PENGATURAN PEMBAYARAN                             │
│                                                                  │
│  ── Gateway Aktif ──                                            │
│  ☑ Tripay       API Key: [tr_xxx...  ]  Merchant: [T1234]      │
│  ☑ Paydisini    API Key: [pd_xxx...  ]  Merchant: [P5678]      │
│                                                                  │
│  ── Metode Pembayaran ──                                        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Metode           │ Gateway  │ Aktif │ Fee    │ Priority │   │
│  ├──────────────────┼──────────┼───────┼────────┼──────────┤   │
│  │ QRIS             │ Tripay   │  ✅   │ 0.7%  │ 1        │   │
│  │ BCA VA           │ Tripay   │  ✅   │ Rp4000│ 2        │   │
│  │ Dana             │ Paydisini│  ✅   │ 1.5%  │ 3        │   │
│  │ GoPay            │ Paydisini│  ✅   │ 2%    │ 4        │   │
│  │ ShopeePay        │ Tripay   │  ✅   │ 1.5%  │ 5        │   │
│  │ BNI VA           │ Tripay   │  ✅   │ Rp4000│ 6        │   │
│  │ BRI VA           │ Tripay   │  ✅   │ Rp4000│ 7        │   │
│  │ BSI VA           │ Tripay   │  ✅   │ Rp4000│ 8        │   │
│  │ Mandiri VA       │ Tripay   │  ✅   │ Rp4000│ 9        │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ── Pengaturan Lain ──                                          │
│  Batas waktu pembayaran: [24] jam                                │
│  Auto cancel jika tidak bayar: [✅]                             │
│  Notifikasi ke admin (WA): [+62xxx...]                          │
│  Notifikasi ke admin (Email): [admin@netpulse.com]              │
│                                                                  │
│  [💾 Simpan Pengaturan]                                         │
└─────────────────────────────────────────────────────────────────┘
```

### 8.4 Data Model Payment

```sql
-- Payment transactions (dari gateway)
CREATE TABLE payment_transactions (
    id              TEXT PRIMARY KEY DEFAULT encode(gen_random_bytes(16), 'hex'),
    order_id        TEXT NOT NULL REFERENCES orders(id),
    
    -- Gateway info
    gateway         TEXT NOT NULL,             -- TRIPAY | PAYDISINI
    gateway_ref     TEXT DEFAULT '',           -- reference ID dari gateway
    gateway_url     TEXT DEFAULT '',           -- URL pembayaran (redirect)
    
    -- Payment detail
    method          TEXT NOT NULL,             -- QRIS | BCA_VA | DANA | GOPAY | etc
    amount          BIGINT NOT NULL,
    fee             BIGINT DEFAULT 0,          -- fee gateway
    total           BIGINT NOT NULL,           -- amount + fee
    
    -- VA / QRIS info
    pay_code        TEXT DEFAULT '',           -- VA number / QRIS string
    qr_url          TEXT DEFAULT '',           -- URL gambar QR
    
    -- Status
    status          TEXT NOT NULL DEFAULT 'PENDING',
    -- PENDING | PAID | EXPIRED | FAILED | REFUNDED
    
    -- Timestamps
    expired_at      TIMESTAMPTZ,              -- batas waktu bayar
    paid_at         TIMESTAMPTZ,
    
    -- Webhook
    callback_data   JSONB DEFAULT '{}',       -- raw webhook data
    
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payment_order ON payment_transactions(order_id);
CREATE INDEX idx_payment_gateway_ref ON payment_transactions(gateway_ref);
CREATE INDEX idx_payment_status ON payment_transactions(status);

-- Payment settings (admin config)
CREATE TABLE payment_settings (
    id              TEXT PRIMARY KEY DEFAULT encode(gen_random_bytes(16), 'hex'),
    gateway         TEXT NOT NULL,             -- TRIPAY | PAYDISINI
    api_key         TEXT NOT NULL,             -- encrypted
    merchant_code   TEXT DEFAULT '',
    private_key     TEXT DEFAULT '',           -- encrypted (untuk Tripay signature)
    is_active       BOOLEAN DEFAULT true,
    is_sandbox      BOOLEAN DEFAULT false,     -- mode sandbox/production
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Payment methods (admin bisa enable/disable per metode)
CREATE TABLE payment_methods (
    id              TEXT PRIMARY KEY DEFAULT encode(gen_random_bytes(16), 'hex'),
    gateway         TEXT NOT NULL,             -- TRIPAY | PAYDISINI
    code            TEXT NOT NULL,             -- QRIS, BRIVA, BCAVA, etc
    name            TEXT NOT NULL,             -- "QRIS", "BCA Virtual Account"
    icon_url        TEXT DEFAULT '',
    fee_flat        BIGINT DEFAULT 0,          -- fee tetap (Rupiah)
    fee_percent     DECIMAL(5,2) DEFAULT 0,   -- fee persentase
    min_amount      BIGINT DEFAULT 0,
    max_amount      BIGINT DEFAULT 0,
    is_active       BOOLEAN DEFAULT true,
    sort_order      INT DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### 8.5 Webhook Handler (Go)

```
POST /api/webhooks/tripay         # Webhook dari Tripay
POST /api/webhooks/paydisini      # Webhook dari Paydisini

Flow:
1. Terima webhook
2. Validasi signature (HMAC SHA256 untuk Tripay, md5 untuk Paydisini)
3. Cari payment_transaction by gateway_ref
4. Update status: PAID
5. Update order status: PAID
6. Jika listing_type == 'DIGITAL_PRODUCT' → trigger auto-delivery
7. Kirim notifikasi ke pembeli (email/WA)
8. Kirim notifikasi ke admin
9. Catat revenue_entry
```

---

## 9) Auto-Delivery Produk Digital

### 9.1 Konsep

Ketika pembeli bayar produk digital (template, source code, e-book, dll), file **langsung dikirim otomatis** tanpa menunggu admin. Pengiriman tergantung contact info yang diisi:

| Pembeli Isi | Auto-Delivery Via |
|---|---|
| Email saja | Email — kirim link download |
| WhatsApp saja | WA — kirim link download + file (jika kecil) |
| Email + WhatsApp | Keduanya — email + WA |

### 9.2 Alur Auto-Delivery

```
Pembayaran CONFIRMED (webhook) 
    │
    ├── Cek listing_type == 'DIGITAL_PRODUCT'?
    │   ├── Ya → AUTO DELIVERY
    │   │   ├── Generate signed download URL (expired 7 hari)
    │   │   ├── Jika buyer_email ada:
    │   │   │   └── Kirim email dengan link download + instruksi
    │   │   ├── Jika buyer_phone ada:
    │   │   │   └── Kirim WA dengan link download
    │   │   ├── Update order status → COMPLETED
    │   │   └── Kirim link review
    │   │
    │   └── Tidak (SERVICE / ACADEMIC) → status tetap PAID
    │       └── Admin/Programmer assign & kerjakan manual
    │
    └── Log: delivery_sent_at, delivery_method, delivery_url
```

### 9.3 Admin Config Auto-Delivery

```
Admin → Marketplace → Listings → Edit Listing

┌─────────────────────────────────────────────────────────────────┐
│  ── Auto-Delivery Settings ──  (hanya untuk produk digital)     │
│                                                                  │
│  Tipe delivery:  [Auto ▼]   (Auto / Manual)                    │
│                                                                  │
│  File yang dikirim:                                              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  📄 nextjs-starter-kit-v2.zip  (45 MB)    [Ganti file]  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Kirim via:                                                      │
│  ☑ Email (link download)                                         │
│  ☑ WhatsApp (link download)                                      │
│                                                                  │
│  Link download expired: [7] hari                                 │
│  Max download: [5] kali                                          │
│                                                                  │
│  Template email:                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Hai {{buyer_name}},                                      │   │
│  │                                                          │   │
│  │ Terima kasih sudah membeli {{listing_title}}! 🎉         │   │
│  │ Silakan download file Anda di link berikut:              │   │
│  │                                                          │   │
│  │ {{download_url}}                                         │   │
│  │                                                          │   │
│  │ Link berlaku {{expiry_days}} hari.                       │   │
│  │ Jika ada pertanyaan, hubungi kami di WhatsApp.           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Template WhatsApp:                                              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Hai {{buyer_name}}! 🎉                                   │   │
│  │ Pembayaran {{listing_title}} sudah diterima.             │   │
│  │ Download: {{download_url}}                               │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  [💾 Simpan]                                                    │
└─────────────────────────────────────────────────────────────────┘
```

### 9.4 Data Model — Delivery Tracking

```sql
-- Tambahan kolom di orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_method TEXT DEFAULT '';
    -- EMAIL | WHATSAPP | BOTH | MANUAL
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_sent_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS download_url TEXT DEFAULT '';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS download_expires_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS download_count INT DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS max_downloads INT DEFAULT 5;

-- Tambahan kolom di listings table (untuk auto-delivery config)
ALTER TABLE listings ADD COLUMN IF NOT EXISTS auto_delivery BOOLEAN DEFAULT false;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS delivery_file_url TEXT DEFAULT '';
ALTER TABLE listings ADD COLUMN IF NOT EXISTS delivery_file_name TEXT DEFAULT '';
ALTER TABLE listings ADD COLUMN IF NOT EXISTS delivery_file_size BIGINT DEFAULT 0;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS delivery_expiry_days INT DEFAULT 7;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS delivery_max_downloads INT DEFAULT 5;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS delivery_email_template TEXT DEFAULT '';
ALTER TABLE listings ADD COLUMN IF NOT EXISTS delivery_wa_template TEXT DEFAULT '';
```

---

## 10) Admin Panel (Revisi — Password & Settings)

### 10.1 Halaman Ubah Password

Setiap user yang login di admin panel bisa ubah password mereka:

```
Admin → Akun Saya → Ubah Password

┌─────────────────────────────────────────────────────────────────┐
│                    🔒 Ubah Password                              │
│                                                                  │
│  Password Lama *                                                 │
│  [••••••••••                                                ]    │
│                                                                  │
│  Password Baru *                                                 │
│  [                                                          ]    │
│  Min. 8 karakter, kombinasi huruf besar, kecil, angka, simbol   │
│                                                                  │
│  Konfirmasi Password Baru *                                      │
│  [                                                          ]    │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Password strength: ████████░░  KUAT                     │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│                         [💾 Ubah Password]                      │
│                                                                  │
│  ⚠️  Setelah ubah password, semua sesi aktif akan di-logout     │
│      kecuali sesi ini.                                           │
└─────────────────────────────────────────────────────────────────┘
```

### 10.2 Halaman Profil Admin (Sederhana)

```
Admin → Akun Saya

┌─────────────────────────────────────────────────────────────────┐
│                    👤 Akun Saya                                  │
│                                                                  │
│  ┌─────┐                                                        │
│  │ 📷  │  Nama: Ahmad Khadafi                                   │
│  │     │  Email: admin@netpulse.com                              │
│  │     │  Role: SUPERADMIN                                       │
│  └─────┘  Bergabung: 1 Jan 2026                                 │
│                                                                  │
│  [✏️ Edit Profil]   [🔒 Ubah Password]   [📱 Sesi Aktif]       │
└─────────────────────────────────────────────────────────────────┘
```

### 10.3 Admin Sidebar (Revisi Final v4)

```
📊 Dashboard

📝 BLOG
├── Artikel
├── Media Library
├── Kategori & Tag
└── Komentar

🛒 MARKETPLACE
├── Listings (Jasa & Produk)
├── Portfolio / Preview           ← BARU (manage portfolio items)
├── Orders
├── Kategori Listing
└── Reviews

📢 MONETISASI
├── Ad Slots (Google AdSense)
├── Campaigns (Iklan Custom)
├── Ads Reports
└── Revenue Dashboard

👥 TIM
├── Users
└── Roles & Permissions

⚙️ SISTEM
├── Pengaturan Pembayaran        ← BARU (Tripay, Paydisini, metode)
├── Template Notifikasi          ← BARU (email & WA templates)
├── SEO
├── Pengaturan Umum
├── Legal & Kebijakan
└── Audit Log

👤 AKUN SAYA                     ← BARU
├── Edit Profil
├── Ubah Password
└── Sesi Aktif
```

### 10.4 Pengaturan Template Notifikasi (Admin)

Admin bisa customize template email & WA untuk semua event:

```
Admin → Sistem → Template Notifikasi

┌─────────────────────────────────────────────────────────────────┐
│              TEMPLATE NOTIFIKASI                                 │
│                                                                  │
│  [Email ▼]  [WhatsApp ▼]                                       │
│                                                                  │
│  ── Email Templates ──                                          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Event                        │ Status    │ Aksi          │   │
│  ├──────────────────────────────┼───────────┼───────────────┤   │
│  │ Order Baru (ke pembeli)      │ ✅ Aktif  │ [Edit]        │   │
│  │ Pembayaran Diterima          │ ✅ Aktif  │ [Edit]        │   │
│  │ Order Dikerjakan             │ ✅ Aktif  │ [Edit]        │   │
│  │ Order Selesai                │ ✅ Aktif  │ [Edit]        │   │
│  │ Auto-Delivery (produk)       │ ✅ Aktif  │ [Edit]        │   │
│  │ Order Dibatalkan             │ ✅ Aktif  │ [Edit]        │   │
│  │ Request Review               │ ✅ Aktif  │ [Edit]        │   │
│  │ Order Baru (ke admin)        │ ✅ Aktif  │ [Edit]        │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Variabel yang tersedia:                                         │
│  {{buyer_name}}, {{order_number}}, {{listing_title}},           │
│  {{package_name}}, {{amount}}, {{status}}, {{tracking_url}},    │
│  {{download_url}}, {{review_url}}, {{wa_link}}                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 11) Login Tersembunyi

### 11.1 Strategi Menyembunyikan Login

Login untuk admin/internal team **dipersulit aksesnya** agar user biasa tidak bisa menemukan:

#### Metode 1: URL Rahasia (Rekomendasi)

```
Login page TIDAK di:
  ❌ netpulse.com/admin
  ❌ netpulse.com/login
  ❌ app.netpulse.com/login

Login page di URL RAHASIA:
  ✅ netpulse.com/gerbang                    ← path custom yang hanya tim tahu
  ✅ Atau: netpulse.com/portal-[randomhash]  ← lebih aman
```

**URL login bisa di-set dari environment variable:**
```env
ADMIN_LOGIN_PATH=/gerbang
# atau
ADMIN_LOGIN_PATH=/portal-x7k9m2
```

#### Metode 2: Proteksi Tambahan

Selain URL rahasia, tambahkan lapisan keamanan:

```
1. URL rahasia (hanya tim yang tahu path-nya)
2. Rate limit ketat: max 5 attempt / 15 menit per IP
3. Auto-lock account setelah 10 failed attempts
4. Notifikasi email ke superadmin jika ada failed login
5. robots.txt: Disallow ADMIN_LOGIN_PATH
6. Tidak ada link ke login di manapun di website
7. Halaman login TIDAK ada di sitemap
```

### 11.2 Login Page Design

```
netpulse.com/gerbang

┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│                    🔒 Internal Access                            │
│                                                                  │
│  Email                                                           │
│  [                                                          ]    │
│                                                                  │
│  Password                                                        │
│  [                                                          ]    │
│                                                                  │
│                   [🔑 Masuk]                                    │
│                                                                  │
│  Halaman ini hanya untuk tim internal NetPulse.                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

- TIDAK ada link "Register" / "Lupa Password" (reset via superadmin)
- TIDAK ada branding berlebihan
- Minimalis, tanpa navigasi
- Tidak terindex Google (noindex, nofollow)

### 11.3 Setelah Login → Redirect ke Admin

```
Login berhasil → redirect ke netpulse.com/admin/dashboard
                 (halaman admin normal)

Admin panel tetap di /admin/* tapi:
- /admin hanya bisa diakses jika sudah login
- Jika belum login, TIDAK redirect ke /login → tampil 404
- Login hanya bisa dilakukan dari /gerbang (atau path rahasia lain)
```

---

## 12) Model Data (Revisi dari v3)

### 12.1 Perubahan Order Table

```sql
CREATE TABLE orders (
    id              TEXT PRIMARY KEY DEFAULT encode(gen_random_bytes(16), 'hex'),
    order_number    TEXT NOT NULL UNIQUE,      -- "TRX-20260220-001"
    
    -- Buyer (GUEST — minimal 1 contact)
    buyer_name      TEXT NOT NULL,
    buyer_email     TEXT DEFAULT '',           -- opsional tapi minimal 1
    buyer_phone     TEXT DEFAULT '',           -- opsional tapi minimal 1
    -- CHECK: email atau phone harus diisi
    
    -- Access Token
    access_token    TEXT NOT NULL,
    
    -- Listing & Package  
    listing_id      TEXT NOT NULL REFERENCES listings(id),
    package_id      TEXT REFERENCES listing_packages(id),
    listing_title   TEXT NOT NULL,
    package_name    TEXT DEFAULT '',
    listing_type    TEXT NOT NULL,             -- SERVICE | DIGITAL_PRODUCT | ACADEMIC
    
    -- Pricing
    amount          BIGINT NOT NULL,
    currency        TEXT DEFAULT 'IDR',
    
    -- Status
    status          TEXT NOT NULL DEFAULT 'PENDING_PAYMENT',
    -- PENDING_PAYMENT → PAID → IN_PROGRESS → COMPLETED
    -- Alternatif: EXPIRED, CANCELLED, REFUNDED
    
    -- Payment (via gateway)
    payment_id      TEXT REFERENCES payment_transactions(id),
    paid_at         TIMESTAMPTZ,
    
    -- Delivery
    delivery_method TEXT DEFAULT '',           -- EMAIL | WHATSAPP | BOTH | MANUAL
    delivery_sent_at TIMESTAMPTZ,
    download_url    TEXT DEFAULT '',
    download_expires_at TIMESTAMPTZ,
    download_count  INT DEFAULT 0,
    max_downloads   INT DEFAULT 5,
    
    -- File deliverable (untuk jasa — hasil kerjaan)
    deliverable_url   TEXT DEFAULT '',
    deliverable_notes TEXT DEFAULT '',
    
    -- Buyer Input
    buyer_notes     TEXT DEFAULT '',
    buyer_files     TEXT[] DEFAULT '{}',
    
    -- Admin Internal
    admin_notes     TEXT DEFAULT '',
    assigned_to     TEXT REFERENCES users(id),
    
    -- Timestamps
    completed_at    TIMESTAMPTZ,
    cancelled_at    TIMESTAMPTZ,
    expired_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraint: minimal 1 contact
    CONSTRAINT order_contact_required 
        CHECK (buyer_email != '' OR buyer_phone != '')
);

CREATE INDEX idx_orders_email ON orders(buyer_email);
CREATE INDEX idx_orders_phone ON orders(buyer_phone);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_number ON orders(order_number);
CREATE INDEX idx_orders_assigned ON orders(assigned_to);
```

### 12.2 Tabel Baru — Payment

Lihat section 8.4 di atas:
- `payment_transactions`
- `payment_settings`
- `payment_methods`

### 12.3 Tabel Baru — Portfolio

Lihat section 5.4 di atas:
- `portfolio_items`
- `portfolio_images`

### 12.4 Tabel Baru — Notification Templates

```sql
CREATE TABLE notification_templates (
    id              TEXT PRIMARY KEY DEFAULT encode(gen_random_bytes(16), 'hex'),
    event           TEXT NOT NULL UNIQUE,      -- ORDER_CREATED, PAYMENT_RECEIVED, etc
    channel         TEXT NOT NULL,             -- EMAIL | WHATSAPP
    subject         TEXT DEFAULT '',           -- untuk email
    body            TEXT NOT NULL,             -- template body (dengan {{variables}})
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(event, channel)
);

-- Default templates
INSERT INTO notification_templates (id, event, channel, subject, body) VALUES
('nt_order_email', 'ORDER_CREATED', 'EMAIL', 
 'Pesanan Anda #{{order_number}} Berhasil Dibuat',
 'Hai {{buyer_name}},\n\nPesanan Anda telah dibuat:\n- {{listing_title}} ({{package_name}})\n- Total: Rp {{amount}}\n\nSilakan selesaikan pembayaran.\n\nCek status: {{tracking_url}}'),

('nt_paid_email', 'PAYMENT_RECEIVED', 'EMAIL',
 'Pembayaran #{{order_number}} Diterima ✅',
 'Hai {{buyer_name}},\n\nPembayaran sebesar Rp {{amount}} telah kami terima.\nPesanan Anda sedang kami proses.\n\nCek status: {{tracking_url}}'),

('nt_completed_email', 'ORDER_COMPLETED', 'EMAIL',
 'Pesanan #{{order_number}} Selesai 🎉',
 'Hai {{buyer_name}},\n\nPesanan Anda telah selesai!\n\n{{download_url}}\n\nBerikan review: {{review_url}}\nTerima kasih! 🙏'),

('nt_delivery_email', 'AUTO_DELIVERY', 'EMAIL',
 'File {{listing_title}} Siap Didownload 📥',
 'Hai {{buyer_name}},\n\nTerima kasih sudah membeli {{listing_title}}! 🎉\n\nDownload: {{download_url}}\nBerlaku {{expiry_days}} hari.\n\nAda pertanyaan? Hubungi WA: {{wa_link}}'),

('nt_order_wa', 'ORDER_CREATED', 'WHATSAPP',
 '',
 'Hai {{buyer_name}}! 👋\nPesanan #{{order_number}} berhasil dibuat.\n{{listing_title}} - Rp {{amount}}\n\nSilakan bayar: {{payment_url}}\nCek status: {{tracking_url}}'),

('nt_paid_wa', 'PAYMENT_RECEIVED', 'WHATSAPP',
 '',
 'Hai {{buyer_name}}! ✅\nPembayaran #{{order_number}} diterima.\nSedang kami proses. Terima kasih! 🙏'),

('nt_delivery_wa', 'AUTO_DELIVERY', 'WHATSAPP',
 '',
 'Hai {{buyer_name}}! 🎉\n{{listing_title}} siap!\nDownload: {{download_url}}\nBerlaku {{expiry_days}} hari.')
ON CONFLICT (event, channel) DO NOTHING;
```

---

## 13) API Surface (Revisi)

### 13.1 Perubahan dari v3

```diff
  # Auth
  POST /auth/login                  # ← path ini di-block, login via ADMIN_LOGIN_PATH saja
+ POST /auth/change-password        # ← BARU: ubah password sendiri

  # Store Orders
- POST /store/orders                # create order (v3: manual)
+ POST /store/orders                # create order → +create payment via Tripay/Paydisini
- GET  /store/orders/track          # track via email + order number
+ GET  /store/orders/track          # track via email / phone / trx number

  # Webhooks (BARU)
+ POST /webhooks/tripay             # Callback pembayaran Tripay
+ POST /webhooks/paydisini          # Callback pembayaran Paydisini

  # Portfolio (BARU)
+ GET  /store/portfolio             # List portfolio items (public)
+ GET  /store/portfolio/:id         # Detail portfolio

  # Admin Portfolio (BARU)
+ GET    /admin/portfolio
+ POST   /admin/portfolio
+ PUT    /admin/portfolio/:id
+ DELETE /admin/portfolio/:id

  # Admin Payment Settings (BARU)
+ GET    /admin/payment-settings
+ PUT    /admin/payment-settings
+ GET    /admin/payment-methods
+ POST   /admin/payment-methods
+ PUT    /admin/payment-methods/:id
+ DELETE /admin/payment-methods/:id

  # Admin Notification Templates (BARU)
+ GET    /admin/notification-templates
+ PUT    /admin/notification-templates/:id

  # Admin Account (BARU)
+ GET    /admin/me                  # Get current user profile
+ PUT    /admin/me                  # Update profil
+ POST   /admin/me/change-password  # Ubah password
+ GET    /admin/me/sessions         # List sesi aktif
+ DELETE /admin/me/sessions/:id     # Revoke sesi
```

### 13.2 Store Order API — Revisi

```
POST /store/orders
Body:
{
  "listing_id": "xxx",
  "package_id": "yyy",           // opsional
  "buyer_name": "Ahmad Khadafi",
  "buyer_email": "ahmad@email.com",    // opsional (min 1 contact)
  "buyer_phone": "+62812345678",       // opsional (min 1 contact)
  "buyer_notes": "Tugas Java OOP, deadline 25 Feb...",
  "payment_method": "QRIS",           // BARU: pilih metode
  "buyer_files": []                    // opsional
}

Response:
{
  "order_number": "TRX-20260220-001",
  "status": "PENDING_PAYMENT",
  "amount": 500000,
  "payment": {
    "method": "QRIS",
    "gateway": "TRIPAY",
    "pay_url": "https://tripay.co.id/checkout/xxx",    // redirect URL
    "qr_url": "https://tripay.co.id/qr/xxx.png",      // gambar QR
    "expired_at": "2026-02-21T12:00:00Z"
  },
  "tracking_url": "https://app.netpulse.com/order/TRX-20260220-001?token=abc123"
}
```

### 13.3 Order Tracking API — Revisi

```
GET /store/orders/track?method=trx&value=TRX-20260220-001
GET /store/orders/track?method=email&value=ahmad@email.com
GET /store/orders/track?method=phone&value=+62812345678

Response (list):
{
  "orders": [
    {
      "order_number": "TRX-20260220-001",
      "listing_title": "Jasa Tugas Pemrograman Java",
      "amount": 150000,
      "status": "COMPLETED",
      "created_at": "2026-02-20T10:00:00Z"
    }
  ]
}

// Detail tetap butuh access_token:
GET /store/orders/TRX-20260220-001?token=abc123
```

---

## 14) Roadmap Implementasi (Revisi)

### Phase 0: Cleanup (1 minggu) — Sama dengan v3

| Task | Estimasi |
|---|---|
| Hapus affiliate, user login, user panel, profile view | 1.5 hari |
| Sembunyikan login (URL rahasia, env config) | 0.5 hari |
| Ubah komentar: auto-publish + likes | 1 hari |
| Update roles (SUPERADMIN, PROGRAMMER) | 0.5 hari |
| Tambah halaman ubah password di admin | 0.5 hari |
| Tambah halaman profil admin sederhana | 0.5 hari |
| Testing | 1 hari |

### Phase 1: Marketplace + Payment (3-4 minggu)

| Task | Estimasi |
|---|---|
| Setup `apps/store` (Next.js) | 0.5 hari |
| Migration: listings, packages, orders, reviews, portfolio | 1 hari |
| Migration: payment_transactions, payment_settings, payment_methods | 0.5 hari |
| Migration: notification_templates | 0.5 hari |
| Domain models (Go): Listing, Order, Payment, Portfolio | 2 hari |
| Repository: Listing CRUD, Order lifecycle | 2 hari |
| **Integrasi Tripay** — API client, create transaction, webhook | 2 hari |
| **Integrasi Paydisini** — API client, create transaction, webhook | 1.5 hari |
| Handlers: Store API (listing, order, payment, tracking) | 2 hari |
| Handlers: Admin API (listing, order, payment settings) | 2 hari |
| **Frontend Store: Landing page premium** (semua section) | 3 hari |
| **Frontend Store: Live preview modal** | 1 hari |
| **Frontend Store: Detail listing page** (/[slug]) | 1.5 hari |
| **Frontend Store: Order form + payment selection** | 1.5 hari |
| **Frontend Store: Order tracking** (multi-method) | 1 hari |
| Frontend Admin: Listing CRUD | 2 hari |
| Frontend Admin: Order management | 2 hari |
| Frontend Admin: Portfolio management | 1 hari |
| Frontend Admin: Payment settings | 1 hari |
| **Auto-delivery produk digital** | 1.5 hari |
| Email/WA notifikasi (semua event) | 1.5 hari |
| Frontend Admin: Template notifikasi | 1 hari |
| Testing | 2 hari |

### Phase 2: Ads Campaign + Revenue (2 minggu) — Sama dengan v3

### Phase 3: Polish (1 minggu)

| Task | Estimasi |
|---|---|
| Review system (store + admin) | 2 hari |
| Enhanced admin dashboard | 1.5 hari |
| Mobile optimization final | 1 hari |
| SEO marketplace (sitemap, OG, structured data) | 1 hari |
| Performance & security testing | 1 hari |

### Phase 4: Advanced (opsional)

- WhatsApp Business API (notifikasi WA otomatis)
- Invoice PDF auto-generation
- Membership tier
- Multi-currency
- Affiliate program (jika kapan-kapan mau ditambahkan kembali)
- Analytics dashboard lebih detail

---

## 15) Keputusan Final

| No | Keputusan | Jawaban |
|---|---|---|
| 1 | Profile view author di blog? | ❌ **Dihapus** — nama author hanya teks, tidak clickable |
| 2 | Login link di website? | ❌ **Tidak ada** — login via URL rahasia (`/gerbang`) |
| 3 | Admin ubah password? | ✅ **Ada** — halaman khusus di admin panel |
| 4 | Contact info order? | **Email ATAU Phone** — minimal 1, boleh keduanya |
| 5 | Tracking transaksi? | **3 cara**: No. TRX, Email, atau No. Phone |
| 6 | Landing page marketplace? | **Premium** — 11 section, mobile-first, high-converting |
| 7 | Live preview? | ✅ **Modal** — iframe untuk website, screenshot carousel untuk lainnya |
| 8 | Payment gateway? | **Tripay** (primary) + **Paydisini** (secondary) |
| 9 | Payment otomatis? | ✅ **Webhook** — auto update status setelah bayar |
| 10 | Auto-delivery produk digital? | ✅ **Otomatis** — kirim file via email/WA setelah bayar |
| 11 | Admin kelola payment? | ✅ **Full control** — gateway, metode, fee, template |
| 12 | Halaman marketplace? | **Minimal: 4-5 halaman** — landing, detail, tracking, kebijakan |
| 13 | Order number format? | `TRX-YYYYMMDD-XXX` (ganti dari ORD ke TRX) |
| 14 | Mobile-friendly? | ✅ **Mobile-first** — sticky CTA, full-width buttons, responsive |

---

## 16) Ringkasan Eksekutif

| Aspek | v3 | v4 |
|---|---|---|
| **Profile Author** | Ada (view) | ❌ Dihapus |
| **Login** | Ada di `/admin/login` | Tersembunyi (`/gerbang`) |
| **Admin Password** | Tidak ada ubah password | ✅ Ada halaman ubah password |
| **Order Contact** | Email + Phone wajib | Email ATAU Phone (min 1) |
| **Tracking** | Email + Order Number | Email / Phone / TRX Number |
| **Landing Page** | Basic grid | Premium 11-section |
| **Live Preview** | Tidak ada | ✅ Modal (iframe/screenshot) |
| **Payment** | Manual transfer | Tripay + Paydisini (otomatis) |
| **Auto-Delivery** | Manual | ✅ Otomatis via email/WA |
| **Halaman** | 10+ halaman | 4-5 halaman (minimalis) |

```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│   NetPulse v4 = "All-in-One Development Service Platform"      │
│                                                                │
│   📝 netpulse.com      → Baca & diskusi (blog, no login)      │
│   💻 app.netpulse.com  → Order jasa & produk (no account)     │
│   🔧 /gerbang           → Login internal team only            │
│   🔑 /admin             → Kelola semua dari satu tempat       │
│                                                                │
│   Flow:                                                        │
│   Pengunjung → Baca artikel → Klik CTA →                       │
│   → Landing page marketplace → Pilih jasa/produk →             │
│   → Isi form → Bayar (QRIS/VA/E-wallet) →                     │
│   → Otomatis terverifikasi → Dikerjakan / Auto-delivered →     │
│   → Selesai! 🎉                                                │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```
