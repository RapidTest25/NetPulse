import type { StoreTrustBadgesContent } from "@/types";

const defaultRow1 = [
  "⚡ Pengerjaan Cepat",
  "💎 Kualitas Premium",
  "🔒 Garansi Revisi",
  "💰 Harga Transparan",
  "📦 Auto Delivery",
  "🛡️ Support WA 24/7",
  "🎯 SEO-Ready",
  "📱 Fully Responsive",
];

const defaultRow2 = [
  "✅ Tanpa Akun",
  "🔥 100+ Project",
  "🎨 Desain Modern",
  "🚀 Fast Loading",
  "🛡️ Anti Ribet",
  "💳 Multi Payment",
  "📊 Dashboard Admin",
  "⏱️ Deadline Aman",
];

export default function TrustBadges({ content }: { content?: StoreTrustBadgesContent }) {
  const row1 = content?.row1 ?? defaultRow1;
  const row2 = content?.row2 ?? defaultRow2;
  return (
    <section className="overflow-hidden border-y border-gray-100 bg-white py-5">
      {/* Row 1 — left scroll */}
      <div className="relative mb-3">
        <div className="animate-marquee flex w-max gap-4">
          {[...row1, ...row1].map((t, i) => (
            <span
              key={i}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-gray-100 bg-gray-50 px-4 py-1.5 text-xs font-medium text-gray-600 whitespace-nowrap"
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* Row 2 — right scroll */}
      <div className="relative">
        <div className="animate-marquee-reverse flex w-max gap-4">
          {[...row2, ...row2].map((t, i) => (
            <span
              key={i}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-brand-100 bg-brand-50 px-4 py-1.5 text-xs font-medium text-brand-700 whitespace-nowrap"
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
