"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

interface PublicProfile {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  website: string;
  location: string;
  social_twitter: string;
  social_github: string;
  social_linkedin: string;
  social_facebook: string;
  social_instagram: string;
  social_youtube: string;
  role: string;
  created_at: string;
  stats: {
    published_posts: number;
    total_views: number;
    total_likes: number;
    total_comments: number;
  };
}

interface PostItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  cover_url?: string;
  published_at?: string;
  category?: { name: string; slug: string };
}

/* ─── Role config ──────────────────────────── */
const roleBadge: Record<string, { label: string; cls: string }> = {
  OWNER: {
    label: "Owner",
    cls: "bg-purple-100 text-purple-800 border-purple-200",
  },
  ADMIN: { label: "Admin", cls: "bg-red-50 text-red-700 border-red-200" },
  EDITOR: {
    label: "Editor",
    cls: "bg-amber-50 text-amber-700 border-amber-200",
  },
  AUTHOR: { label: "Author", cls: "bg-sky-50 text-sky-700 border-sky-200" },
  VIEWER: { label: "Member", cls: "bg-gray-100 text-gray-600 border-gray-200" },
};

/* ─── Inline icons ─────────────────────────── */
const icons = {
  calendar: (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
      />
    </svg>
  ),
  location: (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
      />
    </svg>
  ),
  link: (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"
      />
    </svg>
  ),
  article: (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
      />
    </svg>
  ),
  eye: (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  ),
  heart: (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
      />
    </svg>
  ),
  chatBubble: (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
      />
    </svg>
  ),
  externalLink: (
    <svg
      className="h-3.5 w-3.5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
      />
    </svg>
  ),
  person: (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
      />
    </svg>
  ),
};

/* ─── Social icon ──────────────────────────── */
function SocialIcon({ type, className }: { type: string; className?: string }) {
  const paths: Record<string, string> = {
    Twitter:
      "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
    GitHub:
      "M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12",
    LinkedIn:
      "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z",
    Facebook:
      "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z",
    Instagram:
      "M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678a6.162 6.162 0 100 12.324 6.162 6.162 0 100-12.324zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405a1.441 1.441 0 11-2.882 0 1.441 1.441 0 012.882 0z",
    YouTube:
      "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z",
  };
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d={paths[type] || ""} />
    </svg>
  );
}

const socialPrefix: Record<string, string> = {
  Twitter: "@",
  Instagram: "@",
};

export default function PublicProfilePage() {
  const params = useParams();
  const id = params?.id as string;
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [activeTab, setActiveTab] = useState<"articles" | "about">("articles");

  useEffect(() => {
    if (!id) return;
    Promise.all([
      fetch(`${API_URL}/users/${id}`).then((r) => (r.ok ? r.json() : null)),
      fetch(`${API_URL}/users/${id}/posts?limit=20`).then((r) =>
        r.ok ? r.json() : { items: [] },
      ),
    ])
      .then(([profileData, postsData]) => {
        if (!profileData) setNotFound(true);
        else {
          setProfile(profileData);
          setPosts(postsData?.items || []);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  /* ─── Loading ──────────────────────────────── */
  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50">
        <Navbar />
        <div className="flex flex-1 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
        </div>
        <Footer />
      </div>
    );
  }

  /* ─── Not Found ────────────────────────────── */
  if (notFound || !profile) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50">
        <Navbar />
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
            {icons.person}
          </div>
          <h1 className="text-xl font-semibold text-gray-800">
            User Tidak Ditemukan
          </h1>
          <p className="text-sm text-gray-500">
            Pengguna yang Anda cari tidak ada atau telah dihapus.
          </p>
          <Link
            href="/"
            className="mt-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
          >
            Kembali ke Beranda
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  /* ─── Derived ──────────────────────────────── */
  const badge = roleBadge[profile.role] || roleBadge.VIEWER;
  const joinDate = new Date(profile.created_at).toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  });

  const socialLinks = [
    { url: profile.social_twitter, label: "Twitter" },
    { url: profile.social_github, label: "GitHub" },
    { url: profile.social_linkedin, label: "LinkedIn" },
    { url: profile.social_facebook, label: "Facebook" },
    { url: profile.social_instagram, label: "Instagram" },
    { url: profile.social_youtube, label: "YouTube" },
  ].filter((s) => s.url);

  const fmtNum = (n: number) => {
    if (n >= 1_000_000)
      return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
    if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
    return n.toString();
  };

  const extractHandle = (url: string) => {
    try {
      const parts = new URL(url).pathname.split("/").filter(Boolean);
      return parts[parts.length - 1] || new URL(url).hostname;
    } catch {
      return url;
    }
  };

  /* ─── Render ───────────────────────────────── */
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Navbar />

      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-8 lg:flex-row">
            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                LEFT SIDEBAR (GitHub-style)
               ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            <aside className="w-full shrink-0 lg:w-72 xl:w-80">
              <div className="lg:sticky lg:top-24">
                {/* Avatar */}
                <div className="mb-4 flex justify-center lg:justify-start">
                  <div className="h-64 w-64 overflow-hidden rounded-full border-[3px] border-white bg-white shadow-md lg:h-72 lg:w-72 xl:h-80 xl:w-80">
                    {profile.avatar && !avatarError ? (
                      <img
                        src={profile.avatar}
                        alt={profile.name}
                        className="h-full w-full object-cover"
                        onError={() => setAvatarError(true)}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-sky-400 to-cyan-500">
                        <span className="text-7xl font-bold text-white">
                          {profile.name?.charAt(0)?.toUpperCase() || "?"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Name & role */}
                <div className="text-center lg:text-left">
                  <h1 className="text-[26px] font-bold leading-tight text-gray-900">
                    {profile.name}
                  </h1>
                  <div className="mt-1.5 flex items-center justify-center gap-2 lg:justify-start">
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${badge.cls}`}
                    >
                      {badge.label}
                    </span>
                  </div>
                </div>

                {/* Bio */}
                {profile.bio && (
                  <p className="mt-4 text-[15px] leading-relaxed text-gray-600 text-center lg:text-left">
                    {profile.bio}
                  </p>
                )}

                {/* Compact stats line (like GitHub followers · following) */}
                <div className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm text-gray-500 lg:justify-start">
                  <span className="inline-flex items-center gap-1">
                    {icons.article}
                    <strong className="font-semibold text-gray-800">
                      {fmtNum(profile.stats.published_posts)}
                    </strong>{" "}
                    artikel
                  </span>
                  <span className="text-gray-300">·</span>
                  <span className="inline-flex items-center gap-1">
                    {icons.eye}
                    <strong className="font-semibold text-gray-800">
                      {fmtNum(profile.stats.total_views)}
                    </strong>{" "}
                    views
                  </span>
                  <span className="text-gray-300">·</span>
                  <span className="inline-flex items-center gap-1">
                    {icons.heart}
                    <strong className="font-semibold text-gray-800">
                      {fmtNum(profile.stats.total_likes)}
                    </strong>{" "}
                    likes
                  </span>
                </div>

                {/* Divider */}
                <hr className="my-4 border-gray-200" />

                {/* Meta list */}
                <ul className="space-y-2 text-sm text-gray-600">
                  {profile.location && (
                    <li className="flex items-center gap-2">
                      <span className="shrink-0 text-gray-400">
                        {icons.location}
                      </span>
                      {profile.location}
                    </li>
                  )}
                  {profile.website && (
                    <li className="flex items-center gap-2">
                      <span className="shrink-0 text-gray-400">
                        {icons.link}
                      </span>
                      <a
                        href={profile.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="truncate font-medium text-sky-600 hover:underline"
                      >
                        {profile.website
                          .replace(/^https?:\/\//, "")
                          .replace(/\/$/, "")}
                      </a>
                    </li>
                  )}
                  <li className="flex items-center gap-2">
                    <span className="shrink-0 text-gray-400">
                      {icons.calendar}
                    </span>
                    Bergabung {joinDate}
                  </li>
                  {socialLinks.map((s) => (
                    <li key={s.label} className="flex items-center gap-2">
                      <span className="shrink-0 text-gray-400">
                        <SocialIcon type={s.label} className="h-4 w-4" />
                      </span>
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="truncate text-sky-600 hover:underline"
                      >
                        {socialPrefix[s.label] || ""}
                        {extractHandle(s.url!)}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>

            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                RIGHT CONTENT
               ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            <section className="min-w-0 flex-1">
              {/* Tab bar */}
              <div className="mb-6 border-b border-gray-200">
                <nav className="-mb-px flex gap-6">
                  <button
                    onClick={() => setActiveTab("articles")}
                    className={`flex items-center gap-1.5 border-b-2 px-1 pb-3 text-sm font-semibold transition-colors ${
                      activeTab === "articles"
                        ? "border-sky-500 text-gray-900"
                        : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                    }`}
                  >
                    {icons.article}
                    Artikel
                    <span
                      className={`ml-1 rounded-full px-2 py-0.5 text-xs ${activeTab === "articles" ? "bg-sky-100 text-sky-700" : "bg-gray-100 text-gray-500"}`}
                    >
                      {posts.length}
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveTab("about")}
                    className={`flex items-center gap-1.5 border-b-2 px-1 pb-3 text-sm font-semibold transition-colors ${
                      activeTab === "about"
                        ? "border-sky-500 text-gray-900"
                        : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                    }`}
                  >
                    {icons.person}
                    Tentang
                  </button>
                </nav>
              </div>

              {/* ── Articles tab ─────────────────── */}
              {activeTab === "articles" && (
                <>
                  {posts.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center">
                      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                        {icons.article}
                      </div>
                      <p className="font-medium text-gray-600">
                        Belum ada artikel yang dipublikasikan
                      </p>
                      <p className="mt-1 text-sm text-gray-400">
                        Artikel oleh {profile.name} akan muncul di sini.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200 overflow-hidden rounded-lg border border-gray-200 bg-white">
                      {posts.map((post) => (
                        <Link
                          key={post.id}
                          href={`/posts/${post.slug}`}
                          className="group flex gap-4 p-4 transition-colors hover:bg-gray-50"
                        >
                          {post.cover_url && (
                            <img
                              src={post.cover_url}
                              alt=""
                              className="h-16 w-24 shrink-0 rounded-md object-cover ring-1 ring-gray-200"
                            />
                          )}
                          <div className="min-w-0 flex-1">
                            <h3 className="text-[15px] font-semibold text-sky-600 group-hover:underline line-clamp-1">
                              {post.title}
                            </h3>
                            {post.excerpt && (
                              <p className="mt-0.5 text-sm text-gray-500 line-clamp-2 leading-relaxed">
                                {post.excerpt}
                              </p>
                            )}
                            <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
                              {post.category && (
                                <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 font-medium text-gray-600">
                                  {post.category.name}
                                </span>
                              )}
                              {post.published_at && (
                                <time>
                                  {new Date(
                                    post.published_at,
                                  ).toLocaleDateString("id-ID", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  })}
                                </time>
                              )}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* ── About tab ────────────────────── */}
              {activeTab === "about" && (
                <div className="space-y-6">
                  {/* Bio */}
                  <div className="rounded-lg border border-gray-200 bg-white p-6">
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Bio
                    </h3>
                    {profile.bio ? (
                      <p className="text-[15px] leading-relaxed text-gray-700 whitespace-pre-wrap">
                        {profile.bio}
                      </p>
                    ) : (
                      <p className="text-sm italic text-gray-400">
                        Belum ada bio.
                      </p>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="rounded-lg border border-gray-200 bg-white p-6">
                    <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Statistik
                    </h3>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                      {[
                        {
                          label: "Artikel",
                          value: profile.stats.published_posts,
                          icon: icons.article,
                          color: "text-sky-600",
                          bg: "bg-sky-50",
                        },
                        {
                          label: "Dilihat",
                          value: profile.stats.total_views,
                          icon: icons.eye,
                          color: "text-emerald-600",
                          bg: "bg-emerald-50",
                        },
                        {
                          label: "Disukai",
                          value: profile.stats.total_likes,
                          icon: icons.heart,
                          color: "text-rose-500",
                          bg: "bg-rose-50",
                        },
                        {
                          label: "Komentar",
                          value: profile.stats.total_comments,
                          icon: icons.chatBubble,
                          color: "text-amber-600",
                          bg: "bg-amber-50",
                        },
                      ].map((s) => (
                        <div key={s.label} className="text-center">
                          <div
                            className={`mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full ${s.bg} ${s.color}`}
                          >
                            {s.icon}
                          </div>
                          <div className="text-xl font-bold text-gray-900">
                            {fmtNum(s.value)}
                          </div>
                          <div className="text-xs text-gray-500">{s.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Links */}
                  {(profile.website || socialLinks.length > 0) && (
                    <div className="rounded-lg border border-gray-200 bg-white p-6">
                      <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Links
                      </h3>
                      <ul className="space-y-2.5">
                        {profile.website && (
                          <li>
                            <a
                              href={profile.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3 transition-colors hover:border-sky-200 hover:bg-sky-50/50"
                            >
                              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-gray-500 shadow-sm ring-1 ring-gray-200 group-hover:text-sky-600">
                                {icons.link}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-[11px] font-medium uppercase tracking-wider text-gray-400">
                                  Website
                                </div>
                                <div className="truncate text-sm font-medium text-sky-600">
                                  {profile.website
                                    .replace(/^https?:\/\//, "")
                                    .replace(/\/$/, "")}
                                </div>
                              </div>
                              <span className="text-gray-300 group-hover:text-sky-400">
                                {icons.externalLink}
                              </span>
                            </a>
                          </li>
                        )}
                        {socialLinks.map((s) => (
                          <li key={s.label}>
                            <a
                              href={s.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3 transition-colors hover:border-sky-200 hover:bg-sky-50/50"
                            >
                              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-gray-500 shadow-sm ring-1 ring-gray-200 group-hover:text-sky-600">
                                <SocialIcon
                                  type={s.label}
                                  className="h-4 w-4"
                                />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-[11px] font-medium uppercase tracking-wider text-gray-400">
                                  {s.label}
                                </div>
                                <div className="truncate text-sm font-medium text-sky-600">
                                  {socialPrefix[s.label] || ""}
                                  {extractHandle(s.url!)}
                                </div>
                              </div>
                              <span className="text-gray-300 group-hover:text-sky-400">
                                {icons.externalLink}
                              </span>
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
