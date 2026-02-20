import type { StoreComparisonContent } from "@/types";

const defaults: StoreComparisonContent = {
  title: "Kenapa Harus NetPulse? 🤔",
  subtitle: "Bandingkan sendiri dengan opsi lain di pasaran.",
  tiers: [
    { label: "🏢 Agensi", price: "Rp 5 - 50 Juta", items: ["Harga tinggi", "Proses lama", "Revisi terbatas"], is_pro: false },
    { label: "👤 Freelancer", price: "Rp 500K - 5 Juta", items: ["Kualitas tidak pasti", "Sering ghosting", "Tanpa garansi"], is_pro: false },
    { label: "🧑‍💻 DIY / Manual", price: "Gratis tapi...", items: ["Butuh skill coding", "Memakan waktu lama", "Hasilnya kurang rapi"], is_pro: false },
    { label: "⚡ NetPulse Studio", price: "Mulai Rp 150K", items: ["Kualitas konsisten", "Pengerjaan 3-14 hari", "Free revisi", "Support WA 24/7", "Garansi 100%"], is_pro: true, highlight: true, badge: "⚡ SOLUSI TERBAIK" },
  ],
};

export default function ComparisonSection({ content }: { content?: StoreComparisonContent }) {
  const d = content ?? defaults;

  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-5xl px-4 text-center sm:px-6">
        <h2 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">
          {d.title}
        </h2>
        <p className="mt-3 text-gray-500">
          {d.subtitle}
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {d.tiers.map((t, i) => (
            <div
              key={i}
              className={`relative flex flex-col rounded-2xl border p-5 text-left shadow-sm transition-transform ${
                t.highlight
                  ? "bg-linear-to-br from-brand-50 to-brand-100 ring-4 ring-brand-400/30 scale-[1.03] border-brand-300"
                  : "bg-white border-gray-100"
              }`}
            >
              {t.highlight && t.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-600 px-3 py-0.5 text-xs font-bold text-white shadow">
                  {t.badge}
                </span>
              )}

              <p className="text-sm font-semibold text-gray-800">{t.label}</p>
              <p
                className={`mt-1 text-lg font-extrabold ${
                  t.highlight ? "text-brand-600" : "text-gray-900"
                }`}
              >
                {t.price}
              </p>

              <ul className="mt-4 flex-1 space-y-2">
                {t.items.map((item) => (
                  <li
                    key={item}
                    className={`flex items-start gap-2 text-sm ${
                      t.is_pro ? "text-gray-700" : "text-gray-400"
                    }`}
                  >
                    <span className={`mt-0.5 ${t.is_pro ? "text-green-500" : "text-red-400"}`}>
                      {t.is_pro ? "✓" : "✗"}
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
