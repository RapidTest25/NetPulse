"use client";

import { useState, useEffect, useCallback } from "react";
import { adminAPI } from "@/lib/auth-api";

const STATUS_OPTIONS = [
  { value: "", label: "Semua Status" },
  { value: "PENDING_PAYMENT", label: "Menunggu Bayar" },
  { value: "PAID", label: "Dibayar" },
  { value: "IN_PROGRESS", label: "Dikerjakan" },
  { value: "DELIVERED", label: "Dikirim" },
  { value: "REVISION", label: "Revisi" },
  { value: "COMPLETED", label: "Selesai" },
  { value: "CANCELLED", label: "Dibatalkan" },
  { value: "EXPIRED", label: "Expired" },
  { value: "REFUNDED", label: "Refund" },
];

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  PENDING_PAYMENT: { label: "Menunggu Bayar", cls: "bg-yellow-50 text-yellow-600" },
  PAID: { label: "Dibayar", cls: "bg-blue-50 text-blue-600" },
  IN_PROGRESS: { label: "Dikerjakan", cls: "bg-indigo-50 text-indigo-600" },
  DELIVERED: { label: "Dikirim", cls: "bg-teal-50 text-teal-600" },
  REVISION: { label: "Revisi", cls: "bg-amber-50 text-amber-600" },
  COMPLETED: { label: "Selesai", cls: "bg-green-50 text-green-600" },
  CANCELLED: { label: "Dibatalkan", cls: "bg-gray-100 text-gray-500" },
  EXPIRED: { label: "Expired", cls: "bg-red-50 text-red-500" },
  REFUNDED: { label: "Refund", cls: "bg-orange-50 text-orange-600" },
};

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);
}

function formatDate(d: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function Toast({ msg, type, onClose }: { msg: string; type: "success" | "error"; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={`fixed right-6 top-6 z-50 flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-medium text-white shadow-lg ${type === "success" ? "bg-green-500" : "bg-red-500"}`}>
      {type === "success" ? "✅" : "❌"} {msg}
      <button onClick={onClose} className="ml-2 text-white/70 hover:text-white">✕</button>
    </div>
  );
}

/* ── Order Detail Modal ─────────────────── */
function OrderDetail({ order, onClose, onUpdated }: { order: any; onClose: () => void; onUpdated: () => void }) {
  const [status, setStatus] = useState(order.status);
  const [adminNote, setAdminNote] = useState(order.admin_notes || "");
  const [saving, setSaving] = useState(false);

  const handleUpdate = async () => {
    setSaving(true);
    try {
      await adminAPI.updateStoreOrder(order.id, { status, admin_notes: adminNote });
      onUpdated();
    } catch {
      // error
    } finally {
      setSaving(false);
    }
  };

  const badge = STATUS_BADGE[order.status] || { label: order.status, cls: "bg-gray-50 text-gray-600" };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Detail Pesanan</h2>
            <p className="text-xs text-gray-400 mt-0.5">{order.order_number}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <div className="p-6 space-y-5">
          {/* Status + Info */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-gray-50 p-4 space-y-2">
              <p className="text-xs font-semibold text-gray-400 uppercase">Status</p>
              <span className={`rounded-md px-2.5 py-1 text-xs font-semibold ${badge.cls}`}>{badge.label}</span>
            </div>
            <div className="rounded-xl bg-gray-50 p-4 space-y-2">
              <p className="text-xs font-semibold text-gray-400 uppercase">Total</p>
              <p className="text-lg font-bold text-gray-900">{formatRupiah(order.total_price || order.amount || 0)}</p>
            </div>
          </div>

          {/* Buyer Info */}
          <div className="rounded-xl border border-gray-200 p-4 space-y-2">
            <h3 className="text-sm font-semibold text-gray-700">Informasi Pembeli</h3>
            <div className="grid gap-2 text-sm sm:grid-cols-2">
              <div><span className="text-gray-400">Nama:</span> <span className="font-medium">{order.buyer_name || "—"}</span></div>
              <div><span className="text-gray-400">Email:</span> <span className="font-medium">{order.buyer_email || "—"}</span></div>
              <div><span className="text-gray-400">Telepon:</span> <span className="font-medium">{order.buyer_phone || "—"}</span></div>
              <div><span className="text-gray-400">Tanggal:</span> <span className="font-medium">{formatDate(order.created_at)}</span></div>
            </div>
          </div>

          {/* Item info */}
          {order.listing_title && (
            <div className="rounded-xl border border-gray-200 p-4 space-y-2">
              <h3 className="text-sm font-semibold text-gray-700">Layanan</h3>
              <p className="text-sm">{order.listing_title}</p>
              {order.package_name && <p className="text-xs text-gray-400">Paket: {order.package_name}</p>}
            </div>
          )}

          {/* Notes */}
          {order.buyer_notes && (
            <div className="rounded-xl border border-gray-200 p-4 space-y-2">
              <h3 className="text-sm font-semibold text-gray-700">Catatan Pembeli</h3>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{order.buyer_notes}</p>
            </div>
          )}

          {/* Admin Update */}
          <div className="border-t border-gray-100 pt-5 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">Update Pesanan</h3>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-500 uppercase">Status</label>
              <select
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                {STATUS_OPTIONS.filter((o) => o.value).map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-500 uppercase">Catatan Admin</label>
              <textarea
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                rows={3}
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Catatan internal..."
              />
            </div>
            <button
              onClick={handleUpdate}
              disabled={saving}
              className="rounded-lg bg-indigo-500 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-600 disabled:opacity-50"
            >
              {saving ? "Menyimpan..." : "Update Pesanan"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ─────────────────────────── */
export default function StoreOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminAPI.getStoreOrders({ page, limit: 20, search: search || undefined, status: statusFilter || undefined });
      setOrders(data.items || []);
      setTotal(data.total || 0);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      {selectedOrder && (
        <OrderDetail
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onUpdated={() => {
            setSelectedOrder(null);
            setToast({ msg: "Pesanan berhasil diupdate!", type: "success" });
            load();
          }}
        />
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pesanan Toko</h1>
        <p className="mt-1 text-sm text-gray-500">{total} pesanan total</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          className="rounded-lg border border-gray-200 px-4 py-2 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
          placeholder="Cari nama/email/no. trx..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
        <select
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-300"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
        >
          {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-100 bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3 font-semibold">No. Transaksi</th>
              <th className="px-4 py-3 font-semibold">Pembeli</th>
              <th className="px-4 py-3 font-semibold">Layanan</th>
              <th className="px-4 py-3 font-semibold">Total</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Tanggal</th>
              <th className="px-4 py-3 font-semibold">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-500" />
              </td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">Belum ada pesanan</td></tr>
            ) : (
              orders.map((order) => {
                const badge = STATUS_BADGE[order.status] || { label: order.status, cls: "bg-gray-50 text-gray-600" };
                return (
                  <tr key={order.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedOrder(order)}>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-semibold text-indigo-600">{order.order_number}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 line-clamp-1">{order.buyer_name || "—"}</div>
                      <div className="text-xs text-gray-400">{order.buyer_email || order.buyer_phone || ""}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 line-clamp-1 max-w-50">{order.listing_title || "—"}</td>
                    <td className="px-4 py-3 font-medium text-gray-700">{formatRupiah(order.total_price || order.amount || 0)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${badge.cls}`}>{badge.label}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">{formatDate(order.created_at)}</td>
                    <td className="px-4 py-3">
                      <button className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50">
                        Detail
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {total > 20 && (
        <div className="flex justify-center gap-2">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm disabled:opacity-40 hover:bg-gray-50">←</button>
          <span className="px-3 py-1.5 text-sm text-gray-600">Hal {page} dari {Math.ceil(total / 20)}</span>
          <button disabled={page >= Math.ceil(total / 20)} onClick={() => setPage(page + 1)} className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm disabled:opacity-40 hover:bg-gray-50">→</button>
        </div>
      )}
    </div>
  );
}
