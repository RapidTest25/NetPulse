"use client";

import { useState, useEffect, useCallback } from "react";
import { adminAPI } from "@/lib/auth-api";

function Toast({ msg, type, onClose }: { msg: string; type: "success" | "error"; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={`fixed right-6 top-6 z-50 flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-medium text-white shadow-lg ${type === "success" ? "bg-green-500" : "bg-red-500"}`}>
      {type === "success" ? "✅" : "❌"} {msg}
      <button onClick={onClose} className="ml-2 text-white/70 hover:text-white">✕</button>
    </div>
  );
}

/* ── Default gateway configs (shown even without DB data) ─── */
const GATEWAY_CONFIGS = [
  {
    gateway: "tripay",
    label: "Tripay",
    logo: "https://tripay.co.id/images/logo-dark.png",
    description: "Payment gateway terintegrasi dengan QRIS, VA, E-Wallet",
    docs: "https://tripay.co.id/developer",
    fields: [
      { key: "tripay_api_key", label: "API Key", secret: false, placeholder: "DEV-xxx..." },
      { key: "tripay_private_key", label: "Private Key", secret: true, placeholder: "xxxxx-xxxxx-xxxxx" },
      { key: "tripay_merchant_code", label: "Merchant Code", secret: false, placeholder: "T12345" },
      { key: "tripay_mode", label: "Mode", secret: false, placeholder: "sandbox / production" },
    ],
  },
  {
    gateway: "paydisini",
    label: "Paydisini",
    logo: "",
    description: "Payment gateway alternatif untuk QRIS dan transfer bank",
    docs: "https://paydisini.co.id/docs",
    fields: [
      { key: "paydisini_api_key", label: "API Key", secret: true, placeholder: "xxx..." },
      { key: "paydisini_webhook_secret", label: "Webhook Secret", secret: true, placeholder: "secret..." },
      { key: "paydisini_mode", label: "Mode", secret: false, placeholder: "sandbox / production" },
    ],
  },
];

const WEBHOOK_INFO = [
  { label: "Tripay Webhook URL", value: "/webhooks/tripay", note: "Daftarkan di dashboard Tripay → Settings → Callback URL" },
  { label: "Paydisini Webhook URL", value: "/webhooks/paydisini", note: "Daftarkan di dashboard Paydisini → Pengaturan → Webhook" },
];

/* ── Gateway Card ──────────────────────── */
function GatewayCard({
  config,
  settings,
  onSave,
}: {
  config: (typeof GATEWAY_CONFIGS)[0];
  settings: Record<string, string>;
  onSave: (key: string, value: string) => Promise<void>;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [showSecrets, setShowSecrets] = useState(false);

  useEffect(() => {
    const v: Record<string, string> = {};
    config.fields.forEach((f) => { v[f.key] = settings[f.key] || ""; });
    setValues(v);
  }, [config, settings]);

  const handleSaveField = async (key: string) => {
    setSaving(key);
    await onSave(key, values[key]);
    setSaving(null);
  };

  const handleSaveAll = async () => {
    setSaving("all");
    for (const f of config.fields) {
      if (values[f.key] !== (settings[f.key] || "")) {
        await onSave(f.key, values[f.key]);
      }
    }
    setSaving(null);
  };

  const hasChanges = config.fields.some((f) => values[f.key] !== (settings[f.key] || ""));

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-6 py-4">
        <div className="flex items-center gap-3">
          {config.logo ? (
            <img src={config.logo} alt={config.label} className="h-8 rounded" />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-lg font-bold text-indigo-600">
              {config.label[0]}
            </div>
          )}
          <div>
            <h3 className="font-bold text-gray-900">{config.label}</h3>
            <p className="text-xs text-gray-400">{config.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSecrets(!showSecrets)}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-50"
          >
            {showSecrets ? "🙈 Sembunyikan" : "👁️ Tampilkan"} Secret
          </button>
          {config.docs && (
            <a href={config.docs} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-indigo-500 hover:bg-indigo-50">
              📖 Docs
            </a>
          )}
        </div>
      </div>

      {/* Fields */}
      <div className="divide-y divide-gray-50 px-6 py-4 space-y-4">
        {config.fields.map((field) => {
          const changed = values[field.key] !== (settings[field.key] || "");
          return (
            <div key={field.key} className="flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-48">
                <label className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase">
                  {field.label}
                  {field.secret && <span className="rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-medium text-red-400 normal-case">Secret</span>}
                </label>
                <input
                  type={field.secret && !showSecrets ? "password" : "text"}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm font-mono outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                  value={values[field.key] || ""}
                  onChange={(e) => setValues((p) => ({ ...p, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                />
              </div>
              <button
                disabled={!changed || saving === field.key}
                onClick={() => handleSaveField(field.key)}
                className="shrink-0 rounded-lg bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-600 disabled:opacity-40"
              >
                {saving === field.key ? "..." : "Simpan"}
              </button>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-6 py-3">
        <div className="flex items-center gap-2">
          {settings[config.fields[0]?.key] ? (
            <span className="flex items-center gap-1 text-xs font-medium text-green-600">
              <span className="h-2 w-2 rounded-full bg-green-500" /> Terkonfigurasi
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs font-medium text-gray-400">
              <span className="h-2 w-2 rounded-full bg-gray-300" /> Belum dikonfigurasi
            </span>
          )}
        </div>
        <button
          disabled={!hasChanges || saving === "all"}
          onClick={handleSaveAll}
          className="rounded-lg bg-indigo-500 px-5 py-2 text-xs font-semibold text-white hover:bg-indigo-600 disabled:opacity-40"
        >
          {saving === "all" ? "Menyimpan..." : "Simpan Semua"}
        </button>
      </div>
    </div>
  );
}

/* ── Payment Method Row ────────────────── */
function MethodRow({ method, onToggle }: { method: any; onToggle: (id: string, enabled: boolean) => Promise<void> }) {
  const [saving, setSaving] = useState(false);

  return (
    <div className={`flex items-center justify-between rounded-xl border p-4 transition-all ${method.is_active ? "border-green-200 bg-green-50/30" : "border-gray-100 bg-white"}`}>
      <div className="flex items-center gap-4">
        {method.icon_url ? (
          <img src={method.icon_url} alt={method.name} className="h-8 w-8 rounded" />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-lg">💳</div>
        )}
        <div>
          <p className="font-semibold text-gray-900">{method.name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-mono text-gray-500">{method.channel || method.code}</span>
            <span className="text-xs text-gray-400">{method.group || method.gateway}</span>
          </div>
          {(method.fee_flat > 0 || method.fee_percent > 0) && (
            <p className="text-xs text-gray-400 mt-0.5">
              Biaya: {method.fee_percent > 0 ? `${method.fee_percent}%` : ""}{method.fee_flat > 0 ? ` + Rp ${method.fee_flat.toLocaleString("id-ID")}` : ""}
            </p>
          )}
          {(method.min_amount > 0 || method.max_amount > 0) && (
            <p className="text-[10px] text-gray-300">
              Min: Rp {(method.min_amount || 0).toLocaleString("id-ID")} • Max: Rp {(method.max_amount || 0).toLocaleString("id-ID")}
            </p>
          )}
        </div>
      </div>
      <button
        disabled={saving}
        onClick={async () => {
          setSaving(true);
          await onToggle(method.id, !method.is_active);
          setSaving(false);
        }}
        className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full transition-colors ${method.is_active ? "bg-green-500" : "bg-gray-300"}`}
      >
        <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform mt-1 ${method.is_active ? "translate-x-6" : "translate-x-1"}`} />
      </button>
    </div>
  );
}

/* ── Main Page ─────────────────────────── */
export default function StorePaymentPage() {
  const [tab, setTab] = useState<"gateways" | "methods" | "webhooks">("gateways");
  const [settings, setSettings] = useState<any[]>([]);
  const [methods, setMethods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const loadSettings = useCallback(async () => {
    try {
      const data = await adminAPI.getStorePaymentSettings();
      setSettings(data.items || data || []);
    } catch { setSettings([]); }
  }, []);

  const loadMethods = useCallback(async () => {
    try {
      const data = await adminAPI.getStorePaymentMethods();
      setMethods(data.items || data || []);
    } catch { setMethods([]); }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadSettings(), loadMethods()]).finally(() => setLoading(false));
  }, [loadSettings, loadMethods]);

  // Convert settings array to key→value map
  const settingsMap: Record<string, string> = {};
  if (Array.isArray(settings)) {
    settings.forEach((s: any) => { settingsMap[s.key] = s.value || ""; });
  }

  const handleSaveSetting = async (key: string, value: string) => {
    try {
      await adminAPI.updateStorePaymentSetting(key, { value });
      setToast({ msg: `${key} disimpan`, type: "success" });
      loadSettings();
    } catch (e: any) {
      setToast({ msg: e.message, type: "error" });
    }
  };

  const handleToggleMethod = async (id: string, enabled: boolean) => {
    try {
      await adminAPI.updateStorePaymentMethod(id, { is_active: enabled });
      setToast({ msg: enabled ? "Metode diaktifkan" : "Metode dinonaktifkan", type: "success" });
      loadMethods();
    } catch (e: any) {
      setToast({ msg: e.message, type: "error" });
    }
  };

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

  return (
    <div className="space-y-6">
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pengaturan Pembayaran</h1>
        <p className="mt-1 text-sm text-gray-500">Kelola gateway pembayaran, metode pembayaran, dan webhook</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-gray-100 p-1">
        {[
          { id: "gateways" as const, label: "Payment Gateway", icon: "⚙️", count: GATEWAY_CONFIGS.length },
          { id: "methods" as const, label: "Metode Pembayaran", icon: "💳", count: methods.length },
          { id: "webhooks" as const, label: "Webhook", icon: "🔗" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${tab === t.id ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          >
            {t.icon} {t.label} {t.count !== undefined ? `(${t.count})` : ""}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-500" />
        </div>
      ) : tab === "gateways" ? (
        <div className="space-y-6">
          {/* Info banner */}
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-5 py-4 space-y-2">
            <p className="text-sm font-medium text-blue-800">💡 Cara Mengatur Payment Gateway</p>
            <ol className="text-xs text-blue-600 list-decimal list-inside space-y-1">
              <li>Daftar akun di <a href="https://tripay.co.id" target="_blank" rel="noopener noreferrer" className="underline">Tripay</a> atau <a href="https://paydisini.co.id" target="_blank" rel="noopener noreferrer" className="underline">Paydisini</a></li>
              <li>Salin API Key, Private Key, dan Merchant Code dari dashboard gateway</li>
              <li>Tempel di form di bawah, lalu simpan</li>
              <li>Daftarkan Webhook URL di tab &quot;Webhook&quot;</li>
              <li>Aktifkan metode pembayaran yang diinginkan di tab &quot;Metode Pembayaran&quot;</li>
            </ol>
          </div>

          {/* Gateway cards */}
          {GATEWAY_CONFIGS.map((config) => (
            <GatewayCard
              key={config.gateway}
              config={config}
              settings={settingsMap}
              onSave={handleSaveSetting}
            />
          ))}
        </div>
      ) : tab === "methods" ? (
        <div className="space-y-4">
          {/* Stats bar */}
          <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-5 py-3">
            <div className="flex items-center gap-6 text-sm">
              <span className="text-gray-500">Total: <strong className="text-gray-900">{methods.length}</strong></span>
              <span className="text-green-600">Aktif: <strong>{methods.filter((m: any) => m.is_active).length}</strong></span>
              <span className="text-gray-400">Nonaktif: <strong>{methods.filter((m: any) => !m.is_active).length}</strong></span>
            </div>
          </div>

          {methods.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white p-16 text-center">
              <span className="text-5xl">💳</span>
              <p className="mt-4 font-medium text-gray-600">Belum ada metode pembayaran</p>
              <p className="mt-2 text-sm text-gray-400 max-w-md mx-auto">
                Metode pembayaran akan otomatis muncul setelah Anda mengkonfigurasi gateway di tab &quot;Payment Gateway&quot;
                dan gateway men-sync metode yang tersedia.
              </p>
              <p className="mt-3 text-xs text-gray-300">
                Catatan: Untuk Tripay, metode akan di-sync secara otomatis saat pertama kali ada transaksi.
                Atau Anda bisa menjalankan sync manual melalui API endpoint.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {methods.map((m: any) => (
                <MethodRow key={m.id} method={m} onToggle={handleToggleMethod} />
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Webhooks tab */
        <div className="space-y-4">
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
            <p className="text-sm font-medium text-amber-800">⚠️ Penting</p>
            <p className="mt-1 text-xs text-amber-600">
              Webhook URL harus didaftarkan di dashboard payment gateway masing-masing agar pembayaran otomatis terverifikasi.
              Pastikan URL yang didaftarkan sesuai dengan domain production.
            </p>
          </div>

          {WEBHOOK_INFO.map((wh) => (
            <div key={wh.label} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">{wh.label}</h3>
              <div className="flex items-center gap-2 rounded-lg bg-gray-50 border border-gray-100 px-4 py-3">
                <code className="flex-1 text-sm font-mono text-indigo-600 break-all">
                  {apiBaseUrl}{wh.value}
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${apiBaseUrl}${wh.value}`);
                    setToast({ msg: "URL disalin!", type: "success" });
                  }}
                  className="shrink-0 rounded-lg bg-indigo-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-600"
                >
                  📋 Salin
                </button>
              </div>
              <p className="mt-2 text-xs text-gray-400">{wh.note}</p>
              <div className="mt-3 rounded-lg bg-gray-50 border border-gray-100 px-4 py-2">
                <p className="text-[10px] text-gray-400 font-mono">
                  Production: https://api.netpulse.com{wh.value}
                </p>
              </div>
            </div>
          ))}

          {/* Additional info */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-3">📋 Checklist Konfigurasi</h3>
            <div className="space-y-2">
              {[
                { label: "API Key terisi", done: !!settingsMap.tripay_api_key || !!settingsMap.paydisini_api_key },
                { label: "Private Key / Secret terisi", done: !!settingsMap.tripay_private_key || !!settingsMap.paydisini_webhook_secret },
                { label: "Merchant Code terisi (Tripay)", done: !!settingsMap.tripay_merchant_code },
                { label: "Webhook URL sudah didaftarkan", done: false },
                { label: "Metode pembayaran sudah aktif", done: methods.some((m: any) => m.is_active) },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <span className={`flex h-5 w-5 items-center justify-center rounded-full text-xs ${item.done ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"}`}>
                    {item.done ? "✓" : "○"}
                  </span>
                  <span className={item.done ? "text-gray-700" : "text-gray-400"}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
