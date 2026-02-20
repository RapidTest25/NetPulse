"use client";

import { useState, useEffect, useCallback } from "react";
import { adminAPI } from "@/lib/auth-api";

const PREVIEW_TYPES = [
  { value: "IFRAME", label: "iFrame (Website)" },
  { value: "SCREENSHOT", label: "Screenshot" },
  { value: "VIDEO", label: "Video" },
];

function Toast({ msg, type, onClose }: { msg: string; type: "success" | "error"; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={`fixed right-6 top-6 z-50 flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-medium text-white shadow-lg ${type === "success" ? "bg-green-500" : "bg-red-500"}`}>
      {type === "success" ? "✅" : "❌"} {msg}
      <button onClick={onClose} className="ml-2 text-white/70 hover:text-white">✕</button>
    </div>
  );
}

/* ── Form ──────────────────────────────── */
function PortfolioForm({
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
    description: initial?.description || "",
    preview_type: initial?.preview_type || "IFRAME",
    preview_url: initial?.preview_url || "",
    desktop_screenshot: initial?.desktop_screenshot || "",
    mobile_screenshot: initial?.mobile_screenshot || "",
    client_name: initial?.client_name || "",
    tech_stack: (initial?.tech_stack || []).join(", "),
    is_featured: initial?.is_featured ?? true,
    is_active: initial?.is_active ?? true,
    sort_order: initial?.sort_order || 0,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const u = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));
  const inputCls = "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100";

  const handleSubmit = async () => {
    if (!form.title) { setError("Judul wajib diisi"); return; }
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...form,
        tech_stack: form.tech_stack.split(",").map((s: string) => s.trim()).filter(Boolean),
      };
      if (isEdit) {
        await adminAPI.updateStorePortfolio(initial.id, payload);
      } else {
        await adminAPI.createStorePortfolio(payload);
      }
      onSave();
    } catch (e: any) {
      setError(e.message || "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">{isEdit ? "Edit Portfolio" : "Tambah Portfolio"}</h2>
        <button onClick={onCancel} className="text-sm text-gray-400 hover:text-gray-600">← Kembali</button>
      </div>

      {error && <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</div>}

      <div>
        <label className="mb-1 block text-xs font-semibold text-gray-500 uppercase">Judul Project *</label>
        <input className={inputCls} value={form.title} onChange={(e) => u("title", e.target.value)} placeholder="Website Company Profile" />
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-gray-500 uppercase">Deskripsi</label>
        <textarea className={inputCls} rows={3} value={form.description} onChange={(e) => u("description", e.target.value)} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-500 uppercase">Tipe Preview</label>
          <select className={inputCls} value={form.preview_type} onChange={(e) => u("preview_type", e.target.value)}>
            {PREVIEW_TYPES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-500 uppercase">Preview URL</label>
          <input className={inputCls} value={form.preview_url} onChange={(e) => u("preview_url", e.target.value)} placeholder="https://demo.client.com" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-500 uppercase">Screenshot Desktop</label>
          <input className={inputCls} value={form.desktop_screenshot} onChange={(e) => u("desktop_screenshot", e.target.value)} placeholder="https://..." />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-500 uppercase">Screenshot Mobile</label>
          <input className={inputCls} value={form.mobile_screenshot} onChange={(e) => u("mobile_screenshot", e.target.value)} placeholder="https://..." />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-500 uppercase">Nama Client</label>
          <input className={inputCls} value={form.client_name} onChange={(e) => u("client_name", e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-500 uppercase">Tech Stack (koma)</label>
          <input className={inputCls} value={form.tech_stack} onChange={(e) => u("tech_stack", e.target.value)} placeholder="Next.js, Tailwind CSS" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-500 uppercase">Urutan</label>
          <input type="number" className={inputCls} value={form.sort_order} onChange={(e) => u("sort_order", Number(e.target.value))} />
        </div>
        <div className="flex items-end gap-6">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_active} onChange={(e) => u("is_active", e.target.checked)} className="rounded text-indigo-500" />
            Aktif
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_featured} onChange={(e) => u("is_featured", e.target.checked)} className="rounded text-indigo-500" />
            Unggulan
          </label>
        </div>
      </div>

      <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
        <button onClick={onCancel} className="rounded-lg border border-gray-200 px-5 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">Batal</button>
        <button onClick={handleSubmit} disabled={saving} className="rounded-lg bg-indigo-500 px-6 py-2 text-sm font-semibold text-white hover:bg-indigo-600 disabled:opacity-50">
          {saving ? "Menyimpan..." : isEdit ? "Simpan" : "Buat Portfolio"}
        </button>
      </div>
    </div>
  );
}

/* ── Main Page ─────────────────────────── */
export default function StorePortfolioPage() {
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [mode, setMode] = useState<"list" | "create" | "edit">("list");
  const [editItem, setEditItem] = useState<any>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminAPI.getStorePortfolio({ page, limit: 20 });
      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Hapus "${title}"?`)) return;
    try {
      await adminAPI.deleteStorePortfolio(id);
      setToast({ msg: "Portfolio dihapus", type: "success" });
      load();
    } catch (e: any) {
      setToast({ msg: e.message, type: "error" });
    }
  };

  if (mode === "create" || mode === "edit") {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
        <PortfolioForm
          initial={editItem}
          onSave={() => { setMode("list"); setEditItem(null); setToast({ msg: "Portfolio disimpan!", type: "success" }); load(); }}
          onCancel={() => { setMode("list"); setEditItem(null); }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Portfolio</h1>
          <p className="mt-1 text-sm text-gray-500">{total} portfolio terdaftar</p>
        </div>
        <button
          onClick={() => { setMode("create"); setEditItem(null); }}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-600"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          Tambah Portfolio
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-500" /></div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white p-16 text-center">
          <span className="text-5xl">🎨</span>
          <p className="mt-4 text-gray-400">Belum ada portfolio</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <div key={item.id} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="relative aspect-video bg-gray-100">
                {item.desktop_screenshot ? (
                  <img src={item.desktop_screenshot} alt={item.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-4xl text-gray-200">🖼️</div>
                )}
                <div className="absolute right-2 top-2 flex gap-1">
                  <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${item.is_active ? "bg-green-500 text-white" : "bg-gray-500 text-white"}`}>
                    {item.is_active ? "Aktif" : "Nonaktif"}
                  </span>
                  {item.is_featured && <span className="rounded-md bg-yellow-500 px-2 py-0.5 text-xs font-semibold text-white">★</span>}
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 line-clamp-1">{item.title}</h3>
                {item.client_name && <p className="text-xs text-gray-400 mt-0.5">Client: {item.client_name}</p>}
                <p className="mt-1 text-xs text-gray-400">
                  {item.preview_type} {item.preview_url ? "• URL tersedia" : ""}
                </p>
                {item.tech_stack && item.tech_stack.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {item.tech_stack.slice(0, 3).map((t: string) => (
                      <span key={t} className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">{t}</span>
                    ))}
                  </div>
                )}
                <div className="mt-3 flex gap-2 border-t border-gray-50 pt-3">
                  <button onClick={() => { setEditItem(item); setMode("edit"); }} className="rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-100">Edit</button>
                  <button onClick={() => handleDelete(item.id, item.title)} className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-100">Hapus</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

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
