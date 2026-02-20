"use client";

import { useState, useEffect, useCallback } from "react";
import { adminAPI } from "@/lib/auth-api";

const TYPE_OPTIONS = [
  { value: "", label: "Semua Tipe" },
  { value: "SERVICE", label: "Jasa" },
  { value: "DIGITAL_PRODUCT", label: "Produk Digital" },
  { value: "ACADEMIC", label: "Akademik" },
];

const TYPE_BADGE: Record<string, { label: string; cls: string }> = {
  SERVICE: { label: "Jasa", cls: "bg-blue-50 text-blue-600" },
  DIGITAL_PRODUCT: { label: "Produk", cls: "bg-purple-50 text-purple-600" },
  ACADEMIC: { label: "Akademik", cls: "bg-amber-50 text-amber-600" },
};

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);
}

/* ── Toast ─────────────────────────────── */
function Toast({ msg, type, onClose }: { msg: string; type: "success" | "error"; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={`fixed right-6 top-6 z-50 flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-medium text-white shadow-lg ${type === "success" ? "bg-green-500" : "bg-red-500"}`}>
      {type === "success" ? "✅" : "❌"} {msg}
      <button onClick={onClose} className="ml-2 text-white/70 hover:text-white">✕</button>
    </div>
  );
}

/* ── Create / Edit Form ────────────────── */
function ListingForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: any;
  onSave: () => void;
  onCancel: () => void;
}) {
  const isEdit = !!initial?.id;
  const [form, setForm] = useState({
    title: initial?.title || "",
    slug: initial?.slug || "",
    short_desc: initial?.short_desc || "",
    description: initial?.description || "",
    listing_type: initial?.listing_type || "SERVICE",
    base_price: initial?.base_price || 0,
    estimated_days: initial?.estimated_days || 0,
    features: (initial?.features || []).join("\n"),
    tech_stack: (initial?.tech_stack || []).join(", "),
    is_featured: initial?.is_featured ?? true,
    is_active: initial?.is_active ?? true,
    auto_delivery: initial?.auto_delivery ?? false,
    meta_title: initial?.meta_title || "",
    meta_desc: initial?.meta_desc || "",
    cover_url: initial?.cover_url || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const u = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));

  // Auto-generate slug from title
  useEffect(() => {
    if (!isEdit && form.title) {
      u("slug", form.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
    }
  }, [form.title, isEdit]);

  const handleSubmit = async () => {
    if (!form.title || !form.slug) { setError("Judul dan slug wajib diisi"); return; }
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...form,
        features: form.features.split("\n").map((s: string) => s.trim()).filter(Boolean),
        tech_stack: form.tech_stack.split(",").map((s: string) => s.trim()).filter(Boolean),
      };
      if (isEdit) {
        await adminAPI.updateStoreListing(initial.id, payload);
      } else {
        await adminAPI.createStoreListing(payload);
      }
      onSave();
    } catch (e: any) {
      setError(e.message || "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">
          {isEdit ? "Edit Layanan" : "Tambah Layanan Baru"}
        </h2>
        <button onClick={onCancel} className="text-sm text-gray-400 hover:text-gray-600">← Kembali</button>
      </div>

      {error && <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</div>}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-500 uppercase">Judul *</label>
          <input className={inputCls} value={form.title} onChange={(e) => u("title", e.target.value)} placeholder="Pembuatan Website Company Profile" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-500 uppercase">Slug *</label>
          <input className={inputCls} value={form.slug} onChange={(e) => u("slug", e.target.value)} />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-gray-500 uppercase">Deskripsi Singkat</label>
        <input className={inputCls} value={form.short_desc} onChange={(e) => u("short_desc", e.target.value)} placeholder="Penjelasan singkat layanan..." />
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-gray-500 uppercase">Deskripsi Lengkap (HTML)</label>
        <textarea className={inputCls} rows={5} value={form.description} onChange={(e) => u("description", e.target.value)} placeholder="<p>Deskripsi detail layanan...</p>" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-500 uppercase">Tipe</label>
          <select className={inputCls} value={form.listing_type} onChange={(e) => u("listing_type", e.target.value)}>
            <option value="SERVICE">Jasa</option>
            <option value="DIGITAL_PRODUCT">Produk Digital</option>
            <option value="ACADEMIC">Akademik</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-500 uppercase">Harga Dasar (Rp)</label>
          <input type="number" className={inputCls} value={form.base_price} onChange={(e) => u("base_price", Number(e.target.value))} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-500 uppercase">Estimasi Hari</label>
          <input type="number" className={inputCls} value={form.estimated_days} onChange={(e) => u("estimated_days", Number(e.target.value))} />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-gray-500 uppercase">Cover URL</label>
        <input className={inputCls} value={form.cover_url} onChange={(e) => u("cover_url", e.target.value)} placeholder="https://..." />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-500 uppercase">Fitur (1 per baris)</label>
          <textarea className={inputCls} rows={4} value={form.features} onChange={(e) => u("features", e.target.value)} placeholder={"Responsive\nSEO Friendly\nFast Loading"} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-500 uppercase">Tech Stack (koma)</label>
          <textarea className={inputCls} rows={4} value={form.tech_stack} onChange={(e) => u("tech_stack", e.target.value)} placeholder="Next.js, Tailwind CSS, PostgreSQL" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-500 uppercase">Meta Title</label>
          <input className={inputCls} value={form.meta_title} onChange={(e) => u("meta_title", e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-500 uppercase">Meta Description</label>
          <input className={inputCls} value={form.meta_desc} onChange={(e) => u("meta_desc", e.target.value)} />
        </div>
      </div>

      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.is_active} onChange={(e) => u("is_active", e.target.checked)} className="rounded text-indigo-500" />
          Aktif
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.is_featured} onChange={(e) => u("is_featured", e.target.checked)} className="rounded text-indigo-500" />
          Unggulan
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.auto_delivery} onChange={(e) => u("auto_delivery", e.target.checked)} className="rounded text-indigo-500" />
          Auto Delivery
        </label>
      </div>

      <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
        <button onClick={onCancel} className="rounded-lg border border-gray-200 px-5 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
          Batal
        </button>
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="rounded-lg bg-indigo-500 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-600 disabled:opacity-50"
        >
          {saving ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Buat Layanan"}
        </button>
      </div>
    </div>
  );
}

/* ── Main Page ─────────────────────────── */
export default function StoreListingsPage() {
  const [listings, setListings] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [mode, setMode] = useState<"list" | "create" | "edit">("list");
  const [editItem, setEditItem] = useState<any>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminAPI.getStoreListings({ page, limit: 20, search: search || undefined, type: typeFilter || undefined });
      setListings(data.items || []);
      setTotal(data.total || 0);
    } catch {
      setListings([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, typeFilter]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Hapus "${title}"?`)) return;
    try {
      await adminAPI.deleteStoreListing(id);
      setToast({ msg: "Layanan dihapus", type: "success" });
      load();
    } catch (e: any) {
      setToast({ msg: e.message || "Gagal menghapus", type: "error" });
    }
  };

  const handleSaved = () => {
    setMode("list");
    setEditItem(null);
    setToast({ msg: "Layanan berhasil disimpan!", type: "success" });
    load();
  };

  if (mode === "create" || mode === "edit") {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
        <ListingForm
          initial={editItem}
          onSave={handleSaved}
          onCancel={() => { setMode("list"); setEditItem(null); }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Layanan & Produk</h1>
          <p className="mt-1 text-sm text-gray-500">{total} layanan terdaftar</p>
        </div>
        <button
          onClick={() => { setMode("create"); setEditItem(null); }}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-600"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          Tambah Layanan
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          className="rounded-lg border border-gray-200 px-4 py-2 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
          placeholder="Cari layanan..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
        <select
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-300"
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
        >
          {TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-100 bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Layanan</th>
              <th className="px-4 py-3 font-semibold">Tipe</th>
              <th className="px-4 py-3 font-semibold">Harga</th>
              <th className="px-4 py-3 font-semibold">Rating</th>
              <th className="px-4 py-3 font-semibold">Orders</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-500" />
              </td></tr>
            ) : listings.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">Belum ada layanan</td></tr>
            ) : (
              listings.map((item) => {
                const badge = TYPE_BADGE[item.listing_type] || { label: item.listing_type, cls: "bg-gray-50 text-gray-600" };
                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 line-clamp-1">{item.title}</div>
                      <div className="text-xs text-gray-400">/{item.slug}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${badge.cls}`}>{badge.label}</span>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-700">{formatRupiah(item.base_price)}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {item.avg_rating > 0 ? (
                        <span className="flex items-center gap-1">
                          <span className="text-yellow-500">★</span> {Number(item.avg_rating).toFixed(1)}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{item.total_orders || 0}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${item.is_active ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-500"}`}>
                        {item.is_active ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button
                          onClick={() => { setEditItem(item); setMode("edit"); }}
                          className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(item.id, item.title)}
                          className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50"
                        >
                          Hapus
                        </button>
                      </div>
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
