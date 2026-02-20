"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { authAPI } from "@/lib/auth-api";

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: {
              access_token?: string;
              error?: string;
            }) => void;
          }) => {
            requestAccessToken: () => void;
          };
        };
      };
    };
  }
}

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    username: "",
    password: "",
    referralCode: searchParams.get("ref") || "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await authAPI.register(formData);
      setSuccess(true);
      setTimeout(() => {
        router.push("/auth/login");
      }, 3000);
    } catch (err: any) {
      setError(err.message || "Gagal mendaftar");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    setGoogleLoading(true);
    setError("");

    if (
      typeof window === "undefined" ||
      !window.google ||
      !window.google.accounts
    ) {
      setError("Google Sign-In tidak tersedia saat ini.");
      setGoogleLoading(false);
      return;
    }

    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",
      scope:
        "https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email",
      callback: async (response) => {
        if (response.error || !response.access_token) {
          setError("Google sign-up dibatalkan");
          setGoogleLoading(false);
          return;
        }
        try {
          const data = await authAPI.loginWithGoogle(response.access_token);
          const role = (data.user?.role || "").toUpperCase();
          if (role === "OWNER" || role === "ADMIN") {
            router.push("/admin");
          } else {
            router.push("/");
          }
        } catch (err: any) {
          setError(err.message || "Google sign-up gagal");
        } finally {
          setGoogleLoading(false);
        }
      },
    });
    client.requestAccessToken();
  };

  return (
    <div className="flex min-h-screen">
      {/* Left — Branding Panel */}
      <div className="relative hidden w-1/2 overflow-hidden bg-slate-950 lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0">
          <div className="absolute -left-20 -top-20 h-[600px] w-[600px] rounded-full bg-violet-600/20 blur-[100px]" />
          <div className="absolute bottom-0 right-0 h-[600px] w-[600px] rounded-full bg-indigo-600/20 blur-[100px]" />
        </div>
        <div
          className="absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage: "linear-gradient(45deg, #4f46e5 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="relative z-10 flex flex-1 flex-col justify-center px-16 xl:px-24">
          <div className="mb-12 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/30">
              <Image src="/img/ak-netpulse.png" alt="NetPulse" width={32} height={32} className="h-8 w-8 object-contain brightness-0 invert" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-white">NetPulse</span>
          </div>
          <div className="max-w-md">
            <h1 className="text-4xl font-bold tracking-tight text-white lg:text-5xl">
              Mulai Perjalanan <br />
              <span className="text-indigo-400">Jaringan Anda.</span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-slate-400">
              Bergabung dengan komunitas profesional jaringan terbesar. Akses tools premium, analitik, dan insight dalam satu platform.
            </p>
          </div>
        </div>
        <div className="relative z-10 px-16 py-8 xl:px-24">
          <p className="text-sm text-slate-500">&copy; {new Date().getFullYear()} NetPulse Inc. All rights reserved.</p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex w-full items-center justify-center bg-white p-8 lg:w-1/2 dark:bg-slate-950">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Buat akun baru</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Isi data diri Anda untuk memulai</p>
          </div>

          {success ? (
            <div className="rounded-xl bg-green-50 p-6 text-center dark:bg-green-900/10">
              <div className="mb-4 flex justify-center">
                <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/20">
                  <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <h3 className="mb-2 text-lg font-medium text-green-800 dark:text-green-200">Registrasi Berhasil!</h3>
              <p className="text-sm text-green-700 dark:text-green-300">Akun Anda telah dibuat. Mengalihkan ke halaman login...</p>
            </div>
          ) : (
            <>
              {/* Google Sign-up */}
              <div className="space-y-4">
                <button
                  onClick={handleGoogleSignup}
                  disabled={googleLoading}
                  className="flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm font-medium text-slate-700 transition-all hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white dark:focus:ring-offset-slate-950"
                >
                  {googleLoading ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-500 border-t-transparent" />
                  ) : (
                    <Image src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" width={20} height={20} className="h-5 w-5" />
                  )}
                  <span>Daftar dengan Google</span>
                </button>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200 dark:border-slate-800" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-white px-4 text-slate-500 dark:bg-slate-950">atau daftar dengan email</span>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="rounded-lg bg-red-50 p-4 text-sm text-red-500 dark:bg-red-900/10 dark:text-red-400">{error}</div>
                )}
                <div className="space-y-4">
                  {/* Name */}
                  <div>
                    <label htmlFor="reg-name" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Nama Lengkap</label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                        <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                        </svg>
                      </div>
                      <input id="reg-name" type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required
                        className="flex h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 pl-11 text-sm font-medium transition-all placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:ring-offset-slate-950 dark:focus:border-indigo-500"
                        placeholder="John Doe" />
                    </div>
                  </div>

                  {/* Username */}
                  <div>
                    <label htmlFor="reg-username" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Username</label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                        <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 12a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zm0 0c0 1.657 1.007 3 2.25 3S21 13.657 21 12a9 9 0 10-2.636 6.364M16.5 12V8.25" />
                        </svg>
                      </div>
                      <input id="reg-username" type="text" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} required
                        className="flex h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 pl-11 text-sm font-medium transition-all placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:ring-offset-slate-950 dark:focus:border-indigo-500"
                        placeholder="johndoe" />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="reg-email" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                        <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <input id="reg-email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required
                        className="flex h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 pl-11 text-sm font-medium transition-all placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:ring-offset-slate-950 dark:focus:border-indigo-500"
                        placeholder="nama@email.com" />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label htmlFor="reg-password" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                        <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <input id="reg-password" type={showPassword ? "text" : "password"} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required
                        className="flex h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 pl-11 pr-10 text-sm font-medium transition-all placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:ring-offset-slate-950 dark:focus:border-indigo-500"
                        placeholder="••••••••" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                        className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                        {showPassword ? (
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        ) : (
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Referral Code */}
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Kode Referral <span className="font-normal text-slate-400">(Opsional)</span>
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                        <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                        </svg>
                      </div>
                      <input type="text" value={formData.referralCode} onChange={(e) => setFormData({ ...formData, referralCode: e.target.value })}
                        className="flex h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 pl-11 text-sm font-medium transition-all placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:ring-offset-slate-950 dark:focus:border-indigo-500"
                        placeholder="KODE123" />
                    </div>
                  </div>
                </div>

                <button type="submit" disabled={loading}
                  className="flex w-full items-center justify-center rounded-2xl bg-indigo-600 px-8 py-4 text-base font-bold text-white shadow-lg shadow-indigo-500/30 transition-all hover:bg-indigo-500 hover:shadow-indigo-500/40 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:focus:ring-offset-slate-950">
                  {loading ? (
                    <svg className="mr-3 h-5 w-5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : ("Buat Akun")}
                </button>
              </form>
            </>
          )}

          <p className="text-center text-sm text-slate-600 dark:text-slate-400">
            Sudah punya akun?{" "}
            <Link href="/auth/login" className="font-semibold text-indigo-600 hover:text-indigo-500 hover:underline dark:text-indigo-400 dark:hover:text-indigo-300">
              Masuk
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gray-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
      </div>
    }>
      <RegisterContent />
    </Suspense>
  );
}
