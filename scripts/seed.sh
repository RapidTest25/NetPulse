#!/usr/bin/env bash
set -euo pipefail

# Load .env
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

DB_HOST="${POSTGRES_HOST:-localhost}"
DB_PORT="${POSTGRES_PORT:-5432}"
DB_USER="${POSTGRES_USER:-rapidwire}"
DB_NAME="${POSTGRES_DB:-rapidwire}"

export PGPASSWORD="${POSTGRES_PASSWORD:-changeme_postgres}"

echo "🌱 Seeding database..."

# ══════════════════════════════════════════════════════
# Password hashes (Argon2id — same params as the app)
# admin123456 / user123456 / author123456
# ══════════════════════════════════════════════════════

psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" <<'EOSQL'

-- ╔══════════════════════════════════════════════════════════╗
-- ║                    CLEAN UP OLD SEEDS                    ║
-- ╚══════════════════════════════════════════════════════════╝
DELETE FROM post_tags WHERE post_id LIKE 'seed_%';
DELETE FROM post_series WHERE post_id LIKE 'seed_%';
DELETE FROM post_stats WHERE post_id LIKE 'seed_%';
DELETE FROM post_views WHERE post_id LIKE 'seed_%';
DELETE FROM saves WHERE user_id LIKE 'seed_%';
DELETE FROM likes WHERE post_id LIKE 'seed_%';
DELETE FROM comments WHERE post_id LIKE 'seed_%';
DELETE FROM post_revisions WHERE post_id LIKE 'seed_%';
DELETE FROM affiliate_commissions WHERE affiliate_id IN (SELECT id FROM affiliate_profiles WHERE user_id LIKE 'seed_%');
DELETE FROM payout_requests WHERE user_id LIKE 'seed_%';
DELETE FROM affiliate_profiles WHERE user_id LIKE 'seed_%';
DELETE FROM referral_events WHERE referrer_id LIKE 'seed_%' OR referred_id LIKE 'seed_%';
DELETE FROM author_requests WHERE user_id LIKE 'seed_%';
DELETE FROM audit_logs WHERE user_id LIKE 'seed_%';
DELETE FROM user_sessions WHERE user_id LIKE 'seed_%';
DELETE FROM auth_tokens WHERE user_id LIKE 'seed_%';
DELETE FROM invites WHERE invited_by LIKE 'seed_%';
DELETE FROM posts WHERE id LIKE 'seed_%';
DELETE FROM series WHERE id LIKE 'seed_%';
DELETE FROM user_roles WHERE user_id LIKE 'seed_%';
DELETE FROM users WHERE id LIKE 'seed_%';

-- ╔══════════════════════════════════════════════════════════╗
-- ║              1. USERS (4 roles represented)              ║
-- ╚══════════════════════════════════════════════════════════╝

-- OWNER / Super Admin
INSERT INTO users (id, email, name, password_hash, avatar, bio, is_active, referral_code, auth_provider,
                   email_verified_at, website, location, social_twitter, social_github)
VALUES (
  'seed_admin_001',
  'admin@rapidwire.local',
  'Admin RapidWire',
  '$argon2id$v=19$m=65536,t=3,p=4$GPDUQ0oSNgbv5K5Dr630JQ$flNk498Xni5t0c1W4vQ3Zymq4i+Obnv1BCqP1S0Khow',
  '',
  'Platform administrator & founder of NetPulse.',
  true,
  'ADMIN001',
  'local',
  NOW() - INTERVAL '30 days',
  'https://netpulse.dev',
  'Jakarta, Indonesia',
  '@netpulse_dev',
  'rapidtest25'
);
INSERT INTO user_roles (user_id, role_id) VALUES ('seed_admin_001', 'role_owner') ON CONFLICT DO NOTHING;

-- EDITOR
INSERT INTO users (id, email, name, password_hash, avatar, bio, is_active, referral_code, auth_provider,
                   email_verified_at, location)
VALUES (
  'seed_editor_001',
  'editor@rapidwire.local',
  'Editor NetPulse',
  '$argon2id$v=19$m=65536,t=3,p=4$GPDUQ0oSNgbv5K5Dr630JQ$flNk498Xni5t0c1W4vQ3Zymq4i+Obnv1BCqP1S0Khow',
  '',
  'Content editor yang memastikan artikel berkualitas tinggi.',
  true,
  'EDITOR01',
  'local',
  NOW() - INTERVAL '25 days',
  'Bandung, Indonesia'
);
INSERT INTO user_roles (user_id, role_id) VALUES ('seed_editor_001', 'role_editor') ON CONFLICT DO NOTHING;

-- AUTHOR #1
INSERT INTO users (id, email, name, password_hash, avatar, bio, is_active, referral_code, auth_provider,
                   email_verified_at, website, location, social_twitter, social_github, referred_by)
VALUES (
  'seed_author_001',
  'author@rapidwire.local',
  'Penulis Artikel',
  '$argon2id$v=19$m=65536,t=3,p=4$Uogzt9QJDO1mdoZ4rlzpWQ$2dzx0dz0NI9KXFRrf5MMNTvJd2UokX7UbmmOGsa0zaM',
  '',
  'Network engineer yang suka menulis tentang teknologi jaringan dan keamanan.',
  true,
  'AUTHOR01',
  'local',
  NOW() - INTERVAL '20 days',
  'https://penulis.dev',
  'Surabaya, Indonesia',
  '@penulis_dev',
  'penulis-gh',
  'seed_admin_001'
);
INSERT INTO user_roles (user_id, role_id) VALUES ('seed_author_001', 'role_author') ON CONFLICT DO NOTHING;

-- AUTHOR #2
INSERT INTO users (id, email, name, password_hash, avatar, bio, is_active, referral_code, auth_provider,
                   email_verified_at, location)
VALUES (
  'seed_author_002',
  'writer@rapidwire.local',
  'Budi Santoso',
  '$argon2id$v=19$m=65536,t=3,p=4$Uogzt9QJDO1mdoZ4rlzpWQ$2dzx0dz0NI9KXFRrf5MMNTvJd2UokX7UbmmOGsa0zaM',
  '',
  'Cloud architect dengan pengalaman 5 tahun di AWS dan GCP.',
  true,
  'AUTHOR02',
  'local',
  NOW() - INTERVAL '15 days',
  'Yogyakarta, Indonesia'
);
INSERT INTO user_roles (user_id, role_id) VALUES ('seed_author_002', 'role_author') ON CONFLICT DO NOTHING;

-- VIEWER #1 (verified)
INSERT INTO users (id, email, name, password_hash, avatar, bio, is_active, referral_code, auth_provider,
                   email_verified_at, referred_by)
VALUES (
  'seed_user_001',
  'user@rapidwire.local',
  'User Biasa',
  '$argon2id$v=19$m=65536,t=3,p=4$MLFu0jRlqg61QUUkDW+7Yg$SnPIW/FxrfSdn2JbBxTV8V4QyMAeA8seIyrImFV/tcw',
  '',
  'Pembaca setia blog NetPulse.',
  true,
  'USER0001',
  'local',
  NOW() - INTERVAL '10 days',
  'seed_author_001'
);
INSERT INTO user_roles (user_id, role_id) VALUES ('seed_user_001', 'role_viewer') ON CONFLICT DO NOTHING;

-- VIEWER #2 (unverified — for testing)
INSERT INTO users (id, email, name, password_hash, avatar, bio, is_active, referral_code, auth_provider)
VALUES (
  'seed_user_002',
  'newuser@rapidwire.local',
  'Pengguna Baru',
  '$argon2id$v=19$m=65536,t=3,p=4$MLFu0jRlqg61QUUkDW+7Yg$SnPIW/FxrfSdn2JbBxTV8V4QyMAeA8seIyrImFV/tcw',
  '',
  '',
  true,
  'USER0002',
  'local'
);
INSERT INTO user_roles (user_id, role_id) VALUES ('seed_user_002', 'role_viewer') ON CONFLICT DO NOTHING;

-- ╔══════════════════════════════════════════════════════════╗
-- ║                      2. SERIES                           ║
-- ╚══════════════════════════════════════════════════════════╝
INSERT INTO series (id, title, slug, description) VALUES
  ('seed_series_001', 'Belajar Networking dari Nol', 'belajar-networking-dari-nol',
   'Seri artikel lengkap untuk memahami dasar jaringan komputer dari awal hingga mahir.'),
  ('seed_series_002', 'DevOps untuk Pemula', 'devops-untuk-pemula',
   'Panduan step-by-step memulai perjalanan DevOps dengan tools modern.'),
  ('seed_series_003', 'Cloud Computing 101', 'cloud-computing-101',
   'Pengantar cloud computing: konsep, layanan, dan best practices.');

-- ╔══════════════════════════════════════════════════════════╗
-- ║               3. POSTS (berbagai status)                 ║
-- ╚══════════════════════════════════════════════════════════╝

-- Post 1: PUBLISHED (DNS — Networking) — by author_001
INSERT INTO posts (id, title, slug, excerpt, body, status, author_id, category_id, published_at, meta_title, meta_description)
VALUES (
  'seed_post_001',
  'Mengenal DNS: Cara Kerja Domain Name System',
  'mengenal-dns-cara-kerja-domain-name-system',
  'DNS adalah sistem yang menerjemahkan nama domain menjadi alamat IP. Pelajari cara kerjanya di artikel ini.',
  '<h2>Apa itu DNS?</h2>
<p>DNS (Domain Name System) adalah salah satu komponen paling fundamental dalam infrastruktur internet. Tanpa DNS, kita harus mengingat alamat IP setiap website yang ingin kita kunjungi.</p>

<h2>Cara Kerja DNS</h2>
<p>Ketika Anda mengetikkan sebuah URL di browser, terjadi serangkaian proses yang disebut DNS resolution. Browser akan bertanya ke DNS resolver, yang kemudian akan mencari jawaban melalui hierarki DNS server.</p>

<h3>1. DNS Resolver</h3>
<p>DNS resolver (biasanya dari ISP Anda) menerima query pertama dan mulai proses pencarian.</p>

<h3>2. Root Server</h3>
<p>Jika resolver tidak memiliki cache, ia akan bertanya ke root server untuk mendapatkan referensi ke TLD server.</p>

<h3>3. TLD Server</h3>
<p>TLD (Top-Level Domain) server mengarahkan ke authoritative nameserver untuk domain tersebut.</p>

<h3>4. Authoritative Nameserver</h3>
<p>Server ini memberikan jawaban final berupa alamat IP yang diminta.</p>

<h2>Jenis Record DNS</h2>
<ul>
  <li><strong>A Record</strong> — Mengarahkan domain ke IPv4 address</li>
  <li><strong>AAAA Record</strong> — Mengarahkan domain ke IPv6 address</li>
  <li><strong>CNAME Record</strong> — Alias untuk domain lain</li>
  <li><strong>MX Record</strong> — Mail server untuk domain</li>
  <li><strong>TXT Record</strong> — Text record untuk verifikasi dll</li>
</ul>',
  'PUBLISHED',
  'seed_author_001',
  (SELECT id FROM categories WHERE slug = 'networking' LIMIT 1),
  NOW() - INTERVAL '14 days',
  'Mengenal DNS: Cara Kerja Domain Name System | NetPulse',
  'Pelajari cara kerja DNS (Domain Name System), komponen fundamental infrastruktur internet.'
);

-- Post 2: PUBLISHED (Firewall — Security) — by author_001
INSERT INTO posts (id, title, slug, excerpt, body, status, author_id, category_id, published_at, meta_title, meta_description)
VALUES (
  'seed_post_002',
  'Panduan Lengkap Firewall: Melindungi Jaringan Anda',
  'panduan-lengkap-firewall-melindungi-jaringan',
  'Firewall adalah garis pertahanan pertama keamanan jaringan. Artikel ini membahas jenis-jenis firewall dan cara konfigurasinya.',
  '<h2>Apa itu Firewall?</h2>
<p>Firewall adalah sistem keamanan jaringan yang memantau dan mengontrol lalu lintas jaringan masuk dan keluar berdasarkan aturan keamanan yang telah ditentukan.</p>

<h2>Jenis-jenis Firewall</h2>

<h3>1. Packet Filtering</h3>
<p>Memeriksa setiap paket data yang melewati jaringan dan menerima atau menolaknya berdasarkan aturan yang telah ditetapkan.</p>

<h3>2. Stateful Inspection</h3>
<p>Memantau status koneksi aktif dan membuat keputusan berdasarkan konteks lalu lintas.</p>

<h3>3. Application Layer Gateway</h3>
<p>Beroperasi di layer aplikasi dan mampu memeriksa konten paket data secara mendalam.</p>

<h3>4. Next-Gen Firewall (NGFW)</h3>
<p>Menggabungkan fitur firewall tradisional dengan fungsi keamanan tambahan seperti IPS, deep packet inspection, dan threat intelligence.</p>

<h2>Best Practices</h2>
<ol>
  <li>Terapkan prinsip "deny by default"</li>
  <li>Audit rules secara berkala</li>
  <li>Segmentasi jaringan dengan zona keamanan</li>
  <li>Monitor log firewall secara aktif</li>
</ol>',
  'PUBLISHED',
  'seed_author_001',
  (SELECT id FROM categories WHERE slug = 'security' LIMIT 1),
  NOW() - INTERVAL '10 days',
  'Panduan Lengkap Firewall | NetPulse',
  'Pelajari firewall: jenis, cara kerja, dan best practices untuk melindungi jaringan Anda.'
);

-- Post 3: PUBLISHED (Docker — DevOps) — by author_001
INSERT INTO posts (id, title, slug, excerpt, body, status, author_id, category_id, published_at)
VALUES (
  'seed_post_003',
  'Docker untuk Pemula: Kontainerisasi Aplikasi',
  'docker-untuk-pemula-kontainerisasi-aplikasi',
  'Pelajari dasar-dasar Docker dan bagaimana kontainerisasi dapat mempermudah deployment aplikasi Anda.',
  '<h2>Mengapa Docker?</h2>
<p>Docker memungkinkan Anda mengemas aplikasi beserta semua dependensinya ke dalam sebuah kontainer yang portable dan konsisten di berbagai environment.</p>

<h2>Konsep Dasar</h2>

<h3>Image</h3>
<p>Docker image adalah template read-only yang berisi instruksi untuk membuat kontainer. Image dibangun dari Dockerfile.</p>

<h3>Container</h3>
<p>Container adalah instance yang berjalan dari sebuah image. Anda bisa membuat, memulai, menghentikan, dan menghapus container.</p>

<h3>Dockerfile</h3>
<p>File teks yang berisi instruksi untuk membangun Docker image. Setiap instruksi membuat layer baru dalam image.</p>

<h2>Perintah Dasar</h2>
<p><code>docker build -t myapp .</code> untuk membuat image<br/>
<code>docker run -p 3000:3000 myapp</code> untuk menjalankan container<br/>
<code>docker ps</code> untuk melihat container yang berjalan</p>',
  'PUBLISHED',
  'seed_author_001',
  (SELECT id FROM categories WHERE slug = 'devops' LIMIT 1),
  NOW() - INTERVAL '7 days'
);

-- Post 4: PUBLISHED (AWS — Cloud) — by author_002
INSERT INTO posts (id, title, slug, excerpt, body, status, author_id, category_id, published_at)
VALUES (
  'seed_post_004',
  'Mengenal AWS: Panduan Awal Cloud Computing',
  'mengenal-aws-panduan-awal-cloud-computing',
  'Amazon Web Services (AWS) adalah platform cloud terbesar di dunia. Kenali layanan utamanya di sini.',
  '<h2>Apa itu AWS?</h2>
<p>Amazon Web Services (AWS) adalah platform cloud computing milik Amazon yang menyediakan lebih dari 200 layanan mulai dari compute, storage, database, hingga machine learning.</p>

<h2>Layanan Utama AWS</h2>

<h3>EC2 (Elastic Compute Cloud)</h3>
<p>Virtual server yang bisa Anda konfigurasi sesuai kebutuhan. Tersedia berbagai instance type mulai dari t2.micro hingga high-performance computing.</p>

<h3>S3 (Simple Storage Service)</h3>
<p>Object storage dengan durability 99.999999999% (11 nines). Cocok untuk static files, backup, dan data lake.</p>

<h3>RDS (Relational Database Service)</h3>
<p>Managed database service yang mendukung PostgreSQL, MySQL, MariaDB, Oracle, dan SQL Server.</p>

<h3>Lambda</h3>
<p>Serverless computing — jalankan kode tanpa provisioning server. Bayar hanya untuk compute time yang digunakan.</p>

<h2>Free Tier</h2>
<p>AWS menawarkan free tier selama 12 bulan untuk banyak layanan, termasuk 750 jam EC2 t2.micro dan 5GB S3 storage per bulan.</p>',
  'PUBLISHED',
  'seed_author_002',
  (SELECT id FROM categories WHERE slug = 'cloud' LIMIT 1),
  NOW() - INTERVAL '5 days'
);

-- Post 5: PUBLISHED (HTTP/3 — Internet) — by author_002
INSERT INTO posts (id, title, slug, excerpt, body, status, author_id, category_id, published_at)
VALUES (
  'seed_post_005',
  'HTTP/3 dan QUIC: Masa Depan Protokol Web',
  'http3-dan-quic-masa-depan-protokol-web',
  'HTTP/3 menggunakan QUIC sebagai transport layer, menggantikan TCP. Apa keunggulannya?',
  '<h2>Evolusi HTTP</h2>
<p>Dari HTTP/1.0 di tahun 1996 hingga HTTP/3 yang berbasis QUIC, protokol web terus berevolusi untuk meningkatkan performa.</p>

<h2>Apa itu QUIC?</h2>
<p>QUIC (Quick UDP Internet Connections) adalah transport protocol yang dikembangkan oleh Google. Berbeda dari TCP, QUIC berjalan di atas UDP dan menawarkan beberapa keunggulan:</p>

<h3>1. Zero-RTT Connection</h3>
<p>Koneksi ulang ke server yang sama bisa dilakukan tanpa round-trip tambahan, mengurangi latency secara signifikan.</p>

<h3>2. Multiplexing tanpa Head-of-Line Blocking</h3>
<p>Tidak seperti HTTP/2 over TCP, QUIC menghilangkan masalah head-of-line blocking karena setiap stream independen satu sama lain.</p>

<h3>3. Connection Migration</h3>
<p>Ketika device berpindah jaringan (WiFi ke cellular), koneksi QUIC tidak terputus karena menggunakan connection ID, bukan IP:port tuple.</p>

<h2>Adopsi HTTP/3</h2>
<p>Google, Cloudflare, dan CDN besar lainnya sudah mendukung HTTP/3. Nginx dan Apache juga mulai menambahkan support.</p>',
  'PUBLISHED',
  'seed_author_002',
  (SELECT id FROM categories WHERE slug = 'internet' LIMIT 1),
  NOW() - INTERVAL '3 days'
);

-- Post 6: PUBLISHED (Kubernetes — DevOps) — by author_001
INSERT INTO posts (id, title, slug, excerpt, body, status, author_id, category_id, published_at)
VALUES (
  'seed_post_006',
  'Kubernetes 101: Orkestrasi Kontainer di Skala Besar',
  'kubernetes-101-orkestrasi-kontainer-di-skala-besar',
  'Kubernetes (K8s) adalah platform orkestrasi kontainer open-source yang membantu mengelola deployment aplikasi.',
  '<h2>Mengapa Kubernetes?</h2>
<p>Ketika Anda memiliki banyak kontainer Docker yang berjalan di beberapa server, Anda butuh cara untuk mengelola, menskalakan, dan memeliharanya. Di sinilah Kubernetes berperan.</p>

<h2>Komponen Utama</h2>

<h3>Pod</h3>
<p>Unit deploy terkecil di Kubernetes. Satu pod bisa berisi satu atau lebih container yang berbagi network namespace.</p>

<h3>Deployment</h3>
<p>Mendefinisikan desired state untuk pod. Kubernetes memastikan jumlah replica yang diinginkan selalu berjalan.</p>

<h3>Service</h3>
<p>Abstraksi yang mendefinisikan cara mengakses pod. Bisa berupa ClusterIP, NodePort, atau LoadBalancer.</p>

<h3>Ingress</h3>
<p>Mengatur routing HTTP/HTTPS dari luar cluster ke service di dalam cluster.</p>

<h2>Kubectl Essentials</h2>
<p><code>kubectl get pods</code> — lihat pod yang berjalan<br/>
<code>kubectl apply -f deployment.yaml</code> — apply konfigurasi<br/>
<code>kubectl logs pod-name</code> — lihat log pod<br/>
<code>kubectl scale deployment/app --replicas=3</code> — scale ke 3 pods</p>',
  'PUBLISHED',
  'seed_author_001',
  (SELECT id FROM categories WHERE slug = 'devops' LIMIT 1),
  NOW() - INTERVAL '1 day'
);

-- Post 7: DRAFT — by author_002
INSERT INTO posts (id, title, slug, excerpt, body, status, author_id, category_id)
VALUES (
  'seed_post_007',
  'VPN: Jenis, Protokol, dan Cara Memilih yang Tepat',
  'vpn-jenis-protokol-cara-memilih',
  'Panduan lengkap tentang VPN: dari WireGuard hingga OpenVPN, kapan harus menggunakan masing-masing.',
  '<h2>Apa itu VPN?</h2>
<p>VPN (Virtual Private Network) membuat tunnel terenkripsi antara device Anda dan server VPN, melindungi data dan menyembunyikan IP address.</p>

<h2>Protokol VPN Populer</h2>
<p><strong>WireGuard</strong> — Modern, cepat, codebase kecil<br/>
<strong>OpenVPN</strong> — Mature, banyak digunakan enterprise<br/>
<strong>IPSec/IKEv2</strong> — Stabil untuk mobile devices</p>

<p>[DRAFT - akan dilengkapi perbandingan performa dan use cases]</p>',
  'DRAFT',
  'seed_author_002',
  (SELECT id FROM categories WHERE slug = 'security' LIMIT 1)
);

-- Post 8: IN_REVIEW — by author_001
INSERT INTO posts (id, title, slug, excerpt, body, status, author_id, category_id)
VALUES (
  'seed_post_008',
  'Load Balancer: Konsep dan Implementasi',
  'load-balancer-konsep-dan-implementasi',
  'Pelajari bagaimana load balancer mendistribusikan traffic ke multiple server untuk high availability.',
  '<h2>Apa itu Load Balancer?</h2>
<p>Load balancer adalah komponen yang mendistribusikan traffic jaringan ke beberapa server backend untuk memastikan tidak ada satu server pun yang kelebihan beban.</p>

<h2>Algoritma Load Balancing</h2>
<h3>Round Robin</h3>
<p>Request didistribusikan secara bergiliran ke setiap server.</p>
<h3>Least Connections</h3>
<p>Request diarahkan ke server dengan koneksi aktif paling sedikit.</p>
<h3>IP Hash</h3>
<p>IP client di-hash untuk menentukan server tujuan, memastikan session persistence.</p>

<h2>Layer 4 vs Layer 7</h2>
<p>Layer 4 (TCP/UDP) lebih cepat, Layer 7 (HTTP) lebih fleksibel dengan content-based routing.</p>',
  'IN_REVIEW',
  'seed_author_001',
  (SELECT id FROM categories WHERE slug = 'networking' LIMIT 1)
);

-- Post 9: SCHEDULED (7 hari ke depan) — by author_002
INSERT INTO posts (id, title, slug, excerpt, body, status, author_id, category_id, scheduled_at)
VALUES (
  'seed_post_009',
  'CDN: Mengoptimalkan Distribusi Konten Global',
  'cdn-mengoptimalkan-distribusi-konten-global',
  'Bagaimana CDN bekerja dan mengapa website Anda membutuhkannya.',
  '<h2>Apa itu CDN?</h2>
<p>Content Delivery Network (CDN) adalah jaringan server yang tersebar di seluruh dunia, dirancang untuk menyajikan konten website dari lokasi terdekat dengan pengguna.</p>

<h2>Cara Kerja CDN</h2>
<p>Ketika user mengakses website, CDN akan menyajikan konten dari edge server terdekat, bukan dari origin server. Ini mengurangi latency dan meningkatkan user experience.</p>

<h2>Provider CDN Populer</h2>
<ul>
  <li><strong>Cloudflare</strong> — Free tier dengan fitur lengkap</li>
  <li><strong>AWS CloudFront</strong> — Integrasi dengan ekosistem AWS</li>
  <li><strong>Fastly</strong> — Edge computing dan real-time purging</li>
  <li><strong>Akamai</strong> — CDN terbesar dan paling established</li>
</ul>',
  'SCHEDULED',
  'seed_author_002',
  (SELECT id FROM categories WHERE slug = 'internet' LIMIT 1),
  NOW() + INTERVAL '7 days'
);

-- Post 10: ARCHIVED — by author_001
INSERT INTO posts (id, title, slug, excerpt, body, status, author_id, category_id, published_at)
VALUES (
  'seed_post_010',
  'BGP: Protokol yang Menghubungkan Internet',
  'bgp-protokol-yang-menghubungkan-internet',
  'Border Gateway Protocol (BGP) adalah protokol routing yang menjadi tulang punggung internet global.',
  '<h2>Apa itu BGP?</h2>
<p>BGP (Border Gateway Protocol) adalah protokol path-vector yang digunakan untuk routing antar autonomous systems (AS) di internet.</p>

<h2>Mengapa BGP Penting?</h2>
<p>BGP secara harfiah menghubungkan internet. Setiap ISP, cloud provider, dan jaringan besar menggunakan BGP untuk mengumumkan route mereka dan belajar route dari network lain.</p>

<p><em>[Artikel ini telah diarsipkan karena ada versi yang lebih baru]</em></p>',
  'ARCHIVED',
  'seed_author_001',
  (SELECT id FROM categories WHERE slug = 'networking' LIMIT 1),
  NOW() - INTERVAL '60 days'
);

-- ╔══════════════════════════════════════════════════════════╗
-- ║                    4. POST TAGS                          ║
-- ╚══════════════════════════════════════════════════════════╝
INSERT INTO post_tags (post_id, tag_id) SELECT 'seed_post_001', id FROM tags WHERE slug = 'dns' ON CONFLICT DO NOTHING;
INSERT INTO post_tags (post_id, tag_id) SELECT 'seed_post_001', id FROM tags WHERE slug = 'tcp-ip' ON CONFLICT DO NOTHING;
INSERT INTO post_tags (post_id, tag_id) SELECT 'seed_post_002', id FROM tags WHERE slug = 'firewall' ON CONFLICT DO NOTHING;
INSERT INTO post_tags (post_id, tag_id) SELECT 'seed_post_002', id FROM tags WHERE slug = 'vpn' ON CONFLICT DO NOTHING;
INSERT INTO post_tags (post_id, tag_id) SELECT 'seed_post_003', id FROM tags WHERE slug = 'docker' ON CONFLICT DO NOTHING;
INSERT INTO post_tags (post_id, tag_id) SELECT 'seed_post_003', id FROM tags WHERE slug = 'kubernetes' ON CONFLICT DO NOTHING;
INSERT INTO post_tags (post_id, tag_id) SELECT 'seed_post_004', id FROM tags WHERE slug = 'cdn' ON CONFLICT DO NOTHING;
INSERT INTO post_tags (post_id, tag_id) SELECT 'seed_post_005', id FROM tags WHERE slug = 'http-3' ON CONFLICT DO NOTHING;
INSERT INTO post_tags (post_id, tag_id) SELECT 'seed_post_005', id FROM tags WHERE slug = 'tcp-ip' ON CONFLICT DO NOTHING;
INSERT INTO post_tags (post_id, tag_id) SELECT 'seed_post_006', id FROM tags WHERE slug = 'kubernetes' ON CONFLICT DO NOTHING;
INSERT INTO post_tags (post_id, tag_id) SELECT 'seed_post_006', id FROM tags WHERE slug = 'docker' ON CONFLICT DO NOTHING;
INSERT INTO post_tags (post_id, tag_id) SELECT 'seed_post_007', id FROM tags WHERE slug = 'vpn' ON CONFLICT DO NOTHING;
INSERT INTO post_tags (post_id, tag_id) SELECT 'seed_post_007', id FROM tags WHERE slug = 'firewall' ON CONFLICT DO NOTHING;
INSERT INTO post_tags (post_id, tag_id) SELECT 'seed_post_008', id FROM tags WHERE slug = 'load-balancer' ON CONFLICT DO NOTHING;
INSERT INTO post_tags (post_id, tag_id) SELECT 'seed_post_009', id FROM tags WHERE slug = 'cdn' ON CONFLICT DO NOTHING;
INSERT INTO post_tags (post_id, tag_id) SELECT 'seed_post_010', id FROM tags WHERE slug = 'bgp' ON CONFLICT DO NOTHING;

-- ╔══════════════════════════════════════════════════════════╗
-- ║                  5. POST-SERIES LINKS                    ║
-- ╚══════════════════════════════════════════════════════════╝
-- "Belajar Networking dari Nol" series
INSERT INTO post_series (post_id, series_id, position) VALUES
  ('seed_post_001', 'seed_series_001', 1),
  ('seed_post_010', 'seed_series_001', 2),
  ('seed_post_008', 'seed_series_001', 3)
ON CONFLICT DO NOTHING;

-- "DevOps untuk Pemula" series
INSERT INTO post_series (post_id, series_id, position) VALUES
  ('seed_post_003', 'seed_series_002', 1),
  ('seed_post_006', 'seed_series_002', 2)
ON CONFLICT DO NOTHING;

-- "Cloud Computing 101"
INSERT INTO post_series (post_id, series_id, position) VALUES
  ('seed_post_004', 'seed_series_003', 1)
ON CONFLICT DO NOTHING;

-- ╔══════════════════════════════════════════════════════════╗
-- ║             6. COMMENTS (threaded + guest + spam)        ║
-- ╚══════════════════════════════════════════════════════════╝

-- DNS post (seed_post_001) — 4 comments
INSERT INTO comments (id, post_id, user_id, content, status, created_at) VALUES
  ('seed_cmt_001', 'seed_post_001', 'seed_user_001',
   'Artikel yang sangat jelas! Akhirnya saya paham cara kerja DNS. Terima kasih!', 'APPROVED',
   NOW() - INTERVAL '13 days');

INSERT INTO comments (id, post_id, user_id, parent_id, content, status, created_at) VALUES
  ('seed_cmt_002', 'seed_post_001', 'seed_author_001', 'seed_cmt_001',
   'Sama-sama! Senang bisa membantu. Jika ada pertanyaan lanjutan, silakan tanya.', 'APPROVED',
   NOW() - INTERVAL '13 days' + INTERVAL '2 hours');

INSERT INTO comments (id, post_id, user_id, content, status, created_at) VALUES
  ('seed_cmt_003', 'seed_post_001', 'seed_author_002',
   'Mungkin bisa ditambahkan juga tentang DNS over HTTPS (DoH) dan DNS over TLS (DoT) di artikel berikutnya?', 'APPROVED',
   NOW() - INTERVAL '12 days');

-- Guest comment (pending moderation)
INSERT INTO comments (id, post_id, guest_name, guest_email, content, status, ip_address, created_at) VALUES
  ('seed_cmt_004', 'seed_post_001', 'Tamu Anonim', 'guest@example.com',
   'Kalau pakai DNS 1.1.1.1 vs 8.8.8.8, mana yang lebih cepat ya?', 'PENDING',
   '192.168.1.100', NOW() - INTERVAL '11 days');

-- Firewall post (seed_post_002) — 2 comments (threaded)
INSERT INTO comments (id, post_id, user_id, content, status, created_at) VALUES
  ('seed_cmt_005', 'seed_post_002', 'seed_user_001',
   'Bisa jelaskan lebih detail perbedaan stateful vs stateless firewall?', 'APPROVED',
   NOW() - INTERVAL '9 days');

INSERT INTO comments (id, post_id, user_id, parent_id, content, status, created_at) VALUES
  ('seed_cmt_006', 'seed_post_002', 'seed_author_001', 'seed_cmt_005',
   'Stateful firewall melacak state koneksi (SYN, ACK, dll), sedangkan stateless hanya memeriksa header per-paket tanpa konteks. Stateful lebih aman karena bisa memfilter berdasarkan konteks koneksi.', 'APPROVED',
   NOW() - INTERVAL '9 days' + INTERVAL '1 hour');

-- Docker post (seed_post_003) — 1 SPAM comment
INSERT INTO comments (id, post_id, guest_name, guest_email, content, status, ip_address, created_at) VALUES
  ('seed_cmt_007', 'seed_post_003', 'SpamBot', 'spam@spam.test',
   'Buy cheap VPS hosting at http://spam-link.test !!!', 'SPAM',
   '10.0.0.99', NOW() - INTERVAL '6 days');

-- AWS post (seed_post_004) — 2 comments
INSERT INTO comments (id, post_id, user_id, content, status, created_at) VALUES
  ('seed_cmt_008', 'seed_post_004', 'seed_user_001',
   'GCP vs AWS, mana yang lebih cocok untuk startup kecil?', 'APPROVED',
   NOW() - INTERVAL '4 days');

INSERT INTO comments (id, post_id, user_id, parent_id, content, status, created_at) VALUES
  ('seed_cmt_009', 'seed_post_004', 'seed_author_002', 'seed_cmt_008',
   'Keduanya punya free tier yang bagus. Tapi kalau dari segi simplicity, GCP sedikit lebih mudah dipelajari. AWS lebih lengkap service-nya. Untuk startup, tergantung kebutuhan.', 'APPROVED',
   NOW() - INTERVAL '4 days' + INTERVAL '3 hours');

-- K8s post (seed_post_006) — 1 editor comment
INSERT INTO comments (id, post_id, user_id, content, status, created_at) VALUES
  ('seed_cmt_010', 'seed_post_006', 'seed_editor_001',
   'Artikel bagus! Saya sudah review dan approve. Mungkin bisa ditambahkan section tentang Helm charts di versi berikutnya.', 'APPROVED',
   NOW() - INTERVAL '12 hours');

-- ╔══════════════════════════════════════════════════════════╗
-- ║                      7. LIKES                            ║
-- ╚══════════════════════════════════════════════════════════╝
-- User likes
INSERT INTO likes (id, post_id, user_id, created_at) VALUES
  ('seed_like_001', 'seed_post_001', 'seed_user_001',   NOW() - INTERVAL '13 days'),
  ('seed_like_002', 'seed_post_001', 'seed_editor_001', NOW() - INTERVAL '12 days'),
  ('seed_like_003', 'seed_post_001', 'seed_author_002', NOW() - INTERVAL '11 days'),
  ('seed_like_004', 'seed_post_002', 'seed_user_001',   NOW() - INTERVAL '9 days'),
  ('seed_like_005', 'seed_post_002', 'seed_author_002', NOW() - INTERVAL '8 days'),
  ('seed_like_006', 'seed_post_003', 'seed_user_001',   NOW() - INTERVAL '6 days'),
  ('seed_like_007', 'seed_post_003', 'seed_editor_001', NOW() - INTERVAL '5 days'),
  ('seed_like_008', 'seed_post_004', 'seed_user_001',   NOW() - INTERVAL '4 days'),
  ('seed_like_009', 'seed_post_004', 'seed_author_001', NOW() - INTERVAL '3 days'),
  ('seed_like_010', 'seed_post_005', 'seed_user_001',   NOW() - INTERVAL '2 days'),
  ('seed_like_011', 'seed_post_005', 'seed_editor_001', NOW() - INTERVAL '1 day'),
  ('seed_like_012', 'seed_post_006', 'seed_user_001',   NOW() - INTERVAL '12 hours'),
  ('seed_like_013', 'seed_post_006', 'seed_author_002', NOW() - INTERVAL '6 hours');

-- Guest likes
INSERT INTO likes (id, post_id, guest_key, created_at) VALUES
  ('seed_like_014', 'seed_post_001', 'guest_abc123', NOW() - INTERVAL '10 days'),
  ('seed_like_015', 'seed_post_002', 'guest_def456', NOW() - INTERVAL '7 days'),
  ('seed_like_016', 'seed_post_005', 'guest_ghi789', NOW() - INTERVAL '2 days');

-- ╔══════════════════════════════════════════════════════════╗
-- ║                 8. SAVES / BOOKMARKS                     ║
-- ╚══════════════════════════════════════════════════════════╝
INSERT INTO saves (id, user_id, post_id, created_at) VALUES
  ('seed_save_001', 'seed_user_001',   'seed_post_001', NOW() - INTERVAL '12 days'),
  ('seed_save_002', 'seed_user_001',   'seed_post_002', NOW() - INTERVAL '9 days'),
  ('seed_save_003', 'seed_user_001',   'seed_post_004', NOW() - INTERVAL '4 days'),
  ('seed_save_004', 'seed_editor_001', 'seed_post_001', NOW() - INTERVAL '11 days'),
  ('seed_save_005', 'seed_editor_001', 'seed_post_003', NOW() - INTERVAL '5 days'),
  ('seed_save_006', 'seed_author_002', 'seed_post_002', NOW() - INTERVAL '8 days'),
  ('seed_save_007', 'seed_author_001', 'seed_post_004', NOW() - INTERVAL '3 days');

-- ╔══════════════════════════════════════════════════════════╗
-- ║               9. POST VIEWS (analytics)                  ║
-- ╚══════════════════════════════════════════════════════════╝
INSERT INTO post_views (post_id, ip_hash, user_agent, referrer, created_at) VALUES
  -- DNS post (12 views, spread over 14 days)
  ('seed_post_001', md5('192.168.1.1'), 'Mozilla/5.0',  'https://google.com',  NOW() - INTERVAL '14 days'),
  ('seed_post_001', md5('192.168.1.2'), 'Mozilla/5.0',  'https://google.com',  NOW() - INTERVAL '13 days'),
  ('seed_post_001', md5('192.168.1.3'), 'Chrome/120',   'https://twitter.com', NOW() - INTERVAL '13 days'),
  ('seed_post_001', md5('10.0.0.1'),    'Safari/17',    'https://reddit.com',  NOW() - INTERVAL '12 days'),
  ('seed_post_001', md5('10.0.0.2'),    'Chrome/120',   '',                    NOW() - INTERVAL '11 days'),
  ('seed_post_001', md5('172.16.0.1'),  'Firefox/121',  'https://google.com',  NOW() - INTERVAL '10 days'),
  ('seed_post_001', md5('172.16.0.2'),  'Chrome/120',   'https://google.com',  NOW() - INTERVAL '9 days'),
  ('seed_post_001', md5('172.16.0.3'),  'Safari/17',    '',                    NOW() - INTERVAL '7 days'),
  ('seed_post_001', md5('192.168.2.1'), 'Chrome/120',   'https://bing.com',    NOW() - INTERVAL '5 days'),
  ('seed_post_001', md5('192.168.2.2'), 'Firefox/121',  'https://google.com',  NOW() - INTERVAL '3 days'),
  ('seed_post_001', md5('192.168.2.3'), 'Chrome/120',   '',                    NOW() - INTERVAL '1 day'),
  ('seed_post_001', md5('192.168.2.4'), 'Safari/17',    'https://google.com',  NOW() - INTERVAL '6 hours'),
  -- Firewall post (7 views)
  ('seed_post_002', md5('192.168.1.1'), 'Chrome/120',   'https://google.com',  NOW() - INTERVAL '10 days'),
  ('seed_post_002', md5('192.168.1.4'), 'Firefox/121',  '',                    NOW() - INTERVAL '9 days'),
  ('seed_post_002', md5('10.0.0.3'),    'Chrome/120',   'https://google.com',  NOW() - INTERVAL '8 days'),
  ('seed_post_002', md5('10.0.0.4'),    'Safari/17',    'https://twitter.com', NOW() - INTERVAL '6 days'),
  ('seed_post_002', md5('172.16.1.1'),  'Chrome/120',   'https://google.com',  NOW() - INTERVAL '4 days'),
  ('seed_post_002', md5('172.16.1.2'),  'Firefox/121',  '',                    NOW() - INTERVAL '2 days'),
  ('seed_post_002', md5('172.16.1.3'),  'Chrome/120',   'https://bing.com',    NOW() - INTERVAL '1 day'),
  -- Docker post (5 views)
  ('seed_post_003', md5('192.168.1.1'), 'Chrome/120',   'https://google.com',  NOW() - INTERVAL '7 days'),
  ('seed_post_003', md5('192.168.1.5'), 'Safari/17',    '',                    NOW() - INTERVAL '6 days'),
  ('seed_post_003', md5('10.0.0.5'),    'Chrome/120',   'https://reddit.com',  NOW() - INTERVAL '5 days'),
  ('seed_post_003', md5('10.0.0.6'),    'Firefox/121',  'https://google.com',  NOW() - INTERVAL '3 days'),
  ('seed_post_003', md5('172.16.2.1'),  'Chrome/120',   '',                    NOW() - INTERVAL '1 day'),
  -- AWS post (4 views)
  ('seed_post_004', md5('192.168.1.1'), 'Chrome/120',   'https://google.com',  NOW() - INTERVAL '5 days'),
  ('seed_post_004', md5('192.168.1.6'), 'Safari/17',    '',                    NOW() - INTERVAL '4 days'),
  ('seed_post_004', md5('10.0.0.7'),    'Firefox/121',  'https://google.com',  NOW() - INTERVAL '3 days'),
  ('seed_post_004', md5('10.0.0.8'),    'Chrome/120',   'https://twitter.com', NOW() - INTERVAL '2 days'),
  -- HTTP/3 post (3 views)
  ('seed_post_005', md5('192.168.1.1'), 'Chrome/120',   'https://google.com',  NOW() - INTERVAL '3 days'),
  ('seed_post_005', md5('10.0.0.9'),    'Safari/17',    '',                    NOW() - INTERVAL '2 days'),
  ('seed_post_005', md5('172.16.3.1'),  'Firefox/121',  'https://reddit.com',  NOW() - INTERVAL '1 day'),
  -- K8s post (3 views — newest)
  ('seed_post_006', md5('192.168.1.1'), 'Chrome/120',   'https://google.com',  NOW() - INTERVAL '18 hours'),
  ('seed_post_006', md5('10.0.1.1'),    'Safari/17',    '',                    NOW() - INTERVAL '12 hours'),
  ('seed_post_006', md5('172.16.4.1'),  'Firefox/121',  'https://twitter.com', NOW() - INTERVAL '6 hours');

-- ╔══════════════════════════════════════════════════════════╗
-- ║             10. POST STATS (denormalized counters)       ║
-- ╚══════════════════════════════════════════════════════════╝
INSERT INTO post_stats (post_id, views_count, likes_count, comments_count, saves_count) VALUES
  ('seed_post_001', 12, 4, 4, 2),
  ('seed_post_002',  7, 3, 2, 2),
  ('seed_post_003',  5, 2, 1, 1),
  ('seed_post_004',  4, 2, 2, 2),
  ('seed_post_005',  3, 3, 0, 0),
  ('seed_post_006',  3, 2, 1, 0),
  ('seed_post_007',  0, 0, 0, 0),
  ('seed_post_008',  0, 0, 0, 0),
  ('seed_post_009',  0, 0, 0, 0),
  ('seed_post_010',  0, 0, 0, 0)
ON CONFLICT (post_id) DO UPDATE SET
  views_count    = EXCLUDED.views_count,
  likes_count    = EXCLUDED.likes_count,
  comments_count = EXCLUDED.comments_count,
  saves_count    = EXCLUDED.saves_count;

-- ╔══════════════════════════════════════════════════════════╗
-- ║                 11. POST REVISIONS                       ║
-- ╚══════════════════════════════════════════════════════════╝
INSERT INTO post_revisions (post_id, title, body, excerpt, editor_id, created_at) VALUES
  ('seed_post_001', 'Mengenal DNS: Domain Name System',
   '<p>Draft awal tentang DNS...</p>', 'Draft DNS',
   'seed_author_001', NOW() - INTERVAL '15 days'),
  ('seed_post_001', 'Mengenal DNS: Cara Kerja Domain Name System',
   '<h2>Apa itu DNS?</h2><p>Versi revisi oleh editor...</p>', 'DNS adalah sistem...',
   'seed_editor_001', NOW() - INTERVAL '14 days'),
  ('seed_post_002', 'Firewall Basics',
   '<p>Draft awal firewall...</p>', 'Pengenalan firewall',
   'seed_author_001', NOW() - INTERVAL '11 days'),
  ('seed_post_006', 'Kubernetes Basics',
   '<p>Draft K8s...</p>', 'Pengenalan Kubernetes',
   'seed_author_001', NOW() - INTERVAL '2 days');

-- ╔══════════════════════════════════════════════════════════╗
-- ║               12. REFERRAL EVENTS                        ║
-- ╚══════════════════════════════════════════════════════════╝
INSERT INTO referral_events (referrer_id, referred_id, ip_address, verified, created_at) VALUES
  ('seed_admin_001',  'seed_author_001', '192.168.1.10', true,  NOW() - INTERVAL '20 days'),
  ('seed_author_001', 'seed_user_001',   '192.168.1.20', true,  NOW() - INTERVAL '10 days'),
  ('seed_author_001', 'seed_user_002',   '192.168.1.30', false, NOW() - INTERVAL '5 days');

-- ╔══════════════════════════════════════════════════════════╗
-- ║              13. AFFILIATE PROFILES                      ║
-- ╚══════════════════════════════════════════════════════════╝
INSERT INTO affiliate_profiles (id, user_id, status, payout_method, payout_name_encrypted, payout_number_encrypted,
                                total_earnings, total_paid, pending_balance,
                                approved_at, created_at)
VALUES
  ('a0000001-0000-0000-0000-000000000001', 'seed_author_001', 'APPROVED', 'BANK',
   'encrypted_name_author', 'encrypted_number_author',
   50000.00, 0.00, 25000.00,
   NOW() - INTERVAL '18 days', NOW() - INTERVAL '19 days'),
  ('a0000001-0000-0000-0000-000000000002', 'seed_author_002', 'PENDING', 'EWALLET',
   'encrypted_name_budi', 'encrypted_number_budi',
   0.00, 0.00, 0.00,
   NULL, NOW() - INTERVAL '14 days');

-- ╔══════════════════════════════════════════════════════════╗
-- ║            14. AFFILIATE COMMISSIONS                     ║
-- ╚══════════════════════════════════════════════════════════╝
INSERT INTO affiliate_commissions (id, affiliate_id, referral_event_id, amount, description, status, created_at)
VALUES
  (gen_random_uuid(), 'a0000001-0000-0000-0000-000000000001',
   (SELECT id FROM referral_events WHERE referrer_id = 'seed_author_001' AND referred_id = 'seed_user_001' LIMIT 1),
   25000.00, 'Komisi referral: User Biasa mendaftar', 'APPROVED', NOW() - INTERVAL '10 days'),
  (gen_random_uuid(), 'a0000001-0000-0000-0000-000000000001',
   (SELECT id FROM referral_events WHERE referrer_id = 'seed_author_001' AND referred_id = 'seed_user_002' LIMIT 1),
   25000.00, 'Komisi referral: Pengguna Baru mendaftar (pending verifikasi)', 'PENDING', NOW() - INTERVAL '5 days');

-- ╔══════════════════════════════════════════════════════════╗
-- ║              15. AUTHOR REQUESTS                         ║
-- ╚══════════════════════════════════════════════════════════╝
INSERT INTO author_requests (id, user_id, status, reason, created_at) VALUES
  ('seed_areq_001', 'seed_user_001', 'PENDING',
   'Saya ingin menulis artikel tentang networking dan pengalaman saya sebagai network engineer.',
   NOW() - INTERVAL '3 days');

INSERT INTO author_requests (id, user_id, status, reason, admin_note, reviewed_by, reviewed_at, created_at) VALUES
  ('seed_areq_002', 'seed_user_002', 'REJECTED',
   'saya mau nulis aja',
   'Mohon berikan alasan yang lebih detail tentang topik yang ingin ditulis.',
   'seed_admin_001',
   NOW() - INTERVAL '1 day',
   NOW() - INTERVAL '4 days');

-- ╔══════════════════════════════════════════════════════════╗
-- ║                  16. AUDIT LOGS                          ║
-- ╚══════════════════════════════════════════════════════════╝
INSERT INTO audit_logs (user_id, action, entity, entity_id, details, ip_address, created_at) VALUES
  ('seed_admin_001',  'LOGIN',  'auth', '',               'Login berhasil',                    '192.168.1.1',  NOW() - INTERVAL '14 days'),
  ('seed_admin_001',  'CREATE', 'user', 'seed_editor_001','Membuat akun editor',               '192.168.1.1',  NOW() - INTERVAL '14 days'),
  ('seed_author_001', 'LOGIN',  'auth', '',               'Login berhasil',                    '192.168.1.10', NOW() - INTERVAL '14 days'),
  ('seed_author_001', 'CREATE', 'post', 'seed_post_001', 'Membuat artikel: Mengenal DNS',     '192.168.1.10', NOW() - INTERVAL '14 days'),
  ('seed_editor_001', 'UPDATE', 'post', 'seed_post_001', 'Review dan approve artikel DNS',    '192.168.1.20', NOW() - INTERVAL '14 days'),
  ('seed_author_001', 'CREATE', 'post', 'seed_post_002', 'Membuat artikel: Panduan Firewall', '192.168.1.10', NOW() - INTERVAL '10 days'),
  ('seed_author_001', 'CREATE', 'post', 'seed_post_003', 'Membuat artikel: Docker Pemula',    '192.168.1.10', NOW() - INTERVAL '7 days'),
  ('seed_author_002', 'CREATE', 'post', 'seed_post_004', 'Membuat artikel: Mengenal AWS',     '192.168.1.30', NOW() - INTERVAL '5 days'),
  ('seed_author_002', 'CREATE', 'post', 'seed_post_005', 'Membuat artikel: HTTP/3 dan QUIC',  '192.168.1.30', NOW() - INTERVAL '3 days'),
  ('seed_admin_001',  'UPDATE', 'comment', 'seed_cmt_007','Menandai komentar sebagai SPAM',   '192.168.1.1',  NOW() - INTERVAL '6 days'),
  ('seed_user_001',   'LOGIN',  'auth', '',               'Login berhasil',                    '192.168.1.50', NOW() - INTERVAL '3 days'),
  ('seed_admin_001',  'UPDATE', 'author_request', 'seed_areq_002', 'Menolak permintaan author','192.168.1.1', NOW() - INTERVAL '1 day');

-- ╔══════════════════════════════════════════════════════════╗
-- ║                   17. INVITES                            ║
-- ╚══════════════════════════════════════════════════════════╝
INSERT INTO invites (id, email, token_hash, role_id, invited_by, message, expires_at, created_at) VALUES
  (gen_random_uuid(), 'neweditor@example.com', encode(gen_random_bytes(32), 'hex'), 'role_editor',
   'seed_admin_001', 'Kami mengundang Anda menjadi editor di NetPulse!',
   NOW() + INTERVAL '7 days', NOW() - INTERVAL '1 day'),
  (gen_random_uuid(), 'newauthor@example.com', encode(gen_random_bytes(32), 'hex'), 'role_author',
   'seed_admin_001', 'Bergabunglah sebagai penulis di NetPulse.',
   NOW() + INTERVAL '7 days', NOW());

EOSQL

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  ✅ Seed complete! Berikut akun yang tersedia:"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "  👑 OWNER (Super Admin)"
echo "     Email:    admin@rapidwire.local"
echo "     Password: admin123456"
echo ""
echo "  ✏️  EDITOR"
echo "     Email:    editor@rapidwire.local"
echo "     Password: admin123456"
echo ""
echo "  ✍️  AUTHOR #1"
echo "     Email:    author@rapidwire.local"
echo "     Password: author123456"
echo ""
echo "  ✍️  AUTHOR #2"
echo "     Email:    writer@rapidwire.local"
echo "     Password: author123456"
echo ""
echo "  👤 VIEWER #1 (verified)"
echo "     Email:    user@rapidwire.local"
echo "     Password: user123456"
echo ""
echo "  👤 VIEWER #2 (unverified)"
echo "     Email:    newuser@rapidwire.local"
echo "     Password: user123456"
echo ""
echo "  📝 Data yang di-seed:"
echo "     • 6 users (OWNER, EDITOR, 2 AUTHORS, 2 VIEWERS)"
echo "     • 10 posts (6 published, 1 draft, 1 in-review,"
echo "       1 scheduled, 1 archived)"
echo "     • 3 series dengan post linkage"
echo "     • 10 comments (threaded, guest, spam)"
echo "     • 16 likes (user + guest)"
echo "     • 7 bookmarks/saves"
echo "     • 34 post views (analytics)"
echo "     • 4 post revisions"
echo "     • 3 referral events"
echo "     • 2 affiliate profiles + 2 commissions"
echo "     • 2 author requests (pending + rejected)"
echo "     • 12 audit log entries"
echo "     • 2 invites (pending)"
echo "═══════════════════════════════════════════════════════════"
