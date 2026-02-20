"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

interface SearchResult {
  type: "post" | "page";
  title: string;
  href: string;
  description?: string;
}

const adminPages: SearchResult[] = [
  { type: "page", title: "Dashboard", href: "/admin", description: "Overview & statistik" },
  { type: "page", title: "Artikel", href: "/admin/posts", description: "Kelola artikel blog" },
  { type: "page", title: "Tulis Artikel Baru", href: "/admin/posts/new", description: "Buat artikel baru" },
  { type: "page", title: "Media", href: "/admin/media", description: "Upload & kelola file" },
  { type: "page", title: "Kategori", href: "/admin/categories", description: "Kelola kategori" },
  { type: "page", title: "Komentar", href: "/admin/comments", description: "Moderasi komentar" },
  { type: "page", title: "Iklan / Ads", href: "/admin/ads", description: "Kelola slot iklan" },
  { type: "page", title: "Users", href: "/admin/users", description: "Kelola pengguna" },
  { type: "page", title: "Roles & Permissions", href: "/admin/roles", description: "Hak akses" },
  { type: "page", title: "SEO", href: "/admin/seo", description: "Pengaturan SEO" },
  { type: "page", title: "Pengaturan", href: "/admin/settings", description: "Konfigurasi sistem" },
  { type: "page", title: "Audit Log", href: "/admin/audit-logs", description: "Riwayat aktivitas" },
];

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Keyboard shortcut ⌘K / Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const search = useCallback(
    async (q: string) => {
      const lower = q.toLowerCase();

      // Always search admin pages
      const pageResults = adminPages.filter(
        (p) =>
          p.title.toLowerCase().includes(lower) ||
          (p.description && p.description.toLowerCase().includes(lower)),
      );

      if (q.length < 2) {
        setResults(pageResults);
        return;
      }

      // Also search posts from API
      setLoading(true);
      try {
        const res = await fetch(`${API}/search?q=${encodeURIComponent(q)}&limit=5`);
        if (res.ok) {
          const data = await res.json();
          const postResults: SearchResult[] = (data.items || []).map(
            (p: { title: string; slug: string; excerpt?: string }) => ({
              type: "post" as const,
              title: p.title,
              href: `/admin/posts/${p.slug}`,
              description: p.excerpt?.slice(0, 80),
            }),
          );
          setResults([...pageResults, ...postResults]);
        } else {
          setResults(pageResults);
        }
      } catch {
        setResults(pageResults);
      }
      setLoading(false);
    },
    [],
  );

  useEffect(() => {
    const timer = setTimeout(() => search(query), 200);
    return () => clearTimeout(timer);
  }, [query, search]);

  const navigate = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[selectedIdx]) {
      navigate(results[selectedIdx].href);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-gray-200/60 bg-white shadow-2xl">
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3">
          <svg
            className="h-5 w-5 shrink-0 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIdx(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Cari halaman, artikel..."
            className="w-full bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
          />
          {loading && (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          )}
          <kbd className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-400">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-90 overflow-y-auto px-2 py-2">
          {results.length === 0 && query.length > 0 && (
            <p className="py-8 text-center text-sm text-gray-400">
              Tidak ada hasil ditemukan
            </p>
          )}
          {results.length === 0 && query.length === 0 && (
            <p className="py-8 text-center text-sm text-gray-400">
              Ketik untuk mencari...
            </p>
          )}
          {results.map((r, i) => (
            <button
              key={`${r.type}-${r.href}`}
              onClick={() => navigate(r.href)}
              onMouseEnter={() => setSelectedIdx(i)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                i === selectedIdx ? "bg-indigo-50" : "hover:bg-gray-50"
              }`}
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                  r.type === "post"
                    ? "bg-blue-50 text-blue-500"
                    : "bg-indigo-50 text-indigo-500"
                }`}
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
                    d={
                      r.type === "post"
                        ? "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                        : "M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6z"
                    }
                  />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">
                  {r.title}
                </p>
                {r.description && (
                  <p className="truncate text-xs text-gray-400">
                    {r.description}
                  </p>
                )}
              </div>
              <svg
                className={`h-4 w-4 shrink-0 text-gray-300 ${i === selectedIdx ? "opacity-100" : "opacity-0"}`}
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                />
              </svg>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-100 px-4 py-2">
          <div className="flex gap-2 text-[10px] text-gray-400">
            <span>
              <kbd className="rounded bg-gray-100 px-1 font-mono">↑↓</kbd>{" "}
              navigasi
            </span>
            <span>
              <kbd className="rounded bg-gray-100 px-1 font-mono">↵</kbd> pilih
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
