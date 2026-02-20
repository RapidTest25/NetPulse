import clsx from "clsx";

export function cn(...inputs: (string | undefined | false | null)[]): string {
  return clsx(inputs);
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

export function statusLabel(status: string): string {
  const map: Record<string, string> = {
    PENDING_PAYMENT: "Menunggu Pembayaran",
    PAID: "Dibayar",
    IN_PROGRESS: "Sedang Dikerjakan",
    COMPLETED: "Selesai",
    EXPIRED: "Kadaluarsa",
    CANCELLED: "Dibatalkan",
    REFUNDED: "Refund",
  };
  return map[status] || status;
}

export function statusColor(status: string): string {
  const map: Record<string, string> = {
    PENDING_PAYMENT: "bg-yellow-100 text-yellow-800",
    PAID: "bg-blue-100 text-blue-800",
    IN_PROGRESS: "bg-indigo-100 text-indigo-800",
    COMPLETED: "bg-green-100 text-green-800",
    EXPIRED: "bg-gray-100 text-gray-600",
    CANCELLED: "bg-red-100 text-red-800",
    REFUNDED: "bg-orange-100 text-orange-800",
  };
  return map[status] || "bg-gray-100 text-gray-600";
}

export function ratingStars(rating: number): string {
  return "★".repeat(Math.round(rating)) + "☆".repeat(5 - Math.round(rating));
}
