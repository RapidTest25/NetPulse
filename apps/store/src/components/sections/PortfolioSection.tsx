import { getPortfolio } from "@/lib/api";
import type { PortfolioItem } from "@/types";
import PortfolioGrid from "@/components/PortfolioGrid";

const dummyPortfolio: PortfolioItem[] = [
  {
    id: "port-1",
    title: "Website Company Profile — CV Maju Jaya",
    description: "Website company profile profesional dengan multi-halaman, animasi modern, dan kontak form.",
    preview_type: "IFRAME",
    preview_url: "https://example.com",
    desktop_screenshot: "",
    mobile_screenshot: "",
    client_name: "CV Maju Jaya",
    tech_stack: ["Next.js", "Tailwind CSS", "Framer Motion"],
    is_featured: true,
    sort_order: 1,
    is_active: true,
    created_at: "",
    updated_at: "",
  },
  {
    id: "port-2",
    title: "Landing Page Produk UMKM",
    description: "Landing page single-page untuk promosi produk UMKM dengan integrasi WhatsApp.",
    preview_type: "SCREENSHOT",
    preview_url: "",
    desktop_screenshot: "",
    mobile_screenshot: "",
    client_name: "Toko Barokah",
    tech_stack: ["React", "Tailwind CSS"],
    is_featured: true,
    sort_order: 2,
    is_active: true,
    created_at: "",
    updated_at: "",
  },
  {
    id: "port-3",
    title: "Sistem Informasi Perpustakaan",
    description: "Aplikasi web untuk manajemen buku, peminjaman, dan anggota perpustakaan kampus.",
    preview_type: "SCREENSHOT",
    preview_url: "",
    desktop_screenshot: "",
    mobile_screenshot: "",
    client_name: "Universitas ABC",
    tech_stack: ["Laravel", "MySQL", "Bootstrap"],
    is_featured: true,
    sort_order: 3,
    is_active: true,
    created_at: "",
    updated_at: "",
  },
  {
    id: "port-4",
    title: "E-Commerce Toko Sneakers",
    description: "Toko online lengkap dengan cart, payment gateway, tracking pesanan, dan dashboard admin.",
    preview_type: "IFRAME",
    preview_url: "https://example.com",
    desktop_screenshot: "",
    mobile_screenshot: "",
    client_name: "SneakersID",
    tech_stack: ["Next.js", "PostgreSQL", "Midtrans"],
    is_featured: true,
    sort_order: 4,
    is_active: true,
    created_at: "",
    updated_at: "",
  },
  {
    id: "port-5",
    title: "Dashboard Admin Panel",
    description: "Dashboard internal untuk monitoring data penjualan, CRUD produk, dan laporan.",
    preview_type: "SCREENSHOT",
    preview_url: "",
    desktop_screenshot: "",
    mobile_screenshot: "",
    client_name: "PT Teknologi Nusantara",
    tech_stack: ["React", "Chart.js", "Node.js"],
    is_featured: true,
    sort_order: 5,
    is_active: true,
    created_at: "",
    updated_at: "",
  },
  {
    id: "port-6",
    title: "Aplikasi Kasir (POS) Online",
    description: "Point of Sale dengan manajemen stok, struk cetak thermal, dan laporan harian.",
    preview_type: "IFRAME",
    preview_url: "https://example.com",
    desktop_screenshot: "",
    mobile_screenshot: "",
    client_name: "Warung Pak Budi",
    tech_stack: ["Vue.js", "Express", "MongoDB"],
    is_featured: true,
    sort_order: 6,
    is_active: true,
    created_at: "",
    updated_at: "",
  },
];

export default async function PortfolioSection() {
  let items: PortfolioItem[] = [];
  try {
    const data = await getPortfolio({ limit: 6 });
    items = data.items ?? [];
  } catch {
    // API unavailable — skip section
  }

  return (
    <section id="portfolio" className="bg-gray-50 py-16 sm:py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="text-center">
          <span className="text-4xl">🎨</span>
          <h2 className="mt-3 text-2xl font-extrabold text-gray-900 sm:text-3xl">
            Hasil Kerja Kami
          </h2>
          <p className="mt-3 text-gray-500">
            Beberapa project yang sudah selesai dan bisa kamu lihat langsung.
          </p>
        </div>

        {items.length === 0 ? (
          <div className="mt-10 rounded-2xl border-2 border-dashed border-gray-200 bg-white p-16 text-center">
            <span className="text-5xl">🚀</span>
            <p className="mt-4 text-gray-400">Portfolio segera hadir. Stay tuned!</p>
          </div>
        ) : (
          <PortfolioGrid items={items} />
        )}
      </div>
    </section>
  );
}
