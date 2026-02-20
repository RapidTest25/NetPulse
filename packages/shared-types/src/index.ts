// ── Shared DTOs ──────────────────────────────────────
// These types are shared between frontend and backend documentation

export type PostStatus =
  | "DRAFT"
  | "IN_REVIEW"
  | "CHANGES_REQUESTED"
  | "SCHEDULED"
  | "PUBLISHED"
  | "ARCHIVED";

export interface PostDTO {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  cover_url?: string;
  status: PostStatus;
  published_at?: string;
  category?: string;
  tags?: string[];
  author_name?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface SearchSuggestion {
  title: string;
  slug: string;
  category?: string;
}

export interface APIError {
  error: string;
}
