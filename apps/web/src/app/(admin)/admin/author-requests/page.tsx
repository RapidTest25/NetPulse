"use client";

import { useEffect, useState } from "react";
import { adminAPI } from "@/lib/auth-api";
import type { AuthorRequest } from "@/types";

type RequestStatus = "PENDING" | "APPROVED" | "REJECTED";

const statusConfig: Record<RequestStatus, { label: string; class: string }> = {
  PENDING: { label: "Menunggu", class: "bg-amber-100 text-amber-700" },
  APPROVED: { label: "Disetujui", class: "bg-green-100 text-green-700" },
  REJECTED: { label: "Ditolak", class: "bg-red-100 text-red-700" },
};

export default function AuthorRequestsPage() {
  const [requests, setRequests] = useState<AuthorRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("");
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [processing, setProcessing] = useState(false);
  const perPage = 20;

  useEffect(() => {
    load();
  }, [page, filter]);

  async function load() {
    setLoading(true);
    try {
      const res = await adminAPI.getAuthorRequests({
        page,
        status: filter || undefined,
      });
      setRequests(res.data || []);
      setTotal(res.total || 0);
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleReview(id: string, status: "APPROVED" | "REJECTED") {
    setProcessing(true);
    try {
      await adminAPI.reviewAuthorRequest(id, status, adminNote);
      setReviewingId(null);
      setAdminNote("");
      load();
    } catch (err: any) {
      alert(err.message || "Gagal memproses");
    } finally {
      setProcessing(false);
    }
  }

  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Permintaan Author</h2>
          <p className="text-sm text-gray-500">{total} permintaan total</p>
        </div>
        <div className="flex items-center gap-2">
          {["", "PENDING", "APPROVED", "REJECTED"].map((s) => (
            <button
              key={s}
              onClick={() => {
                setFilter(s);
                setPage(1);
              }}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === s
                  ? "bg-sky-100 text-sky-700"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {s === ""
                ? "Semua"
                : statusConfig[s as RequestStatus]?.label || s}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
        </div>
      ) : requests.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-gray-50 py-16 text-center">
          <p className="text-sm text-gray-500">Tidak ada permintaan</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => {
            const sc = statusConfig[req.status as RequestStatus];
            const isReviewing = reviewingId === req.id;

            return (
              <div
                key={req.id}
                className="rounded-xl border border-gray-200 bg-white p-5 transition-shadow hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">
                        {req.user_name || "Unknown"}
                      </span>
                      <span className="text-sm text-gray-400">
                        {req.user_email}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${sc.class}`}
                      >
                        {sc.label}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-gray-600">
                      {req.reason}
                    </p>
                    <p className="mt-2 text-xs text-gray-400">
                      {new Date(req.created_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    {req.admin_note && (
                      <div className="mt-2 rounded-lg bg-gray-50 p-2">
                        <p className="text-xs font-medium text-gray-500">
                          Catatan admin:
                        </p>
                        <p className="text-sm text-gray-700">
                          {req.admin_note}
                        </p>
                      </div>
                    )}
                  </div>

                  {req.status === "PENDING" && !isReviewing && (
                    <div className="flex shrink-0 gap-2">
                      <button
                        onClick={() => setReviewingId(req.id)}
                        className="rounded-lg bg-sky-50 px-3 py-1.5 text-xs font-medium text-sky-700 hover:bg-sky-100"
                      >
                        Review
                      </button>
                    </div>
                  )}
                </div>

                {/* Review form */}
                {isReviewing && (
                  <div className="mt-4 space-y-3 border-t border-gray-100 pt-4">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-500">
                        Catatan (opsional)
                      </label>
                      <textarea
                        value={adminNote}
                        onChange={(e) => setAdminNote(e.target.value)}
                        rows={2}
                        placeholder="Tambahkan catatan untuk user..."
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleReview(req.id, "APPROVED")}
                        disabled={processing}
                        className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                      >
                        Setujui
                      </button>
                      <button
                        onClick={() => handleReview(req.id, "REJECTED")}
                        disabled={processing}
                        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        Tolak
                      </button>
                      <button
                        onClick={() => {
                          setReviewingId(null);
                          setAdminNote("");
                        }}
                        className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40"
          >
            Sebelumnya
          </button>
          <span className="px-3 text-sm text-gray-500">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40"
          >
            Selanjutnya
          </button>
        </div>
      )}
    </div>
  );
}
