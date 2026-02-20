import { notFound } from "next/navigation";
import { getOrder } from "@/lib/api";
import { formatRupiah, formatDate, statusLabel, statusColor } from "@/lib/utils";
import type { Metadata } from "next";
import ReviewForm from "@/components/ReviewForm";

type Props = { params: Promise<{ orderNumber: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { orderNumber } = await params;
  return {
    title: `Order ${orderNumber} — NetPulse Studio`,
  };
}

export default async function OrderDetailPage({ params }: Props) {
  const { orderNumber } = await params;

  let order;
  try {
    order = await getOrder(orderNumber);
  } catch {
    notFound();
  }

  return (
    <main className="bg-gray-50 py-12">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        {/* Back */}
        <a href="/order/track" className="text-sm text-brand-600 hover:underline">
          ← Kembali ke pencarian
        </a>

        <div className="mt-6 rounded-xl bg-white p-6 shadow-sm">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="font-mono text-sm text-gray-400">{order.order_number}</span>
              <h1 className="mt-1 text-xl font-bold text-gray-900">
                {order.listing_title}
              </h1>
              {order.package_name && (
                <p className="text-sm text-gray-500">Paket: {order.package_name}</p>
              )}
            </div>
            <span className={`rounded-full px-4 py-1.5 text-sm font-semibold ${statusColor(order.status)}`}>
              {statusLabel(order.status)}
            </span>
          </div>

          {/* Info Grid */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-xs text-gray-400">Nama</p>
              <p className="mt-1 font-medium text-gray-900">{order.buyer_name}</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-xs text-gray-400">Kontak</p>
              <p className="mt-1 font-medium text-gray-900">
                {order.buyer_email || order.buyer_phone}
              </p>
            </div>
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-xs text-gray-400">Total</p>
              <p className="mt-1 font-bold text-brand-600">
                {formatRupiah(order.amount)}
              </p>
            </div>
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-xs text-gray-400">Tanggal Order</p>
              <p className="mt-1 font-medium text-gray-900">
                {formatDate(order.created_at)}
              </p>
            </div>
          </div>

          {/* Notes */}
          {order.buyer_notes && (
            <div className="mt-4 rounded-lg bg-yellow-50 p-4">
              <p className="text-xs font-medium text-yellow-700">Catatan:</p>
              <p className="mt-1 text-sm text-yellow-800">{order.buyer_notes}</p>
            </div>
          )}
        </div>

        {/* Payment Info */}
        {order.payment && (
          <div className="mt-6 rounded-xl bg-white p-6 shadow-sm">
            <h2 className="font-semibold text-gray-900">Pembayaran</h2>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Metode</span>
                <span className="font-medium">{order.payment.method_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Status</span>
                <span className={`font-medium ${order.payment.status === "PAID" ? "text-green-600" : "text-yellow-600"}`}>
                  {order.payment.status}
                </span>
              </div>
              {order.payment.expires_at && order.payment.status === "PENDING" && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Batas Pembayaran</span>
                  <span className="font-medium text-red-500">{formatDate(order.payment.expires_at)}</span>
                </div>
              )}
            </div>

            {/* Payment actions */}
            {order.payment.status === "PENDING" && (
              <div className="mt-4 space-y-3">
                {order.payment.payment_url && (
                  <a
                    href={order.payment.payment_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-xl bg-brand-600 py-3 text-center text-sm font-semibold text-white hover:bg-brand-700"
                  >
                    Bayar Sekarang →
                  </a>
                )}
                {order.payment.qr_url && (
                  <div className="text-center space-y-2">
                    <p className="text-xs text-gray-400">Scan QR:</p>
                    <img src={order.payment.qr_url} alt="QR" className="mx-auto h-48 w-48" />
                  </div>
                )}
                {order.payment.pay_code && (
                  <div className="rounded-lg bg-gray-50 p-3 text-center">
                    <p className="text-xs text-gray-400">Kode pembayaran:</p>
                    <p className="mt-1 font-mono text-lg font-bold">{order.payment.pay_code}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Download section */}
        {order.status === "COMPLETED" && order.download_url && (
          <div className="mt-6 rounded-xl bg-green-50 p-6 shadow-sm">
            <h2 className="font-semibold text-green-800">📦 Download File</h2>
            <p className="mt-2 text-sm text-green-700">
              Pesanan Anda sudah selesai. Silakan download file di bawah ini.
            </p>
            {order.download_count !== undefined && order.max_downloads !== undefined && (
              <p className="mt-1 text-xs text-green-600">
                Download: {order.download_count}/{order.max_downloads}
              </p>
            )}
            {order.download_expires_at && (
              <p className="mt-1 text-xs text-green-600">
                Berlaku sampai: {formatDate(order.download_expires_at)}
              </p>
            )}
            <a
              href={order.download_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block rounded-xl bg-green-600 px-6 py-3 text-sm font-semibold text-white hover:bg-green-700"
            >
              ⬇️ Download Sekarang
            </a>
          </div>
        )}

        {/* Deliverable (for services) */}
        {order.status === "COMPLETED" && order.deliverable_url && (
          <div className="mt-6 rounded-xl bg-brand-50 p-6 shadow-sm">
            <h2 className="font-semibold text-brand-800">🎉 Hasil Project</h2>
            {order.deliverable_notes && (
              <p className="mt-2 text-sm text-brand-700">{order.deliverable_notes}</p>
            )}
            <a
              href={order.deliverable_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700"
            >
              Lihat Hasil →
            </a>
          </div>
        )}

        {/* Review form — shown when order is completed and no review yet */}
        {order.status === "COMPLETED" && (
          <div className="mt-6">
            <ReviewForm orderNumber={order.order_number} listingId={order.listing_id} />
          </div>
        )}
      </div>
    </main>
  );
}
