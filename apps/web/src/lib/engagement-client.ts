// Engagement API client — comments, likes, views, stats

import type {
  Comment,
  PostStats,
  LikeResponse,
  PaginatedResult,
} from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
}

function headers(withAuth = false): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (withAuth) {
    const t = getToken();
    if (t) h["Authorization"] = `Bearer ${t}`;
  }
  return h;
}

export const engagementClient = {
  // ── Comments ──────────────────────────────────

  getComments: async (
    postId: string,
    page = 1,
    limit = 20,
  ): Promise<PaginatedResult<Comment>> => {
    const sp = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    const res = await fetch(`${API_URL}/posts/${postId}/comments?${sp}`, {
      cache: "no-store",
    });
    if (!res.ok)
      return { items: [], page: 1, limit: 20, total: 0, total_pages: 0 };
    return res.json();
  },

  createComment: async (
    postId: string,
    body: {
      body: string;
      author_name?: string;
      author_email?: string;
      parent_id?: string;
    },
  ): Promise<Comment> => {
    const res = await fetch(`${API_URL}/posts/${postId}/comments`, {
      method: "POST",
      headers: headers(true),
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to post comment");
    }
    return res.json();
  },

  // ── Likes ─────────────────────────────────────

  toggleLike: async (postId: string): Promise<LikeResponse> => {
    const res = await fetch(`${API_URL}/posts/${postId}/like`, {
      method: "POST",
      headers: headers(true),
    });
    if (!res.ok) throw new Error("Failed to toggle like");
    const data = await res.json();
    return { liked: data.liked, total: data.likes_count ?? data.total ?? 0 };
  },

  // ── Views ─────────────────────────────────────

  recordView: async (postId: string): Promise<void> => {
    try {
      await fetch(`${API_URL}/posts/${postId}/view`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
    } catch {
      /* ignore view tracking errors */
    }
  },

  // ── Stats ─────────────────────────────────────

  getStats: async (postId: string): Promise<PostStats> => {
    const res = await fetch(`${API_URL}/posts/${postId}/stats`, {
      headers: headers(true),
      cache: "no-store",
    });
    if (!res.ok) return { post_id: postId, views: 0, likes: 0, comments: 0 };
    const data = await res.json();
    return {
      post_id: data.post_id ?? postId,
      views: data.views_count ?? data.views ?? 0,
      likes: data.likes_count ?? data.likes ?? 0,
      comments: data.comments_count ?? data.comments ?? 0,
      has_liked: data.has_liked ?? false,
    };
  },
};
