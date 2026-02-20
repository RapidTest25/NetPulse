import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { apiClient } from "@/lib/api-client";
import { ViewTracker } from "@/components/engagement/Engagement";
import { CommentSection } from "@/components/engagement/CommentSection";
import {
  ShareAndEngagement,
  NewsletterForm,
} from "@/components/engagement/ArticleWidgets";
import {
  HeaderAd,
  SidebarAd,
  FooterAd,
  ArticleBodyWithAds,
} from "@/components/ads/AdSlot";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await apiClient.getPostBySlug(slug);
  if (!post) return { title: "Post Not Found" };

  return {
    title: post.meta_title || post.title,
    description: post.meta_description || post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      publishedTime: post.published_at,
      images: post.cover_url ? [{ url: post.cover_url }] : [],
    },
    alternates: {
      canonical: post.canonical || undefined,
    },
  };
}

function estimateReadingTime(html: string): number {
  const text = html.replace(/<[^>]*>/g, "");
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const post = await apiClient.getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const readingTime = estimateReadingTime(post.body || "");

  // Fetch related posts from the same category
  let relatedPosts: any[] = [];
  if (post.category?.slug) {
    try {
      const related = await apiClient.getPosts({
        category: post.category.slug,
        limit: 5,
      });
      relatedPosts = (related.items || [])
        .filter((p: any) => p.slug !== slug)
        .slice(0, 4);
    } catch {}
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      {/* Top Banner Ad */}
      <HeaderAd />

      <div className="flex-1 mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
          {/* Main Content */}
          <article className="min-w-0">
            {/* Breadcrumb */}
            <nav className="mb-8 flex items-center gap-2 text-sm text-gray-400">
              <a href="/" className="transition-colors hover:text-gray-600">
                Beranda
              </a>
              <svg
                className="h-3.5 w-3.5"
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
              {post.category && (
                <>
                  <a
                    href={`/categories/${post.category.slug}`}
                    className="transition-colors hover:text-gray-600"
                  >
                    {post.category.name}
                  </a>
                  <svg
                    className="h-3.5 w-3.5"
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
                </>
              )}
              <span className="truncate text-gray-600">{post.title}</span>
            </nav>

            {/* Header */}
            <header className="mb-10">
              {post.category && (
                <a
                  href={`/categories/${post.category.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 ring-1 ring-inset ring-brand-200 transition-colors hover:bg-brand-100"
                >
                  {post.category.name}
                </a>
              )}
              <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl lg:text-[2.75rem] lg:leading-tight">
                {post.title}
              </h1>
              {post.excerpt && (
                <p className="mt-4 text-lg leading-relaxed text-gray-500">
                  {post.excerpt}
                </p>
              )}

              {/* Author + Meta Row */}
              <div className="mt-6 flex flex-wrap items-center gap-6 border-t border-b border-gray-100 py-5">
                {post.author && (
                  <Link
                    href={`/u/${post.author_id || post.author.id}`}
                    className="flex items-center gap-3 group/author"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br from-brand-500 to-brand-700 text-sm font-bold text-white">
                      {post.author.avatar ? (
                        <img
                          src={post.author.avatar}
                          alt={post.author.name}
                          className="h-full w-full rounded-full object-cover"
                        />
                      ) : (
                        post.author.name?.charAt(0).toUpperCase() || "A"
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 group-hover/author:text-brand-600 transition-colors">
                        {post.author.name}
                      </p>
                      <p className="text-xs text-gray-400">Penulis</p>
                    </div>
                  </Link>
                )}
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  {post.published_at && (
                    <div className="flex items-center gap-1.5">
                      <svg
                        className="h-4 w-4 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
                        />
                      </svg>
                      <time dateTime={post.published_at}>
                        {new Date(post.published_at).toLocaleDateString(
                          "id-ID",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          },
                        )}
                      </time>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <svg
                      className="h-4 w-4 text-gray-400"
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
                    {readingTime} menit baca
                  </div>
                </div>
              </div>
            </header>

            {/* Cover Image */}
            {post.cover_url && (
              <div className="mb-10 overflow-hidden rounded-2xl shadow-lg">
                <img
                  src={post.cover_url}
                  alt={post.title}
                  className="w-full object-cover"
                />
              </div>
            )}

            {/* Body with In-Article Ads */}
            <ArticleBodyWithAds html={post.body || ""} adInterval={4} />

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="mt-12 border-t border-gray-100 pt-8">
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">
                  Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag: any) => (
                    <a
                      key={tag.id}
                      href={`/tags/${tag.slug}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
                    >
                      <svg
                        className="h-3 w-3"
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
                      </svg>
                      {tag.name}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Share + Engagement */}
            <ShareAndEngagement
              postId={post.id}
              title={post.title}
              slug={slug}
            />

            {/* Comments */}
            <CommentSection postId={post.id} />

            {/* View Tracker */}
            <ViewTracker postId={post.id} />

            {/* Article Schema */}
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                  "@context": "https://schema.org",
                  "@type": "Article",
                  headline: post.title,
                  description: post.excerpt,
                  datePublished: post.published_at,
                  author: post.author
                    ? { "@type": "Person", name: post.author.name }
                    : undefined,
                  image: post.cover_url || undefined,
                }),
              }}
            />
          </article>

          {/* Sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-6">
              {/* Sidebar Ad 1 */}
              <SidebarAd index={1} />

              {/* Artikel Terkait */}
              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <h3 className="mb-4 text-sm font-semibold text-gray-900">
                  Artikel Terkait
                </h3>
                {relatedPosts.length > 0 ? (
                  <div className="space-y-4">
                    {relatedPosts.map((rp: any) => (
                      <Link
                        key={rp.id}
                        href={`/posts/${rp.slug}`}
                        className="group block"
                      >
                        {rp.cover_url && (
                          <div className="mb-2 overflow-hidden rounded-lg">
                            <img
                              src={rp.cover_url}
                              alt={rp.title}
                              className="aspect-video w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          </div>
                        )}
                        <h4 className="line-clamp-2 text-sm font-medium text-gray-800 transition-colors group-hover:text-brand-600">
                          {rp.title}
                        </h4>
                        {rp.published_at && (
                          <p className="mt-1 text-xs text-gray-400">
                            {new Date(rp.published_at).toLocaleDateString(
                              "id-ID",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              },
                            )}
                          </p>
                        )}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">
                    Belum ada artikel terkait.
                  </p>
                )}
              </div>

              {/* Sidebar Ad 2 */}
              <SidebarAd index={2} />

              {/* Newsletter */}
              <NewsletterForm />
            </div>
          </aside>
        </div>
        {/* End Grid */}

        {/* Bottom Banner Ad */}
        <FooterAd />
      </div>
      {/* End flex-1 content wrapper */}

      <Footer />
    </div>
  );
}
