import { env } from "./env";
import type {
  Listing,
  ListingListResult,
  ListingCategory,
  OrderResponse,
  OrderSummary,
  OrderDetail,
  PortfolioListResult,
  PaymentMethod,
  Review,
  StoreContent,
} from "@/types";

const API = env.apiURL;

async function fetcher<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    cache: "no-store",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(body.message || res.statusText);
  }
  return res.json();
}

// ── Listings ─────────────────────────────────────────

export async function getListings(params?: {
  type?: string;
  category_id?: string;
  q?: string;
  sort?: string;
  page?: number;
  limit?: number;
}): Promise<ListingListResult> {
  const qs = new URLSearchParams();
  if (params?.type) qs.set("type", params.type);
  if (params?.category_id) qs.set("category_id", params.category_id);
  if (params?.q) qs.set("q", params.q);
  if (params?.sort) qs.set("sort", params.sort);
  if (params?.page) qs.set("page", String(params.page));
  if (params?.limit) qs.set("limit", String(params.limit));
  return fetcher<ListingListResult>(`/store/listings?${qs}`);
}

export async function getListing(slug: string): Promise<Listing> {
  return fetcher<Listing>(`/store/listings/${slug}`);
}

export async function getCategories(): Promise<{ items: ListingCategory[] }> {
  return fetcher<{ items: ListingCategory[] }>("/store/categories");
}

export async function getReviews(params?: {
  listing_id?: string;
  page?: number;
  limit?: number;
}): Promise<{ items: Review[]; total: number }> {
  const qs = new URLSearchParams();
  if (params?.listing_id) qs.set("listing_id", params.listing_id);
  if (params?.page) qs.set("page", String(params.page));
  if (params?.limit) qs.set("limit", String(params.limit));
  return fetcher(`/store/reviews?${qs}`);
}

// ── Orders ───────────────────────────────────────────

export async function createOrder(data: {
  listing_id: string;
  package_id?: string;
  buyer_name: string;
  buyer_email?: string;
  buyer_phone?: string;
  notes?: string;
  payment_method: string;
}): Promise<OrderResponse> {
  return fetcher<OrderResponse>("/store/orders", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function trackOrder(
  method: "trx" | "email" | "phone",
  value: string
): Promise<{ orders: OrderSummary[] }> {
  return fetcher<{ orders: OrderSummary[] }>("/store/orders/track", {
    method: "POST",
    body: JSON.stringify({ method, value }),
  });
}

export async function getOrder(
  orderNumber: string,
  token?: string
): Promise<OrderDetail> {
  const qs = token ? `?token=${token}` : "";
  return fetcher<OrderDetail>(`/store/orders/${orderNumber}${qs}`);
}

export async function submitReview(
  listingId: string,
  data: {
    rating: number;
    content: string;
    reviewer_name: string;
    order_number: string;
  }
): Promise<void> {
  await fetcher(`/store/listings/${listingId}/reviews`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ── Portfolio ────────────────────────────────────────

export async function getPortfolio(params?: {
  featured?: boolean;
  listing_id?: string;
  page?: number;
  limit?: number;
}): Promise<PortfolioListResult> {
  const qs = new URLSearchParams();
  if (params?.featured) qs.set("featured", "true");
  if (params?.listing_id) qs.set("listing_id", params.listing_id);
  if (params?.page) qs.set("page", String(params.page));
  if (params?.limit) qs.set("limit", String(params.limit));
  return fetcher<PortfolioListResult>(`/store/portfolio?${qs}`);
}

// ── Payment Methods ──────────────────────────────────

export async function getPaymentMethods(): Promise<{
  items: PaymentMethod[];
}> {
  return fetcher<{ items: PaymentMethod[] }>("/store/payment-methods");
}

// ── Store Content (admin-managed) ────────────────────

export async function getStoreContent(): Promise<StoreContent> {
  return fetcher<StoreContent>("/store/content");
}
