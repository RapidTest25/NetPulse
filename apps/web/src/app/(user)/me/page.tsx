"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { userAPI, authAPI } from "@/lib/auth-api";
import type {
  Post,
  PostStatus,
  SavedPost,
  UserComment,
  AuthorRequest,
} from "@/types";

/* ─── Types ────────────────────────────────────── */
type TabKey =
  | "dashboard"
  | "posts"
  | "saved"
  | "likes"
  | "comments"
  | "profile"
  | "security"
  | "request-author";

interface Stats {
  total_posts: number;
  published: number;
  drafts: number;
  in_review: number;
}
interface AffiliateData {
  enrolled: boolean;
  profile?: { status: string; total_earnings: number; pending_balance: number };
}
interface Profile {
  id: string;
  name: string;
  email: string;
  bio?: string;
  avatar?: string;
  referral_code?: string;
  website?: string;
  location?: string;
  social_twitter?: string;
  social_github?: string;
  social_linkedin?: string;
  social_facebook?: string;
  social_instagram?: string;
  social_youtube?: string;
  auth_provider?: string;
  created_at: string;
}

const statusLabels: Record<PostStatus, { label: string; cls: string }> = {
  DRAFT: { label: "Draf", cls: "bg-gray-100 text-gray-700" },
  IN_REVIEW: { label: "Review", cls: "bg-amber-100 text-amber-700" },
  CHANGES_REQUESTED: { label: "Revisi", cls: "bg-orange-100 text-orange-700" },
  SCHEDULED: { label: "Terjadwal", cls: "bg-blue-100 text-blue-700" },
  PUBLISHED: { label: "Publish", cls: "bg-emerald-100 text-emerald-700" },
  ARCHIVED: { label: "Arsip", cls: "bg-gray-100 text-gray-600" },
};

/* ─── Sidebar Navigation Items ─────────────────── */
function getNavSections(isAuthor: boolean) {
  const menuItems = [
    {
      key: "dashboard" as TabKey,
      label: "Dashboard",
      icon: "M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25",
    },
    ...(isAuthor
      ? [
          {
            key: "posts" as TabKey,
            label: "Artikel Saya",
            icon: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z",
          },
        ]
      : []),
    {
      key: "saved" as TabKey,
      label: "Tersimpan",
      icon: "M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z",
    },
    {
      key: "likes" as TabKey,
      label: "Disukai",
      icon: "M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z",
    },
    {
      key: "comments" as TabKey,
      label: "Komentar",
      icon: "M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z",
    },
  ];

  const accountItems = [
    {
      key: "profile" as TabKey,
      label: "Profil",
      icon: "M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z",
    },
    {
      key: "security" as TabKey,
      label: "Keamanan",
      icon: "M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z",
    },
    ...(!isAuthor
      ? [
          {
            key: "request-author" as TabKey,
            label: "Minta Akses Author",
            icon: "M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10",
          },
        ]
      : []),
  ];

  return [
    { title: "Menu", items: menuItems },
    { title: "Akun", items: accountItems },
  ];
}
/* ─── Helper ───────────────────────────────────── */
function timeAgo(dateStr: string) {
  const d = new Date(dateStr);
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return "baru saja";
  if (diff < 3600) return `${Math.floor(diff / 60)}m lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}j lalu`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}h lalu`;
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/* ═══════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════ */
const validTabs: TabKey[] = [
  "dashboard",
  "posts",
  "saved",
  "likes",
  "comments",
  "profile",
  "security",
  "request-author",
];

function UserProfilePageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get("tab") as TabKey | null;
  const initialTab =
    tabParam && validTabs.includes(tabParam) ? tabParam : "dashboard";

  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const user = authAPI.getUser();

  const isAuthor =
    user && ["AUTHOR", "EDITOR", "ADMIN", "OWNER"].includes(user.role);

  const navSections = getNavSections(!!isAuthor);

  // Sync tab when URL query param changes (e.g. from ProfileMenu dropdown)
  useEffect(() => {
    if (tabParam && validTabs.includes(tabParam) && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update URL when tab changes via sidebar click
  const switchTab = useCallback(
    (tab: TabKey) => {
      setActiveTab(tab);
      setMobileMenuOpen(false);
      const url = tab === "dashboard" ? "/me" : `/me?tab=${tab}`;
      router.replace(url, { scroll: false });
    },
    [router],
  );

  return (
    <div className="flex gap-0 md:gap-8">
      {/* ── Mobile Tab Bar ─────────────────────────── */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur-sm md:hidden">
        <div className="flex">
          {[
            {
              key: "dashboard" as TabKey,
              label: "Home",
              icon: "M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25",
            },
            {
              key: "posts" as TabKey,
              label: "Artikel",
              icon: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z",
            },
            {
              key: "saved" as TabKey,
              label: "Simpan",
              icon: "M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z",
            },
            {
              key: "profile" as TabKey,
              label: "Profil",
              icon: "M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z",
            },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => switchTab(item.key)}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors ${activeTab === item.key ? "text-sky-600" : "text-gray-400"}`}
            >
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
                  d={item.icon}
                />
              </svg>
              {item.label}
            </button>
          ))}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors ${mobileMenuOpen ? "text-sky-600" : "text-gray-400"}`}
          >
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
                d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
              />
            </svg>
            Lainnya
          </button>
        </div>
      </div>

      {/* ── Mobile Slide-up Menu ───────────────────── */}
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-30 bg-black/30 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed inset-x-0 bottom-[52px] z-40 rounded-t-2xl border-t border-gray-200 bg-white p-4 md:hidden">
            <div className="grid grid-cols-3 gap-2">
              {navSections
                .flatMap((s) => s.items)
                .filter(
                  (item) =>
                    !["dashboard", "posts", "saved", "profile"].includes(
                      item.key,
                    ),
                )
                .map((item) => (
                  <button
                    key={item.key}
                    onClick={() => switchTab(item.key)}
                    className={`flex flex-col items-center gap-1 rounded-xl p-3 text-xs font-medium transition-colors ${activeTab === item.key ? "bg-sky-50 text-sky-600" : "text-gray-500 hover:bg-gray-50"}`}
                  >
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
                        d={item.icon}
                      />
                    </svg>
                    {item.label}
                  </button>
                ))}
            </div>
          </div>
        </>
      )}

      {/* ── Desktop Sidebar ────────────────────────── */}
      <aside className="sticky top-20 hidden h-fit w-56 shrink-0 md:block">
        {/* User card */}
        <div className="mb-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-cyan-600 text-sm font-bold text-white">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gray-900">
                {user?.name || "User"}
              </p>
              <p className="truncate text-xs text-gray-400">
                {user?.role || "VIEWER"}
              </p>
            </div>
          </div>
        </div>

        <nav className="space-y-5">
          {navSections.map((section) => (
            <div key={section.title}>
              <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                {section.title}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <button
                    key={item.key}
                    onClick={() => switchTab(item.key)}
                    className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${activeTab === item.key ? "bg-sky-50 text-sky-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}
                  >
                    <svg
                      className="h-[18px] w-[18px] shrink-0"
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
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Write button for authors */}
        {isAuthor && (
          <Link
            href="/write"
            className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-sky-700"
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
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
            Tulis Artikel
          </Link>
        )}
      </aside>

      {/* ── Main Content ──────────────────────────── */}
      <main className="min-w-0 flex-1 pb-20 md:pb-0">
        {activeTab === "dashboard" && <DashboardTab />}
        {activeTab === "posts" && <PostsTab />}
        {activeTab === "saved" && <SavedTab />}
        {activeTab === "likes" && <LikesTab />}
        {activeTab === "comments" && <CommentsTab />}
        {activeTab === "profile" && <ProfileTab />}
        {activeTab === "security" && <SecurityTab />}
        {activeTab === "request-author" && <RequestAuthorTab />}
      </main>
    </div>
  );
}

export default function UserProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-500 border-t-transparent" />
        </div>
      }
    >
      <UserProfilePageInner />
    </Suspense>
  );
}

/* ═══════════════════════════════════════════════════
   TAB: Dashboard
   ═══════════════════════════════════════════════════ */
function DashboardTab() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [affiliate, setAffiliate] = useState<AffiliateData | null>(null);
  const [loading, setLoading] = useState(true);
  const user = authAPI.getUser();
  const isAuthor =
    user && ["AUTHOR", "EDITOR", "ADMIN", "OWNER"].includes(user.role);

  useEffect(() => {
    Promise.all([
      userAPI.getAuthorStats().catch(() => null),
      userAPI.getAffiliateProfile().catch(() => null),
    ])
      .then(([s, a]) => {
        setStats(s);
        setAffiliate(a);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const statCards = [
    {
      label: "Total Artikel",
      value: stats?.total_posts ?? 0,
      color: "bg-sky-50 text-sky-700",
      icon: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z",
    },
    {
      label: "Terpublish",
      value: stats?.published ?? 0,
      color: "bg-emerald-50 text-emerald-700",
      icon: "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    },
    {
      label: "Draf",
      value: stats?.drafts ?? 0,
      color: "bg-amber-50 text-amber-700",
      icon: "M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10",
    },
    {
      label: "Sedang Review",
      value: stats?.in_review ?? 0,
      color: "bg-purple-50 text-purple-700",
      icon: "M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="mt-1 text-sm text-gray-500">
          Ringkasan aktivitas Anda di NetPulse.
        </p>
      </div>

      {isAuthor && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {statCards.map((c) => (
            <div
              key={c.label}
              className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${c.color}`}
                >
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
                      d={c.icon}
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-[11px] font-medium text-gray-500">
                    {c.label}
                  </p>
                  <p className="text-xl font-bold text-gray-900">{c.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {isAuthor ? (
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h3 className="mb-2 text-sm font-semibold text-gray-900">
              Mulai Menulis
            </h3>
            <p className="mb-3 text-xs text-gray-500">
              Tulis artikel baru dan submit untuk review.
            </p>
            <Link
              href="/write"
              className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
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
                  d="M12 4.5v15m7.5-7.5h-15"
                />
              </svg>
              Tulis Artikel
            </Link>
          </div>
        ) : (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
            <h3 className="mb-2 text-sm font-semibold text-amber-800">
              Ingin Menulis Artikel?
            </h3>
            <p className="mb-3 text-xs text-amber-700">
              Anda perlu memiliki role Author untuk bisa menulis dan
              mempublikasikan artikel. Ajukan permintaan akses sekarang.
            </p>
            <Link
              href="/me?tab=request-author"
              className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
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
                  d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"
                />
              </svg>
              Minta Akses Author
            </Link>
          </div>
        )}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h3 className="mb-2 text-sm font-semibold text-gray-900">
            Program Afiliasi
          </h3>
          {affiliate?.enrolled ? (
            <div>
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${affiliate.profile?.status === "APPROVED" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}
              >
                {affiliate.profile?.status}
              </span>
              <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-gray-400">Earnings</p>
                  <p className="font-bold text-gray-900">
                    Rp{" "}
                    {(affiliate.profile?.total_earnings ?? 0).toLocaleString(
                      "id-ID",
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Pending</p>
                  <p className="font-bold text-gray-900">
                    Rp{" "}
                    {(affiliate.profile?.pending_balance ?? 0).toLocaleString(
                      "id-ID",
                    )}
                  </p>
                </div>
              </div>
              <Link
                href="/me/affiliate"
                className="mt-2 inline-block text-xs font-medium text-sky-600 hover:text-sky-700"
              >
                Lihat detail →
              </Link>
            </div>
          ) : (
            <div>
              <p className="mb-3 text-xs text-gray-500">
                Bergabung dan dapatkan komisi dari referral.
              </p>
              <Link
                href="/me/affiliate"
                className="inline-flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-medium text-sky-700 hover:bg-sky-100"
              >
                Pelajari
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   TAB: Posts (Artikel Saya)
   ═══════════════════════════════════════════════════ */
function PostsTab() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await userAPI.getPosts({
        page,
        limit: 15,
        status: statusFilter || undefined,
      });
      setPosts(data.items || []);
      setTotal(data.total || 0);
      setTotalPages(data.total_pages || 1);
    } catch {
      /* empty */
    }
    setLoading(false);
  }, [page, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSubmitReview = async (id: string) => {
    if (!confirm("Submit artikel ini untuk review?")) return;
    try {
      await userAPI.submitPostForReview(id);
      load();
    } catch (e: any) {
      alert(e.message);
    }
  };
  const handleDelete = async (id: string) => {
    if (!confirm("Hapus artikel draft ini?")) return;
    try {
      await userAPI.deletePost(id);
      load();
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Artikel Saya</h2>
          <p className="text-sm text-gray-500">{total} artikel</p>
        </div>
        <Link
          href="/me/posts/new"
          className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-700"
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
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
          Tulis Baru
        </Link>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {[
          "",
          "DRAFT",
          "IN_REVIEW",
          "CHANGES_REQUESTED",
          "PUBLISHED",
          "ARCHIVED",
        ].map((s) => (
          <button
            key={s}
            onClick={() => {
              setStatusFilter(s);
              setPage(1);
            }}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${statusFilter === s ? "bg-sky-100 text-sky-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            {s === "" ? "Semua" : statusLabels[s as PostStatus]?.label || s}
          </button>
        ))}
      </div>

      {loading ? (
        <Spinner />
      ) : posts.length === 0 ? (
        <EmptyState
          icon="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
          title="Belum ada artikel"
          subtitle="Tulis artikel pertama!"
          linkHref="/me/posts/new"
          linkText="Tulis Artikel →"
        />
      ) : (
        <div className="space-y-2">
          {posts.map((post) => (
            <div
              key={post.id}
              className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/me/posts/${post.id}`}
                    className="font-semibold text-gray-900 hover:text-sky-600"
                  >
                    {post.title}
                  </Link>
                  {post.excerpt && (
                    <p className="mt-0.5 line-clamp-1 text-sm text-gray-500">
                      {post.excerpt}
                    </p>
                  )}
                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-gray-400">
                    <span>
                      {new Date(post.created_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    {post.category && <span>• {post.category.name}</span>}
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 font-medium ${statusLabels[post.status]?.cls || "bg-gray-100 text-gray-600"}`}
                    >
                      {statusLabels[post.status]?.label || post.status}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  {(post.status === "DRAFT" ||
                    post.status === "CHANGES_REQUESTED") && (
                    <>
                      <Link
                        href={`/me/posts/${post.id}`}
                        className="rounded-lg bg-gray-50 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleSubmitReview(post.id)}
                        className="rounded-lg bg-sky-50 px-2.5 py-1.5 text-xs font-medium text-sky-700 hover:bg-sky-100"
                      >
                        Review
                      </button>
                    </>
                  )}
                  {post.status === "DRAFT" && (
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100"
                    >
                      Hapus
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   TAB: Saved
   ═══════════════════════════════════════════════════ */
function SavedTab() {
  const [posts, setPosts] = useState<SavedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setLoading(true);
    userAPI
      .getSavedPosts(page, 12)
      .then((r) => {
        setPosts(r.data || r.items || []);
        setTotal(r.total || 0);
      })
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, [page]);

  const handleUnsave = async (postId: string) => {
    try {
      await userAPI.toggleSave(postId);
      setPosts((p) => p.filter((x) => x.post_id !== postId));
      setTotal((t) => t - 1);
    } catch {
      /* empty */
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Tersimpan</h2>
        <p className="mt-1 text-sm text-gray-500">{total} artikel</p>
      </div>
      {loading ? (
        <Spinner />
      ) : posts.length === 0 ? (
        <EmptyState
          icon="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
          title="Belum ada artikel tersimpan"
          subtitle="Simpan artikel menarik untuk dibaca nanti"
          linkHref="/blog"
          linkText="Jelajahi Artikel"
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {posts.map((p) => (
            <PostCard
              key={p.id}
              slug={p.post_slug}
              title={p.post_title}
              excerpt={p.post_excerpt}
              cover={p.post_cover_url}
              author={p.author_name}
              action={
                <button
                  onClick={() => handleUnsave(p.post_id)}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                  title="Hapus"
                >
                  <svg
                    className="h-4 w-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
                  </svg>
                </button>
              }
            />
          ))}
        </div>
      )}
      {Math.ceil(total / 12) > 1 && (
        <Pagination
          page={page}
          totalPages={Math.ceil(total / 12)}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   TAB: Likes
   ═══════════════════════════════════════════════════ */
function LikesTab() {
  const [posts, setPosts] = useState<SavedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setLoading(true);
    userAPI
      .getLikedPosts(page, 12)
      .then((r) => {
        setPosts(r.data || r.items || []);
        setTotal(r.total || 0);
      })
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Disukai</h2>
        <p className="mt-1 text-sm text-gray-500">{total} artikel</p>
      </div>
      {loading ? (
        <Spinner />
      ) : posts.length === 0 ? (
        <EmptyState
          icon="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
          title="Belum ada artikel disukai"
          subtitle="Sukai artikel untuk menandai favorit"
          linkHref="/blog"
          linkText="Jelajahi Artikel"
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {posts.map((p) => (
            <PostCard
              key={p.id || p.post_id}
              slug={p.post_slug}
              title={p.post_title}
              excerpt={p.post_excerpt}
              cover={p.post_cover_url}
              author={p.author_name}
              action={
                <svg
                  className="h-4 w-4 text-red-500"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                </svg>
              }
            />
          ))}
        </div>
      )}
      {Math.ceil(total / 12) > 1 && (
        <Pagination
          page={page}
          totalPages={Math.ceil(total / 12)}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   TAB: Comments
   ═══════════════════════════════════════════════════ */
function CommentsTab() {
  const [comments, setComments] = useState<UserComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setLoading(true);
    userAPI
      .getMyComments(page, 20)
      .then((r) => {
        setComments(r.data || r.items || []);
        setTotal(r.total || 0);
      })
      .catch(() => setComments([]))
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Komentar</h2>
        <p className="mt-1 text-sm text-gray-500">{total} komentar</p>
      </div>
      {loading ? (
        <Spinner />
      ) : comments.length === 0 ? (
        <EmptyState
          icon="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
          title="Belum ada komentar"
          subtitle="Mulai berkomentar di artikel"
          linkHref="/blog"
          linkText="Jelajahi Artikel"
        />
      ) : (
        <div className="space-y-2">
          {comments.map((c) => (
            <div
              key={c.id}
              className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
            >
              <Link
                href={`/posts/${c.post_slug}`}
                className="text-sm font-medium text-sky-600 hover:text-sky-700"
              >
                {c.post_title}
              </Link>
              <p className="mt-1 text-sm text-gray-700">{c.content}</p>
              <p className="mt-1.5 text-xs text-gray-400">
                {timeAgo(c.created_at)}
              </p>
            </div>
          ))}
        </div>
      )}
      {Math.ceil(total / 20) > 1 && (
        <Pagination
          page={page}
          totalPages={Math.ceil(total / 20)}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   TAB: Profile
   ═══════════════════════════════════════════════════ */
function ProfileTab() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState("");
  const [website, setWebsite] = useState("");
  const [location, setLocation] = useState("");
  const [socialTwitter, setSocialTwitter] = useState("");
  const [socialGithub, setSocialGithub] = useState("");
  const [socialLinkedin, setSocialLinkedin] = useState("");
  const [socialFacebook, setSocialFacebook] = useState("");
  const [socialInstagram, setSocialInstagram] = useState("");
  const [socialYoutube, setSocialYoutube] = useState("");

  useEffect(() => {
    userAPI
      .getMe()
      .then((d: Profile) => {
        setProfile(d);
        setName(d.name || "");
        setBio(d.bio || "");
        setAvatar(d.avatar || "");
        setWebsite(d.website || "");
        setLocation(d.location || "");
        setSocialTwitter(d.social_twitter || "");
        setSocialGithub(d.social_github || "");
        setSocialLinkedin(d.social_linkedin || "");
        setSocialFacebook(d.social_facebook || "");
        setSocialInstagram(d.social_instagram || "");
        setSocialYoutube(d.social_youtube || "");
      })
      .catch(() => {
        const u = authAPI.getUser();
        if (u) {
          setProfile(u as any);
          setName(u.name || "");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      const updated = await userAPI.updateMe({
        name,
        bio,
        avatar,
        website,
        location,
        social_twitter: socialTwitter,
        social_github: socialGithub,
        social_linkedin: socialLinkedin,
        social_facebook: socialFacebook,
        social_instagram: socialInstagram,
        social_youtube: socialYoutube,
      });
      setProfile(updated);
      setSuccess("Profil berhasil diperbarui!");
      const u = authAPI.getUser();
      if (u) localStorage.setItem("user", JSON.stringify({ ...u, name }));
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message || "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner />;

  const socialFields = [
    {
      label: "Twitter / X",
      value: socialTwitter,
      setter: setSocialTwitter,
      placeholder: "https://twitter.com/username",
      icon: "𝕏",
    },
    {
      label: "GitHub",
      value: socialGithub,
      setter: setSocialGithub,
      placeholder: "https://github.com/username",
      icon: "⌨",
    },
    {
      label: "LinkedIn",
      value: socialLinkedin,
      setter: setSocialLinkedin,
      placeholder: "https://linkedin.com/in/username",
      icon: "in",
    },
    {
      label: "Facebook",
      value: socialFacebook,
      setter: setSocialFacebook,
      placeholder: "https://facebook.com/username",
      icon: "f",
    },
    {
      label: "Instagram",
      value: socialInstagram,
      setter: setSocialInstagram,
      placeholder: "https://instagram.com/username",
      icon: "📷",
    },
    {
      label: "YouTube",
      value: socialYoutube,
      setter: setSocialYoutube,
      placeholder: "https://youtube.com/@channel",
      icon: "▶",
    },
  ];

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-bold text-gray-900">Profil</h2>
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

      <form onSubmit={handleSave} className="space-y-5">
        {/* Avatar */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="mb-3 text-sm font-semibold text-gray-700">
            Foto Profil
          </h3>
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-sky-500 to-cyan-600 text-xl font-bold text-white">
              {avatar ? (
                <img
                  src={avatar}
                  alt="Avatar"
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                name?.charAt(0)?.toUpperCase() || "?"
              )}
            </div>
            <div className="flex-1">
              <input
                type="url"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
              <p className="mt-1 text-xs text-gray-400">URL gambar profil</p>
            </div>
          </div>
        </div>

        {/* Basic Info */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="mb-3 text-sm font-semibold text-gray-700">
            Informasi Dasar
          </h3>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-600">
                Nama
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-600">
                Email
              </label>
              <input
                type="email"
                value={profile?.email || ""}
                disabled
                className="w-full rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-gray-500"
              />
              {profile?.auth_provider === "google" && (
                <p className="mt-1 flex items-center gap-1 text-xs text-gray-400">
                  <span className="inline-block h-3 w-3 rounded-full bg-[#4285F4]" />
                  Terhubung dengan Google
                </p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-600">
                Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                placeholder="Ceritakan sedikit tentang diri Anda..."
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-600">
                  Website
                </label>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://yoursite.com"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-600">
                  Lokasi
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Jakarta, Indonesia"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Social Links */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="mb-3 text-sm font-semibold text-gray-700">
            Link Sosial Media
          </h3>
          <div className="space-y-3">
            {socialFields.map((sf) => (
              <div key={sf.label} className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-xs font-bold text-gray-600">
                  {sf.icon}
                </span>
                <div className="flex-1">
                  <input
                    type="url"
                    value={sf.value}
                    onChange={(e) => sf.setter(e.target.value)}
                    placeholder={sf.placeholder}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {profile?.referral_code && (
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h3 className="mb-2 text-sm font-semibold text-gray-700">
              Kode Referral
            </h3>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-lg bg-gray-50 px-3 py-2 font-mono text-sm text-sky-600">
                {profile.referral_code}
              </code>
              <button
                type="button"
                onClick={() =>
                  navigator.clipboard.writeText(profile.referral_code || "")
                }
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-500 hover:bg-gray-50"
              >
                Salin
              </button>
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
          >
            {saving ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   TAB: Security
   ═══════════════════════════════════════════════════ */
function SecurityTab() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Email change state
  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [emailToken, setEmailToken] = useState("");
  const [emailStep, setEmailStep] = useState<"form" | "verify">("form");
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [emailSuccess, setEmailSuccess] = useState("");
  const [currentEmail, setCurrentEmail] = useState("");

  useEffect(() => {
    userAPI
      .getMe()
      .then((d: any) => setCurrentEmail(d.email || ""))
      .catch(() => {});
  }, []);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (newPassword.length < 8) {
      setError("Password baru minimal 8 karakter");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Konfirmasi password tidak cocok");
      return;
    }
    setSaving(true);
    try {
      await userAPI.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      setSuccess("Password berhasil diubah!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message || "Gagal mengubah password");
    } finally {
      setSaving(false);
    }
  };

  const handleEmailRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError("");
    setEmailSuccess("");
    if (!newEmail || !emailPassword) {
      setEmailError("Email baru dan password diperlukan");
      return;
    }
    setEmailSaving(true);
    try {
      const res = await userAPI.requestEmailChange({
        new_email: newEmail,
        password: emailPassword,
      });
      // In dev mode, the token is returned directly
      if (res.verify_token) {
        setEmailToken(res.verify_token);
      }
      setEmailStep("verify");
      setEmailSuccess(
        "Kode verifikasi telah dikirim ke email Anda saat ini. Masukkan kode untuk mengkonfirmasi.",
      );
      setTimeout(() => setEmailSuccess(""), 5000);
    } catch (err: any) {
      setEmailError(err.message || "Gagal mengirim permintaan ganti email");
    } finally {
      setEmailSaving(false);
    }
  };

  const handleEmailConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError("");
    setEmailSuccess("");
    if (!emailToken) {
      setEmailError("Token verifikasi diperlukan");
      return;
    }
    setEmailSaving(true);
    try {
      const res = await userAPI.confirmEmailChange({ token: emailToken });
      setCurrentEmail(res.email || newEmail);
      setEmailSuccess("Email berhasil diubah!");
      setEmailStep("form");
      setNewEmail("");
      setEmailPassword("");
      setEmailToken("");
      // Update localStorage
      const u = authAPI.getUser();
      if (u)
        localStorage.setItem(
          "user",
          JSON.stringify({ ...u, email: res.email || newEmail }),
        );
      setTimeout(() => setEmailSuccess(""), 3000);
    } catch (err: any) {
      setEmailError(err.message || "Gagal mengkonfirmasi ganti email");
    } finally {
      setEmailSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-bold text-gray-900">Keamanan</h2>

      {/* Email Change Section */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="mb-3 text-sm font-semibold text-gray-700">Ubah Email</h3>
        {emailError && (
          <div className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {emailError}
          </div>
        )}
        {emailSuccess && (
          <div className="mb-3 rounded-lg bg-green-50 p-3 text-sm text-green-600">
            {emailSuccess}
          </div>
        )}

        <div className="mb-3">
          <p className="text-sm text-gray-500">
            Email saat ini:{" "}
            <span className="font-medium text-gray-900">{currentEmail}</span>
          </p>
        </div>

        {emailStep === "form" ? (
          <form onSubmit={handleEmailRequest} className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-600">
                Email Baru
              </label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
                placeholder="email-baru@example.com"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-600">
                Password Akun (konfirmasi)
              </label>
              <input
                type="password"
                value={emailPassword}
                onChange={(e) => setEmailPassword(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
              <p className="mt-1 text-xs text-gray-400">
                Masukkan password akun Anda untuk verifikasi
              </p>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={emailSaving}
                className="rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
              >
                {emailSaving ? "Mengirim..." : "Kirim Kode Verifikasi"}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleEmailConfirm} className="space-y-3">
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-700">
              Kode verifikasi telah dikirim ke <strong>{currentEmail}</strong>.
              Masukkan kode di bawah untuk mengkonfirmasi perubahan email ke{" "}
              <strong>{newEmail}</strong>.
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-600">
                Kode Verifikasi
              </label>
              <input
                type="text"
                value={emailToken}
                onChange={(e) => setEmailToken(e.target.value)}
                required
                placeholder="Masukkan kode verifikasi"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setEmailStep("form");
                  setEmailToken("");
                  setEmailError("");
                }}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Kembali
              </button>
              <button
                type="submit"
                disabled={emailSaving}
                className="rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
              >
                {emailSaving ? "Memverifikasi..." : "Konfirmasi Perubahan"}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Password Change Section */}
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

      <form onSubmit={handlePasswordSubmit} className="space-y-5">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="mb-3 text-sm font-semibold text-gray-700">
            Ubah Password
          </h3>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-600">
                Password Saat Ini
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-600">
                Password Baru
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
              <p className="mt-1 text-xs text-gray-400">Minimal 8 karakter</p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-600">
                Konfirmasi Password Baru
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
          >
            {saving ? "Menyimpan..." : "Ubah Password"}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   TAB: Request Author
   ═══════════════════════════════════════════════════ */
function RequestAuthorTab() {
  const [request, setRequest] = useState<AuthorRequest | null>(null);
  const [hasRequest, setHasRequest] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const user = authAPI.getUser();
  const isAlreadyAuthor =
    user && ["AUTHOR", "EDITOR", "ADMIN", "OWNER"].includes(user.role);

  useEffect(() => {
    userAPI
      .getAuthorRequestStatus()
      .then((r) => {
        setHasRequest(r.has_request);
        if (r.request) setRequest(r.request);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError("Alasan tidak boleh kosong");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const res = await userAPI.createAuthorRequest(reason);
      setRequest(res);
      setHasRequest(true);
      setSuccess("Permintaan berhasil dikirim!");
    } catch (err: any) {
      setError(err.message || "Gagal mengirim permintaan");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Spinner />;
  if (isAlreadyAuthor) {
    return (
      <div className="rounded-2xl border border-green-100 bg-green-50 py-12 text-center">
        <svg
          className="mx-auto h-10 w-10 text-green-500"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h3 className="mt-3 text-lg font-semibold text-green-900">
          Kamu sudah Author!
        </h3>
        <p className="mt-1 text-sm text-green-700">
          Kamu bisa langsung menulis artikel.
        </p>
        <Link
          href="/write"
          className="mt-3 inline-block rounded-full bg-green-600 px-5 py-2 text-sm font-medium text-white hover:bg-green-700"
        >
          Tulis Artikel
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Minta Akses Author</h2>
        <p className="mt-1 text-sm text-gray-500">
          Kirim permintaan ke admin untuk mendapat akses menulis.
        </p>
      </div>

      {hasRequest && request ? (
        <div
          className={`rounded-xl border p-5 ${request.status === "PENDING" ? "border-amber-200 bg-amber-50" : request.status === "APPROVED" ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}
        >
          <h3 className="font-semibold text-gray-900">
            {request.status === "PENDING"
              ? "Menunggu Review"
              : request.status === "APPROVED"
                ? "Disetujui!"
                : "Ditolak"}
          </h3>
          <p className="mt-1 text-sm text-gray-600">
            {request.status === "PENDING"
              ? "Permintaan sedang ditinjau admin."
              : request.status === "APPROVED"
                ? "Selamat! Kamu bisa menulis artikel."
                : "Admin menolak permintaan kamu."}
          </p>
          {request.admin_note && (
            <div className="mt-3 rounded-lg bg-white/60 p-3">
              <p className="text-xs font-medium text-gray-500">
                Catatan admin:
              </p>
              <p className="mt-0.5 text-sm text-gray-700">
                {request.admin_note}
              </p>
            </div>
          )}
          <p className="mt-3 text-xs text-gray-400">
            Diajukan:{" "}
            {new Date(request.created_at).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
      ) : (
        <>
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
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h3 className="mb-3 text-sm font-semibold text-gray-700">
                Mengapa kamu ingin menjadi Author?
              </h3>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                required
                placeholder="Ceritakan pengalaman menulis kamu..."
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
              >
                {submitting ? "Mengirim..." : "Kirim Permintaan"}
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   SHARED COMPONENTS
   ═══════════════════════════════════════════════════ */
function Spinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-sky-500 border-t-transparent" />
    </div>
  );
}

function EmptyState({
  icon,
  title,
  subtitle,
  linkHref,
  linkText,
}: {
  icon: string;
  title: string;
  subtitle: string;
  linkHref: string;
  linkText: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 py-14 text-center">
      <svg
        className="mx-auto h-10 w-10 text-gray-300"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1}
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
      </svg>
      <h3 className="mt-3 text-base font-semibold text-gray-900">{title}</h3>
      <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
      <Link
        href={linkHref}
        className="mt-3 inline-block rounded-full bg-sky-500 px-5 py-2 text-sm font-medium text-white hover:bg-sky-600"
      >
        {linkText}
      </Link>
    </div>
  );
}

function PostCard({
  slug,
  title,
  excerpt,
  cover,
  author,
  action,
}: {
  slug: string;
  title: string;
  excerpt?: string;
  cover?: string;
  author?: string;
  action: React.ReactNode;
}) {
  return (
    <article className="group overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md">
      {cover && (
        <Link href={`/posts/${slug}`}>
          <div className="aspect-video overflow-hidden">
            <img
              src={cover}
              alt={title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        </Link>
      )}
      <div className="p-4">
        <Link href={`/posts/${slug}`}>
          <h3 className="line-clamp-2 font-semibold text-gray-900 group-hover:text-sky-600">
            {title}
          </h3>
        </Link>
        {excerpt && (
          <p className="mt-1 line-clamp-2 text-sm text-gray-500">{excerpt}</p>
        )}
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-gray-400">{author}</span>
          {action}
        </div>
      </div>
    </article>
  );
}

function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}) {
  return (
    <div className="flex items-center justify-center gap-2 pt-2">
      <button
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40"
      >
        Sebelumnya
      </button>
      <span className="px-3 text-sm text-gray-500">
        {page} / {totalPages}
      </span>
      <button
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40"
      >
        Selanjutnya
      </button>
    </div>
  );
}
