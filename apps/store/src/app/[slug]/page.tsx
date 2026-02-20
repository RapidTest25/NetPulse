import { notFound } from "next/navigation";
import { getListing, getPaymentMethods, getReviews } from "@/lib/api";
import { formatRupiah } from "@/lib/utils";
import type { Metadata } from "next";
import OrderForm from "@/components/OrderForm";
import type { Listing, Package, FAQ, Review, PaymentMethod } from "@/types";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const listing = await getListing(slug);
    return {
      title: listing.meta_title || `${listing.title} — NetPulse Studio`,
      description: listing.meta_desc || listing.short_desc,
    };
  } catch {
    return { title: "Layanan — NetPulse Studio" };
  }
}

export default async function ListingDetailPage({ params }: Props) {
  const { slug } = await params;

  let listing: Listing;
  try {
    listing = await getListing(slug);
  } catch {
    notFound();
  }

  let methods: PaymentMethod[] = [];
  let reviews: Review[] = [];
  try {
    const [m, r] = await Promise.all([
      getPaymentMethods(),
      getReviews({ listing_id: listing.id, limit: 10 }),
    ]);
    methods = m.items ?? [];
    reviews = r.items?.filter((rv) => rv.is_visible) ?? [];
  } catch {
    // non-critical
  }

  const typeLabel = listing.listing_type === "SERVICE" ? "Jasa" : listing.listing_type === "DIGITAL_PRODUCT" ? "Produk Digital" : "Akademik";

  return (
    <main className="bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm text-gray-400">
          <a href="/" className="hover:text-brand-600">Beranda</a>
          <span className="mx-2">/</span>
          <span className="text-gray-700">{listing.title}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* LEFT — Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Cover */}
            {listing.cover_url && (
              <div className="overflow-hidden rounded-xl">
                <img src={listing.cover_url} alt={listing.title} className="w-full object-cover" />
              </div>
            )}

            {/* Header */}
            <div>
              <span className="inline-block rounded bg-brand-100 px-2.5 py-1 text-xs font-semibold text-brand-700">
                {typeLabel}
              </span>
              <h1 className="mt-3 text-2xl font-bold text-gray-900 sm:text-3xl">
                {listing.title}
              </h1>
              <p className="mt-2 text-gray-600">{listing.short_desc}</p>

              {/* Rating */}
              {listing.avg_rating > 0 && (
                <div className="mt-3 flex items-center gap-2 text-sm">
                  <span className="text-yellow-500">★</span>
                  <span className="font-semibold">{listing.avg_rating.toFixed(1)}</span>
                  <span className="text-gray-400">({listing.review_count} ulasan)</span>
                  <span className="text-gray-300">·</span>
                  <span className="text-gray-400">{listing.total_orders} order</span>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">Deskripsi</h2>
              <div
                className="prose prose-sm mt-4 max-w-none text-gray-600"
                dangerouslySetInnerHTML={{ __html: listing.description }}
              />
            </div>

            {/* Features & Tech Stack */}
            {((listing.features && listing.features.length > 0) || (listing.tech_stack && listing.tech_stack.length > 0)) && (
              <div className="grid gap-6 sm:grid-cols-2">
                {listing.features && listing.features.length > 0 && (
                  <div className="rounded-xl bg-white p-6 shadow-sm">
                    <h3 className="font-semibold text-gray-900">Fitur</h3>
                    <ul className="mt-3 space-y-2">
                      {listing.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                          <span className="mt-0.5 text-brand-500">✓</span>{f}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {listing.tech_stack && listing.tech_stack.length > 0 && (
                  <div className="rounded-xl bg-white p-6 shadow-sm">
                    <h3 className="font-semibold text-gray-900">Tech Stack</h3>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {listing.tech_stack.map((t) => (
                        <span key={t} className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">{t}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* FAQ */}
            {listing.faq && listing.faq.length > 0 && (
              <div className="rounded-xl bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900">FAQ</h2>
                <div className="mt-4 space-y-4">
                  {listing.faq.map((f) => (
                    <div key={f.id}>
                      <h4 className="font-medium text-gray-900">{f.question}</h4>
                      <p className="mt-1 text-sm text-gray-600">{f.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews */}
            {reviews.length > 0 && (
              <div className="rounded-xl bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900">Ulasan</h2>
                <div className="mt-4 space-y-4">
                  {reviews.map((r) => (
                    <div key={r.id} className="border-b border-gray-50 pb-4 last:border-0">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-600">
                          {r.reviewer_name?.charAt(0)?.toUpperCase()}
                        </div>
                        <span className="text-sm font-medium">{r.reviewer_name}</span>
                        <span className="text-yellow-400 text-xs">
                          {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-gray-600">{r.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT — Sidebar */}
          <div className="space-y-6">
            {/* Packages */}
            <div className="sticky top-20 space-y-4">
              {listing.packages && listing.packages.length > 0 ? (
                listing.packages.map((pkg) => (
                  <div key={pkg.id} className="rounded-xl bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">{pkg.name}</h3>
                      <span className="text-lg font-bold text-brand-600">
                        {formatRupiah(pkg.price)}
                      </span>
                    </div>
                    {pkg.description && (
                      <p className="mt-2 text-sm text-gray-500">{pkg.description}</p>
                    )}
                    {pkg.features && pkg.features.length > 0 && (
                      <ul className="mt-3 space-y-1.5">
                        {pkg.features.map((f) => (
                          <li key={f} className="flex items-start gap-2 text-xs text-gray-600">
                            <span className="text-brand-500">✓</span>{f}
                          </li>
                        ))}
                      </ul>
                    )}
                    {pkg.estimated_days && (
                      <p className="mt-3 text-xs text-gray-400">
                        ⏱️ Estimasi {pkg.estimated_days} hari
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <div className="rounded-xl bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">Harga</h3>
                    <span className="text-lg font-bold text-brand-600">
                      {formatRupiah(listing.base_price)}
                    </span>
                  </div>
                  {listing.estimated_days && (
                    <p className="mt-2 text-xs text-gray-400">
                      ⏱️ Estimasi {listing.estimated_days} hari
                    </p>
                  )}
                </div>
              )}

              {/* Order Form */}
              <OrderForm listing={listing} methods={methods} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
