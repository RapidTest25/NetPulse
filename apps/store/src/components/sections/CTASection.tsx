import { env } from "@/lib/env";
import type { StoreCTAContent } from "@/types";

const defaults: StoreCTAContent = {
  icon: "🚀",
  title: "Siap Mulai Project-mu?",
  subtitle: "Konsultasi gratis, tanpa kewajiban. Ceritakan kebutuhanmu dan dapatkan estimasi harga dalam hitungan menit.",
  cta_primary: "💬 Chat WhatsApp",
  cta_secondary: "Lihat Layanan",
  note: "⚡ Respon cepat",
};

export default function CTASection({ content }: { content?: StoreCTAContent }) {
  const d = content ?? defaults;
  return (
    <section className="relative overflow-hidden bg-gray-900 py-16 sm:py-20">
      {/* Grid bg */}
      <div
        className="pointer-events-none absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
        <span className="text-5xl">{d.icon}</span>
        <h2 className="mt-4 text-3xl font-extrabold text-white sm:text-4xl">
          {d.title}
        </h2>
        <p className="mt-4 text-base leading-relaxed text-gray-400">
          {d.subtitle}
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            href={`https://wa.me/${env.waNumber}?text=Halo%20NetPulse%2C%20saya%20mau%20konsultasi%20untuk%20project%20saya`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-green-500 px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-green-500/30 transition-all hover:-translate-y-0.5 hover:bg-green-600 hover:shadow-xl sm:w-auto"
          >
            {d.cta_primary}
          </a>
          <a
            href="#layanan"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 px-7 py-3.5 text-base font-semibold text-white transition-all hover:bg-white/10 sm:w-auto"
          >
            {d.cta_secondary}
          </a>
        </div>

        <p className="mt-6 text-xs text-gray-500">
          {d.note} &bull; 📱 WA: {env.waNumber}
        </p>
      </div>
    </section>
  );
}
