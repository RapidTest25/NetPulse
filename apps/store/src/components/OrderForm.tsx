"use client";

import { useState } from "react";
import { createOrder } from "@/lib/api";
import { formatRupiah } from "@/lib/utils";
import { env } from "@/lib/env";
import type { Listing, PaymentMethod } from "@/types";

type Props = {
  listing: Listing;
  methods: PaymentMethod[];
};

export default function OrderForm({ listing, methods }: Props) {
  const [step, setStep] = useState<"form" | "loading" | "success">("form");
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [packageId, setPackageId] = useState(
    listing.packages?.[0]?.id ?? ""
  );
  const [paymentCode, setPaymentCode] = useState("");
  const [result, setResult] = useState<{
    order_number: string;
    payment_url?: string;
    qr_url?: string;
    pay_code?: string;
    total: number;
    expires_at?: string;
  } | null>(null);

  const selectedPkg = listing.packages?.find((p) => p.id === packageId);
  const price = selectedPkg?.price ?? listing.base_price;

  const selectedMethod = methods.find((m) => m.code === paymentCode);
  const fee = selectedMethod
    ? selectedMethod.fee_flat + Math.round((price * selectedMethod.fee_percent) / 100)
    : 0;
  const total = price + fee;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim() || (!email.trim() && !phone.trim())) {
      setError("Nama dan email/nomor telepon wajib diisi.");
      return;
    }
    if (!paymentCode) {
      setError("Pilih metode pembayaran.");
      return;
    }

    setStep("loading");
    try {
      const res = await createOrder({
        listing_id: listing.id,
        package_id: packageId || undefined,
        buyer_name: name.trim(),
        buyer_email: email.trim(),
        buyer_phone: phone.trim(),
        notes: notes.trim(),
        payment_method: paymentCode,
      });

      setResult({
        order_number: res.order_number,
        payment_url: res.payment?.payment_url,
        qr_url: res.payment?.qr_url,
        pay_code: res.payment?.pay_code,
        total: res.total_amount,
        expires_at: res.payment?.expires_at,
      });
      setStep("success");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
      setStep("form");
    }
  }

  if (step === "success" && result) {
    return (
      <div className="rounded-xl bg-white p-6 shadow-sm text-center space-y-4">
        <div className="text-3xl">✅</div>
        <h3 className="text-lg font-bold text-gray-900">Order Berhasil!</h3>
        <p className="text-sm text-gray-500">
          Nomor order: <span className="font-mono font-bold text-brand-600">{result.order_number}</span>
        </p>
        <p className="text-sm text-gray-500">
          Total: <span className="font-semibold">{formatRupiah(result.total)}</span>
        </p>

        {result.payment_url && (
          <a
            href={result.payment_url}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Bayar Sekarang →
          </a>
        )}

        {result.qr_url && (
          <div className="space-y-2">
            <p className="text-xs text-gray-400">Scan QR untuk bayar:</p>
            <img src={result.qr_url} alt="QR Code" className="mx-auto h-48 w-48" />
          </div>
        )}

        {result.pay_code && (
          <div className="rounded bg-gray-50 p-3">
            <p className="text-xs text-gray-400">Kode pembayaran:</p>
            <p className="mt-1 font-mono text-lg font-bold text-gray-900">{result.pay_code}</p>
          </div>
        )}

        <a
          href={`/order/${result.order_number}`}
          className="block text-sm text-brand-600 hover:underline"
        >
          Cek Status Pesanan →
        </a>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl bg-white p-6 shadow-sm space-y-4"
    >
      <h3 className="text-lg font-bold text-gray-900">Order Sekarang</h3>

      {/* Package selector */}
      {listing.packages && listing.packages.length > 1 && (
        <div>
          <label className="text-sm font-medium text-gray-700">Pilih Paket</label>
          <select
            value={packageId}
            onChange={(e) => setPackageId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          >
            {listing.packages.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {formatRupiah(p.price)}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="text-sm font-medium text-gray-700">Nama *</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nama lengkap"
          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          required
        />
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@contoh.com"
          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700">No. WhatsApp</label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="08xxxxxxxxxx"
          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700">Catatan (opsional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Detail kebutuhan Anda..."
          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
        />
      </div>

      {/* Payment method */}
      <div>
        <label className="text-sm font-medium text-gray-700">Metode Pembayaran *</label>
        <div className="mt-2 space-y-2">
          {methods.filter((m) => m.is_active).map((m) => (
            <label
              key={m.code}
              className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm transition-colors ${
                paymentCode === m.code
                  ? "border-brand-500 bg-brand-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <input
                type="radio"
                name="payment"
                value={m.code}
                checked={paymentCode === m.code}
                onChange={(e) => setPaymentCode(e.target.value)}
                className="accent-brand-600"
              />
              {m.icon_url && (
                <img src={m.icon_url} alt={m.name} className="h-6 w-auto" />
              )}
              <span className="flex-1">{m.name}</span>
              {(m.fee_flat > 0 || m.fee_percent > 0) && (
                <span className="text-xs text-gray-400">
                  {m.fee_percent > 0 ? `${m.fee_percent}%` : ""}
                  {m.fee_flat > 0 ? ` + ${formatRupiah(m.fee_flat)}` : ""}
                </span>
              )}
            </label>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="rounded-lg bg-gray-50 p-4 space-y-1 text-sm">
        <div className="flex justify-between text-gray-600">
          <span>Harga</span>
          <span>{formatRupiah(price)}</span>
        </div>
        {fee > 0 && (
          <div className="flex justify-between text-gray-600">
            <span>Biaya pembayaran</span>
            <span>{formatRupiah(fee)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-gray-900 pt-1 border-t border-gray-200">
          <span>Total</span>
          <span className="text-brand-600">{formatRupiah(total)}</span>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <button
        type="submit"
        disabled={step === "loading"}
        className="w-full rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50 transition-colors"
      >
        {step === "loading" ? "Memproses..." : `Bayar ${formatRupiah(total)}`}
      </button>

      <p className="text-center text-xs text-gray-400">
        Butuh bantuan?{" "}
        <a
          href={`https://wa.me/${env.waNumber}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-green-600 hover:underline"
        >
          Chat WhatsApp
        </a>
      </p>
    </form>
  );
}
