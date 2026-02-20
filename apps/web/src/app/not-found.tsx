import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-white to-sky-50 px-4">
      {/* Illustration */}
      <div className="relative mb-8">
        <div className="text-[160px] font-black leading-none tracking-tight text-gray-100 sm:text-[220px]">
          404
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="rounded-2xl bg-white/80 px-6 py-3 shadow-lg backdrop-blur-sm">
            <svg
              className="mx-auto h-12 w-12 text-sky-500"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Text */}
      <h1 className="mb-2 text-center text-2xl font-bold text-gray-900 sm:text-3xl">
        Halaman Tidak Ditemukan
      </h1>
      <p className="mb-8 max-w-md text-center text-sm text-gray-500 sm:text-base">
        Maaf, halaman yang Anda cari tidak ada atau sudah dipindahkan. Silakan
        kembali ke beranda atau gunakan navigasi di atas.
      </p>

      {/* Actions */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-sky-700"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
            />
          </svg>
          Kembali ke Beranda
        </Link>
        <Link
          href="/blog"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
            />
          </svg>
          Jelajahi Artikel
        </Link>
      </div>

      {/* Decorative dots */}
      <div className="mt-16 flex gap-1.5">
        <div className="h-2 w-2 rounded-full bg-sky-200" />
        <div className="h-2 w-2 rounded-full bg-sky-300" />
        <div className="h-2 w-2 rounded-full bg-sky-400" />
      </div>
    </div>
  );
}
