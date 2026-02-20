import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { apiClient } from "@/lib/api-client";

export const revalidate = 60;

export const metadata = {
  title: "Tags — NetPulse",
  description: "Temukan artikel berdasarkan tag spesifik di NetPulse.",
};

export default async function TagsPage() {
  let tags: any[] = [];
  try {
    tags = await apiClient.getTags();
  } catch {
    // error.tsx handles critical failures
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <div className="flex-1 mx-auto w-full max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Tags
          </h1>
          <p className="mt-2 text-gray-500">
            Temukan artikel berdasarkan tag spesifik.
          </p>
        </div>

        {tags.length > 0 ? (
          <div className="flex flex-wrap gap-3">
            {tags.map((tag: any, i: number) => (
              <a
                key={tag.id}
                href={`/tags/${tag.slug}`}
                className="group inline-flex items-center gap-2 rounded-xl border border-gray-200/80 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all duration-200 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 hover:shadow-md animate-fade-in-up"
                style={{ animationDelay: `${Math.min(i * 30, 300)}ms` }}
              >
                <svg
                  className="h-3.5 w-3.5 text-gray-400 transition-colors group-hover:text-brand-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 6h.008v.008H6V6z"
                  />
                </svg>
                {tag.name}
                {tag.post_count !== undefined && (
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500 transition-colors group-hover:bg-brand-100 group-hover:text-brand-600">
                    {tag.post_count}
                  </span>
                )}
              </a>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border-2 border-dashed border-gray-200 py-16 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-300"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z"
              />
            </svg>
            <p className="mt-4 text-gray-500">Belum ada tag yang tersedia.</p>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
