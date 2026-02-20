import { getReviews } from "@/lib/api";
import type { Review, StoreTestimonialsContent } from "@/types";

const defaults: StoreTestimonialsContent = {
  icon: "💬",
  title: "Apa Kata Mereka?",
  subtitle: "Testimoni langsung dari klien yang sudah merasakan hasilnya.",
  empty_text: "Testimoni segera hadir. Jadilah klien pertama kami!",
};

export default async function TestimonialSection({ content }: { content?: StoreTestimonialsContent }) {
  const d = content ?? defaults;
  let reviews: Review[] = [];
  try {
    const data = await getReviews({ limit: 8 });
    reviews = data.items?.filter((r) => r.is_visible) ?? [];
  } catch {
    // fallback
  }

  return (
    <section className="bg-white py-16 sm:py-20">
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

        {reviews.length === 0 ? (
          <div className="mt-10 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 p-16 text-center">
            <span className="text-5xl">🎉</span>
            <p className="mt-4 text-gray-400">
              {d.empty_text}
            </p>
          </div>
        ) : (
          <div className="mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 scrollbar-none">
            {reviews.map((r) => (
              <div
                key={r.id}
                className="w-72 shrink-0 snap-start rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:w-80"
              >
                {/* Stars */}
                <div className="flex items-center gap-0.5 text-yellow-400 text-sm">
                  {Array.from({ length: 5 }, (_, i) => (
                    <span key={i}>{i < r.rating ? "★" : "☆"}</span>
                  ))}
                </div>

                {/* Content */}
                <p className="mt-3 text-sm leading-relaxed text-gray-600 line-clamp-4">
                  &ldquo;{r.content}&rdquo;
                </p>

                {/* Author */}
                <div className="mt-4 flex items-center gap-3 border-t border-gray-50 pt-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-600">
                    {r.reviewer_name?.charAt(0)?.toUpperCase() ?? "?"}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {r.reviewer_name}
                    </p>
                    {r.listing_title && (
                      <p className="text-xs text-gray-400">
                        {r.listing_title}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
