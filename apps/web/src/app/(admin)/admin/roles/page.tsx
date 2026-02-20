"use client";

import { useEffect, useState } from "react";
import { authFetch } from "@/lib/auth";
import type { Role, Permission } from "@/types";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export default function AdminRolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [rolesRes, permsRes] = await Promise.all([
        authFetch(`${API}/admin/roles`),
        authFetch(`${API}/admin/roles/permissions`),
      ]);
      if (rolesRes.ok) {
        const rd = await rolesRes.json();
        setRoles(rd.items || []);
      }
      if (permsRes.ok) {
        const pd = await permsRes.json();
        setAllPermissions(pd.items || []);
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const hasPermission = (role: Role, permId: string) =>
    role.permissions?.some((p) => p.id === permId) ?? false;

  const togglePermission = async (role: Role, perm: Permission) => {
    const current = role.permissions || [];
    let newPerms: string[];
    if (hasPermission(role, perm.id)) {
      newPerms = current.filter((p) => p.id !== perm.id).map((p) => p.id);
    } else {
      newPerms = [...current.map((p) => p.id), perm.id];
    }

    setSaving(role.id);
    try {
      await authFetch(`${API}/admin/roles/${role.id}/permissions`, {
        method: "PUT",
        body: JSON.stringify({ permission_ids: newPerms }),
      });
      await loadData();
    } catch { /* ignore */ }
    setSaving(null);
  };

  // Group permissions by module
  const modules = allPermissions.reduce<Record<string, Permission[]>>((acc, p) => {
    (acc[p.module] = acc[p.module] || []).push(p);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-400">Memuat roles & permissions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Roles & Permissions</h1>
        <p className="text-sm text-gray-500">Kelola hak akses untuk setiap role</p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="sticky left-0 z-10 bg-gray-50 px-5 py-3 text-left font-semibold text-gray-600 min-w-50">Permission</th>
              {roles.map((role) => (
                <th key={role.id} className="px-5 py-3 text-center font-semibold text-gray-600 min-w-30">
                  <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">{role.name}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.entries(modules).map(([module, perms]) => (
              <>
                <tr key={`module-${module}`}>
                  <td colSpan={roles.length + 1} className="bg-gray-50 px-5 py-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-400">{module}</span>
                  </td>
                </tr>
                {perms.map((perm) => (
                  <tr key={perm.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="sticky left-0 z-10 bg-white px-5 py-2.5 font-medium text-gray-700">{perm.name}</td>
                    {roles.map((role) => (
                      <td key={`${role.id}-${perm.id}`} className="px-5 py-2.5 text-center">
                        {role.name === "OWNER" ? (
                          <span className="text-emerald-500" title="Owner memiliki semua akses">
                            <svg className="mx-auto h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                            </svg>
                          </span>
                        ) : (
                          <button
                            onClick={() => togglePermission(role, perm)}
                            disabled={saving === role.id}
                            className={`mx-auto flex h-6 w-6 items-center justify-center rounded-md transition-colors ${
                              hasPermission(role, perm.id)
                                ? "bg-emerald-500 text-white"
                                : "border border-gray-300 bg-white hover:border-emerald-400"
                            } ${saving === role.id ? "opacity-50" : ""}`}
                          >
                            {hasPermission(role, perm.id) && (
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                              </svg>
                            )}
                          </button>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
