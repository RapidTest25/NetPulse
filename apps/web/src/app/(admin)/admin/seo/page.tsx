"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { adminAPI } from "@/lib/auth-api";

type Tab = "general" | "social" | "metatags" | "sitemap" | "structured";

interface PostMeta {
  id: string;
  title: string;
  slug: string;
  meta_title?: string;
  meta_description?: string;
  focus_keyword?: string;
  status: string;
}

export default function AdminSeoPage() {
  const [tab, setTab] = useState<Tab>("general");
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);
  const [posts, setPosts] = useState<PostMeta[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [editingMeta, setEditingMeta] = useState<string | null>(null);
  const [metaForm, setMetaForm] = useState<{
    meta_title: string;
    meta_description: string;
    focus_keyword: string;
  }>({ meta_title: "", meta_description: "", focus_keyword: "" });

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const load = useCallback(async () => {
    try {
      const data = await adminAPI.getSettings();
      setSettings(data || {});
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Load posts for Meta Tags tab
  useEffect(() => {
    if (tab === "metatags" && posts.length === 0) {
      setPostsLoading(true);
      adminAPI
        .getPosts({ page: 1, limit: 50 })
        .then((data: any) => {
          setPosts(
            (data?.items || []).map((p: any) => ({
              id: p.id,
              title: p.title,
              slug: p.slug,
              meta_title: p.meta_title || "",
              meta_description: p.meta_description || "",
              focus_keyword: p.focus_keyword || "",
              status: p.status,
            })),
          );
        })
        .catch(() => {})
        .finally(() => setPostsLoading(false));
    }
  }, [tab, posts.length]);

  const set = (key: string, value: string) =>
    setSettings((s) => ({ ...s, [key]: value }));

  const save = async (keys: string[]) => {
    setSaving(true);
    try {
      const payload: Record<string, string> = {};
      keys.forEach((k) => {
        payload[k] = settings[k] || "";
      });
      await adminAPI.updateSettings(payload);
      setToast({ type: "success", msg: "Berhasil disimpan!" });
    } catch (err: unknown) {
      setToast({
        type: "error",
        msg: err instanceof Error ? err.message : "Gagal menyimpan",
      });
    } finally {
      setSaving(false);
    }
  };

  // SEO Health Score calculation
  const seoScore = useMemo(() => {
    let score = 0;
    let total = 0;
    const checks: { label: string; passed: boolean; tip: string }[] = [];

    // Site title
    total++;
    const hasTitle = !!settings.site_title?.trim();
    if (hasTitle) score++;
    checks.push({
      label: "Judul Situs",
      passed: hasTitle,
      tip: "Tambahkan judul situs yang deskriptif",
    });

    // Meta description
    total++;
    const desc = settings.site_description || "";
    const hasDesc = desc.length >= 50 && desc.length <= 160;
    if (hasDesc) score++;
    checks.push({
      label: "Meta Description (50-160 karakter)",
      passed: hasDesc,
      tip:
        desc.length < 50
          ? "Terlalu pendek, minimal 50 karakter"
          : desc.length > 160
            ? "Terlalu panjang, maksimal 160 karakter"
            : "",
    });

    // OG Image
    total++;
    const hasOG = !!settings.default_og_image?.trim();
    if (hasOG) score++;
    checks.push({
      label: "Default OG Image",
      passed: hasOG,
      tip: "Tambahkan gambar OG default untuk share di sosmed",
    });

    // Site URL
    total++;
    const hasURL = !!settings.site_url?.trim();
    if (hasURL) score++;
    checks.push({
      label: "Site URL",
      passed: hasURL,
      tip: "Set URL canonical situs Anda",
    });

    // Google Analytics
    total++;
    const hasGA = !!settings.google_analytics_id?.trim();
    if (hasGA) score++;
    checks.push({
      label: "Google Analytics",
      passed: hasGA,
      tip: "Hubungkan Google Analytics untuk tracking",
    });

    // Search Console
    total++;
    const hasSC = !!settings.google_search_console?.trim();
    if (hasSC) score++;
    checks.push({
      label: "Google Search Console",
      passed: hasSC,
      tip: "Verifikasi situs di Search Console",
    });

    // Indexing enabled
    total++;
    const indexing = settings.enable_indexing !== "false";
    if (indexing) score++;
    checks.push({
      label: "Indexing Aktif",
      passed: indexing,
      tip: "Aktifkan indexing agar muncul di hasil pencarian",
    });

    // Organization Schema
    total++;
    const hasOrg = !!settings.org_name?.trim();
    if (hasOrg) score++;
    checks.push({
      label: "Organization Schema",
      passed: hasOrg,
      tip: "Tambahkan data organisasi untuk rich snippets",
    });

    // Twitter Handle
    total++;
    const hasTw = !!settings.social_twitter?.trim();
    if (hasTw) score++;
    checks.push({
      label: "Twitter Handle",
      passed: hasTw,
      tip: "Tambahkan handle Twitter untuk card attribution",
    });

    // Canonical enabled
    total++;
    const canonical = settings.enable_canonical !== "false";
    if (canonical) score++;
    checks.push({
      label: "Canonical URL Otomatis",
      passed: canonical,
      tip: "Aktifkan canonical URL untuk mencegah duplicate content",
    });

    return { score, total, pct: Math.round((score / total) * 100), checks };
  }, [settings]);

  const inputCls =
    "mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100";

  if (loading)
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-sky-600" />
      </div>
    );

  const tabs: { key: Tab; label: string; icon: string }[] = [
    {
      key: "general",
      label: "Umum",
      icon: "M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
    },
    {
      key: "social",
      label: "Social / OG",
      icon: "M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z",
    },
    {
      key: "metatags",
      label: "Meta Tags",
      icon: "M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z M6 6h.008v.008H6V6z",
    },
    {
      key: "sitemap",
      label: "Sitemap & Robots",
      icon: "M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418",
    },
    {
      key: "structured",
      label: "Structured Data",
      icon: "M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5",
    },
  ];

  const siteTitle = settings.site_title || "";
  const siteDesc = settings.site_description || "";
  const sep = settings.title_separator || "—";
  const ogImage = settings.default_og_image || "";
  const twitterHandle = settings.social_twitter || "";

  // SVG donut chart helpers
  const circumference = 2 * Math.PI * 54;
  const strokeOffset = circumference - (seoScore.pct / 100) * circumference;
  const scoreColor =
    seoScore.pct >= 80
      ? "text-emerald-500"
      : seoScore.pct >= 50
        ? "text-amber-500"
        : "text-red-500";
  const scoreStroke =
    seoScore.pct >= 80
      ? "stroke-emerald-500"
      : seoScore.pct >= 50
        ? "stroke-amber-500"
        : "stroke-red-500";

  return (
    <div>
      {toast && (
        <div
          className={`fixed right-4 top-4 z-100 flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium shadow-lg ${toast.type === "success" ? "bg-green-50 text-green-700 ring-1 ring-green-200" : "bg-red-50 text-red-700 ring-1 ring-red-200"}`}
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

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          SEO Tools
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Optimasi mesin pencari untuk meningkatkan traffic organik.
        </p>
      </div>

      {/* SEO Health Score Card */}
      <div className="mt-6 rounded-2xl border border-gray-200/60 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          {/* Donut Chart */}
          <div className="relative mx-auto flex h-28 w-28 shrink-0 items-center justify-center sm:mx-0">
            <svg className="h-28 w-28 -rotate-90" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r="54"
                fill="none"
                stroke="#f3f4f6"
                strokeWidth="8"
              />
              <circle
                cx="60"
                cy="60"
                r="54"
                fill="none"
                className={scoreStroke}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeOffset}
                style={{ transition: "stroke-dashoffset 0.6s ease" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-2xl font-bold ${scoreColor}`}>
                {seoScore.pct}
              </span>
              <span className="text-[10px] font-medium text-gray-400">
                / 100
              </span>
            </div>
          </div>
          {/* Score Details */}
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-2">
              <h3 className="text-sm font-semibold text-gray-900">
                Skor Kesehatan SEO
              </h3>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${seoScore.pct >= 80 ? "bg-emerald-50 text-emerald-700" : seoScore.pct >= 50 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"}`}
              >
                {seoScore.pct >= 80
                  ? "Bagus"
                  : seoScore.pct >= 50
                    ? "Perlu Perbaikan"
                    : "Buruk"}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-3 lg:grid-cols-5">
              {seoScore.checks.map((c, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1.5 py-0.5"
                  title={c.tip}
                >
                  {c.passed ? (
                    <svg
                      className="h-3.5 w-3.5 shrink-0 text-emerald-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="h-3.5 w-3.5 shrink-0 text-red-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                  <span
                    className={`text-[11px] ${c.passed ? "text-gray-500" : "text-red-600 font-medium"}`}
                  >
                    {c.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex gap-1 overflow-x-auto rounded-lg border border-gray-200 bg-white p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${tab === t.key ? "bg-sky-600 text-white shadow-sm" : "text-gray-600 hover:bg-gray-100"}`}
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d={t.icon} />
            </svg>
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {/* General */}
        {tab === "general" && (
          <div className="space-y-6 rounded-2xl border border-gray-200/60 bg-white p-6 shadow-sm">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Judul Situs
                </label>
                <input
                  type="text"
                  value={siteTitle}
                  onChange={(e) => set("site_title", e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Separator Judul
                </label>
                <select
                  value={sep}
                  onChange={(e) => set("title_separator", e.target.value)}
                  className={inputCls}
                >
                  <option value="—">— (Em dash)</option>
                  <option value="|">| (Pipe)</option>
                  <option value="-">- (Dash)</option>
                  <option value="•">• (Bullet)</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Meta Description Default
              </label>
              <textarea
                value={siteDesc}
                onChange={(e) => set("site_description", e.target.value)}
                rows={3}
                className={inputCls}
              />
              <p className="mt-1 text-xs text-gray-400">
                {siteDesc.length}/160 karakter (rekomendasi: 120-160)
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Google Analytics ID
                </label>
                <input
                  type="text"
                  value={settings.google_analytics_id || ""}
                  onChange={(e) => set("google_analytics_id", e.target.value)}
                  placeholder="G-XXXXXXXXXX"
                  className={inputCls + " font-mono"}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Google Search Console
                </label>
                <input
                  type="text"
                  value={settings.google_search_console || ""}
                  onChange={(e) => set("google_search_console", e.target.value)}
                  placeholder="Verification code"
                  className={inputCls + " font-mono"}
                />
              </div>
            </div>
            <div className="space-y-3 border-t border-gray-100 pt-4">
              <label className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    Izinkan Indexing
                  </p>
                  <p className="text-xs text-gray-400">
                    Biarkan mesin pencari mengindex situs Anda
                  </p>
                </div>
                <button
                  onClick={() =>
                    set(
                      "enable_indexing",
                      settings.enable_indexing === "false" ? "true" : "false",
                    )
                  }
                  className={`relative h-6 w-11 rounded-full transition-colors ${settings.enable_indexing !== "false" ? "bg-sky-600" : "bg-gray-200"}`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${settings.enable_indexing !== "false" ? "left-5.5" : "left-0.5"}`}
                  />
                </button>
              </label>
              <label className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    Canonical URL Otomatis
                  </p>
                  <p className="text-xs text-gray-400">
                    Tambahkan tag canonical secara otomatis ke setiap halaman
                  </p>
                </div>
                <button
                  onClick={() =>
                    set(
                      "enable_canonical",
                      settings.enable_canonical === "false" ? "true" : "false",
                    )
                  }
                  className={`relative h-6 w-11 rounded-full transition-colors ${settings.enable_canonical !== "false" ? "bg-sky-600" : "bg-gray-200"}`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${settings.enable_canonical !== "false" ? "left-5.5" : "left-0.5"}`}
                  />
                </button>
              </label>
            </div>
            <div className="flex justify-end border-t border-gray-100 pt-4">
              <button
                onClick={() =>
                  save([
                    "site_title",
                    "site_description",
                    "title_separator",
                    "google_analytics_id",
                    "google_search_console",
                    "enable_indexing",
                    "enable_canonical",
                  ])
                }
                disabled={saving}
                className="rounded-lg bg-sky-600 px-5 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
              >
                {saving ? "Menyimpan..." : "Simpan Pengaturan"}
              </button>
            </div>
          </div>
        )}

        {/* Social / OG */}
        {tab === "social" && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-200/60 bg-white p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900">
                Open Graph Preview
              </h3>
              <p className="mt-1 text-xs text-gray-500">
                Preview bagaimana link Anda muncul saat dibagikan di media
                sosial.
              </p>
              <div className="mt-4 grid gap-6 lg:grid-cols-2">
                {/* Facebook Preview */}
                <div>
                  <p className="mb-2 text-xs font-medium text-gray-500">
                    Facebook / LinkedIn
                  </p>
                  <div className="overflow-hidden rounded-lg border border-gray-200">
                    <div className="flex aspect-[1.91/1] items-center justify-center bg-linear-to-br from-sky-100 to-sky-50">
                      {ogImage ? (
                        <img
                          src={ogImage}
                          alt="OG"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <svg
                          className="h-16 w-16 text-sky-300"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={0.5}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M2.25 18V6a2.25 2.25 0 012.25-2.25h15A2.25 2.25 0 0121.75 6v12A2.25 2.25 0 0119.5 20.25h-15A2.25 2.25 0 012.25 18z"
                          />
                        </svg>
                      )}
                    </div>
                    <div className="bg-gray-50 px-4 py-3">
                      <p className="text-[10px] uppercase text-gray-400">
                        {settings.site_url || "netpulse.id"}
                      </p>
                      <p className="mt-0.5 text-sm font-semibold text-gray-900">
                        {siteTitle} {sep} Blog
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-xs text-gray-500">
                        {siteDesc}
                      </p>
                    </div>
                  </div>
                </div>
                {/* Twitter Preview */}
                <div>
                  <p className="mb-2 text-xs font-medium text-gray-500">
                    Twitter / X
                  </p>
                  <div className="overflow-hidden rounded-2xl border border-gray-200">
                    <div className="flex aspect-2/1 items-center justify-center bg-linear-to-br from-sky-100 to-sky-50">
                      {ogImage ? (
                        <img
                          src={ogImage}
                          alt="OG"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <svg
                          className="h-16 w-16 text-sky-300"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={0.5}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M2.25 18V6a2.25 2.25 0 012.25-2.25h15A2.25 2.25 0 0121.75 6v12A2.25 2.25 0 0119.5 20.25h-15A2.25 2.25 0 012.25 18z"
                          />
                        </svg>
                      )}
                    </div>
                    <div className="px-4 py-3">
                      <p className="text-sm font-semibold text-gray-900">
                        {siteTitle} {sep} Blog
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-xs text-gray-500">
                        {siteDesc}
                      </p>
                      <p className="mt-1 flex items-center gap-1 text-[11px] text-gray-400">
                        <svg
                          className="h-3 w-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"
                          />
                        </svg>
                        {settings.site_url || "netpulse.id"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200/60 bg-white p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900">Default OG Tags</h3>
              <div className="mt-4 grid gap-6 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Default OG Image URL
                  </label>
                  <input
                    type="text"
                    value={ogImage}
                    onChange={(e) => set("default_og_image", e.target.value)}
                    className={inputCls}
                    placeholder="/og-default.png"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Twitter Handle
                  </label>
                  <input
                    type="text"
                    value={twitterHandle}
                    onChange={(e) => set("social_twitter", e.target.value)}
                    className={inputCls}
                    placeholder="@netpulse"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Twitter Card Type
                  </label>
                  <select
                    value={settings.twitter_card_type || "summary_large_image"}
                    onChange={(e) => set("twitter_card_type", e.target.value)}
                    className={inputCls}
                  >
                    <option value="summary">Summary</option>
                    <option value="summary_large_image">
                      Summary Large Image
                    </option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Site URL
                  </label>
                  <input
                    type="text"
                    value={settings.site_url || ""}
                    onChange={(e) => set("site_url", e.target.value)}
                    className={inputCls}
                    placeholder="https://netpulse.id"
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end border-t border-gray-100 pt-4">
                <button
                  onClick={() =>
                    save([
                      "default_og_image",
                      "social_twitter",
                      "twitter_card_type",
                      "site_url",
                    ])
                  }
                  disabled={saving}
                  className="rounded-lg bg-sky-600 px-5 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
                >
                  {saving ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Meta Tags per Page */}
        {tab === "metatags" && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-200/60 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Meta Tags per Halaman
                  </h3>
                  <p className="mt-0.5 text-xs text-gray-500">
                    Kelola meta title, description, dan focus keyword untuk
                    setiap artikel.
                  </p>
                </div>
                <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                  {posts.length} artikel
                </span>
              </div>
              {postsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-sky-600" />
                </div>
              ) : posts.length === 0 ? (
                <div className="px-6 py-12 text-center text-sm text-gray-400">
                  Belum ada artikel.
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {posts.map((post) => {
                    const isEditing = editingMeta === post.id;
                    const hasTitle = !!(post.meta_title || post.title);
                    const hasDesc = !!post.meta_description;
                    const hasKw = !!post.focus_keyword;
                    const metaScore = [hasTitle, hasDesc, hasKw].filter(
                      Boolean,
                    ).length;
                    return (
                      <div key={post.id} className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {/* Mini score indicator */}
                          <div
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${metaScore === 3 ? "bg-emerald-50 text-emerald-600" : metaScore >= 2 ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-600"}`}
                          >
                            {metaScore}/3
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="truncate text-sm font-medium text-gray-900">
                                {post.title}
                              </p>
                              <span
                                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${post.status === "published" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}
                              >
                                {post.status}
                              </span>
                            </div>
                            <p className="mt-0.5 truncate text-xs text-gray-400">
                              /{post.slug}
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              if (isEditing) {
                                setEditingMeta(null);
                              } else {
                                setEditingMeta(post.id);
                                setMetaForm({
                                  meta_title: post.meta_title || "",
                                  meta_description: post.meta_description || "",
                                  focus_keyword: post.focus_keyword || "",
                                });
                              }
                            }}
                            className="shrink-0 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                          >
                            {isEditing ? "Tutup" : "Edit Meta"}
                          </button>
                        </div>
                        {/* SERP Preview */}
                        {!isEditing &&
                          (post.meta_title || post.meta_description) && (
                            <div className="mt-2 ml-11 rounded-lg bg-gray-50 p-3">
                              <p className="text-xs text-gray-400 mb-1">
                                SERP Preview:
                              </p>
                              <p className="text-sm font-medium text-blue-700 line-clamp-1">
                                {post.meta_title || post.title} {sep}{" "}
                                {siteTitle}
                              </p>
                              <p className="text-xs text-emerald-700">
                                /{post.slug}
                              </p>
                              <p className="text-xs text-gray-500 line-clamp-2">
                                {post.meta_description || "Tidak ada deskripsi"}
                              </p>
                            </div>
                          )}
                        {/* Edit form */}
                        {isEditing && (
                          <div className="mt-3 ml-11 space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
                            <div>
                              <label className="block text-xs font-medium text-gray-600">
                                Meta Title
                              </label>
                              <input
                                type="text"
                                value={metaForm.meta_title}
                                onChange={(e) =>
                                  setMetaForm((f) => ({
                                    ...f,
                                    meta_title: e.target.value,
                                  }))
                                }
                                className={inputCls + " text-sm"}
                                placeholder={post.title}
                              />
                              <p className="mt-0.5 text-[11px] text-gray-400">
                                {metaForm.meta_title.length}/60 karakter
                              </p>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600">
                                Meta Description
                              </label>
                              <textarea
                                value={metaForm.meta_description}
                                onChange={(e) =>
                                  setMetaForm((f) => ({
                                    ...f,
                                    meta_description: e.target.value,
                                  }))
                                }
                                className={inputCls + " text-sm"}
                                rows={2}
                                placeholder="Deskripsi singkat untuk hasil pencarian..."
                              />
                              <p className="mt-0.5 text-[11px] text-gray-400">
                                {metaForm.meta_description.length}/160 karakter
                              </p>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600">
                                Focus Keyword
                              </label>
                              <input
                                type="text"
                                value={metaForm.focus_keyword}
                                onChange={(e) =>
                                  setMetaForm((f) => ({
                                    ...f,
                                    focus_keyword: e.target.value,
                                  }))
                                }
                                className={inputCls + " text-sm"}
                                placeholder="Kata kunci utama"
                              />
                            </div>
                            {/* SERP Preview within editor */}
                            <div className="rounded-lg border border-gray-200 bg-white p-3">
                              <p className="text-[10px] font-medium text-gray-400 mb-1">
                                SERP Preview
                              </p>
                              <p className="text-sm font-medium text-blue-700 line-clamp-1">
                                {metaForm.meta_title || post.title} {sep}{" "}
                                {siteTitle}
                              </p>
                              <p className="text-xs text-emerald-700">
                                {settings.site_url || "https://netpulse.id"}/
                                {post.slug}
                              </p>
                              <p className="text-xs text-gray-500 line-clamp-2">
                                {metaForm.meta_description ||
                                  "Tidak ada deskripsi"}
                              </p>
                            </div>
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => setEditingMeta(null)}
                                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100"
                              >
                                Batal
                              </button>
                              <button
                                onClick={async () => {
                                  setSaving(true);
                                  try {
                                    await adminAPI.updatePost(post.id, {
                                      meta_title: metaForm.meta_title,
                                      meta_description:
                                        metaForm.meta_description,
                                      focus_keyword: metaForm.focus_keyword,
                                    });
                                    setPosts((ps) =>
                                      ps.map((p) =>
                                        p.id === post.id
                                          ? { ...p, ...metaForm }
                                          : p,
                                      ),
                                    );
                                    setEditingMeta(null);
                                    setToast({
                                      type: "success",
                                      msg: "Meta tags berhasil disimpan!",
                                    });
                                  } catch {
                                    setToast({
                                      type: "error",
                                      msg: "Gagal menyimpan meta tags",
                                    });
                                  } finally {
                                    setSaving(false);
                                  }
                                }}
                                disabled={saving}
                                className="rounded-lg bg-sky-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
                              >
                                {saving ? "Menyimpan..." : "Simpan Meta"}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* SEO Tips Card */}
            <div className="rounded-2xl border border-sky-200 bg-sky-50 p-5">
              <h4 className="text-sm font-semibold text-sky-900">
                Tips SEO untuk Meta Tags
              </h4>
              <ul className="mt-2 space-y-1.5 text-xs text-sky-700">
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 shrink-0">•</span> Meta Title: 30-60
                  karakter, mengandung keyword utama
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 shrink-0">•</span> Meta Description:
                  120-160 karakter, call-to-action yang menarik
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 shrink-0">•</span> Focus Keyword: 1
                  keyword per halaman, hindari keyword stuffing
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 shrink-0">•</span> Setiap halaman
                  harus punya meta description unik
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* Sitemap & Robots */}
        {tab === "sitemap" && (
          <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-gray-200/60 bg-white p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900">Sitemap XML</h3>
                <p className="mt-1 text-xs text-gray-500">
                  Sitemap otomatis. Mesin pencari akan mengcrawl index sitemap
                  Anda.
                </p>
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
                    <p className="text-sm font-medium text-gray-700">Status</p>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Aktif
                    </span>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-xs font-medium text-gray-500 mb-2">
                      URL Sitemap Index:
                    </p>
                    <code className="block rounded bg-gray-100 px-2 py-1 text-xs text-gray-700">
                      {settings.site_url || "https://netpulse.id"}/sitemap.xml
                    </code>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200/60 bg-white p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900">Robots.txt</h3>
                <p className="mt-1 text-xs text-gray-500">
                  Atur aturan crawling untuk bot mesin pencari.
                </p>
                <textarea
                  value={
                    settings.robots_txt ||
                    `User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\nDisallow: /login\nDisallow: /register\n\nSitemap: ${settings.site_url || "https://netpulse.id"}/sitemap.xml`
                  }
                  onChange={(e) => set("robots_txt", e.target.value)}
                  rows={10}
                  className="mt-4 w-full rounded-lg border border-gray-200 bg-gray-900 px-4 py-3 font-mono text-sm text-emerald-400 outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                />
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() =>
                      set(
                        "robots_txt",
                        `User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\nDisallow: /login\nDisallow: /register\n\nSitemap: ${settings.site_url || "https://netpulse.id"}/sitemap.xml`,
                      )
                    }
                    className="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Reset Default
                  </button>
                  <button
                    onClick={() => save(["robots_txt"])}
                    disabled={saving}
                    className="flex-1 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
                  >
                    {saving ? "Menyimpan..." : "Simpan"}
                  </button>
                </div>
              </div>
            </div>

            {/* Sub-Sitemaps Detail */}
            <div className="rounded-2xl border border-gray-200/60 bg-white p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900">Sub-Sitemaps</h3>
              <p className="mt-1 text-xs text-gray-500">
                Daftar sitemap yang dihasilkan otomatis berdasarkan jenis
                konten.
              </p>
              <div className="mt-4 overflow-hidden rounded-xl border border-gray-200">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-xs font-medium uppercase text-gray-500">
                    <tr>
                      <th className="px-4 py-3">Sitemap</th>
                      <th className="px-4 py-3">Tipe</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">URL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {[
                      {
                        name: "sitemap-posts.xml",
                        type: "Blog Posts",
                        desc: "Semua artikel yang dipublikasikan",
                      },
                      {
                        name: "sitemap-pages.xml",
                        type: "Static Pages",
                        desc: "Halaman statis (about, contact)",
                      },
                      {
                        name: "sitemap-categories.xml",
                        type: "Categories",
                        desc: "Halaman kategori",
                      },
                      {
                        name: "sitemap-tags.xml",
                        type: "Tags",
                        desc: "Halaman tag/label",
                      },
                      {
                        name: "sitemap-authors.xml",
                        type: "Authors",
                        desc: "Halaman profil penulis",
                      },
                    ].map((sm) => (
                      <tr
                        key={sm.name}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{sm.name}</p>
                          <p className="text-xs text-gray-400">{sm.desc}</p>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{sm.type}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Auto
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">
                            /{sm.name}
                          </code>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 rounded-lg border border-sky-100 bg-sky-50 p-3 text-xs text-sky-700">
                <strong>Info:</strong> Setiap sitemap diperbarui otomatis saat
                konten berubah. Submit sitemap index{" "}
                <code className="rounded bg-sky-100 px-1">/sitemap.xml</code> ke
                Google Search Console — bot akan menemukan semua sub-sitemaps
                secara otomatis.
              </div>
            </div>
          </div>
        )}

        {/* Structured Data */}
        {tab === "structured" && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-200/60 bg-white p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900">
                Organization Schema
              </h3>
              <p className="mt-1 text-xs text-gray-500">
                Data terstruktur JSON-LD untuk organisasi Anda.
              </p>
              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Nama Organisasi
                  </label>
                  <input
                    type="text"
                    value={settings.org_name || siteTitle}
                    onChange={(e) => set("org_name", e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    URL Logo
                  </label>
                  <input
                    type="text"
                    value={settings.site_logo || ""}
                    onChange={(e) => set("site_logo", e.target.value)}
                    className={inputCls}
                    placeholder="https://netpulse.id/logo.png"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Social Profiles (satu per baris)
                  </label>
                  <textarea
                    value={settings.org_social_profiles || ""}
                    onChange={(e) => set("org_social_profiles", e.target.value)}
                    rows={3}
                    className={inputCls}
                    placeholder="https://twitter.com/netpulse&#10;https://github.com/netpulse"
                  />
                </div>
              </div>
              <div className="mt-4">
                <p className="mb-2 text-xs font-medium text-gray-500">
                  Generated JSON-LD:
                </p>
                <pre className="overflow-x-auto rounded-xl bg-gray-900 p-4 text-xs text-emerald-400">
                  {`{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "${settings.org_name || siteTitle}",
  "url": "${settings.site_url || "https://netpulse.id"}",
  "logo": "${settings.site_logo || ""}",
  "sameAs": [
    ${(settings.org_social_profiles || "")
      .split("\n")
      .filter(Boolean)
      .map((u) => `"${u}"`)
      .join(",\n    ")}
  ]
}`}
                </pre>
              </div>
              <div className="mt-4 flex justify-end border-t border-gray-100 pt-4">
                <button
                  onClick={() =>
                    save(["org_name", "site_logo", "org_social_profiles"])
                  }
                  disabled={saving}
                  className="rounded-lg bg-sky-600 px-5 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
                >
                  {saving ? "Menyimpan..." : "Simpan Schema"}
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200/60 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
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
                      d="M4.5 12.75l6 6 9-13.5"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Article Schema — Otomatis
                  </h3>
                  <p className="text-xs text-gray-500">
                    Schema Article, BlogPosting, dan BreadcrumbList ditambahkan
                    otomatis ke setiap post.
                  </p>
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {[
                  "Article / BlogPosting",
                  "BreadcrumbList",
                  "WebSite + SearchAction",
                ].map((schema) => (
                  <div
                    key={schema}
                    className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2"
                  >
                    <svg
                      className="h-4 w-4 text-emerald-600"
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
                    <span className="text-sm font-medium text-emerald-700">
                      {schema}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
