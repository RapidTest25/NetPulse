"use client";

import { useState, useEffect } from "react";
import { engagementClient } from "@/lib/engagement-client";
import type { PostStats as PostStatsType } from "@/types";

export function LikeButton({ postId }: { postId: string }) {
  const [stats, setStats] = useState<PostStatsType | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    engagementClient.getStats(postId).then(setStats);
  }, [postId]);

  const handleLike = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await engagementClient.toggleLike(postId);
      setStats((s) =>
        s ? { ...s, likes: res.total, has_liked: res.liked } : s,
      );
    } catch {
      /* ignore */
    }
    setLoading(false);
  };

  return (
    <button
      onClick={handleLike}
      disabled={loading}
      className={`group flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all ${
        stats?.has_liked
          ? "border-red-200 bg-red-50 text-red-600"
          : "border-gray-200 bg-white text-gray-600 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
      }`}
    >
      <svg
        className={`h-5 w-5 transition-transform group-hover:scale-110 ${stats?.has_liked ? "fill-red-500 text-red-500" : "fill-none text-current"}`}
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
        />
      </svg>
      <span>{stats?.likes ?? 0}</span>
    </button>
  );
}

export function ViewTracker({ postId }: { postId: string }) {
  useEffect(() => {
    // Record view once on mount
    engagementClient.recordView(postId);
  }, [postId]);

  return null;
}

export function PostStatsBar({ postId }: { postId: string }) {
  const [stats, setStats] = useState<PostStatsType | null>(null);

  useEffect(() => {
    engagementClient.getStats(postId).then(setStats);
  }, [postId]);

  if (!stats) return null;

  return (
    <div className="flex items-center gap-6 text-sm text-gray-500">
      <div className="flex items-center gap-1.5">
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
            d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
        <span>{(stats.views ?? 0).toLocaleString()} views</span>
      </div>
      <div className="flex items-center gap-1.5">
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
            d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
          />
        </svg>
        <span>{stats.likes ?? 0} likes</span>
      </div>
      <div className="flex items-center gap-1.5">
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
            d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
          />
        </svg>
        <span>{stats.comments ?? 0} komentar</span>
      </div>
    </div>
  );
}
