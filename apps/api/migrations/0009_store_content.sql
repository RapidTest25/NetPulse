-- 0009_store_content.sql
-- Store landing page content managed via site_settings (JSON values)

INSERT INTO site_settings (key, value) VALUES

-- Hero section
('store_hero', '{
  "badge": "Development Studio",
  "title_prefix": "Bikin Website",
  "title_suffix": "Dalam Hitungan Hari ⚡",
  "typing_words": ["Profesional", "Modern", "SEO-Ready", "Responsif"],
  "subtitle": "Lupakan jasa mahal & freelancer ghosting. Cukup order, dan tim kami yang mengerjakannya. Mulai dari **Rp 150.000**.",
  "cta_primary": "Lihat Layanan 👇",
  "cta_secondary": "Lihat Portfolio",
  "rating": "4.9/5 rating",
  "projects_done": "100+ project selesai",
  "speed_text": "⏱️ Pengerjaan cepat",
  "note": "⚡ Tanpa perlu akun. Langsung order, bayar, selesai."
}'),

-- Trust badges marquee
('store_trust_badges', '{
  "row1": ["⚡ Pengerjaan Cepat", "💎 Kualitas Premium", "🔒 Garansi Revisi", "💰 Harga Transparan", "📦 Auto Delivery", "🛡️ Support WA 24/7", "🎯 SEO-Ready", "📱 Fully Responsive"],
  "row2": ["✅ Tanpa Akun", "🔥 100+ Project", "🎨 Desain Modern", "🚀 Fast Loading", "🛡️ Anti Ribet", "💳 Multi Payment", "📊 Dashboard Admin", "⏱️ Deadline Aman"]
}'),

-- Problem section
('store_problems', '{
  "icon": "😱",
  "title": "Sering Ngadepin Hal Ini?",
  "subtitle": "Kalau kamu pernah ngalamin salah satu di bawah ini, berarti kamu di tempat yang tepat.",
  "items": [
    {"icon": "💸", "text": "Bayar mahal ke agensi, hasilnya biasa aja"},
    {"icon": "👻", "text": "Freelancer ghosting pas project jalan setengah"},
    {"icon": "🤯", "text": "Gak ngerti coding tapi butuh website ASAP"},
    {"icon": "⏰", "text": "Deadline mepet, gak ada yang mau ambil"}
  ],
  "agitation": "**Mau berapa lama lagi** nunggu website impianmu jadi kenyataan? Sementara kompetitor sudah go-online dan dapetin klien dari Google. **Waktunya action sekarang.**"
}'),

-- Comparison section
('store_comparison', '{
  "title": "Kenapa Harus NetPulse? 🤔",
  "subtitle": "Bandingkan sendiri dengan opsi lain di pasaran.",
  "tiers": [
    {"label": "🏢 Agensi", "price": "Rp 5 - 50 Juta", "items": ["Harga tinggi", "Proses lama", "Revisi terbatas"], "is_pro": false},
    {"label": "👤 Freelancer", "price": "Rp 500K - 5 Juta", "items": ["Kualitas tidak pasti", "Sering ghosting", "Tanpa garansi"], "is_pro": false},
    {"label": "🧑‍💻 DIY / Manual", "price": "Gratis tapi...", "items": ["Butuh skill coding", "Memakan waktu lama", "Hasilnya kurang rapi"], "is_pro": false},
    {"label": "⚡ NetPulse Studio", "price": "Mulai Rp 150K", "items": ["Kualitas konsisten", "Pengerjaan 3-14 hari", "Free revisi", "Support WA 24/7", "Garansi 100%"], "is_pro": true, "highlight": true, "badge": "⚡ SOLUSI TERBAIK"}
  ]
}'),

-- FAQ section
('store_faq', '{
  "icon": "❓",
  "title": "Pertanyaan yang Sering Ditanya",
  "items": [
    {"q": "Bagaimana cara memesan?", "a": "Pilih layanan yang kamu butuhkan, klik Order Sekarang, isi form (tanpa perlu daftar akun), pilih metode pembayaran, dan bayar. Kami langsung mulai setelah pembayaran terkonfirmasi."},
    {"q": "Berapa lama pengerjaan?", "a": "Tergantung jenis layanan. Landing page 3-5 hari, website fullstack 7-14 hari. Produk digital langsung dikirim otomatis setelah bayar."},
    {"q": "Apakah ada garansi revisi?", "a": "Ya! Setiap order mendapat garansi revisi gratis sesuai paket yang dipilih. Kami memastikan kamu puas dengan hasilnya."},
    {"q": "Metode pembayaran apa saja?", "a": "Kami menerima QRIS, transfer bank (BCA, BNI, BRI, Mandiri, BSI), serta e-wallet (Dana, GoPay, ShopeePay)."},
    {"q": "Bagaimana cara cek status pesanan?", "a": "Klik Cek Pesanan di menu, lalu masukkan nomor order, email, atau nomor telepon yang kamu gunakan saat checkout."},
    {"q": "Apakah perlu membuat akun?", "a": "Tidak perlu! Semua pemesanan dilakukan sebagai guest. Cukup masukkan nama dan email/telepon saat checkout."}
  ]
}'),

-- CTA section
('store_cta', '{
  "icon": "🚀",
  "title": "Siap Mulai Project-mu?",
  "subtitle": "Konsultasi gratis, tanpa kewajiban. Ceritakan kebutuhanmu dan dapatkan estimasi harga dalam hitungan menit.",
  "cta_primary": "💬 Chat WhatsApp",
  "cta_secondary": "Lihat Layanan",
  "note": "⚡ Respon cepat"
}'),

-- Pricing section
('store_pricing', '{
  "icon": "💰",
  "title": "Harga Transparan, Tanpa Ribet",
  "subtitle": "Bayar sesuai kebutuhan. Gak ada biaya tersembunyi.",
  "plans": [
    {"name": "Landing Page", "price": 150000, "original_price": 500000, "discount": 70, "features": ["1 Halaman full responsif", "Desain modern & clean", "SEO on-page dasar", "Form kontak / WhatsApp CTA", "Hosting setup gratis", "Revisi 2x"], "bonuses": ["Free konsultasi desain", "Optimasi PageSpeed"], "cta": "Order Sekarang", "popular": false},
    {"name": "Website Fullstack", "price": 800000, "original_price": 3000000, "discount": 73, "features": ["Multi-halaman (5-10 page)", "Admin dashboard custom", "Database & REST API", "Auth & role management", "SEO lengkap", "Revisi unlimited"], "bonuses": ["Free 1 bulan maintenance", "Setup domain & hosting"], "cta": "Order Sekarang", "popular": true},
    {"name": "Custom Project", "price": 0, "original_price": 0, "discount": 0, "features": ["Fitur sesuai kebutuhan", "Konsultasi mendalam", "Timeline fleksibel", "Full support priority", "Source code milik kamu", "Maintenance opsional"], "bonuses": ["Estimasi harga transparan"], "cta": "Hubungi Kami", "popular": false}
  ]
}'),

-- Testimonial section header
('store_testimonials', '{
  "icon": "💬",
  "title": "Apa Kata Mereka?",
  "subtitle": "Testimoni langsung dari klien yang sudah merasakan hasilnya.",
  "empty_text": "Testimoni segera hadir. Jadilah klien pertama kami!"
}'),

-- Sticky CTA
('store_sticky_cta', '{
  "text": "⚡ Lihat Layanan Sekarang",
  "href": "#layanan"
}')

ON CONFLICT (key) DO NOTHING;
