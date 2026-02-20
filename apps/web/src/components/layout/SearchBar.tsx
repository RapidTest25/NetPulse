"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

type Suggestion = {
  title: string;
  slug: string;
  category?: string;
};

type SearchResult = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category_name?: string;
  author_name?: string;
  published_at?: string;
  cover_url?: string;
};

export function SearchBar({
  defaultValue = "",
  variant = "hero",
}: {
  defaultValue?: string;
  variant?: "hero" | "page";
}) {
  const [query, setQuery] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const isHero = variant === "hero";
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

  // Fetch suggestions
  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      setShowResults(false);
      setResults([]);
      return;
    }

    // Reset full results when query changes
    setShowResults(false);
    setResults([]);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${apiUrl}/search/suggest?q=${encodeURIComponent(query)}&limit=5`,
        );
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data || []);
          setIsOpen(data && data.length > 0);
          setActiveIdx(-1);
        }
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, apiUrl]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Full search
  async function doFullSearch() {
    if (!query.trim() || query.length < 2) return;
    setSearchLoading(true);
    setIsOpen(false);
    try {
      const res = await fetch(
        `${apiUrl}/search?q=${encodeURIComponent(query)}&limit=10`,
      );
      if (res.ok) {
        const data = await res.json();
        setResults(data?.items || data || []);
        setShowResults(true);
      }
    } catch {
      setResults([]);
    } finally {
      setSearchLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim() && activeIdx >= 0 && suggestions.length > 0) {
      setIsOpen(false);
      setShowResults(false);
      router.push(`/posts/${suggestions[activeIdx].slug}`);
    } else if (query.trim()) {
      doFullSearch();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!isOpen || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((p) => (p < suggestions.length - 1 ? p + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((p) => (p > 0 ? p - 1 : suggestions.length - 1));
    } else if (e.key === "Enter" && activeIdx >= 0) {
      e.preventDefault();
      setIsOpen(false);
      setShowResults(false);
      router.push(`/posts/${suggestions[activeIdx].slug}`);
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setShowResults(false);
    }
  }

  return (
    <div ref={ref} className="relative w-full">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          {/* Search icon */}
          <div
            className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 ${isHero ? "text-blue-300" : "text-gray-400"}`}
          >
            <svg
              className="h-5 w-5"
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
          </div>

          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => suggestions.length > 0 && setIsOpen(true)}
            placeholder="Cari artikel tentang DNS, BGP, HTTP/3..."
            className={`w-full pl-12 pr-24 transition-all duration-200 ${
              isHero
                ? "rounded-2xl border-0 bg-white/10 py-4 text-lg text-white placeholder-blue-300/80 backdrop-blur-md focus:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/30"
                : "rounded-xl border border-gray-200 bg-white py-3.5 text-base text-gray-900 placeholder-gray-400 shadow-sm focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-500/10"
            }`}
          />

          <button
            type="submit"
            className={`absolute right-2 top-1/2 -translate-y-1/2 font-semibold transition-all ${
              isHero
                ? "rounded-xl bg-white/20 px-5 py-2.5 text-sm text-white hover:bg-white/30 backdrop-blur-sm"
                : "rounded-lg bg-brand-600 px-5 py-2 text-sm text-white shadow-sm shadow-brand-500/25 hover:bg-brand-700"
            }`}
          >
            Cari
          </button>

          {/* Loading spinner */}
          {loading && (
            <div
              className={`absolute right-20 top-1/2 -translate-y-1/2 ${isHero ? "text-blue-300" : "text-gray-400"}`}
            >
              <svg
                className="h-4 w-4 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            </div>
          )}
        </div>
      </form>

      {/* Suggestions dropdown */}
      {isOpen && suggestions.length > 0 && !showResults && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl shadow-gray-200/50 animate-fade-in-up">
          <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            Saran pencarian
          </div>
          {suggestions.map((s, i) => (
            <a
              key={i}
              href={`/posts/${s.slug}`}
              className={`flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                i === activeIdx
                  ? "bg-brand-50 text-brand-700"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
              onClick={() => setIsOpen(false)}
            >
              <svg
                className="h-4 w-4 shrink-0 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                />
              </svg>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{s.title}</p>
              </div>
              {s.category && (
                <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
                  {s.category}
                </span>
              )}
            </a>
          ))}
          <div className="border-t border-gray-100 px-3 py-2">
            <button
              onClick={() => doFullSearch()}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-medium text-brand-600 hover:bg-brand-50 transition-colors"
            >
              <svg
                className="h-3.5 w-3.5"
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
              Lihat semua hasil untuk &quot;{query}&quot;
            </button>
          </div>
        </div>
      )}

      {/* Full search results inline */}
      {showResults && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[70vh] overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-xl shadow-gray-200/50 animate-fade-in-up">
          <div className="sticky top-0 flex items-center justify-between border-b border-gray-100 bg-white px-4 py-3">
            <span className="text-sm font-semibold text-gray-700">
              {searchLoading
                ? "Mencari..."
                : `${results.length} hasil untuk "${query}"`}
            </span>
            <button
              onClick={() => {
                setShowResults(false);
                setResults([]);
              }}
              className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {searchLoading ? (
            <div className="flex items-center justify-center py-12">
              <svg
                className="h-6 w-6 animate-spin text-brand-500"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            </div>
          ) : results.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {results.map((r) => (
                <a
                  key={r.id || r.slug}
                  href={`/posts/${r.slug}`}
                  className="flex gap-4 px-4 py-3.5 transition-colors hover:bg-gray-50"
                  onClick={() => setShowResults(false)}
                >
                  {r.cover_url && (
                    <div className="hidden sm:block h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                      <img
                        src={r.cover_url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-semibold text-gray-900 line-clamp-1">
                      {r.title}
                    </h4>
                    {r.excerpt && (
                      <p className="mt-0.5 text-xs text-gray-500 line-clamp-2">
                        {r.excerpt}
                      </p>
                    )}
                    <div className="mt-1.5 flex items-center gap-3 text-[11px] text-gray-400">
                      {r.category_name && (
                        <span className="rounded-full bg-brand-50 px-2 py-0.5 font-medium text-brand-600">
                          {r.category_name}
                        </span>
                      )}
                      {r.author_name && <span>{r.author_name}</span>}
                    </div>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center py-10 text-center">
              <svg
                className="h-8 w-8 text-gray-300"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                />
              </svg>
              <p className="mt-2 text-sm text-gray-500">
                Tidak ada hasil ditemukan
              </p>
              <p className="text-xs text-gray-400">Coba kata kunci lain</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
