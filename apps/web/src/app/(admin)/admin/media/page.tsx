"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { authFetch } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

interface MediaItem {
  id: string;
  filename: string;
  url: string;
  mime_type: string;
  size_bytes: number;
  uploaded_by: string;
  created_at: string;
}

function getMediaType(mime: string): "image" | "video" | "document" {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  return "document";
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

const typeIcons = {
  image: {
    icon: "M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M2.25 18V6a2.25 2.25 0 012.25-2.25h15A2.25 2.25 0 0121.75 6v12A2.25 2.25 0 0119.5 20.25h-15A2.25 2.25 0 012.25 18z",
    color: "text-blue-500 bg-blue-50",
  },
  video: {
    icon: "M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z",
    color: "text-purple-500 bg-purple-50",
  },
  document: {
    icon: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z",
    color: "text-amber-500 bg-amber-50",
  },
};

export default function AdminMediaPage() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchMedia = useCallback(async () => {
    setLoading(true);
    try {
      const mimePrefix =
        typeFilter === "image"
          ? "image"
          : typeFilter === "video"
            ? "video"
            : typeFilter === "document"
              ? "application"
              : "";
      const params = new URLSearchParams({
        page: String(page),
        per_page: "24",
        search,
        type: mimePrefix,
      });
      const res = await authFetch(`${API_URL}/admin/media?${params}`);
      if (res.ok) {
        const data = await res.json();
        setMedia(data.items || []);
        setTotal(data.total || 0);
        setTotalPages(data.total_pages || 1);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [page, search, typeFilter]);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  const handleUpload = async (files: FileList | File[]) => {
    setUploading(true);
    setUploadProgress([]);
    const results: string[] = [];
    for (const file of Array.from(files)) {
      const form = new FormData();
      form.append("file", file);
      try {
        const res = await authFetch(`${API_URL}/admin/media/upload`, {
          method: "POST",
          body: form,
        });
        if (res.ok) {
          results.push(`✓ ${file.name}`);
        } else {
          const err = await res.json();
          results.push(`✗ ${file.name}: ${err.error}`);
        }
      } catch {
        results.push(`✗ ${file.name}: upload gagal`);
      }
      setUploadProgress([...results]);
    }
    setUploading(false);
    fetchMedia();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus file ini?")) return;
    setDeleting(id);
    try {
      await authFetch(`${API_URL}/admin/media/${id}`, { method: "DELETE" });
      fetchMedia();
    } catch {
      /* ignore */
    } finally {
      setDeleting(null);
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Hapus ${selectedIds.size} file?`)) return;
    for (const id of selectedIds) {
      try {
        await authFetch(`${API_URL}/admin/media/${id}`, { method: "DELETE" });
      } catch {
        /* ignore */
      }
    }
    setSelectedIds(new Set());
    fetchMedia();
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const filtered = media;
  const totalSize = media.reduce((s, m) => s + m.size_bytes, 0);

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Media
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Kelola gambar, video, dan file lainnya.{" "}
            <span className="text-gray-400">
              {total} file • {formatSize(totalSize)}
            </span>
          </p>
        </div>
        <button
          onClick={() => {
            setShowUploadModal(true);
            setUploadProgress([]);
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-linear-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-500/25 transition-all hover:shadow-md hover:brightness-110"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          Upload File
        </button>
      </div>

      {/* Toolbar */}
      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex gap-1 rounded-lg border border-gray-200 bg-white p-1">
            {[
              { key: "all", label: "Semua" },
              { key: "image", label: "Gambar" },
              { key: "video", label: "Video" },
              { key: "document", label: "Dokumen" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setTypeFilter(tab.key);
                  setPage(1);
                }}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${typeFilter === tab.key ? "bg-brand-600 text-white shadow-sm" : "text-gray-600 hover:bg-gray-100"}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="flex rounded-lg border border-gray-200 bg-white p-0.5">
            <button
              onClick={() => setViewMode("grid")}
              className={`rounded-md p-1.5 transition-colors ${viewMode === "grid" ? "bg-gray-100 text-gray-900" : "text-gray-400 hover:text-gray-600"}`}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`rounded-md p-1.5 transition-colors ${viewMode === "list" ? "bg-gray-100 text-gray-900" : "text-gray-400 hover:text-gray-600"}`}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
              </svg>
            </button>
          </div>
        </div>
        <div className="relative max-w-xs">
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            placeholder="Cari file…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-4 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
          />
        </div>
      </div>

      {/* Bulk actions */}
      {selectedIds.size > 0 && (
        <div className="mt-4 flex items-center gap-3 rounded-lg bg-indigo-50 px-4 py-2.5 text-sm">
          <span className="font-medium text-indigo-700">
            {selectedIds.size} file dipilih
          </span>
          <button
            onClick={handleBulkDelete}
            className="rounded-md bg-red-600 px-3 py-1 text-xs font-medium text-white shadow-sm hover:bg-red-700"
          >
            Hapus
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="ml-auto text-xs text-gray-500 hover:text-gray-700"
          >
            Batal pilih
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="mt-12 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-indigo-600" />
          <p className="mt-3 text-sm text-gray-500">Memuat media...</p>
        </div>
      )}

      {/* Grid View */}
      {!loading && viewMode === "grid" && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((item) => {
            const mtype = getMediaType(item.mime_type);
            const ti = typeIcons[mtype];
            const selected = selectedIds.has(item.id);
            const isImage = mtype === "image";
            return (
              <div
                key={item.id}
                className={`group cursor-pointer overflow-hidden rounded-xl border bg-white shadow-sm transition-all hover:shadow-md ${selected ? "border-brand-500 ring-2 ring-brand-200" : "border-gray-200"}`}
              >
                {/* Preview */}
                <div
                  className="relative flex aspect-4/3 items-center justify-center bg-linear-to-br from-gray-50 to-gray-100"
                  onClick={() => toggleSelect(item.id)}
                >
                  {isImage ? (
                    <img
                      src={item.url}
                      alt={item.filename}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className={`flex h-16 w-16 items-center justify-center rounded-2xl ${ti.color}`}>
                      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d={ti.icon} />
                      </svg>
                    </div>
                  )}
                  {/* Checkbox */}
                  <div
                    className={`absolute left-3 top-3 flex h-5 w-5 items-center justify-center rounded-md border transition-all ${selected ? "border-brand-600 bg-brand-600" : "border-gray-300 bg-white opacity-0 group-hover:opacity-100"}`}
                  >
                    {selected && (
                      <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    )}
                  </div>
                  {/* Size badge */}
                  <span className="absolute bottom-2 right-2 rounded-md bg-black/50 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
                    {formatSize(item.size_bytes)}
                  </span>
                </div>
                {/* Info */}
                <div className="px-3 py-2.5">
                  <p className="truncate text-sm font-medium text-gray-900">{item.filename}</p>
                  <div className="mt-1 flex items-center justify-between text-xs text-gray-400">
                    <span>
                      {new Date(item.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                    </span>
                    <div className="flex gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); copyUrl(item.url); }}
                        title="Copy URL"
                        className="rounded p-1 hover:bg-gray-100"
                      >
                        {copiedUrl === item.url ? (
                          <svg className="h-3.5 w-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        ) : (
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.51a4.5 4.5 0 00-1.242-7.244l-4.5-4.5a4.5 4.5 0 00-6.364 6.364L4.34 8.374" />
                          </svg>
                        )}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setPreviewItem(item); }}
                        title="Preview"
                        className="rounded p-1 hover:bg-gray-100"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                        title="Hapus"
                        className="rounded p-1 text-red-400 hover:bg-red-50"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {!loading && viewMode === "list" && (
        <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200/60 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="w-10 px-4 py-3">
                  <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                </th>
                <th className="px-4 py-3 font-medium text-gray-500">File</th>
                <th className="px-4 py-3 font-medium text-gray-500">Tipe</th>
                <th className="hidden px-4 py-3 font-medium text-gray-500 md:table-cell">Ukuran</th>
                <th className="px-4 py-3 font-medium text-gray-500">Tanggal</th>
                <th className="w-28 px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((item) => {
                const mtype = getMediaType(item.mime_type);
                const ti = typeIcons[mtype];
                return (
                  <tr key={item.id} className="transition-colors hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(item.id)}
                        onChange={() => toggleSelect(item.id)}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${ti.color}`}>
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d={ti.icon} />
                          </svg>
                        </div>
                        <span className="truncate font-medium text-gray-900">{item.filename}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{item.mime_type.split("/")[1]}</td>
                    <td className="hidden px-4 py-3 text-gray-500 md:table-cell">{formatSize(item.size_bytes)}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(item.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => copyUrl(item.url)}
                          title="Copy URL"
                          className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                        >
                          {copiedUrl === item.url ? (
                            <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                          ) : (
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.51a4.5 4.5 0 00-1.242-7.244l-4.5-4.5a4.5 4.5 0 00-6.364 6.364L4.34 8.374" />
                            </svg>
                          )}
                        </button>
                        <button
                          onClick={() => setPreviewItem(item)}
                          title="Preview"
                          className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          title="Hapus"
                          className={`rounded-lg p-1.5 text-red-400 transition-colors hover:bg-red-50 hover:text-red-600 ${deleting === item.id ? "animate-pulse" : ""}`}
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="mt-12 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M2.25 18V6a2.25 2.25 0 012.25-2.25h15A2.25 2.25 0 0121.75 6v12A2.25 2.25 0 0119.5 20.25h-15A2.25 2.25 0 012.25 18z" />
          </svg>
          <p className="mt-3 text-sm font-medium text-gray-600">Tidak ada file ditemukan</p>
          <p className="mt-1 text-xs text-gray-400">Upload file baru untuk memulai.</p>
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
          >
            ←
          </button>
          <span className="text-sm text-gray-500">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
          >
            →
          </button>
        </div>
      )}

      {/* Preview Modal */}
      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setPreviewItem(null)}>
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 truncate">{previewItem.filename}</h3>
              <button onClick={() => setPreviewItem(null)} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="mt-4 flex items-center justify-center rounded-xl bg-gray-50 p-4">
              {getMediaType(previewItem.mime_type) === "image" ? (
                <img src={previewItem.url} alt={previewItem.filename} className="max-h-80 rounded-lg object-contain" />
              ) : getMediaType(previewItem.mime_type) === "video" ? (
                <video src={previewItem.url} controls className="max-h-80 rounded-lg" />
              ) : (
                <div className="flex flex-col items-center py-8">
                  <svg className="h-16 w-16 text-amber-400" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d={typeIcons.document.icon} />
                  </svg>
                  <p className="mt-2 text-sm text-gray-500">Preview tidak tersedia</p>
                </div>
              )}
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3 text-center text-xs">
              <div className="rounded-lg bg-gray-50 p-2">
                <p className="text-gray-400">Tipe</p>
                <p className="mt-0.5 font-medium text-gray-700">{previewItem.mime_type}</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-2">
                <p className="text-gray-400">Ukuran</p>
                <p className="mt-0.5 font-medium text-gray-700">{formatSize(previewItem.size_bytes)}</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-2">
                <p className="text-gray-400">Diupload</p>
                <p className="mt-0.5 font-medium text-gray-700">
                  {new Date(previewItem.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
            </div>
            <div className="mt-4 flex justify-between">
              <button
                onClick={() => copyUrl(previewItem.url)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                {copiedUrl === previewItem.url ? "Tersalin!" : "Copy URL"}
              </button>
              <a
                href={previewItem.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
              >
                Buka File
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Upload File</h3>
              <button onClick={() => setShowUploadModal(false)} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".jpg,.jpeg,.png,.gif,.svg,.webp,.mp4,.webm,.pdf"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.length) handleUpload(e.target.files);
              }}
            />
            <div
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragActive(false);
                if (e.dataTransfer.files.length) handleUpload(e.dataTransfer.files);
              }}
              className={`mt-5 flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 transition-colors ${dragActive ? "border-brand-400 bg-indigo-50" : "border-gray-200 bg-gray-50/50"}`}
            >
              {uploading ? (
                <div className="flex flex-col items-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-indigo-600" />
                  <p className="mt-3 text-sm font-medium text-gray-700">Mengupload...</p>
                </div>
              ) : (
                <>
                  <svg className="h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                  </svg>
                  <p className="mt-3 text-sm font-medium text-gray-700">Drag & drop file di sini</p>
                  <p className="mt-1 text-xs text-gray-400">atau</p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-3 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
                  >
                    Pilih File
                  </button>
                  <p className="mt-3 text-[10px] text-gray-400">
                    PNG, JPG, GIF, SVG, WEBP, MP4, WEBM, PDF. Max 10MB.
                  </p>
                </>
              )}
            </div>
            {/* Upload results */}
            {uploadProgress.length > 0 && (
              <div className="mt-4 max-h-32 overflow-y-auto rounded-lg bg-gray-50 p-3 text-xs font-mono">
                {uploadProgress.map((line, i) => (
                  <p key={i} className={line.startsWith("✓") ? "text-emerald-600" : "text-red-600"}>
                    {line}
                  </p>
                ))}
              </div>
            )}
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowUploadModal(false)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
