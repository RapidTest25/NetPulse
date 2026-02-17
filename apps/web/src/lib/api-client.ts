const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

async function fetchAPI<T>(
  path: string,
  options?: RequestInit & { fallback?: T },
): Promise<T> {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      throw new Error(`API error: ${res.status} ${res.statusText}`);
    }

    return res.json();
  } catch (err) {
    // During SSG build the API may not be running — return fallback data
    if (options?.fallback !== undefined) {
      return options.fallback;
    }
    throw err;
  }
}

export const apiClient = {
  // ── Public ─────────────────────────────────────
  getPosts: (params?: {
    page?: number;
    limit?: number;
    sort?: string;
    category?: string;
    tag?: string;
  }) => {
    const sp = new URLSearchParams();
    if (params?.page) sp.set("page", String(params.page));
    if (params?.limit) sp.set("limit", String(params.limit));
    if (params?.sort) sp.set("sort", params.sort);
    if (params?.category) sp.set("category", params.category);
    if (params?.tag) sp.set("tag", params.tag);
    return fetchAPI<any>(`/posts?${sp.toString()}`, {
      fallback: {
        items: [],
        page: 1,
        limit: 10,
        total: 0,
        total_pages: 0,
      },
    });
  },

  getPostBySlug: async (slug: string) => {
    try {
      return await fetchAPI<any>(`/posts/${slug}`);
    } catch {
      return null;
    }
  },

  getCategories: () => fetchAPI<any[]>("/categories", { fallback: [] }),

  getTags: () => fetchAPI<any[]>("/tags", { fallback: [] }),

  search: (params: {
    q: string;
    page?: number;
    limit?: number;
    sort?: string;
  }) => {
    const sp = new URLSearchParams();
    sp.set("q", params.q);
    if (params.page) sp.set("page", String(params.page));
    if (params.limit) sp.set("limit", String(params.limit));
    if (params.sort) sp.set("sort", params.sort);
    return fetchAPI<any>(`/search?${sp.toString()}`, {
      fallback: {
        items: [],
        page: 1,
        limit: 10,
        total: 0,
        total_pages: 0,
      },
    });
  },

  suggest: (q: string, limit = 5) =>
    fetchAPI<any[]>(
      `/search/suggest?q=${encodeURIComponent(q)}&limit=${limit}`,
      { fallback: [] },
    ),

  // ── Public user profiles ───────────────────────
  getUserProfile: async (id: string) => {
    try {
      return await fetchAPI<any>(`/users/${id}`);
    } catch {
      return null;
    }
  },

  getUserPosts: (id: string, params?: { page?: number; limit?: number }) => {
    const sp = new URLSearchParams();
    if (params?.page) sp.set("page", String(params.page));
    if (params?.limit) sp.set("limit", String(params.limit));
    return fetchAPI<any>(`/users/${id}/posts?${sp.toString()}`, {
      fallback: { items: [], page: 1, limit: 10, total: 0, total_pages: 0 },
    });
  },

  // ── Public site settings ───────────────────────
  getPublicSettings: () =>
    fetchAPI<Record<string, string>>("/settings/public", {
      fallback: {},
    }),
};
