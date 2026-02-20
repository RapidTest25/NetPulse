"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { authFetch } from "@/lib/auth";
import { adminAPI } from "@/lib/auth-api";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

interface DashboardStats {
  total_posts: number;
  published: number;
  drafts: number;
  total_users: number;
  total_categories: number;
  total_views: number;
}

interface TopPost {
  title: string;
  slug: string;
  views: number;
  likes: number;
}

interface DayStat {
  date: string;
  count: number;
}
interface RefStat {
  source: string;
  count: number;
}
interface PageStat {
  post_id: string;
  title: string;
  slug: string;
  count: number;
}
interface TrafficData {
  views_by_day: DayStat[];
  views_by_hour: DayStat[];
  today_views: number;
  yesterday_views: number;
  week_views: number;
  month_views: number;
  top_referrers: RefStat[];
  top_pages: PageStat[];
}

const statCards = [
  {
    key: "total_posts" as const,
    label: "Total Artikel",
    icon: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z",
    color: "text-blue-600 bg-blue-50",
  },
  {
    key: "published" as const,
    label: "Terpublish",
    icon: "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    color: "text-emerald-600 bg-emerald-50",
  },
  {
    key: "drafts" as const,
    label: "Draft",
    icon: "M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10",
    color: "text-amber-600 bg-amber-50",
  },
  {
    key: "total_users" as const,
    label: "Pengguna",
    icon: "M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z",
    color: "text-violet-600 bg-violet-50",
  },
  {
    key: "total_categories" as const,
    label: "Kategori",
    icon: "M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z",
    color: "text-pink-600 bg-pink-50",
  },
  {
    key: "total_views" as const,
    label: "Total Views",
    icon: "M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z",
    color: "text-cyan-600 bg-cyan-50",
  },
];

const quickActions = [
  {
    label: "Tulis Artikel Baru",
    href: "/admin/posts/new",
    icon: "M12 4.5v15m7.5-7.5h-15",
  },
  {
    label: "Kelola Pengguna",
    href: "/admin/users",
    icon: "M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z",
  },
  {
    label: "Moderasi Komentar",
    href: "/admin/comments",
    icon: "M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z",
  },
  {
    label: "Media Library",
    href: "/admin/media",
    icon: "M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z",
  },
  {
    label: "Pengaturan",
    href: "/admin/settings",
    icon: "M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.991l1.004.827c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z",
  },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    total_posts: 0,
    published: 0,
    drafts: 0,
    total_users: 1,
    total_categories: 0,
    total_views: 0,
  });
  const [recentPosts, setRecentPosts] = useState<any[]>([]);
  const [topPosts, setTopPosts] = useState<TopPost[]>([]);
  const [traffic, setTraffic] = useState<TrafficData | null>(null);
  const [loading, setLoading] = useState(true);
  const [trafficTab, setTrafficTab] = useState<"30d" | "24h">("30d");

  const fetchData = useCallback(async () => {
    try {
      const [postsRes, catsRes, statsRes, topPostsRes, trafficRes] =
        await Promise.all([
          fetch(`${API}/posts?limit=5`).then((r) => r.json()),
          fetch(`${API}/categories`).then((r) => r.json()),
          authFetch(`${API}/admin/stats/dashboard`)
            .then((r) => (r.ok ? r.json() : null))
            .catch(() => null),
          authFetch(`${API}/admin/stats/top-posts?limit=5`)
            .then((r) => (r.ok ? r.json() : null))
            .catch(() => null),
          adminAPI.getTrafficOverview().catch(() => null),
        ]);
      const posts = postsRes.items || [];
      const cats = catsRes || [];

      if (statsRes) {
        setStats({
          total_posts: statsRes.total_posts ?? 0,
          published: statsRes.published_posts ?? 0,
          drafts: statsRes.draft_posts ?? 0,
          total_users: statsRes.total_users ?? 1,
          total_categories: cats.length,
          total_views: statsRes.total_views ?? 0,
        });
      } else {
        const pub = posts.filter((p: any) => p.status === "published").length;
        setStats({
          total_posts: postsRes.total || posts.length,
          published: pub || posts.length,
          drafts: (postsRes.total || posts.length) - pub,
          total_users: 1,
          total_categories: cats.length,
          total_views: 0,
        });
      }

      setRecentPosts(posts);
      if (topPostsRes?.items) {
        setTopPosts(
          topPostsRes.items.map((tp: any) => ({
            title: tp.title,
            slug: tp.slug,
            views: tp.views ?? 0,
            likes: tp.likes ?? 0,
          })),
        );
      }
      if (trafficRes) setTraffic(trafficRes);
    } catch {
      /* keep defaults */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Compute chart max values
  const dayMax = useMemo(
    () => traffic?.views_by_day?.reduce((m, d) => Math.max(m, d.count), 0) || 1,
    [traffic],
  );
  const hourMax = useMemo(
    () =>
      traffic?.views_by_hour?.reduce((m, d) => Math.max(m, d.count), 0) || 1,
    [traffic],
  );

  // Format helpers
  const fmtDate = (d: string) => {
    const dt = new Date(d);
    return dt.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
  };
  const fmtHour = (d: string) => {
    const dt = new Date(d);
    return `${dt.getHours().toString().padStart(2, "0")}:00`;
  };
  const fmtNum = (n: number) =>
    n >= 1000 ? `${(n / 1000).toFixed(1)}K` : n.toString();

  // DDoS alert: if any hour in last 24h exceeds 3x the average
  const ddosAlert = useMemo(() => {
    if (!traffic?.views_by_hour?.length) return false;
    const avg =
      traffic.views_by_hour.reduce((s, h) => s + h.count, 0) /
      traffic.views_by_hour.length;
    return (
      avg > 0 &&
      traffic.views_by_hour.some((h) => h.count > avg * 3 && h.count > 50)
    );
  }, [traffic]);

  // Traffic change percentage
  const trafficChange = useMemo(() => {
    if (!traffic) return 0;
    if (traffic.yesterday_views === 0) return traffic.today_views > 0 ? 100 : 0;
    return Math.round(
      ((traffic.today_views - traffic.yesterday_views) /
        traffic.yesterday_views) *
        100,
    );
  }, [traffic]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Gambaran umum blog NetPulse.
          </p>
        </div>
        <button
          onClick={() => {
            setLoading(true);
            fetchData();
          }}
          className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-medium text-gray-600 shadow-sm transition-all hover:bg-gray-50 hover:shadow"
        >
          <svg
            className="h-3.5 w-3.5"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.992 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182"
            />
          </svg>
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((card) => (
          <div
            key={card.key}
            className="group relative overflow-hidden rounded-2xl border border-gray-200/60 bg-white p-5 shadow-sm transition-all hover:shadow-md"
          >
            <div className="flex items-center gap-4">
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl ${card.color}`}
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
                    d={card.icon}
                  />
                </svg>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">
                  {card.label}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {loading ? (
                    <span className="inline-block h-7 w-12 animate-pulse rounded bg-gray-200" />
                  ) : (
                    stats[card.key].toLocaleString("id-ID")
                  )}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Traffic Monitoring Section */}
      {(traffic || loading) && (
        <div className="space-y-4">
          {/* Traffic Summary Cards */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-gray-900">
                Monitor Trafik
              </h2>
              {ddosAlert && (
                <span className="flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700 animate-pulse">
                  <svg
                    className="h-3 w-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Anomali Trafik Terdeteksi
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-0.5">
              <button
                onClick={() => setTrafficTab("30d")}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${trafficTab === "30d" ? "bg-indigo-600 text-white shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                30 Hari
              </button>
              <button
                onClick={() => setTrafficTab("24h")}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${trafficTab === "24h" ? "bg-indigo-600 text-white shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                24 Jam
              </button>
            </div>
          </div>

          <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
            {[
              {
                label: "Hari Ini",
                value: traffic?.today_views ?? 0,
                change: trafficChange,
                icon: "M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z",
              },
              {
                label: "Kemarin",
                value: traffic?.yesterday_views ?? 0,
                icon: "M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5",
              },
              {
                label: "7 Hari",
                value: traffic?.week_views ?? 0,
                icon: "M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z",
              },
              {
                label: "30 Hari",
                value: traffic?.month_views ?? 0,
                icon: "M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="rounded-xl border border-gray-200/60 bg-white p-4 shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
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
                        d={item.icon}
                      />
                    </svg>
                  </div>
                  <p className="text-xs font-medium text-gray-500">
                    {item.label}
                  </p>
                </div>
                <div className="mt-2 flex items-end gap-2">
                  <p className="text-xl font-bold text-gray-900">
                    {loading ? (
                      <span className="inline-block h-6 w-10 animate-pulse rounded bg-gray-200" />
                    ) : (
                      fmtNum(item.value)
                    )}
                  </p>
                  {item.change !== undefined && !loading && (
                    <span
                      className={`mb-0.5 flex items-center text-xs font-semibold ${item.change >= 0 ? "text-emerald-600" : "text-red-500"}`}
                    >
                      <svg
                        className={`h-3 w-3 ${item.change < 0 ? "rotate-180" : ""}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.77a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0110 17z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {Math.abs(item.change)}%
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Chart Area */}
          <div className="rounded-2xl border border-gray-200/60 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">
                {trafficTab === "30d"
                  ? "Views per Hari (30 Hari Terakhir)"
                  : "Requests per Jam (24 Jam Terakhir)"}
              </h3>
              {trafficTab === "24h" && ddosAlert && (
                <span className="text-xs font-medium text-red-600">
                  Lonjakan abnormal terdeteksi — kemungkinan DDoS
                </span>
              )}
            </div>

            {loading ? (
              <div className="flex h-48 items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
              </div>
            ) : trafficTab === "30d" ? (
              /* Line-style area chart using CSS bars for 30 days */
              <div className="relative">
                {/* Y-axis labels */}
                <div className="absolute left-0 top-0 bottom-6 flex flex-col justify-between text-[10px] text-gray-400 w-8">
                  <span>{fmtNum(dayMax)}</span>
                  <span>{fmtNum(Math.round(dayMax / 2))}</span>
                  <span>0</span>
                </div>
                <div className="ml-10">
                  <div className="flex items-end gap-0.5 h-48">
                    {(traffic?.views_by_day || []).map((d, i) => {
                      const pct = dayMax > 0 ? (d.count / dayMax) * 100 : 0;
                      return (
                        <div
                          key={i}
                          className="group relative flex-1 flex flex-col items-center justify-end h-full"
                        >
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg">
                            {fmtDate(d.date)}: {d.count.toLocaleString("id-ID")}{" "}
                            views
                          </div>
                          <div
                            className="w-full rounded-t bg-linear-to-t from-indigo-500 to-indigo-400 transition-all duration-300 hover:from-indigo-600 hover:to-indigo-500 min-h-0.5"
                            style={{ height: `${Math.max(pct, 1)}%` }}
                          />
                        </div>
                      );
                    })}
                  </div>
                  {/* X-axis labels */}
                  <div className="mt-1 flex justify-between text-[10px] text-gray-400">
                    {(traffic?.views_by_day || [])
                      .filter(
                        (_, i, a) =>
                          i === 0 ||
                          i === Math.floor(a.length / 2) ||
                          i === a.length - 1,
                      )
                      .map((d, i) => (
                        <span key={i}>{fmtDate(d.date)}</span>
                      ))}
                  </div>
                </div>
              </div>
            ) : (
              /* Hourly bar chart for DDoS monitoring */
              <div className="relative">
                <div className="absolute left-0 top-0 bottom-6 flex flex-col justify-between text-[10px] text-gray-400 w-8">
                  <span>{fmtNum(hourMax)}</span>
                  <span>{fmtNum(Math.round(hourMax / 2))}</span>
                  <span>0</span>
                </div>
                <div className="ml-10">
                  <div className="flex items-end gap-0.5 h-48">
                    {(traffic?.views_by_hour || []).map((h, i) => {
                      const pct = hourMax > 0 ? (h.count / hourMax) * 100 : 0;
                      const avg =
                        traffic!.views_by_hour.reduce(
                          (s, x) => s + x.count,
                          0,
                        ) / traffic!.views_by_hour.length;
                      const isSpike =
                        avg > 0 && h.count > avg * 3 && h.count > 50;
                      return (
                        <div
                          key={i}
                          className="group relative flex-1 flex flex-col items-center justify-end h-full"
                        >
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg">
                            {fmtHour(h.date)}: {h.count.toLocaleString("id-ID")}{" "}
                            req
                            {isSpike && " ⚠️ Spike!"}
                          </div>
                          <div
                            className={`w-full rounded-t transition-all duration-300 min-h-0.5 ${isSpike ? "bg-linear-to-t from-red-500 to-red-400 hover:from-red-600 hover:to-red-500 animate-pulse" : "bg-linear-to-t from-cyan-500 to-cyan-400 hover:from-cyan-600 hover:to-cyan-500"}`}
                            style={{ height: `${Math.max(pct, 1)}%` }}
                          />
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-1 flex justify-between text-[10px] text-gray-400">
                    {(traffic?.views_by_hour || [])
                      .filter(
                        (_, i, a) =>
                          i % Math.max(1, Math.floor(a.length / 6)) === 0,
                      )
                      .map((h, i) => (
                        <span key={i}>{fmtHour(h.date)}</span>
                      ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Top Referrers & Top Pages */}
          {traffic && (
            <div className="grid gap-4 lg:grid-cols-2">
              {/* Top Referrers */}
              <div className="rounded-2xl border border-gray-200/60 bg-white shadow-sm">
                <div className="border-b border-gray-100 px-5 py-3.5">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Sumber Trafik Teratas
                  </h3>
                </div>
                <div className="divide-y divide-gray-50 px-5">
                  {(traffic.top_referrers || []).length > 0 ? (
                    traffic.top_referrers.map((ref, i) => {
                      const refMax = traffic.top_referrers[0]?.count || 1;
                      return (
                        <div key={i} className="flex items-center gap-3 py-3">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-gray-100 text-[10px] font-bold text-gray-500">
                            {i + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <p className="truncate text-sm text-gray-700">
                                {ref.source}
                              </p>
                              <span className="ml-2 shrink-0 text-xs font-semibold text-gray-900">
                                {fmtNum(ref.count)}
                              </span>
                            </div>
                            <div className="mt-1 h-1 w-full rounded-full bg-gray-100">
                              <div
                                className="h-1 rounded-full bg-indigo-400 transition-all"
                                style={{
                                  width: `${(ref.count / refMax) * 100}%`,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-6 text-center text-xs text-gray-400">
                      Belum ada data referrer.
                    </div>
                  )}
                </div>
              </div>

              {/* Top Pages */}
              <div className="rounded-2xl border border-gray-200/60 bg-white shadow-sm">
                <div className="border-b border-gray-100 px-5 py-3.5">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Halaman Populer
                  </h3>
                </div>
                <div className="divide-y divide-gray-50 px-5">
                  {(traffic.top_pages || []).length > 0 ? (
                    traffic.top_pages.map((page, i) => {
                      const pageMax = traffic.top_pages[0]?.count || 1;
                      return (
                        <div key={i} className="flex items-center gap-3 py-3">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-gray-100 text-[10px] font-bold text-gray-500">
                            {i + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <Link
                                href={`/posts/${page.slug}`}
                                className="truncate text-sm text-indigo-600 hover:text-indigo-800 hover:underline"
                              >
                                {page.title}
                              </Link>
                              <span className="ml-2 shrink-0 text-xs font-semibold text-gray-900">
                                {fmtNum(page.count)}
                              </span>
                            </div>
                            <div className="mt-1 h-1 w-full rounded-full bg-gray-100">
                              <div
                                className="h-1 rounded-full bg-emerald-400 transition-all"
                                style={{
                                  width: `${(page.count / pageMax) * 100}%`,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-6 text-center text-xs text-gray-400">
                      Belum ada data halaman.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Posts */}
        <div className="rounded-2xl border border-gray-200/60 bg-white shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-gray-900">
              Artikel Terbaru
            </h2>
            <Link
              href="/admin/posts"
              className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
            >
              Lihat semua →
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-4">
                  <div className="h-10 w-10 animate-pulse rounded-lg bg-gray-100" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 animate-pulse rounded bg-gray-100" />
                    <div className="h-3 w-1/3 animate-pulse rounded bg-gray-100" />
                  </div>
                </div>
              ))
            ) : recentPosts.length > 0 ? (
              recentPosts.map((post: any) => (
                <Link
                  key={post.id}
                  href={`/admin/posts/${post.id}`}
                  className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-gray-50"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
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
                        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                      />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {post.title}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-400">
                      {post.published_at
                        ? new Date(post.published_at).toLocaleDateString(
                            "id-ID",
                            { day: "numeric", month: "short", year: "numeric" },
                          )
                        : "Draft"}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${post.status === "published" ? "bg-emerald-50 text-emerald-700" : post.status === "draft" ? "bg-amber-50 text-amber-700" : "bg-gray-100 text-gray-600"}`}
                  >
                    {post.status || "published"}
                  </span>
                </Link>
              ))
            ) : (
              <div className="px-5 py-10 text-center text-sm text-gray-400">
                Belum ada artikel.
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="rounded-2xl border border-gray-200/60 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-gray-900">
              Aksi Cepat
            </h2>
            <div className="space-y-1">
              {quickActions.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-indigo-50 hover:text-indigo-700"
                >
                  <svg
                    className="h-4 w-4 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d={action.icon}
                    />
                  </svg>
                  {action.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Top Posts */}
          {topPosts.length > 0 && (
            <div className="rounded-2xl border border-gray-200/60 bg-white shadow-sm">
              <div className="border-b border-gray-100 px-5 py-4">
                <h2 className="text-sm font-semibold text-gray-900">
                  Artikel Populer
                </h2>
              </div>
              <div className="divide-y divide-gray-50">
                {topPosts.map((post, i) => (
                  <div
                    key={post.slug}
                    className="flex items-center gap-3 px-5 py-3"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-500">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {post.title}
                      </p>
                      <div className="mt-0.5 flex items-center gap-3 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
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
                              d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                            />
                          </svg>
                          {post.views}
                        </span>
                        <span className="flex items-center gap-1">
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
                              d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                            />
                          </svg>
                          {post.likes}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
