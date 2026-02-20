"use client";

import { useEffect, useState, useCallback } from "react";
import { authFetch } from "@/lib/auth";
import type { User } from "@/types";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  // Invite modal state
  const [showInvite, setShowInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: "",
    name: "",
    role: "EDITOR",
  });
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteResult, setInviteResult] = useState<{
    user: User;
    temp_password: string;
  } | null>(null);
  const [inviteError, setInviteError] = useState("");

  const loadUsers = useCallback(
    async (p: number) => {
      setLoading(true);
      const sp = new URLSearchParams({ page: String(p), limit: "20" });
      if (search) sp.set("search", search);
      if (roleFilter) sp.set("role", roleFilter);

      try {
        const res = await authFetch(`${API}/admin/users?${sp}`);
        if (res.ok) {
          const data = await res.json();
          setUsers(data.items || []);
          setTotal(data.total || 0);
          setPage(data.page || p);
        }
      } catch {
        /* ignore */
      }
      setLoading(false);
    },
    [search, roleFilter],
  );

  useEffect(() => {
    loadUsers(1);
  }, [loadUsers]);

  const handleDisable = async (id: string) => {
    if (!confirm("Yakin nonaktifkan user ini?")) return;
    await authFetch(`${API}/admin/users/${id}/disable`, { method: "PATCH" });
    loadUsers(page);
  };

  const handleEnable = async (id: string) => {
    await authFetch(`${API}/admin/users/${id}/enable`, { method: "PATCH" });
    loadUsers(page);
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteLoading(true);
    setInviteError("");
    setInviteResult(null);

    try {
      const res = await authFetch(`${API}/admin/users/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inviteForm),
      });

      if (res.ok) {
        const data = await res.json();
        setInviteResult(data);
        loadUsers(1);
      } else {
        const err = await res.json().catch(() => null);
        setInviteError(err?.error || `Gagal invite user (${res.status})`);
      }
    } catch {
      setInviteError("Terjadi kesalahan jaringan");
    } finally {
      setInviteLoading(false);
    }
  };

  const resetInviteModal = () => {
    setShowInvite(false);
    setInviteForm({ email: "", name: "", role: "EDITOR" });
    setInviteResult(null);
    setInviteError("");
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Users</h1>
          <p className="text-sm text-gray-500">{total} pengguna terdaftar</p>
        </div>
        <button
          onClick={() => setShowInvite(true)}
          className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Invite User
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Cari nama atau email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && loadUsers(1)}
          className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm outline-none focus:border-indigo-500 w-full sm:w-72"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none"
        >
          <option value="">Semua Role</option>
          <option value="OWNER">Owner</option>
          <option value="ADMIN">Admin</option>
          <option value="EDITOR">Editor</option>
          <option value="VIEWER">Viewer</option>
        </select>
        <button
          onClick={() => loadUsers(1)}
          className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Cari
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="px-5 py-3 text-left font-semibold text-gray-600">
                User
              </th>
              <th className="px-5 py-3 text-left font-semibold text-gray-600">
                Role
              </th>
              <th className="px-5 py-3 text-left font-semibold text-gray-600">
                Status
              </th>
              <th className="hidden px-5 py-3 text-left font-semibold text-gray-600 md:table-cell">
                Referral
              </th>
              <th className="hidden px-5 py-3 text-left font-semibold text-gray-600 sm:table-cell">
                Bergabung
              </th>
              <th className="px-5 py-3 text-right font-semibold text-gray-600">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-12 text-center text-gray-400"
                >
                  Memuat...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-12 text-center text-gray-400"
                >
                  Tidak ada user
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr
                  key={u.id}
                  className="border-b border-gray-50 hover:bg-gray-50/50"
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-600">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{u.name}</p>
                        <p className="text-xs text-gray-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                      {u.roles?.[0]?.name || "—"}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    {u.disabled_at ? (
                      <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-600">
                        Nonaktif
                      </span>
                    ) : u.email_verified_at ? (
                      <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-600">
                        Aktif
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-600">
                        Belum Verifikasi
                      </span>
                    )}
                  </td>
                  <td className="hidden px-5 py-3 font-mono text-xs text-gray-500 md:table-cell">
                    {u.referral_code || "\u2014"}
                  </td>
                  <td className="hidden px-5 py-3 text-gray-500 whitespace-nowrap sm:table-cell">
                    {new Date(u.created_at).toLocaleDateString("id-ID")}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {u.disabled_at ? (
                      <button
                        onClick={() => handleEnable(u.id)}
                        className="text-xs font-medium text-emerald-600 hover:text-emerald-700"
                      >
                        Aktifkan
                      </button>
                    ) : (
                      <button
                        onClick={() => handleDisable(u.id)}
                        className="text-xs font-medium text-red-600 hover:text-red-700"
                      >
                        Nonaktifkan
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">{total} user total</span>
          <div className="flex gap-2">
            <button
              onClick={() => loadUsers(page - 1)}
              disabled={page <= 1}
              className="rounded-lg bg-gray-100 px-4 py-2 text-sm disabled:opacity-40"
            >
              Sebelumnya
            </button>
            <span className="flex items-center px-3 text-sm text-gray-500">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => loadUsers(page + 1)}
              disabled={page >= totalPages}
              className="rounded-lg bg-gray-100 px-4 py-2 text-sm disabled:opacity-40"
            >
              Selanjutnya
            </button>
          </div>
        </div>
      )}

      {/* ── Invite User Modal ────────────────────────── */}
      {showInvite && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={resetInviteModal}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {inviteResult ? (
              /* ── Success view ── */
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                    <svg
                      className="h-5 w-5 text-emerald-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4.5 12.75l6 6 9-13.5"
                      />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">
                      User Berhasil Diundang
                    </h2>
                    <p className="text-sm text-gray-500">
                      Kirimkan kredensial berikut kepada user
                    </p>
                  </div>
                </div>

                <div className="space-y-3 rounded-xl bg-gray-50 p-4">
                  <div>
                    <p className="text-xs font-medium text-gray-400">Nama</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {inviteResult.user.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-400">Email</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {inviteResult.user.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-400">Role</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {inviteResult.user.roles?.[0]?.name || inviteForm.role}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-400">
                      Password Sementara
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <code className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-1.5 text-sm font-mono font-bold text-amber-800 select-all">
                        {inviteResult.temp_password}
                      </code>
                      <button
                        type="button"
                        onClick={() =>
                          navigator.clipboard.writeText(
                            inviteResult.temp_password,
                          )
                        }
                        className="rounded-lg bg-gray-100 p-1.5 text-gray-500 hover:bg-gray-200 hover:text-gray-700"
                        title="Copy password"
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
                            d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184"
                          />
                        </svg>
                      </button>
                    </div>
                    <p className="mt-1.5 text-xs text-amber-600">
                      User harus mengganti password setelah login pertama
                    </p>
                  </div>
                </div>

                <button
                  onClick={resetInviteModal}
                  className="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                  Tutup
                </button>
              </div>
            ) : (
              /* ── Invite form ── */
              <form onSubmit={handleInvite} className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100">
                    <svg
                      className="h-5 w-5 text-indigo-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">
                      Invite User Baru
                    </h2>
                    <p className="text-sm text-gray-500">
                      Undang user baru ke platform
                    </p>
                  </div>
                </div>

                {inviteError && (
                  <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                    {inviteError}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Nama Lengkap
                    </label>
                    <input
                      type="text"
                      required
                      value={inviteForm.name}
                      onChange={(e) =>
                        setInviteForm((f) => ({ ...f, name: e.target.value }))
                      }
                      placeholder="John Doe"
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      value={inviteForm.email}
                      onChange={(e) =>
                        setInviteForm((f) => ({ ...f, email: e.target.value }))
                      }
                      placeholder="john@example.com"
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Role
                    </label>
                    <select
                      value={inviteForm.role}
                      onChange={(e) =>
                        setInviteForm((f) => ({ ...f, role: e.target.value }))
                      }
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
                    >
                      <option value="ADMIN">Admin</option>
                      <option value="EDITOR">Editor</option>
                      <option value="AUTHOR">Author</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={resetInviteModal}
                    className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={inviteLoading}
                    className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {inviteLoading ? "Mengirim..." : "Invite User"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
