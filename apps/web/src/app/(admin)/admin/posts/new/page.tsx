"use client";

import { useState, useRef, useEffect } from "react";
import MarkdownEditor from "@/components/editor/MarkdownEditor";
import { adminAPI } from "@/lib/auth-api";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export default function NewPostPage() {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [body, setBody] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [tags, setTags] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState<any[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [focusMode, setFocusMode] = useState(false);
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [coverUploading, setCoverUploading] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  // Article templates
  const templates = [
    {
      name: "Blog Post",
      icon: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z",
      desc: "Artikel blog standar dengan intro dan kesimpulan",
      body: `## Pendahuluan

Berikan konteks tentang topik yang akan dibahas. Jelaskan mengapa topik ini penting bagi pembaca.

## Poin Utama

Jelaskan poin utama Anda di sini. Gunakan contoh, data, atau pengalaman untuk mendukung argumen.

### Sub-poin 1

Detail lebih lanjut...

### Sub-poin 2

Detail lebih lanjut...

## Contoh / Studi Kasus

Berikan contoh nyata atau studi kasus yang relevan.

## Kesimpulan

Rangkum poin-poin penting dan berikan call-to-action kepada pembaca.

---

*Apa pendapat Anda? Bagikan di kolom komentar di bawah!*`,
    },
    {
      name: "Tutorial / How-To",
      icon: "M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5",
      desc: "Panduan langkah demi langkah yang terstruktur",
      body: `## Apa yang Akan Anda Pelajari

Dalam tutorial ini, Anda akan belajar cara [tujuan tutorial]. Di akhir artikel, Anda akan mampu [hasil yang diharapkan].

## Prasyarat

- Prasyarat 1
- Prasyarat 2
- Tools yang dibutuhkan

## Langkah 1: [Judul Langkah]

Jelaskan langkah pertama secara detail.

\`\`\`
// Contoh kode atau perintah
\`\`\`

## Langkah 2: [Judul Langkah]

Jelaskan langkah kedua.

> **Tips:** Berikan tips berguna di sini.

## Langkah 3: [Judul Langkah]

Jelaskan langkah ketiga.

## Hasil Akhir

Tunjukkan hasil akhir yang diharapkan.

## Troubleshooting

| Masalah | Solusi |
|---------|--------|
| Error X | Lakukan Y |
| Error Z | Periksa A |

## Langkah Selanjutnya

- Resource tambahan 1
- Resource tambahan 2
- Artikel terkait`,
    },
    {
      name: "Listicle",
      icon: "M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z",
      desc: "Artikel daftar seperti '10 Tips Terbaik...'",
      body: `## Intro

Penjelasan singkat tentang mengapa daftar ini penting dan relevan.

---

### 1. [Item Pertama]

Jelaskan item pertama. Mengapa ini penting?

### 2. [Item Kedua]

Jelaskan item kedua dengan detail.

### 3. [Item Ketiga]

Jelaskan item ketiga.

### 4. [Item Keempat]

Jelaskan item keempat.

### 5. [Item Kelima]

Jelaskan item kelima.

---

## Bonus Tips

Berikan tips tambahan yang bermanfaat.

## Penutup

Rangkum poin-poin utama dan ajak pembaca berinteraksi.`,
    },
    {
      name: "Review Produk",
      icon: "M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z",
      desc: "Ulasan produk atau layanan dengan rating",
      body: `## Ringkasan

| Aspek | Rating |
|-------|--------|
| Desain | ⭐⭐⭐⭐⭐ |
| Performa | ⭐⭐⭐⭐ |
| Harga | ⭐⭐⭐ |
| **Overall** | **⭐⭐⭐⭐** |

## Apa Itu [Nama Produk]?

Penjelasan singkat tentang produk/layanan yang direview.

## Spesifikasi

- Spek 1
- Spek 2
- Spek 3

## Kelebihan 👍

- Kelebihan 1
- Kelebihan 2
- Kelebihan 3

## Kekurangan 👎

- Kekurangan 1
- Kekurangan 2

## Pengalaman Penggunaan

Ceritakan pengalaman Anda menggunakan produk ini secara detail.

## Perbandingan dengan Kompetitor

| Fitur | [Produk Ini] | Kompetitor A | Kompetitor B |
|-------|-------------|-------------|-------------|
| Harga | Rp X | Rp Y | Rp Z |
| Fitur 1 | ✅ | ❌ | ✅ |
| Fitur 2 | ✅ | ✅ | ❌ |

## Verdict

Apakah produk ini layak dibeli? Untuk siapa produk ini cocok?`,
    },
    {
      name: "Berita / News",
      icon: "M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z",
      desc: "Format berita dengan 5W1H",
      body: `## [Headline Berita]

**[Kota, Tanggal]** — Paragraf pembuka yang menjawab pertanyaan utama: Apa yang terjadi? (What)

## Kronologi Kejadian

Jelaskan urutan kejadian secara kronologis. Kapan ini terjadi? (When) Di mana? (Where)

## Siapa yang Terlibat

Jelaskan pihak-pihak yang terlibat. (Who)

## Mengapa Ini Penting

Jelaskan mengapa berita ini penting dan apa dampaknya. (Why)

## Bagaimana Ini Terjadi

Detail proses atau mekanisme kejadian. (How)

## Dampak dan Reaksi

Jelaskan dampak dari kejadian ini dan reaksi dari berbagai pihak.

> "Kutipan dari narasumber relevan." — Nama, Jabatan

## Apa Selanjutnya

Jelaskan perkembangan yang diharapkan atau langkah selanjutnya.

---

*Sumber: [Referensi]*`,
    },
  ];

  const applyTemplate = (tpl: typeof templates[0]) => {
    if (body.trim() && !confirm("Template akan mengganti konten yang ada. Lanjutkan?")) return;
    setBody(tpl.body);
    setShowTemplates(false);
  };

  // Fetch categories
  useState(() => {
    fetch(`${API}/categories`)
      .then((r) => r.json())
      .then((data) => setCategories(data || []))
      .catch(() => {});
  });

  // Auto-resize title
  useEffect(() => {
    if (titleRef.current) {
      titleRef.current.style.height = "auto";
      titleRef.current.style.height = titleRef.current.scrollHeight + "px";
    }
  }, [title]);

  // Auto-generate slug
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!slug || slug === generateSlug(title)) {
      setSlug(generateSlug(val));
    }
  };

  function generateSlug(text: string) {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  }

  const handleSave = async (publishStatus: "draft" | "published") => {
    if (!title.trim()) {
      setError("Judul artikel wajib diisi.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = {
        title: title.trim(),
        slug: slug.trim() || generateSlug(title),
        excerpt: excerpt.trim(),
        body: body.trim(),
        category_id: categoryId || undefined,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        cover_url: coverUrl.trim() || undefined,
        status: publishStatus,
      };
      await adminAPI.createPost(payload);
      setSaved(true);
      setStatus(publishStatus);
      setTimeout(() => {
        window.location.href = "/admin/posts";
      }, 1200);
    } catch (err: any) {
      setError(err.message || "Gagal menyimpan artikel.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200/60 bg-white px-3 py-2 sm:px-5 sm:py-2.5">
        <div className="flex items-center gap-3">
          <a
            href="/admin/posts"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <svg
              className="h-4.5 w-4.5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
              />
            </svg>
          </a>
          <div className="h-5 w-px bg-gray-200" />
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-50">
              <svg
                className="h-3.5 w-3.5 text-indigo-600"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-700">
              Artikel Baru
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Status indicators */}
          {error && (
            <div className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600">
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                />
              </svg>
              {error}
            </div>
          )}
          {saved && (
            <div className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-600">
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Tersimpan!
            </div>
          )}

          {/* Template selector */}
          <div className="relative">
            <button
              onClick={() => setShowTemplates(!showTemplates)}
              className={`flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-colors ${
                showTemplates
                  ? "border-indigo-200 bg-indigo-50 text-indigo-600"
                  : "border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700"
              }`}
              title="Pilih template artikel"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v7.5M12 18.75l-2.25-2.25M12 18.75l2.25-2.25M10.5 2.25h-4.875c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
              <span className="hidden sm:inline">Template</span>
            </button>
            {showTemplates && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowTemplates(false)} />
                <div className="absolute right-0 top-full z-40 mt-2 w-72 rounded-xl border border-gray-200 bg-white p-2 shadow-xl">
                  <p className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Pilih Template</p>
                  {templates.map((tpl) => (
                    <button
                      key={tpl.name}
                      onClick={() => applyTemplate(tpl)}
                      className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-indigo-50"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d={tpl.icon} /></svg>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900">{tpl.name}</p>
                        <p className="text-[11px] text-gray-400">{tpl.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Focus mode toggle */}
          <button
            onClick={() => {
              setFocusMode(!focusMode);
              if (!focusMode) setSidebarOpen(false);
              else setSidebarOpen(true);
            }}
            className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${
              focusMode
                ? "border-indigo-200 bg-indigo-50 text-indigo-600"
                : "border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
            }`}
            title="Focus mode"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"
              />
            </svg>
          </button>

          {/* Save buttons */}
          <button
            onClick={() => handleSave("draft")}
            disabled={saving}
            className="rounded-lg border border-gray-200 px-3.5 py-1.5 text-[13px] font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            {saving && status === "draft" ? (
              <span className="flex items-center gap-1.5">
                <svg
                  className="h-3.5 w-3.5 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="3"
                    className="opacity-25"
                  />
                  <path
                    d="M4 12a8 8 0 018-8"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
                Menyimpan…
              </span>
            ) : (
              "Simpan Draft"
            )}
          </button>
          <button
            onClick={() => handleSave("published")}
            disabled={saving}
            className="rounded-lg bg-linear-to-r from-indigo-600 to-violet-600 px-3.5 py-1.5 text-[13px] font-semibold text-white shadow-sm shadow-indigo-500/25 transition-all hover:shadow-md hover:shadow-indigo-500/30 hover:brightness-110 disabled:opacity-50"
          >
            {saving && status === "published" ? (
              <span className="flex items-center gap-1.5">
                <svg
                  className="h-3.5 w-3.5 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="3"
                    className="opacity-25"
                  />
                  <path
                    d="M4 12a8 8 0 018-8"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
                Publishing…
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                  />
                </svg>
                Publish
              </span>
            )}
          </button>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${
              sidebarOpen
                ? "border-indigo-200 bg-indigo-50 text-indigo-600"
                : "border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
            }`}
            title="Toggle sidebar"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6.75h16.5M3.75 12h16.5M12 17.25h8.25"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Main Editor */}
        <div className="flex-1 overflow-y-auto bg-white">
          <div
            className={`mx-auto px-4 py-6 sm:px-8 sm:py-10 ${focusMode ? "max-w-2xl" : "max-w-3xl"}`}
          >
            {/* Title */}
            <textarea
              ref={titleRef}
              placeholder="Judul Artikel"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              rows={1}
              className="w-full resize-none overflow-hidden border-none bg-transparent text-xl font-extrabold leading-tight tracking-tight text-gray-900 outline-none placeholder:text-gray-200 sm:text-[32px]"
            />

            {/* Slug preview */}
            {slug && (
              <div className="mt-2 flex items-center gap-1.5">
                <svg
                  className="h-3 w-3 text-gray-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"
                  />
                </svg>
                <span className="text-xs text-gray-400">
                  netpulse.id/posts/
                  <span className="font-medium text-indigo-400">{slug}</span>
                </span>
              </div>
            )}

            {/* Excerpt */}
            <textarea
              placeholder="Tulis ringkasan artikel yang menarik untuk pembaca..."
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={2}
              className="mt-6 w-full resize-none border-none bg-transparent text-[15px] leading-relaxed text-gray-500 outline-none placeholder:text-gray-200"
            />

            {/* Divider line */}
            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-linear-to-r from-gray-200 to-transparent" />
            </div>

            {/* Markdown Editor with split view */}
            <MarkdownEditor
              value={body}
              onChange={setBody}
              placeholder="Mulai menulis artikel...

Gunakan Markdown untuk format teks:
• **bold** untuk teks tebal
• *italic* untuk teks miring
• ## Heading untuk judul bagian
• - item untuk daftar
• > teks untuk kutipan
• ```kode``` untuk blok kode
• [teks](url) untuk link"
              minHeight={400}
            />
          </div>
        </div>

        {/* Sidebar overlay backdrop (mobile) */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        {sidebarOpen && (
          <div className="fixed inset-y-0 right-0 z-40 w-[85vw] max-w-[320px] overflow-y-auto border-l border-gray-200/60 bg-[#fafbfc] shadow-xl md:static md:z-auto md:w-[320px] md:max-w-none md:shadow-none">
            <div className="space-y-5 p-5">
              {/* Publish settings header */}
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Pengaturan
                </h3>
              </div>

              {/* Status */}
              <div className="rounded-xl border border-gray-200/80 bg-white p-4 shadow-sm">
                <label className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-gray-700">
                  <svg
                    className="h-4 w-4 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.764m3.42 3.42a6.776 6.776 0 00-3.42-3.42"
                    />
                  </svg>
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) =>
                    setStatus(e.target.value as "draft" | "published")
                  }
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="draft">📝 Draft</option>
                  <option value="published">🚀 Published</option>
                </select>
              </div>

              {/* Category */}
              <div className="rounded-xl border border-gray-200/80 bg-white p-4 shadow-sm">
                <label className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-gray-700">
                  <svg
                    className="h-4 w-4 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"
                    />
                  </svg>
                  Kategori
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="">— Pilih kategori —</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tags */}
              <div className="rounded-xl border border-gray-200/80 bg-white p-4 shadow-sm">
                <label className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-gray-700">
                  <svg
                    className="h-4 w-4 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 6h.008v.008H6V6z"
                    />
                  </svg>
                  Tags
                </label>
                <input
                  type="text"
                  placeholder="dns, networking, tutorial"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                />
                <p className="mt-1.5 text-[11px] text-gray-400">
                  Pisahkan dengan koma
                </p>
                {tags && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {tags
                      .split(",")
                      .map((t) => t.trim())
                      .filter(Boolean)
                      .map((tag, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-600"
                        >
                          #{tag}
                        </span>
                      ))}
                  </div>
                )}
              </div>

              {/* Slug */}
              <div className="rounded-xl border border-gray-200/80 bg-white p-4 shadow-sm">
                <label className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-gray-700">
                  <svg
                    className="h-4 w-4 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"
                    />
                  </svg>
                  Slug / URL
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 font-mono text-sm outline-none transition-colors focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              {/* Cover Image */}
              <div className="rounded-xl border border-gray-200/80 bg-white p-4 shadow-sm">
                <label className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-gray-700">
                  <svg
                    className="h-4 w-4 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M2.25 18V6a2.25 2.25 0 012.25-2.25h15A2.25 2.25 0 0121.75 6v12A2.25 2.25 0 0119.5 20.25h-15A2.25 2.25 0 012.25 18z"
                    />
                  </svg>
                  Cover Image
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    value={coverUrl}
                    onChange={(e) => setCoverUrl(e.target.value)}
                    className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                  />
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setCoverUploading(true);
                      try {
                        const data = await adminAPI.uploadMedia(file);
                        if (data.url) setCoverUrl(data.url);
                      } catch (err: any) {
                        setError(err.message || "Gagal upload cover image");
                      } finally {
                        setCoverUploading(false);
                        if (coverInputRef.current) coverInputRef.current.value = "";
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => coverInputRef.current?.click()}
                    disabled={coverUploading}
                    className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50"
                  >
                    {coverUploading ? (
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" /><path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>
                    ) : (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
                    )}
                    Upload
                  </button>
                </div>
                {coverUrl ? (
                  <div className="mt-2 overflow-hidden rounded-lg border border-gray-200">
                    <img
                      src={coverUrl}
                      alt="Cover preview"
                      className="aspect-video w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                ) : (
                  <div
                    onClick={() => coverInputRef.current?.click()}
                    className="mt-2 flex aspect-video cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50/50 transition-colors hover:border-indigo-300 hover:bg-indigo-50/30"
                  >
                    <div className="text-center">
                      <svg
                        className="mx-auto h-8 w-8 text-gray-300"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                        />
                      </svg>
                      <p className="mt-1 text-[10px] text-gray-400">
                        Klik untuk upload atau masukkan URL di atas
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* SEO Preview */}
              <div className="rounded-xl border border-gray-200/80 bg-white p-4 shadow-sm">
                <label className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-gray-700">
                  <svg
                    className="h-4 w-4 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                    />
                  </svg>
                  SEO Preview
                </label>
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="truncate text-sm font-medium text-blue-700">
                    {title || "Judul Artikel"}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-emerald-700">
                    netpulse.id/posts/{slug || "slug-artikel"}
                  </p>
                  <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-gray-500">
                    {excerpt ||
                      "Deskripsi singkat artikel akan muncul di sini pada hasil pencarian..."}
                  </p>
                </div>
              </div>

              {/* Keyboard shortcuts */}
              <div className="rounded-xl border border-gray-200/80 bg-white p-4 shadow-sm">
                <label className="mb-3 flex items-center gap-2 text-[13px] font-semibold text-gray-700">
                  <svg
                    className="h-4 w-4 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z"
                    />
                  </svg>
                  Keyboard Shortcuts
                </label>
                <div className="space-y-1.5">
                  {[
                    { keys: "⌘ B", label: "Bold" },
                    { keys: "⌘ I", label: "Italic" },
                    { keys: "⌘ K", label: "Link" },
                    { keys: "⌘ S", label: "Save Draft" },
                  ].map((s) => (
                    <div
                      key={s.keys}
                      className="flex items-center justify-between text-[11px] text-gray-500"
                    >
                      <span>{s.label}</span>
                      <kbd className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[10px] text-gray-400">
                        {s.keys}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
