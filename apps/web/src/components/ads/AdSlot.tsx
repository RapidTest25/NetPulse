"use client";

import { useState, useEffect, useRef } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

interface AdSlotData {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
  position: string;
}

// Global cache to avoid re-fetching on every component mount
let adsCache: AdSlotData[] | null = null;
let adsFetchPromise: Promise<AdSlotData[]> | null = null;

async function fetchActiveAds(): Promise<AdSlotData[]> {
  if (adsCache) return adsCache;
  if (adsFetchPromise) return adsFetchPromise;

  adsFetchPromise = fetch(`${API_URL}/ads/active`)
    .then((r) => (r.ok ? r.json() : { items: [] }))
    .then((data): AdSlotData[] => {
      adsCache = data.items || [];
      return adsCache!;
    })
    .catch((): AdSlotData[] => {
      adsCache = [];
      return [];
    })
    .finally(() => {
      // Allow refetch after 5 minutes
      setTimeout(
        () => {
          adsCache = null;
          adsFetchPromise = null;
        },
        5 * 60 * 1000,
      );
    });

  return adsFetchPromise;
}

interface AdSlotProps {
  position: string; // e.g. "header", "in_article_1", "sidebar", "footer"
  className?: string;
  fallback?: React.ReactNode; // Shown when no ad available
}

export function AdSlot({ position, className = "", fallback }: AdSlotProps) {
  const [ad, setAd] = useState<AdSlotData | null>(null);
  const [loaded, setLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchActiveAds().then((ads) => {
      const match = ads.find((a) => a.position === position);
      setAd(match || null);
      setLoaded(true);
    });
  }, [position]);

  // Execute ad scripts when the ad code is inserted
  useEffect(() => {
    if (!ad?.code || !containerRef.current) return;

    // Parse and execute any script tags in the ad code
    const container = containerRef.current;
    const scripts = container.querySelectorAll("script");
    scripts.forEach((oldScript) => {
      const newScript = document.createElement("script");
      Array.from(oldScript.attributes).forEach((attr) =>
        newScript.setAttribute(attr.name, attr.value),
      );
      newScript.textContent = oldScript.textContent;
      oldScript.parentNode?.replaceChild(newScript, oldScript);
    });
  }, [ad?.code]);

  if (!loaded) return null;

  if (!ad || !ad.code) {
    return fallback ? <>{fallback}</> : null;
  }

  return (
    <div className={`ad-slot ad-slot-${position} ${className}`}>
      <div ref={containerRef} dangerouslySetInnerHTML={{ __html: ad.code }} />
    </div>
  );
}

// Convenience components for common positions
export function HeaderAd({ className }: { className?: string }) {
  return (
    <AdSlot
      position="header"
      className={className}
      fallback={
        <div className="border-b border-gray-100 bg-gray-50/50">
          <div className="mx-auto max-w-4xl px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white px-4 py-6 text-center">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
                  Advertisement
                </p>
                <div className="mt-1 text-xs text-gray-300">
                  Banner Ad — 728×90
                </div>
              </div>
            </div>
          </div>
        </div>
      }
    />
  );
}

export function InArticleAd({
  index = 1,
  className,
}: {
  index?: number;
  className?: string;
}) {
  return (
    <AdSlot
      position={`in_article_${index}`}
      className={className}
      fallback={
        <div className="my-8 rounded-xl border border-dashed border-gray-200 bg-gray-50/50 px-4 py-8 text-center">
          <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
            Advertisement
          </p>
          <div className="mt-1 text-xs text-gray-300">
            In-Article Ad — Responsive
          </div>
        </div>
      }
    />
  );
}

export function SidebarAd({
  index = 1,
  className,
}: {
  index?: number;
  className?: string;
}) {
  return (
    <AdSlot
      position={`sidebar${index > 1 ? `_${index}` : ""}`}
      className={className}
      fallback={
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 p-4 text-center">
          <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
            Advertisement
          </p>
          <div className="flex aspect-300/250 items-center justify-center rounded-lg bg-linear-to-br from-gray-100 to-gray-50">
            <span className="text-xs text-gray-300">300 × 250</span>
          </div>
        </div>
      }
    />
  );
}

export function FooterAd({ className }: { className?: string }) {
  return (
    <AdSlot
      position="footer"
      className={className}
      fallback={
        <div className="mx-auto max-w-4xl">
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 px-4 py-6 text-center">
            <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
              Advertisement
            </p>
            <div className="mt-1 text-xs text-gray-300">
              728 × 90 — Bottom Banner
            </div>
          </div>
        </div>
      }
    />
  );
}

/**
 * Splits HTML content and inserts ad slots at configurable paragraph intervals.
 * Used to insert in-article ads within the body of an article.
 */
export function ArticleBodyWithAds({
  html,
  adInterval = 4,
}: {
  html: string;
  adInterval?: number;
}) {
  // Split HTML into paragraphs
  const parts: string[] = [];
  const adPositions: number[] = [];

  // Simple paragraph splitting - split on </p> tags
  const paragraphs = html.split(/<\/p>/i).filter((p) => p.trim());

  let currentPart = "";
  let paragraphCount = 0;
  let adIndex = 1;

  for (let i = 0; i < paragraphs.length; i++) {
    currentPart += paragraphs[i] + "</p>";
    paragraphCount++;

    if (paragraphCount >= adInterval && i < paragraphs.length - 2) {
      parts.push(currentPart);
      adPositions.push(adIndex);
      adIndex++;
      currentPart = "";
      paragraphCount = 0;
    }
  }

  // Add remaining content
  if (currentPart.trim()) {
    parts.push(currentPart);
  }

  return (
    <div>
      {parts.map((part, i) => (
        <div key={i}>
          <div
            className="prose prose-lg mx-auto max-w-none"
            dangerouslySetInnerHTML={{ __html: part }}
          />
          {adPositions[i] && (
            <InArticleAd index={adPositions[i]} className="my-8" />
          )}
        </div>
      ))}
    </div>
  );
}
