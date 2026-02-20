"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";
import CommandPalette from "@/components/admin/CommandPalette";
import NotificationDropdown from "@/components/admin/NotificationDropdown";
import { authAPI } from "@/lib/auth-api";

const navItems = [
  {
    href: "/admin",
    label: "Dashboard",
    icon: "M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z",
  },
  {
    section: "Konten",
    items: [
      {
        href: "/admin/posts",
        label: "Artikel",
        icon: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z",
      },
      {
        href: "/admin/media",
        label: "Media",
        icon: "M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M2.25 18V6a2.25 2.25 0 012.25-2.25h15A2.25 2.25 0 0121.75 6v12A2.25 2.25 0 0119.5 20.25h-15A2.25 2.25 0 012.25 18z",
      },
      {
        href: "/admin/categories",
        label: "Kategori",
        icon: "M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z",
      },
      {
        href: "/admin/comments",
        label: "Komentar",
        icon: "M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z",
      },
    ],
  },
  {
    section: "Monetisasi",
    items: [
      {
        href: "/admin/ads",
        label: "Iklan / Ads",
        icon: "M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5",
      },
    ],
  },
  {
    section: "Toko",
    items: [
      {
        href: "/admin/store-content",
        label: "Konten Toko",
        icon: "M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z",
      },
      {
        href: "/admin/store-listings",
        label: "Layanan & Produk",
        icon: "M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z",
      },
      {
        href: "/admin/store-orders",
        label: "Pesanan",
        icon: "M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z",
      },
      {
        href: "/admin/store-portfolio",
        label: "Portfolio",
        icon: "M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a2.25 2.25 0 002.25-2.25V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z",
      },
      {
        href: "/admin/store-payment",
        label: "Pembayaran",
        icon: "M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z",
      },
    ],
  },
  {
    section: "Pengguna",
    items: [
      {
        href: "/admin/users",
        label: "Users",
        icon: "M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z",
      },
      {
        href: "/admin/roles",
        label: "Roles",
        icon: "M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z",
      },
      {
        href: "/admin/author-requests",
        label: "Permintaan Author",
        icon: "M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z",
      },
    ],
  },
  {
    section: "Sistem",
    items: [
      {
        href: "/admin/seo",
        label: "SEO",
        icon: "M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z",
      },
      {
        href: "/admin/integrations",
        label: "Integrasi / N8N",
        icon: "M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244",
      },
      {
        href: "/admin/settings",
        label: "Pengaturan",
        icon: "M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.991l1.004.827c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z",
      },
      {
        href: "/admin/legal",
        label: "Legal & Kebijakan",
        icon: "M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z",
      },
      {
        href: "/admin/audit-logs",
        label: "Audit Log",
        icon: "M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z",
      },
    ],
  },
];

function NavIcon({ d, active }: { d: string; active?: boolean }) {
  return (
    <svg
      className={`h-4.5 w-4.5 shrink-0 transition-colors ${active ? "text-white" : ""}`}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [adminUser, setAdminUser] = useState<any>(null);

  useEffect(() => {
    const user = authAPI.getUser();
    if (!user || !authAPI.isLoggedIn()) {
      router.replace("/auth/login?redirect=/admin");
      return;
    }
    const role = (user.role || "").toUpperCase();
    if (role !== "OWNER" && role !== "ADMIN") {
      router.replace("/");
      return;
    }
    setAdminUser(user);
    setAuthChecked(true);
  }, [router]);

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  const pageName =
    pathname === "/admin"
      ? "Dashboard"
      : pathname
          .split("/")
          .pop()
          ?.replace(/-/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase());

  // Show loading spinner while checking auth
  if (!authChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f9fc]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-indigo-200 border-t-indigo-600" />
          <p className="text-sm text-gray-400">Memverifikasi akses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#f8f9fc]">
      {/* Mobile overlay backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col transition-all duration-300 ease-in-out ${
          collapsed ? "w-18" : "w-65"
        } ${mobileOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        {/* Sidebar bg */}
        <div className="absolute inset-0 bg-linear-to-b from-[#0f172a] via-[#131c35] to-[#0c1425]" />
        {/* Subtle pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.08),transparent_60%)]" />

        <div className="relative flex flex-1 flex-col">
          {/* Logo */}
          <div
            className={`flex h-17 items-center gap-3 px-5 ${collapsed ? "justify-center px-3" : ""}`}
          >
            {/* Mobile close button */}
            {mobileOpen && (
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute right-3 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white md:hidden"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            )}
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/25">
              <Image
                src="/img/logo.png"
                alt="NetPulse Logo"
                width={28}
                height={28}
                className="brightness-0 invert"
              />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="text-[15px] font-bold tracking-tight text-white">
                  Net<span className="text-indigo-400">Pulse</span>
                </span>
                <span className="text-[10px] font-medium tracking-wider text-slate-500">
                  ADMIN PANEL
                </span>
              </div>
            )}
          </div>

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto px-3 pb-4 pt-2 [&::-webkit-scrollbar]:w-0">
            {navItems.map((item: any, idx) => {
              if (item.section) {
                return (
                  <div key={item.section} className={idx > 0 ? "mt-5" : ""}>
                    {!collapsed && (
                      <h4 className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600">
                        {item.section}
                      </h4>
                    )}
                    {collapsed && idx > 0 && (
                      <div className="mx-3 my-3 border-t border-white/6" />
                    )}
                    <div className="space-y-0.5">
                      {item.items.map((sub: any) => {
                        const active = isActive(sub.href);
                        return (
                          <a
                            key={sub.href}
                            href={sub.href}
                            onClick={() => setMobileOpen(false)}
                            title={collapsed ? sub.label : undefined}
                            className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200 ${
                              active
                                ? "bg-white/10 text-white shadow-sm shadow-black/10"
                                : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                            }`}
                          >
                            {active && (
                              <div className="absolute -left-3 top-1/2 h-6 w-0.75 -translate-y-1/2 rounded-r-full bg-indigo-500 shadow-sm shadow-indigo-500/50" />
                            )}
                            <NavIcon d={sub.icon} active={active} />
                            {!collapsed && sub.label}
                          </a>
                        );
                      })}
                    </div>
                  </div>
                );
              }
              // Dashboard (top-level)
              const active = isActive(item.href);
              return (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  title={collapsed ? item.label : undefined}
                  className={`group relative mb-0.5 flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200 ${
                    active
                      ? "bg-white/10 text-white shadow-sm shadow-black/10"
                      : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                  }`}
                >
                  {active && (
                    <div className="absolute -left-3 top-1/2 h-6 w-0.75 -translate-y-1/2 rounded-r-full bg-indigo-500 shadow-sm shadow-indigo-500/50" />
                  )}
                  <NavIcon d={item.icon} active={active} />
                  {!collapsed && item.label}
                </a>
              );
            })}
          </nav>

          {/* Bottom section */}
          <div className="border-t border-white/6 p-3">
            {/* Quick link to site */}
            <a
              href="/"
              target="_blank"
              className={`mb-2 flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium text-slate-500 transition-colors hover:bg-white/5 hover:text-slate-300 ${collapsed ? "justify-center" : ""}`}
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
                  d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                />
              </svg>
              {!collapsed && "Lihat Situs"}
            </a>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-slate-500 transition-colors hover:bg-white/5 hover:text-slate-300 ${collapsed ? "justify-center" : ""}`}
            >
              <svg
                className={`h-4 w-4 shrink-0 transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M18.75 19.5l-7.5-7.5 7.5-7.5m-6 15L5.25 12l7.5-7.5"
                />
              </svg>
              {!collapsed && (
                <span className="text-[13px] font-medium">Tutup Sidebar</span>
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div
        className={`flex-1 transition-all duration-300 ease-in-out ${collapsed ? "md:ml-18" : "md:ml-65"}`}
      >
        {/* Top bar */}
        <header className="sticky top-0 z-20 border-b border-gray-200/60 bg-white/70 backdrop-blur-xl">
          <div className="flex h-17 items-center justify-between px-4 sm:px-8">
            <div className="flex items-center gap-3">
              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileOpen(true)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 md:hidden"
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
                    d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                  />
                </svg>
              </button>
              <div>
                <h2 className="text-[15px] font-semibold text-gray-900">
                  {pageName}
                </h2>
                <p className="text-[11px] text-gray-400">
                  {new Date().toLocaleDateString("id-ID", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Search */}
              <CommandPalette />
              {/* Notifications */}
              <NotificationDropdown />
              {/* Quick add */}
              <a
                href="/admin/posts/new"
                className="flex h-9 items-center gap-1.5 rounded-xl bg-linear-to-r from-indigo-600 to-violet-600 px-4 text-sm font-semibold text-white shadow-sm shadow-indigo-500/25 transition-all hover:shadow-md hover:shadow-indigo-500/30 hover:brightness-110"
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
                <span className="hidden sm:inline">Tulis Artikel</span>
              </a>
              {/* Divider */}
              <div className="mx-1 h-6 w-px bg-gray-200" />
              {/* Avatar */}
              <button className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 transition-colors hover:bg-gray-50">
                <div className="relative">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-indigo-500 to-violet-600 text-xs font-bold text-white shadow-sm">
                    {adminUser?.name?.[0]?.toUpperCase() || "A"}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
                </div>
                <div className="hidden text-left sm:block">
                  <p className="text-[13px] font-medium text-gray-800">
                    {adminUser?.name || "Admin"}
                  </p>
                  <p className="text-[10px] text-gray-400">
                    {adminUser?.role || "Admin"}
                  </p>
                </div>
                <svg
                  className="hidden h-4 w-4 text-gray-400 sm:block"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                  />
                </svg>
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
