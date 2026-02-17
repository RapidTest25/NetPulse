// ── Post Types ────────────────────────────────────────

export type PostStatus =
  | "DRAFT"
  | "IN_REVIEW"
  | "CHANGES_REQUESTED"
  | "SCHEDULED"
  | "PUBLISHED"
  | "ARCHIVED";

export interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  cover_url?: string;
  status: PostStatus;
  author_id: string;
  category_id?: string;
  published_at?: string;
  scheduled_at?: string;
  meta_title?: string;
  meta_description?: string;
  canonical?: string;
  created_at: string;
  updated_at: string;
  tags?: Tag[];
  category?: Category;
  author?: Author;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
}

export interface Author {
  id: string;
  name: string;
  avatar?: string;
}

// ── Pagination ───────────────────────────────────────

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

// ── Auth ─────────────────────────────────────────────

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface AuthResponse {
  tokens: TokenPair;
  user: UserInfo;
}

export interface UserInfo {
  id: string;
  email: string;
  name: string;
  role: string;
  email_verified: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  bio?: string;
  is_active: boolean;
  email_verified_at?: string;
  referral_code?: string;
  disabled_at?: string;
  website?: string;
  location?: string;
  social_twitter?: string;
  social_github?: string;
  social_linkedin?: string;
  social_facebook?: string;
  social_instagram?: string;
  social_youtube?: string;
  auth_provider?: string;
  created_at: string;
  updated_at: string;
  roles?: Role[];
  permissions?: string[];
}

export interface Role {
  id: string;
  name: string;
  permissions?: Permission[];
}

export interface Permission {
  id: string;
  name: string;
  module: string;
}

// ── Engagement ───────────────────────────────────────

export type CommentStatus = "pending" | "approved" | "spam" | "rejected";

export interface Comment {
  id: string;
  post_id: string;
  post_title?: string;
  user_id?: string;
  author_name: string;
  author_email: string;
  body: string;
  content: string;
  status: CommentStatus;
  parent_id?: string;
  created_at: string;
  reply_count?: number;
  replies?: Comment[];
}

export interface PostStats {
  post_id: string;
  views: number;
  likes: number;
  comments: number;
  has_liked?: boolean;
}

export interface LikeResponse {
  liked: boolean;
  total: number;
}

// ── Dashboard Stats ──────────────────────────────────

export interface DashboardStats {
  total_posts: number;
  total_users: number;
  total_comments: number;
  total_views: number;
  total_likes: number;
  total_referrals: number;
  pending_comments: number;
}

export interface TopPost {
  id: string;
  title: string;
  slug: string;
  views: number;
  likes: number;
  comments: number;
}

// ── Referral ─────────────────────────────────────────

export interface ReferralStats {
  total_referrals: number;
  verified_referrals: number;
  top_referrers: TopReferrer[];
}

export interface TopReferrer {
  user_id: string;
  user_name: string;
  referral_code: string;
  total: number;
  verified: number;
}

// ── Audit Log ────────────────────────────────────────

export interface AuditLogEntry {
  id: number;
  user_id: string;
  user_name: string;
  action: string;
  entity: string;
  entity_id: string;
  details: string;
  ip_address: string;
  created_at: string;
}

// ── Session ──────────────────────────────────────────

export interface UserSession {
  id: string;
  ip_address: string;
  user_agent: string;
  last_active_at: string;
  created_at: string;
}

// ── Affiliate ────────────────────────────────────────

export interface AffiliateSettings {
  enabled: boolean;
  commission_type: "FIXED_PER_VERIFIED_REFERRAL" | "PERCENTAGE" | "FIXED";
  commission_value: number;
  cookie_days: number;
  referral_hold_days: number;
  payout_minimum: number;
  payout_schedule: "MANUAL" | "WEEKLY" | "BIWEEKLY" | "MONTHLY";
  how_it_works_md: string;
  terms_md: string;
  payout_rules_md: string;
  terms_text: string;
  updated_at?: string;
}

export interface AffiliateSettingsUpdate {
  enabled?: boolean;
  commission_type?: string;
  commission_value?: number;
  cookie_days?: number;
  referral_hold_days?: number;
  payout_minimum?: number;
  payout_schedule?: string;
  how_it_works_md?: string;
  terms_md?: string;
  payout_rules_md?: string;
  terms_text?: string;
}

export interface AffiliateProfile {
  id: string;
  user_id: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";
  payout_method: string;
  provider_name: string;
  payout_name?: string;
  payout_number?: string;
  payout_name_masked?: string;
  payout_number_masked?: string;
  total_earnings: number;
  total_paid: number;
  pending_balance: number;
  available_balance: number;
  locked_balance: number;
  is_blocked: boolean;
  is_suspicious: boolean;
  blocked_reason?: string;
  blocked_at?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
  user_name?: string;
  user_email?: string;
  referral_code?: string;
}

export interface EnrollInput {
  payout_method: "BANK" | "EWALLET";
  provider_name: string;
  account_name: string;
  account_number: string;
}

export interface Commission {
  id: string;
  affiliate_id: string;
  referral_event_id?: number;
  amount: number;
  description: string;
  status: string;
  hold_until?: string;
  released_at?: string;
  created_at: string;
}

export interface AffiliateStats {
  total_earnings: number;
  total_paid: number;
  pending_balance: number;
  available_balance: number;
  total_referrals: number;
  verified_referrals: number;
  this_month_earnings: number;
}

export interface TopAffiliate {
  user_id: string;
  user_name: string;
  user_email: string;
  referral_code: string;
  verified_referrals: number;
  total_earnings: number;
}

export interface AdminAffiliateStats {
  total_affiliates: number;
  active_affiliates: number;
  pending_payouts: number;
  pending_payouts_amount: number;
  total_paid_out: number;
  total_commissions: number;
  verified_last_30_days: number;
  top_affiliates: TopAffiliate[];
}

export interface PayoutRequest {
  id: string;
  user_id: string;
  affiliate_id: string;
  amount: number;
  status: "PENDING" | "APPROVED" | "PROCESSING" | "PAID" | "REJECTED";
  admin_note?: string;
  note?: string;
  payment_reference?: string;
  proof_url?: string;
  requested_at: string;
  processed_at?: string;
  processed_by?: string;
  created_at: string;
  user_name?: string;
  user_email?: string;
}

export interface PayoutRequestInput {
  amount: number;
  note?: string;
}

export interface AdjustBalanceInput {
  amount: number;
  balance_type: "pending" | "available" | "paid";
  reason: string;
}

export interface BalanceAdjustment {
  id: string;
  user_id: string;
  admin_id: string;
  amount: number;
  balance_type: string;
  reason: string;
  created_at: string;
}

// ── Author Stats ─────────────────────────────────────

export interface AuthorStats {
  total_posts: number;
  published: number;
  drafts: number;
  in_review: number;
}

// ── Save / Bookmark ──────────────────────────────────

export interface SavedPost {
  id: string;
  user_id: string;
  post_id: string;
  created_at: string;
  post_title: string;
  post_slug: string;
  post_excerpt: string;
  post_cover_url: string;
  post_status: string;
  author_name: string;
}

export interface SaveResponse {
  saved: boolean;
  saves_count: number;
}

// ── Author Request ───────────────────────────────────

export interface AuthorRequest {
  id: string;
  user_id: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  reason: string;
  admin_note?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
  user_name?: string;
  user_email?: string;
  user_avatar?: string;
}

export interface AuthorRequestStatus {
  has_request: boolean;
  request?: AuthorRequest;
}

// ── User Comment (with post info) ────────────────────

export interface UserComment {
  id: string;
  post_id: string;
  content: string;
  status: string;
  created_at: string;
  post_title: string;
  post_slug: string;
}

// ── Site Settings (public) ───────────────────────────

export interface PublicSiteSettings {
  site_title: string;
  site_description: string;
  site_logo: string;
  privacy_policy: string;
  terms_of_service: string;
  about_page: string;
  affiliate_how_it_works: string;
  social_twitter: string;
  social_github: string;
  social_facebook: string;
  social_instagram: string;
  social_youtube: string;
  social_linkedin: string;
  footer_text: string;
}
