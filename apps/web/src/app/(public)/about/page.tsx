import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description:
    "Tentang NetPulse — blog teknologi jaringan dan internet untuk engineer.",
};

const milestones = [
  {
    year: "2024",
    title: "Ide Awal",
    desc: "Konsep NetPulse lahir dari kebutuhan konten networking berbahasa Indonesia yang berkualitas.",
  },
  {
    year: "2025",
    title: "Peluncuran Beta",
    desc: "Platform diluncurkan dengan arsitektur Go + Next.js, mencakup artikel DNS, BGP, dan cloud.",
  },
  {
    year: "2026",
    title: "Komunitas Berkembang",
    desc: "Ribuan engineer bergabung membaca dan berkontribusi konten setiap bulannya.",
  },
];

const values = [
  {
    title: "Akurasi Teknis",
    desc: "Setiap artikel melewati review mendalam untuk memastikan kebenaran informasi teknis.",
    icon: "M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z",
  },
  {
    title: "Bahasa yang Jelas",
    desc: "Materi kompleks disampaikan dengan bahasa yang mudah dipahami tanpa mengorbankan kedalaman.",
    icon: "M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18",
  },
  {
    title: "Open Source",
    desc: "Platform ini dibangun secara open source — siapapun bisa berkontribusi dan belajar dari kode sumbernya.",
    icon: "M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5",
  },
  {
    title: "Komunitas Pertama",
    desc: "Kami percaya teknologi berkembang lebih cepat ketika pengetahuan dibagikan secara terbuka.",
    icon: "M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z",
  },
];

const techStack = [
  { name: "Go", desc: "API Backend", color: "from-cyan-500 to-cyan-600" },
  { name: "Next.js", desc: "Frontend SSR", color: "from-gray-800 to-gray-900" },
  { name: "PostgreSQL", desc: "Database", color: "from-blue-500 to-blue-700" },
  { name: "Redis", desc: "Caching Layer", color: "from-red-500 to-red-600" },
  { name: "Tailwind", desc: "Styling", color: "from-sky-400 to-sky-600" },
  { name: "Docker", desc: "Deployment", color: "from-blue-400 to-blue-600" },
];

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-linear-to-br from-brand-950 via-brand-900 to-brand-800">
        <div className="absolute inset-0">
          <div className="absolute -left-32 top-0 h-125 w-125 rounded-full bg-brand-600/20 blur-[100px]" />
          <div className="absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-cyan-500/15 blur-[80px]" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] bg-size-[72px_72px]" />
        </div>
        <div className="relative mx-auto max-w-4xl px-4 pb-20 pt-24 text-center sm:px-6 sm:pb-28 sm:pt-32">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 backdrop-blur-sm">
            <svg
              className="h-4 w-4 text-brand-300"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
              />
            </svg>
            <span className="text-sm font-medium text-brand-200">
              Tentang Kami
            </span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            Misi Kami: Demokratisasi{" "}
            <span className="bg-linear-to-r from-cyan-300 to-brand-300 bg-clip-text text-transparent">
              Pengetahuan Jaringan
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-brand-200/80">
            NetPulse hadir untuk menjembatani gap pengetahuan di dunia
            networking dan infrastructure. Kami menulis konten teknis mendalam
            dalam Bahasa Indonesia agar setiap engineer bisa berkembang tanpa
            hambatan bahasa.
          </p>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-b border-gray-100 bg-white">
        <div className="mx-auto grid max-w-5xl grid-cols-2 divide-x divide-gray-100 sm:grid-cols-4">
          {[
            { value: "50+", label: "Artikel Teknis" },
            { value: "10K+", label: "Pembaca Bulanan" },
            { value: "5+", label: "Kategori Topik" },
            { value: "100%", label: "Gratis & Terbuka" },
          ].map((stat) => (
            <div key={stat.label} className="px-6 py-8 text-center">
              <p className="text-3xl font-extrabold tracking-tight text-brand-600">
                {stat.value}
              </p>
              <p className="mt-1 text-sm text-gray-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Values */}
      <section className="bg-gray-50/60">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              Prinsip yang Kami Pegang
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-gray-500">
              Setiap artikel dan fitur yang kami buat didasari oleh nilai-nilai
              ini.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {values.map((v) => (
              <div
                key={v.title}
                className="group rounded-2xl border border-gray-200 bg-white p-7 shadow-sm transition-all hover:border-brand-200 hover:shadow-md"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-600 group-hover:text-white">
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d={v.icon}
                    />
                  </svg>
                </div>
                <h3 className="mt-5 text-lg font-semibold text-gray-900">
                  {v.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">
                  {v.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="bg-white">
        <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              Perjalanan Kami
            </h2>
          </div>
          <div className="relative mt-14">
            <div className="absolute left-6 top-3 bottom-3 w-px bg-linear-to-b from-brand-300 via-brand-400 to-brand-200 sm:left-1/2 sm:-translate-x-px" />
            {milestones.map((m, i) => (
              <div
                key={m.year}
                className={`relative mb-10 flex items-start gap-6 sm:gap-12 ${i % 2 === 1 ? "sm:flex-row-reverse" : ""}`}
              >
                <div className="absolute left-6 top-1.5 -translate-x-1/2 sm:left-1/2">
                  <div className="flex h-4 w-4 items-center justify-center rounded-full border-[3px] border-brand-500 bg-white ring-4 ring-brand-50" />
                </div>
                <div
                  className={`ml-14 flex-1 sm:ml-0 ${i % 2 === 1 ? "sm:text-right" : ""}`}
                >
                  <span className="inline-block rounded-full bg-brand-50 px-3 py-0.5 text-xs font-bold text-brand-700">
                    {m.year}
                  </span>
                  <h3 className="mt-2 text-lg font-semibold text-gray-900">
                    {m.title}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">{m.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="border-t border-gray-100 bg-gray-50/60">
        <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              Dibangun dengan Teknologi Modern
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-gray-500">
              Stack yang kami pilih mengutamakan performa, keamanan, dan
              developer experience.
            </p>
          </div>
          <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {techStack.map((tech) => (
              <div
                key={tech.name}
                className="group flex flex-col items-center gap-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md"
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br ${tech.color} text-sm font-extrabold text-white shadow-sm`}
                >
                  {tech.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-gray-800">
                    {tech.name}
                  </p>
                  <p className="text-[11px] text-gray-400">{tech.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-linear-to-br from-brand-950 via-brand-900 to-brand-800">
        <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
          <h2 className="text-3xl font-bold tracking-tight text-white">
            Siap Mendalami Networking?
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-brand-200/80">
            Mulai jelajahi artikel berkualitas atau bergabung dengan komunitas
            engineer kami.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="/blog"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-brand-700 shadow-sm transition-all hover:bg-brand-50"
            >
              Jelajahi Artikel
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                />
              </svg>
            </a>
            <a
              href="https://github.com/RapidWire"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/10"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              GitHub
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
