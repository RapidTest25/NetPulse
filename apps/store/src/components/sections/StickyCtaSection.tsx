"use client";

import { useEffect, useState } from "react";
import type { StoreStickyCtaContent } from "@/types";

const defaults: StoreStickyCtaContent = {
  text: "⚡ Lihat Layanan Sekarang",
  href: "#layanan",
};

export default function StickyCtaSection({ content }: { content?: StoreStickyCtaContent }) {
  const d = content ?? defaults;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 400);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-gray-100 bg-white/95 px-4 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] backdrop-blur transition-transform duration-300 md:hidden ${
        visible ? "cta-visible" : "cta-hidden"
      }`}
    >
      <a
        href={d.href}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-brand-700 to-brand-500 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/30"
      >
        {d.text}
      </a>
    </div>
  );
}
