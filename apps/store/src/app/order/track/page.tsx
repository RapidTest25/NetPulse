"use client";

import { useState } from "react";
import { trackOrder } from "@/lib/api";
import { formatRupiah, statusLabel, statusColor, formatDate } from "@/lib/utils";
import type { OrderSummary } from "@/types";

/* ── status step helpers ─────────────────────── */

const STATUS_STEPS = [
  { key: "PENDING_PAYMENT", label: "Menunggu Bayar", icon: "🕐" },
  { key: "PAID", label: "Dibayar", icon: "💳" },
  { key: "IN_PROGRESS", label: "Dikerjakan", icon: "⚙️" },
  { key: "COMPLETED", label: "Selesai", icon: "✅" },
];

const TERMINAL_STATUSES = ["EXPIRED", "CANCELLED", "REFUNDED"];

function getStepIndex(status: string): number {
  const idx = STATUS_STEPS.findIndex((s) => s.key === status);
  return idx >= 0 ? idx : -1;
}

function StepTimeline({ status }: { status: string }) {
  if (TERMINAL_STATUSES.includes(status)) {
    return (
      <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 p-3">
        <span className="text-lg">
          {status === "EXPIRED" ? "⏰" : status === "CANCELLED" ? "❌" : "↩️"}
        </span>
        <span className="text-sm font-medium text-red-700">{statusLabel(status)}</span>
      </div>
    );
  }

  const current = getStepIndex(status);

  return (
    <div className="mt-4 flex items-center gap-0">
      {STATUS_STEPS.map((step, i) => {
        const done = i <= current;
        const active = i === current;
        return (
          <div key={step.key} className="flex flex-1 items-center">
            <div className="flex flex-col items-center gap-1">
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm transition-all ${
                  active
                    ? "bg-brand-600 text-white shadow-md shadow-brand-200 ring-4 ring-brand-100"
                    : done
                    ? "bg-brand-600 text-white"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                {step.icon}
              </span>
              <span
                className={`text-[10px] font-medium leading-tight ${
                  done ? "text-brand-700" : "text-gray-400"
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < STATUS_STEPS.length - 1 && (
              <div
                className={`mx-1 h-0.5 flex-1 rounded-full transition-colors ${
                  i < current ? "bg-brand-500" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── method config ───────────────────────────── */

const METHODS = [
  {
    key: "trx" as const,
    label: "No. Order",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
    placeholder: "Contoh: NPS-20260201-XXXXX",
    hint: "Nomor order dikirim lewat email setelah checkout",
  },
  {
    key: "email" as const,
    label: "Email",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    placeholder: "email@contoh.com",
    hint: "Email yang digunakan saat order",
  },
  {
    key: "phone" as const,
    label: "No. Telepon",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
      </svg>
    ),
    placeholder: "08xxxxxxxxxx",
    hint: "Nomor HP yang digunakan saat order",
  },
];

/* ── main page ───────────────────────────────── */

export default function OrderTrackPage() {
  const [method, setMethod] = useState<"trx" | "email" | "phone">("trx");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [orders, setOrders] = useState<OrderSummary[] | null>(null);

  const activeMethod = METHODS.find((m) => m.key === method)!;

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    setOrders(null);

    try {
      const data = await trackOrder(method, query.trim());
      setOrders(data.orders ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Pesanan tidak ditemukan.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-gray-50 to-white py-12">
      {/* Decorative bg elements */}
      <div className="pointer-events-none absolute -top-32 left-1/2 h-64 w-[40rem] -translate-x-1/2 rounded-full bg-brand-100/40 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 top-60 h-40 w-40 rounded-full bg-brand-50 blur-2xl" />

      <div className="relative mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-100/60 text-3xl">
            📦
          </div>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            Lacak Pesanan Kamu
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-gray-500">
            Masukkan nomor order, email, atau nomor telepon untuk melihat status pesanan secara real-time.
          </p>
        </div>

        {/* Search Card */}
        <form
          onSubmit={handleSearch}
          className="mt-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-lg shadow-gray-100/50 sm:p-8"
        >
          {/* Method tabs */}
          <div className="flex gap-2 rounded-xl bg-gray-50 p-1.5">
            {METHODS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setMethod(tab.key);
                  setQuery("");
                  setOrders(null);
                  setError("");
                }}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                  method === tab.key
                    ? "bg-white text-brand-600 shadow-sm ring-1 ring-gray-200/60"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Search input */}
          <div className="relative mt-5">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type={method === "email" ? "email" : "text"}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={activeMethod.placeholder}
              className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-3.5 pl-11 pr-4 text-sm transition-all focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
              required
            />
          </div>
          <p className="mt-2 text-xs text-gray-400">{activeMethod.hint}</p>

          {/* Error */}
          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600">
              <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-3.5 text-sm font-semibold text-white shadow-md shadow-brand-200 transition-all hover:bg-brand-700 hover:shadow-lg hover:shadow-brand-200 disabled:opacity-50"
          >
            {loading ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Mencari...
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Lacak Pesanan
              </>
            )}
          </button>
        </form>

        {/* Results */}
        {orders !== null && (
          <div className="mt-8">
            {orders.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-2xl">
                  🔍
                </div>
                <p className="font-medium text-gray-700">Pesanan tidak ditemukan</p>
                <p className="mt-1 text-sm text-gray-400">
                  Pastikan data yang kamu masukkan sudah benar, atau coba metode pencarian lain.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm font-medium text-gray-500">
                  Ditemukan {orders.length} pesanan
                </p>
                {orders.map((order) => (
                  <a
                    key={order.order_number}
                    href={`/order/${order.order_number}`}
                    className="group block rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:border-brand-200 hover:shadow-md sm:p-6"
                  >
                    {/* Top row */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-brand-600">
                            {order.order_number}
                          </span>
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusColor(
                              order.status
                            )}`}
                          >
                            {statusLabel(order.status)}
                          </span>
                        </div>
                        <h3 className="mt-1.5 truncate text-base font-semibold text-gray-900">
                          {order.listing_title}
                        </h3>
                        {order.package_name && (
                          <p className="mt-0.5 text-sm text-gray-500">
                            Paket: {order.package_name}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-base font-bold text-gray-900">
                          {formatRupiah(order.total_amount)}
                        </p>
                        {order.created_at && (
                          <p className="mt-0.5 text-xs text-gray-400">
                            {formatDate(order.created_at)}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Step timeline */}
                    <StepTimeline status={order.status} />

                    {/* CTA */}
                    <div className="mt-4 flex items-center justify-end text-sm font-medium text-brand-600 opacity-0 transition-opacity group-hover:opacity-100">
                      Lihat Detail
                      <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Help note */}
        {orders === null && !loading && (
          <div className="mt-8 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900">
              💡 Tips Pencarian
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-500">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
                <span>
                  <strong className="text-gray-700">No. Order</strong> — cek di email konfirmasi setelah checkout (format: NPS-XXXXXXXX-XXXXX)
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
                <span>
                  <strong className="text-gray-700">Email</strong> — menampilkan semua pesanan terkait email tersebut
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
                <span>
                  <strong className="text-gray-700">No. Telepon</strong> — gunakan nomor yang sama saat checkout
                </span>
              </li>
            </ul>
          </div>
        )}
      </div>
    </main>
  );
}
