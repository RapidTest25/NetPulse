"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { adminAPI } from "@/lib/auth-api";

/* ── Section config ─────────────────────── */
const SECTIONS = [
  { key: "store_hero", label: "Hero", icon: "🚀" },
  { key: "store_trust_badges", label: "Trust Badges", icon: "🏅" },
  { key: "store_problems", label: "Masalah", icon: "⚠️" },
  { key: "store_comparison", label: "Perbandingan", icon: "⚖️" },
  { key: "store_faq", label: "FAQ", icon: "❓" },
  { key: "store_cta", label: "CTA", icon: "📣" },
  { key: "store_pricing", label: "Harga", icon: "💰" },
  { key: "store_testimonials", label: "Testimoni", icon: "⭐" },
  { key: "store_sticky_cta", label: "Sticky CTA", icon: "📌" },
] as const;

type SectionKey = (typeof SECTIONS)[number]["key"];

const STORE_URL = process.env.NEXT_PUBLIC_STORE_URL || "http://localhost:3001";

/* ── Toast ─────────────────────────────── */
function Toast({
  toast,
  onClose,
}: {
  toast: { type: "success" | "error"; msg: string };
  onClose: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      className={`fixed right-6 top-6 z-50 flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-medium text-white shadow-lg transition-all ${
        toast.type === "success" ? "bg-green-500" : "bg-red-500"
      }`}
    >
      {toast.type === "success" ? "✅" : "❌"} {toast.msg}
      <button onClick={onClose} className="ml-2 text-white/70 hover:text-white">
        ✕
      </button>
    </div>
  );
}

/* ── Hero Editor ───────────────────────── */
function HeroEditor({
  data,
  onChange,
}: {
  data: any;
  onChange: (d: any) => void;
}) {
  const u = (k: string, v: any) => onChange({ ...data, [k]: v });
  return (
    <div className="space-y-4">
      <Field label="Badge" value={data.badge} onChange={(v) => u("badge", v)} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Title Prefix" value={data.title_prefix} onChange={(v) => u("title_prefix", v)} />
        <Field label="Title Suffix" value={data.title_suffix} onChange={(v) => u("title_suffix", v)} />
      </div>
      <ArrayField label="Typing Words" value={data.typing_words || []} onChange={(v) => u("typing_words", v)} />
      <TextArea label="Subtitle (gunakan **bold**)" value={data.subtitle} onChange={(v) => u("subtitle", v)} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="CTA Primer" value={data.cta_primary} onChange={(v) => u("cta_primary", v)} />
        <Field label="CTA Sekunder" value={data.cta_secondary} onChange={(v) => u("cta_secondary", v)} />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Rating" value={data.rating} onChange={(v) => u("rating", v)} />
        <Field label="Projek Selesai" value={data.projects_done} onChange={(v) => u("projects_done", v)} />
        <Field label="Kecepatan" value={data.speed_text} onChange={(v) => u("speed_text", v)} />
      </div>
      <Field label="Catatan" value={data.note} onChange={(v) => u("note", v)} />
    </div>
  );
}

/* ── Trust Badges Editor ───────────────── */
function TrustBadgesEditor({
  data,
  onChange,
}: {
  data: any;
  onChange: (d: any) => void;
}) {
  return (
    <div className="space-y-4">
      <ArrayField label="Baris 1" value={data.row1 || []} onChange={(v) => onChange({ ...data, row1: v })} />
      <ArrayField label="Baris 2" value={data.row2 || []} onChange={(v) => onChange({ ...data, row2: v })} />
    </div>
  );
}

/* ── Problems Editor ───────────────────── */
function ProblemsEditor({
  data,
  onChange,
}: {
  data: any;
  onChange: (d: any) => void;
}) {
  const u = (k: string, v: any) => onChange({ ...data, [k]: v });
  const items: { icon: string; text: string }[] = data.items || [];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Icon" value={data.icon} onChange={(v) => u("icon", v)} />
        <Field label="Title" value={data.title} onChange={(v) => u("title", v)} />
      </div>
      <Field label="Subtitle" value={data.subtitle} onChange={(v) => u("subtitle", v)} />

      <div>
        <label className="mb-1 block text-xs font-semibold text-gray-500 uppercase">Items</label>
        {items.map((item, i) => (
          <div key={i} className="mb-2 flex gap-2">
            <input
              className="w-16 shrink-0 rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
              value={item.icon}
              onChange={(e) => {
                const next = [...items];
                next[i] = { ...item, icon: e.target.value };
                u("items", next);
              }}
              placeholder="Icon"
            />
            <input
              className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm"
              value={item.text}
              onChange={(e) => {
                const next = [...items];
                next[i] = { ...item, text: e.target.value };
                u("items", next);
              }}
              placeholder="Teks"
            />
            <button
              onClick={() => u("items", items.filter((_, j) => j !== i))}
              className="rounded-lg px-2 text-red-400 hover:bg-red-50"
            >
              ✕
            </button>
          </div>
        ))}
        <button
          onClick={() => u("items", [...items, { icon: "😤", text: "" }])}
          className="text-sm font-medium text-indigo-500 hover:text-indigo-700"
        >
          + Tambah Item
        </button>
      </div>

      <TextArea
        label="Agitasi (gunakan **bold**)"
        value={data.agitation}
        onChange={(v) => u("agitation", v)}
      />
    </div>
  );
}

/* ── Comparison Editor ─────────────────── */
function ComparisonEditor({
  data,
  onChange,
}: {
  data: any;
  onChange: (d: any) => void;
}) {
  const u = (k: string, v: any) => onChange({ ...data, [k]: v });
  const tiers: any[] = data.tiers || [];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Title" value={data.title} onChange={(v) => u("title", v)} />
        <Field label="Subtitle" value={data.subtitle} onChange={(v) => u("subtitle", v)} />
      </div>

      {tiers.map((tier, i) => (
        <div key={i} className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700">
              Tier {i + 1}: {tier.label}
            </span>
            <button
              onClick={() => u("tiers", tiers.filter((_, j) => j !== i))}
              className="text-xs text-red-400 hover:text-red-600"
            >
              Hapus
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Label" value={tier.label} onChange={(v) => { const n = [...tiers]; n[i] = { ...tier, label: v }; u("tiers", n); }} />
            <Field label="Harga" value={tier.price} onChange={(v) => { const n = [...tiers]; n[i] = { ...tier, price: v }; u("tiers", n); }} />
            <Field label="Badge" value={tier.badge || ""} onChange={(v) => { const n = [...tiers]; n[i] = { ...tier, badge: v }; u("tiers", n); }} />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={tier.is_pro}
              onChange={(e) => { const n = [...tiers]; n[i] = { ...tier, is_pro: e.target.checked }; u("tiers", n); }}
              className="rounded text-indigo-500"
            />
            <span className="text-sm text-gray-600">Pro (hijau)</span>
            <input
              type="checkbox"
              checked={tier.highlight}
              onChange={(e) => { const n = [...tiers]; n[i] = { ...tier, highlight: e.target.checked }; u("tiers", n); }}
              className="ml-4 rounded text-indigo-500"
            />
            <span className="text-sm text-gray-600">Highlight</span>
          </div>
          <ArrayField label="Items" value={tier.items || []} onChange={(v) => { const n = [...tiers]; n[i] = { ...tier, items: v }; u("tiers", n); }} />
        </div>
      ))}
      <button
        onClick={() =>
          u("tiers", [
            ...tiers,
            { label: "", price: "", items: [], is_pro: false, highlight: false, badge: "" },
          ])
        }
        className="text-sm font-medium text-indigo-500 hover:text-indigo-700"
      >
        + Tambah Tier
      </button>
    </div>
  );
}

/* ── FAQ Editor ────────────────────────── */
function FAQEditor({
  data,
  onChange,
}: {
  data: any;
  onChange: (d: any) => void;
}) {
  const u = (k: string, v: any) => onChange({ ...data, [k]: v });
  const items: { q: string; a: string }[] = data.items || [];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Icon" value={data.icon} onChange={(v) => u("icon", v)} />
        <Field label="Title" value={data.title} onChange={(v) => u("title", v)} />
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-gray-500 uppercase">Pertanyaan & Jawaban</label>
        {items.map((item, i) => (
          <div key={i} className="mb-3 rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-2">
            <div className="flex items-start justify-between">
              <span className="text-xs font-medium text-gray-400">#{i + 1}</span>
              <button
                onClick={() => u("items", items.filter((_, j) => j !== i))}
                className="text-xs text-red-400 hover:text-red-600"
              >
                Hapus
              </button>
            </div>
            <input
              className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm"
              value={item.q}
              onChange={(e) => {
                const next = [...items];
                next[i] = { ...item, q: e.target.value };
                u("items", next);
              }}
              placeholder="Pertanyaan"
            />
            <textarea
              className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm"
              rows={2}
              value={item.a}
              onChange={(e) => {
                const next = [...items];
                next[i] = { ...item, a: e.target.value };
                u("items", next);
              }}
              placeholder="Jawaban"
            />
          </div>
        ))}
        <button
          onClick={() => u("items", [...items, { q: "", a: "" }])}
          className="text-sm font-medium text-indigo-500 hover:text-indigo-700"
        >
          + Tambah FAQ
        </button>
      </div>
    </div>
  );
}

/* ── CTA Editor ────────────────────────── */
function CTAEditor({
  data,
  onChange,
}: {
  data: any;
  onChange: (d: any) => void;
}) {
  const u = (k: string, v: any) => onChange({ ...data, [k]: v });
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Icon" value={data.icon} onChange={(v) => u("icon", v)} />
        <Field label="Title" value={data.title} onChange={(v) => u("title", v)} />
      </div>
      <TextArea label="Subtitle" value={data.subtitle} onChange={(v) => u("subtitle", v)} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="CTA Primer" value={data.cta_primary} onChange={(v) => u("cta_primary", v)} />
        <Field label="CTA Sekunder" value={data.cta_secondary} onChange={(v) => u("cta_secondary", v)} />
      </div>
      <Field label="Catatan" value={data.note} onChange={(v) => u("note", v)} />
    </div>
  );
}

/* ── Pricing Editor ────────────────────── */
function PricingEditor({
  data,
  onChange,
}: {
  data: any;
  onChange: (d: any) => void;
}) {
  const u = (k: string, v: any) => onChange({ ...data, [k]: v });
  const plans: any[] = data.plans || [];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Icon" value={data.icon} onChange={(v) => u("icon", v)} />
        <Field label="Title" value={data.title} onChange={(v) => u("title", v)} />
      </div>
      <Field label="Subtitle" value={data.subtitle} onChange={(v) => u("subtitle", v)} />

      {plans.map((plan, i) => (
        <div key={i} className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700">
              {plan.name || `Paket ${i + 1}`}
            </span>
            <button
              onClick={() => u("plans", plans.filter((_, j) => j !== i))}
              className="text-xs text-red-400 hover:text-red-600"
            >
              Hapus
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Nama" value={plan.name} onChange={(v) => { const n = [...plans]; n[i] = { ...plan, name: v }; u("plans", n); }} />
            <Field label="CTA" value={plan.cta} onChange={(v) => { const n = [...plans]; n[i] = { ...plan, cta: v }; u("plans", n); }} />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <NumberField label="Harga" value={plan.price} onChange={(v) => { const n = [...plans]; n[i] = { ...plan, price: v }; u("plans", n); }} />
            <NumberField label="Harga Asli" value={plan.original_price} onChange={(v) => { const n = [...plans]; n[i] = { ...plan, original_price: v }; u("plans", n); }} />
            <NumberField label="Diskon (%)" value={plan.discount} onChange={(v) => { const n = [...plans]; n[i] = { ...plan, discount: v }; u("plans", n); }} />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={plan.popular}
              onChange={(e) => { const n = [...plans]; n[i] = { ...plan, popular: e.target.checked }; u("plans", n); }}
              className="rounded text-indigo-500"
            />
            <span className="text-sm text-gray-600">Populer</span>
          </div>
          <ArrayField label="Fitur" value={plan.features || []} onChange={(v) => { const n = [...plans]; n[i] = { ...plan, features: v }; u("plans", n); }} />
          <ArrayField label="Bonus" value={plan.bonuses || []} onChange={(v) => { const n = [...plans]; n[i] = { ...plan, bonuses: v }; u("plans", n); }} />
        </div>
      ))}
      <button
        onClick={() =>
          u("plans", [
            ...plans,
            {
              name: "",
              price: 0,
              original_price: 0,
              discount: 0,
              features: [],
              bonuses: [],
              cta: "Pesan Sekarang",
              popular: false,
            },
          ])
        }
        className="text-sm font-medium text-indigo-500 hover:text-indigo-700"
      >
        + Tambah Paket
      </button>
    </div>
  );
}

/* ── Testimonials Editor ───────────────── */
function TestimonialsEditor({
  data,
  onChange,
}: {
  data: any;
  onChange: (d: any) => void;
}) {
  const u = (k: string, v: any) => onChange({ ...data, [k]: v });
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Icon" value={data.icon} onChange={(v) => u("icon", v)} />
        <Field label="Title" value={data.title} onChange={(v) => u("title", v)} />
      </div>
      <Field label="Subtitle" value={data.subtitle} onChange={(v) => u("subtitle", v)} />
      <Field label="Teks Kosong" value={data.empty_text} onChange={(v) => u("empty_text", v)} />
    </div>
  );
}

/* ── Sticky CTA Editor ─────────────────── */
function StickyCTAEditor({
  data,
  onChange,
}: {
  data: any;
  onChange: (d: any) => void;
}) {
  const u = (k: string, v: any) => onChange({ ...data, [k]: v });
  return (
    <div className="space-y-4">
      <Field label="Teks" value={data.text} onChange={(v) => u("text", v)} />
      <Field label="Link (href)" value={data.href} onChange={(v) => u("href", v)} />
    </div>
  );
}

/* ── Reusable field components ─────────── */
function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-gray-500 uppercase">{label}</label>
      <input
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-gray-500 uppercase">{label}</label>
      <input
        type="number"
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
        value={value ?? 0}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

function TextArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-gray-500 uppercase">{label}</label>
      <textarea
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
        rows={3}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function ArrayField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string[];
  onChange: (v: string[]) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-gray-500 uppercase">{label}</label>
      {value.map((item, i) => (
        <div key={i} className="mb-1.5 flex gap-2">
          <input
            className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
            value={item}
            onChange={(e) => {
              const next = [...value];
              next[i] = e.target.value;
              onChange(next);
            }}
          />
          <button
            onClick={() => onChange(value.filter((_, j) => j !== i))}
            className="rounded-lg px-2 text-red-400 hover:bg-red-50"
          >
            ✕
          </button>
        </div>
      ))}
      <button
        onClick={() => onChange([...value, ""])}
        className="text-xs font-medium text-indigo-500 hover:text-indigo-700"
      >
        + Tambah
      </button>
    </div>
  );
}

/* ── Editor dispatcher ─────────────────── */
function SectionEditor({
  sectionKey,
  data,
  onChange,
}: {
  sectionKey: SectionKey;
  data: any;
  onChange: (d: any) => void;
}) {
  if (!data) return <p className="text-sm text-gray-400">Memuat data...</p>;

  switch (sectionKey) {
    case "store_hero":
      return <HeroEditor data={data} onChange={onChange} />;
    case "store_trust_badges":
      return <TrustBadgesEditor data={data} onChange={onChange} />;
    case "store_problems":
      return <ProblemsEditor data={data} onChange={onChange} />;
    case "store_comparison":
      return <ComparisonEditor data={data} onChange={onChange} />;
    case "store_faq":
      return <FAQEditor data={data} onChange={onChange} />;
    case "store_cta":
      return <CTAEditor data={data} onChange={onChange} />;
    case "store_pricing":
      return <PricingEditor data={data} onChange={onChange} />;
    case "store_testimonials":
      return <TestimonialsEditor data={data} onChange={onChange} />;
    case "store_sticky_cta":
      return <StickyCTAEditor data={data} onChange={onChange} />;
    default:
      return <p className="text-sm text-gray-400">Editor tidak tersedia</p>;
  }
}

/* ── Main Page ─────────────────────────── */
export default function StoreContentPage() {
  const [content, setContent] = useState<Record<string, any>>({});
  const [activeTab, setActiveTab] = useState<SectionKey>("store_hero");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [dirty, setDirty] = useState<Set<string>>(new Set());
  const [showPreview, setShowPreview] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const [previewViewport, setPreviewViewport] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getStoreContent();
      // Parse JSON strings if needed
      const parsed: Record<string, any> = {};
      for (const [k, v] of Object.entries(data)) {
        if (typeof v === "string") {
          try {
            parsed[k] = JSON.parse(v);
          } catch {
            parsed[k] = v;
          }
        } else {
          parsed[k] = v;
        }
      }
      setContent(parsed);
    } catch (e: any) {
      setToast({ type: "error", msg: e.message || "Gagal memuat konten" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleChange = (key: string, value: any) => {
    setContent((prev) => ({ ...prev, [key]: value }));
    setDirty((prev) => new Set(prev).add(key));
  };

  const handleSave = async (key?: string) => {
    setSaving(true);
    try {
      const keysToSave = key ? [key] : Array.from(dirty);
      if (keysToSave.length === 0) {
        setToast({ type: "error", msg: "Tidak ada perubahan" });
        setSaving(false);
        return;
      }

      const payload: Record<string, any> = {};
      for (const k of keysToSave) {
        payload[k] = content[k];
      }
      await adminAPI.updateStoreContent(payload);
      setDirty((prev) => {
        const next = new Set(prev);
        keysToSave.forEach((k) => next.delete(k));
        return next;
      });
      setToast({ type: "success", msg: `${keysToSave.length} seksi berhasil disimpan!` });
      // Auto-refresh preview after save
      setTimeout(() => setPreviewKey((k) => k + 1), 500);
    } catch (e: any) {
      setToast({ type: "error", msg: e.message || "Gagal menyimpan" });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAll = () => handleSave();
  const handleSaveSection = () => handleSave(activeTab);

  const viewportWidths = { desktop: "100%", tablet: "768px", mobile: "375px" };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-500" />
      </div>
    );
  }

  const activeSection = SECTIONS.find((s) => s.key === activeTab)!;

  return (
    <div className="space-y-6">
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Konten Toko</h1>
          <p className="mt-1 text-sm text-gray-500">
            Kelola teks, warna, dan konten yang tampil di halaman toko
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
              showPreview
                ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {showPreview ? "Tutup Preview" : "Live Preview"}
          </button>
          <a
            href={STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
            Buka Toko
          </a>
          <button
            onClick={handleSaveAll}
            disabled={saving || dirty.size === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-600 disabled:opacity-50"
          >
            {saving ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            Simpan Semua{dirty.size > 0 ? ` (${dirty.size})` : ""}
          </button>
        </div>
      </div>

      {/* Preview Panel */}
      {showPreview && (
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <span className="h-3 w-3 rounded-full bg-red-400" />
                <span className="h-3 w-3 rounded-full bg-yellow-400" />
                <span className="h-3 w-3 rounded-full bg-green-400" />
              </div>
              <span className="text-xs text-gray-400 font-mono">{STORE_URL}</span>
            </div>
            <div className="flex items-center gap-2">
              {/* Viewport toggles */}
              {(["desktop", "tablet", "mobile"] as const).map((vp) => (
                <button
                  key={vp}
                  onClick={() => setPreviewViewport(vp)}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                    previewViewport === vp
                      ? "bg-indigo-100 text-indigo-700"
                      : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {vp === "desktop" ? "💻" : vp === "tablet" ? "📱" : "📲"} {vp === "desktop" ? "Desktop" : vp === "tablet" ? "Tablet" : "Mobile"}
                </button>
              ))}
              <div className="ml-2 h-4 w-px bg-gray-200" />
              <button
                onClick={() => setPreviewKey((k) => k + 1)}
                className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                title="Refresh preview"
              >
                🔄 Refresh
              </button>
            </div>
          </div>
          <div className="flex justify-center bg-gray-100 p-4" style={{ minHeight: 500 }}>
            <iframe
              ref={iframeRef}
              key={previewKey}
              src={STORE_URL}
              className="rounded-lg border border-gray-200 bg-white shadow-sm transition-all duration-300"
              style={{
                width: viewportWidths[previewViewport],
                maxWidth: "100%",
                height: 600,
              }}
              title="Store Preview"
            />
          </div>
        </div>
      )}

      {/* Content grid */}
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        {/* Sidebar tabs */}
        <div className="rounded-2xl border border-gray-200 bg-white p-2 shadow-sm lg:sticky lg:top-24 lg:self-start">
          <div className="space-y-0.5">
            {SECTIONS.map((s) => {
              const isActive = activeTab === s.key;
              const isDirty = dirty.has(s.key);
              return (
                <button
                  key={s.key}
                  onClick={() => setActiveTab(s.key)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                    isActive
                      ? "bg-indigo-50 font-semibold text-indigo-700"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <span className="text-lg">{s.icon}</span>
                  <span className="flex-1">{s.label}</span>
                  {isDirty && (
                    <span className="h-2 w-2 rounded-full bg-orange-400" title="Ada perubahan" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick info */}
          <div className="mt-3 border-t border-gray-100 pt-3 px-3">
            <p className="text-xs text-gray-400">
              💡 Simpan lalu klik <strong>Refresh</strong> di preview untuk melihat perubahan.
            </p>
          </div>
        </div>

        {/* Editor area */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between border-b border-gray-100 pb-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{activeSection.icon}</span>
              <div>
                <h2 className="text-lg font-bold text-gray-900">{activeSection.label}</h2>
                <p className="text-xs text-gray-400">
                  Kunci: <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">{activeTab}</code>
                </p>
              </div>
            </div>

            <button
              onClick={handleSaveSection}
              disabled={saving || !dirty.has(activeTab)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-600 disabled:opacity-50"
            >
              {saving ? "Menyimpan..." : "Simpan Seksi"}
            </button>
          </div>

          <SectionEditor
            sectionKey={activeTab}
            data={content[activeTab]}
            onChange={(d) => handleChange(activeTab, d)}
          />
        </div>
      </div>
    </div>
  );
}
