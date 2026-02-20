import type { StoreProblemsContent } from "@/types";

const defaults: StoreProblemsContent = {
  icon: "😱",
  title: "Sering Ngadepin Hal Ini?",
  subtitle: "Kalau kamu pernah ngalamin salah satu di bawah ini, berarti kamu di tempat yang tepat.",
  items: [
    { icon: "💸", text: "Bayar mahal ke agensi, hasilnya biasa aja" },
    { icon: "👻", text: "Freelancer ghosting pas project jalan setengah" },
    { icon: "🤯", text: "Gak ngerti coding tapi butuh website ASAP" },
    { icon: "⏰", text: "Deadline mepet, gak ada yang mau ambil" },
  ],
  agitation: "**Mau berapa lama lagi** nunggu website impianmu jadi kenyataan? Sementara kompetitor sudah go-online dan dapetin klien dari Google. **Waktunya action sekarang.**",
};

export default function ProblemSection({ content }: { content?: StoreProblemsContent }) {
  const d = content ?? defaults;
  const agitationHtml = d.agitation.replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold">$1</strong>');

  return (
    <section className="bg-gray-50 py-16 sm:py-20">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <span className="text-4xl">{d.icon}</span>
        <h2 className="mt-3 text-2xl font-extrabold text-gray-900 sm:text-3xl">
          {d.title}
        </h2>
        <p className="mt-3 text-gray-500">
          {d.subtitle}
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {d.items.map((p, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-xl border border-red-100 bg-white p-4 text-left shadow-sm"
            >
              <span className="text-2xl">{p.icon}</span>
              <p className="text-sm font-medium text-gray-700">{p.text}</p>
            </div>
          ))}
        </div>

        {/* Agitation */}
        <div className="mt-10 rounded-2xl border border-brand-100 bg-brand-50 p-6">
          <p
            className="text-sm leading-relaxed text-brand-800"
            dangerouslySetInnerHTML={{ __html: agitationHtml }}
          />
        </div>
      </div>
    </section>
  );
}
