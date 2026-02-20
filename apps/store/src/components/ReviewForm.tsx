"use client";

import { useState } from "react";
import { submitReview } from "@/lib/api";

type Props = {
  orderNumber: string;
  listingId: string;
};

export default function ReviewForm({ orderNumber, listingId }: Props) {
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");
  const [name, setName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) {
      setError("Tulis ulasan Anda.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      await submitReview(listingId, {
        rating,
        content: content.trim(),
        reviewer_name: name.trim() || "Anonim",
        order_number: orderNumber,
      });
      setSubmitted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal mengirim ulasan.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="rounded-xl bg-white p-6 shadow-sm text-center">
        <div className="text-3xl">🎉</div>
        <h3 className="mt-2 font-semibold text-gray-900">Terima kasih atas ulasan Anda!</h3>
        <p className="mt-1 text-sm text-gray-500">
          Ulasan akan ditampilkan setelah diverifikasi.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl bg-white p-6 shadow-sm space-y-4">
      <h3 className="font-semibold text-gray-900">⭐ Beri Ulasan</h3>

      {/* Star rating */}
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            className={`text-2xl transition-colors ${
              star <= rating ? "text-yellow-400" : "text-gray-300"
            }`}
          >
            ★
          </button>
        ))}
        <span className="ml-2 text-sm text-gray-500">{rating}/5</span>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700">Nama (opsional)</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nama Anda"
          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700">Ulasan *</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          placeholder="Ceritakan pengalaman Anda..."
          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          required
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
      >
        {loading ? "Mengirim..." : "Kirim Ulasan"}
      </button>
    </form>
  );
}
