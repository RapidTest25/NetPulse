import type { StoreFAQContent } from "@/types";

const defaults: StoreFAQContent = {
  icon: "❓",
  title: "Pertanyaan yang Sering Ditanya",
  items: [
    { q: "Bagaimana cara memesan?", a: "Pilih layanan yang kamu butuhkan, klik 'Order Sekarang', isi form (tanpa perlu daftar akun), pilih metode pembayaran, dan bayar. Kami langsung mulai setelah pembayaran terkonfirmasi." },
    { q: "Berapa lama pengerjaan?", a: "Tergantung jenis layanan. Landing page 3-5 hari, website fullstack 7-14 hari. Produk digital langsung dikirim otomatis setelah bayar." },
    { q: "Apakah ada garansi revisi?", a: "Ya! Setiap order mendapat garansi revisi gratis sesuai paket yang dipilih. Kami memastikan kamu puas dengan hasilnya." },
    { q: "Metode pembayaran apa saja?", a: "Kami menerima QRIS, transfer bank (BCA, BNI, BRI, Mandiri, BSI), serta e-wallet (Dana, GoPay, ShopeePay)." },
    { q: "Bagaimana cara cek status pesanan?", a: 'Klik "Cek Pesanan" di menu, lalu masukkan nomor order, email, atau nomor telepon yang kamu gunakan saat checkout.' },
    { q: "Apakah perlu membuat akun?", a: "Tidak perlu! Semua pemesanan dilakukan sebagai guest. Cukup masukkan nama dan email/telepon saat checkout." },
  ],
};

export default function FAQSection({ content }: { content?: StoreFAQContent }) {
  const d = content ?? defaults;

  return (
    <section id="faq" className="bg-gray-50 py-16 sm:py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="text-center">
          <span className="text-4xl">{d.icon}</span>
          <h2 className="mt-3 text-2xl font-extrabold text-gray-900 sm:text-3xl">
            {d.title}
          </h2>
        </div>

        <div className="mt-10 space-y-3">
          {d.items.map((faq, i) => (
            <details
              key={i}
              className="group rounded-2xl border border-gray-100 bg-white shadow-sm"
            >
              <summary className="flex cursor-pointer items-center justify-between px-5 py-4 text-left font-medium text-gray-900 marker:content-none [&::-webkit-details-marker]:hidden">
                <span>{faq.q}</span>
                <svg
                  className="ml-3 h-5 w-5 shrink-0 text-brand-500 transition-transform duration-200 group-open:rotate-180"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </summary>
              <div className="border-t border-gray-50 px-5 pb-4 pt-3 text-sm leading-relaxed text-gray-600">
                {faq.a}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
