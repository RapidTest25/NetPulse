"use client";

import { useState } from "react";
import type { PortfolioItem } from "@/types";
import LivePreviewModal from "@/components/LivePreviewModal";

export default function PortfolioGrid({ items }: { items: PortfolioItem[] }) {
  const [previewItem, setPreviewItem] = useState<PortfolioItem | null>(null);

  return (
    <>
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-lg"
          >
            {/* Screenshot */}
            <div className="relative aspect-video overflow-hidden bg-gray-100">
              {item.desktop_screenshot ? (
                <img
                  src={item.desktop_screenshot}
                  alt={item.title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-5xl text-gray-200">
                  🖼️
                </div>
              )}

              {/* Hover overlay with modal trigger */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <button
                  onClick={() => setPreviewItem(item)}
                  className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-brand-600 shadow-lg transition-transform hover:scale-105"
                >
                  Live Preview 🔗
                </button>
              </div>
            </div>

            {/* Info */}
            <div className="p-4">
              <h3 className="font-semibold text-gray-900">{item.title}</h3>
              {item.client_name && (
                <p className="mt-1 text-xs text-gray-400">
                  Client: {item.client_name}
                </p>
              )}
              {item.tech_stack && item.tech_stack.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {item.tech_stack.slice(0, 4).map((t) => (
                    <span
                      key={t}
                      className="rounded-md bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-600"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Live Preview Modal */}
      {previewItem && (
        <LivePreviewModal
          item={previewItem}
          onClose={() => setPreviewItem(null)}
        />
      )}
    </>
  );
}
