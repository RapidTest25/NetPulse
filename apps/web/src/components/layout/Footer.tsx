"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

interface SiteSettings {
  site_title?: string;
  site_description?: string;
  footer_text?: string;
  social_github?: string;
  social_twitter?: string;
  social_youtube?: string;
  social_linkedin?: string;
  social_instagram?: string;
  social_facebook?: string;
  contact_email?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

// Social icon SVG paths
const SOCIAL_ICONS: Record<
  string,
  { viewBox: string; path: string; fill?: boolean }
> = {
  social_github: {
    viewBox: "0 0 24 24",
    fill: true,
    path: "M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z",
  },
  social_twitter: {
    viewBox: "0 0 24 24",
    fill: true,
    path: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
  },
  social_youtube: {
    viewBox: "0 0 24 24",
    fill: true,
    path: "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z",
  },
  social_linkedin: {
    viewBox: "0 0 24 24",
    fill: true,
    path: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z",
  },
  social_instagram: {
    viewBox: "0 0 24 24",
    fill: true,
    path: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z",
  },
  social_facebook: {
    viewBox: "0 0 24 24",
    fill: true,
    path: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z",
  },
  contact_email: {
    viewBox: "0 0 24 24",
    fill: false,
    path: "M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75",
  },
};

const SOCIAL_ORDER = [
  "social_github",
  "social_twitter",
  "social_youtube",
  "social_linkedin",
  "social_instagram",
  "social_facebook",
  "contact_email",
];

function buildHref(key: string, value: string): string {
  if (key === "contact_email") return `mailto:${value}`;
  if (value.startsWith("http")) return value;
  return `https://${value}`;
}

// Default values shown before settings load
const DEFAULTS: SiteSettings = {
  site_title: "NetPulse",
  site_description:
    "Blog seputar network & dunia internet. Pelajari teknologi jaringan dari dasar hingga tingkat lanjut — ditulis oleh engineer, untuk engineer.",
};

export function Footer() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/settings/public`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setSettings({ ...DEFAULTS, ...data });
        else setSettings(DEFAULTS);
      })
      .catch(() => setSettings(DEFAULTS));
  }, []);

  // Show a minimal skeleton footer while settings load to prevent flash
  if (!settings) {
    return (
      <footer className="relative overflow-hidden bg-linear-to-b from-gray-900 via-gray-900 to-gray-950">
        <div className="relative mx-auto max-w-6xl px-4 pt-16 pb-8 sm:px-6 lg:px-8">
          <div className="mb-12 flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-md space-y-4">
              <div className="h-10 w-40 animate-pulse rounded-lg bg-gray-800" />
              <div className="h-4 w-full animate-pulse rounded bg-gray-800" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-gray-800" />
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8">
            <div className="h-4 w-48 animate-pulse rounded bg-gray-800 mx-auto" />
          </div>
        </div>
      </footer>
    );
  }

  const siteTitle = settings.site_title || "NetPulse";
  const description = settings.site_description || DEFAULTS.site_description!;
  const footerText = settings.footer_text || "";
  const socialLinks = SOCIAL_ORDER.filter((k) =>
    (settings as Record<string, string>)[k]?.trim(),
  );

  return (
    <footer className="relative overflow-hidden bg-linear-to-b from-gray-900 via-gray-900 to-gray-950">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-brand-600/10 blur-3xl" />
        <div className="absolute -left-32 bottom-0 h-80 w-80 rounded-full bg-cyan-500/8 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] bg-size-[48px_48px]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 pt-16 pb-8 sm:px-6 lg:px-8">
        {/* Top Section: Brand + Newsletter */}
        <div className="mb-12 flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-md">
            <Link href="/" className="group flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-linear-to-br from-brand-500 to-brand-700 shadow-lg shadow-brand-500/25 transition-shadow group-hover:shadow-brand-500/40">
                <Image
                  src="/img/logo.png"
                  alt={`${siteTitle} Logo`}
                  width={30}
                  height={30}
                  className="brightness-0 invert"
                />
              </div>
              <span className="text-xl font-bold text-white">
                Net<span className="text-brand-400">Pulse</span>
              </span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-gray-400">
              {description}
            </p>

            {/* Social links — dynamic */}
            {socialLinks.length > 0 && (
              <div className="mt-6 flex items-center gap-3">
                {socialLinks.map((key) => {
                  const icon = SOCIAL_ICONS[key];
                  if (!icon) return null;
                  const val = (settings as Record<string, string>)[key];
                  return (
                    <a
                      key={key}
                      href={buildHref(key, val)}
                      target={key === "contact_email" ? undefined : "_blank"}
                      rel={
                        key === "contact_email"
                          ? undefined
                          : "noopener noreferrer"
                      }
                      className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-gray-400 ring-1 ring-white/10 transition-all hover:bg-brand-600 hover:text-white hover:ring-brand-600"
                    >
                      {icon.fill ? (
                        <svg
                          className="h-4 w-4"
                          fill="currentColor"
                          viewBox={icon.viewBox}
                        >
                          <path
                            fillRule="evenodd"
                            d={icon.path}
                            clipRule="evenodd"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox={icon.viewBox}
                          strokeWidth={1.5}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d={icon.path}
                          />
                        </svg>
                      )}
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          {/* Newsletter */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm lg:w-96">
            <h4 className="text-sm font-semibold text-white">
              Dapatkan Update Terbaru
            </h4>
            <p className="mt-1.5 text-xs text-gray-400">
              Artikel baru langsung ke inbox. Tanpa spam.
            </p>
            <form className="mt-4 flex gap-2">
              <input
                type="email"
                placeholder="email@contoh.com"
                className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition-colors focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              />
              <button
                type="button"
                className="shrink-0 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-brand-500 hover:shadow-lg hover:shadow-brand-500/25"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-2 gap-8 border-t border-white/10 pt-10 sm:grid-cols-3 lg:grid-cols-4">
          {/* Topik */}
          <div>
            <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-brand-400">
              Topik
            </h4>
            <ul className="space-y-2.5">
              {["Networking", "Internet", "Security", "Cloud", "DevOps"].map(
                (t) => (
                  <li key={t}>
                    <Link
                      href={`/categories/${t.toLowerCase()}`}
                      className="group flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-white"
                    >
                      <span className="h-px w-3 bg-gray-700 transition-all group-hover:w-5 group-hover:bg-brand-500" />
                      {t}
                    </Link>
                  </li>
                ),
              )}
            </ul>
          </div>

          {/* Navigasi */}
          <div>
            <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-brand-400">
              Navigasi
            </h4>
            <ul className="space-y-2.5">
              {[
                { label: "Beranda", href: "/" },
                { label: "Blog", href: "/blog" },
                { label: "Kategori", href: "/categories" },
                { label: "Tags", href: "/tags" },
                { label: "About", href: "/about" },
              ].map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="group flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-white"
                  >
                    <span className="h-px w-3 bg-gray-700 transition-all group-hover:w-5 group-hover:bg-brand-500" />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Lainnya */}
          <div>
            <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-brand-400">
              Lainnya
            </h4>
            <ul className="space-y-2.5">
              {[
                { label: "Privacy Policy", href: "/privacy" },
                { label: "Terms of Service", href: "/terms" },
                { label: "About", href: "/about" },
              ].map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="group flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-white"
                  >
                    <span className="h-px w-3 bg-gray-700 transition-all group-hover:w-5 group-hover:bg-brand-500" />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Status */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-1">
            <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-brand-400">
              Status
            </h4>
            <div className="space-y-3">
              <div className="flex items-center gap-2.5 rounded-lg border border-white/5 bg-white/2 px-3 py-2.5">
                <span className="flex h-2.5 w-2.5 rounded-full bg-green-400 shadow-sm shadow-green-400/50">
                  <span className="animate-ping h-2.5 w-2.5 rounded-full bg-green-400 opacity-75" />
                </span>
                <span className="text-xs font-medium text-gray-300">
                  All systems operational
                </span>
              </div>
              <div className="flex items-center gap-2.5 rounded-lg border border-white/5 bg-white/2 px-3 py-2.5">
                <svg
                  className="h-4 w-4 text-brand-400"
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
                <span className="text-xs font-medium text-gray-300">
                  Open Source
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 sm:flex-row">
          <p className="text-xs text-gray-500">
            &copy; {new Date().getFullYear()} {siteTitle}. All rights reserved.
            {footerText && <span className="ml-1">&middot; {footerText}</span>}
          </p>
          <p className="text-xs text-gray-600">
            Built with <span className="text-brand-400">Next.js</span> +{" "}
            <span className="text-brand-400">Go</span> +{" "}
            <span className="text-brand-400">PostgreSQL</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
