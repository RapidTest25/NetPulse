import TypingText from "./TypingText";
import type { StoreHeroContent } from "@/types";

const defaults: StoreHeroContent = {
  badge: "Development Studio",
  title_prefix: "Bikin Website",
  title_suffix: "Dalam Hitungan Hari ⚡",
  typing_words: ["Profesional", "Modern", "SEO-Ready", "Responsif"],
  subtitle: "Lupakan jasa mahal & freelancer ghosting. Cukup order, dan tim kami yang mengerjakannya. Mulai dari **Rp 150.000**.",
  cta_primary: "Lihat Layanan 👇",
  cta_secondary: "Lihat Portfolio",
  rating: "4.9/5 rating",
  projects_done: "100+ project selesai",
  speed_text: "⏱️ Pengerjaan cepat",
  note: "⚡ Tanpa perlu akun. Langsung order, bayar, selesai.",
};

export default function HeroSection({ content }: { content?: StoreHeroContent }) {
  const d = content ?? defaults;

  // Parse subtitle: **bold** → <strong>
  const subtitleHtml = d.subtitle.replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-gray-900">$1</strong>');

  return (
    <section className="relative overflow-hidden bg-gray-50 py-16 sm:py-20 lg:py-24">
      {/* Background grid + glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(ellipse at top, rgba(249,115,22,0.08), transparent 70%), linear-gradient(to right, #e5e7eb 1px, transparent 1px), linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)",
          backgroundSize: "100% 100%, 40px 40px, 40px 40px",
        }}
      />

      <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
        {/* Badge */}
        <span className="relative inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-brand-600 shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-500" />
          </span>
          {d.badge}
        </span>

        {/* H1 */}
        <h1 className="mt-6 text-3xl font-extrabold leading-tight text-gray-900 sm:text-4xl lg:text-5xl">
          {d.title_prefix}{" "}
          <TypingText words={d.typing_words} />
          <br className="hidden sm:block" />
          {d.title_suffix}
        </h1>

        {/* Sub */}
        <p
          className="mt-5 text-base leading-relaxed text-gray-500 sm:text-lg"
          dangerouslySetInnerHTML={{ __html: subtitleHtml }}
        />

        {/* CTAs */}
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            href="#layanan"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-brand-700 to-brand-500 px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-brand-500/30 transition-all hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.98] sm:w-auto"
          >
            {d.cta_primary}
          </a>
          <a
            href="#portfolio"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-7 py-3.5 text-base font-semibold text-gray-700 shadow-sm transition-all hover:border-brand-300 hover:text-brand-600 sm:w-auto"
          >
            {d.cta_secondary}
          </a>
        </div>

        {/* Social proof */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-gray-400">
          <span className="flex items-center gap-1">
            <span className="text-yellow-400">★★★★★</span>
            <span>{d.rating}</span>
          </span>
          <span className="hidden h-4 w-px bg-gray-200 sm:inline-block" />
          <span>🚀 {d.projects_done}</span>
          <span className="hidden h-4 w-px bg-gray-200 sm:inline-block" />
          <span>{d.speed_text}</span>
        </div>

        {/* Note */}
        <p className="mt-4 text-xs text-gray-400">
          {d.note}
        </p>
      </div>
    </section>
  );
}
