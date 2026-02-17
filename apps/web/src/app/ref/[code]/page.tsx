"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export default function ReferralRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;
  const [error, setError] = useState("");

  useEffect(() => {
    if (!code) return;

    (async () => {
      try {
        const r = await fetch(`${API}/ref/${encodeURIComponent(code)}`);
        if (!r.ok) {
          const e = await r.json().catch(() => ({}));
          setError(e.error || "Link referral tidak valid");
          return;
        }

        const data = await r.json();

        if (!data.valid) {
          setError(
            "Link referral tidak valid atau program afiliasi tidak aktif",
          );
          return;
        }

        // Set referral cookie
        const days = data.cookie_days || 30;
        const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
        document.cookie = `rw_ref=${encodeURIComponent(data.code)};path=/;expires=${expires.toUTCString()};SameSite=Lax`;

        // Redirect to register with ref param
        router.replace(`/auth/register?ref=${encodeURIComponent(data.code)}`);
      } catch {
        setError("Gagal memproses link referral");
      }
    })();
  }, [code, router]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-sm rounded-xl border bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <svg
              className="h-6 w-6 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h2 className="mb-2 text-lg font-semibold text-gray-800">
            Link Tidak Valid
          </h2>
          <p className="mb-6 text-sm text-gray-500">{error}</p>
          <a
            href="/auth/register"
            className="inline-block rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
          >
            Daftar Tanpa Referral
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
        <p className="text-sm text-gray-500">Memproses referral...</p>
      </div>
    </div>
  );
}
