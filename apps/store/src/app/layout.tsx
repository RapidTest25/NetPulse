import type { Metadata } from "next";
import "@/styles/globals.css";
import { env } from "@/lib/env";
import LiveChat from "@/components/LiveChat";

export const metadata: Metadata = {
  title: {
    default: "NetPulse Studio — Jasa Web, Produk Digital & Tugas Akademik",
    template: "%s | NetPulse Studio",
  },
  description:
    "NetPulse Studio: Jasa pembuatan website, template premium, source code & bantuan tugas akademik. Mulai Rp 150.000. Kualitas profesional, harga terjangkau.",
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: env.siteURL,
    siteName: "NetPulse Studio",
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-gray-50 text-gray-800 antialiased">
        {/* ── Header ─────────────────────────────── */}
        <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/90 backdrop-blur-md">
          <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
            <a href="/" className="flex items-center gap-2 font-bold text-brand-600">
              <span className="text-lg">⚡</span>
              <span className="text-base">NetPulse Studio</span>
            </a>

            <nav className="hidden items-center gap-5 text-sm font-medium text-gray-500 md:flex">
              <a href="#layanan" className="hover:text-brand-600 transition-colors">Layanan</a>
              <a href="#portfolio" className="hover:text-brand-600 transition-colors">Portfolio</a>
              <a href="#harga" className="hover:text-brand-600 transition-colors">Harga</a>
              <a href="#faq" className="hover:text-brand-600 transition-colors">FAQ</a>
              <a href="/order/track" className="hover:text-brand-600 transition-colors">Cek Pesanan</a>
            </nav>

            <a
              href="#layanan"
              className="rounded-lg bg-linear-to-r from-brand-700 to-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:shadow-md transition-all"
            >
              Pesan Sekarang
            </a>
          </div>
        </header>

        <main>{children}</main>

        {/* ── Footer ─────────────────────────────── */}
        <footer className="border-t border-gray-200 bg-gray-900 text-gray-400">
          <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
              {/* Brand */}
              <div className="sm:col-span-2 lg:col-span-1">
                <a href="/" className="flex items-center gap-2">
                  <span className="text-xl">⚡</span>
                  <span className="text-base font-bold text-white">NetPulse Studio</span>
                </a>
                <p className="mt-3 text-sm leading-relaxed">
                  Jasa pembuatan website, produk digital & bantuan tugas akademik.
                  Kualitas profesional, harga terjangkau.
                </p>
                <div className="mt-4 flex items-center gap-3">
                  <span className="flex items-center gap-1 text-xs">
                    <span className="text-yellow-400">★★★★★</span> 4.9/5
                  </span>
                  <span className="h-3 w-px bg-gray-700" />
                  <span className="text-xs">100+ project selesai</span>
                </div>
              </div>

              {/* Layanan */}
              <div>
                <h4 className="text-sm font-semibold text-white">Layanan</h4>
                <ul className="mt-3 space-y-2 text-sm">
                  <li><a href="#layanan" className="hover:text-white transition-colors">Landing Page</a></li>
                  <li><a href="#layanan" className="hover:text-white transition-colors">Website Fullstack</a></li>
                  <li><a href="#layanan" className="hover:text-white transition-colors">Template Premium</a></li>
                  <li><a href="#layanan" className="hover:text-white transition-colors">Source Code</a></li>
                  <li><a href="#layanan" className="hover:text-white transition-colors">Tugas Akademik</a></li>
                </ul>
              </div>

              {/* Link */}
              <div>
                <h4 className="text-sm font-semibold text-white">Navigasi</h4>
                <ul className="mt-3 space-y-2 text-sm">
                  <li><a href="#portfolio" className="hover:text-white transition-colors">Portfolio</a></li>
                  <li><a href="#harga" className="hover:text-white transition-colors">Harga</a></li>
                  <li><a href="#faq" className="hover:text-white transition-colors">FAQ</a></li>
                  <li><a href="/order/track" className="hover:text-white transition-colors">Cek Pesanan</a></li>
                  <li><a href="/kebijakan" className="hover:text-white transition-colors">Kebijakan & Syarat</a></li>
                </ul>
              </div>

              {/* Kontak */}
              <div>
                <h4 className="text-sm font-semibold text-white">Kontak</h4>
                <ul className="mt-3 space-y-2 text-sm">
                  <li>
                    <a
                      href={`https://wa.me/${env.waNumber}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-white transition-colors"
                    >
                      💬 WhatsApp
                    </a>
                  </li>
                  <li>
                    <a href={env.blogURL} className="hover:text-white transition-colors">
                      📰 Blog NetPulse
                    </a>
                  </li>
                </ul>

                <div className="mt-4 rounded-lg bg-gray-800 p-3">
                  <p className="text-xs font-semibold text-brand-400">Jam Operasional</p>
                  <p className="mt-1 text-xs">Senin - Sabtu: 09.00 - 21.00 WIB</p>
                  <p className="text-xs">Minggu: 10.00 - 18.00 WIB</p>
                </div>
              </div>
            </div>

            {/* Bottom bar */}
            <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-gray-800 pt-6 sm:flex-row">
              <p className="text-xs">
                &copy; {new Date().getFullYear()} NetPulse Studio. All rights reserved.
              </p>
              <div className="flex items-center gap-4 text-xs">
                <a href="/kebijakan" className="hover:text-white transition-colors">Syarat & Ketentuan</a>
                <span className="h-3 w-px bg-gray-700" />
                <a href="/kebijakan" className="hover:text-white transition-colors">Kebijakan Privasi</a>
              </div>
            </div>
          </div>
        </footer>

        {/* ── Live Chat ──────────────────────────── */}
        <LiveChat />
      </body>
    </html>
  );
}
