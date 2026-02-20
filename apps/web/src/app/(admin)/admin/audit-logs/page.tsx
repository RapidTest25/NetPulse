"use client";

import { useEffect, useState, useCallback } from "react";
import { authFetch } from "@/lib/auth";
import type { AuditLogEntry } from "@/types";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

const actionColors: Record<string, string> = {
  login: "bg-blue-50 text-blue-700",
  login_failed: "bg-red-50 text-red-700",
  register: "bg-emerald-50 text-emerald-700",
  invite: "bg-violet-50 text-violet-700",
  create: "bg-green-50 text-green-700",
  publish: "bg-green-50 text-green-700",
  update: "bg-amber-50 text-amber-700",
  update_role: "bg-indigo-50 text-indigo-700",
  delete: "bg-red-50 text-red-700",
  disable: "bg-red-50 text-red-700",
  enable: "bg-emerald-50 text-emerald-700",
  moderate: "bg-amber-50 text-amber-700",
  bulk_moderate: "bg-amber-50 text-amber-700",
};

function getActionColor(action: string): string {
  return actionColors[action] || "bg-gray-50 text-gray-600";
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ action: "", entity: "", search: "" });

  const loadLogs = useCallback(async (p: number) => {
    setLoading(true);
    const sp = new URLSearchParams({ page: String(p), limit: "20" });
    if (filter.action) sp.set("action", filter.action);
    if (filter.entity) sp.set("entity", filter.entity);
    if (filter.search) sp.set("search", filter.search);

    try {
      const res = await authFetch(`${API}/admin/audit-logs?${sp}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.items || []);
        setTotal(data.total || 0);
        setPage(data.page || p);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, [filter]);

  useEffect(() => { loadLogs(1); }, [loadLogs]);

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Audit Log</h1>
        <p className="text-sm text-gray-500">Riwayat semua aktivitas sistem</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Cari..."
          value={filter.search}
          onChange={(e) => setFilter({ ...filter, search: e.target.value })}
          onKeyDown={(e) => e.key === "Enter" && loadLogs(1)}
          className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm outline-none focus:border-indigo-500 w-64"
        />
        <select
          value={filter.entity}
          onChange={(e) => setFilter({ ...filter, entity: e.target.value })}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none"
        >
          <option value="">Semua Entitas</option>
          <option value="user">User</option>
          <option value="post">Post</option>
          <option value="comment">Comment</option>
          <option value="role">Role</option>
        </select>
        <button
          onClick={() => loadLogs(1)}
          className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Filter
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="px-5 py-3 text-left font-semibold text-gray-600">Waktu</th>
              <th className="px-5 py-3 text-left font-semibold text-gray-600">User</th>
              <th className="px-5 py-3 text-left font-semibold text-gray-600">Aksi</th>
              <th className="px-5 py-3 text-left font-semibold text-gray-600">Entitas</th>
              <th className="px-5 py-3 text-left font-semibold text-gray-600">Detail</th>
              <th className="px-5 py-3 text-left font-semibold text-gray-600">IP</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-5 py-12 text-center text-gray-400">Memuat...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={6} className="px-5 py-12 text-center text-gray-400">Tidak ada log</td></tr>
            ) : logs.map((log) => (
              <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="px-5 py-3 text-gray-500 whitespace-nowrap">
                  {new Date(log.created_at).toLocaleString("id-ID")}
                </td>
                <td className="px-5 py-3 font-medium text-gray-900">{log.user_name}</td>
                <td className="px-5 py-3">
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${getActionColor(log.action)}`}>
                    {log.action}
                  </span>
                </td>
                <td className="px-5 py-3 text-gray-600">{log.entity}</td>
                <td className="px-5 py-3 text-gray-500 max-w-50 truncate">{log.details || "—"}</td>
                <td className="px-5 py-3 text-gray-400 font-mono text-xs">{log.ip_address}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">{total} log total</span>
          <div className="flex gap-2">
            <button onClick={() => loadLogs(page - 1)} disabled={page <= 1} className="rounded-lg bg-gray-100 px-4 py-2 text-sm disabled:opacity-40">Sebelumnya</button>
            <span className="flex items-center px-3 text-sm text-gray-500">{page} / {totalPages}</span>
            <button onClick={() => loadLogs(page + 1)} disabled={page >= totalPages} className="rounded-lg bg-gray-100 px-4 py-2 text-sm disabled:opacity-40">Selanjutnya</button>
          </div>
        </div>
      )}
    </div>
  );
}
