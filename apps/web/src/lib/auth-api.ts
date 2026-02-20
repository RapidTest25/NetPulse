const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

function getAuthHeaders(): HeadersInit {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("access_token");
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

async function authFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
      ...options?.headers,
    },
  });

  if (res.status === 401) {
    // Try refresh
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      const retryRes = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
          ...options?.headers,
        },
      });
      if (!retryRes.ok) {
        const err = await retryRes.json().catch(() => ({}));
        throw new Error(err.error || `API error: ${retryRes.status}`);
      }
      return retryRes.json();
    }
    // Redirect to login
    if (typeof window !== "undefined") {
      window.location.href = "/auth/login";
    }
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `API error: ${res.status}`);
  }

  return res.json();
}

async function tryRefreshToken(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const refreshToken = localStorage.getItem("refresh_token");
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!res.ok) return false;
    const data = await res.json();
    localStorage.setItem("access_token", data.tokens.access_token);
    localStorage.setItem("refresh_token", data.tokens.refresh_token);
    return true;
  } catch {
    return false;
  }
}

// ── Auth API ────────────────────────────────────────

export const authAPI = {
  login: async (email: string, password: string) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Login failed");
    }
    const data = await res.json();
    localStorage.setItem("access_token", data.tokens.access_token);
    localStorage.setItem("refresh_token", data.tokens.refresh_token);
    localStorage.setItem("user", JSON.stringify(data.user));
    return data;
  },

  register: async (
    data:
      | {
          name: string;
          email: string;
          username?: string;
          password: string;
          referralCode?: string;
        }
      | string,
    email?: string,
    password?: string,
    referralCode?: string,
  ) => {
    let body: Record<string, string>;
    if (typeof data === "object") {
      body = { name: data.name, email: data.email, password: data.password };
      if (data.username) body.username = data.username;
      if (data.referralCode) body.referral_code = data.referralCode;
    } else {
      body = { name: data, email: email!, password: password! };
      if (referralCode) body.referral_code = referralCode;
    }
    const res = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Registration failed");
    }
    const result = await res.json();
    // Backend register returns {message, user_id, referral_code, verify_token}
    // No tokens returned — user must login after registration
    return result;
  },

  loginWithGoogle: async (accessToken: string, referralCode?: string) => {
    const body: Record<string, string> = { access_token: accessToken };
    if (referralCode) body.referral_code = referralCode;
    const res = await fetch(`${API_URL}/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Google login failed");
    }
    const data = await res.json();
    localStorage.setItem("access_token", data.tokens.access_token);
    localStorage.setItem("refresh_token", data.tokens.refresh_token);
    localStorage.setItem("user", JSON.stringify(data.user));
    return data;
  },

  logout: async () => {
    try {
      await authFetch("/auth/logout", { method: "POST" });
    } finally {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user");
    }
  },

  getUser: () => {
    if (typeof window === "undefined") return null;
    const u = localStorage.getItem("user");
    return u ? JSON.parse(u) : null;
  },

  isLoggedIn: () => {
    if (typeof window === "undefined") return false;
    return !!localStorage.getItem("access_token");
  },

  forgotPassword: async (email: string) => {
    const res = await fetch(`${API_URL}/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok)
      throw new Error(data.error || "Gagal mengirim email reset password");
    return data;
  },

  resetPassword: async (token: string, password: string) => {
    const res = await fetch(`${API_URL}/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Gagal mereset password");
    return data;
  },
};

// ── User Panel API ──────────────────────────────────

export const userAPI = {
  // Profile
  getMe: () => authFetch<any>("/user/me"),
  updateMe: (data: {
    name?: string;
    bio?: string;
    avatar?: string;
    website?: string;
    location?: string;
    social_twitter?: string;
    social_github?: string;
    social_linkedin?: string;
    social_facebook?: string;
    social_instagram?: string;
    social_youtube?: string;
  }) =>
    authFetch<any>("/user/me", { method: "PATCH", body: JSON.stringify(data) }),

  // Author Studio - Posts
  getPosts: (params?: { page?: number; limit?: number; status?: string }) => {
    const sp = new URLSearchParams();
    if (params?.page) sp.set("page", String(params.page));
    if (params?.limit) sp.set("limit", String(params.limit));
    if (params?.status) sp.set("status", params.status);
    return authFetch<any>(`/user/posts?${sp.toString()}`);
  },
  createPost: (data: {
    title: string;
    body: string;
    excerpt?: string;
    cover_url?: string;
    category_id?: string;
    tag_ids?: string[];
    meta_title?: string;
    meta_description?: string;
  }) =>
    authFetch<any>("/user/posts", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getPost: (id: string) => authFetch<any>(`/user/posts/${id}`),
  updatePost: (id: string, data: Record<string, any>) =>
    authFetch<any>(`/user/posts/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deletePost: (id: string) =>
    authFetch<any>(`/user/posts/${id}`, { method: "DELETE" }),
  submitPostForReview: (id: string) =>
    authFetch<any>(`/user/posts/${id}/submit-review`, { method: "POST" }),
  getAuthorStats: () => authFetch<any>("/user/posts/stats"),

  // Affiliate
  getAffiliateSettings: () => authFetch<any>("/user/affiliate/settings"),
  getAffiliateProfile: () => authFetch<any>("/user/affiliate/me"),
  enrollAffiliate: (data: {
    payout_method: string;
    provider_name: string;
    account_name: string;
    account_number: string;
  }) =>
    authFetch<any>("/user/affiliate/enroll", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getAffiliateStats: () => authFetch<any>("/user/affiliate/stats"),
  requestPayout: (data: { amount: number; note?: string }) =>
    authFetch<any>("/user/affiliate/payout-request", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getPayouts: (page = 1) =>
    authFetch<any>(`/user/affiliate/payouts?page=${page}`),
  getCommissions: (page = 1) =>
    authFetch<any>(`/user/affiliate/commissions?page=${page}`),
  updatePayoutInfo: (data: {
    payout_method: string;
    provider_name: string;
    account_name: string;
    account_number: string;
  }) =>
    authFetch<any>("/user/affiliate/payout-info", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  // Saved / Bookmarked posts
  getSavedPosts: (page = 1, limit = 10) =>
    authFetch<any>(`/user/saved?page=${page}&limit=${limit}`),

  // Liked posts
  getLikedPosts: (page = 1, limit = 10) =>
    authFetch<any>(`/user/likes?page=${page}&limit=${limit}`),

  // Comment history
  getMyComments: (page = 1, limit = 10) =>
    authFetch<any>(`/user/comments?page=${page}&limit=${limit}`),

  // Author request
  createAuthorRequest: (reason: string) =>
    authFetch<any>("/user/author-request", {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),
  getAuthorRequestStatus: () => authFetch<any>("/user/author-request"),

  // Toggle save on a post
  toggleSave: (postId: string) =>
    authFetch<any>(`/posts/${postId}/save`, { method: "POST" }),
  checkSaved: (postId: string) => authFetch<any>(`/posts/${postId}/saved`),

  // Change password
  changePassword: (data: { current_password: string; new_password: string }) =>
    authFetch<any>("/user/change-password", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Change email
  requestEmailChange: (data: { new_email: string; password: string }) =>
    authFetch<any>("/user/me/change-email", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  confirmEmailChange: (data: { token: string }) =>
    authFetch<any>("/user/me/confirm-email", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// ── Admin API ───────────────────────────────────────

export const adminAPI = {
  // Existing admin endpoints
  getPosts: (params?: { page?: number; limit?: number; status?: string }) => {
    const sp = new URLSearchParams();
    if (params?.page) sp.set("page", String(params.page));
    if (params?.limit) sp.set("limit", String(params.limit));
    if (params?.status) sp.set("status", params.status);
    return authFetch<any>(`/admin/posts?${sp.toString()}`);
  },
  createPost: (data: Record<string, any>) =>
    authFetch<any>("/admin/posts", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getPost: (id: string) => authFetch<any>(`/admin/posts/${id}`),
  updatePost: (id: string, data: Record<string, any>) =>
    authFetch<any>(`/admin/posts/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deletePost: (id: string) =>
    authFetch<any>(`/admin/posts/${id}`, { method: "DELETE" }),
  publishPost: (id: string) =>
    authFetch<any>(`/admin/posts/${id}/publish`, { method: "POST" }),
  submitReview: (id: string) =>
    authFetch<any>(`/admin/posts/${id}/submit-review`, { method: "POST" }),

  getUsers: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
  }) => {
    const sp = new URLSearchParams();
    if (params?.page) sp.set("page", String(params.page));
    if (params?.limit) sp.set("limit", String(params.limit));
    if (params?.search) sp.set("search", params.search);
    if (params?.role) sp.set("role", params.role);
    return authFetch<any>(`/admin/users?${sp.toString()}`);
  },

  getDashboardStats: () => authFetch<any>("/admin/stats/dashboard"),
  getTopPosts: () => authFetch<any>("/admin/stats/top-posts"),
  getTrafficOverview: () => authFetch<any>("/admin/stats/traffic"),

  // Affiliate admin
  getAffiliateSettings: () => authFetch<any>("/admin/affiliate/settings"),
  updateAffiliateSettings: (data: Record<string, any>) =>
    authFetch<any>("/admin/affiliate/settings", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  getAffiliateStats: () => authFetch<any>("/admin/affiliate/stats"),
  getAffiliates: (params?: {
    page?: number;
    status?: string;
    search?: string;
  }) => {
    const sp = new URLSearchParams();
    if (params?.page) sp.set("page", String(params.page));
    if (params?.status) sp.set("status", params.status);
    if (params?.search) sp.set("search", params.search);
    return authFetch<any>(`/admin/affiliate/affiliates?${sp.toString()}`);
  },
  updateAffiliateStatus: (id: string, status: string) =>
    authFetch<any>(`/admin/affiliate/affiliates/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  blockAffiliate: (id: string, blocked: boolean, reason?: string) =>
    authFetch<any>(`/admin/affiliate/affiliates/${id}/block`, {
      method: "PATCH",
      body: JSON.stringify({ blocked, reason: reason || "" }),
    }),
  flagSuspicious: (id: string, suspicious: boolean) =>
    authFetch<any>(`/admin/affiliate/affiliates/${id}/suspicious`, {
      method: "PATCH",
      body: JSON.stringify({ suspicious }),
    }),
  adjustBalance: (
    id: string,
    data: { amount: number; balance_type: string; reason: string },
  ) =>
    authFetch<any>(`/admin/affiliate/affiliates/${id}/adjust-balance`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getPayoutRequests: (params?: { page?: number; status?: string }) => {
    const sp = new URLSearchParams();
    if (params?.page) sp.set("page", String(params.page));
    if (params?.status) sp.set("status", params.status);
    return authFetch<any>(`/admin/affiliate/payouts?${sp.toString()}`);
  },
  approvePayout: (id: string, adminNote?: string) =>
    authFetch<any>(`/admin/affiliate/payouts/${id}/approve`, {
      method: "POST",
      body: JSON.stringify({ admin_note: adminNote || "" }),
    }),
  rejectPayout: (id: string, adminNote: string) =>
    authFetch<any>(`/admin/affiliate/payouts/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ admin_note: adminNote }),
    }),
  markPaid: (
    id: string,
    data: {
      admin_note?: string;
      payment_reference?: string;
      proof_url?: string;
    },
  ) =>
    authFetch<any>(`/admin/affiliate/payouts/${id}/mark-paid`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  releaseHeldCommissions: () =>
    authFetch<any>("/admin/affiliate/release-commissions", { method: "POST" }),

  // Author requests (admin)
  getAuthorRequests: (params?: { page?: number; status?: string }) => {
    const sp = new URLSearchParams();
    if (params?.page) sp.set("page", String(params.page));
    if (params?.status) sp.set("status", params.status);
    return authFetch<any>(`/admin/author-requests?${sp.toString()}`);
  },
  getAuthorRequest: (id: string) =>
    authFetch<any>(`/admin/author-requests/${id}`),
  reviewAuthorRequest: (id: string, status: string, adminNote?: string) =>
    authFetch<any>(`/admin/author-requests/${id}/review`, {
      method: "POST",
      body: JSON.stringify({ status, admin_note: adminNote || "" }),
    }),

  // Public settings / legal
  getPublicSettings: () => authFetch<any>("/settings/public"),

  // Site settings (admin)
  getSettings: () => authFetch<Record<string, string>>("/admin/settings"),
  updateSettings: (data: Record<string, string>) =>
    authFetch<any>("/admin/settings", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  // Store content (admin)
  getStoreContent: () =>
    authFetch<Record<string, any>>("/admin/store/content"),
  updateStoreContent: (data: Record<string, any>) =>
    authFetch<any>("/admin/store/content", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  // Store listings (admin)
  getStoreListings: (params?: { page?: number; limit?: number; search?: string; type?: string }) => {
    const sp = new URLSearchParams();
    if (params?.page) sp.set("page", String(params.page));
    if (params?.limit) sp.set("limit", String(params.limit));
    if (params?.search) sp.set("search", params.search);
    if (params?.type) sp.set("type", params.type);
    return authFetch<any>(`/admin/store/listings?${sp.toString()}`);
  },
  getStoreListing: (id: string) => authFetch<any>(`/admin/store/listings/${id}`),
  createStoreListing: (data: Record<string, any>) =>
    authFetch<any>("/admin/store/listings", { method: "POST", body: JSON.stringify(data) }),
  updateStoreListing: (id: string, data: Record<string, any>) =>
    authFetch<any>(`/admin/store/listings/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteStoreListing: (id: string) =>
    authFetch<any>(`/admin/store/listings/${id}`, { method: "DELETE" }),

  // Store packages (admin)
  addStorePackage: (listingId: string, data: Record<string, any>) =>
    authFetch<any>(`/admin/store/listings/${listingId}/packages`, { method: "POST", body: JSON.stringify(data) }),
  updateStorePackage: (listingId: string, pkgId: string, data: Record<string, any>) =>
    authFetch<any>(`/admin/store/listings/${listingId}/packages/${pkgId}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteStorePackage: (listingId: string, pkgId: string) =>
    authFetch<any>(`/admin/store/listings/${listingId}/packages/${pkgId}`, { method: "DELETE" }),

  // Store orders (admin)
  getStoreOrders: (params?: { page?: number; limit?: number; status?: string; search?: string }) => {
    const sp = new URLSearchParams();
    if (params?.page) sp.set("page", String(params.page));
    if (params?.limit) sp.set("limit", String(params.limit));
    if (params?.status) sp.set("status", params.status);
    if (params?.search) sp.set("search", params.search);
    return authFetch<any>(`/admin/store/orders?${sp.toString()}`);
  },
  getStoreOrder: (id: string) => authFetch<any>(`/admin/store/orders/${id}`),
  updateStoreOrder: (id: string, data: Record<string, any>) =>
    authFetch<any>(`/admin/store/orders/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  // Store portfolio (admin)
  getStorePortfolio: (params?: { page?: number; limit?: number }) => {
    const sp = new URLSearchParams();
    if (params?.page) sp.set("page", String(params.page));
    if (params?.limit) sp.set("limit", String(params.limit));
    return authFetch<any>(`/admin/store/portfolio?${sp.toString()}`);
  },
  createStorePortfolio: (data: Record<string, any>) =>
    authFetch<any>("/admin/store/portfolio", { method: "POST", body: JSON.stringify(data) }),
  updateStorePortfolio: (id: string, data: Record<string, any>) =>
    authFetch<any>(`/admin/store/portfolio/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteStorePortfolio: (id: string) =>
    authFetch<any>(`/admin/store/portfolio/${id}`, { method: "DELETE" }),

  // Store payment (admin)
  getStorePaymentSettings: () => authFetch<any>("/admin/store/payment/settings"),
  updateStorePaymentSetting: (id: string, data: Record<string, any>) =>
    authFetch<any>(`/admin/store/payment/settings/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  getStorePaymentMethods: () => authFetch<any>("/admin/store/payment/methods"),
  updateStorePaymentMethod: (id: string, data: Record<string, any>) =>
    authFetch<any>(`/admin/store/payment/methods/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  // Store reviews (admin)
  toggleStoreReview: (id: string) =>
    authFetch<any>(`/admin/store/reviews/${id}/toggle`, { method: "PATCH" }),

  // Media upload
  uploadMedia: async (
    file: File,
  ): Promise<{ id: string; url: string; filename: string }> => {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("access_token")
        : null;
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${API_URL}/admin/media/upload`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Upload gagal");
    }
    return res.json();
  },
};
