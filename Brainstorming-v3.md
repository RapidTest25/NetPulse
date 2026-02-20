# NetPulse — Brainstorming v3: Arsitektur Subdomain, Simplifikasi Blog & Order Tanpa Login

> Dokumen ini adalah kelanjutan dari `Brainstorming-v2.md`. Fokus utama: **pemisahan blog & marketplace via subdomain**, penghapusan affiliate & login user di blog, **order tanpa akun**, overhaul sistem komentar ala Facebook, dan penajaman produk ke **jasa development & akademik**.

---

## Daftar Isi

1. [Perubahan Besar dari v2](#1-perubahan-besar-dari-v2)
2. [Arsitektur Subdomain](#2-arsitektur-subdomain)
3. [Simplifikasi Blog (netpulse.com)](#3-simplifikasi-blog-netpulsecom)
4. [Marketplace (app.netpulse.com)](#4-marketplace-appnetpulsecom)
5. [Sistem Order Tanpa Login](#5-sistem-order-tanpa-login)
6. [Overhaul Komentar (Facebook-style)](#6-overhaul-komentar-facebook-style)
7. [Role & Auth yang Disederhanakan](#7-role--auth-yang-disederhanakan)
8. [Struktur Folder & Monorepo](#8-struktur-folder--monorepo)
9. [Model Data (Revisi)](#9-model-data-revisi)
10. [API Surface (Revisi)](#10-api-surface-revisi)
11. [Admin Panel Unified](#11-admin-panel-unified)
12. [Infrastruktur & Deployment](#12-infrastruktur--deployment)
13. [Roadmap Implementasi (Revisi)](#13-roadmap-implementasi-revisi)
14. [Keputusan Final](#14-keputusan-final)

---

## 1) Perubahan Besar dari v2

| Aspek | v2 (Lama) | v3 (Baru) | Alasan |
|---|---|---|---|
| **URL Marketplace** | Satu domain (`netpulse.com/listings`) | Subdomain `app.netpulse.com` | Pemisahan concern yang jelas, branding berbeda |
| **Affiliate System** | ✅ Ada di blog | ❌ **Dihapus** | Terlalu kompleks, tidak fokus |
| **User Login di Blog** | ✅ Ada (register, login, profile) | ❌ **Dihapus** | Pengunjung blog tidak perlu akun |
| **Order Requirement** | Harus login/register | **Tanpa akun** — isi form saja | Menurunkan friction, lebih banyak konversi |
| **Siapa yang login?** | Semua user bisa register | Hanya **Programmer, Author, Admin, Superadmin** | Internal team only |
| **Komentar Blog** | Harus di-approve admin dulu | **Langsung tampil** (auto-approve) | Engagement lebih cepat |
| **Like Komentar** | ❌ Tidak ada | ✅ **Bisa like komentar** (ala Facebook) | Interaksi lebih kaya |
| **Reply Komentar** | ✅ Ada | ✅ **Tetap ada** (nested thread) | Diskusi lebih natural |
| **Folder Structure** | 1 web app (`apps/web`) | 2 web app (`apps/web` + `apps/store`) | Separation of concerns |

### Fitur yang DIHAPUS

1. **Affiliate System** — semua tabel & logic affiliate dihapus
   - `affiliate_settings`, `affiliate_profiles`, `affiliate_commissions`, `affiliate_payouts`
   - Halaman affiliate di user panel
   - Halaman affiliate di admin panel
   - Referral link & tracking

2. **User Registration & Login di Blog** — dihapus
   - Form register / login untuk public user
   - User profile page
   - User dashboard
   - Saved posts (bookmark)
   - Referral code per user

3. **Comment Approval Workflow** — disederhanakan
   - Status `PENDING` → `APPROVED` dihapus
   - Komentar langsung tampil setelah submit
   - Admin tetap bisa delete/hide komentar yang melanggar (moderasi ringan)

---

## 2) Arsitektur Subdomain

### 2.1 Peta Domain

```
┌─────────────────────────────────────────────────────────────────────┐
│                        NETPULSE ECOSYSTEM                           │
├─────────────────────────────────┬───────────────────────────────────┤
│                                 │                                   │
│    netpulse.com                 │    app.netpulse.com               │
│    (Blog / Media)               │    (Marketplace / Store)          │
│                                 │                                   │
│  • Artikel & Berita IT          │  • Katalog Jasa Development       │
│  • Kategori, Tag, Series        │  • Jasa Tugas Kuliah / Akademik   │
│  • Komentar (FB-style)          │  • Produk Digital (source code)   │
│  • Google AdSense               │  • Order Form (tanpa login)       │
│  • Iklan Custom Campaign        │  • Tracking Order (via email)     │
│  • SEO optimized (SSG/ISR)      │  • Review & Rating                │
│                                 │                                   │
│  🔒 Tidak ada login user        │  🔓 Tidak perlu login untuk order  │
│  👁️ Pengunjung = reader saja    │  📧 Identifikasi via email         │
│                                 │                                   │
├─────────────────────────────────┴───────────────────────────────────┤
│                                                                     │
│    admin.netpulse.com (atau netpulse.com/admin)                     │
│    (Admin Panel — UNIFIED)                                          │
│                                                                     │
│  🔒 Login: Superadmin, Admin, Editor, Author, Programmer           │
│  • Manage Blog (artikel, kategori, komentar)                        │
│  • Manage Marketplace (listings, orders, reviews)                   │
│  • Manage Ads (AdSense + Campaign custom)                           │
│  • Revenue Dashboard                                                │
│  • Users & Roles (internal team saja)                               │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Kenapa Subdomain?

| Aspek | Satu Domain | Subdomain ✅ |
|---|---|---|
| Branding | Bisa membingungkan — blog campur toko | Jelas: `.com` = baca, `app.` = beli |
| SEO | Blog SEO bisa terpengaruh konten marketplace | Blog SEO murni, marketplace optional SEO |
| Development | Satu Next.js app besar | Dua app kecil, lebih mudah maintain |
| Deploy | Deploy satu app = redeploy semua | Deploy independen |
| Performance | Bundle size besar (blog + store) | Tiap app lean & focused |
| User Experience | Navigasi antara blog & store via link | Cross-link via subdomain, tetap smooth |

### 2.3 Resource yang Shared

Meskipun terpisah di 2 app, keduanya **share**:

| Resource | Cara Share |
|---|---|
| **Database** (Postgres) | Sama — 1 database, 1 connection string |
| **API Backend** (Go) | Sama — 1 API server, endpoint berbeda prefix |
| **Redis** | Sama — 1 instance |
| **Auth & Session** | Sama — internal login berlaku untuk admin panel di kedua app |
| **Admin Panel** | Satu tempat — bisa di `netpulse.com/admin` atau `admin.netpulse.com` |
| **Media/Upload** | Sama — satu storage untuk gambar, file, dll |

---

## 3) Simplifikasi Blog (netpulse.com)

### 3.1 Yang Tetap Ada

| Fitur | Catatan |
|---|---|
| Artikel + Workflow Editorial | Draft → Review → Publish, revisions, series |
| Multi-Author | Author bisa nulis artikel |
| SEO (sitemap, OG, schema) | SSR/ISR, meta tags |
| Kategori, Tag, Series | Organisasi konten |
| Google AdSense | Slot iklan (header, sidebar, in-article, footer) |
| Kampanye Iklan Custom | Banner, tracking impression/click (dari v2) |
| Media Library | Upload gambar untuk artikel |
| Legal Pages | Privacy Policy, Terms, About, Contact |

### 3.2 Yang BERUBAH

| Fitur Lama | Perubahan |
|---|---|
| Comment approval workflow | **Komentar langsung tampil** — tidak perlu approval |
| Like hanya untuk post | **Like juga untuk komentar** |
| Comment reply (basic) | **Reply + Like** ala Facebook |
| User login/register | **Dihapus** — tidak ada akun user di blog |
| Saved posts / bookmark | **Dihapus** — tidak ada akun user |
| User profile page | **Dihapus** |
| Affiliate panel | **Dihapus seluruhnya** |

### 3.3 Yang DIHAPUS

- ❌ Halaman `/register`, `/login`, `/forgot-password`
- ❌ Halaman `/user/profile`, `/user/settings`
- ❌ Halaman `/user/saved-posts`
- ❌ Halaman `/user/affiliate`, `/ref/[code]`
- ❌ Semua API endpoint: `/auth/register`, `/auth/login` (untuk public user)
- ❌ Tabel: `affiliate_settings`, `affiliate_profiles`, `affiliate_commissions`, `affiliate_payouts`
- ❌ Referral code, referral events (untuk public user)

### 3.4 Komentar di Blog — Identifikasi Tanpa Akun

Karena tidak ada login user, komentar menggunakan identifikasi **guest**:

```
Untuk berkomentar, isi:
┌───────────────────────────────────────┐
│  Nama *        [Ahmad Khadafi       ] │
│  Email *       [ahmad@email.com     ] │  ← tidak ditampilkan publik
│                                       │
│  Komentar *                           │
│  ┌───────────────────────────────┐    │
│  │ Artikelnya sangat membantu!   │    │
│  │ Terima kasih penjelasannya.   │    │
│  └───────────────────────────────┘    │
│                                       │
│           [💬 Kirim Komentar]         │
└───────────────────────────────────────┘
```

- **Nama** wajib — ditampilkan publik
- **Email** wajib — untuk gravatar & anti-spam, TIDAK ditampilkan publik
- **Komentar langsung muncul** — tanpa approval
- **Admin bisa delete/hide** komentar yang spam atau melanggar (moderasi ringan)
- **Rate limit** — max 3 komentar per menit per IP (anti-spam)
- **Captcha (opsional)** — tambahkan jika spam tinggi (hCaptcha / Turnstile)

---

## 4) Marketplace (app.netpulse.com)

### 4.1 Fokus Produk/Jasa

```
┌──────────────────────────────────────────────────────────────────┐
│                       JASA & PRODUK                              │
├──────────────────┬──────────────────┬────────────────────────────┤
│    SERVICE       │   DIGITAL        │      ACADEMIC              │
│  (Jasa Dev)      │  (Produk Digital)│   (Tugas/Skripsi)          │
├──────────────────┼──────────────────┼────────────────────────────┤
│ • Website        │ • Source Code    │ • Tugas Pemrograman        │
│   Company Profile│   Starter Kit    │ • Proyek Mata Kuliah       │
│ • Aplikasi Web   │ • Template Web   │ • Implementasi Skripsi/TA  │
│   (SaaS, SI)     │ • UI Kit / Figma │ • Laporan Praktikum        │
│ • Aplikasi Mobile│ • E-Book / PDF   │ • Konsultasi Coding        │
│   (Flutter, RN)  │ • Video Course   │ • Review & Fix Bug Tugas   │
│ • Landing Page   │ • Boilerplate    │ • Bantuan Deploy Tugas     │
│ • E-Commerce     │ • Plugin/Script  │ • Penjelasan & Bimbingan   │
│ • Bug Fixing     │                  │                            │
│ • Deploy/Hosting │                  │                            │
│ • Desain UI/UX   │                  │                            │
└──────────────────┴──────────────────┴────────────────────────────┘
```

### 4.2 Halaman di app.netpulse.com

```
app.netpulse.com/
├── /                               # Landing page marketplace
├── /jasa                           # Katalog semua jasa (filter: type, category)
├── /jasa/[slug]                    # Detail jasa + paket + FAQ + review
├── /jasa/[slug]/order              # Form order (TANPA LOGIN)
├── /produk                         # Katalog produk digital
├── /produk/[slug]                  # Detail produk + preview + review
├── /produk/[slug]/order            # Form order produk (TANPA LOGIN)
├── /kategori/[slug]                # Listing per kategori
├── /order/track                    # Cek status order (via email + order number)
├── /order/[orderNumber]            # Detail order (via token dari email)
├── /order/[orderNumber]/review     # Submit review (via token)
├── /tentang                        # Tentang marketplace
├── /kontak                         # Kontak & bantuan
└── /syarat-ketentuan               # Terms untuk marketplace
```

### 4.3 Landing Page Marketplace

```
┌─────────────────────────────────────────────────────────────────┐
│  🚀 NetPulse Studio                                             │
│  Jasa Pembuatan Aplikasi, Website & Bantuan Tugas Kuliah        │
│                                                                  │
│  [🔍 Cari jasa atau produk...                              ]    │
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  💻 Website  │  │  📱 Mobile  │  │  🎓 Akademik│             │
│  │  12 jasa     │  │  8 jasa     │  │  15 jasa    │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│                                                                  │
│  ⭐ Jasa Terlaris                                                │
│  ┌────────────────────────────────────────────────────┐         │
│  │ 🌐 Pembuatan Website Company Profile               │         │
│  │    Mulai Rp 1.500.000 · ⭐ 4.8 (23 review)        │         │
│  ├────────────────────────────────────────────────────┤         │
│  │ 🎓 Jasa Tugas Pemrograman & Skripsi                │         │
│  │    Mulai Rp 150.000 · ⭐ 4.9 (45 review)          │         │
│  ├────────────────────────────────────────────────────┤         │
│  │ 📱 Pembuatan Aplikasi Mobile (Flutter)             │         │
│  │    Mulai Rp 5.000.000 · ⭐ 4.7 (11 review)        │         │
│  └────────────────────────────────────────────────────┘         │
│                                                                  │
│  📦 Produk Digital Terbaru                                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ Next.js  │  │ Laravel  │  │ Flutter  │  │ React    │        │
│  │ Starter  │  │ Template │  │ E-Book   │  │ UI Kit   │        │
│  │ Rp 200k  │  │ Rp 350k  │  │ Rp 75k   │  │ Rp 150k  │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
│                                                                  │
│  💬 Testimonial                                                  │
│  "Cepat dan hasilnya bagus!" — Mahasiswa UI                     │
│  "Website saya jadi keren!" — UMKM Bandung                     │
│                                                                  │
│  [Dari blog NetPulse: 📝 Baca artikel tech terbaru →]           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5) Sistem Order Tanpa Login

### 5.1 Prinsip

**"Zero friction ordering"** — pembeli TIDAK perlu membuat akun. Cukup isi form order dan bayar.

### 5.2 Alur Order

```
┌─────────────────────────────────────────────────────────────────┐
│                      ALUR ORDER                                  │
│                                                                  │
│  1. PILIH                                                        │
│     Pembeli lihat listing → pilih paket                         │
│                  │                                               │
│  2. ISI FORM     ▼                                               │
│     ┌─────────────────────────────┐                              │
│     │ Nama lengkap *              │                              │
│     │ Email aktif *               │ ← untuk notifikasi &        │
│     │ No. WhatsApp *              │   tracking order             │
│     │ Catatan / Brief *           │                              │
│     │ [Upload file pendukung]     │ ← opsional (brief,          │
│     │                             │   contoh, requirement)       │
│     │    [📦 Buat Pesanan]        │                              │
│     └─────────────────────────────┘                              │
│                  │                                               │
│  3. INVOICE      ▼                                               │
│     Sistem generate invoice + order number                       │
│     Email dikirim ke pembeli berisi:                             │
│     - Order number (ORD-20260219-001)                            │
│     - Detail pesanan & harga                                     │
│     - Nomor rekening / metode pembayaran                         │
│     - Link tracking: app.netpulse.com/order/ORD-xxx?token=xxx   │
│                  │                                               │
│  4. BAYAR        ▼                                               │
│     Pembeli transfer → upload bukti bayar via link tracking      │
│                  │                                               │
│  5. KONFIRMASI   ▼                                               │
│     Admin verifikasi → status jadi PAID                          │
│     Email notifikasi ke pembeli                                  │
│                  │                                               │
│  6. KERJAKAN     ▼                                               │
│     Tim mengerjakan → update status IN_PROGRESS                  │
│     Komunikasi via WhatsApp / email                              │
│                  │                                               │
│  7. SELESAI      ▼                                               │
│     Status COMPLETED → email notifikasi + link download (jika    │
│     ada file) + link untuk submit review                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 5.3 Tracking Order (Tanpa Login)

Pembeli bisa cek status order via:

**Cara 1: Link dari email** (paling mudah)
```
app.netpulse.com/order/ORD-20260219-001?token=abc123xyz
```
Token = hash unik yang digenerate per order. Hanya pembeli yang punya link ini.

**Cara 2: Form tracking**
```
app.netpulse.com/order/track

┌───────────────────────────────────────┐
│ 📦 Cek Status Pesanan                 │
│                                       │
│ Order Number* [ORD-20260219-001     ] │
│ Email *       [ahmad@email.com      ] │
│                                       │
│         [🔍 Cek Status]              │
└───────────────────────────────────────┘
```
Sistem validasi order number + email match → tampilkan detail order.

### 5.4 Identifikasi Pembeli

Tanpa akun, pembeli diidentifikasi via:
- **Email** — primary identifier
- **Order number** — unique per transaction
- **Access token** — short-lived token yang dikirim via email untuk akses halaman order

```
orders table:
├── buyer_name      → nama
├── buyer_email     → email (identifier utama)
├── buyer_phone     → WhatsApp
├── access_token    → hashed token untuk view order tanpa login
└── buyer_id        → NULL (tidak ada akun)
```

### 5.5 Kapan Tetap Butuh "Identifikasi"?

- **Upload bukti bayar** → via link order + token dari email
- **Kirim pesan ke admin** → via link order + token
- **Download file (digital product)** → via link order + token
- **Submit review** → via link order + token (setelah COMPLETED)

Semua aksi ini dilakukan melalui **signed link** yang dikirim ke email pembeli, bukan login.

---

## 6) Overhaul Komentar (Facebook-style)

### 6.1 Fitur Baru

| Fitur | Deskripsi |
|---|---|
| **Auto-publish** | Komentar langsung tampil tanpa approval admin |
| **Reply (nested)** | Bisa reply komentar, tampil sebagai thread bersarang |
| **Like komentar** | Setiap komentar bisa di-like (ala Facebook) |
| **Like counter** | Tampilkan jumlah like per komentar |
| **Gravatar** | Avatar otomatis dari email |
| **Admin badge** | Komentar dari admin/author ditandai |
| **Moderasi ringan** | Admin bisa delete/hide komentar (bukan approve) |
| **Sort** | Terbaru / terpopuler (by likes) / terlama |

### 6.2 Tampilan Komentar

```
┌─────────────────────────────────────────────────────────────────┐
│  💬 Komentar (23)                           [Terbaru ▼]         │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 🟢 Ahmad Khadafi                          2 jam lalu     │   │
│  │ Artikelnya sangat membantu! Saya sudah coba implementasi │   │
│  │ dan berhasil. Terima kasih 🙏                             │   │
│  │                                                           │   │
│  │ 👍 12   💬 Balas                                          │   │
│  │                                                           │   │
│  │   ┌────────────────────────────────────────────────────┐  │   │
│  │   │ 🔵 NetPulse Team  [AUTHOR]          1 jam lalu     │  │   │
│  │   │ Terima kasih Ahmad! Senang bisa membantu 😊        │  │   │
│  │   │                                                    │  │   │
│  │   │ 👍 5   💬 Balas                                    │  │   │
│  │   └────────────────────────────────────────────────────┘  │   │
│  │                                                           │   │
│  │   ┌────────────────────────────────────────────────────┐  │   │
│  │   │ 🟢 Budi Santoso                     30 menit lalu  │  │   │
│  │   │ Sama, saya juga berhasil! Thanks bro                │  │   │
│  │   │                                                    │  │   │
│  │   │ 👍 2   💬 Balas                                    │  │   │
│  │   └────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 🟢 Siti Rahayu                            5 jam lalu     │   │
│  │ Bisa tolong jelaskan bagian deployment-nya lebih detail?  │   │
│  │                                                           │   │
│  │ 👍 3   💬 Balas                                           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ── Tulis Komentar ──────────────────────────────────────────   │
│  Nama *    [                    ]                                │
│  Email *   [                    ]  (tidak ditampilkan publik)    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                                                          │   │
│  │ Tulis komentar Anda...                                   │   │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                    [💬 Kirim Komentar]          │
└─────────────────────────────────────────────────────────────────┘
```

### 6.3 Like Komentar — Mekanisme

Karena tidak ada login user, like menggunakan identifikasi:
- **Fingerprint browser** (localStorage key) + **IP hash** — untuk mencegah double like
- Satu "identitas" hanya bisa like 1x per komentar
- Unlike juga bisa (toggle)

```javascript
// Pseudocode di frontend
const guestKey = localStorage.getItem('np_guest_id') 
  || generateAndStore('np_guest_id');  // UUID random, simpan di localStorage

// POST /api/comments/:id/like
// Body: { guest_key: "uuid-xxx" }
```

### 6.4 Anti-Spam Komentar

Tanpa login, spam bisa jadi masalah. Strategi:

1. **Rate limit** — max 3 komentar/menit per IP
2. **Honeypot field** — hidden field yang bot isi, human tidak
3. **Cloudflare Turnstile** — captcha ringan (opsional, aktifkan jika spam tinggi)
4. **Word filter** — auto-hide komentar yang mengandung kata tertentu
5. **Admin moderation** — admin bisa delete/hide komentar setelah tampil
6. **Link limit** — komentar dengan >2 link otomatis ditandai untuk review

---

## 7) Role & Auth yang Disederhanakan

### 7.1 Role Baru

| Role | Akses | Deskripsi |
|---|---|---|
| **SUPERADMIN** | Semua | Pemilik platform, bisa manage semuanya |
| **ADMIN** | Hampir semua | Manage blog, marketplace, ads, users |
| **EDITOR** | Blog + moderasi | Review artikel, moderasi komentar |
| **AUTHOR** | Blog (own) | Nulis & edit artikel sendiri |
| **PROGRAMMER** | Marketplace | Manage listings, proses order, upload file deliverable |

> **Catatan**: Role `VIEWER` dihapus karena tidak ada login public user.

### 7.2 Perbandingan Role Lama vs Baru

| Role Lama | Role Baru | Perubahan |
|---|---|---|
| `OWNER` | `SUPERADMIN` | Rename, sama fungsinya |
| `ADMIN` | `ADMIN` | Tetap |
| `EDITOR` | `EDITOR` | Tetap |
| `AUTHOR` | `AUTHOR` | Tetap — hanya blog |
| `VIEWER` | ❌ Dihapus | Tidak ada login public |
| — | `PROGRAMMER` ✅ Baru | Handle order & listing marketplace |

### 7.3 Permission Matrix

```
                        SUPERADMIN  ADMIN  EDITOR  AUTHOR  PROGRAMMER
Blog                    
├── Artikel CRUD           ✅        ✅      ✅      ✅*      ❌
├── Publish/Schedule       ✅        ✅      ✅      ❌       ❌
├── Kategori/Tag           ✅        ✅      ✅      ❌       ❌
├── Moderasi Komentar      ✅        ✅      ✅      ❌       ❌
├── Media Library          ✅        ✅      ✅      ✅       ❌

Marketplace
├── Listing CRUD           ✅        ✅      ❌      ❌       ✅
├── Order Management       ✅        ✅      ❌      ❌       ✅
├── Order Status Update    ✅        ✅      ❌      ❌       ✅
├── Review Moderation      ✅        ✅      ❌      ❌       ❌
├── Listing Categories     ✅        ✅      ❌      ❌       ❌

Monetisasi
├── AdSense Slots          ✅        ✅      ❌      ❌       ❌
├── Ad Campaigns           ✅        ✅      ❌      ❌       ❌
├── Revenue Dashboard      ✅        ✅      ❌      ❌       ❌

Sistem
├── Users Management       ✅        ✅      ❌      ❌       ❌
├── Roles & Permissions    ✅        ❌      ❌      ❌       ❌
├── Settings               ✅        ✅      ❌      ❌       ❌
├── Audit Log              ✅        ✅      ❌      ❌       ❌

* Author: hanya CRUD artikel milik sendiri
```

### 7.4 Login Flow

Login hanya dari 1 tempat: **Admin Panel** (`netpulse.com/admin/login` atau `admin.netpulse.com/login`).

```
Tidak ada login di:
  ❌ netpulse.com (blog) — pengunjung biasa
  ❌ app.netpulse.com (marketplace) — pembeli pakai form

Login hanya di:
  ✅ Admin panel — untuk internal team (superadmin, admin, editor, author, programmer)
```

---

## 8) Struktur Folder & Monorepo

### 8.1 Root Structure (Revisi)

```
netpulse/
├── apps/
│   ├── api/                    # Go API (shared backend)
│   ├── web/                    # Next.js — Blog (netpulse.com)
│   └── store/                  # Next.js — Marketplace (app.netpulse.com)  ← BARU
├── packages/
│   └── shared-types/           # TypeScript types shared FE
├── infra/
│   ├── cloudflare/
│   ├── docker/
│   └── nginx/
├── docs/
├── scripts/
├── docker-compose.yml
├── Makefile
└── README.md
```

### 8.2 apps/store/ (Next.js — Marketplace)

```
apps/store/
├── src/
│   ├── app/
│   │   ├── layout.tsx                    # Root layout marketplace
│   │   ├── page.tsx                      # Landing page marketplace
│   │   ├── (catalog)/
│   │   │   ├── jasa/
│   │   │   │   ├── page.tsx              # Katalog jasa (/jasa)
│   │   │   │   └── [slug]/
│   │   │   │       ├── page.tsx          # Detail jasa (/jasa/[slug])
│   │   │   │       └── order/
│   │   │   │           └── page.tsx      # Form order (/jasa/[slug]/order)
│   │   │   ├── produk/
│   │   │   │   ├── page.tsx              # Katalog produk (/produk)
│   │   │   │   └── [slug]/
│   │   │   │       ├── page.tsx          # Detail produk (/produk/[slug])
│   │   │   │       └── order/
│   │   │   │           └── page.tsx      # Form order produk
│   │   │   └── kategori/
│   │   │       └── [slug]/
│   │   │           └── page.tsx          # Listing per kategori
│   │   ├── order/
│   │   │   ├── track/
│   │   │   │   └── page.tsx              # Form tracking order
│   │   │   └── [orderNumber]/
│   │   │       ├── page.tsx              # Detail order (via token)
│   │   │       └── review/
│   │   │           └── page.tsx          # Submit review
│   │   ├── tentang/
│   │   │   └── page.tsx
│   │   ├── kontak/
│   │   │   └── page.tsx
│   │   └── syarat-ketentuan/
│   │       └── page.tsx
│   ├── components/
│   │   ├── ui/                           # Shared UI components
│   │   ├── layout/                       # Header, footer, sidebar
│   │   ├── listing/                      # ListingCard, ListingGrid, etc
│   │   ├── order/                        # OrderForm, OrderStatus, etc
│   │   └── review/                       # ReviewCard, ReviewForm, etc
│   ├── lib/
│   │   ├── api-client.ts                 # axios/fetch wrapper
│   │   ├── env.ts
│   │   └── utils.ts
│   ├── styles/
│   │   └── globals.css
│   └── types/
│       └── index.ts
├── public/
│   └── img/
├── next.config.ts
├── package.json
└── tsconfig.json
```

### 8.3 apps/web/ (Next.js — Blog) — Revisi

Yang DIHAPUS dari `apps/web/`:

```diff
  apps/web/src/app/
- ├── (auth)/                    # ❌ DIHAPUS — login, register, forgot-password
- │   ├── login/
- │   ├── register/
- │   └── forgot-password/
- ├── (user)/                    # ❌ DIHAPUS — user panel
- │   ├── profile/
- │   ├── saved-posts/
- │   ├── settings/
- │   └── affiliate/
- ├── ref/                       # ❌ DIHAPUS — referral link
  ├── (public)/                  # ✅ TETAP — halaman publik blog
  ├── (admin)/                   # ✅ TETAP — admin panel (unified)
  └── api/                       # ✅ TETAP — sitemap, robots, dll
```

Yang DITAMBAHKAN:
```diff
  apps/web/src/app/(admin)/admin/
+ ├── listings/                  # ✅ BARU — manage listings marketplace  
+ ├── orders/                    # ✅ BARU — manage orders
+ ├── reviews/                   # ✅ BARU — moderasi review
+ ├── campaigns/                 # ✅ BARU — ad campaigns
+ ├── revenue/                   # ✅ BARU — revenue dashboard
+ └── programmers/               # ✅ BARU — manage programmer team
```

### 8.4 apps/api/ (Go Backend) — Revisi

Yang DIHAPUS dari Go API:
```diff
  internal/domain/
- ├── affiliate/                 # ❌ DIHAPUS — semua logic affiliate
- ├── referral/                  # ❌ DIHAPUS — referral system
```

Yang DITAMBAHKAN:
```diff
  internal/domain/
+ ├── listings/                  # ✅ BARU — listing model, service
+ │   ├── model.go
+ │   ├── service.go
+ │   └── validation.go
+ ├── orders/                    # ✅ BARU — order model, service
+ │   ├── model.go
+ │   ├── service.go
+ │   └── validation.go
+ ├── reviews/                   # ✅ BARU — review model
+ │   └── model.go
+ ├── campaigns/                 # ✅ BARU — ad campaign model
+ │   ├── model.go
+ │   └── service.go
+ └── revenue/                   # ✅ BARU — revenue tracking
+     └── model.go
```

---

## 9) Model Data (Revisi)

### 9.1 Tabel yang DIHAPUS

```sql
-- ❌ DIHAPUS — Affiliate System
DROP TABLE IF EXISTS affiliate_payouts CASCADE;
DROP TABLE IF EXISTS affiliate_commissions CASCADE;
DROP TABLE IF EXISTS affiliate_profiles CASCADE;
DROP TABLE IF EXISTS affiliate_settings CASCADE;

-- ❌ DIHAPUS — Kolom affiliate/referral di users
ALTER TABLE users DROP COLUMN IF EXISTS referral_code;
ALTER TABLE users DROP COLUMN IF EXISTS referred_by;

-- ❌ DIHAPUS — Referral events
DROP TABLE IF EXISTS referral_events CASCADE;
```

### 9.2 Tabel yang DIUBAH

#### Comments — Auto-publish + Like support

```sql
-- Ubah default status dari PENDING ke PUBLISHED
ALTER TABLE comments ALTER COLUMN status SET DEFAULT 'PUBLISHED';

-- Hapus check constraint lama, ganti baru
ALTER TABLE comments DROP CONSTRAINT IF EXISTS comments_status_check;
ALTER TABLE comments ADD CONSTRAINT comments_status_check 
    CHECK (status IN ('PUBLISHED', 'HIDDEN', 'SPAM'));

-- Tambah kolom like_count (denormalized)
ALTER TABLE comments ADD COLUMN IF NOT EXISTS like_count INT DEFAULT 0;
```

Status komentar yang baru:
- `PUBLISHED` (default) — langsung tampil
- `HIDDEN` — disembunyikan oleh admin
- `SPAM` — ditandai sebagai spam

#### Comment Likes — Tabel Baru

```sql
CREATE TABLE comment_likes (
    id          TEXT PRIMARY KEY DEFAULT encode(gen_random_bytes(16), 'hex'),
    comment_id  TEXT NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    guest_key   TEXT NOT NULL,             -- UUID dari localStorage browser
    ip_hash     TEXT DEFAULT '',           -- hash IP untuk anti-abuse
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique: 1 like per guest per comment
CREATE UNIQUE INDEX idx_comment_likes_unique 
    ON comment_likes(comment_id, guest_key);
CREATE INDEX idx_comment_likes_comment 
    ON comment_likes(comment_id);
```

### 9.3 Tabel Marketplace (Revisi dari v2)

#### Orders — Revisi untuk Guest Checkout

```sql
CREATE TABLE orders (
    id              TEXT PRIMARY KEY DEFAULT encode(gen_random_bytes(16), 'hex'),
    order_number    TEXT NOT NULL UNIQUE,      -- "ORD-20260219-001"
    
    -- Buyer (GUEST — tidak perlu user account)
    buyer_id        TEXT,                      -- NULL karena guest checkout
    buyer_name      TEXT NOT NULL,
    buyer_email     TEXT NOT NULL,
    buyer_phone     TEXT NOT NULL,             -- WhatsApp number
    
    -- Access Token (untuk view order tanpa login)
    access_token    TEXT NOT NULL,             -- hashed token, dikirim via email
    
    -- Listing & Package
    listing_id      TEXT NOT NULL REFERENCES listings(id),
    package_id      TEXT REFERENCES listing_packages(id),
    listing_title   TEXT NOT NULL,             -- snapshot at order time
    package_name    TEXT DEFAULT '',           -- snapshot
    listing_type    TEXT NOT NULL,             -- SERVICE | DIGITAL_PRODUCT | ACADEMIC
    
    -- Pricing
    amount          BIGINT NOT NULL,           -- total harga dalam Rupiah
    currency        TEXT DEFAULT 'IDR',
    
    -- Status
    status          TEXT NOT NULL DEFAULT 'PENDING',
    -- PENDING → AWAITING_PAYMENT → PAID → IN_PROGRESS → COMPLETED
    -- Alternatif: CANCELLED, REFUNDED
    
    -- Payment
    payment_method  TEXT DEFAULT '',           -- BANK_TRANSFER | EWALLET | etc
    payment_proof   TEXT DEFAULT '',           -- URL bukti transfer
    paid_at         TIMESTAMPTZ,
    
    -- Delivery (untuk digital product)
    delivery_url    TEXT DEFAULT '',           -- URL file deliverable (hasil kerjaan)
    delivery_notes  TEXT DEFAULT '',           -- catatan deliverable
    
    -- Buyer Input
    buyer_notes     TEXT DEFAULT '',           -- brief / requirement dari pembeli
    buyer_files     TEXT[] DEFAULT '{}',       -- URL file pendukung yang diupload pembeli
    
    -- Admin Internal
    admin_notes     TEXT DEFAULT '',           -- catatan internal
    assigned_to     TEXT REFERENCES users(id), -- programmer yang ditugaskan
    
    -- Timestamps
    completed_at    TIMESTAMPTZ,
    cancelled_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orders_email ON orders(buyer_email);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_number ON orders(order_number);
CREATE INDEX idx_orders_assigned ON orders(assigned_to);
```

#### Reviews — Revisi untuk Guest

```sql
CREATE TABLE listing_reviews (
    id              TEXT PRIMARY KEY DEFAULT encode(gen_random_bytes(16), 'hex'),
    listing_id      TEXT NOT NULL REFERENCES listings(id),
    order_id        TEXT NOT NULL REFERENCES orders(id),
    
    -- Reviewer (guest — dari data order)
    reviewer_name   TEXT NOT NULL,             -- dari order.buyer_name
    reviewer_email  TEXT NOT NULL,             -- untuk gravatar, tidak ditampilkan
    
    rating          INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title           TEXT DEFAULT '',
    comment         TEXT DEFAULT '',
    
    is_verified     BOOLEAN DEFAULT true,      -- verified purchase
    is_visible      BOOLEAN DEFAULT true,      -- admin bisa hide
    
    -- Admin response
    admin_reply     TEXT DEFAULT '',
    replied_at      TIMESTAMPTZ,
    
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(order_id)  -- 1 review per order
);

CREATE INDEX idx_reviews_listing ON listing_reviews(listing_id);
CREATE INDEX idx_reviews_visible ON listing_reviews(is_visible);
```

### 9.4 Listings Table (Sama dengan v2, sedikit penyesuaian)

```sql
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
    price           BIGINT DEFAULT 0,         -- harga terendah (untuk display "mulai dari")
    price_type      TEXT DEFAULT 'FIXED',     -- FIXED | STARTING_FROM | CUSTOM_QUOTE
    currency        TEXT DEFAULT 'IDR',
    
    -- Service/Academic specific
    delivery_days   INT DEFAULT 0,            -- estimasi hari pengerjaan
    
    -- Digital product specific  
    file_url        TEXT DEFAULT '',           -- URL file untuk download
    file_name       TEXT DEFAULT '',
    file_size       BIGINT DEFAULT 0,
    
    -- SEO
    meta_title      TEXT DEFAULT '',
    meta_description TEXT DEFAULT '',
    
    -- Relations
    category_id     TEXT REFERENCES listing_categories(id),
    created_by      TEXT REFERENCES users(id),   -- admin/programmer yang buat
    
    -- Stats (denormalized)
    view_count      INT DEFAULT 0,
    order_count     INT DEFAULT 0,
    rating_avg      DECIMAL(3,2) DEFAULT 0,
    rating_count    INT DEFAULT 0,
    
    -- Flags
    is_featured     BOOLEAN DEFAULT false,    -- tampil di landing page
    
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- listing_packages, listing_package_features, listing_images, 
-- listing_faqs, listing_tags, listing_categories 
-- → SAMA dengan v2 (tidak berubah)
```

### 9.5 Ads Campaign Tables (Sama dengan v2)

Tabel `advertisers`, `ad_campaigns`, `ad_campaign_stats`, `ad_clicks` — **tidak berubah dari v2**.

### 9.6 Revenue Tables (Revisi — tanpa affiliate)

```sql
CREATE TABLE revenue_entries (
    id              TEXT PRIMARY KEY DEFAULT encode(gen_random_bytes(16), 'hex'),
    source          TEXT NOT NULL,             -- ORDER | AD_CAMPAIGN | ADSENSE
    reference_id    TEXT DEFAULT '',           -- order_id / campaign_id
    amount          BIGINT NOT NULL,           -- dalam Rupiah
    currency        TEXT DEFAULT 'IDR',
    description     TEXT DEFAULT '',
    recorded_at     DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Source: AFFILIATE dihapus karena affiliate system sudah tidak ada
```

---

## 10) API Surface (Revisi)

### 10.1 Blog Public API (netpulse.com)

```
# Tetap dari v1
GET  /posts                          # List post (filter: category, tag, search)
GET  /posts/:slug                    # Detail post
GET  /categories                     # List categories
GET  /tags                           # List tags
GET  /series                         # List series

# Komentar (revisi — auto publish, like support)
GET  /posts/:slug/comments           # List komentar (nested, with like_count)
POST /posts/:slug/comments           # Kirim komentar (guest: name + email + content)
POST /comments/:id/reply             # Reply komentar
POST /comments/:id/like              # Like komentar (guest_key)
DELETE /comments/:id/like            # Unlike komentar (guest_key)

# Like & View Post (tetap)
POST /posts/:slug/like               # Like post (guest_key)
DELETE /posts/:slug/like             # Unlike post
POST /posts/:slug/view              # Track view

# Ads (tetap)
GET  /ads/display                    # Get ad for position
POST /ads/impression                 # Track impression
POST /ads/click                      # Track click
```

### 10.2 Marketplace Public API (app.netpulse.com)

```
# Listings
GET  /store/listings                 # List active listings (filter: type, category)
GET  /store/listings/:slug           # Detail listing + packages + FAQ
GET  /store/listings/:slug/reviews   # Reviews sebuah listing
GET  /store/categories               # Kategori marketplace

# Orders (Guest — tanpa login)
POST /store/orders                   # Buat order baru (form: name, email, phone, notes)
GET  /store/orders/:number           # Detail order (requires: ?token=xxx)
POST /store/orders/:number/payment   # Upload bukti bayar (requires: token)
POST /store/orders/:number/review    # Submit review (requires: token, status=COMPLETED)
GET  /store/orders/track             # Track order (query: order_number + email)

# Search
GET  /store/search                   # Search listings
```

### 10.3 Admin API (Unified — semua di satu backend)

```
# Auth (hanya internal team)
POST /auth/login                    # Login admin/editor/author/programmer
POST /auth/refresh                  # Refresh token
POST /auth/logout                   # Logout

# ── BLOG MANAGEMENT ──
# Artikel (tetap)
GET    /admin/posts
POST   /admin/posts
GET    /admin/posts/:id
PUT    /admin/posts/:id
DELETE /admin/posts/:id
PATCH  /admin/posts/:id/status

# Komentar — moderasi ringan (revisi)
GET    /admin/comments              # List semua komentar (filter: post, status)
PATCH  /admin/comments/:id/status   # Hide / mark spam / restore
DELETE /admin/comments/:id          # Delete komentar

# Kategori, Tag, Media, SEO — tetap sama

# ── MARKETPLACE MANAGEMENT ──
# Listings
GET    /admin/listings
POST   /admin/listings
GET    /admin/listings/:id
PUT    /admin/listings/:id
DELETE /admin/listings/:id
PATCH  /admin/listings/:id/status
POST   /admin/listings/:id/packages
PUT    /admin/listings/:id/packages/:pid
DELETE /admin/listings/:id/packages/:pid
POST   /admin/listings/:id/images
DELETE /admin/listings/:id/images/:iid
POST   /admin/listings/:id/faqs
PUT    /admin/listings/:id/faqs/:fid
DELETE /admin/listings/:id/faqs/:fid

# Orders
GET    /admin/orders                # List semua order
GET    /admin/orders/:id            # Detail order
PATCH  /admin/orders/:id/status     # Update status
PATCH  /admin/orders/:id/assign     # Assign ke programmer
POST   /admin/orders/:id/deliver    # Upload deliverable / set delivery
GET    /admin/orders/stats          # Order statistics

# Reviews
GET    /admin/reviews
PATCH  /admin/reviews/:id/visibility
POST   /admin/reviews/:id/reply

# Listing Categories
GET    /admin/listing-categories
POST   /admin/listing-categories
PUT    /admin/listing-categories/:id
DELETE /admin/listing-categories/:id

# ── ADS CAMPAIGN ── (tetap dari v2)
# Advertisers, Campaigns, Reports — sama

# ── REVENUE ──
GET    /admin/revenue/dashboard
GET    /admin/revenue/entries
POST   /admin/revenue/entries       # Manual entry

# ── USER MANAGEMENT ── (hanya internal team)
GET    /admin/users                 # List internal users (admin, editor, author, programmer)
POST   /admin/users                 # Invite / create user baru
PUT    /admin/users/:id
DELETE /admin/users/:id
PATCH  /admin/users/:id/role

# ❌ DIHAPUS dari admin API:
# /admin/affiliate/*              — semua endpoint affiliate
# /admin/author-requests/*        — tidak perlu karena semua diundang manual
```

---

## 11) Admin Panel Unified

### 11.1 Admin Sidebar (Revisi Final)

```
📊 Dashboard

📝 BLOG
├── Artikel
├── Media Library
├── Kategori & Tag
└── Komentar (moderasi)

🛒 MARKETPLACE
├── Listings (Jasa & Produk)
├── Orders
├── Kategori Listing
└── Reviews

📢 MONETISASI
├── Ad Slots (Google AdSense)
├── Campaigns (Iklan Custom)
├── Ads Reports
└── Revenue Dashboard

👥 TIM
├── Users (internal team)
└── Roles & Permissions

⚙️ SISTEM
├── SEO
├── Pengaturan Umum
├── Legal & Kebijakan
└── Audit Log
```

Perubahan dari v2:
- ❌ **Afiliasi** dihapus dari sidebar
- ❌ **Permintaan Author** dihapus (author diundang manual oleh admin)
- ❌ **Integrasi/N8N** dihapus (bisa ditambahkan ke Pengaturan jika perlu)
- ❌ **Notifications** dihapus (email notif bisa di Pengaturan)
- ❌ **Customers** dihapus (order history sudah terlihat di Orders)
- ✅ **Kategori Listing** ditambahkan di Marketplace
- ✅ **Users** di-rename jadi "Tim" karena hanya internal

### 11.2 Enhanced Admin Dashboard (Revisi)

```
┌─────────────────────────────────────────────────────────────────┐
│                        ADMIN DASHBOARD                          │
├───────────────┬───────────────┬──────────────┬─────────────────┤
│ 💰 Revenue    │ 📦 Orders     │ 📝 Artikel   │ 💬 Komentar     │
│ Rp 12.3jt    │ 8 pending     │ 45 published │ 12 baru hari ini│
│ bulan ini    │ 2 in progress │ 5 draft      │ 0 spam          │
├───────────────┴───────────────┴──────────────┴─────────────────┤
│                                                                 │
│  📊 Revenue Chart (30 hari)                                     │
│  ┌─────────────────────────────────────────┐                   │
│  │  ▁▂▃▅▆▇█▇▆▅▃▂▁▂▃▅▆▇▆▅▃▂▁▂▃▅▆▇        │                   │
│  │  Jan 20                        Feb 19   │                   │
│  └─────────────────────────────────────────┘                   │
│                                                                 │
│  Revenue by Source:                                             │
│  ├── 📦 Jasa/Produk:   Rp 7.500.000  (61%)                    │
│  ├── 📢 Iklan Custom:   Rp 3.800.000  (31%)                   │
│  └── 🅰️ Google Ads:     Rp 1.000.000  (8%)                    │
│                                                                 │
├─────────────────────────────────┬───────────────────────────────┤
│  🔔 Butuh Aksi                 │  📦 Order Terbaru             │
│  • 3 order perlu konfirmasi    │  #012 Website CP - PAID       │
│  • 1 campaign expired          │  #013 Tugas Java - PENDING    │
│  • 2 komentar spam             │  #014 App Flutter - PROGRESS  │
│  • 2 order perlu di-assign     │  #015 Skripsi SI - NEW        │
└─────────────────────────────────┴───────────────────────────────┘
```

---

## 12) Infrastruktur & Deployment

### 12.1 Nginx Configuration (Subdomain Routing)

```nginx
# netpulse.com — Blog
server {
    listen 80;
    server_name netpulse.com www.netpulse.com;
    
    location / {
        proxy_pass http://localhost:3000;  # Next.js (apps/web)
    }
    
    location /api/ {
        proxy_pass http://localhost:8080;  # Go API
    }
}

# app.netpulse.com — Marketplace
server {
    listen 80;
    server_name app.netpulse.com;
    
    location / {
        proxy_pass http://localhost:3001;  # Next.js (apps/store)
    }
    
    location /api/ {
        proxy_pass http://localhost:8080;  # Go API (sama!)
    }
}

# admin.netpulse.com (opsional — bisa juga di netpulse.com/admin)
server {
    listen 80;
    server_name admin.netpulse.com;
    
    location / {
        proxy_pass http://localhost:3000;  # Redirect ke /admin di apps/web
        # Atau bisa jadi app terpisah di masa depan
    }
}
```

### 12.2 Docker Compose (Revisi)

```yaml
services:
  postgres:
    image: postgres:16
    volumes:
      - pgdata:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: netpulse
      POSTGRES_USER: netpulse
      POSTGRES_PASSWORD: ${DB_PASSWORD}

  redis:
    image: redis:7-alpine
    
  api:
    build: ./apps/api
    ports:
      - "8080:8080"
    depends_on:
      - postgres
      - redis

  web:                              # Blog
    build: ./apps/web
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://api:8080
      NEXT_PUBLIC_STORE_URL: https://app.netpulse.com

  store:                            # Marketplace  ← BARU
    build: ./apps/store
    ports:
      - "3001:3001"
    environment:
      NEXT_PUBLIC_API_URL: http://api:8080
      NEXT_PUBLIC_BLOG_URL: https://netpulse.com

volumes:
  pgdata:
```

### 12.3 Cross-link Between Domains

Blog dan Marketplace saling terhubung:

**Di Blog (netpulse.com):**
- CTA di artikel: "Butuh bantuan implementasi? → app.netpulse.com/jasa/..."
- Footer/sidebar: "💻 Jasa Development → app.netpulse.com"
- Banner internal: promo jasa/produk di marketplace

**Di Marketplace (app.netpulse.com):**
- Header: "📝 Baca Artikel Tech → netpulse.com"
- Footer: link ke blog
- Listing description: "Pelajari lebih lanjut → netpulse.com/posts/..."

---

## 13) Roadmap Implementasi (Revisi)

### Phase 0: Cleanup & Simplification (1 minggu)

**Fokus**: Hapus fitur yang tidak dipakai, sederhanakan

| Task | Estimasi |
|---|---|
| Hapus semua kode affiliate (backend + frontend) | 1 hari |
| Hapus login/register user di blog (backend + frontend) | 1 hari |
| Hapus user panel (profile, saved posts, settings, affiliate) | 0.5 hari |
| Ubah komentar: auto-publish, hapus approval workflow | 0.5 hari |
| Tambah comment likes (tabel + API + frontend) | 1 hari |
| Update role: OWNER → SUPERADMIN, hapus VIEWER, tambah PROGRAMMER | 0.5 hari |
| Cleanup admin sidebar (hapus menu affiliate, author request) | 0.5 hari |
| Testing & fix regressions | 1 hari |

### Phase 1: Marketplace Foundation (2-3 minggu)

**Fokus**: `apps/store` + Listing + Guest Order

| Task | Estimasi |
|---|---|
| Setup `apps/store` (Next.js project baru) | 0.5 hari |
| Nginx/infra config untuk subdomain routing | 0.5 hari |
| Migration: listings, packages, categories, orders, reviews | 1 hari |
| Domain models: Listing, Order, Review (Go) | 2 hari |
| Repository: Listing CRUD, Order lifecycle | 2 hari |
| Handlers: Store public API (listing view, guest order) | 2 hari |
| Handlers: Admin listing & order management | 2 hari |
| Frontend Store: Landing page marketplace | 1 hari |
| Frontend Store: Katalog & detail listing | 2 hari |
| Frontend Store: Order form (guest checkout) | 1.5 hari |
| Frontend Store: Order tracking page | 1 hari |
| Frontend Admin: Listing CRUD page | 2 hari |
| Frontend Admin: Order management | 2 hari |
| Email notifikasi (order created, status update) | 1 hari |
| Testing | 1.5 hari |

### Phase 2: Ads Campaign + Revenue (2 minggu)

**Fokus**: Same as v2 Phase 1

| Task | Estimasi |
|---|---|
| Migration: ad_campaigns, advertisers, stats | 1 hari |
| Domain model + Repository: Campaign CRUD | 2 hari |
| Handlers: Admin campaign management | 2 hari |
| Frontend Admin: Campaign management + reports | 3 hari |
| Public ads display API + Frontend render | 1 hari |
| Impression/click tracking | 1 hari |
| Revenue dashboard (admin) | 2 hari |
| Testing | 1 hari |

### Phase 3: Polish & Review System (1 minggu)

| Task | Estimasi |
|---|---|
| Review system (frontend store + admin moderation) | 2 hari |
| Enhanced admin dashboard (unified stats) | 1.5 hari |
| Cross-link blog ↔ marketplace | 0.5 hari |
| SEO marketplace (sitemap, OG, schema) | 1 hari |
| Performance & testing | 1 hari |

### Phase 4: Advanced (opsional)

- Payment gateway (Midtrans / Xendit)
- Invoice PDF generation
- WhatsApp integration (notifikasi order via WA)
- Digital product signed URLs
- Membership tier (konten premium di blog)
- Marketplace SEO (structured data, rich snippets)

---

## 14) Keputusan Final

Berdasarkan diskusi, berikut keputusan yang sudah diambil:

| No | Keputusan | Jawaban |
|---|---|---|
| 1 | Marketplace di subdomain terpisah? | ✅ Ya — `app.netpulse.com` |
| 2 | Database terpisah? | ❌ Tidak — **1 database** shared |
| 3 | Admin panel terpisah? | ❌ Tidak — **1 admin panel** di `netpulse.com/admin` |
| 4 | Hapus affiliate? | ✅ Ya — dihapus seluruhnya |
| 5 | Hapus login user di blog? | ✅ Ya — hanya guest access |
| 6 | Order tanpa login? | ✅ Ya — form checkout guest |
| 7 | Komentar auto-publish? | ✅ Ya — tanpa approval, moderasi ringan |
| 8 | Like komentar? | ✅ Ya — Facebook-style like |
| 9 | Siapa yang login? | Superadmin, Admin, Editor, Author, Programmer |
| 10 | Payment Phase 1? | Manual transfer + upload bukti |
| 11 | Identifikasi pembeli? | Email + order number + access token |
| 12 | Folder marketplace? | `apps/store/` — Next.js app terpisah |

### Pertanyaan yang Masih Terbuka

1. **Admin panel di mana?**
   - Opsi A: `netpulse.com/admin` (di dalam apps/web) ← **Saran: ini dulu** 
   - Opsi B: `admin.netpulse.com` (app terpisah — di masa depan)

2. **Email service apa?**
   - Opsi A: SMTP langsung (Mailtrap dev, Resend prod)
   - Opsi B: API-based (SendGrid, Mailgun)
   - **Saran**: Resend — simple API, free tier cukup untuk awal

3. **Captcha untuk komentar?**
   - Opsi A: Tidak pakai (rate limit saja)
   - Opsi B: Cloudflare Turnstile (ringan, privacy-friendly)
   - **Saran**: Rate limit dulu, tambahkan Turnstile jika spam tinggi

4. **Notifikasi order ke admin?**
   - Opsi A: Email saja
   - Opsi B: Email + WhatsApp (WA Business API)
   - **Saran**: Email dulu, WA di Phase 4

---

## 15) Ringkasan Eksekutif

| Aspek | Sekarang | Setelah v3 |
|---|---|---|
| **Arsitektur** | 1 web app + 1 API | 2 web app (blog + store) + 1 API |
| **Domain** | `netpulse.com` saja | `netpulse.com` + `app.netpulse.com` |
| **Login** | Semua user bisa register | Hanya internal team (5 roles) |
| **Blog** | Artikel + komentar approval + affiliate | Artikel + komentar auto (FB-style) |
| **Marketplace** | ❌ Tidak ada | Jasa dev + akademik + produk digital |
| **Order** | ❌ Tidak ada | Guest checkout (tanpa akun) |
| **Komentar** | Perlu approval admin | Auto-publish + like + reply |
| **Affiliate** | ✅ Lengkap | ❌ Dihapus |
| **Revenue Stream** | Hanya AdSense | AdSense + Iklan Custom + Marketplace |
| **Ads** | Embed AdSense | AdSense + Campaign custom + tracking |

NetPulse berevolusi menjadi:

```
┌────────────────────────────────────────────────────────────┐
│                                                            │
│   "2-in-1 Platform: Tech Media + Development Studio"       │
│                                                            │
│   📝 netpulse.com     → Baca, belajar, diskusi (blog)     │
│   💻 app.netpulse.com → Pesan jasa, beli produk (store)   │
│   🔧 Admin panel       → Kelola semua dari satu tempat    │
│                                                            │
│   Pengunjung → Baca artikel → Tertarik jasa →              │
│   → Langsung order tanpa ribet → Bayar → Selesai!          │
│                                                            │
└────────────────────────────────────────────────────────────┘
```
