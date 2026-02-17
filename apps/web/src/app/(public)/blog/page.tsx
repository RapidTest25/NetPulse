import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { PostCard } from "@/components/ui/PostCard";
import { apiClient } from "@/lib/api-client";

export const revalidate = 60;

export const metadata = {
  title: "Blog — NetPulse",
  description: "Semua artikel seputar jaringan, internet, keamanan, dan cloud.",
};

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const sort = (params.sort as string) || "newest";
  const category = (params.category as string) || "";

  let posts: any = { data: [], meta: { total: 0, page: 1, limit: 12, total_pages: 0 } };
  let categories: any[] = [];
  try {
    [posts, categories] = await Promise.all([
      apiClient.getPosts({
        page,
        limit: 12,
        sort,
        ...(category ? { category } : {}),
      }),
      apiClient.getCategories(),
    ]);
  } catch {
    // error.tsx will catch critical failures; partial data is fine
  }

  const sortOptions = [
    { value: "newest", label: "Terbaru" },
    { value: "popular", label: "Populer" },
    { value: "oldest", label: "Terlama" },
  ];

  function buildUrl(overrides: Record<string, string | number>) {
    const p: Record<string, string> = {};
    if (category) p.category = category;
    if (sort !== "newest") p.sort = sort;
    for (const [k, v] of Object.entries(overrides)) {
      if (v && v !== "" && v !== "newest" && !(k === "page" && v === 1)) {
        p[k] = String(v);
      } else {
        delete p[k];
      }
    }
    const qs = new URLSearchParams(p).toString();
    return `/blog${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      {/* Header */}
      <header className="border-b border-gray-100 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <a
                href="/"
                className="mb-4 inline-flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700"
              >
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
                    d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
                  />
                </svg>
                Beranda
              </a>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Blog
              </h1>
              <p className="mt-2 text-gray-500">
                Semua artikel seputar jaringan, internet, keamanan, dan cloud.
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Category Chips */}
            <div className="flex flex-wrap gap-2">
              <a
                href={buildUrl({ category: "", page: 1 })}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  !category
                    ? "bg-brand-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Semua
              </a>
              {categories?.map((cat: any) => (
                <a
                  key={cat.id}
                  href={buildUrl({ category: cat.slug, page: 1 })}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                    category === cat.slug
                      ? "bg-brand-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {cat.name}
                </a>
              ))}
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Urutkan:</span>
              <div className="flex rounded-lg border border-gray-200 bg-white">
                {sortOptions.map((opt) => (
                  <a
                    key={opt.value}
                    href={buildUrl({ sort: opt.value, page: 1 })}
                    className={`px-3 py-1.5 text-sm font-medium transition-colors first:rounded-l-lg last:rounded-r-lg ${
                      sort === opt.value
                        ? "bg-brand-50 text-brand-700"
                        : "text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    {opt.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Posts Grid */}
      <main className="flex-1 bg-gray-50/50">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          {posts.items && posts.items.length > 0 ? (
            <>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {posts.items.map((post: any) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>

              {/* Pagination */}
              {posts.total_pages > 1 && (
                <nav className="mt-12 flex items-center justify-center gap-2">
                  {page > 1 && (
                    <a
                      href={buildUrl({ page: page - 1 })}
                      className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 transition-colors"
                    >
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
                          d="M15.75 19.5L8.25 12l7.5-7.5"
                        />
                      </svg>
                    </a>
                  )}

                  {Array.from({ length: posts.total_pages }, (_, i) => i + 1)
                    .filter(
                      (p) =>
                        p === 1 ||
                        p === posts.total_pages ||
                        Math.abs(p - page) <= 2,
                    )
                    .map((p, idx, arr) => (
                      <span key={p}>
                        {idx > 0 && arr[idx - 1] !== p - 1 && (
                          <span className="px-1 text-gray-400">...</span>
                        )}
                        <a
                          href={buildUrl({ page: p })}
                          className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                            p === page
                              ? "bg-brand-600 text-white"
                              : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          {p}
                        </a>
                      </span>
                    ))}

                  {page < posts.total_pages && (
                    <a
                      href={buildUrl({ page: page + 1 })}
                      className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 transition-colors"
                    >
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
                          d="M8.25 4.5l7.5 7.5-7.5 7.5"
                        />
                      </svg>
                    </a>
                  )}
                </nav>
              )}

              <p className="mt-4 text-center text-sm text-gray-400">
                Menampilkan {(page - 1) * 12 + 1}–
                {Math.min(page * 12, posts.total)} dari {posts.total} artikel
              </p>
            </>
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
              <p className="mt-4 font-medium text-gray-500">
                {category
                  ? "Tidak ada artikel dalam kategori ini"
                  : "Belum ada artikel"}
              </p>
              <p className="mt-1 text-sm text-gray-400">
                {category ? (
                  <a
                    href="/blog"
                    className="text-brand-600 hover:text-brand-700"
                  >
                    Lihat semua artikel
                  </a>
                ) : (
                  "Stay tuned — artikel pertama segera hadir!"
                )}
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
