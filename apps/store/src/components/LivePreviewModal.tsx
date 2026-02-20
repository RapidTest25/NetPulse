"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { PortfolioItem } from "@/types";

type Viewport = "desktop" | "tablet" | "mobile";

const VIEWPORTS: { key: Viewport; label: string; icon: string; width: string }[] = [
  { key: "desktop", label: "Desktop", icon: "💻", width: "100%" },
  { key: "tablet", label: "Tablet", icon: "📱", width: "768px" },
  { key: "mobile", label: "Mobile", icon: "📲", width: "375px" },
];

export default function LivePreviewModal({
  item,
  onClose,
}: {
  item: PortfolioItem;
  onClose: () => void;
}) {
  const [viewport, setViewport] = useState<Viewport>("desktop");
  const [imgIndex, setImgIndex] = useState(0);
  const [iframeStatus, setIframeStatus] = useState<"loading" | "loaded" | "blocked">("loading");
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Close on Escape
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", h);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", h);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  // Detect iframe being blocked by X-Frame-Options / CSP
  useEffect(() => {
    if (!item.preview_url || item.preview_type !== "IFRAME") return;

    const timeout = setTimeout(() => {
      // After 4s, if still "loading", it's likely blocked
      setIframeStatus((prev) => (prev === "loading" ? "blocked" : prev));
    }, 4000);

    return () => clearTimeout(timeout);
  }, [item.preview_url, item.preview_type]);

  const handleIframeLoad = useCallback(() => {
    // Check if iframe actually loaded content or was blocked
    try {
      const iframe = iframeRef.current;
      if (iframe) {
        // Try to access — if blocked, this throws or returns null/blank
        const doc = iframe.contentDocument;
        if (doc && doc.title === "") {
          // Could be blocked — give it a moment
          setTimeout(() => {
            try {
              const body = iframe.contentDocument?.body;
              if (!body || body.innerHTML === "" || body.childElementCount === 0) {
                setIframeStatus("blocked");
              } else {
                setIframeStatus("loaded");
              }
            } catch {
              setIframeStatus("blocked");
            }
          }, 500);
          return;
        }
      }
      setIframeStatus("loaded");
    } catch {
      // Cross-origin — iframe loaded successfully (different origin can't be accessed)
      setIframeStatus("loaded");
    }
  }, []);

  const images = [
    ...(item.desktop_screenshot ? [{ url: item.desktop_screenshot, alt: `${item.title} — Desktop` }] : []),
    ...(item.mobile_screenshot ? [{ url: item.mobile_screenshot, alt: `${item.title} — Mobile` }] : []),
    ...(item.images?.map((img) => ({ url: img.url, alt: img.alt_text || item.title })) ?? []),
  ];

  const isIframe = item.preview_type === "IFRAME" && item.preview_url;
  const vp = VIEWPORTS.find((v) => v.key === viewport)!;

  const nextImg = useCallback(() => setImgIndex((i) => (i + 1) % images.length), [images.length]);
  const prevImg = useCallback(() => setImgIndex((i) => (i - 1 + images.length) % images.length), [images.length]);

  /* ── Fallback view (when iframe is blocked) ── */
  const renderBlockedFallback = () => (
    <div className="flex flex-col items-center gap-6 px-4 text-center">
      {/* Screenshot preview if available */}
      {images.length > 0 ? (
        <div className="relative max-h-[55vh] overflow-hidden rounded-xl shadow-2xl">
          <img
            src={images[imgIndex].url}
            alt={images[imgIndex].alt}
            className="max-h-[55vh] max-w-full object-contain"
          />
          {images.length > 1 && (
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setImgIndex(i)}
                  className={`h-2 w-2 rounded-full transition ${i === imgIndex ? "bg-white shadow" : "bg-white/40"}`}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border-2 border-dashed border-white/20 p-16">
          <span className="text-7xl">🌐</span>
        </div>
      )}

      {/* Info message */}
      <div className="max-w-md space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-yellow-500/20 px-4 py-1.5 text-sm font-medium text-yellow-300">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          Preview Tidak Dapat Ditampilkan
        </div>
        <p className="text-sm leading-relaxed text-gray-400">
          Website ini memiliki proteksi keamanan yang mencegah preview dalam iframe.
          Klik tombol di bawah untuk membuka langsung di tab baru.
        </p>
        <a
          href={item.preview_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-brand-700 hover:shadow-xl"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
          </svg>
          Buka Website Langsung ↗
        </a>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-gray-900/95 backdrop-blur-sm">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="text-lg">🔗</span>
          <div>
            <h3 className="text-sm font-semibold text-white sm:text-base">
              Preview: {item.title}
            </h3>
            {item.client_name && (
              <p className="text-xs text-gray-400">Client: {item.client_name}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Viewport toggles — only for working iframe */}
          {isIframe && iframeStatus === "loaded" && (
            <div className="hidden items-center gap-1 rounded-lg bg-white/10 p-1 sm:flex">
              {VIEWPORTS.map((v) => (
                <button
                  key={v.key}
                  onClick={() => setViewport(v.key)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                    viewport === v.key
                      ? "bg-white text-gray-900 shadow"
                      : "text-gray-300 hover:text-white"
                  }`}
                >
                  {v.icon} {v.label}
                </button>
              ))}
            </div>
          )}

          {/* External link */}
          {item.preview_url && (
            <a
              href={item.preview_url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-white/10 px-3 py-2 text-xs font-medium text-white transition hover:bg-white/20"
            >
              Buka Tab Baru ↗
            </a>
          )}

          {/* Close */}
          <button
            onClick={onClose}
            className="rounded-lg bg-white/10 p-2 text-white transition hover:bg-white/20"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Preview area */}
      <div className="flex flex-1 items-center justify-center overflow-auto p-4">
        {isIframe && iframeStatus !== "blocked" ? (
          /* ── IFRAME preview ── */
          <div
            className="relative mx-auto h-full rounded-lg border-2 border-white/10 bg-white shadow-2xl transition-all duration-300"
            style={{
              width: vp.width,
              maxWidth: "100%",
            }}
          >
            {iframeStatus === "loading" && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <div className="text-center">
                  <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
                  <p className="mt-3 text-sm text-gray-500">Memuat preview...</p>
                </div>
              </div>
            )}
            <iframe
              ref={iframeRef}
              src={item.preview_url}
              className="h-full w-full"
              onLoad={handleIframeLoad}
              onError={() => setIframeStatus("blocked")}
              sandbox="allow-scripts allow-same-origin allow-popups"
              title={`Preview ${item.title}`}
            />
          </div>
        ) : isIframe && iframeStatus === "blocked" ? (
          /* ── Iframe blocked — show fallback ── */
          renderBlockedFallback()
        ) : (
          /* ── SCREENSHOT / IMAGE carousel ── */
          <div className="relative flex max-h-full max-w-full flex-col items-center">
            {images.length > 0 ? (
              <>
                <div className="relative max-h-[75vh] overflow-hidden rounded-xl shadow-2xl">
                  <img
                    src={images[imgIndex].url}
                    alt={images[imgIndex].alt}
                    className="max-h-[75vh] max-w-full object-contain"
                  />
                </div>

                {/* Nav arrows */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={prevImg}
                      className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-3 text-white backdrop-blur transition hover:bg-black/70"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                      </svg>
                    </button>
                    <button
                      onClick={nextImg}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-3 text-white backdrop-blur transition hover:bg-black/70"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                      </svg>
                    </button>

                    {/* Dots */}
                    <div className="mt-4 flex gap-2">
                      {images.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setImgIndex(i)}
                          className={`h-2 w-2 rounded-full transition ${
                            i === imgIndex ? "bg-white" : "bg-white/30"
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center gap-4 text-gray-400">
                <span className="text-6xl">🖼️</span>
                <p>Belum ada screenshot untuk project ini</p>
                {item.preview_url && (
                  <a
                    href={item.preview_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-brand-700"
                  >
                    Buka Website Langsung ↗
                  </a>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom bar with info */}
      <div className="border-t border-white/10 px-4 py-3 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {item.tech_stack && item.tech_stack.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {item.tech_stack.map((t) => (
                  <span
                    key={t}
                    className="rounded-md bg-white/10 px-2 py-0.5 text-xs font-medium text-gray-300"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>
          <a
            href="/#layanan"
            onClick={onClose}
            className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white shadow transition hover:bg-brand-700"
          >
            🛒 Pesan Jasa Serupa
          </a>
        </div>
      </div>
    </div>
  );
}
