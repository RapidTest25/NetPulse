"use client";

import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

const statusConfig: Record<string, { label: string; class: string }> = {
  published: {
    label: "Published",
    class: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  },
  draft: {
    label: "Draft",
    class: "bg-amber-50 text-amber-700 ring-amber-600/20",
  },
  in_review: {
    label: "In Review",
    class: "bg-blue-50 text-blue-700 ring-blue-600/20",
  },
  scheduled: {
    label: "Scheduled",
    class: "bg-violet-50 text-violet-700 ring-violet-600/20",
  },
  archived: {
    label: "Archived",
    class: "bg-gray-100 text-gray-600 ring-gray-500/20",
  },
};

const filterTabs = [
  { key: "all", label: "Semua" },
  { key: "published", label: "Published" },
  { key: "draft", label: "Draft" },
  { key: "in_review", label: "In Review" },
  { key: "scheduled", label: "Scheduled" },
  { key: "archived", label: "Archived" },
];

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch(`${API}/posts?limit=50`)
      .then((r) => r.json())
      .then((data) => {
        setPosts(data.items || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = posts.filter((p) => {
    if (activeFilter !== "all" && (p.status || "published") !== activeFilter)
      return false;
    if (search && !p.title.toLowerCase().includes(search.toLowerCase()))
      return false;
    return true;
  });

  const allSelected =
    filtered.length > 0 && filtered.every((p) => selectedIds.has(p.id));

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((p) => p.id)));
    }
  };

  const toggleOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Posts
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Kelola semua artikel blog kamu.
          </p>
        </div>
        <a
          href="/admin/posts/new"
          className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-500/25 transition-all hover:shadow-md hover:brightness-110"
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
        </a>
      </div>

      {/* Filters + search */}
      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 overflow-x-auto rounded-lg border border-gray-200 bg-white p-1">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveFilter(tab.key);
                setSelectedIds(new Set());
              }}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                activeFilter === tab.key
                  ? "bg-linear-to-r from-indigo-600 to-violet-600 text-white shadow-sm shadow-indigo-500/20"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative max-w-xs">
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
          <input
            type="text"
            placeholder="Cari artikel…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-4 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
          />
        </div>
      </div>

      {/* Bulk actions bar */}
      {selectedIds.size > 0 && (
        <div className="mt-4 flex items-center gap-3 rounded-lg bg-indigo-50 px-4 py-2.5 text-sm">
          <span className="font-medium text-indigo-700">
            {selectedIds.size} artikel dipilih
          </span>
          <button className="rounded-md bg-white px-3 py-1 text-xs font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
            Arsipkan
          </button>
          <button className="rounded-md bg-red-600 px-3 py-1 text-xs font-medium text-white shadow-sm hover:bg-red-700">
            Hapus
          </button>
        </div>
      )}

      {/* Table */}
      <div className="mt-4 overflow-x-auto rounded-2xl border border-gray-200/60 bg-white shadow-sm">
        <table className="w-full min-w-[600px] text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
              </th>
              <th className="px-4 py-3 font-medium text-gray-500">Judul</th>
              <th className="px-4 py-3 font-medium text-gray-500">Status</th>
              <th className="hidden px-4 py-3 font-medium text-gray-500 md:table-cell">
                Penulis
              </th>
              <th className="hidden px-4 py-3 font-medium text-gray-500 lg:table-cell">
                Kategori
              </th>
              <th className="px-4 py-3 font-medium text-gray-500">Tanggal</th>
              <th className="w-16 px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-4 py-4">
                    <div className="h-4 w-4 animate-pulse rounded bg-gray-100" />
                  </td>
                  <td className="px-4 py-4">
                    <div className="h-4 w-48 animate-pulse rounded bg-gray-100" />
                  </td>
                  <td className="px-4 py-4">
                    <div className="h-5 w-20 animate-pulse rounded-full bg-gray-100" />
                  </td>
                  <td className="hidden px-4 py-4 md:table-cell">
                    <div className="h-4 w-24 animate-pulse rounded bg-gray-100" />
                  </td>
                  <td className="hidden px-4 py-4 lg:table-cell">
                    <div className="h-4 w-20 animate-pulse rounded bg-gray-100" />
                  </td>
                  <td className="px-4 py-4">
                    <div className="h-4 w-20 animate-pulse rounded bg-gray-100" />
                  </td>
                  <td className="px-4 py-4"></td>
                </tr>
              ))
            ) : filtered.length > 0 ? (
              filtered.map((post) => {
                const status = post.status || "published";
                const cfg = statusConfig[status] || statusConfig.draft;
                return (
                  <tr
                    key={post.id}
                    className="transition-colors hover:bg-gray-50/50"
                  >
                    <td className="px-4 py-3.5">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(post.id)}
                        onChange={() => toggleOne(post.id)}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-indigo-100 to-indigo-200 text-indigo-600">
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
                              d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                            />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <a
                            href={`/admin/posts/${post.id}`}
                            className="block truncate font-medium text-gray-900 hover:text-indigo-600"
                          >
                            {post.title}
                          </a>
                          {post.slug && (
                            <p className="mt-0.5 truncate text-xs text-gray-400">
                              /{post.slug}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${cfg.class}`}
                      >
                        {cfg.label}
                      </span>
                    </td>
                    <td className="hidden px-4 py-3.5 md:table-cell">
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-[10px] font-bold text-gray-600">
                          {post.author?.name?.charAt(0)?.toUpperCase() || "A"}
                        </div>
                        <span className="text-sm text-gray-600">
                          {post.author?.name || "Admin"}
                        </span>
                      </div>
                    </td>
                    <td className="hidden px-4 py-3.5 lg:table-cell">
                      <span className="text-sm text-gray-500">
                        {post.category?.name || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-gray-500">
                      {post.published_at
                        ? new Date(post.published_at).toLocaleDateString(
                            "id-ID",
                            { day: "numeric", month: "short", year: "numeric" },
                          )
                        : "—"}
                    </td>
                    <td className="px-4 py-3.5">
                      <button className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600">
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
                            d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
                          />
                        </svg>
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="px-4 py-16 text-center">
                  <svg
                    className="mx-auto h-10 w-10 text-gray-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                    />
                  </svg>
                  <p className="mt-3 text-sm font-medium text-gray-600">
                    Tidak ada artikel
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    Buat artikel pertamamu sekarang.
                  </p>
                  <a
                    href="/admin/posts/new"
                    className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-linear-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-indigo-500/25 transition-all hover:shadow-md hover:brightness-110"
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
                  </a>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
