"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { userAPI, adminAPI } from "@/lib/auth-api";
import { apiClient } from "@/lib/api-client";
import MarkdownEditor from "@/components/editor/MarkdownEditor";

export default function NewPostPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDesc, setMetaDesc] = useState("");
  const [categories, setCategories] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [coverUploading, setCoverUploading] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  const articleTemplates = [
    { name: "Blog Post", desc: "Artikel standar", body: "## Pendahuluan\n\nBerikan konteks tentang topik.\n\n## Poin Utama\n\nJelaskan poin utama Anda.\n\n### Sub-poin 1\n\nDetail...\n\n### Sub-poin 2\n\nDetail...\n\n## Kesimpulan\n\nRangkum poin-poin penting." },
    { name: "Tutorial", desc: "Panduan langkah demi langkah", body: "## Apa yang Akan Anda Pelajari\n\nDalam tutorial ini...\n\n## Prasyarat\n\n- Prasyarat 1\n- Prasyarat 2\n\n## Langkah 1: [Judul]\n\nJelaskan langkah pertama.\n\n```\n// Contoh kode\n```\n\n## Langkah 2: [Judul]\n\nJelaskan langkah kedua.\n\n## Hasil Akhir\n\nTunjukkan hasil." },
    { name: "Listicle", desc: "Artikel daftar", body: "## Intro\n\nPenjelasan singkat.\n\n---\n\n### 1. [Item Pertama]\n\nJelaskan item.\n\n### 2. [Item Kedua]\n\nJelaskan item.\n\n### 3. [Item Ketiga]\n\nJelaskan item.\n\n---\n\n## Penutup\n\nRangkum poin-poin utama." },
    { name: "Review", desc: "Ulasan produk/layanan", body: "## Ringkasan\n\n| Aspek | Rating |\n|-------|--------|\n| Desain | ⭐⭐⭐⭐⭐ |\n| Performa | ⭐⭐⭐⭐ |\n\n## Kelebihan 👍\n\n- Kelebihan 1\n- Kelebihan 2\n\n## Kekurangan 👎\n\n- Kekurangan 1\n\n## Verdict\n\nApakah layak?" },
  ];

  const applyTemplate = (tpl: typeof articleTemplates[0]) => {
    if (body.trim() && !confirm("Template akan mengganti konten yang ada. Lanjutkan?")) return;
    setBody(tpl.body);
    setShowTemplates(false);
  };

  useEffect(() => {
    async function loadMeta() {
      const [cats, tgs] = await Promise.all([
        apiClient.getCategories(),
        apiClient.getTags(),
      ]);
      setCategories(cats || []);
      setTags(tgs || []);
    }
    loadMeta();
  }, []);

  const handleSaveDraft = async () => {
    if (!title.trim()) {
      setError("Judul wajib diisi");
      return;
    }
    if (!body.trim()) {
      setError("Konten wajib diisi");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await userAPI.createPost({
        title,
        body,
        excerpt,
        cover_url: coverUrl,
        category_id: categoryId || undefined,
        tag_ids: tagIds.length > 0 ? tagIds : undefined,
        meta_title: metaTitle || undefined,
        meta_description: metaDesc || undefined,
      });
      router.push("/me/posts");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndSubmit = async () => {
    if (!title.trim() || !body.trim()) {
      setError("Judul dan konten wajib diisi");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const post = await userAPI.createPost({
        title,
        body,
        excerpt,
        cover_url: coverUrl,
        category_id: categoryId || undefined,
        tag_ids: tagIds.length > 0 ? tagIds : undefined,
        meta_title: metaTitle || undefined,
        meta_description: metaDesc || undefined,
      });
      await userAPI.submitPostForReview(post.id);
      router.push("/me/posts");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleTag = (id: string) => {
    setTagIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    );
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 sm:px-6 lg:px-0">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Tulis Artikel Baru</h2>
        <a
          href="/me/posts"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Kembali
        </a>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-5 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
        {/* Title */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Judul
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Masukkan judul artikel..."
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 focus:outline-none"
          />
        </div>

        {/* Excerpt */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Ringkasan <span className="text-gray-400">(opsional)</span>
          </label>
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            rows={2}
            placeholder="Ringkasan singkat artikel..."
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 focus:outline-none"
          />
        </div>

        {/* Body */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">
              Konten
            </label>
            <div className="relative">
              <button onClick={() => setShowTemplates(!showTemplates)} className="flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-500 hover:bg-gray-50">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v7.5M12 18.75l-2.25-2.25M12 18.75l2.25-2.25M10.5 2.25h-4.875c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                Template
              </button>
              {showTemplates && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setShowTemplates(false)} />
                  <div className="absolute right-0 top-full z-40 mt-1 w-56 rounded-xl border border-gray-200 bg-white p-1.5 shadow-xl">
                    {articleTemplates.map((tpl) => (
                      <button key={tpl.name} onClick={() => applyTemplate(tpl)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left hover:bg-indigo-50">
                        <div><p className="text-sm font-medium text-gray-900">{tpl.name}</p><p className="text-[11px] text-gray-400">{tpl.desc}</p></div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
          <MarkdownEditor
            value={body}
            onChange={setBody}
            placeholder="Tulis konten artikel Anda di sini... (Markdown didukung)"
            minHeight={320}
          />
        </div>

        {/* Cover URL */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Cover Image <span className="text-gray-400">(opsional)</span>
          </label>
          <div className="flex gap-2">
            <input
              type="url"
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
              placeholder="https://..."
              className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 focus:outline-none"
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
              className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50"
            >
              {coverUploading ? (
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" /><path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
              )}
              Upload
            </button>
          </div>
          {coverUrl && (
            <div className="mt-2 overflow-hidden rounded-lg border border-gray-200">
              <img src={coverUrl} alt="Cover preview" className="aspect-video w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            </div>
          )}
        </div>

        {/* Category */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Kategori
          </label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 focus:outline-none"
          >
            <option value="">Pilih Kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Tags
            </label>
            <div className="flex flex-wrap gap-2">
              {tags.map((t) => (
                <button
                  key={t.id}
                  onClick={() => toggleTag(t.id)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    tagIds.includes(t.id)
                      ? "bg-sky-100 text-sky-700"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* SEO */}
        <details className="rounded-xl border border-gray-100 p-4">
          <summary className="cursor-pointer text-sm font-medium text-gray-700">
            Pengaturan SEO (opsional)
          </summary>
          <div className="mt-4 space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Meta Title
              </label>
              <input
                type="text"
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                maxLength={70}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
              />
              <p className="mt-1 text-xs text-gray-400">
                {metaTitle.length}/70
              </p>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Meta Description
              </label>
              <textarea
                value={metaDesc}
                onChange={(e) => setMetaDesc(e.target.value)}
                maxLength={160}
                rows={2}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
              />
              <p className="mt-1 text-xs text-gray-400">
                {metaDesc.length}/160
              </p>
            </div>
          </div>
        </details>
      </div>

      {/* Actions */}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
        <button
          onClick={handleSaveDraft}
          disabled={saving}
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-50 sm:w-auto sm:px-6"
        >
          {saving ? "Menyimpan..." : "Simpan Draf"}
        </button>
        <button
          onClick={handleSaveAndSubmit}
          disabled={saving}
          className="w-full rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-sky-700 disabled:opacity-50 sm:w-auto sm:px-6"
        >
          {saving ? "Menyimpan..." : "Simpan & Submit Review"}
        </button>
      </div>
    </div>
  );
}
