import { getListings } from "@/lib/api";
import { formatRupiah } from "@/lib/utils";
import type { Listing } from "@/types";

const dummyListings: Listing[] = [
  {
    id: "demo-1",
    title: "Landing Page Profesional",
    slug: "landing-page-profesional",
    description: "",
    short_desc:
      "Landing page modern & responsif untuk bisnis, produk, atau jasa kamu. SEO-ready dan fast loading.",
    cover_url: "",
    listing_type: "SERVICE",
    base_price: 150_000,
    meta_title: "",
    meta_desc: "",
    features: ["Responsive", "SEO", "Fast Loading"],
    tech_stack: ["Next.js", "Tailwind CSS"],
    estimated_days: 5,
    auto_delivery: false,
    is_featured: true,
    is_active: true,
    sort_order: 1,
    total_orders: 48,
    avg_rating: 4.9,
    review_count: 23,
    created_at: "",
    updated_at: "",
  },
  {
    id: "demo-2",
    title: "Website Company Profile",
    slug: "website-company-profile",
    description: "",
    short_desc:
      "Website multi-halaman dengan desain elegan untuk menampilkan profil perusahaan, tim, dan layanan.",
    cover_url: "",
    listing_type: "SERVICE",
    base_price: 500_000,
    meta_title: "",
    meta_desc: "",
    features: ["Multi-page", "Admin Panel", "Dynamic Content"],
    tech_stack: ["React", "Node.js", "PostgreSQL"],
    estimated_days: 10,
    auto_delivery: false,
    is_featured: true,
    is_active: true,
    sort_order: 2,
    total_orders: 32,
    avg_rating: 5.0,
    review_count: 15,
    created_at: "",
    updated_at: "",
  },
  {
    id: "demo-3",
    title: "Website E-Commerce Custom",
    slug: "website-ecommerce-custom",
    description: "",
    short_desc:
      "Toko online lengkap dengan keranjang belanja, payment gateway, dan dashboard admin.",
    cover_url: "",
    listing_type: "SERVICE",
    base_price: 800_000,
    meta_title: "",
    meta_desc: "",
    features: ["Cart", "Payment Gateway", "Admin Dashboard"],
    tech_stack: ["Next.js", "Stripe", "PostgreSQL"],
    estimated_days: 14,
    auto_delivery: false,
    is_featured: true,
    is_active: true,
    sort_order: 3,
    total_orders: 21,
    avg_rating: 4.8,
    review_count: 12,
    created_at: "",
    updated_at: "",
  },
  {
    id: "demo-4",
    title: "Template Dashboard Admin",
    slug: "template-dashboard-admin",
    description: "",
    short_desc:
      "Template dashboard admin siap pakai dengan chart, tabel data, CRUD, dan dark mode.",
    cover_url: "",
    listing_type: "DIGITAL_PRODUCT",
    base_price: 75_000,
    meta_title: "",
    meta_desc: "",
    features: ["Dark Mode", "Charts", "Responsive"],
    tech_stack: ["React", "Tailwind CSS", "Recharts"],
    estimated_days: 0,
    auto_delivery: true,
    is_featured: true,
    is_active: true,
    sort_order: 4,
    total_orders: 67,
    avg_rating: 4.7,
    review_count: 34,
    created_at: "",
    updated_at: "",
  },
  {
    id: "demo-5",
    title: "Source Code Sistem Kasir (POS)",
    slug: "source-code-sistem-kasir",
    description: "",
    short_desc:
      "Source code Point of Sale lengkap dengan manajemen stok, laporan, dan struk cetak.",
    cover_url: "",
    listing_type: "DIGITAL_PRODUCT",
    base_price: 200_000,
    meta_title: "",
    meta_desc: "",
    features: ["Stok", "Laporan", "Print Struk"],
    tech_stack: ["Laravel", "MySQL", "Bootstrap"],
    estimated_days: 0,
    auto_delivery: true,
    is_featured: true,
    is_active: true,
    sort_order: 5,
    total_orders: 43,
    avg_rating: 4.8,
    review_count: 19,
    created_at: "",
    updated_at: "",
  },
  {
    id: "demo-6",
    title: "Bantuan Tugas Pemrograman",
    slug: "bantuan-tugas-pemrograman",
    description: "",
    short_desc:
      "Bantuan pengerjaan tugas kuliah pemrograman: Java, Python, C++, PHP, dan lainnya.",
    cover_url: "",
    listing_type: "ACADEMIC",
    base_price: 50_000,
    meta_title: "",
    meta_desc: "",
    features: ["Multi-bahasa", "Penjelasan Kode", "Revisi"],
    tech_stack: ["Java", "Python", "C++", "PHP"],
    estimated_days: 3,
    auto_delivery: false,
    is_featured: true,
    is_active: true,
    sort_order: 6,
    total_orders: 89,
    avg_rating: 4.9,
    review_count: 45,
    created_at: "",
    updated_at: "",
  },
];

export default async function ListingSection() {
  let items: Listing[] = [];
  try {
    const data = await getListings({ sort: "popular", limit: 6 });
    items = data.items ?? [];
  } catch {
    // API unavailable — skip section
  }

  return (
    <section id="layanan" className="bg-gray-50 py-16 sm:py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="text-center">
          <span className="text-4xl">🛠️</span>
          <h2 className="mt-3 text-2xl font-extrabold text-gray-900 sm:text-3xl">
            Layanan Unggulan
          </h2>
          <p className="mt-3 text-gray-500">
            Pilih yang sesuai kebutuhan kamu. Semua include support & garansi.
          </p>
        </div>

        {items.length === 0 ? (
          <div className="mt-10 rounded-2xl border-2 border-dashed border-gray-200 bg-white p-16 text-center">
            <span className="text-5xl">🚀</span>
            <p className="mt-4 text-gray-400">Layanan segera hadir. Stay tuned!</p>
          </div>
        ) : (
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <a
                key={item.id}
                href={`/${item.slug}`}
                className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                {/* Cover */}
                <div className="relative aspect-video overflow-hidden bg-gray-100">
                  {item.cover_url ? (
                    <img
                      src={item.cover_url}
                      alt={item.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-5xl text-gray-200">
                      {item.listing_type === "SERVICE"
                        ? "🛠️"
                        : item.listing_type === "DIGITAL_PRODUCT"
                        ? "📦"
                        : "📚"}
                    </div>
                  )}
                  {/* Type badge */}
                  <span className="absolute left-3 top-3 rounded-md bg-brand-600 px-2.5 py-0.5 text-xs font-bold text-white shadow">
                    {item.listing_type === "SERVICE"
                      ? "Jasa"
                      : item.listing_type === "DIGITAL_PRODUCT"
                      ? "Produk Digital"
                      : "Akademik"}
                  </span>
                </div>

                {/* Content */}
                <div className="flex flex-1 flex-col p-4">
                  <h3 className="font-semibold text-gray-900 transition-colors group-hover:text-brand-600 line-clamp-2">
                    {item.title}
                  </h3>
                  <p className="mt-1.5 text-sm text-gray-500 line-clamp-2">
                    {item.short_desc}
                  </p>

                  {/* Rating & Orders */}
                  <div className="mt-3 flex items-center gap-3 text-xs text-gray-400">
                    {item.avg_rating > 0 && (
                      <span className="flex items-center gap-1">
                        <span className="text-yellow-500">★</span>
                        {item.avg_rating.toFixed(1)}
                        <span className="text-gray-300">
                          ({item.review_count})
                        </span>
                      </span>
                    )}
                    {item.total_orders > 0 && (
                      <span>{item.total_orders} order</span>
                    )}
                  </div>

                  {/* Price */}
                  <div className="mt-auto border-t border-gray-50 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">Mulai dari</span>
                      <span className="text-lg font-extrabold text-brand-600">
                        {formatRupiah(item.base_price)}
                      </span>
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
