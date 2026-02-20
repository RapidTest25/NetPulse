// ── Listings ─────────────────────────────────────────

export type ListingType = "SERVICE" | "DIGITAL_PRODUCT" | "ACADEMIC";

export interface Listing {
  id: string;
  title: string;
  slug: string;
  description: string;
  short_desc: string;
  cover_url: string;
  listing_type: ListingType;
  category_id?: string;
  base_price: number;
  meta_title: string;
  meta_desc: string;
  features: string[];
  tech_stack: string[];
  estimated_days: number;
  auto_delivery: boolean;
  is_featured: boolean;
  is_active: boolean;
  sort_order: number;
  total_orders: number;
  avg_rating: number;
  review_count: number;
  created_at: string;
  updated_at: string;
  category?: ListingCategory;
  packages?: Package[];
  faq?: FAQ[];
}

export interface ListingCategory {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
  sort_order: number;
  is_active: boolean;
}

export interface Package {
  id: string;
  listing_id: string;
  name: string;
  description: string;
  price: number;
  features: string[];
  estimated_days: number;
  max_revisions: number;
  sort_order: number;
  is_active: boolean;
}

export interface FAQ {
  id: string;
  listing_id: string;
  question: string;
  answer: string;
  sort_order: number;
}

export interface ListingListResult {
  items: Listing[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

// ── Orders ───────────────────────────────────────────

export type OrderStatus =
  | "PENDING_PAYMENT"
  | "PAID"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "EXPIRED"
  | "CANCELLED"
  | "REFUNDED";

export interface OrderResponse {
  order_number: string;
  status: OrderStatus;
  total_amount: number;
  payment?: PaymentInfo;
  tracking_url: string;
}

export interface PaymentInfo {
  method_name: string;
  gateway: string;
  payment_url?: string;
  qr_url?: string;
  pay_code?: string;
  expires_at?: string;
  status: string;
}

export interface OrderSummary {
  order_number: string;
  listing_title: string;
  package_name?: string;
  total_amount: number;
  status: OrderStatus;
  created_at: string;
}

export interface OrderDetail {
  id: string;
  order_number: string;
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string;
  listing_id: string;
  listing_title: string;
  package_name: string;
  listing_type: string;
  amount: number;
  currency: string;
  buyer_notes?: string;
  status: OrderStatus;
  paid_at?: string;
  delivery_method?: string;
  delivery_sent_at?: string;
  download_url?: string;
  download_expires_at?: string;
  download_count?: number;
  max_downloads?: number;
  deliverable_url?: string;
  deliverable_notes?: string;
  created_at: string;
  payment?: PaymentTransaction;
}

export interface PaymentTransaction {
  id: string;
  gateway: string;
  method_name: string;
  amount: number;
  fee: number;
  total: number;
  pay_code?: string;
  payment_url?: string;
  qr_url?: string;
  status: string;
  expires_at?: string;
  paid_at?: string;
}

// ── Portfolio ────────────────────────────────────────

export interface PortfolioItem {
  id: string;
  listing_id?: string;
  title: string;
  description: string;
  preview_type: "IFRAME" | "SCREENSHOT" | "VIDEO";
  preview_url: string;
  desktop_screenshot: string;
  mobile_screenshot: string;
  client_name: string;
  tech_stack: string[];
  is_featured: boolean;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  images?: PortfolioImage[];
  listing_title?: string;
}

export interface PortfolioImage {
  id: string;
  portfolio_id: string;
  url: string;
  alt_text: string;
  sort_order: number;
}

export interface PortfolioListResult {
  items: PortfolioItem[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

// ── Payment ──────────────────────────────────────────

export interface PaymentMethod {
  id: string;
  gateway: string;
  code: string;
  name: string;
  icon_url: string;
  fee_flat: number;
  fee_percent: number;
  min_amount: number;
  max_amount: number;
  is_active: boolean;
  sort_order: number;
}

// ── Reviews ──────────────────────────────────────────

export interface Review {
  id: string;
  listing_id: string;
  order_id: string;
  reviewer_name: string;
  reviewer_email: string;
  rating: number;
  content: string;
  is_verified: boolean;
  is_visible: boolean;
  listing_title?: string;
  created_at: string;
}

// ── Store Content (admin-managed landing page) ──────

export interface StoreHeroContent {
  badge: string;
  title_prefix: string;
  title_suffix: string;
  typing_words: string[];
  subtitle: string;
  cta_primary: string;
  cta_secondary: string;
  rating: string;
  projects_done: string;
  speed_text: string;
  note: string;
}

export interface StoreTrustBadgesContent {
  row1: string[];
  row2: string[];
}

export interface StoreProblemItem {
  icon: string;
  text: string;
}

export interface StoreProblemsContent {
  icon: string;
  title: string;
  subtitle: string;
  items: StoreProblemItem[];
  agitation: string;
}

export interface StoreComparisonTier {
  label: string;
  price: string;
  items: string[];
  is_pro: boolean;
  highlight?: boolean;
  badge?: string;
}

export interface StoreComparisonContent {
  title: string;
  subtitle: string;
  tiers: StoreComparisonTier[];
}

export interface StoreFAQItem {
  q: string;
  a: string;
}

export interface StoreFAQContent {
  icon: string;
  title: string;
  items: StoreFAQItem[];
}

export interface StoreCTAContent {
  icon: string;
  title: string;
  subtitle: string;
  cta_primary: string;
  cta_secondary: string;
  note: string;
}

export interface StorePricingPlan {
  name: string;
  price: number;
  original_price: number;
  discount: number;
  features: string[];
  bonuses: string[];
  cta: string;
  popular: boolean;
}

export interface StorePricingContent {
  icon: string;
  title: string;
  subtitle: string;
  plans: StorePricingPlan[];
}

export interface StoreTestimonialsContent {
  icon: string;
  title: string;
  subtitle: string;
  empty_text: string;
}

export interface StoreStickyCtaContent {
  text: string;
  href: string;
}

export interface StoreContent {
  store_hero?: StoreHeroContent;
  store_trust_badges?: StoreTrustBadgesContent;
  store_problems?: StoreProblemsContent;
  store_comparison?: StoreComparisonContent;
  store_faq?: StoreFAQContent;
  store_cta?: StoreCTAContent;
  store_pricing?: StorePricingContent;
  store_testimonials?: StoreTestimonialsContent;
  store_sticky_cta?: StoreStickyCtaContent;
}
