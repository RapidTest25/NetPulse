import type { Metadata } from "next";
import { env } from "@/lib/env";

export const metadata: Metadata = {
  title: "Kebijakan Layanan & Privasi — NetPulse Studio",
  description: "Syarat, ketentuan layanan, dan kebijakan privasi NetPulse Studio.",
};

export default function KebijakanPage() {
  return (
    <main className="bg-gray-50 py-12">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
          Kebijakan Layanan & Privasi
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Terakhir diperbarui: Februari 2026
        </p>

        <div className="mt-8 space-y-8 rounded-xl bg-white p-6 shadow-sm">
          {/* Syarat Layanan */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900">1. Syarat & Ketentuan Layanan</h2>
            <div className="mt-4 space-y-3 text-sm text-gray-600 leading-relaxed">
              <p>
                Dengan memesan layanan di NetPulse Studio, Anda menyetujui syarat dan ketentuan berikut:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Semua pesanan bersifat final setelah pembayaran dikonfirmasi.</li>
                <li>Estimasi waktu pengerjaan dihitung sejak pembayaran dikonfirmasi dan brief lengkap diterima.</li>
                <li>Revisi gratis sesuai paket yang dipilih. Revisi di luar scope dikenakan biaya tambahan.</li>
                <li>Source code dan aset yang dihasilkan menjadi milik klien setelah pembayaran lunas (kecuali template/produk digital berlisensi).</li>
                <li>Produk digital (template, source code) dikirim otomatis setelah pembayaran — tidak dapat dikembalikan.</li>
                <li>NetPulse Studio berhak menolak pesanan yang melanggar hukum atau etika.</li>
              </ul>
            </div>
          </section>

          {/* Pembayaran */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900">2. Pembayaran</h2>
            <div className="mt-4 space-y-3 text-sm text-gray-600 leading-relaxed">
              <ul className="list-disc pl-5 space-y-2">
                <li>Pembayaran melalui payment gateway resmi (Tripay & Paydisini).</li>
                <li>Metode: QRIS, Transfer Bank, E-Wallet (Dana, GoPay, ShopeePay).</li>
                <li>Konfirmasi otomatis via webhook — tidak perlu konfirmasi manual.</li>
                <li>Batas pembayaran 24 jam. Order otomatis expired jika tidak dibayar.</li>
                <li>Biaya layanan payment gateway ditanggung pembeli.</li>
              </ul>
            </div>
          </section>

          {/* Refund */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900">3. Kebijakan Refund</h2>
            <div className="mt-4 space-y-3 text-sm text-gray-600 leading-relaxed">
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Jasa (Service):</strong> Refund hanya jika pengerjaan belum dimulai. Jika sudah in-progress, refund proporsional berdasarkan progress.</li>
                <li><strong>Produk Digital:</strong> Tidak ada refund setelah file terdownload.</li>
                <li><strong>Tugas Akademik:</strong> Refund jika pengerjaan belum dimulai. Setelah dimulai, tidak dapat di-refund.</li>
                <li>Proses refund 3-7 hari kerja.</li>
              </ul>
            </div>
          </section>

          {/* Privasi */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900">4. Kebijakan Privasi</h2>
            <div className="mt-4 space-y-3 text-sm text-gray-600 leading-relaxed">
              <p>Data yang kami kumpulkan saat checkout:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Nama, Email, No. Telepon:</strong> Untuk komunikasi dan pengiriman hasil.</li>
                <li><strong>Detail Pesanan:</strong> Untuk memproses order.</li>
              </ul>
              <p className="mt-3">Kami <strong>TIDAK</strong>:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Menyimpan data kartu kredit/debit (diproses oleh payment gateway).</li>
                <li>Membagikan data pribadi ke pihak ketiga tanpa persetujuan.</li>
                <li>Mengirim spam atau email marketing tanpa izin.</li>
                <li>Mewajibkan pembuatan akun — semua pembelian guest checkout.</li>
              </ul>
            </div>
          </section>

          {/* Kontak */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900">5. Kontak</h2>
            <div className="mt-4 text-sm text-gray-600 leading-relaxed">
              <p>
                Jika ada pertanyaan tentang kebijakan ini, hubungi kami melalui:
              </p>
              <ul className="mt-3 space-y-2">
                <li>
                  💬 WhatsApp:{" "}
                  <a
                    href={`https://wa.me/${env.waNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-600 hover:underline"
                  >
                    {env.waNumber}
                  </a>
                </li>
                <li>📧 Email: studio@netpulse.com</li>
              </ul>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
