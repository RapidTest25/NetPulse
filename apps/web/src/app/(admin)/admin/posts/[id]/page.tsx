"use client";

import { useEffect, useState, use } from "react";
import MarkdownEditor from "@/components/editor/MarkdownEditor";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

type PreviewTab = "google" | "facebook" | "twitter";

/* ── Preview Cards Component ───────────────────── */
function PreviewCards({
  title,
  slug,
  excerpt,
  coverUrl,
}: {
  title: string;
  slug: string;
  excerpt: string;
  coverUrl: string;
}) {
  const [previewTab, setPreviewTab] = useState<PreviewTab>("google");
  const domain = "netpulse.id";
  const fullUrl = `https://${domain}/posts/${slug || "slug"}`;
  const displayTitle = title || "Judul Artikel";
  const displayExcerpt =
    excerpt ||
    "Deskripsi artikel akan muncul di sini. Tulis excerpt yang menarik untuk meningkatkan CTR.";

  const tabs: { key: PreviewTab; label: string }[] = [
    { key: "google", label: "Google" },
    { key: "facebook", label: "Social" },
    { key: "twitter", label: "X Card" },
  ];

  const ImagePlaceholder = ({
    aspect = "aspect-[1.91/1]",
  }: {
    aspect?: string;
  }) => (
    <div
      className={`flex ${aspect} items-center justify-center bg-gradient-to-br from-brand-50 to-brand-100`}
    >
      <div className="text-center">
        <svg
          className="mx-auto h-8 w-8 text-brand-300"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M2.25 18V6a2.25 2.25 0 012.25-2.25h15A2.25 2.25 0 0121.75 6v12A2.25 2.25 0 0119.5 20.25h-15A2.25 2.25 0 012.25 18z"
          />
        </svg>
        <p className="mt-1 text-[9px] text-brand-400">Tambahkan cover image</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      {/* Tab buttons */}
      <div className="flex rounded-lg bg-gray-100 p-0.5">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setPreviewTab(t.key)}
            className={`flex-1 rounded-md px-2 py-1.5 text-[11px] font-medium transition-all ${
              previewTab === t.key
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Google SERP Preview */}
      {previewTab === "google" && (
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
            Hasil Pencarian Google
          </p>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700">
                <span className="text-[10px] font-bold text-white">N</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] text-gray-700">{domain}</p>
                <p className="truncate text-[11px] text-gray-500">{fullUrl}</p>
              </div>
              <svg
                className="h-4 w-4 shrink-0 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z"
                />
              </svg>
            </div>
            <h3 className="cursor-pointer text-[18px] font-normal leading-snug text-[#1a0dab] hover:underline">
              {displayTitle}
            </h3>
            <p className="text-[13px] leading-relaxed text-[#4d5156] line-clamp-2">
              {displayExcerpt}
            </p>
          </div>
          {/* SEO character limits */}
          <div className="mt-3 flex gap-3 border-t border-gray-100 pt-2">
            <span
              className={`text-[10px] font-medium ${title.length > 60 ? "text-red-500" : title.length > 50 ? "text-amber-500" : "text-emerald-500"}`}
            >
              Judul: {title.length}/60
            </span>
            <span
              className={`text-[10px] font-medium ${excerpt.length > 160 ? "text-red-500" : excerpt.length > 140 ? "text-amber-500" : "text-emerald-500"}`}
            >
              Deskripsi: {excerpt.length}/160
            </span>
          </div>
        </div>
      )}

      {/* Facebook / LinkedIn OG Preview */}
      {previewTab === "facebook" && (
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
            Facebook / LinkedIn
          </p>
          <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm">
            {coverUrl ? (
              <div className="aspect-[1.91/1] bg-gray-100">
                <img
                  src={coverUrl}
                  alt="OG"
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            ) : (
              <ImagePlaceholder />
            )}
            <div className="border-t border-gray-200 bg-[#f2f3f5] px-3 py-2.5">
              <p className="text-[11px] font-normal uppercase text-[#606770] tracking-wide">
                {domain}
              </p>
              <p className="mt-0.5 text-[15px] font-semibold leading-snug text-[#1d2129] line-clamp-2">
                {displayTitle}
              </p>
              <p className="mt-0.5 text-[13px] text-[#606770] line-clamp-1">
                {displayExcerpt}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* X / Twitter Card Preview */}
      {previewTab === "twitter" && (
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
            X (Twitter) Summary Card
          </p>
          <div className="overflow-hidden rounded-2xl border border-[#cfd9de] shadow-sm">
            {coverUrl ? (
              <div className="aspect-[2/1] bg-gray-100">
                <img
                  src={coverUrl}
                  alt="Twitter Card"
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            ) : (
              <ImagePlaceholder aspect="aspect-[2/1]" />
            )}
            <div className="bg-white px-3 py-2.5">
              <p className="text-[15px] font-bold leading-snug text-[#0f1419] line-clamp-2">
                {displayTitle}
              </p>
              <p className="mt-0.5 text-[13px] text-[#536471] line-clamp-2">
                {displayExcerpt}
              </p>
              <div className="mt-1.5 flex items-center gap-1 text-[13px] text-[#536471]">
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-6.061a4.5 4.5 0 00-6.364 0l-4.5 4.5a4.5 4.5 0 006.364 6.364l1.757-1.757"
                  />
                </svg>
                {domain}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
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
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<any[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("access_token")
        : null;
    const authHeaders: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) authHeaders["Authorization"] = `Bearer ${token}`;

    Promise.all([
      fetch(`${API}/posts/${id}`, { headers: authHeaders }).then((r) =>
        r.json(),
      ),
      fetch(`${API}/categories`).then((r) => r.json()),
    ])
      .then(([post, cats]) => {
        setTitle(post.title || "");
        setSlug(post.slug || "");
        setExcerpt(post.excerpt || "");
        setBody(post.body || "");
        setCategoryId(post.category_id || post.category?.id || "");
        setTags(
          (post.tags || [])
            .map((t: any) => (typeof t === "string" ? t : t.name))
            .join(", "),
        );
        setCoverUrl(post.cover_url || "");
        setStatus(post.status || "draft");
        setCategories(cats || []);
      })
      .catch(() => setError("Artikel tidak ditemukan."))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async (publishStatus?: "draft" | "published") => {
    if (!title.trim()) {
      setError("Judul artikel wajib diisi.");
      return;
    }
    setSaving(true);
    setError("");
    const finalStatus = publishStatus || status;
    try {
      const payload = {
        title: title.trim(),
        slug: slug.trim(),
        excerpt: excerpt.trim(),
        body: body.trim(),
        category_id: categoryId || undefined,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        cover_url: coverUrl.trim() || undefined,
        status: finalStatus,
      };
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("access_token")
          : null;
      const hdrs: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) hdrs["Authorization"] = `Bearer ${token}`;
      const res = await fetch(`${API}/posts/${id}`, {
        method: "PUT",
        headers: hdrs,
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }
      setStatus(finalStatus);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message || "Gagal menyimpan.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("access_token")
          : null;
      const hdrs: Record<string, string> = {};
      if (token) hdrs["Authorization"] = `Bearer ${token}`;
      await fetch(`${API}/posts/${id}`, { method: "DELETE", headers: hdrs });
      window.location.href = "/admin/posts";
    } catch {
      setError("Gagal menghapus artikel.");
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-indigo-200 border-t-brand-600" />
          <p className="mt-3 text-sm text-gray-500">Memuat artikel…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 bg-white px-3 py-2 sm:px-6 sm:py-3">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <a
            href="/admin/posts"
            className="flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-700"
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
                d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
              />
            </svg>
            <span className="hidden sm:inline">Kembali</span>
          </a>
          <span className="hidden text-gray-300 sm:inline">|</span>
          <span className="hidden text-sm font-medium text-gray-700 sm:inline">
            Edit Artikel
          </span>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${status === "published" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}
          >
            {status === "published" ? "Published" : "Draft"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {error && (
            <span className="mr-2 text-xs font-medium text-red-600">
              {error}
            </span>
          )}
          {saved && (
            <span className="mr-2 flex items-center gap-1 text-xs font-medium text-emerald-600">
              <svg
                className="h-4 w-4"
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
            </span>
          )}
          <button
            onClick={() => handleSave("draft")}
            disabled={saving}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 sm:px-4 sm:py-2 sm:text-sm"
          >
            <span className="hidden sm:inline">Simpan Draft</span>
            <span className="sm:hidden">Draft</span>
          </button>
          <button
            onClick={() => handleSave("published")}
            disabled={saving}
            className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 disabled:opacity-50 sm:px-4 sm:py-2 sm:text-sm"
          >
            {saving ? (
              "Menyimpan…"
            ) : (
              <>
                <span className="hidden sm:inline">Update & Publish</span>
                <span className="sm:hidden">Publish</span>
              </>
            )}
          </button>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="rounded-lg border border-gray-200 p-2 text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600"
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

      {/* Editor */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl px-4 py-4 sm:px-8 sm:py-8">
            <input
              type="text"
              placeholder="Judul Artikel…"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border-none bg-transparent text-xl font-bold text-gray-900 outline-none placeholder:text-gray-300 sm:text-3xl"
            />
            {slug && (
              <p className="mt-2 text-xs text-gray-400">
                <span className="text-gray-500">URL:</span> /posts/{slug}
              </p>
            )}
            <textarea
              placeholder="Ringkasan singkat (excerpt)…"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={2}
              className="mt-6 w-full resize-none border-none bg-transparent text-base text-gray-600 outline-none placeholder:text-gray-300"
            />
            <hr className="my-6 border-gray-100" />

            {/* Markdown Editor with split view */}
            <MarkdownEditor
              value={body}
              onChange={setBody}
              placeholder="Tulis konten artikel di sini… (mendukung Markdown)"
              minHeight={400}
            />
          </div>
        </div>

        {/* Sidebar */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        {sidebarOpen && (
          <div className="fixed inset-y-0 right-0 z-40 w-[85vw] max-w-[320px] overflow-y-auto border-l border-gray-200 bg-gray-50/50 shadow-xl md:static md:z-auto md:w-80 md:max-w-none md:shadow-none">
            <div className="space-y-6 p-5">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Kategori
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="">— Pilih kategori —</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Tags
                </label>
                <input
                  type="text"
                  placeholder="dns, networking"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                />
                <p className="mt-1 text-[10px] text-gray-400">
                  Pisahkan dengan koma
                </p>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Slug
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 font-mono text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Cover Image
                </label>
                <input
                  type="url"
                  placeholder="https://…"
                  value={coverUrl}
                  onChange={(e) => setCoverUrl(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                />
                {coverUrl ? (
                  <div className="mt-2 overflow-hidden rounded-lg border border-gray-200">
                    <img
                      src={coverUrl}
                      alt="Cover"
                      className="aspect-video w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                ) : (
                  <div className="mt-2 flex aspect-video items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50">
                    <svg
                      className="h-8 w-8 text-gray-300"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M2.25 18V6a2.25 2.25 0 012.25-2.25h15A2.25 2.25 0 0121.75 6v12A2.25 2.25 0 0119.5 20.25h-15A2.25 2.25 0 012.25 18z"
                      />
                    </svg>
                  </div>
                )}
              </div>

              {/* SEO & Social Previews */}
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Preview
                </label>
                <PreviewCards
                  title={title}
                  slug={slug}
                  excerpt={excerpt}
                  coverUrl={coverUrl}
                />
              </div>

              {/* Danger Zone */}
              <div className="rounded-lg border border-red-200 bg-red-50/50 p-4">
                <h3 className="text-xs font-semibold text-red-800">
                  Zona Berbahaya
                </h3>
                <p className="mt-1 text-[11px] text-red-600/70">
                  Tindakan ini tidak bisa dibatalkan.
                </p>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="mt-3 w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                >
                  Hapus Artikel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-semibold text-gray-900">
              Hapus Artikel
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Apakah Anda yakin ingin menghapus &ldquo;{title}&rdquo;? Tindakan
              ini tidak bisa dibatalkan.
            </p>
            <div className="mt-6 flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? "Menghapus…" : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
