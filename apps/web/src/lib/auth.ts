// Auth utilities for admin pages
// Manages JWT token storage and refresh

import type { AuthResponse, UserInfo } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const USER_KEY = "user";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function getUser(): UserInfo | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function setUser(user: UserInfo) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

// Backward compat
export const clearTokens = clearAuth;

export function isAuthenticated(): boolean {
  return !!getAccessToken();
}

// ── API Calls ───────────────────────────────────────

export async function login(
  email: string,
  password: string,
): Promise<AuthResponse> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Login failed");
  }

  const data: AuthResponse = await res.json();
  setTokens(data.tokens.access_token, data.tokens.refresh_token);
  setUser(data.user);
  return data;
}

export async function loginWithGoogle(
  accessToken: string,
  referralCode?: string,
): Promise<AuthResponse> {
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

  const data: AuthResponse = await res.json();
  setTokens(data.tokens.access_token, data.tokens.refresh_token);
  setUser(data.user);
  return data;
}

export async function register(input: {
  name: string;
  email: string;
  password: string;
  referral_code?: string;
}): Promise<{ message: string }> {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Registration failed");
  }

  return res.json();
}

export async function verifyEmail(token: string): Promise<{ message: string }> {
  const res = await fetch(`${API_URL}/auth/verify-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Verification failed");
  }

  return res.json();
}

export async function resendVerification(
  email: string,
): Promise<{ message: string }> {
  const res = await fetch(`${API_URL}/auth/resend-verification`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  return res.json();
}

export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!res.ok) {
      clearAuth();
      return null;
    }

    const data = await res.json();
    setTokens(data.tokens.access_token, data.tokens.refresh_token);
    if (data.user) setUser(data.user);
    return data.tokens.access_token;
  } catch {
    clearAuth();
    return null;
  }
}

export async function logout(): Promise<void> {
  const refreshToken = getRefreshToken();
  if (refreshToken) {
    try {
      await authFetch(`${API_URL}/auth/logout`, {
        method: "POST",
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
    } catch {
      /* ignore */
    }
  }
  clearAuth();
}

export async function forgotPassword(
  email: string,
): Promise<{ message: string }> {
  const res = await fetch(`${API_URL}/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok)
    throw new Error(data.error || "Gagal mengirim email reset password");
  return data;
}

export async function resetPassword(
  token: string,
  password: string,
): Promise<{ message: string }> {
  const res = await fetch(`${API_URL}/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Gagal mereset password");
  return data;
}

// Fetch with auto-refresh
export async function authFetch(
  url: string,
  options?: RequestInit,
): Promise<Response> {
  let token = getAccessToken();

  const doFetch = (t: string | null) => {
    const isFormData = options?.body instanceof FormData;
    return fetch(url, {
      ...options,
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...(t ? { Authorization: `Bearer ${t}` } : {}),
        ...options?.headers,
      },
    });
  };

  let res = await doFetch(token);

  if (res.status === 401) {
    token = await refreshAccessToken();
    if (token) {
      res = await doFetch(token);
    }
  }

  return res;
}
