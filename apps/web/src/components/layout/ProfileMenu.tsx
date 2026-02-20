"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authAPI } from "@/lib/auth-api";

interface UserInfo {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

const menuItems = (role: string) => {
  const isAuthor = ["AUTHOR", "EDITOR", "ADMIN", "OWNER"].includes(role);
  const isAdmin = ["ADMIN", "OWNER"].includes(role);

  const items: {
    label: string;
    href: string;
    icon: string;
    section?: string;
  }[] = [
    {
      label: "Dashboard",
      href: "/me",
      icon: "M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25",
    },
    {
      label: "Profil & Pengaturan",
      href: "/me?tab=profile",
      icon: "M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z",
    },
    {
      label: "Artikel Tersimpan",
      href: "/me?tab=saved",
      icon: "M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z",
    },
    {
      label: "Artikel Disukai",
      href: "/me?tab=likes",
      icon: "M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z",
    },
  ];

  if (isAuthor) {
    items.push({
      label: "Tulis Artikel",
      href: "/write",
      icon: "M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10",
      section: "Author",
    });
    items.push({
      label: "Artikel Saya",
      href: "/me?tab=posts",
      icon: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z",
      section: "Author",
    });
  }

  if (!isAuthor) {
    items.push({
      label: "Minta Akses Author",
      href: "/me?tab=request-author",
      icon: "M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z",
      section: "More",
    });
  }

  if (isAdmin) {
    items.push({
      label: "Admin Panel",
      href: "/admin",
      icon: "M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75",
      section: "Admin",
    });
  }

  return items;
};

export default function ProfileMenu() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    setUser(authAPI.getUser());
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close on Escape
  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, []);

  // Show a skeleton placeholder matching the same dimensions until client mounts
  // This prevents the flash of login/register buttons or avatar on hydration
  if (!mounted) {
    return null;
  }

  // Per policy: NO visible login/register buttons on the public blog.
  // Admin login is accessible via hidden URL only.
  if (!authAPI.isLoggedIn() || !user) {
    return null;
  }

  const items = menuItems(user.role);
  const initial = user.name?.charAt(0)?.toUpperCase() || "U";

  const handleLogout = async () => {
    await authAPI.logout();
    setOpen(false);
    router.push("/");
    router.refresh();
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-full border border-gray-200 py-1.5 pl-1.5 pr-3 transition-colors hover:bg-gray-50"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-linear-to-br from-sky-500 to-cyan-600 text-xs font-bold text-white">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="h-7 w-7 rounded-full object-cover"
            />
          ) : (
            initial
          )}
        </div>
        <span className="hidden text-sm font-medium text-gray-700 sm:block">
          {user.name}
        </span>
        <svg
          className={`h-4 w-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 8.25l-7.5 7.5-7.5-7.5"
          />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <>
          {/* Mobile: full-screen overlay */}
          <div
            className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-sm sm:hidden"
            onClick={() => setOpen(false)}
          />

          <div className="fixed inset-x-4 bottom-4 z-[70] max-h-[80vh] overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-2xl sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 sm:w-72 sm:max-h-[70vh] sm:rounded-xl sm:shadow-xl">
            {/* User info header */}
            <div className="border-b border-gray-100 px-4 py-3">
              <p className="text-sm font-semibold text-gray-900">{user.name}</p>
              <p className="text-xs text-gray-500">{user.email}</p>
              <span className="mt-1 inline-block rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-600">
                {user.role}
              </span>
            </div>

            {/* Menu items */}
            <div className="max-h-[60vh] overflow-y-auto p-1.5 sm:max-h-80">
              {items.map((item, i) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                >
                  <svg
                    className="h-4.5 w-4.5 shrink-0 text-gray-400"
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
                </Link>
              ))}
            </div>

            {/* Separator + Logout */}
            <div className="border-t border-gray-100 p-1.5">
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50"
              >
                <svg
                  className="h-4.5 w-4.5 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
                  />
                </svg>
                Keluar
              </button>
            </div>

            {/* Mobile close handle */}
            <div className="flex justify-center pb-2 sm:hidden">
              <div className="h-1 w-10 rounded-full bg-gray-300" />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
