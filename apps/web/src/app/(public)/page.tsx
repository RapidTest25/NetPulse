import { Navbar } from "@/components/layout/Navbar";
import { SearchBar } from "@/components/layout/SearchBar";
import { Footer } from "@/components/layout/Footer";
import { PostCard } from "@/components/ui/PostCard";
import { apiClient } from "@/lib/api-client";

export const revalidate = 60; // ISR: revalidate every 60 seconds

export default async function HomePage() {
  let posts = {
    items: [],
    page: 1,
    limit: 10,
    total: 0,
    total_pages: 0,
  } as any;
  let categories: any[] = [];

  try {
    [posts, categories] = await Promise.all([
      apiClient.getPosts({ page: 1, limit: 6, sort: "newest" }),
      apiClient.getCategories(),
    ]);
  } catch {
    // API not available — use defaults
  }

  // Safety: ensure posts is in the expected shape
  if (!posts || !Array.isArray(posts.items)) {
    posts = { items: [], page: 1, limit: 10, total: 0, total_pages: 0 };
  }
  if (!Array.isArray(categories)) {
    categories = [];
  }

  const categoryIcons: Record<string, string> = {
    networking:
      "M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z",
    internet:
      "M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418",
    security:
      "M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z",
    cloud:
      "M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z",
    devops:
      "M11.42 15.17l-5.648-3.261a.75.75 0 01-.104-1.243l5.648-4.516a.75.75 0 011.133.27l1.956 5.668a.75.75 0 01-.668.934l-2.317 .148zm2.684 1.482l5.648-3.261a.75.75 0 00.104-1.243L14.208 7.632a.75.75 0 00-1.133.27l-1.956 5.668",
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      {/* ── Hero Section ─────────────────────────────── */}
      <section className="relative overflow-hidden bg-linear-to-br from-brand-950 via-brand-900 to-brand-800">
        {/* Decorative background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-brand-600/20 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-brand-400/10 blur-3xl" />
          {/* Grid pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.03)_1px,transparent_1px)] bg-size-[64px_64px]" />
        </div>

        <div className="relative mx-auto max-w-5xl px-4 pb-20 pt-24 text-center sm:px-6 sm:pb-24 sm:pt-32 lg:px-8">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 backdrop-blur-sm">
            <span className="flex h-2 w-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-sm font-medium text-brand-200">
              Blog Network & Internet
            </span>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Jelajahi Dunia{" "}
            <span className="bg-linear-to-r from-cyan-300 via-brand-300 to-brand-400 bg-clip-text text-transparent">
              Network & Internet
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-brand-200/80">
            Pelajari DNS, BGP, HTTP/3, cloud infrastructure, security, dan
            berbagai teknologi jaringan lainnya. Ditulis untuk engineer, oleh
            engineer.
          </p>

          <div className="mx-auto mt-10 max-w-2xl">
            <SearchBar variant="hero" />
          </div>

          {/* Quick stats */}
          <div className="mt-12 flex items-center justify-center gap-8 text-sm text-brand-300/70">
            <div className="flex items-center gap-2">
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z"
                />
              </svg>
              Artikel berkualitas
            </div>
            <div className="flex items-center gap-2">
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z"
                />
              </svg>
              Open source
            </div>
            <div className="flex items-center gap-2">
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Update rutin
            </div>
          </div>
        </div>
      </section>

      {/* ── Categories Section ────────────────────────── */}
      {categories && categories.length > 0 && (
        <section className="border-b border-gray-100 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {categories.map((cat: any) => (
                <a
                  key={cat.id}
                  href={`/categories/${cat.slug}`}
                  className="group flex flex-col items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50/50 p-5 transition-all hover:border-brand-200 hover:bg-brand-50/50 hover:shadow-sm"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-600 transition-colors group-hover:bg-brand-600 group-hover:text-white">
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
                        d={
                          categoryIcons[cat.slug] ||
                          "M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6z"
                        }
                      />
                    </svg>
                  </div>
                  <div className="text-center">
                    <span className="text-sm font-semibold text-gray-800">
                      {cat.name}
                    </span>
                    {cat.description && (
                      <p className="mt-0.5 text-[11px] text-gray-400 line-clamp-1">
                        {cat.description}
                      </p>
                    )}
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Latest Posts ──────────────────────────────── */}
      <section className="bg-gray-50/50">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                Artikel Terbaru
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                Baca artikel terbaru seputar teknologi jaringan dan internet.
              </p>
            </div>
            <a
              href="/blog"
              className="hidden items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors sm:flex"
            >
              Lihat semua
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
          </div>

          {posts.items && posts.items.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {posts.items.map((post: any, i: number) => (
                <div
                  key={post.id}
                  className={`animate-fade-in-up animation-delay-${i * 100}`}
                >
                  <PostCard post={post} />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 py-20 text-center">
              <svg
                className="h-12 w-12 text-gray-300"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z"
                />
              </svg>
              <p className="mt-4 text-gray-500 font-medium">
                Belum ada artikel
              </p>
              <p className="mt-1 text-sm text-gray-400">
                Stay tuned — artikel pertama segera hadir!
              </p>
            </div>
          )}

          {posts.total_pages > 1 && (
            <div className="mt-12 text-center">
              <a
                href="/blog"
                className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-7 py-3 text-sm font-semibold text-white shadow-sm shadow-brand-500/25 transition-all hover:bg-brand-700 hover:shadow-md hover:shadow-brand-500/30"
              >
                Lihat Semua Artikel
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
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
