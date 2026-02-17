type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  cover_url?: string;
  published_at?: string;
  category?: { name: string; slug: string };
  author?: { name: string };
  tags?: { id: string; name: string; slug: string }[];
};

const categoryColors: Record<string, string> = {
  networking: "bg-blue-50 text-blue-700 ring-blue-200",
  internet: "bg-cyan-50 text-cyan-700 ring-cyan-200",
  security: "bg-red-50 text-red-700 ring-red-200",
  cloud: "bg-violet-50 text-violet-700 ring-violet-200",
  devops: "bg-amber-50 text-amber-700 ring-amber-200",
};

function getColorForCategory(slug?: string) {
  if (!slug) return "bg-brand-50 text-brand-700 ring-brand-200";
  return categoryColors[slug] || "bg-brand-50 text-brand-700 ring-brand-200";
}

export function PostCard({ post }: { post: Post }) {
  const catColor = getColorForCategory(post.category?.slug);

  return (
    <a
      href={`/posts/${post.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm transition-all duration-300 hover:border-brand-200 hover:shadow-lg hover:shadow-brand-500/5 hover:-translate-y-0.5"
    >
      {/* Cover image or gradient placeholder */}
      {post.cover_url ? (
        <div className="aspect-video overflow-hidden bg-gray-100">
          <img
            src={post.cover_url}
            alt={post.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      ) : (
        <div className="aspect-video bg-linear-to-br from-brand-100 via-brand-50 to-white flex items-center justify-center">
          <svg
            className="h-12 w-12 text-brand-300"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z"
            />
          </svg>
        </div>
      )}

      <div className="flex flex-1 flex-col p-5">
        {/* Category badge */}
        {post.category && (
          <span
            className={`mb-2 inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${catColor}`}
          >
            {post.category.name}
          </span>
        )}

        {/* Title */}
        <h3 className="text-base font-semibold leading-snug text-gray-900 transition-colors group-hover:text-brand-600 line-clamp-2">
          {post.title}
        </h3>

        {/* Excerpt */}
        {post.excerpt && (
          <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-500 line-clamp-2">
            {post.excerpt}
          </p>
        )}

        {/* Meta */}
        <div className="mt-4 flex items-center gap-3 border-t border-gray-100 pt-3">
          {post.author && (
            <div className="flex items-center gap-1.5">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-linear-to-br from-brand-400 to-brand-600 text-[10px] font-bold text-white">
                {post.author.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs font-medium text-gray-600">
                {post.author.name}
              </span>
            </div>
          )}
          {post.published_at && (
            <>
              <span className="text-gray-300">&middot;</span>
              <time
                dateTime={post.published_at}
                className="text-xs text-gray-400"
              >
                {new Date(post.published_at).toLocaleDateString("id-ID", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </time>
            </>
          )}
        </div>
      </div>
    </a>
  );
}
