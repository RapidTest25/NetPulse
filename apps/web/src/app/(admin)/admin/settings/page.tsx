"use client";

import { useState, useEffect, useCallback } from "react";
import { adminAPI, userAPI } from "@/lib/auth-api";

const TABS = [
  {
    key: "general",
    label: "Umum",
    icon: "M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.991l1.004.827c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z",
  },
  {
    key: "social",
    label: "Sosial Media",
    icon: "M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z",
  },
  {
    key: "security",
    label: "Keamanan",
    icon: "M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z",
  },
  {
    key: "email",
    label: "Email",
    icon: "M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75",
  },
];

const SOCIAL_FIELDS = [
  {
    key: "social_twitter",
    label: "Twitter / X",
    placeholder: "https://twitter.com/username",
  },
  {
    key: "social_github",
    label: "GitHub",
    placeholder: "https://github.com/username",
  },
  {
    key: "social_youtube",
    label: "YouTube",
    placeholder: "https://youtube.com/@channel",
  },
  {
    key: "social_linkedin",
    label: "LinkedIn",
    placeholder: "https://linkedin.com/in/username",
  },
  {
    key: "social_instagram",
    label: "Instagram",
    placeholder: "https://instagram.com/username",
  },
  {
    key: "social_facebook",
    label: "Facebook",
    placeholder: "https://facebook.com/page",
  },
  {
    key: "contact_email",
    label: "Email Kontak",
    placeholder: "hello@netpulse.id",
  },
];

function PasswordChangeCard({
  toast,
  setToast,
}: {
  toast: { type: "success" | "error"; msg: string } | null;
  setToast: (v: { type: "success" | "error"; msg: string } | null) => void;
}) {
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [saving, setSaving] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const inputCls =
    "mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 pr-10";

  const handleChangePassword = async () => {
    if (!currentPw || !newPw) return;
    if (newPw.length < 8) {
      setToast({ type: "error", msg: "Password baru minimal 8 karakter" });
      return;
    }
    if (newPw !== confirmPw) {
      setToast({ type: "error", msg: "Konfirmasi password tidak cocok" });
      return;
    }
    setSaving(true);
    try {
      await userAPI.changePassword({
        current_password: currentPw,
        new_password: newPw,
      });
      setToast({ type: "success", msg: "Password berhasil diubah!" });
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Gagal mengubah password";
      setToast({ type: "error", msg: message });
    } finally {
      setSaving(false);
    }
  };

  const eyeIcon = (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.64 0 8.577 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.64 0-8.577-3.007-9.963-7.178z"
    />
  );
  const eyeSlashIcon = (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3.98 8.223A10.477 10.477 0 001.934 12c1.292 4.338 5.31 7.5 10.066 7.5.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
    />
  );

  return (
    <div className="rounded-2xl border border-gray-200/60 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-6 py-4">
        <h2 className="text-base font-semibold text-gray-900">Ubah Password</h2>
        <p className="mt-0.5 text-sm text-gray-500">
          Pastikan password baru kuat dan tidak digunakan di tempat lain.
        </p>
      </div>
      <div className="space-y-5 p-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Password Saat Ini
          </label>
          <div className="relative">
            <input
              type={showCurrent ? "text" : "password"}
              className={inputCls}
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              placeholder="Masukkan password saat ini"
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                {showCurrent ? eyeSlashIcon : eyeIcon}
                <circle cx={12} cy={12} r={3} strokeWidth={1.5} />
              </svg>
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Password Baru
          </label>
          <div className="relative">
            <input
              type={showNew ? "text" : "password"}
              className={inputCls}
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              placeholder="Minimal 8 karakter"
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                {showNew ? eyeSlashIcon : eyeIcon}
                <circle cx={12} cy={12} r={3} strokeWidth={1.5} />
              </svg>
            </button>
          </div>
          {newPw && newPw.length < 8 && (
            <p className="mt-1 text-xs text-red-500">Minimal 8 karakter</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Konfirmasi Password Baru
          </label>
          <input
            type="password"
            className={inputCls.replace("pr-10", "")}
            value={confirmPw}
            onChange={(e) => setConfirmPw(e.target.value)}
            placeholder="Ketik ulang password baru"
          />
          {confirmPw && confirmPw !== newPw && (
            <p className="mt-1 text-xs text-red-500">Password tidak cocok</p>
          )}
        </div>
      </div>
      <div className="flex justify-end border-t border-gray-100 px-6 py-4">
        <button
          disabled={
            saving ||
            !currentPw ||
            !newPw ||
            newPw !== confirmPw ||
            newPw.length < 8
          }
          onClick={handleChangePassword}
          className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"
        >
          {saving ? "Menyimpan..." : "Ubah Password"}
        </button>
      </div>
    </div>
  );
}

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState("general");
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getSettings();
      setSettings(data ?? {});
    } catch {
      setToast({ type: "error", msg: "Gagal memuat pengaturan" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const updateField = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const saveSettings = async (keys: string[]) => {
    const payload: Record<string, string> = {};
    keys.forEach((k) => {
      payload[k] = settings[k] ?? "";
    });
    try {
      setSaving(true);
      await adminAPI.updateSettings(payload);
      setToast({ type: "success", msg: "Pengaturan berhasil disimpan!" });
    } catch {
      setToast({ type: "error", msg: "Gagal menyimpan pengaturan" });
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    "mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-indigo-600" />
      </div>
    );
  }

  return (
    <div>
      {toast && (
        <div
          className={`fixed right-4 top-4 z-[100] flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium shadow-lg transition-all ${
            toast.type === "success"
              ? "bg-green-50 text-green-700 ring-1 ring-green-200"
              : "bg-red-50 text-red-700 ring-1 ring-red-200"
          }`}
        >
          {toast.type === "success" ? (
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
                d="M4.5 12.75l6 6 9-13.5"
              />
            </svg>
          ) : (
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
                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
              />
            </svg>
          )}
          {toast.msg}
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Settings
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Konfigurasi blog dan preferensi sistem.
        </p>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        <div className="w-full shrink-0 lg:w-56">
          <nav className="space-y-1">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <svg
                  className="h-4.5 w-4.5 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d={tab.icon}
                  />
                </svg>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex-1">
          {activeTab === "general" && (
            <div className="rounded-2xl border border-gray-200/60 bg-white shadow-sm">
              <div className="border-b border-gray-100 px-6 py-4">
                <h2 className="text-base font-semibold text-gray-900">
                  Pengaturan Umum
                </h2>
                <p className="mt-0.5 text-sm text-gray-500">
                  Informasi dasar blog yang ditampilkan di footer dan halaman
                  publik.
                </p>
              </div>
              <div className="space-y-5 p-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Nama Blog
                  </label>
                  <input
                    type="text"
                    className={inputCls}
                    value={settings.site_title ?? ""}
                    onChange={(e) => updateField("site_title", e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Deskripsi Blog
                  </label>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Ditampilkan di footer dan meta tag.
                  </p>
                  <textarea
                    rows={3}
                    className={inputCls}
                    value={settings.site_description ?? ""}
                    onChange={(e) =>
                      updateField("site_description", e.target.value)
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Teks Footer
                  </label>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Teks kustom di bagian bawah footer (opsional).
                  </p>
                  <textarea
                    rows={2}
                    className={inputCls}
                    value={settings.footer_text ?? ""}
                    onChange={(e) => updateField("footer_text", e.target.value)}
                  />
                </div>
              </div>
              <div className="flex justify-end border-t border-gray-100 px-6 py-4">
                <button
                  disabled={saving}
                  onClick={() =>
                    saveSettings([
                      "site_title",
                      "site_description",
                      "footer_text",
                    ])
                  }
                  className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"
                >
                  {saving ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </div>
          )}

          {activeTab === "social" && (
            <div className="rounded-2xl border border-gray-200/60 bg-white shadow-sm">
              <div className="border-b border-gray-100 px-6 py-4">
                <h2 className="text-base font-semibold text-gray-900">
                  Sosial Media
                </h2>
                <p className="mt-0.5 text-sm text-gray-500">
                  Link profil sosial media blog. Ditampilkan di footer.
                </p>
              </div>
              <div className="space-y-5 p-6">
                {SOCIAL_FIELDS.map((f) => (
                  <div key={f.key}>
                    <label className="block text-sm font-medium text-gray-700">
                      {f.label}
                    </label>
                    <input
                      type={f.key === "contact_email" ? "email" : "url"}
                      placeholder={f.placeholder}
                      className={inputCls}
                      value={settings[f.key] ?? ""}
                      onChange={(e) => updateField(f.key, e.target.value)}
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-end border-t border-gray-100 px-6 py-4">
                <button
                  disabled={saving}
                  onClick={() => saveSettings(SOCIAL_FIELDS.map((f) => f.key))}
                  className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"
                >
                  {saving ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <PasswordChangeCard toast={toast} setToast={setToast} />
          )}

          {activeTab === "email" && (
            <div className="rounded-2xl border border-gray-200/60 bg-white shadow-sm">
              <div className="border-b border-gray-100 px-6 py-4">
                <h2 className="text-base font-semibold text-gray-900">
                  Email / SMTP
                </h2>
                <p className="mt-0.5 text-sm text-gray-500">
                  Konfigurasi pengiriman email (coming soon).
                </p>
              </div>
              <div className="flex items-center justify-center p-12 text-sm text-gray-400">
                <div className="text-center">
                  <svg
                    className="mx-auto mb-3 h-10 w-10 text-gray-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                    />
                  </svg>
                  <p>Fitur SMTP akan tersedia di update selanjutnya.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
