"use client";

import { useEffect, useState } from "react";
import { adminAPI } from "@/lib/auth-api";
import MarkdownEditor, {
  markdownToHtml,
} from "@/components/editor/MarkdownEditor";

const legalKeys = [
  {
    key: "privacy_policy",
    label: "Kebijakan Privasi",
    description: "Konten halaman Privacy Policy. Gunakan format Markdown.",
  },
  {
    key: "terms_of_service",
    label: "Syarat & Ketentuan",
    description: "Konten halaman Terms of Service. Gunakan format Markdown.",
  },
  {
    key: "contact_info",
    label: "Informasi Kontak",
    description:
      "Info kontak yang ditampilkan di halaman legal. Gunakan format Markdown.",
  },
];

export default function LegalPage() {
  const [activeTab, setActiveTab] = useState(legalKeys[0].key);
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const settings = await adminAPI.getSettings();
        const mapped: Record<string, string> = {};
        if (Array.isArray(settings)) {
          settings.forEach((s: any) => {
            mapped[s.key] = s.value || "";
          });
        } else if (settings && typeof settings === "object") {
          Object.entries(settings).forEach(([k, v]) => {
            mapped[k] = String(v || "");
          });
        }
        setValues(mapped);
      } catch {}
      setLoading(false);
    }
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await adminAPI.updateSettings(
        Object.fromEntries(
          legalKeys.map((lk) => [lk.key, values[lk.key] || ""]),
        ),
      );
      setSuccess("Berhasil disimpan!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message || "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  };

  const activeConfig = legalKeys.find((l) => l.key === activeTab)!;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Legal & Kebijakan</h2>
          <p className="text-sm text-gray-500">
            Edit konten halaman legal situs
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-sky-600 px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-700 disabled:opacity-50"
        >
          {saving ? "Menyimpan..." : "Simpan Semua"}
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg bg-green-50 p-3 text-sm text-green-600">
          {success}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1">
        {legalKeys.map((lk) => (
          <button
            key={lk.key}
            onClick={() => setActiveTab(lk.key)}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === lk.key
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {lk.label}
          </button>
        ))}
      </div>

      {/* Editor for active tab */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="mb-4">
          <h3 className="font-semibold text-gray-900">{activeConfig.label}</h3>
          <p className="text-sm text-gray-500">{activeConfig.description}</p>
        </div>
        <MarkdownEditor
          value={values[activeTab] || ""}
          onChange={(val) =>
            setValues((prev) => ({ ...prev, [activeTab]: val }))
          }
          placeholder={`Tulis ${activeConfig.label} di sini...`}
          minHeight={400}
        />
      </div>
    </div>
  );
}
