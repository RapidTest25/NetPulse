const row1 = [
  "🌐 Company Profile",
  "📄 Landing Page",
  "🛒 E-Commerce",
  "📰 Blog / Portal Berita",
  "🎓 Website Sekolah",
  "🏥 Website Klinik",
  "📋 Sistem Inventory",
  "📊 Dashboard Admin",
];

const row2 = [
  "💻 Aplikasi CRUD",
  "📚 Tugas Pemrograman",
  "🎨 Template Premium",
  "📦 Source Code Siap Pakai",
  "🔌 REST API",
  "📱 Progressive Web App",
  "🗂️ Sistem Manajemen",
  "🔑 Auth & RBAC",
];

const row3 = [
  "🛠️ Custom Web App",
  "💼 Portfolio Website",
  "🍽️ Website Restoran",
  "🏨 Booking System",
  "📅 Event Organizer",
  "💡 Startup MVP",
  "🏗️ Real Estate",
  "📝 CMS Custom",
];

export default function CategorySection() {
  return (
    <section id="kategori" className="overflow-hidden bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <h2 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">
          Bisa Untuk Apa Aja? 🤔
        </h2>
        <p className="mt-3 text-gray-500">
          Apa pun jenis website yang kamu butuhkan, kami siap handle.
        </p>
      </div>

      <div className="mt-10 space-y-3">
        {/* Row 1 */}
        <div className="relative">
          <div className="animate-marquee flex w-max gap-3">
            {[...row1, ...row1].map((t, i) => (
              <span
                key={i}
                className="inline-flex shrink-0 items-center rounded-lg border border-gray-100 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 whitespace-nowrap"
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Row 2 — reverse */}
        <div className="relative">
          <div className="animate-marquee-reverse flex w-max gap-3">
            {[...row2, ...row2].map((t, i) => (
              <span
                key={i}
                className="inline-flex shrink-0 items-center rounded-lg border border-brand-100 bg-brand-50 px-4 py-2 text-sm font-medium text-brand-700 whitespace-nowrap"
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Row 3 */}
        <div className="relative">
          <div className="animate-marquee flex w-max gap-3">
            {[...row3, ...row3].map((t, i) => (
              <span
                key={i}
                className="inline-flex shrink-0 items-center rounded-lg border border-gray-100 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 whitespace-nowrap"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
