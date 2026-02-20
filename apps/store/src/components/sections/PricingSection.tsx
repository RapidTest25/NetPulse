import { formatRupiah } from "@/lib/utils";
import type { StorePricingContent } from "@/types";

const defaults: StorePricingContent = {
  icon: "💰",
  title: "Harga Transparan, Tanpa Ribet",
  subtitle: "Bayar sesuai kebutuhan. Gak ada biaya tersembunyi.",
  plans: [
    { name: "Landing Page", price: 150_000, original_price: 500_000, discount: 70, features: ["1 Halaman full responsif", "Desain modern & clean", "SEO on-page dasar", "Form kontak / WhatsApp CTA", "Hosting setup gratis", "Revisi 2x"], bonuses: ["Free konsultasi desain", "Optimasi PageSpeed"], cta: "Order Sekarang", popular: false },
    { name: "Website Fullstack", price: 800_000, original_price: 3_000_000, discount: 73, features: ["Multi-halaman (5-10 page)", "Admin dashboard custom", "Database & REST API", "Auth & role management", "SEO lengkap", "Revisi unlimited"], bonuses: ["Free 1 bulan maintenance", "Setup domain & hosting"], cta: "Order Sekarang", popular: true },
    { name: "Custom Project", price: 0, original_price: 0, discount: 0, features: ["Fitur sesuai kebutuhan", "Konsultasi mendalam", "Timeline fleksibel", "Full support priority", "Source code milik kamu", "Maintenance opsional"], bonuses: ["Estimasi harga transparan"], cta: "Hubungi Kami", popular: false },
  ],
};

export default function PricingSection({ content }: { content?: StorePricingContent }) {
  const d = content ?? defaults;

  return (
    <section id="harga" className="bg-gray-50 py-16 sm:py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="text-center">
          <span className="text-4xl">{d.icon}</span>
          <h2 className="mt-3 text-2xl font-extrabold text-gray-900 sm:text-3xl">
            {d.title}
          </h2>
          <p className="mt-3 text-gray-500">
            {d.subtitle}
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {d.plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-2xl border bg-white p-6 shadow-sm transition-shadow hover:shadow-md ${
                plan.popular
                  ? "ring-2 ring-brand-400 border-brand-300"
                  : "border-gray-100"
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-linear-to-r from-brand-700 to-brand-500 px-4 py-1 text-xs font-bold text-white shadow">
                  🔥 PALING POPULER
                </span>
              )}

              {plan.discount > 0 && (
                <span className="mb-3 inline-flex w-fit rounded-md bg-red-50 px-2.5 py-0.5 text-xs font-bold text-red-600">
                  HEMAT {plan.discount}%
                </span>
              )}

              <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>

              <div className="mt-2">
                {plan.price > 0 ? (
                  <div>
                    {plan.original_price > 0 && (
                      <span className="text-sm text-gray-400 line-through">
                        {formatRupiah(plan.original_price)}
                      </span>
                    )}
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-brand-600">
                        {formatRupiah(plan.price)}
                      </span>
                      <span className="text-sm text-gray-400">/ project</span>
                    </div>
                  </div>
                ) : (
                  <span className="text-3xl font-extrabold text-brand-600">
                    Custom
                  </span>
                )}
              </div>

              {/* Features */}
              <ul className="mt-5 flex-1 space-y-2.5">
                {plan.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2 text-sm text-gray-600"
                  >
                    <span className="mt-0.5 text-green-500">✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              {/* Bonuses */}
              {plan.bonuses.length > 0 && (
                <div className="mt-4 rounded-lg bg-brand-50 p-3">
                  <p className="text-xs font-bold text-brand-700">🎁 BONUS:</p>
                  {plan.bonuses.map((b) => (
                    <p key={b} className="mt-1 text-xs text-brand-600">
                      + {b}
                    </p>
                  ))}
                </div>
              )}

              <a
                href="#layanan"
                className={`mt-5 block rounded-xl py-3 text-center text-sm font-semibold transition-all ${
                  plan.popular
                    ? "bg-linear-to-r from-brand-700 to-brand-500 text-white shadow-lg shadow-brand-500/30 hover:-translate-y-0.5"
                    : "border border-brand-200 text-brand-600 hover:bg-brand-50"
                }`}
              >
                {plan.cta}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
