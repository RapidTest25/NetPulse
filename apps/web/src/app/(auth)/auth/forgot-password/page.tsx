"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { authAPI } from "@/lib/auth-api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      await authAPI.forgotPassword(email);
      setMessage("Link reset password telah dikirim ke email Anda.");
    } catch (err: any) {
      setError(err.message || "Gagal mengirim link reset password");
    } finally {
      setLoading(false);
    }
  };

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
              Lupa Password?
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-slate-400">
              Jangan khawatir. Kami akan membantu Anda mendapatkan kembali akses
              ke akun Anda.
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

      {/* Right Panel - Form */}
      <div className="flex w-full items-center justify-center bg-white p-8 lg:w-1/2 dark:bg-slate-950">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Reset Password
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Masukkan email yang terdaftar
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-lg bg-red-50 p-4 text-sm text-red-500 dark:bg-red-900/10 dark:text-red-400">
                {error}
              </div>
            )}

            {message && (
              <div className="rounded-lg bg-green-50 p-4 text-sm text-green-600 dark:bg-green-900/10 dark:text-green-400">
                {message}
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Email
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <svg
                    className="h-5 w-5 text-slate-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="flex h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 pl-11 text-sm font-medium transition-all placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:ring-offset-slate-950 dark:focus:border-indigo-500"
                  placeholder="nama@email.com"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center rounded-2xl bg-indigo-600 px-8 py-4 text-base font-bold text-white shadow-lg shadow-indigo-500/30 transition-all hover:bg-indigo-500 hover:shadow-indigo-500/40 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:focus:ring-offset-slate-950"
            >
              {loading ? (
                <svg
                  className="mr-3 h-5 w-5 animate-spin text-white"
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
              ) : (
                "Kirim Link Reset"
              )}
            </button>
          </form>

          <p className="text-center text-sm text-slate-600 dark:text-slate-400">
            Ingat password Anda?{" "}
            <Link
              href="/auth/login"
              className="font-semibold text-indigo-600 hover:text-indigo-500 hover:underline dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              Masuk
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
