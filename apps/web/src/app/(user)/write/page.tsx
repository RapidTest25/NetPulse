"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { userAPI, authAPI } from "@/lib/auth-api";
import { apiClient } from "@/lib/api-client";
import MarkdownEditor from "@/components/editor/MarkdownEditor";

export default function WritePage() {
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
  const [autoSaved, setAutoSaved] = useState("");
  const [error, setError] = useState("");
  const [showMeta, setShowMeta] = useState(false);
  const [postId, setPostId] = useState<string | null>(null);

  const autosaveTimer = useRef<NodeJS.Timeout | null>(null);
  const lastSaved = useRef({ title: "", body: "" });

  useEffect(() => {
    const user = authAPI.getUser();
    if (!user || !["AUTHOR", "EDITOR", "ADMIN", "OWNER"].includes(user.role)) {
      router.push("/me/request-author");
      return;
    }

    async function loadMeta() {
      const [cats, tgs] = await Promise.all([
        apiClient.getCategories().catch(() => []),
        apiClient.getTags().catch(() => []),
      ]);
      setCategories(cats || []);
      setTags(tgs || []);
    }
    loadMeta();
  }, [router]);

  // Autosave every 15 seconds
  const autosave = useCallback(async () => {
    if (!title.trim() || !body.trim()) return;
    if (title === lastSaved.current.title && body === lastSaved.current.body)
      return;

    try {
      if (postId) {
        await userAPI.updatePost(postId, {
          title,
          body,
          excerpt,
          cover_url: coverUrl,
          category_id: categoryId || undefined,
          tag_ids: tagIds.length > 0 ? tagIds : undefined,
          meta_title: metaTitle || undefined,
          meta_description: metaDesc || undefined,
        });
      } else {
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
        if (post?.id) setPostId(post.id);
      }
      lastSaved.current = { title, body };
      setAutoSaved(
        new Date().toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
    } catch {}
  }, [
    title,
    body,
    excerpt,
    coverUrl,
    categoryId,
    tagIds,
    metaTitle,
    metaDesc,
    postId,
  ]);

  useEffect(() => {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(autosave, 15000);
    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
  }, [autosave]);

  const handleSaveDraft = async () => {
    if (!title.trim()) {
      setError("Judul wajib diisi");
      return;
    }
    setSaving(true);
    setError("");
    try {
      if (postId) {
        await userAPI.updatePost(postId, {
          title,
          body,
          excerpt,
          cover_url: coverUrl,
          category_id: categoryId || undefined,
          tag_ids: tagIds.length > 0 ? tagIds : undefined,
          meta_title: metaTitle || undefined,
          meta_description: metaDesc || undefined,
        });
      } else {
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
      }
      router.push("/me/posts");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!title.trim() || !body.trim()) {
      setError("Judul dan konten wajib diisi untuk submit review");
      return;
    }
    setSaving(true);
    setError("");
    try {
      let id = postId;
      if (!id) {
        const post = await userAPI.createPost({
          title,
          body,
          excerpt,
          cover_url: coverUrl,
          category_id: categoryId || undefined,
          tag_ids: tagIds.length > 0 ? tagIds : undefined,
        });
        id = post?.id;
      } else {
        await userAPI.updatePost(id, {
          title,
          body,
          excerpt,
          cover_url: coverUrl,
          category_id: categoryId || undefined,
          tag_ids: tagIds.length > 0 ? tagIds : undefined,
        });
      }
      if (id) await userAPI.submitPostForReview(id);
      router.push("/me/posts");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-gray-100 bg-white/90 backdrop-blur-lg">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            >
              <svg
                className="h-5 w-5"
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
            </button>
            <span className="text-sm font-medium text-gray-900">
              Tulis Artikel
            </span>
            {autoSaved && (
              <span className="text-xs text-gray-400">
                Tersimpan otomatis {autoSaved}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveDraft}
              disabled={saving}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50"
            >
              Simpan Draft
            </button>
            <button
              onClick={handleSubmitReview}
              disabled={saving}
              className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-sky-600 disabled:opacity-50"
            >
              Submit Review
            </button>
          </div>
        </div>
      </header>

      {/* Editor area */}
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-8">
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Title */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Judul Artikel..."
            className="w-full border-none text-3xl font-bold text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-0"
          />

          {/* Excerpt */}
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="Ringkasan singkat (opsional)..."
            rows={2}
            className="mt-4 w-full resize-none border-none text-lg text-gray-500 placeholder:text-gray-300 focus:outline-none focus:ring-0"
          />

          {/* Cover URL */}
          <div className="mt-6">
            <input
              type="url"
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
              placeholder="URL gambar cover (opsional)..."
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 placeholder:text-gray-300 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
            {coverUrl && (
              <img
                src={coverUrl}
                alt="Cover preview"
                className="mt-2 max-h-48 w-full rounded-lg object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            )}
          </div>

          {/* Category + Tags */}
          <div className="mt-6 flex flex-col gap-4 sm:flex-row">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-gray-500">
                Kategori
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                <option value="">Pilih kategori</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-gray-500">
                Tags
              </label>
              <div className="flex flex-wrap gap-2">
                {tags.map((t) => (
                  <label
                    key={t.id}
                    className={`cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                      tagIds.includes(t.id)
                        ? "border-sky-500 bg-sky-50 text-sky-700"
                        : "border-gray-200 text-gray-500 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={tagIds.includes(t.id)}
                      onChange={(e) => {
                        if (e.target.checked) setTagIds([...tagIds, t.id]);
                        else setTagIds(tagIds.filter((id) => id !== t.id));
                      }}
                    />
                    {t.name}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* SEO Meta toggle */}
          <button
            type="button"
            onClick={() => setShowMeta(!showMeta)}
            className="mt-6 flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600"
          >
            <svg
              className={`h-4 w-4 transition-transform ${showMeta ? "rotate-90" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.25 4.5l7.5 7.5-7.5 7.5"
              />
            </svg>
            SEO & Meta
          </button>
          {showMeta && (
            <div className="mt-3 space-y-3 rounded-lg border border-gray-100 bg-gray-50 p-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">
                  Meta Title
                </label>
                <input
                  type="text"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  placeholder="Judul untuk SEO"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">
                  Meta Description
                </label>
                <textarea
                  value={metaDesc}
                  onChange={(e) => setMetaDesc(e.target.value)}
                  placeholder="Deskripsi untuk SEO"
                  rows={2}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Markdown editor */}
          <div className="mt-8">
            <MarkdownEditor
              value={body}
              onChange={setBody}
              placeholder="Tulis konten artikel kamu di sini..."
              minHeight={500}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
