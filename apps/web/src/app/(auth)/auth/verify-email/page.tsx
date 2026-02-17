"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

function VerifyEmailContent() {
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState("");
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Token verifikasi tidak ditemukan.");
      return;
    }

    const verify = async () => {
      try {
        const res = await fetch(`${API_URL}/auth/verify-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Verifikasi gagal");
        }
        setStatus("success");
      } catch (error: any) {
        setStatus("error");
        setMessage(
          error.message || "Verifikasi gagal. Link mungkin sudah kadaluarsa.",
        );
      }
    };

    verify();
  }, [token]);

  return (
    <div className="w-full max-w-sm space-y-8">
      <div className="text-center">
        {status === "loading" && (
          <div className="flex flex-col items-center gap-6">
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-100 rounded-full animate-pulse dark:bg-indigo-900/20"></div>
              <div className="relative bg-white p-4 rounded-full shadow-sm ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800">
                <svg
                  className="h-8 w-8 text-indigo-600 animate-spin dark:text-indigo-400"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    className="opacity-25"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Verifikasi Email
              </h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Mohon tunggu, kami sedang memverifikasi email Anda...
              </p>
            </div>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center gap-6">
            <div className="relative bg-green-50 p-4 rounded-full ring-1 ring-green-100 dark:bg-green-900/10 dark:ring-green-900/20">
              <svg
                className="h-8 w-8 text-green-600 dark:text-green-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Email Terverifikasi!
              </h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Email Anda berhasil diverifikasi. Anda sekarang dapat mengakses
                akun Anda.
              </p>
            </div>
            <Link
              href="/auth/login"
              className="flex w-full items-center justify-center rounded-2xl bg-indigo-600 px-8 py-4 text-base font-bold text-white shadow-lg shadow-indigo-500/30 transition-all hover:bg-indigo-500 hover:shadow-indigo-500/40 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-950"
            >
              Lanjut ke Login
            </Link>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center gap-6">
            <div className="relative bg-red-50 p-4 rounded-full ring-1 ring-red-100 dark:bg-red-900/10 dark:ring-red-900/20">
              <svg
                className="h-8 w-8 text-red-600 dark:text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Verifikasi Gagal
              </h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                {message ||
                  "Kami tidak dapat memverifikasi email Anda. Link mungkin tidak valid atau sudah kadaluarsa."}
              </p>
            </div>
            <div className="space-y-3 w-full">
              <Link
                href="/auth/login"
                className="flex w-full items-center justify-center rounded-2xl border-2 border-slate-200 bg-transparent px-8 py-4 text-base font-bold text-slate-900 transition-all hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 dark:border-slate-800 dark:text-white dark:hover:border-slate-700 dark:hover:bg-slate-900 dark:focus:ring-offset-slate-950"
              >
                Kembali ke Login
              </Link>
              <Link
                href="/about"
                className="flex w-full items-center justify-center rounded-2xl bg-transparent px-8 py-4 text-base font-bold text-slate-500 transition-all hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              >
                Hubungi Support
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmail() {
  return (
    <div className="flex min-h-screen">
      {/* Left — Branding Panel (Consistent with Login) */}
      <div className="relative hidden w-1/2 overflow-hidden bg-slate-950 lg:flex lg:flex-col lg:justify-between">
        {/* Background Gradients & Blobs */}
        <div className="absolute inset-0">
          <div className="absolute -left-20 -top-20 h-[600px] w-[600px] rounded-full bg-violet-600/20 blur-[100px]" />
          <div className="absolute bottom-0 right-0 h-[600px] w-[600px] rounded-full bg-indigo-600/20 blur-[100px]" />
        </div>

        {/* Diagonal Stripe Pattern Overlay */}
        <div
          className="absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage:
              "linear-gradient(45deg, #4f46e5 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        <div className="relative z-10 flex flex-1 flex-col justify-center px-16 xl:px-24">
          <div className="mb-12 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/30">
              <Image
                src="/img/ak-netpulse.png"
                alt="NetPulse"
                width={32}
                height={32}
                className="h-8 w-8 object-contain brightness-0 invert"
              />
            </div>
            <span className="text-2xl font-bold tracking-tight text-white">
              NetPulse
            </span>
          </div>

          <div className="max-w-md">
            <h1 className="text-4xl font-bold tracking-tight text-white lg:text-5xl">
              Konfirmasi Email
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-slate-400">
              Verifikasi email Anda untuk membuka akses penuh ke akun Anda dan
              mulai membangun.
            </p>
          </div>
        </div>

        {/* Footer Copyright */}
        <div className="relative z-10 px-16 py-8 xl:px-24">
          <p className="text-sm text-slate-500">
            &copy; {new Date().getFullYear()} NetPulse Inc. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right Panel - Content */}
      <div className="flex w-full items-center justify-center bg-white p-8 lg:w-1/2 dark:bg-slate-950">
        <Suspense fallback={<div>Loading...</div>}>
          <VerifyEmailContent />
        </Suspense>
      </div>
    </div>
  );
}
