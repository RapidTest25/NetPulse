"use client";

import { useState } from "react";
import ShareModal from "./ShareModal";
import { LikeButton, PostStatsBar } from "./Engagement";

/* ── Share + Engagement Bar ──────────────── */
export function ShareAndEngagement({
  postId,
  title,
  slug,
}: {
  postId: string;
  title: string;
  slug: string;
}) {
  const [shareOpen, setShareOpen] = useState(false);
  const shareUrl =
    typeof window !== "undefined"
      ? window.location.href
      : `https://netpulse.id/posts/${slug}`;

  return (
    <>
      {/* Share CTA */}
      <div className="mt-10 rounded-2xl border border-gray-200 bg-linear-to-r from-gray-50 to-white p-6">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Bagikan Artikel</h3>
            <p className="mt-1 text-sm text-gray-500">
              Sebarkan pengetahuan ini ke komunitasmu.
            </p>
          </div>
          <button
            onClick={() => setShareOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700"
          >
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
                d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z"
              />
            </svg>
            Bagikan
          </button>
        </div>
      </div>

      {/* Engagement Bar */}
      <div className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-5">
        <PostStatsBar postId={postId} />
        <LikeButton postId={postId} />
      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        title={title}
        url={shareUrl}
      />
    </>
  );
}

/* ── Newsletter Form ─────────────────────── */
export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");
    // For now, simulate subscription (can be connected to API later)
    setTimeout(() => {
      setStatus("success");
      setEmail("");
      setTimeout(() => setStatus("idle"), 4000);
    }, 800);
  };

  return (
    <div className="rounded-xl border border-brand-200 bg-linear-to-br from-brand-50 to-white p-5">
      <div className="flex items-center gap-2 mb-1">
        <svg
          className="h-4 w-4 text-brand-600"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
          />
        </svg>
        <h3 className="text-sm font-semibold text-brand-900">
          Langganan Update
        </h3>
      </div>
      <p className="text-xs text-brand-600/70 mb-3">
        Dapatkan artikel terbaru langsung di inbox
      </p>
      {status === "success" ? (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
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
              d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Berhasil berlangganan!
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <input
            type="email"
            placeholder="email@contoh.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="h-9 rounded-lg border border-brand-200 bg-white px-3 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="flex h-9 items-center justify-center rounded-lg bg-brand-600 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
          >
            {status === "loading" ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              "Berlangganan"
            )}
          </button>
        </form>
      )}
      <p className="mt-2 text-center text-[10px] text-gray-400">
        Newsletter — integrasi dengan form
      </p>
    </div>
  );
}
