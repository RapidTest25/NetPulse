"use client";

import { useState, useRef, useEffect } from "react";

interface ChatMessage {
  id: string;
  from: "user" | "admin";
  text: string;
  time: string;
}

const AUTO_REPLIES: { pattern: RegExp; reply: string }[] = [
  {
    pattern: /harga|price|biaya|berapa/i,
    reply:
      "Harga layanan kami mulai dari Rp 50.000 untuk tugas akademik, Rp 75.000 untuk template, dan Rp 150.000 untuk landing page. Kamu bisa lihat detail lengkapnya di bagian Harga di halaman utama ya! 😊",
  },
  {
    pattern: /lama|waktu|berapa hari|deadline|kapan/i,
    reply:
      "Pengerjaan tergantung jenis layanan:\n• Landing Page: 3-5 hari\n• Website Fullstack: 7-14 hari\n• Produk Digital: Instant (auto delivery)\n• Tugas Akademik: 1-5 hari\n\nUntuk deadline mendesak, silakan langsung chat admin ya!",
  },
  {
    pattern: /revisi|garansi|gratis/i,
    reply:
      "Tentu! Setiap layanan kami include garansi revisi gratis. Untuk Landing Page 2x revisi, dan Website Fullstack unlimited revisi. Kami pastikan kamu puas dengan hasilnya! ✅",
  },
  {
    pattern: /bayar|payment|transfer|qris|dana|gopay/i,
    reply:
      "Kami menerima berbagai metode pembayaran:\n• QRIS (semua e-wallet)\n• Transfer Bank (BCA, BNI, BRI, Mandiri, BSI)\n• E-Wallet (Dana, GoPay, ShopeePay)\n\nPembayaran diproses otomatis, kamu langsung dapat konfirmasi! 💳",
  },
  {
    pattern: /cek|track|status|pesanan|order/i,
    reply:
      'Kamu bisa cek status pesanan di menu "Cek Pesanan" atau langsung klik link ini: /order/track. Masukkan nomor order, email, atau nomor telepon yang kamu pakai saat checkout.',
  },
];

const GREETING =
  "Halo! 👋 Selamat datang di NetPulse Studio. Ada yang bisa kami bantu?\n\nKamu bisa tanya seputar:\n• Harga & layanan\n• Waktu pengerjaan\n• Cara order & pembayaran\n• Status pesanan";

function getAutoReply(message: string): string {
  for (const { pattern, reply } of AUTO_REPLIES) {
    if (pattern.test(message)) return reply;
  }
  return "Terima kasih sudah menghubungi kami! 😊 Admin kami akan segera membalas pesanmu. Sementara itu, kamu bisa lihat-lihat layanan kami di halaman utama.";
}

function timeNow(): string {
  return new Date().toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function LiveChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "greeting",
      from: "admin",
      text: GREETING,
      time: timeNow(),
    },
  ]);
  const [input, setInput] = useState("");
  const [unread, setUnread] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      from: "user",
      text,
      time: timeNow(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    // Simulate admin reply after a short delay
    setTimeout(() => {
      const reply: ChatMessage = {
        id: `a-${Date.now()}`,
        from: "admin",
        text: getAutoReply(text),
        time: timeNow(),
      };
      setMessages((prev) => [...prev, reply]);
      if (!open) setUnread((u) => u + 1);
    }, 800);
  }

  return (
    <>
      {/* Chat Window */}
      {open && (
        <div className="fixed bottom-20 right-4 z-50 flex h-[28rem] w-80 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl sm:w-96 md:bottom-6 md:right-6">
          {/* Header */}
          <div className="flex items-center gap-3 bg-brand-600 px-4 py-3 text-white">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-lg">
              ⚡
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-brand-600 bg-green-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">NetPulse Support</p>
              <p className="text-xs text-brand-200">Online • Biasanya balas &lt;5 menit</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="flex h-7 w-7 items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white"
              aria-label="Tutup chat"
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 space-y-3 overflow-y-auto bg-gray-50 p-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    msg.from === "user"
                      ? "rounded-br-md bg-brand-600 text-white"
                      : "rounded-bl-md border border-gray-100 bg-white text-gray-700"
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>
                  <p
                    className={`mt-1 text-[10px] ${
                      msg.from === "user" ? "text-brand-200" : "text-gray-400"
                    }`}
                  >
                    {msg.time}
                  </p>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={handleSend}
            className="flex items-center gap-2 border-t border-gray-100 bg-white px-3 py-2.5"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ketik pesan..."
              className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-sm outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400"
            />
            <button
              type="submit"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm transition-colors hover:bg-brand-700"
              aria-label="Kirim pesan"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            </button>
          </form>
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={() => {
          setOpen(!open);
          setUnread(0);
        }}
        className="fixed bottom-20 right-4 z-50 flex h-13 w-13 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg transition-all hover:bg-brand-700 hover:shadow-xl md:bottom-6 md:right-6 md:h-14 md:w-14"
        aria-label="Live Chat"
      >
        {open ? (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        )}

        {/* Unread badge */}
        {!open && unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
    </>
  );
}
