import { Suspense } from "react";
import HeroSection from "@/components/sections/HeroSection";
import TrustBadges from "@/components/sections/TrustBadges";
import ProblemSection from "@/components/sections/ProblemSection";
import CategorySection from "@/components/sections/CategorySection";
import PortfolioSection from "@/components/sections/PortfolioSection";
import ComparisonSection from "@/components/sections/ComparisonSection";
import ListingSection from "@/components/sections/ListingSection";
import PricingSection from "@/components/sections/PricingSection";
import TestimonialSection from "@/components/sections/TestimonialSection";
import FAQSection from "@/components/sections/FAQSection";
import CTASection from "@/components/sections/CTASection";
import StickyCtaSection from "@/components/sections/StickyCtaSection";
import { getStoreContent } from "@/lib/api";
import type { StoreContent } from "@/types";

function SectionSkeleton() {
  return (
    <div className="py-16">
      <div className="mx-auto max-w-5xl px-4">
        <div className="mx-auto h-8 w-64 animate-pulse rounded bg-gray-200" />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 animate-pulse rounded-2xl bg-gray-100" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default async function HomePage() {
  let content: StoreContent = {};
  try {
    content = await getStoreContent();
  } catch {
    // Fall back to defaults in each section
  }

  return (
    <main>
      <HeroSection content={content.store_hero} />
      <TrustBadges content={content.store_trust_badges} />
      <ProblemSection content={content.store_problems} />
      <CategorySection />

      <Suspense fallback={<SectionSkeleton />}>
        <PortfolioSection />
      </Suspense>

      <ComparisonSection content={content.store_comparison} />

      <Suspense fallback={<SectionSkeleton />}>
        <ListingSection />
      </Suspense>

      <PricingSection content={content.store_pricing} />

      <Suspense fallback={<SectionSkeleton />}>
        <TestimonialSection content={content.store_testimonials} />
      </Suspense>

      <FAQSection content={content.store_faq} />
      <CTASection content={content.store_cta} />
      <StickyCtaSection content={content.store_sticky_cta} />
    </main>
  );
}
