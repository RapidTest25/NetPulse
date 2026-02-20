"use client";

import { useEffect, useState, useRef } from "react";
import { authFetch } from "@/lib/auth";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

interface Notification {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  description: string;
  created_at: string;
}

const actionLabels: Record<string, { label: string; icon: string; color: string }> = {
  create: { label: "Dibuat", icon: "M12 4.5v15m7.5-7.5h-15", color: "text-emerald-500 bg-emerald-50" },
  update: { label: "Diperbarui", icon: "M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z", color: "text-amber-500 bg-amber-50" },
  delete: { label: "Dihapus", icon: "M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0", color: "text-red-500 bg-red-50" },
  login: { label: "Login", icon: "M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9", color: "text-indigo-500 bg-indigo-50" },
  upload: { label: "Upload", icon: "M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5", color: "text-cyan-500 bg-cyan-50" },
  enable: { label: "Diaktifkan", icon: "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z", color: "text-emerald-500 bg-emerald-50" },
  disable: { label: "Dinonaktifkan", icon: "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636", color: "text-red-500 bg-red-50" },
};

const defaultAction = { label: "Aktivitas", icon: "M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0z", color: "text-gray-500 bg-gray-50" };

function timeAgo(date: string): string {
  const d = new Date(date);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return "baru saja";
  if (diff < 3600) return `${Math.floor(diff / 60)}m lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}j lalu`;
  return `${Math.floor(diff / 86400)}h lalu`;
}

export default function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [hasNew, setHasNew] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const load = async () => {
    try {
      const res = await authFetch(`${API}/admin/audit-logs?per_page=8`);
      if (res.ok) {
        const data = await res.json();
        const newItems = data.items || [];
        if (newItems.length > 0 && items.length > 0 && newItems[0]?.id !== items[0]?.id) {
          setHasNew(true);
        }
        setItems(newItems);
      }
    } catch {
      // silent fail for non-authed users
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => {
          setOpen((o) => !o);
          setHasNew(false);
        }}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-400 transition-colors hover:border-gray-300 hover:bg-white hover:text-gray-600"
      >
        <svg
          className="h-4.5 w-4.5"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
          />
        </svg>
        {hasNew && (
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-rose-500 ring-2 ring-white" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-gray-200/60 bg-white shadow-xl">
          <div className="border-b border-gray-100 px-4 py-3">
            <h3 className="text-sm font-semibold text-gray-900">Notifikasi</h3>
            <p className="text-[10px] text-gray-400">Aktivitas terbaru</p>
          </div>

          <div className="max-h-90 overflow-y-auto">
            {items.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400">
                Belum ada aktivitas
              </p>
            ) : (
              items.map((n) => {
                const cfg = actionLabels[n.action] || defaultAction;
                return (
                  <div
                    key={n.id}
                    className="flex items-start gap-3 border-b border-gray-50 px-4 py-3 last:border-0 hover:bg-gray-50/50"
                  >
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${cfg.color}`}
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
                          d={cfg.icon}
                        />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-700">
                        <span className="font-medium">{cfg.label}</span>{" "}
                        <span className="text-gray-400">{n.entity_type}</span>
                        {n.description && (
                          <span className="text-gray-500">
                            {" "}
                            — {n.description.slice(0, 50)}
                          </span>
                        )}
                      </p>
                      <p className="mt-0.5 text-[10px] text-gray-400">
                        {timeAgo(n.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {items.length > 0 && (
            <a
              href="/admin/audit-logs"
              className="block border-t border-gray-100 px-4 py-2.5 text-center text-xs font-medium text-indigo-600 hover:bg-gray-50"
            >
              Lihat Semua Audit Log →
            </a>
          )}
        </div>
      )}
    </div>
  );
}
