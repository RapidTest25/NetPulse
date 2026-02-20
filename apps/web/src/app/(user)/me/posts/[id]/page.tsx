"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { userAPI } from "@/lib/auth-api";
import { apiClient } from "@/lib/api-client";
import MarkdownEditor from "@/components/editor/MarkdownEditor";

export default function EditPostPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDesc, setMetaDesc] = useState("");
  const [status, setStatus] = useState("");
  const [categories, setCategories] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [post, cats, tgs] = await Promise.all([
          userAPI.getPost(postId),
          apiClient.getCategories(),
          apiClient.getTags(),
        ]);
        setTitle(post.title || "");
        setBody(post.body || "");
        setExcerpt(post.excerpt || "");
        setCoverUrl(post.cover_url || "");
        setCategoryId(post.category_id || "");
        setTagIds(post.tags?.map((t: any) => t.id) || []);
        setMetaTitle(post.meta_title || "");
        setMetaDesc(post.meta_description || "");
        setStatus(post.status);
        setCategories(cats || []);
        setTags(tgs || []);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [postId]);

  const canEdit = status === "DRAFT" || status === "CHANGES_REQUESTED";

  const handleSave = async () => {
    if (!title.trim() || !body.trim()) {
      setError("Judul dan konten wajib diisi");
      return;
    }
    setSaving(true);
    setError("");
    try {
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
      await userAPI.submitPostForReview(postId);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 sm:px-6 lg:px-0">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Edit Artikel</h2>
        <a
          href="/me/posts"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Kembali
        </a>
      </div>

      {!canEdit && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
          Artikel ini berstatus <strong>{status}</strong> dan tidak dapat
          diedit.
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-5 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Judul
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={!canEdit}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 focus:outline-none disabled:bg-gray-50"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Ringkasan
          </label>
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            disabled={!canEdit}
            rows={2}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 focus:outline-none disabled:bg-gray-50"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Konten
          </label>
          <MarkdownEditor
            value={body}
            onChange={setBody}
            placeholder="Tulis konten artikel Anda di sini... (Markdown didukung)"
            disabled={!canEdit}
            minHeight={320}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Cover Image URL
          </label>
          <input
            type="url"
            value={coverUrl}
            onChange={(e) => setCoverUrl(e.target.value)}
            disabled={!canEdit}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 focus:outline-none disabled:bg-gray-50"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Kategori
          </label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            disabled={!canEdit}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 focus:outline-none disabled:bg-gray-50"
          >
            <option value="">Pilih Kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {tags.length > 0 && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Tags
            </label>
            <div className="flex flex-wrap gap-2">
              {tags.map((t) => (
                <button
                  key={t.id}
                  onClick={() => canEdit && toggleTag(t.id)}
                  disabled={!canEdit}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    tagIds.includes(t.id)
                      ? "bg-sky-100 text-sky-700"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  } disabled:cursor-not-allowed`}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <details className="rounded-xl border border-gray-100 p-4">
          <summary className="cursor-pointer text-sm font-medium text-gray-700">
            Pengaturan SEO
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
                disabled={!canEdit}
                maxLength={70}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none disabled:bg-gray-50"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Meta Description
              </label>
              <textarea
                value={metaDesc}
                onChange={(e) => setMetaDesc(e.target.value)}
                disabled={!canEdit}
                maxLength={160}
                rows={2}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none disabled:bg-gray-50"
              />
            </div>
          </div>
        </details>
      </div>

      {canEdit && (
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50 sm:w-auto sm:px-6"
          >
            {saving ? "Menyimpan..." : "Simpan"}
          </button>
          <button
            onClick={handleSaveAndSubmit}
            disabled={saving}
            className="w-full rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-sky-700 disabled:opacity-50 sm:w-auto sm:px-6"
          >
            {saving ? "Menyimpan..." : "Simpan & Submit Review"}
          </button>
        </div>
      )}
    </div>
  );
}
