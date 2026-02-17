"use client";

import { useState } from "react";

type Tab = "overview" | "n8n" | "webhooks" | "api";

export default function IntegrationsPage() {
  const [tab, setTab] = useState<Tab>("overview");
  const [copied, setCopied] = useState<string | null>(null);

  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: "overview", label: "Ikhtisar", icon: "M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" },
    { key: "n8n", label: "N8N Setup", icon: "M14.25 9.75L16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" },
    { key: "webhooks", label: "Webhooks", icon: "M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" },
    { key: "api", label: "API Reference", icon: "M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" },
  ];

  const n8nWorkflows = [
    {
      name: "Auto-publish ke Social Media",
      desc: "Otomatis posting ke Twitter/X, Facebook, dan LinkedIn saat artikel dipublish.",
      trigger: "Webhook: Post Published",
      steps: ["Terima webhook saat post published", "Format konten untuk tiap platform", "Post ke Twitter API", "Post ke Facebook Page", "Post ke LinkedIn"],
    },
    {
      name: "SEO Auto-Optimizer",
      desc: "Generate meta description dan suggest tags menggunakan AI saat artikel dibuat.",
      trigger: "Webhook: Post Created",
      steps: ["Terima webhook saat post dibuat", "Kirim body ke OpenAI API", "Generate meta description", "Suggest tags relevan", "Update post via API"],
    },
    {
      name: "Email Newsletter",
      desc: "Kirim email newsletter otomatis ke subscriber saat ada artikel baru.",
      trigger: "Webhook: Post Published",
      steps: ["Terima webhook", "Ambil daftar subscriber", "Format email template", "Kirim via SMTP/SendGrid", "Log status pengiriman"],
    },
    {
      name: "Backup Otomatis",
      desc: "Backup database dan media secara otomatis setiap hari.",
      trigger: "Schedule: Daily 02:00",
      steps: ["Trigger jadwal harian", "Dump PostgreSQL via pg_dump", "Compress uploads folder", "Upload ke S3/Google Drive", "Kirim notifikasi Telegram"],
    },
    {
      name: "Alert DDoS / Traffic Anomali",
      desc: "Kirim alert ke Telegram/Discord saat terdeteksi lonjakan traffic abnormal.",
      trigger: "Schedule: Every 5 min",
      steps: ["Cek /admin/stats/traffic setiap 5 menit", "Bandingkan dengan rata-rata", "Jika > 3x rata-rata", "Kirim alert ke Telegram", "Opsional: aktifkan rate limiting"],
    },
  ];

  const apiEndpoints = [
    { method: "POST", path: "/auth/login", desc: "Login dan dapatkan access token", auth: false },
    { method: "GET", path: "/posts", desc: "List semua post (publik)", auth: false },
    { method: "GET", path: "/posts/{slug}", desc: "Detail post by slug", auth: false },
    { method: "GET", path: "/categories", desc: "List kategori", auth: false },
    { method: "GET", path: "/search?q=...", desc: "Cari post", auth: false },
    { method: "POST", path: "/admin/posts", desc: "Buat post baru", auth: true },
    { method: "PUT", path: "/admin/posts/{id}", desc: "Update post", auth: true },
    { method: "DELETE", path: "/admin/posts/{id}", desc: "Hapus post", auth: true },
    { method: "POST", path: "/admin/media/upload", desc: "Upload media file", auth: true },
    { method: "GET", path: "/admin/stats/dashboard", desc: "Dashboard stats", auth: true },
    { method: "GET", path: "/admin/stats/traffic", desc: "Traffic overview (30d/24h)", auth: true },
    { method: "GET", path: "/admin/stats/top-posts", desc: "Top posts by views", auth: true },
    { method: "GET", path: "/admin/users", desc: "List users", auth: true },
    { method: "GET", path: "/admin/settings", desc: "Get all settings", auth: true },
    { method: "PUT", path: "/admin/settings", desc: "Update settings", auth: true },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Integrasi & Automasi</h1>
        <p className="mt-1 text-sm text-gray-500">Hubungkan NetPulse dengan tools eksternal menggunakan N8N, webhooks, dan API.</p>
      </div>

      <div className="flex gap-1 overflow-x-auto rounded-lg border border-gray-200 bg-white p-1">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${tab === t.key ? "bg-indigo-600 text-white shadow-sm" : "text-gray-600 hover:bg-gray-100"}`}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d={t.icon} /></svg>
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === "overview" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { title: "N8N Workflow", desc: "Platform automasi low-code untuk menghubungkan berbagai layanan", status: "Tersedia", color: "bg-emerald-50 text-emerald-700 ring-emerald-200", icon: "M14.25 9.75L16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" },
              { title: "Webhooks", desc: "Terima notifikasi real-time saat event terjadi di NetPulse", status: "Tersedia", color: "bg-emerald-50 text-emerald-700 ring-emerald-200", icon: "M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" },
              { title: "REST API", desc: "Akses penuh ke data NetPulse via REST API dengan JWT auth", status: "Tersedia", color: "bg-emerald-50 text-emerald-700 ring-emerald-200", icon: "M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" },
              { title: "Telegram Bot", desc: "Terima notifikasi dan kelola konten via Telegram", status: "Segera", color: "bg-amber-50 text-amber-700 ring-amber-200", icon: "M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" },
              { title: "Zapier", desc: "Hubungkan dengan 5000+ aplikasi melalui Zapier", status: "Segera", color: "bg-amber-50 text-amber-700 ring-amber-200", icon: "M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" },
              { title: "Google Analytics", desc: "Tracking otomatis via GA4 measurement ID", status: "Aktif", color: "bg-blue-50 text-blue-700 ring-blue-200", icon: "M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-gray-200/60 bg-white p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d={item.icon} /></svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-gray-900">{item.title}</h3>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${item.color}`}>{item.status}</span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Getting Started */}
          <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-6">
            <h3 className="text-sm font-bold text-indigo-900">Mulai Cepat</h3>
            <div className="mt-3 grid gap-4 sm:grid-cols-3">
              {[
                { step: "1", title: "Install N8N", desc: "Jalankan N8N via Docker atau cloud. npm, atau npx." },
                { step: "2", title: "Dapatkan API Token", desc: "Login ke NetPulse dan gunakan access token untuk autentikasi." },
                { step: "3", title: "Buat Workflow", desc: "Gunakan template workflow atau buat custom workflow Anda." },
              ].map((s) => (
                <div key={s.step} className="flex gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">{s.step}</div>
                  <div>
                    <p className="text-sm font-semibold text-indigo-900">{s.title}</p>
                    <p className="mt-0.5 text-xs text-indigo-700">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* N8N Setup */}
      {tab === "n8n" && (
        <div className="space-y-6">
          {/* Install Guide */}
          <div className="rounded-2xl border border-gray-200/60 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">Setup N8N</h3>
            <p className="mt-1 text-sm text-gray-500">N8N adalah platform automasi open-source. Ikuti langkah berikut untuk mengintegrasikan dengan NetPulse.</p>

            <div className="mt-5 space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-800">1. Install N8N via Docker</h4>
                <div className="group relative mt-2">
                  <pre className="overflow-x-auto rounded-xl bg-gray-900 p-4 text-sm text-emerald-400 font-mono">
{`docker run -d --name n8n \\
  -p 5678:5678 \\
  -v n8n_data:/home/node/.n8n \\
  -e N8N_BASIC_AUTH_ACTIVE=true \\
  -e N8N_BASIC_AUTH_USER=admin \\
  -e N8N_BASIC_AUTH_PASSWORD=your_password \\
  n8nio/n8n`}
                  </pre>
                  <button onClick={() => copyToClipboard("docker run -d --name n8n -p 5678:5678 -v n8n_data:/home/node/.n8n -e N8N_BASIC_AUTH_ACTIVE=true -e N8N_BASIC_AUTH_USER=admin -e N8N_BASIC_AUTH_PASSWORD=your_password n8nio/n8n", "docker")} className="absolute right-3 top-3 rounded-lg bg-white/10 px-2 py-1 text-xs text-white hover:bg-white/20">
                    {copied === "docker" ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-800">2. Dapatkan Access Token</h4>
                <p className="mt-1 text-xs text-gray-500">Login ke NetPulse API untuk mendapatkan JWT token:</p>
                <div className="group relative mt-2">
                  <pre className="overflow-x-auto rounded-xl bg-gray-900 p-4 text-sm text-emerald-400 font-mono">
{`curl -X POST ${API}/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email":"admin@rapidwire.local","password":"your_password"}'

# Response:
# { "tokens": { "access_token": "eyJhb...", "refresh_token": "..." } }`}
                  </pre>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-800">3. Konfigurasi HTTP Request di N8N</h4>
                <p className="mt-1 text-xs text-gray-500">Di N8N, tambahkan node &quot;HTTP Request&quot; dengan konfigurasi berikut:</p>
                <div className="mt-2 grid gap-3 sm:grid-cols-2">
                  {[
                    { label: "Base URL", value: API },
                    { label: "Authentication", value: "Generic Credential Type → Header Auth" },
                    { label: "Header Name", value: "Authorization" },
                    { label: "Header Value", value: "Bearer YOUR_ACCESS_TOKEN" },
                  ].map((cfg) => (
                    <div key={cfg.label} className="rounded-lg bg-gray-50 px-4 py-3">
                      <p className="text-xs font-medium text-gray-500">{cfg.label}</p>
                      <p className="mt-0.5 text-sm font-mono text-gray-800">{cfg.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Workflow Templates */}
          <div className="rounded-2xl border border-gray-200/60 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">Template Workflow</h3>
            <p className="mt-1 text-sm text-gray-500">Contoh workflow N8N yang siap digunakan dengan NetPulse.</p>
            <div className="mt-4 space-y-3">
              {n8nWorkflows.map((wf, i) => (
                <details key={i} className="group rounded-xl border border-gray-200 overflow-hidden">
                  <summary className="flex cursor-pointer items-center gap-3 px-5 py-4 hover:bg-gray-50">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 text-sm font-bold">{i + 1}</div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">{wf.name}</p>
                      <p className="text-xs text-gray-500">{wf.desc}</p>
                    </div>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">{wf.trigger}</span>
                    <svg className="h-4 w-4 shrink-0 text-gray-400 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
                  </summary>
                  <div className="border-t border-gray-100 bg-gray-50 px-5 py-4">
                    <p className="mb-3 text-xs font-semibold text-gray-500">Langkah-langkah:</p>
                    <div className="flex flex-wrap items-center gap-2">
                      {wf.steps.map((step, j) => (
                        <div key={j} className="flex items-center gap-2">
                          <div className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm">{step}</div>
                          {j < wf.steps.length - 1 && (
                            <svg className="h-4 w-4 shrink-0 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </details>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Webhooks */}
      {tab === "webhooks" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-200/60 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">Webhook Events</h3>
            <p className="mt-1 text-sm text-gray-500">Konfigurasikan webhook URL di N8N untuk menerima event dari NetPulse secara real-time.</p>

            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-125 text-left text-sm">
                <thead className="border-b border-gray-200 text-xs font-medium uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Event</th>
                    <th className="px-4 py-3">Deskripsi</th>
                    <th className="px-4 py-3">Payload</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[
                    { event: "post.created", desc: "Artikel baru dibuat", payload: "{ id, title, slug, status, author }" },
                    { event: "post.published", desc: "Artikel dipublikasikan", payload: "{ id, title, slug, url, published_at }" },
                    { event: "post.updated", desc: "Artikel diperbarui", payload: "{ id, title, slug, changes }" },
                    { event: "post.deleted", desc: "Artikel dihapus", payload: "{ id, title }" },
                    { event: "comment.created", desc: "Komentar baru", payload: "{ id, post_id, author, body }" },
                    { event: "user.registered", desc: "User baru mendaftar", payload: "{ id, name, email, role }" },
                    { event: "media.uploaded", desc: "File media diupload", payload: "{ id, filename, url, size }" },
                  ].map((ev) => (
                    <tr key={ev.event} className="hover:bg-gray-50">
                      <td className="px-4 py-3"><code className="rounded bg-indigo-50 px-1.5 py-0.5 text-xs font-semibold text-indigo-700">{ev.event}</code></td>
                      <td className="px-4 py-3 text-gray-600">{ev.desc}</td>
                      <td className="px-4 py-3"><code className="text-xs text-gray-500">{ev.payload}</code></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200/60 bg-white p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900">Contoh Webhook Handler di N8N</h3>
            <div className="mt-3">
              <pre className="overflow-x-auto rounded-xl bg-gray-900 p-4 text-sm text-emerald-400 font-mono">
{`// N8N Webhook Node Configuration:
// Method: POST
// Path: /netpulse-webhook
// Authentication: Header Auth
//
// Webhook URL akan seperti:
// https://your-n8n.com/webhook/netpulse-webhook
//
// Di NetPulse, set webhook URL di Settings → Webhooks:
// POST ${API}/admin/settings
// { "webhook_url": "https://your-n8n.com/webhook/netpulse-webhook" }
//
// Payload yang diterima:
{
  "event": "post.published",
  "timestamp": "2025-01-15T10:30:00Z",
  "data": {
    "id": "abc-123",
    "title": "Artikel Baru",
    "slug": "artikel-baru",
    "url": "https://netpulse.id/posts/artikel-baru"
  }
}`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* API Reference */}
      {tab === "api" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-200/60 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">API Endpoints</h3>
                <p className="mt-1 text-sm text-gray-500">Base URL: <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-semibold text-gray-800">{API}</code></p>
              </div>
              <button onClick={() => copyToClipboard(API, "baseurl")} className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50">
                {copied === "baseurl" ? "Copied!" : "Copy URL"}
              </button>
            </div>

            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-137.5 text-left text-sm">
                <thead className="border-b border-gray-200 text-xs font-medium uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-3 w-24">Method</th>
                    <th className="px-4 py-3">Endpoint</th>
                    <th className="px-4 py-3">Deskripsi</th>
                    <th className="px-4 py-3 w-20">Auth</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {apiEndpoints.map((ep) => (
                    <tr key={ep.method + ep.path} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                          ep.method === "GET" ? "bg-emerald-50 text-emerald-700" :
                          ep.method === "POST" ? "bg-blue-50 text-blue-700" :
                          ep.method === "PUT" ? "bg-amber-50 text-amber-700" :
                          "bg-red-50 text-red-700"
                        }`}>{ep.method}</span>
                      </td>
                      <td className="px-4 py-3"><code className="text-xs font-mono text-gray-800">{ep.path}</code></td>
                      <td className="px-4 py-3 text-gray-600">{ep.desc}</td>
                      <td className="px-4 py-3">
                        {ep.auth ? (
                          <svg className="h-4 w-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd"/></svg>
                        ) : (
                          <svg className="h-4 w-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd"/></svg>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Auth Example */}
          <div className="rounded-2xl border border-gray-200/60 bg-white p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900">Contoh Autentikasi</h3>
            <div className="mt-3">
              <pre className="overflow-x-auto rounded-xl bg-gray-900 p-4 text-sm text-emerald-400 font-mono">
{`# 1. Login untuk mendapatkan token
curl -X POST ${API}/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email":"admin@rapidwire.local","password":"admin123456"}'

# 2. Gunakan token untuk request selanjutnya
curl -X GET ${API}/admin/stats/dashboard \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# 3. Contoh buat post baru
curl -X POST ${API}/admin/posts \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Artikel dari N8N",
    "body": "## Hello\\n\\nIni dibuat otomatis via N8N!",
    "status": "draft"
  }'`}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
