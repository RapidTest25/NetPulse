"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import ProfileMenu from "@/components/layout/ProfileMenu";

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [visible, setVisible] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<
    { title: string; slug: string; category?: string }[]
  >([]);
  const [searchResults, setSearchResults] = useState<
    {
      id: string;
      title: string;
      slug: string;
      excerpt: string;
      category_name?: string;
      author_name?: string;
    }[]
  >([]);
  const [showResults, setShowResults] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const lastScrollY = useRef(0);
  const isTouching = useRef(false);
  const mobileOpenRef = useRef(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

  // Fetch suggestions on query change
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSuggestions([]);
      setShowResults(false);
      setSearchResults([]);
      return;
    }
    setShowResults(false);
    setSearchResults([]);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(
          `${apiUrl}/search/suggest?q=${encodeURIComponent(searchQuery)}&limit=6`,
        );
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data || []);
          setActiveIdx(-1);
        }
      } catch {
        setSuggestions([]);
      } finally {
        setSearchLoading(false);
      }
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery, apiUrl]);

  // Full search for results
  const doFullSearch = useCallback(async () => {
    if (!searchQuery.trim() || searchQuery.length < 2) return;
    setSearchLoading(true);
    setSuggestions([]);
    try {
      const res = await fetch(
        `${apiUrl}/search?q=${encodeURIComponent(searchQuery)}&limit=8`,
      );
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data?.items || data || []);
        setShowResults(true);
      }
    } catch {
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, [searchQuery, apiUrl]);

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const q = searchQuery.trim();
      if (!q) return;
      if (activeIdx >= 0 && suggestions.length > 0) {
        router.push(`/posts/${suggestions[activeIdx].slug}`);
        setSearchOpen(false);
        setSearchQuery("");
        setSuggestions([]);
        setShowResults(false);
      } else {
        doFullSearch();
      }
    },
    [searchQuery, router, activeIdx, suggestions, doFullSearch],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const items = showResults ? searchResults : suggestions;
      if (items.length === 0) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIdx((p) => (p < items.length - 1 ? p + 1 : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIdx((p) => (p > 0 ? p - 1 : items.length - 1));
      } else if (e.key === "Enter" && activeIdx >= 0) {
        e.preventDefault();
        const item = items[activeIdx];
        router.push(`/posts/${item.slug}`);
        setSearchOpen(false);
        setSearchQuery("");
        setSuggestions([]);
        setShowResults(false);
      } else if (e.key === "Escape") {
        setSearchOpen(false);
        setSearchQuery("");
        setSuggestions([]);
        setShowResults(false);
      }
    },
    [suggestions, searchResults, showResults, activeIdx, router],
  );

  // Focus input when search opens
  useEffect(() => {
    if (searchOpen) setTimeout(() => searchInputRef.current?.focus(), 100);
  }, [searchOpen]);

  // Close search on click outside
  useEffect(() => {
    if (!searchOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setSearchOpen(false);
        setSearchQuery("");
        setSuggestions([]);
        setShowResults(false);
        setSearchResults([]);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [searchOpen]);

  // Close search on Escape
  useEffect(() => {
    if (!searchOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSearchOpen(false);
        setSearchQuery("");
        setSuggestions([]);
        setShowResults(false);
        setSearchResults([]);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [searchOpen]);

  // Keep ref in sync so the scroll handler always sees the latest value
  useEffect(() => {
    mobileOpenRef.current = mobileOpen;
  }, [mobileOpen]);

  // Close mobile menu and search on route change
  useEffect(() => {
    setMobileOpen(false);
    setSearchOpen(false);
    setSearchQuery("");
    setSuggestions([]);
    setShowResults(false);
    setSearchResults([]);
  }, [pathname]);

  useEffect(() => {
    const handleScroll = () => {
      // Never hide while mobile menu is open or user is touching the screen
      if (mobileOpenRef.current || isTouching.current) return;

      const currentY = window.scrollY;
      setScrolled(currentY > 10);

      if (currentY < 60) {
        setVisible(true);
      } else if (currentY > lastScrollY.current + 15) {
        setVisible(false);
      } else if (currentY < lastScrollY.current - 15) {
        setVisible(true);
      }
      lastScrollY.current = currentY;
    };

    // Prevent scroll-hide from interfering with taps
    const handleTouchStart = () => {
      isTouching.current = true;
    };
    const handleTouchEnd = () => {
      setTimeout(() => {
        isTouching.current = false;
      }, 300);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, []);

  const navLinks = [
    {
      href: "/blog",
      label: "Blog",
      icon: "M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25",
    },
    {
      href: "/categories",
      label: "Kategori",
      icon: "M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z",
    },
    {
      href: "/tags",
      label: "Tags",
      icon: "M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z",
    },
    {
      href: "/about",
      label: "About",
      icon: "M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z",
    },
  ];

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      <nav
        className={`sticky top-0 z-50 transition-all duration-300 ${visible ? "translate-y-0" : "-translate-y-full"} ${
          scrolled
            ? "border-b border-gray-200/60 bg-white/85 shadow-sm shadow-gray-200/20 backdrop-blur-xl backdrop-saturate-150"
            : "border-b border-transparent bg-white/80 backdrop-blur-xl backdrop-saturate-150"
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2.5 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link href="/" className="group flex items-center gap-2.5">
            <div className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-linear-to-br from-brand-600 to-brand-800 shadow-md shadow-brand-500/20 transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-brand-500/30">
              <Image
                src="/img/logo.png"
                alt="NetPulse Logo"
                width={28}
                height={28}
                className="brightness-0 invert"
              />
            </div>
            <span className="text-xl font-bold tracking-tight text-gray-900">
              Net
              <span className="bg-linear-to-r from-brand-600 to-brand-500 bg-clip-text text-transparent">
                Pulse
              </span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden items-center sm:flex">
            <div className="flex items-center gap-0.5 rounded-full bg-gray-100/80 p-1 ring-1 ring-gray-200/50">
              {navLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-all duration-200 ${
                    isActive(item.href)
                      ? "bg-white text-gray-900 shadow-sm ring-1 ring-gray-200/50"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Desktop: Search + Profile */}
          <div
            className="hidden items-center gap-3 sm:flex"
            ref={searchContainerRef}
          >
            {/* Inline Search */}
            <div className="relative flex items-center">
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="flex h-9 w-9 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                title="Cari (Ctrl+K)"
              >
                <svg
                  className="h-[18px] w-[18px]"
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
              </button>
              <form
                onSubmit={handleSearch}
                className={`absolute right-0 top-1/2 -translate-y-1/2 overflow-hidden transition-all duration-300 ease-in-out ${searchOpen ? "w-72 opacity-100" : "w-0 opacity-0 pointer-events-none"}`}
              >
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Cari artikel..."
                  className="h-9 w-full rounded-full border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm text-gray-800 outline-none placeholder:text-gray-400 focus:border-sky-300 focus:bg-white focus:ring-2 focus:ring-sky-100"
                />
                <svg
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
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
                {searchLoading && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <svg
                      className="h-4 w-4 animate-spin text-gray-400"
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
              </form>

              {/* Search Results Dropdown */}
              {searchOpen && (suggestions.length > 0 || showResults) && (
                <div className="absolute right-0 top-full mt-2 w-80 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl shadow-gray-200/50 z-50">
                  {/* Suggestions */}
                  {!showResults && suggestions.length > 0 && (
                    <>
                      <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                        Saran pencarian
                      </div>
                      {suggestions.map((s, i) => (
                        <Link
                          key={i}
                          href={`/posts/${s.slug}`}
                          onClick={() => {
                            setSearchOpen(false);
                            setSearchQuery("");
                            setSuggestions([]);
                          }}
                          className={`flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${i === activeIdx ? "bg-sky-50 text-sky-700" : "text-gray-700 hover:bg-gray-50"}`}
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
                            <p className="truncate text-sm font-medium">
                              {s.title}
                            </p>
                            {s.category && (
                              <p className="text-[11px] text-gray-400">
                                {s.category}
                              </p>
                            )}
                          </div>
                        </Link>
                      ))}
                      <button
                        onClick={doFullSearch}
                        className="flex w-full items-center gap-2 border-t border-gray-100 px-3 py-2.5 text-xs font-medium text-sky-600 hover:bg-sky-50"
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
                        Lihat semua hasil untuk &quot;{searchQuery}&quot;
                      </button>
                    </>
                  )}

                  {/* Full Results */}
                  {showResults && (
                    <>
                      <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                        {searchResults.length > 0
                          ? `${searchResults.length} hasil ditemukan`
                          : "Tidak ada hasil"}
                      </div>
                      {searchResults.length > 0 ? (
                        searchResults.map((r, i) => (
                          <Link
                            key={r.id}
                            href={`/posts/${r.slug}`}
                            onClick={() => {
                              setSearchOpen(false);
                              setSearchQuery("");
                              setSearchResults([]);
                              setShowResults(false);
                            }}
                            className={`block px-3 py-2.5 transition-colors ${i === activeIdx ? "bg-sky-50" : "hover:bg-gray-50"}`}
                          >
                            <p className="truncate text-sm font-medium text-gray-900">
                              {r.title}
                            </p>
                            <p className="mt-0.5 line-clamp-1 text-xs text-gray-400">
                              {r.excerpt || r.category_name || ""}
                            </p>
                          </Link>
                        ))
                      ) : (
                        <div className="px-3 py-6 text-center text-sm text-gray-400">
                          Tidak ada artikel yang cocok.
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="h-5 w-px bg-gray-200" />

            <ProfileMenu />
          </div>

          {/* Mobile: profile + hamburger */}
          <div className="flex items-center gap-1.5 sm:hidden">
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100"
              title="Cari"
            >
              <svg
                className="h-[18px] w-[18px]"
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
            </button>

            <ProfileMenu />

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100"
              aria-label="Toggle menu"
            >
              <div className="relative h-5 w-5">
                <span
                  className={`absolute left-0 top-0.5 h-0.5 w-5 rounded-full bg-current transition-all duration-300 ${
                    mobileOpen ? "top-2 rotate-45" : ""
                  }`}
                />
                <span
                  className={`absolute left-0 top-2 h-0.5 w-5 rounded-full bg-current transition-all duration-300 ${
                    mobileOpen ? "opacity-0" : ""
                  }`}
                />
                <span
                  className={`absolute left-0 top-3.5 h-0.5 w-5 rounded-full bg-current transition-all duration-300 ${
                    mobileOpen ? "top-2 -rotate-45" : ""
                  }`}
                />
              </div>
            </button>
          </div>
        </div>

        {/* Mobile search bar */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out sm:hidden ${searchOpen ? "max-h-[400px] border-t border-gray-100" : "max-h-0"}`}
        >
          <form onSubmit={handleSearch} className="relative px-4 py-2">
            <input
              ref={mobileSearchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Cari artikel..."
              autoFocus={searchOpen}
              className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm text-gray-800 outline-none placeholder:text-gray-400 focus:border-sky-300 focus:bg-white focus:ring-2 focus:ring-sky-100"
            />
            <svg
              className="absolute left-7 top-[18px] h-4 w-4 -translate-y-1/2 text-gray-400"
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
          </form>
          {/* Mobile search results */}
          {(suggestions.length > 0 || showResults) && (
            <div className="max-h-64 overflow-y-auto border-t border-gray-100 bg-white">
              {!showResults &&
                suggestions.map((s, i) => (
                  <Link
                    key={i}
                    href={`/posts/${s.slug}`}
                    onClick={() => {
                      setSearchOpen(false);
                      setSearchQuery("");
                      setSuggestions([]);
                    }}
                    className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${i === activeIdx ? "bg-sky-50 text-sky-700" : "text-gray-700 hover:bg-gray-50"}`}
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
                    <span className="truncate text-sm font-medium">
                      {s.title}
                    </span>
                  </Link>
                ))}
              {showResults &&
                searchResults.map((r, i) => (
                  <Link
                    key={r.id}
                    href={`/posts/${r.slug}`}
                    onClick={() => {
                      setSearchOpen(false);
                      setSearchQuery("");
                      setSearchResults([]);
                      setShowResults(false);
                    }}
                    className={`block px-4 py-2.5 transition-colors ${i === activeIdx ? "bg-sky-50" : "hover:bg-gray-50"}`}
                  >
                    <p className="truncate text-sm font-medium text-gray-900">
                      {r.title}
                    </p>
                    <p className="mt-0.5 line-clamp-1 text-xs text-gray-400">
                      {r.excerpt || ""}
                    </p>
                  </Link>
                ))}
              {!showResults && suggestions.length > 0 && (
                <button
                  onClick={doFullSearch}
                  className="flex w-full items-center gap-2 border-t border-gray-100 px-4 py-2.5 text-xs font-medium text-sky-600 hover:bg-sky-50"
                >
                  Lihat semua hasil
                </button>
              )}
            </div>
          )}
        </div>

        {/* Mobile menu */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out sm:hidden ${
            mobileOpen ? "max-h-96 border-t border-gray-100" : "max-h-0"
          }`}
        >
          <div className="bg-white px-4 pb-4 pt-2">
            <div className="space-y-0.5">
              {navLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? "bg-brand-50 text-brand-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <svg
                    className={`h-4.5 w-4.5 shrink-0 ${isActive(item.href) ? "text-brand-500" : "text-gray-400"}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d={item.icon}
                    />
                  </svg>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile menu backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/10 backdrop-blur-sm sm:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </>
  );
}
