"use client";

import { useState, useEffect, useCallback } from "react";
import { authFetch } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

interface AdSlot {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
  position: string;
}

const positionLabels: Record<string, string> = {
  header: "Header",
  sidebar: "Sidebar",
  in_article_1: "Dalam Artikel #1",
  in_article_2: "Dalam Artikel #2",
  footer: "Footer",
  popup: "Popup",
  inline: "Inline",
};

const positionDescriptions: Record<string, string> = {
  header: "Banner di atas navbar, terlihat pertama kali",
  sidebar: "Di kolom samping artikel (desktop)",
  in_article_1: "Setelah paragraf ke-3 dalam artikel",
  in_article_2: "Sebelum bagian kesimpulan artikel",
  footer: "Di atas footer, tampil di semua halaman",
  popup: "Popup yang muncul setelah beberapa detik",
  inline: "Bisa ditempatkan di mana saja",
};

const positionIcons: Record<string, string> = {
  header:
    "M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6",
  sidebar: "M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12",
  in_article_1:
    "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z",
  in_article_2:
    "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z",
  footer:
    "M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25",
  popup:
    "M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25",
  inline:
    "M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6z",
};

export default function AdminAdsPage() {
  const [ads, setAds] = useState<AdSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editAd, setEditAd] = useState<AdSlot | null>(null);
  const [showCodeModal, setShowCodeModal] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);
  const [formName, setFormName] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formPosition, setFormPosition] = useState("inline");
  const [formActive, setFormActive] = useState(true);

  const fetchAds = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch(`${API_URL}/admin/ads`);
      if (res.ok) {
        const data = await res.json();
        setAds(data.items || []);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAds();
  }, [fetchAds]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const filtered =
    filter === "all"
      ? ads
      : filter === "active"
        ? ads.filter((a) => a.is_active)
        : ads.filter((a) => !a.is_active);
  const activeCount = ads.filter((a) => a.is_active).length;
  const inactiveCount = ads.filter((a) => !a.is_active).length;

  const openCreate = (pos?: string) => {
    setEditAd(null);
    setFormName("");
    setFormCode("");
    setFormPosition(pos || "inline");
    setFormActive(true);
    setShowModal(true);
  };
  const openEdit = (ad: AdSlot) => {
    setEditAd(ad);
    setFormName(ad.name);
    setFormCode(ad.code);
    setFormPosition(ad.position);
    setFormActive(ad.is_active);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) return;
    setSaving(true);
    try {
      const body = JSON.stringify({
        name: formName,
        code: formCode,
        position: formPosition,
        is_active: formActive,
      });
      if (editAd) {
        await authFetch(`${API_URL}/admin/ads/${editAd.id}`, {
          method: "PUT",
          body,
        });
      } else {
        await authFetch(`${API_URL}/admin/ads`, { method: "POST", body });
      }
      setShowModal(false);
      fetchAds();
      setToast({
        type: "success",
        msg: editAd
          ? "Slot iklan berhasil diperbarui"
          : "Slot iklan berhasil ditambahkan",
      });
    } catch {
      setToast({ type: "error", msg: "Gagal menyimpan slot iklan" });
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id: string) => {
    setToggling(id);
    try {
      await authFetch(`${API_URL}/admin/ads/${id}/toggle`, { method: "PATCH" });
      fetchAds();
      setToast({ type: "success", msg: "Status iklan diubah" });
    } catch {
      setToast({ type: "error", msg: "Gagal mengubah status" });
    } finally {
      setToggling(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus slot iklan ini?")) return;
    setDeleting(id);
    try {
      await authFetch(`${API_URL}/admin/ads/${id}`, { method: "DELETE" });
      fetchAds();
      setToast({ type: "success", msg: "Berhasil dihapus" });
    } catch {
      setToast({ type: "error", msg: "Gagal menghapus" });
    } finally {
      setDeleting(null);
    }
  };

  const copyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const adsByPosition = ads.reduce(
    (acc, ad) => {
      if (!acc[ad.position]) acc[ad.position] = [];
      acc[ad.position].push(ad);
      return acc;
    },
    {} as Record<string, AdSlot[]>,
  );

  return (
    <div>
      {toast && (
        <div
          className={`fixed right-4 top-4 z-[100] flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium shadow-lg ${toast.type === "success" ? "bg-green-50 text-green-700 ring-1 ring-green-200" : "bg-red-50 text-red-700 ring-1 ring-red-200"}`}
        >
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
              d={
                toast.type === "success"
                  ? "M4.5 12.75l6 6 9-13.5"
                  : "M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
              }
            />
          </svg>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Iklan & Monetisasi
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Kelola kode iklan (Google AdSense, dll) di halaman publik blog.
          </p>
        </div>
        <button
          onClick={() => openCreate()}
          className="inline-flex items-center gap-2 rounded-lg bg-linear-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-500/25 transition-all hover:shadow-md hover:brightness-110"
        >
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
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
          Tambah Slot Iklan
        </button>
      </div>

      {/* Stats */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[
          {
            label: "Total Slot",
            value: String(ads.length),
            icon: "M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6z",
            color: "text-blue-600 bg-blue-50",
            desc: "Total slot iklan terdaftar",
          },
          {
            label: "Aktif",
            value: `${activeCount}`,
            icon: "M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z",
            color: "text-emerald-600 bg-emerald-50",
            desc: "Sedang tayang di halaman publik",
          },
          {
            label: "Nonaktif",
            value: String(inactiveCount),
            icon: "M15.75 5.25v13.5m-7.5-13.5v13.5",
            color: "text-amber-600 bg-amber-50",
            desc: "Tidak ditampilkan ke pengunjung",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-gray-200/60 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${s.color}`}
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
                    d={s.icon}
                  />
                </svg>
              </div>
              <div>
                <p className="text-xs text-gray-500">{s.label}</p>
                <p className="text-xl font-bold text-gray-900">{s.value}</p>
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-400">{s.desc}</p>
          </div>
        ))}
      </div>

      {/* Visual Layout Map */}
      <div className="mt-6 rounded-2xl border border-gray-200/60 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-900">
          Peta Posisi Iklan
        </h3>
        <p className="mt-0.5 text-xs text-gray-500">
          Klik posisi untuk menambah slot baru. Hijau = ada slot aktif.
        </p>
        <div className="mt-4 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 p-4 space-y-2">
          <div
            onClick={() => openCreate("header")}
            className={`cursor-pointer rounded-lg border-2 border-dashed p-2.5 text-center text-xs font-medium transition-all hover:border-indigo-300 hover:bg-indigo-50/50 ${adsByPosition.header?.some((a) => a.is_active) ? "border-emerald-300 bg-emerald-50/50 text-emerald-700" : "border-gray-300 text-gray-500"}`}
          >
            🔝 Header — {adsByPosition.header?.length || 0} slot
          </div>
          <div className="flex gap-2">
            <div className="flex-1 space-y-2">
              <div className="rounded-lg border border-gray-200 bg-white p-3 text-center text-xs text-gray-400">
                📄 Konten Artikel
              </div>
              <div
                onClick={() => openCreate("in_article_1")}
                className={`cursor-pointer rounded-lg border-2 border-dashed p-2 text-center text-xs font-medium transition-all hover:border-indigo-300 hover:bg-indigo-50/50 ${adsByPosition.in_article_1?.some((a) => a.is_active) ? "border-emerald-300 bg-emerald-50/50 text-emerald-700" : "border-gray-300 text-gray-500"}`}
              >
                📰 In-Article #1 — {adsByPosition.in_article_1?.length || 0}{" "}
                slot
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-3 text-center text-xs text-gray-400">
                📄 Konten Lanjutan
              </div>
              <div
                onClick={() => openCreate("in_article_2")}
                className={`cursor-pointer rounded-lg border-2 border-dashed p-2 text-center text-xs font-medium transition-all hover:border-indigo-300 hover:bg-indigo-50/50 ${adsByPosition.in_article_2?.some((a) => a.is_active) ? "border-emerald-300 bg-emerald-50/50 text-emerald-700" : "border-gray-300 text-gray-500"}`}
              >
                📰 In-Article #2 — {adsByPosition.in_article_2?.length || 0}{" "}
                slot
              </div>
            </div>
            <div
              onClick={() => openCreate("sidebar")}
              className={`w-28 cursor-pointer rounded-lg border-2 border-dashed p-2 text-center text-xs font-medium transition-all hover:border-indigo-300 hover:bg-indigo-50/50 ${adsByPosition.sidebar?.some((a) => a.is_active) ? "border-emerald-300 bg-emerald-50/50 text-emerald-700" : "border-gray-300 text-gray-500"}`}
            >
              📐 Sidebar
              <br />
              {adsByPosition.sidebar?.length || 0} slot
            </div>
          </div>
          <div
            onClick={() => openCreate("footer")}
            className={`cursor-pointer rounded-lg border-2 border-dashed p-2.5 text-center text-xs font-medium transition-all hover:border-indigo-300 hover:bg-indigo-50/50 ${adsByPosition.footer?.some((a) => a.is_active) ? "border-emerald-300 bg-emerald-50/50 text-emerald-700" : "border-gray-300 text-gray-500"}`}
          >
            ⬇️ Footer — {adsByPosition.footer?.length || 0} slot
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="mt-6 flex w-fit gap-1 rounded-lg border border-gray-200 bg-white p-1">
        {[
          { key: "all", label: `Semua (${ads.length})` },
          { key: "active", label: `Aktif (${activeCount})` },
          { key: "inactive", label: `Nonaktif (${inactiveCount})` },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${filter === t.key ? "bg-brand-600 text-white shadow-sm" : "text-gray-600 hover:bg-gray-100"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="mt-12 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-indigo-600" />
          <p className="mt-3 text-sm text-gray-500">Memuat data...</p>
        </div>
      )}

      {/* Ad Cards */}
      {!loading && filtered.length > 0 && (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((ad) => (
            <div
              key={ad.id}
              className={`group relative overflow-hidden rounded-2xl border bg-white shadow-sm transition-all hover:shadow-md ${ad.is_active ? "border-emerald-200/60" : "border-gray-200/60"}`}
            >
              <div
                className={`h-1 ${ad.is_active ? "bg-emerald-500" : "bg-gray-300"}`}
              />
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-lg ${ad.is_active ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-400"}`}
                    >
                      <svg
                        className="h-4.5 w-4.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d={positionIcons[ad.position] || positionIcons.inline}
                        />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900">
                        {ad.name}
                      </h4>
                      <p className="text-xs text-gray-400">
                        {positionLabels[ad.position] || ad.position}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset ${ad.is_active ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-gray-100 text-gray-600 ring-gray-200"}`}
                  >
                    {ad.is_active ? "Aktif" : "Nonaktif"}
                  </span>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  {positionDescriptions[ad.position] || "Posisi kustom"}
                </p>
                {ad.code ? (
                  <div className="mt-3 rounded-lg bg-gray-900 p-2.5">
                    <code className="block truncate text-[11px] text-emerald-400">
                      {ad.code.length > 60
                        ? ad.code.slice(0, 60) + "…"
                        : ad.code}
                    </code>
                  </div>
                ) : (
                  <div className="mt-3 rounded-lg border border-dashed border-amber-300 bg-amber-50 p-2.5 text-center text-xs text-amber-700">
                    ⚠️ Belum ada kode — klik Edit
                  </div>
                )}
                <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
                  <button
                    onClick={() => handleToggle(ad.id)}
                    disabled={toggling === ad.id}
                    className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${toggling === ad.id ? "animate-pulse text-gray-300" : ad.is_active ? "text-amber-600 hover:bg-amber-50" : "text-emerald-600 hover:bg-emerald-50"}`}
                  >
                    {ad.is_active ? "Nonaktifkan" : "Aktifkan"}
                  </button>
                  <div className="flex items-center gap-0.5">
                    {ad.code && (
                      <button
                        onClick={() => copyCode(ad.id, ad.code)}
                        title="Copy"
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                      >
                        {copiedId === ad.id ? (
                          <svg
                            className="h-4 w-4 text-emerald-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M4.5 12.75l6 6 9-13.5"
                            />
                          </svg>
                        ) : (
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
                              d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184"
                            />
                          </svg>
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => setShowCodeModal(ad.id)}
                      title="Lihat"
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
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
                          d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => openEdit(ad)}
                      title="Edit"
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
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
                          d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(ad.id)}
                      disabled={deleting === ad.id}
                      title="Hapus"
                      className={`rounded-lg p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600 ${deleting === ad.id ? "animate-pulse" : ""}`}
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
                          d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="mt-6 rounded-2xl border-2 border-dashed border-gray-200 bg-white p-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-300"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="mt-3 text-base font-semibold text-gray-800">
            Belum ada slot iklan
          </h3>
          <p className="mt-1.5 text-sm text-gray-500">
            Mulai monetisasi blog dengan menambahkan kode iklan.
          </p>
          <button
            onClick={() => openCreate()}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
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
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
            Tambah Slot Iklan Pertama
          </button>
        </div>
      )}

      {/* Guide */}
      <div className="mt-8 rounded-2xl border border-blue-100 bg-blue-50/50 p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
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
                d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-blue-900">
              Cara Menggunakan
            </h3>
            <ol className="mt-2 space-y-1.5 text-xs text-blue-700">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-blue-200 text-[10px] font-bold text-blue-800">
                  1
                </span>
                <span>
                  Klik <strong>&quot;Tambah Slot Iklan&quot;</strong> atau klik
                  posisi di peta di atas.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-blue-200 text-[10px] font-bold text-blue-800">
                  2
                </span>
                <span>
                  Beri nama (misal: &quot;AdSense Header&quot;), pilih posisi
                  penempatan.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-blue-200 text-[10px] font-bold text-blue-800">
                  3
                </span>
                <span>
                  Paste kode iklan dari <strong>Google AdSense</strong> atau
                  provider lain.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-blue-200 text-[10px] font-bold text-blue-800">
                  4
                </span>
                <span>
                  Aktifkan — kode otomatis tampil di posisi yang dipilih pada
                  halaman publik.
                </span>
              </li>
            </ol>
          </div>
        </div>
      </div>

      {/* Code Preview Modal */}
      {showCodeModal &&
        (() => {
          const ad = ads.find((a) => a.id === showCodeModal);
          if (!ad) return null;
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
              <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {ad.name}
                  </h3>
                  <button
                    onClick={() => setShowCodeModal(null)}
                    className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"
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
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 text-center text-xs">
                  <div className="rounded-lg bg-gray-50 p-2.5">
                    <p className="text-gray-400">Posisi</p>
                    <p className="mt-0.5 font-medium text-gray-700">
                      {positionLabels[ad.position] || ad.position}
                    </p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-2.5">
                    <p className="text-gray-400">Status</p>
                    <p
                      className={`mt-0.5 font-medium ${ad.is_active ? "text-emerald-700" : "text-gray-500"}`}
                    >
                      {ad.is_active ? "Aktif" : "Nonaktif"}
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="mb-1.5 text-xs font-medium text-gray-500">
                    Kode Embed:
                  </p>
                  <pre className="overflow-x-auto rounded-xl bg-gray-900 p-4 text-sm text-emerald-400">
                    <code>{ad.code || "(kosong)"}</code>
                  </pre>
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    onClick={() => setShowCodeModal(null)}
                    className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Tutup
                  </button>
                  <button
                    onClick={() => {
                      openEdit(ad);
                      setShowCodeModal(null);
                    }}
                    className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Edit
                  </button>
                  {ad.code && (
                    <button
                      onClick={() => copyCode(ad.id, ad.code)}
                      className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
                    >
                      {copiedId === ad.id ? "Tersalin!" : "Copy Kode"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {editAd ? "Edit Slot Iklan" : "Tambah Slot Iklan Baru"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="mt-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Nama Slot
                </label>
                <p className="text-xs text-gray-400">
                  Nama identifikasi (cth: &quot;AdSense Header Banner&quot;)
                </p>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="contoh: AdSense Header Banner"
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Posisi Penempatan
                </label>
                <p className="text-xs text-gray-400">
                  Di mana iklan tampil di halaman publik
                </p>
                <select
                  value={formPosition}
                  onChange={(e) => setFormPosition(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                >
                  {Object.entries(positionLabels).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label} — {positionDescriptions[key]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Kode Iklan (HTML/Script)
                </label>
                <p className="text-xs text-gray-400">
                  Paste kode dari Google AdSense atau provider lain
                </p>
                <textarea
                  rows={5}
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                  placeholder={`<!-- Contoh Google AdSense -->\n<ins class="adsbygoogle"\n     data-ad-client="ca-pub-XXXXXXXX"\n     data-ad-slot="XXXXXXXX"></ins>\n<script>(adsbygoogle=window.adsbygoogle||[]).push({});</script>`}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 font-mono text-xs outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="formActive"
                  checked={formActive}
                  onChange={(e) => setFormActive(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="formActive" className="text-sm text-gray-700">
                  Langsung aktifkan (tampil di halaman publik)
                </label>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !formName.trim()}
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
              >
                {saving
                  ? "Menyimpan..."
                  : editAd
                    ? "Simpan Perubahan"
                    : "Tambah Slot"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
