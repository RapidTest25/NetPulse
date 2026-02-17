import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Syarat dan ketentuan penggunaan platform NetPulse — blog teknologi jaringan dan internet.",
};

const sections = [
  {
    title: "1. Penerimaan Ketentuan",
    content:
      "Dengan mengakses dan menggunakan NetPulse, Anda menyetujui untuk terikat oleh syarat dan ketentuan ini. Jika Anda tidak menyetujui salah satu bagian dari ketentuan ini, Anda tidak diperkenankan menggunakan layanan kami.",
  },
  {
    title: "2. Deskripsi Layanan",
    content:
      "NetPulse adalah platform blog yang menyediakan artikel, tutorial, dan konten edukasi seputar teknologi jaringan dan internet. Layanan ini mencakup akses ke konten publik, sistem komentar, dan fitur interaksi lainnya.",
  },
  {
    title: "3. Akun Pengguna",
    content:
      "Untuk mengakses beberapa fitur, Anda mungkin perlu membuat akun. Anda bertanggung jawab untuk menjaga kerahasiaan kredensial akun Anda dan semua aktivitas yang terjadi di bawah akun Anda. Segera laporkan penggunaan tidak sah ke tim kami.",
  },
  {
    title: "4. Konten Pengguna",
    content:
      "Dengan mengirimkan komentar atau kontribusi lainnya, Anda memberikan NetPulse lisensi non-eksklusif untuk menampilkan konten tersebut. Anda bertanggung jawab atas konten yang Anda kirimkan dan menjamin bahwa konten tersebut tidak melanggar hak cipta atau hukum yang berlaku.",
  },
  {
    title: "5. Hak Kekayaan Intelektual",
    content:
      "Seluruh konten original di NetPulse, termasuk artikel, desain, logo, dan kode sumber platform, dilindungi oleh hak cipta. Anda tidak diperkenankan menyalin, mendistribusikan, atau memodifikasi konten tanpa izin tertulis.",
  },
  {
    title: "6. Perilaku yang Dilarang",
    items: [
      "Menyebarkan spam, malware, atau konten berbahaya",
      "Melakukan scraping otomatis tanpa izin",
      "Menyalahgunakan sistem komentar atau fitur interaksi",
      "Mencoba mengakses area admin tanpa otorisasi",
      "Melanggar privasi pengguna lain",
    ],
  },
  {
    title: "7. Batasan Tanggung Jawab",
    content:
      'Konten di NetPulse disediakan "sebagaimana adanya" untuk tujuan edukasi. Kami berusaha menjaga akurasi informasi tetapi tidak menjamin bahwa semua konten bebas dari kesalahan. Penggunaan informasi dari platform ini sepenuhnya menjadi risiko Anda.',
  },
  {
    title: "8. Privasi",
    content:
      "Kami menghormati privasi Anda. Data yang kami kumpulkan digunakan hanya untuk meningkatkan layanan dan pengalaman pengguna. Kami tidak menjual data pribadi kepada pihak ketiga. Untuk informasi lebih lanjut, lihat Kebijakan Privasi kami.",
  },
  {
    title: "9. Perubahan Ketentuan",
    content:
      "Kami berhak mengubah syarat dan ketentuan ini kapan saja. Perubahan akan berlaku efektif segera setelah dipublikasikan di halaman ini. Penggunaan berkelanjutan atas layanan kami setelah perubahan dianggap sebagai penerimaan Anda.",
  },
  {
    title: "10. Hukum yang Berlaku",
    content:
      "Ketentuan ini diatur dan ditafsirkan sesuai dengan hukum Republik Indonesia. Setiap sengketa yang timbul akan diselesaikan melalui mekanisme penyelesaian sengketa yang berlaku.",
  },
];

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-gray-100 bg-linear-to-b from-gray-50 to-white">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,.03)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,.03)_1px,transparent_1px)] bg-size-[48px_48px]" />
        <div className="relative mx-auto max-w-4xl px-4 pb-12 pt-16 text-center sm:px-6 sm:pt-20 lg:px-8">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-brand-100/60 px-3 py-1 text-xs font-semibold text-brand-700">
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
              />
            </svg>
            Legal
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            Syarat & Ketentuan
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-gray-500">
            Terakhir diperbarui: 15 Februari 2026
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="space-y-10">
            {sections.map((section, i) => (
              <div key={i} className="group">
                <h2 className="mb-3 text-lg font-bold text-gray-900">
                  {section.title}
                </h2>
                {section.content && (
                  <p className="text-sm leading-relaxed text-gray-600">
                    {section.content}
                  </p>
                )}
                {section.items && (
                  <ul className="mt-2 space-y-2">
                    {section.items.map((item, j) => (
                      <li
                        key={j}
                        className="flex items-start gap-2.5 text-sm text-gray-600"
                      >
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>

          {/* Contact */}
          <div className="mt-16 rounded-2xl border border-gray-200 bg-gray-50/50 p-6 text-center">
            <h3 className="text-base font-bold text-gray-900">
              Ada Pertanyaan?
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Jika Anda memiliki pertanyaan tentang syarat dan ketentuan ini,
              silakan hubungi kami melalui halaman{" "}
              <a
                href="/about"
                className="font-semibold text-brand-600 hover:text-brand-700"
              >
                About
              </a>
              .
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
