"use client";

import { useEffect, useState, useCallback } from "react";
import { authFetch } from "@/lib/auth";
import type { Comment, CommentStatus } from "@/types";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "bg-amber-100 text-amber-700" },
  approved: { label: "Disetujui", color: "bg-emerald-100 text-emerald-700" },
  spam: { label: "Spam", color: "bg-red-100 text-red-700" },
  rejected: { label: "Ditolak", color: "bg-gray-200 text-gray-600" },
};

export default function AdminCommentsPage() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string>("pending");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [acting, setActing] = useState(false);

  const perPage = 20;

  const load = useCallback(async () => {
    setLoading(true);
    const sp = new URLSearchParams();
    sp.set("page", String(page));
    sp.set("per_page", String(perPage));
    if (status) sp.set("status", status);
    if (search) sp.set("search", search);
    try {
      const res = await authFetch(`${API}/admin/comments?${sp}`);
      if (res.ok) {
        const d = await res.json();
        setComments(d.items || []);
        setTotal(d.total || 0);
      }
    } catch {
      /* ignore */
    }
    setLoading(false);
  }, [page, status, search]);

  useEffect(() => {
    load();
  }, [load]);

  const moderate = async (id: string, newStatus: CommentStatus) => {
    setActing(true);
    await authFetch(`${API}/admin/comments/${id}/moderate`, {
      method: "PUT",
      body: JSON.stringify({ status: newStatus }),
    });
    await load();
    setActing(false);
  };

  const bulkModerate = async (newStatus: CommentStatus) => {
    if (selected.size === 0) return;
    setActing(true);
    await authFetch(`${API}/admin/comments/bulk-moderate`, {
      method: "PUT",
      body: JSON.stringify({ ids: Array.from(selected), status: newStatus }),
    });
    setSelected(new Set());
    await load();
    setActing(false);
  };

  const deleteComment = async (id: string) => {
    if (!confirm("Hapus komentar ini?")) return;
    setActing(true);
    await authFetch(`${API}/admin/comments/${id}`, { method: "DELETE" });
    await load();
    setActing(false);
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const toggleAll = () => {
    if (selected.size === comments.length) setSelected(new Set());
    else setSelected(new Set(comments.map((c) => c.id)));
  };

  const totalPages = Math.ceil(total / perPage);

  const timeAgo = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diff < 60) return "baru saja";
    if (diff < 3600) return `${Math.floor(diff / 60)}m lalu`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}j lalu`;
    return `${Math.floor(diff / 86400)}h lalu`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Moderasi Komentar</h1>
        <p className="text-sm text-gray-500">
          Review dan moderasi komentar pengguna
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-xl border border-gray-200 bg-white p-1">
          {["pending", "approved", "spam", "rejected", ""].map((s) => (
            <button
              key={s}
              onClick={() => {
                setStatus(s);
                setPage(1);
              }}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                status === s
                  ? "bg-indigo-600 text-white"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {s ? STATUS_LABELS[s]?.label || s : "Semua"}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Cari komentar..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="h-9 w-full sm:w-56 rounded-xl border border-gray-200 bg-white px-3 text-sm focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 focus:outline-none"
        />

        <span className="ml-auto text-xs text-gray-400">{total} komentar</span>
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2">
          <span className="text-sm font-medium text-indigo-700">
            {selected.size} dipilih
          </span>
          <div className="ml-auto flex gap-2">
            <button
              onClick={() => bulkModerate("approved")}
              disabled={acting}
              className="rounded-lg bg-emerald-500 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-600 disabled:opacity-50"
            >
              Setujui
            </button>
            <button
              onClick={() => bulkModerate("spam")}
              disabled={acting}
              className="rounded-lg bg-red-500 px-3 py-1 text-xs font-medium text-white hover:bg-red-600 disabled:opacity-50"
            >
              Spam
            </button>
            <button
              onClick={() => bulkModerate("rejected")}
              disabled={acting}
              className="rounded-lg bg-gray-500 px-3 py-1 text-xs font-medium text-white hover:bg-gray-600 disabled:opacity-50"
            >
              Tolak
            </button>
          </div>
        </div>
      )}

      {/* Comments list */}
      {loading ? (
        <div className="py-20 text-center text-gray-400">
          Memuat komentar...
        </div>
      ) : comments.length === 0 ? (
        <div className="py-20 text-center text-gray-400">
          Tidak ada komentar ditemukan
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center px-4">
            <input
              type="checkbox"
              checked={selected.size === comments.length && comments.length > 0}
              onChange={toggleAll}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600"
            />
            <span className="ml-2 text-xs text-gray-400">Pilih semua</span>
          </div>

          {comments.map((c) => (
            <div
              key={c.id}
              className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={selected.has(c.id)}
                  onChange={() => toggleSelect(c.id)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600"
                />

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-semibold text-gray-900">
                      {c.author_name}
                    </span>
                    {c.author_email && (
                      <span className="hidden sm:inline text-gray-400">
                        {c.author_email}
                      </span>
                    )}
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_LABELS[c.status]?.color || "bg-gray-100 text-gray-500"}`}
                    >
                      {STATUS_LABELS[c.status]?.label || c.status}
                    </span>
                    <span className="ml-auto text-xs text-gray-400">
                      {timeAgo(c.created_at)}
                    </span>
                  </div>

                  <p className="mt-1 text-sm leading-relaxed text-gray-700">
                    {c.content}
                  </p>

                  {c.post_title && (
                    <p className="mt-1 text-xs text-gray-400">
                      pada:{" "}
                      <span className="font-medium text-gray-500">
                        {c.post_title}
                      </span>
                    </p>
                  )}

                  {/* Actions */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {c.status !== "approved" && (
                      <button
                        onClick={() => moderate(c.id, "approved")}
                        disabled={acting}
                        className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                      >
                        Setujui
                      </button>
                    )}
                    {c.status !== "spam" && (
                      <button
                        onClick={() => moderate(c.id, "spam")}
                        disabled={acting}
                        className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
                      >
                        Spam
                      </button>
                    )}
                    {c.status !== "rejected" && (
                      <button
                        onClick={() => moderate(c.id, "rejected")}
                        disabled={acting}
                        className="rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                      >
                        Tolak
                      </button>
                    )}
                    <button
                      onClick={() => deleteComment(c.id)}
                      disabled={acting}
                      className="ml-auto rounded-lg px-2.5 py-1 text-xs font-medium text-red-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40"
          >
            Sebelumnya
          </button>
          <span className="text-xs text-gray-500">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40"
          >
            Selanjutnya
          </button>
        </div>
      )}
    </div>
  );
}
