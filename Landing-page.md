# NetPulse — Search di Landing Page (Brainstorming + Rancangan)

## 1) UX yang kita mau

Landing page punya:

- Search bar besar (placeholder: "Cari artikel tentang DNS, BGP, HTTP/3...")
- Saat mengetik (>= 2-3 char): dropdown suggestion (judul + tag + kategori)
- Tekan Enter / klik tombol: pindah ke halaman hasil: `/search?q=...`
- Hasil search: list artikel + filter (kategori/tag) + sorting (terbaru/terpopuler)

---

## 2) Strategi Search (Phase 1 vs Phase 2)

### Phase 1 (paling cepat jadi, cukup kuat)

**Postgres Full-Text Search (FTS)**

- Index di DB
- Query cepat untuk skala blog normal
- Mudah implementasi, tidak butuh engine tambahan

Kelebihan:

- Simple, maintain mudah
- Cocok untuk MVP

Kekurangan:

- Relevansi tidak se-flexible search engine khusus
- Autocomplete tetap bisa, tapi basic

### Phase 2 (kalau traffic & konten makin besar)

**Meilisearch / Typesense / Elasticsearch**

- Autocomplete & ranking lebih bagus
- Filter & typo-tolerant lebih enak

Rekomendasi:

- Meilisearch (mudah dan cepat setup)
- Typesense juga bagus

---

## 3) Data yang bisa dicari

Minimal:

- title
- excerpt/summary
- body (teks artikel)
- tags
- category

Opsional:

- author name
- series

---

## 4) Endpoint API yang dibutuhkan (Go)

Public:

- `GET /search?q=...&page=1&limit=10&sort=relevance|newest`
- `GET /search/suggest?q=...&limit=5`

Response minimal:

- `items: [{ id, title, slug, excerpt, published_at, cover_url, category, tags[] }]`
- `meta: { page, limit, total, total_pages }`

Cache:

- Redis key contoh:
  - `search:q:{hash}:p:{page}:s:{sort}`
  - `suggest:q:{hash}`

Invalidation:

- Saat publish/unpublish post → purge cache keys terkait (atau TTL pendek: 30-120 detik)

---

## 5) Implementasi Phase 1 (Postgres FTS) — desain DB

Tambahkan kolom:

- `posts.search_vector` (tsvector)

Index:

- `GIN (search_vector)`

Update vector:

- Saat create/update/publish post, update:
  - gabungan `title + excerpt + body + tags + category`

Query:

- Gunakan `websearch_to_tsquery` (lebih user-friendly)
- Order by `ts_rank_cd(search_vector, query)` untuk relevance

---

## 6) Komponen Frontend (Next.js)

### Landing

- Component: `SearchBar`
  - debounce 250-400ms untuk suggest
  - dropdown hasil suggest
  - Enter → route `/search?q=...`

### Search results page

- Route: `app/(public)/search/page.tsx`
- SSR atau ISR:
  - SSR bagus biar query langsung tampil
  - Caching via CDN optional

Filter UI:

- category dropdown
- tag chips
- sort: relevance / newest

---

## 7) Keamanan & Anti-abuse untuk search

- Rate limit `GET /search` & `/search/suggest` (mis. 30 req/menit/IP)
- Cloudflare WAF: block bot obvious
- Redis cache untuk query populer
- Input validation:
  - panjang `q` max 80-120 char
  - reject karakter aneh berlebihan
- Logging:
  - simpan query terpopuler (anonymized) untuk insight konten

---

## 8) SEO untuk halaman search

Halaman `/search?q=...` biasanya:

- NOINDEX (biar gak jadi thin content index spam)
- Tapi tetap bisa dishare user

Implement:

- `<meta name="robots" content="noindex,follow" />` untuk search results

---

## 9) Checklist implementasi cepat

1. Buat endpoint `/search` + `/search/suggest`
2. Tambah `search_vector` + GIN index + trigger/update logic
3. Implement SearchBar landing + results page
4. Rate limit + TTL cache Redis
5. noindex untuk `/search`

---

## 10) Output akhir yang diharapkan

Landing page:

- Search cepat & responsif
- Suggestion bikin user betah
- Search page rapi + filter
- API aman dari spam + tetap cepat
