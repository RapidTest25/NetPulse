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

echo "Seeding database..."

# Argon2id hashes (generated with same params as the app)
ADMIN_HASH='$argon2id$v=19$m=65536,t=3,p=4$GPDUQ0oSNgbv5K5Dr630JQ$flNk498Xni5t0c1W4vQ3Zymq4i+Obnv1BCqP1S0Khow'
USER_HASH='$argon2id$v=19$m=65536,t=3,p=4$MLFu0jRlqg61QUUkDW+7Yg$SnPIW/FxrfSdn2JbBxTV8V4QyMAeA8seIyrImFV/tcw'
AUTHOR_HASH='$argon2id$v=19$m=65536,t=3,p=4$Uogzt9QJDO1mdoZ4rlzpWQ$2dzx0dz0NI9KXFRrf5MMNTvJd2UokX7UbmmOGsa0zaM'

psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" <<EOF

-- Clean up old seed data first (safe — uses ON CONFLICT below)
DELETE FROM user_roles WHERE user_id IN (SELECT id FROM users WHERE email IN ('admin@rapidwire.local','user@rapidwire.local','author@rapidwire.local'));
DELETE FROM posts WHERE id IN ('seed_post_001','seed_post_002','seed_post_003','post001');
DELETE FROM users WHERE email IN ('admin@rapidwire.local','user@rapidwire.local','author@rapidwire.local');

-- ══════════════════════════════════════════════════════
-- 1. ADMIN / OWNER account
-- ══════════════════════════════════════════════════════
INSERT INTO users (id, email, name, password_hash, avatar, is_active)
VALUES (
  'seed_admin_001',
  'admin@rapidwire.local',
  'Admin RapidWire',
  '${ADMIN_HASH}',
  '',
  true
);

-- Assign OWNER role
INSERT INTO user_roles (user_id, role_id)
VALUES ('seed_admin_001', 'role_owner')
ON CONFLICT DO NOTHING;

-- ══════════════════════════════════════════════════════
-- 2. Regular USER (VIEWER) account
-- ══════════════════════════════════════════════════════
INSERT INTO users (id, email, name, password_hash, avatar, is_active)
VALUES (
  'seed_user_001',
  'user@rapidwire.local',
  'User Biasa',
  '${USER_HASH}',
  '',
  true
);

-- Assign VIEWER role
INSERT INTO user_roles (user_id, role_id)
VALUES ('seed_user_001', 'role_viewer')
ON CONFLICT DO NOTHING;

-- ══════════════════════════════════════════════════════
-- 3. AUTHOR account
-- ══════════════════════════════════════════════════════
INSERT INTO users (id, email, name, password_hash, avatar, is_active)
VALUES (
  'seed_author_001',
  'author@rapidwire.local',
  'Penulis Artikel',
  '${AUTHOR_HASH}',
  '',
  true
);

-- Assign AUTHOR role
INSERT INTO user_roles (user_id, role_id)
VALUES ('seed_author_001', 'role_author')
ON CONFLICT DO NOTHING;

-- ══════════════════════════════════════════════════════
-- 4. Sample published posts (by author)
-- ══════════════════════════════════════════════════════
INSERT INTO posts (id, title, slug, excerpt, body, status, author_id, category_id, published_at)
VALUES (
  'seed_post_001',
  'Mengenal DNS: Cara Kerja Domain Name System',
  'mengenal-dns-cara-kerja-domain-name-system',
  'DNS adalah sistem yang menerjemahkan nama domain menjadi alamat IP. Pelajari cara kerjanya di artikel ini.',
  '<h2>Apa itu DNS?</h2><p>DNS (Domain Name System) adalah salah satu komponen paling fundamental dalam infrastruktur internet. Tanpa DNS, kita harus mengingat alamat IP setiap website yang ingin kita kunjungi.</p><h2>Cara Kerja DNS</h2><p>Ketika Anda mengetikkan sebuah URL di browser, terjadi serangkaian proses yang disebut DNS resolution. Browser akan bertanya ke DNS resolver, yang kemudian akan mencari jawaban melalui hierarki DNS server.</p><h3>1. DNS Resolver</h3><p>DNS resolver (biasanya dari ISP Anda) menerima query pertama dan mulai proses pencarian.</p><h3>2. Root Server</h3><p>Jika resolver tidak memiliki cache, ia akan bertanya ke root server untuk mendapatkan referensi ke TLD server.</p><h3>3. TLD Server</h3><p>TLD (Top-Level Domain) server mengarahkan ke authoritative nameserver untuk domain tersebut.</p><h3>4. Authoritative Nameserver</h3><p>Server ini memberikan jawaban final berupa alamat IP yang diminta.</p>',
  'PUBLISHED',
  'seed_author_001',
  (SELECT id FROM categories WHERE slug = 'networking' LIMIT 1),
  NOW() - INTERVAL '3 days'
);

DELETE FROM posts WHERE slug = 'mengenal-dns-cara-kerja-domain-name-system' AND id != 'seed_post_001';

INSERT INTO posts (id, title, slug, excerpt, body, status, author_id, category_id, published_at)
VALUES (
  'seed_post_002',
  'Panduan Lengkap Firewall: Melindungi Jaringan Anda',
  'panduan-lengkap-firewall-melindungi-jaringan',
  'Firewall adalah garis pertahanan pertama keamanan jaringan. Artikel ini membahas jenis-jenis firewall dan cara konfigurasinya.',
  '<h2>Apa itu Firewall?</h2><p>Firewall adalah sistem keamanan jaringan yang memantau dan mengontrol lalu lintas jaringan masuk dan keluar berdasarkan aturan keamanan yang telah ditentukan.</p><h2>Jenis-jenis Firewall</h2><h3>1. Packet Filtering</h3><p>Memeriksa setiap paket data yang melewati jaringan dan menerima atau menolaknya berdasarkan aturan yang telah ditetapkan.</p><h3>2. Stateful Inspection</h3><p>Memantau status koneksi aktif dan membuat keputusan berdasarkan konteks lalu lintas.</p><h3>3. Application Layer Gateway</h3><p>Beroperasi di layer aplikasi dan mampu memeriksa konten paket data secara mendalam.</p><h3>4. Next-Gen Firewall (NGFW)</h3><p>Menggabungkan fitur firewall tradisional dengan fungsi keamanan tambahan seperti IPS, deep packet inspection, dan threat intelligence.</p>',
  'PUBLISHED',
  'seed_author_001',
  (SELECT id FROM categories WHERE slug = 'security' LIMIT 1),
  NOW() - INTERVAL '1 day'
);

INSERT INTO posts (id, title, slug, excerpt, body, status, author_id, category_id, published_at)
VALUES (
  'seed_post_003',
  'Docker untuk Pemula: Kontainerisasi Aplikasi',
  'docker-untuk-pemula-kontainerisasi-aplikasi',
  'Pelajari dasar-dasar Docker dan bagaimana kontainerisasi dapat mempermudah deployment aplikasi Anda.',
  '<h2>Mengapa Docker?</h2><p>Docker memungkinkan Anda mengemas aplikasi beserta semua dependensinya ke dalam sebuah kontainer yang portable dan konsisten di berbagai environment.</p><h2>Konsep Dasar</h2><h3>Image</h3><p>Docker image adalah template read-only yang berisi instruksi untuk membuat kontainer. Image dibangun dari Dockerfile.</p><h3>Container</h3><p>Container adalah instance yang berjalan dari sebuah image. Anda bisa membuat, memulai, menghentikan, dan menghapus container.</p><h3>Dockerfile</h3><p>File teks yang berisi instruksi untuk membangun Docker image. Setiap instruksi membuat layer baru dalam image.</p><h2>Perintah Dasar</h2><p><code>docker build -t myapp .</code> untuk membuat image<br/><code>docker run -p 3000:3000 myapp</code> untuk menjalankan container<br/><code>docker ps</code> untuk melihat container yang berjalan</p>',
  'PUBLISHED',
  'seed_author_001',
  (SELECT id FROM categories WHERE slug = 'devops' LIMIT 1),
  NOW()
);

-- Tag the posts
INSERT INTO post_tags (post_id, tag_id)
SELECT 'seed_post_001', id FROM tags WHERE slug = 'dns'
ON CONFLICT DO NOTHING;

INSERT INTO post_tags (post_id, tag_id)
SELECT 'seed_post_001', id FROM tags WHERE slug = 'tcp-ip'
ON CONFLICT DO NOTHING;

INSERT INTO post_tags (post_id, tag_id)
SELECT 'seed_post_002', id FROM tags WHERE slug = 'firewall'
ON CONFLICT DO NOTHING;

INSERT INTO post_tags (post_id, tag_id)
SELECT 'seed_post_002', id FROM tags WHERE slug = 'vpn'
ON CONFLICT DO NOTHING;

INSERT INTO post_tags (post_id, tag_id)
SELECT 'seed_post_003', id FROM tags WHERE slug = 'docker'
ON CONFLICT DO NOTHING;

INSERT INTO post_tags (post_id, tag_id)
SELECT 'seed_post_003', id FROM tags WHERE slug = 'kubernetes'
ON CONFLICT DO NOTHING;

-- ══════════════════════════════════════════════════════
-- 5. Post stats for seeded posts
-- ══════════════════════════════════════════════════════
INSERT INTO post_stats (post_id, views_count, likes_count, comments_count, saves_count)
VALUES
  ('seed_post_001', 0, 0, 0, 0),
  ('seed_post_002', 0, 0, 0, 0),
  ('seed_post_003', 0, 0, 0, 0)
ON CONFLICT (post_id) DO UPDATE SET
  views_count = EXCLUDED.views_count,
  likes_count = EXCLUDED.likes_count,
  comments_count = EXCLUDED.comments_count,
  saves_count = EXCLUDED.saves_count;

EOF

echo ""
echo "═══════════════════════════════════════════════════"
echo "  Seed complete! Berikut akun yang tersedia:"
echo "═══════════════════════════════════════════════════"
echo ""
echo "  👑 ADMIN (Owner)"
echo "     Email:    admin@rapidwire.local"
echo "     Password: admin123456"
echo ""
echo "  👤 USER BIASA (Viewer)"
echo "     Email:    user@rapidwire.local"
echo "     Password: user123456"
echo ""
echo "  ✍️  AUTHOR (Penulis)"
echo "     Email:    author@rapidwire.local"
echo "     Password: author123456"
echo ""
echo "  📝 3 artikel contoh sudah dipublish"
echo "═══════════════════════════════════════════════════"
