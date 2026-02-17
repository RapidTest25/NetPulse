"use client";

import { useState, useEffect, useCallback } from "react";
import { userAPI } from "@/lib/auth-api";
import Link from "next/link";
import type {
  AffiliateProfile,
  AffiliateStats,
  Commission,
  PayoutRequest,
} from "@/types";

const fmt = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);

const statusColor = (s: string) => {
  const map: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-700",
    APPROVED: "bg-green-100 text-green-700",
    PROCESSING: "bg-blue-100 text-blue-700",
    PAID: "bg-emerald-100 text-emerald-700",
    REJECTED: "bg-red-100 text-red-700",
    SUSPENDED: "bg-gray-100 text-gray-600",
    HELD: "bg-orange-100 text-orange-700",
    RELEASED: "bg-teal-100 text-teal-700",
  };
  return map[s] || "bg-gray-100 text-gray-600";
};

type Tab = "dashboard" | "commissions" | "payouts" | "settings";

export default function UserAffiliatePage() {
  const [profile, setProfile] = useState<AffiliateProfile | null>(null);
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolled, setEnrolled] = useState(false);
  const [tab, setTab] = useState<Tab>("dashboard");

  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [commPage, setCommPage] = useState(1);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [payPage, setPayPage] = useState(1);

  const [toast, setToast] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  // Enroll form
  const [enrollForm, setEnrollForm] = useState({
    payout_method: "BANK",
    provider_name: "",
    account_name: "",
    account_number: "",
  });
  const [enrolling, setEnrolling] = useState(false);

  // Payout request
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState(0);
  const [payoutNote, setPayoutNote] = useState("");
  const [requesting, setRequesting] = useState(false);

  // Settings
  const [settingsForm, setSettingsForm] = useState({
    payout_method: "BANK",
    provider_name: "",
    account_name: "",
    account_number: "",
  });
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const loadProfile = useCallback(async () => {
    try {
      const data = await userAPI.getAffiliateProfile();
      if (data?.enrolled) {
        setEnrolled(true);
        setProfile(data.profile);
        if (data.profile) {
          setSettingsForm({
            payout_method: data.profile.payout_method || "BANK",
            provider_name: data.profile.provider_name || "",
            account_name: data.profile.payout_name || "",
            account_number: data.profile.payout_number || "",
          });
        }
      }
    } catch {
      /* not enrolled */
    }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const data = await userAPI.getAffiliateStats();
      setStats(data);
    } catch {}
  }, []);

  const loadCommissions = useCallback(async (page: number) => {
    try {
      const data = await userAPI.getCommissions(page);
      setCommissions(data.items || []);
      setCommPage(page);
    } catch {}
  }, []);

  const loadPayouts = useCallback(async (page: number) => {
    try {
      const data = await userAPI.getPayouts(page);
      setPayouts(data.items || []);
      setPayPage(page);
    } catch {}
  }, []);

  useEffect(() => {
    Promise.all([loadProfile(), loadStats()]).finally(() => setLoading(false));
  }, [loadProfile, loadStats]);

  useEffect(() => {
    if (tab === "commissions" && enrolled) loadCommissions(1);
  }, [tab, enrolled, loadCommissions]);
  useEffect(() => {
    if (tab === "payouts" && enrolled) loadPayouts(1);
  }, [tab, enrolled, loadPayouts]);

  const handleEnroll = async () => {
    if (
      !enrollForm.provider_name ||
      !enrollForm.account_name ||
      !enrollForm.account_number
    )
      return;
    setEnrolling(true);
    try {
      await userAPI.enrollAffiliate(enrollForm);
      setToast({
        type: "success",
        msg: "Pendaftaran berhasil! Menunggu persetujuan admin.",
      });
      await loadProfile();
    } catch (err: unknown) {
      setToast({
        type: "error",
        msg: err instanceof Error ? err.message : "Gagal mendaftar",
      });
    } finally {
      setEnrolling(false);
    }
  };

  const handleRequestPayout = async () => {
    if (payoutAmount <= 0) return;
    setRequesting(true);
    try {
      await userAPI.requestPayout({
        amount: payoutAmount,
        note: payoutNote || undefined,
      });
      setToast({ type: "success", msg: "Permintaan payout berhasil dikirim!" });
      setShowPayoutModal(false);
      setPayoutAmount(0);
      setPayoutNote("");
      loadStats();
      loadPayouts(1);
    } catch (err: unknown) {
      setToast({
        type: "error",
        msg: err instanceof Error ? err.message : "Gagal mengirim permintaan",
      });
    } finally {
      setRequesting(false);
    }
  };

  const handleUpdatePayout = async () => {
    setSavingSettings(true);
    try {
      await userAPI.updatePayoutInfo(settingsForm);
      setToast({
        type: "success",
        msg: "Info pembayaran berhasil diperbarui!",
      });
      loadProfile();
    } catch (err: unknown) {
      setToast({
        type: "error",
        msg: err instanceof Error ? err.message : "Gagal menyimpan",
      });
    } finally {
      setSavingSettings(false);
    }
  };

  const referralLink = profile?.referral_code
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/ref/${profile.referral_code}`
    : "";

  if (loading)
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-sky-600" />
      </div>
    );

  const inputCls =
    "mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100";

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      {toast && (
        <div
          className={`fixed right-4 top-4 z-[100] flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium shadow-lg ${toast.type === "success" ? "bg-green-50 text-green-700 ring-1 ring-green-200" : "bg-red-50 text-red-700 ring-1 ring-red-200"}`}
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
              d={
                toast.type === "success"
                  ? "M4.5 12.75l6 6 9-13.5"
                  : "M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
              }
            />
          </svg>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/me"
          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
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
              d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
            />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Program Afiliasi</h1>
          <p className="text-sm text-gray-500">
            Dapatkan komisi dari setiap referral yang terverifikasi.
          </p>
        </div>
      </div>

      {!enrolled ? (
        <div className="rounded-2xl border border-gray-200/60 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-6 py-5">
            <h2 className="text-lg font-semibold text-gray-900">
              Bergabung Sekarang
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Daftar sebagai afiliasi dan mulai hasilkan komisi dari referral.
            </p>
          </div>
          <div className="space-y-5 p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Metode Pembayaran
                </label>
                <select
                  className={inputCls}
                  value={enrollForm.payout_method}
                  onChange={(e) =>
                    setEnrollForm({
                      ...enrollForm,
                      payout_method: e.target.value,
                    })
                  }
                >
                  <option value="BANK">Transfer Bank</option>
                  <option value="EWALLET">E-Wallet</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Nama Provider
                </label>
                <input
                  className={inputCls}
                  placeholder="cth: BCA, Mandiri, GoPay, OVO"
                  value={enrollForm.provider_name}
                  onChange={(e) =>
                    setEnrollForm({
                      ...enrollForm,
                      provider_name: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Nama Pemilik Rekening
                </label>
                <input
                  className={inputCls}
                  placeholder="Nama lengkap sesuai rekening"
                  value={enrollForm.account_name}
                  onChange={(e) =>
                    setEnrollForm({
                      ...enrollForm,
                      account_name: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Nomor Rekening / HP
                </label>
                <input
                  className={inputCls}
                  placeholder="1234567890"
                  value={enrollForm.account_number}
                  onChange={(e) =>
                    setEnrollForm({
                      ...enrollForm,
                      account_number: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end border-t border-gray-100 px-6 py-4">
            <button
              onClick={handleEnroll}
              disabled={
                enrolling ||
                !enrollForm.provider_name ||
                !enrollForm.account_name ||
                !enrollForm.account_number
              }
              className="rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 disabled:opacity-50"
            >
              {enrolling ? "Mendaftar..." : "Daftar Sebagai Afiliasi"}
            </button>
          </div>
        </div>
      ) : (
        <>
          {profile?.status === "PENDING" && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <strong>Menunggu Persetujuan</strong> — Pendaftaran Anda sedang
              ditinjau oleh admin.
            </div>
          )}
          {profile?.is_blocked && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              <strong>Akun Diblokir</strong> —{" "}
              {profile.blocked_reason ||
                "Hubungi admin untuk informasi lebih lanjut."}
            </div>
          )}

          <div className="flex gap-1 rounded-xl border border-gray-200 bg-gray-100/50 p-1">
            {[
              { id: "dashboard" as Tab, label: "Dashboard" },
              { id: "commissions" as Tab, label: "Komisi" },
              { id: "payouts" as Tab, label: "Payout" },
              { id: "settings" as Tab, label: "Pengaturan" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${tab === t.id ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === "dashboard" && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  {
                    label: "Total Earnings",
                    value: fmt(stats?.total_earnings ?? 0),
                    color: "text-emerald-600 bg-emerald-50",
                  },
                  {
                    label: "Saldo Tersedia",
                    value: fmt(stats?.available_balance ?? 0),
                    color: "text-sky-600 bg-sky-50",
                  },
                  {
                    label: "Pending",
                    value: fmt(stats?.pending_balance ?? 0),
                    color: "text-amber-600 bg-amber-50",
                  },
                  {
                    label: "Total Dibayar",
                    value: fmt(stats?.total_paid ?? 0),
                    color: "text-violet-600 bg-violet-50",
                  },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="rounded-2xl border border-gray-200/60 bg-white p-4 shadow-sm"
                  >
                    <p className="text-xs font-medium text-gray-500">
                      {s.label}
                    </p>
                    <p className="mt-1 text-xl font-bold text-gray-900">
                      {s.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-gray-200/60 bg-white p-5 shadow-sm text-center">
                  <p className="text-3xl font-bold text-gray-900">
                    {stats?.total_referrals ?? 0}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">Total Referral</p>
                </div>
                <div className="rounded-2xl border border-gray-200/60 bg-white p-5 shadow-sm text-center">
                  <p className="text-3xl font-bold text-emerald-600">
                    {stats?.verified_referrals ?? 0}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">Terverifikasi</p>
                </div>
                <div className="rounded-2xl border border-gray-200/60 bg-white p-5 shadow-sm text-center">
                  <p className="text-3xl font-bold text-sky-600">
                    {fmt(stats?.this_month_earnings ?? 0)}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">Bulan Ini</p>
                </div>
              </div>

              {referralLink && profile?.status === "APPROVED" && (
                <div className="rounded-2xl border border-gray-200/60 bg-white p-5 shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Link Referral Anda
                  </h3>
                  <p className="mt-1 text-xs text-gray-500">
                    Bagikan link ini untuk mendapatkan komisi referral.
                  </p>
                  <div className="mt-3 flex gap-2">
                    <input
                      readOnly
                      value={referralLink}
                      className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-mono text-gray-700"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(referralLink);
                        setToast({ type: "success", msg: "Link disalin!" });
                      }}
                      className="shrink-0 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              )}

              {(stats?.available_balance ?? 0) > 0 &&
                profile?.status === "APPROVED" && (
                  <button
                    onClick={() => {
                      setPayoutAmount(stats?.available_balance ?? 0);
                      setShowPayoutModal(true);
                    }}
                    className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
                  >
                    Cairkan Saldo ({fmt(stats?.available_balance ?? 0)})
                  </button>
                )}
            </div>
          )}

          {tab === "commissions" && (
            <div className="rounded-2xl border border-gray-200/60 bg-white shadow-sm">
              <div className="border-b border-gray-100 px-5 py-4">
                <h3 className="text-sm font-semibold text-gray-900">
                  Riwayat Komisi
                </h3>
              </div>
              {commissions.length === 0 ? (
                <div className="px-5 py-10 text-center text-sm text-gray-400">
                  Belum ada komisi.
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {commissions.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between px-5 py-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {c.description}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-400">
                          {new Date(c.created_at).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-emerald-600">
                          {fmt(c.amount)}
                        </p>
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${statusColor(c.status)}`}
                        >
                          {c.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {commissions.length > 0 && (
                <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3">
                  <button
                    disabled={commPage <= 1}
                    onClick={() => loadCommissions(commPage - 1)}
                    className="text-xs font-medium text-gray-500 hover:text-gray-700 disabled:opacity-30"
                  >
                    ← Sebelumnya
                  </button>
                  <span className="text-xs text-gray-400">Hal. {commPage}</span>
                  <button
                    onClick={() => loadCommissions(commPage + 1)}
                    className="text-xs font-medium text-gray-500 hover:text-gray-700"
                  >
                    Selanjutnya →
                  </button>
                </div>
              )}
            </div>
          )}

          {tab === "payouts" && (
            <div className="rounded-2xl border border-gray-200/60 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                <h3 className="text-sm font-semibold text-gray-900">
                  Riwayat Payout
                </h3>
                {(stats?.available_balance ?? 0) > 0 &&
                  profile?.status === "APPROVED" && (
                    <button
                      onClick={() => {
                        setPayoutAmount(stats?.available_balance ?? 0);
                        setShowPayoutModal(true);
                      }}
                      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
                    >
                      Cairkan
                    </button>
                  )}
              </div>
              {payouts.length === 0 ? (
                <div className="px-5 py-10 text-center text-sm text-gray-400">
                  Belum ada riwayat payout.
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {payouts.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between px-5 py-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {fmt(p.amount)}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-400">
                          {new Date(p.created_at).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor(p.status)}`}
                        >
                          {p.status}
                        </span>
                        {p.admin_note && (
                          <p className="mt-0.5 text-[10px] text-gray-400">
                            {p.admin_note}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {payouts.length > 0 && (
                <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3">
                  <button
                    disabled={payPage <= 1}
                    onClick={() => loadPayouts(payPage - 1)}
                    className="text-xs font-medium text-gray-500 hover:text-gray-700 disabled:opacity-30"
                  >
                    ← Sebelumnya
                  </button>
                  <span className="text-xs text-gray-400">Hal. {payPage}</span>
                  <button
                    onClick={() => loadPayouts(payPage + 1)}
                    className="text-xs font-medium text-gray-500 hover:text-gray-700"
                  >
                    Selanjutnya →
                  </button>
                </div>
              )}
            </div>
          )}

          {tab === "settings" && (
            <div className="rounded-2xl border border-gray-200/60 bg-white shadow-sm">
              <div className="border-b border-gray-100 px-6 py-4">
                <h3 className="text-sm font-semibold text-gray-900">
                  Info Pembayaran
                </h3>
                <p className="mt-0.5 text-xs text-gray-500">
                  Perbarui metode dan detail pembayaran Anda.
                </p>
              </div>
              <div className="space-y-4 p-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Metode
                    </label>
                    <select
                      className={inputCls}
                      value={settingsForm.payout_method}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          payout_method: e.target.value,
                        })
                      }
                    >
                      <option value="BANK">Transfer Bank</option>
                      <option value="EWALLET">E-Wallet</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Nama Provider
                    </label>
                    <input
                      className={inputCls}
                      placeholder="BCA, Mandiri, GoPay, OVO"
                      value={settingsForm.provider_name}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          provider_name: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Nama Pemilik
                    </label>
                    <input
                      className={inputCls}
                      value={settingsForm.account_name}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          account_name: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Nomor Rekening / HP
                    </label>
                    <input
                      className={inputCls}
                      value={settingsForm.account_number}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          account_number: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end border-t border-gray-100 px-6 py-4">
                <button
                  onClick={handleUpdatePayout}
                  disabled={savingSettings}
                  className="rounded-lg bg-sky-600 px-5 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
                >
                  {savingSettings ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {showPayoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">
              Cairkan Saldo
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Saldo tersedia: {fmt(stats?.available_balance ?? 0)}
            </p>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Jumlah (IDR)
                </label>
                <input
                  type="number"
                  className={inputCls}
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(Number(e.target.value))}
                  max={stats?.available_balance ?? 0}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Catatan (opsional)
                </label>
                <textarea
                  rows={2}
                  className={inputCls}
                  value={payoutNote}
                  onChange={(e) => setPayoutNote(e.target.value)}
                  placeholder="Catatan untuk admin"
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setShowPayoutModal(false)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={handleRequestPayout}
                disabled={requesting || payoutAmount <= 0}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {requesting ? "Mengirim..." : "Kirim Permintaan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
