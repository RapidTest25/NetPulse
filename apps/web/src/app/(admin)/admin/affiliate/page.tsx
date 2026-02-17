"use client";

import { useEffect, useState, useCallback } from "react";
import { authFetch } from "@/lib/auth";
import type {
  AffiliateSettings,
  AdminAffiliateStats,
  AffiliateProfile,
  PayoutRequest,
  TopAffiliate,
} from "@/types";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

type Tab = "overview" | "affiliates" | "payouts" | "settings";

/* ────────────────────────── helpers ────────────────────────── */
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

/* ────────────────────────── component ─────────────────────── */
export default function AdminAffiliatePage() {
  const [tab, setTab] = useState<Tab>("overview");

  // Overview
  const [stats, setStats] = useState<AdminAffiliateStats | null>(null);
  const [settings, setSettings] = useState<AffiliateSettings | null>(null);

  // Affiliates
  const [affiliates, setAffiliates] = useState<AffiliateProfile[]>([]);
  const [affPage, setAffPage] = useState(1);
  const [affTotal, setAffTotal] = useState(0);
  const [affStatus, setAffStatus] = useState("");
  const [affSearch, setAffSearch] = useState("");

  // Payouts
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [payPage, setPayPage] = useState(1);
  const [payTotal, setPayTotal] = useState(0);
  const [payStatus, setPayStatus] = useState("");

  // Settings form
  const [settingsForm, setSettingsForm] = useState({
    enabled: true,
    commission_type: "PERCENTAGE" as
      | "PERCENTAGE"
      | "FIXED"
      | "FIXED_PER_VERIFIED_REFERRAL",
    commission_value: 0,
    cookie_days: 30,
    payout_minimum: 50000,
    payout_schedule: "MONTHLY" as "WEEKLY" | "BIWEEKLY" | "MONTHLY" | "MANUAL",
    referral_hold_days: 7,
    terms_text: "",
    how_it_works_md: "",
    terms_md: "",
    payout_rules_md: "",
  });

  // Modals / inline inputs
  const [blockModal, setBlockModal] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [blockReason, setBlockReason] = useState("");
  const [adjustModal, setAdjustModal] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [adjustForm, setAdjustForm] = useState({
    amount: 0,
    balance_type: "available" as "available" | "locked",
    reason: "",
  });
  const [rejectModal, setRejectModal] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [markPaidModal, setMarkPaidModal] = useState<string | null>(null);
  const [paidForm, setPaidForm] = useState({
    payment_reference: "",
    proof_url: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const flash = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 3000);
  };

  /* ── data loaders ─────────────────────────────────────────── */
  const loadOverview = useCallback(async () => {
    try {
      const [st, se] = await Promise.all([
        authFetch(`${API}/admin/affiliate/stats`).then((r) =>
          r.ok ? r.json() : null,
        ),
        authFetch(`${API}/admin/affiliate/settings`).then((r) =>
          r.ok ? r.json() : null,
        ),
      ]);
      if (st) setStats(st as AdminAffiliateStats);
      if (se) {
        const s = se as AffiliateSettings;
        setSettings(s);
        setSettingsForm({
          enabled: s.enabled,
          commission_type: s.commission_type,
          commission_value: s.commission_value,
          cookie_days: s.cookie_days || 30,
          payout_minimum: s.payout_minimum,
          payout_schedule: s.payout_schedule,
          referral_hold_days: s.referral_hold_days ?? 7,
          terms_text: s.terms_text || "",
          how_it_works_md: s.how_it_works_md || "",
          terms_md: s.terms_md || "",
          payout_rules_md: s.payout_rules_md || "",
        });
      }
    } catch {}
  }, []);

  const loadAffiliates = useCallback(
    async (page: number, status: string, search: string) => {
      try {
        const sp = new URLSearchParams();
        sp.set("page", String(page));
        if (status) sp.set("status", status);
        if (search) sp.set("search", search);
        const r = await authFetch(
          `${API}/admin/affiliate/affiliates?${sp.toString()}`,
        );
        if (!r.ok) return;
        const res = await r.json();
        setAffiliates(res.items || []);
        setAffTotal(res.total_pages || 1);
        setAffPage(page);
      } catch {}
    },
    [],
  );

  const loadPayouts = useCallback(async (page: number, status: string) => {
    try {
      const sp = new URLSearchParams();
      sp.set("page", String(page));
      if (status) sp.set("status", status);
      const r = await authFetch(
        `${API}/admin/affiliate/payouts?${sp.toString()}`,
      );
      if (!r.ok) return;
      const res = await r.json();
      setPayouts(res.items || []);
      setPayTotal(res.total_pages || 1);
      setPayPage(page);
    } catch {}
  }, []);

  useEffect(() => {
    loadOverview().finally(() => setLoading(false));
  }, [loadOverview]);

  useEffect(() => {
    if (tab === "affiliates") loadAffiliates(1, affStatus, affSearch);
  }, [tab, affStatus, affSearch, loadAffiliates]);

  useEffect(() => {
    if (tab === "payouts") loadPayouts(1, payStatus);
  }, [tab, payStatus, loadPayouts]);

  /* ── affiliate actions ────────────────────────────────────── */
  const handleUpdateStatus = async (id: string, status: string) => {
    setError("");
    try {
      const r = await authFetch(
        `${API}/admin/affiliate/affiliates/${id}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        },
      );
      if (!r.ok) {
        const e = await r.json().catch(() => ({}));
        throw new Error(e.error || "Failed");
      }
      flash(`Status diperbarui ke ${status}`);
      loadAffiliates(affPage, affStatus, affSearch);
    } catch (err: any) {
      setError(err.message || "Gagal memperbarui status");
    }
  };

  const handleBlock = async () => {
    if (!blockModal || !blockReason.trim()) return;
    setActionLoading(true);
    setError("");
    try {
      const r = await authFetch(
        `${API}/admin/affiliate/affiliates/${blockModal.id}/block`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: blockReason }),
        },
      );
      if (!r.ok) {
        const e = await r.json().catch(() => ({}));
        throw new Error(e.error || "Failed");
      }
      flash("Afiliasi diblokir");
      setBlockModal(null);
      setBlockReason("");
      loadAffiliates(affPage, affStatus, affSearch);
    } catch (err: any) {
      setError(err.message || "Gagal memblokir afiliasi");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnblock = async (id: string) => {
    setError("");
    try {
      const r = await authFetch(
        `${API}/admin/affiliate/affiliates/${id}/block`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: "" }),
        },
      );
      if (!r.ok) {
        const e = await r.json().catch(() => ({}));
        throw new Error(e.error || "Failed");
      }
      flash("Blokir dicabut");
      loadAffiliates(affPage, affStatus, affSearch);
    } catch (err: any) {
      setError(err.message || "Gagal mencabut blokir");
    }
  };

  const handleFlagSuspicious = async (id: string, flag: boolean) => {
    setError("");
    try {
      const r = await authFetch(
        `${API}/admin/affiliate/affiliates/${id}/suspicious`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_suspicious: flag }),
        },
      );
      if (!r.ok) {
        const e = await r.json().catch(() => ({}));
        throw new Error(e.error || "Failed");
      }
      flash(flag ? "Ditandai mencurigakan" : "Tanda mencurigakan dicabut");
      loadAffiliates(affPage, affStatus, affSearch);
    } catch (err: any) {
      setError(err.message || "Gagal memperbarui flag");
    }
  };

  const handleAdjustBalance = async () => {
    if (!adjustModal || !adjustForm.reason.trim() || adjustForm.amount === 0)
      return;
    setActionLoading(true);
    setError("");
    try {
      const r = await authFetch(
        `${API}/admin/affiliate/affiliates/${adjustModal.id}/adjust-balance`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(adjustForm),
        },
      );
      if (!r.ok) {
        const e = await r.json().catch(() => ({}));
        throw new Error(e.error || "Failed");
      }
      flash("Saldo disesuaikan");
      setAdjustModal(null);
      setAdjustForm({ amount: 0, balance_type: "available", reason: "" });
      loadAffiliates(affPage, affStatus, affSearch);
      loadOverview();
    } catch (err: any) {
      setError(err.message || "Gagal menyesuaikan saldo");
    } finally {
      setActionLoading(false);
    }
  };

  /* ── payout actions ───────────────────────────────────────── */
  const handleApprovePayout = async (id: string) => {
    setError("");
    try {
      const r = await authFetch(
        `${API}/admin/affiliate/payouts/${id}/approve`,
        { method: "POST" },
      );
      if (!r.ok) {
        const e = await r.json().catch(() => ({}));
        throw new Error(e.error || "Failed");
      }
      flash("Pencairan disetujui");
      loadPayouts(payPage, payStatus);
      loadOverview();
    } catch (err: any) {
      setError(err.message || "Gagal menyetujui pencairan");
    }
  };

  const handleRejectPayout = async () => {
    if (!rejectModal || !rejectNote.trim()) return;
    setActionLoading(true);
    setError("");
    try {
      const r = await authFetch(
        `${API}/admin/affiliate/payouts/${rejectModal}/reject`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ admin_note: rejectNote }),
        },
      );
      if (!r.ok) {
        const e = await r.json().catch(() => ({}));
        throw new Error(e.error || "Failed");
      }
      flash("Pencairan ditolak");
      setRejectModal(null);
      setRejectNote("");
      loadPayouts(payPage, payStatus);
      loadOverview();
    } catch (err: any) {
      setError(err.message || "Gagal menolak pencairan");
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkPaid = async () => {
    if (!markPaidModal) return;
    setActionLoading(true);
    setError("");
    try {
      const r = await authFetch(
        `${API}/admin/affiliate/payouts/${markPaidModal}/mark-paid`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(paidForm),
        },
      );
      if (!r.ok) {
        const e = await r.json().catch(() => ({}));
        throw new Error(e.error || "Failed");
      }
      flash("Pencairan ditandai dibayar");
      setMarkPaidModal(null);
      setPaidForm({ payment_reference: "", proof_url: "" });
      loadPayouts(payPage, payStatus);
      loadOverview();
    } catch (err: any) {
      setError(err.message || "Gagal menandai dibayar");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReleaseHeld = async () => {
    if (!confirm("Release semua komisi yang sudah melewati masa hold?")) return;
    setError("");
    try {
      const r = await authFetch(`${API}/admin/affiliate/release-commissions`, {
        method: "POST",
      });
      if (!r.ok) {
        const e = await r.json().catch(() => ({}));
        throw new Error(e.error || "Failed");
      }
      const res = await r.json().catch(() => ({}));
      flash(`${res.released || 0} komisi di-release`);
      loadOverview();
    } catch (err: any) {
      setError(err.message || "Gagal release komisi");
    }
  };

  /* ── settings save ────────────────────────────────────────── */
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const r = await authFetch(`${API}/admin/affiliate/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settingsForm),
      });
      if (!r.ok) {
        const e = await r.json().catch(() => ({}));
        throw new Error(e.error || "Failed");
      }
      flash("Pengaturan disimpan!");
      loadOverview();
    } catch (err: any) {
      setError(err.message || "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  };

  /* ── render ───────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Manajemen Afiliasi
          </h1>
          <p className="text-sm text-gray-500">
            Kelola program afiliasi, mitra, dan pencairan
          </p>
        </div>
        <button
          onClick={handleReleaseHeld}
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-700"
        >
          Release Held Commissions
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg bg-green-50 p-3 text-sm text-green-600">
          {success}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
        {(["overview", "affiliates", "payouts", "settings"] as Tab[]).map(
          (t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition ${
                tab === t
                  ? "bg-white text-indigo-700 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t === "overview"
                ? "Ikhtisar"
                : t === "affiliates"
                  ? "Mitra"
                  : t === "payouts"
                    ? "Pencairan"
                    : "Pengaturan"}
            </button>
          ),
        )}
      </div>

      {/* ── Overview ────────────────────────────── */}
      {tab === "overview" && stats && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <OverviewCard
              label="Total Afiliasi"
              value={String(stats.total_affiliates)}
              color="indigo"
            />
            <OverviewCard
              label="Afiliasi Aktif"
              value={String(stats.active_affiliates)}
              color="green"
            />
            <OverviewCard
              label="Verifikasi 30 Hari"
              value={String(stats.verified_last_30_days ?? 0)}
              color="purple"
            />
            <OverviewCard
              label="Program"
              value={settings?.enabled ? "Aktif" : "Nonaktif"}
              color={settings?.enabled ? "green" : "red"}
            />
            <OverviewCard
              label="Total Komisi"
              value={fmt(stats.total_commissions)}
              color="purple"
            />
            <OverviewCard
              label="Total Dibayarkan"
              value={fmt(stats.total_paid_out)}
              color="emerald"
            />
            <OverviewCard
              label="Pencairan Tertunda"
              value={`${stats.pending_payouts} (${fmt(stats.pending_payouts_amount ?? 0)})`}
              color="yellow"
            />
            <OverviewCard
              label="Hold Days"
              value={`${settings?.referral_hold_days ?? 7} hari`}
              color="indigo"
            />
          </div>

          {/* Top Affiliates Leaderboard */}
          {stats.top_affiliates && stats.top_affiliates.length > 0 && (
            <div className="rounded-xl border bg-white p-5 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-gray-700">
                Top Afiliasi (Penghasilan Tertinggi)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
                    <tr>
                      <th className="px-4 py-2">#</th>
                      <th className="px-4 py-2">Nama</th>
                      <th className="px-4 py-2">Referral</th>
                      <th className="px-4 py-2">Penghasilan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {stats.top_affiliates.map((t: TopAffiliate, i: number) => (
                      <tr key={t.user_id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 font-mono text-xs text-gray-400">
                          {i + 1}
                        </td>
                        <td className="px-4 py-2 font-medium text-gray-800">
                          {t.user_name}
                        </td>
                        <td className="px-4 py-2 text-xs text-gray-500">
                          {t.verified_referrals}
                        </td>
                        <td className="px-4 py-2 font-mono text-xs font-semibold text-green-700">
                          {fmt(t.total_earnings)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Affiliates ──────────────────────────── */}
      {tab === "affiliates" && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <select
              value={affStatus}
              onChange={(e) => setAffStatus(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
            >
              <option value="">Semua Status</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
            <input
              type="text"
              value={affSearch}
              onChange={(e) => setAffSearch(e.target.value)}
              placeholder="Cari nama/email..."
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
            />
          </div>

          {/* Table */}
          {affiliates.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              Tidak ada data afiliasi
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead className="border-b bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Pengguna</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Saldo Tersedia</th>
                    <th className="px-4 py-3">Saldo Terkunci</th>
                    <th className="px-4 py-3">Total</th>
                    <th className="px-4 py-3">Payout</th>
                    <th className="px-4 py-3">Terdaftar</th>
                    <th className="px-4 py-3">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {affiliates.map((a) => (
                    <tr
                      key={a.id}
                      className={`hover:bg-gray-50 ${a.is_blocked ? "bg-red-50/40" : ""}`}
                    >
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-800">
                            {a.user_name || "—"}
                            {a.is_blocked && (
                              <span className="ml-1.5 inline-block rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-700">
                                BLOCKED
                              </span>
                            )}
                            {a.is_suspicious && (
                              <span className="ml-1.5 inline-block rounded bg-orange-100 px-1.5 py-0.5 text-[10px] font-bold text-orange-700">
                                SUSPICIOUS
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-gray-400">
                            {a.user_email || "—"}
                          </p>
                          {a.referral_code && (
                            <p className="font-mono text-[10px] text-gray-400">
                              {a.referral_code}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusColor(a.status)}`}
                        >
                          {a.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-green-700">
                        {fmt(a.available_balance ?? 0)}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-orange-600">
                        {fmt(a.locked_balance ?? 0)}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {fmt(a.total_earnings)}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {a.payout_method || "—"}
                        {a.provider_name && (
                          <span className="ml-1 text-gray-400">
                            ({a.provider_name})
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {new Date(a.created_at).toLocaleDateString("id-ID")}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {/* Status actions */}
                          {a.status === "PENDING" && (
                            <>
                              <ActionBtn
                                color="green"
                                onClick={() =>
                                  handleUpdateStatus(a.id, "APPROVED")
                                }
                              >
                                Setujui
                              </ActionBtn>
                              <ActionBtn
                                color="red"
                                onClick={() =>
                                  handleUpdateStatus(a.id, "REJECTED")
                                }
                              >
                                Tolak
                              </ActionBtn>
                            </>
                          )}
                          {a.status === "APPROVED" && !a.is_blocked && (
                            <ActionBtn
                              color="gray"
                              onClick={() =>
                                handleUpdateStatus(a.id, "SUSPENDED")
                              }
                            >
                              Tangguhkan
                            </ActionBtn>
                          )}
                          {(a.status === "REJECTED" ||
                            a.status === "SUSPENDED") && (
                            <ActionBtn
                              color="green"
                              onClick={() =>
                                handleUpdateStatus(a.id, "APPROVED")
                              }
                            >
                              Aktifkan
                            </ActionBtn>
                          )}

                          {/* Block / Unblock */}
                          {a.is_blocked ? (
                            <ActionBtn
                              color="teal"
                              onClick={() => handleUnblock(a.id)}
                            >
                              Unblock
                            </ActionBtn>
                          ) : (
                            <ActionBtn
                              color="red"
                              onClick={() =>
                                setBlockModal({
                                  id: a.id,
                                  name: a.user_name || a.user_email || a.id,
                                })
                              }
                            >
                              Block
                            </ActionBtn>
                          )}

                          {/* Suspicious flag */}
                          <ActionBtn
                            color={a.is_suspicious ? "orange" : "yellow"}
                            onClick={() =>
                              handleFlagSuspicious(a.id, !a.is_suspicious)
                            }
                          >
                            {a.is_suspicious ? "Unflag" : "Flag"}
                          </ActionBtn>

                          {/* Balance adjust */}
                          <ActionBtn
                            color="indigo"
                            onClick={() =>
                              setAdjustModal({
                                id: a.id,
                                name: a.user_name || a.user_email || a.id,
                              })
                            }
                          >
                            Saldo
                          </ActionBtn>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <Pagination
            page={affPage}
            total={affTotal}
            onPrev={() => loadAffiliates(affPage - 1, affStatus, affSearch)}
            onNext={() => loadAffiliates(affPage + 1, affStatus, affSearch)}
          />
        </div>
      )}

      {/* ── Payouts ─────────────────────────────── */}
      {tab === "payouts" && (
        <div className="space-y-4">
          <div>
            <select
              value={payStatus}
              onChange={(e) => setPayStatus(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
            >
              <option value="">Semua Status</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="PAID">Paid</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          {payouts.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              Tidak ada permintaan pencairan
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead className="border-b bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Pengguna</th>
                    <th className="px-4 py-3">Jumlah</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Catatan</th>
                    <th className="px-4 py-3">Referensi</th>
                    <th className="px-4 py-3">Tanggal</th>
                    <th className="px-4 py-3">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {payouts.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-800">
                            {p.user_name || "—"}
                          </p>
                          <p className="text-xs text-gray-400">
                            {p.user_email || "—"}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-semibold">
                        {fmt(p.amount)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusColor(p.status)}`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="max-w-[160px] truncate px-4 py-3 text-xs text-gray-500">
                        {p.note || p.admin_note || "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {p.payment_reference || "—"}
                        {p.proof_url && (
                          <a
                            href={p.proof_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-1 text-indigo-600 underline"
                          >
                            Bukti
                          </a>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {new Date(
                          p.requested_at || p.created_at,
                        ).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {p.status === "PENDING" && (
                            <>
                              <ActionBtn
                                color="green"
                                onClick={() => handleApprovePayout(p.id)}
                              >
                                Setujui
                              </ActionBtn>
                              <ActionBtn
                                color="red"
                                onClick={() => {
                                  setRejectModal(p.id);
                                  setRejectNote("");
                                }}
                              >
                                Tolak
                              </ActionBtn>
                            </>
                          )}
                          {p.status === "APPROVED" && (
                            <ActionBtn
                              color="emerald"
                              onClick={() => {
                                setMarkPaidModal(p.id);
                                setPaidForm({
                                  payment_reference: "",
                                  proof_url: "",
                                });
                              }}
                            >
                              Tandai Dibayar
                            </ActionBtn>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <Pagination
            page={payPage}
            total={payTotal}
            onPrev={() => loadPayouts(payPage - 1, payStatus)}
            onNext={() => loadPayouts(payPage + 1, payStatus)}
          />
        </div>
      )}

      {/* ── Settings ────────────────────────────── */}
      {tab === "settings" && (
        <form
          onSubmit={handleSaveSettings}
          className="mx-auto max-w-2xl space-y-6"
        >
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-gray-800">
              Pengaturan Program Afiliasi
            </h3>

            <div className="space-y-4">
              {/* Enable Toggle */}
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-medium text-gray-700">Program Aktif</p>
                  <p className="text-xs text-gray-400">
                    Aktifkan/nonaktifkan program afiliasi
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setSettingsForm((f) => ({ ...f, enabled: !f.enabled }))
                  }
                  className={`relative h-6 w-11 rounded-full transition ${
                    settingsForm.enabled ? "bg-indigo-600" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                      settingsForm.enabled ? "translate-x-5" : ""
                    }`}
                  />
                </button>
              </div>

              {/* Commission Type */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Tipe Komisi
                </label>
                <select
                  value={settingsForm.commission_type}
                  onChange={(e) =>
                    setSettingsForm((f) => ({
                      ...f,
                      commission_type: e.target.value as any,
                    }))
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                >
                  <option value="PERCENTAGE">Persentase (%)</option>
                  <option value="FIXED">Nominal Tetap (IDR)</option>
                  <option value="FIXED_PER_VERIFIED_REFERRAL">
                    Tetap per Referral Terverifikasi
                  </option>
                </select>
              </div>

              {/* Commission Value */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Nilai Komisi{" "}
                  {settingsForm.commission_type === "PERCENTAGE"
                    ? "(%)"
                    : "(IDR)"}
                </label>
                <input
                  type="number"
                  value={settingsForm.commission_value}
                  onChange={(e) =>
                    setSettingsForm((f) => ({
                      ...f,
                      commission_value: parseFloat(e.target.value) || 0,
                    }))
                  }
                  min={0}
                  step={
                    settingsForm.commission_type === "PERCENTAGE"
                      ? "0.1"
                      : "1000"
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {/* Cookie Days */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Cookie Duration (hari)
                  </label>
                  <input
                    type="number"
                    value={settingsForm.cookie_days}
                    onChange={(e) =>
                      setSettingsForm((f) => ({
                        ...f,
                        cookie_days: parseInt(e.target.value) || 30,
                      }))
                    }
                    min={1}
                    max={365}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                  />
                </div>

                {/* Referral Hold Days */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Masa Hold Komisi (hari)
                  </label>
                  <input
                    type="number"
                    value={settingsForm.referral_hold_days}
                    onChange={(e) =>
                      setSettingsForm((f) => ({
                        ...f,
                        referral_hold_days: parseInt(e.target.value) || 7,
                      }))
                    }
                    min={0}
                    max={90}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                  />
                  <p className="mt-1 text-xs text-gray-400">
                    0 = tanpa hold, komisi langsung tersedia
                  </p>
                </div>
              </div>

              {/* Payout Minimum */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Minimum Pencairan (IDR)
                </label>
                <input
                  type="number"
                  value={settingsForm.payout_minimum}
                  onChange={(e) =>
                    setSettingsForm((f) => ({
                      ...f,
                      payout_minimum: parseFloat(e.target.value) || 0,
                    }))
                  }
                  min={0}
                  step="1000"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                />
              </div>

              {/* Payout Schedule */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Jadwal Pencairan
                </label>
                <select
                  value={settingsForm.payout_schedule}
                  onChange={(e) =>
                    setSettingsForm((f) => ({
                      ...f,
                      payout_schedule: e.target.value as any,
                    }))
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                >
                  <option value="WEEKLY">Mingguan</option>
                  <option value="BIWEEKLY">2 Minggu Sekali</option>
                  <option value="MONTHLY">Bulanan</option>
                  <option value="MANUAL">Manual (Admin)</option>
                </select>
              </div>

              {/* Terms (legacy) */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Syarat & Ketentuan (teks)
                </label>
                <textarea
                  value={settingsForm.terms_text}
                  onChange={(e) =>
                    setSettingsForm((f) => ({
                      ...f,
                      terms_text: e.target.value,
                    }))
                  }
                  rows={4}
                  placeholder="Syarat dan ketentuan program afiliasi..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                />
              </div>

              {/* How It Works (Markdown) */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Cara Kerja (Markdown)
                </label>
                <textarea
                  value={settingsForm.how_it_works_md}
                  onChange={(e) =>
                    setSettingsForm((f) => ({
                      ...f,
                      how_it_works_md: e.target.value,
                    }))
                  }
                  rows={5}
                  placeholder="## Cara Kerja&#10;1. Daftar program afiliasi..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                />
              </div>

              {/* Terms Markdown */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Syarat & Ketentuan (Markdown)
                </label>
                <textarea
                  value={settingsForm.terms_md}
                  onChange={(e) =>
                    setSettingsForm((f) => ({
                      ...f,
                      terms_md: e.target.value,
                    }))
                  }
                  rows={5}
                  placeholder="## Syarat & Ketentuan&#10;..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                />
              </div>

              {/* Payout Rules Markdown */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Aturan Pencairan (Markdown)
                </label>
                <textarea
                  value={settingsForm.payout_rules_md}
                  onChange={(e) =>
                    setSettingsForm((f) => ({
                      ...f,
                      payout_rules_md: e.target.value,
                    }))
                  }
                  rows={5}
                  placeholder="## Aturan Pencairan&#10;..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="mt-6 w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? "Menyimpan..." : "Simpan Pengaturan"}
            </button>
          </div>
        </form>
      )}

      {/* ── Block Modal ─────────────────────────── */}
      {blockModal && (
        <Modal
          title={`Blokir: ${blockModal.name}`}
          onClose={() => {
            setBlockModal(null);
            setBlockReason("");
          }}
        >
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Alasan Blokir *
          </label>
          <textarea
            value={blockReason}
            onChange={(e) => setBlockReason(e.target.value)}
            rows={3}
            placeholder="Jelaskan alasan blokir..."
            className="mb-4 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setBlockModal(null);
                setBlockReason("");
              }}
              className="rounded-lg border px-3 py-2 text-sm"
            >
              Batal
            </button>
            <button
              onClick={handleBlock}
              disabled={!blockReason.trim() || actionLoading}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            >
              {actionLoading ? "Memproses..." : "Blokir"}
            </button>
          </div>
        </Modal>
      )}

      {/* ── Adjust Balance Modal ────────────────── */}
      {adjustModal && (
        <Modal
          title={`Sesuaikan Saldo: ${adjustModal.name}`}
          onClose={() => {
            setAdjustModal(null);
            setAdjustForm({
              amount: 0,
              balance_type: "available",
              reason: "",
            });
          }}
        >
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Jumlah (negatif untuk pengurangan)
              </label>
              <input
                type="number"
                value={adjustForm.amount}
                onChange={(e) =>
                  setAdjustForm((f) => ({
                    ...f,
                    amount: parseFloat(e.target.value) || 0,
                  }))
                }
                step="1000"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Tipe Saldo
              </label>
              <select
                value={adjustForm.balance_type}
                onChange={(e) =>
                  setAdjustForm((f) => ({
                    ...f,
                    balance_type: e.target.value as "available" | "locked",
                  }))
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
              >
                <option value="available">Saldo Tersedia</option>
                <option value="locked">Saldo Terkunci</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Alasan *
              </label>
              <textarea
                value={adjustForm.reason}
                onChange={(e) =>
                  setAdjustForm((f) => ({ ...f, reason: e.target.value }))
                }
                rows={2}
                placeholder="Jelaskan alasan penyesuaian..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={() => {
                setAdjustModal(null);
                setAdjustForm({
                  amount: 0,
                  balance_type: "available",
                  reason: "",
                });
              }}
              className="rounded-lg border px-3 py-2 text-sm"
            >
              Batal
            </button>
            <button
              onClick={handleAdjustBalance}
              disabled={
                adjustForm.amount === 0 ||
                !adjustForm.reason.trim() ||
                actionLoading
              }
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {actionLoading ? "Memproses..." : "Sesuaikan"}
            </button>
          </div>
        </Modal>
      )}

      {/* ── Reject Payout Modal ─────────────────── */}
      {rejectModal && (
        <Modal
          title="Tolak Pencairan"
          onClose={() => {
            setRejectModal(null);
            setRejectNote("");
          }}
        >
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Alasan Penolakan *
          </label>
          <textarea
            value={rejectNote}
            onChange={(e) => setRejectNote(e.target.value)}
            rows={3}
            placeholder="Jelaskan alasan penolakan..."
            className="mb-4 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setRejectModal(null);
                setRejectNote("");
              }}
              className="rounded-lg border px-3 py-2 text-sm"
            >
              Batal
            </button>
            <button
              onClick={handleRejectPayout}
              disabled={!rejectNote.trim() || actionLoading}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            >
              {actionLoading ? "Memproses..." : "Tolak"}
            </button>
          </div>
        </Modal>
      )}

      {/* ── Mark Paid Modal ─────────────────────── */}
      {markPaidModal && (
        <Modal
          title="Tandai Dibayar"
          onClose={() => {
            setMarkPaidModal(null);
            setPaidForm({ payment_reference: "", proof_url: "" });
          }}
        >
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Referensi Pembayaran
              </label>
              <input
                type="text"
                value={paidForm.payment_reference}
                onChange={(e) =>
                  setPaidForm((f) => ({
                    ...f,
                    payment_reference: e.target.value,
                  }))
                }
                placeholder="No. transfer / trx ID..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                URL Bukti Transfer
              </label>
              <input
                type="url"
                value={paidForm.proof_url}
                onChange={(e) =>
                  setPaidForm((f) => ({ ...f, proof_url: e.target.value }))
                }
                placeholder="https://..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={() => {
                setMarkPaidModal(null);
                setPaidForm({ payment_reference: "", proof_url: "" });
              }}
              className="rounded-lg border px-3 py-2 text-sm"
            >
              Batal
            </button>
            <button
              onClick={handleMarkPaid}
              disabled={actionLoading}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {actionLoading ? "Memproses..." : "Tandai Dibayar"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ────────────────────── sub-components ─────────────────────── */

function OverviewCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  const colors: Record<string, string> = {
    indigo: "border-indigo-200 bg-indigo-50 text-indigo-700",
    green: "border-green-200 bg-green-50 text-green-700",
    yellow: "border-yellow-200 bg-yellow-50 text-yellow-700",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    purple: "border-purple-200 bg-purple-50 text-purple-700",
    red: "border-red-200 bg-red-50 text-red-700",
    teal: "border-teal-200 bg-teal-50 text-teal-700",
    orange: "border-orange-200 bg-orange-50 text-orange-700",
  };
  return (
    <div className={`rounded-xl border p-4 ${colors[color] || colors.indigo}`}>
      <p className="text-xs font-medium opacity-70">{label}</p>
      <p className="mt-1 text-xl font-bold">{value}</p>
    </div>
  );
}

function Pagination({
  page,
  total,
  onPrev,
  onNext,
}: {
  page: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  if (total <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2">
      <button
        onClick={onPrev}
        disabled={page <= 1}
        className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40"
      >
        &larr; Prev
      </button>
      <span className="text-sm text-gray-500">
        {page} / {total}
      </span>
      <button
        onClick={onNext}
        disabled={page >= total}
        className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40"
      >
        Next &rarr;
      </button>
    </div>
  );
}

function ActionBtn({
  color,
  onClick,
  children,
}: {
  color: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const palette: Record<string, string> = {
    green: "bg-green-100 text-green-700 hover:bg-green-200",
    red: "bg-red-100 text-red-700 hover:bg-red-200",
    gray: "bg-gray-100 text-gray-600 hover:bg-gray-200",
    blue: "bg-blue-100 text-blue-700 hover:bg-blue-200",
    indigo: "bg-indigo-100 text-indigo-700 hover:bg-indigo-200",
    emerald: "bg-emerald-100 text-emerald-700 hover:bg-emerald-200",
    yellow: "bg-yellow-100 text-yellow-700 hover:bg-yellow-200",
    orange: "bg-orange-100 text-orange-700 hover:bg-orange-200",
    teal: "bg-teal-100 text-teal-700 hover:bg-teal-200",
  };
  return (
    <button
      onClick={onClick}
      className={`rounded px-2 py-1 text-xs font-medium ${palette[color] || palette.gray}`}
    >
      {children}
    </button>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            &times;
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
