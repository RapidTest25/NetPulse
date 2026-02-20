export default function NotFound() {
  return (
    <main className="flex min-h-[60vh] items-center justify-center bg-gray-50">
      <div className="text-center px-4">
        <h1 className="text-6xl font-extrabold text-brand-600">404</h1>
        <p className="mt-4 text-lg text-gray-600">
          Halaman yang Anda cari tidak ditemukan.
        </p>
        <a
          href="/"
          className="mt-6 inline-block rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700"
        >
          ← Kembali ke Beranda
        </a>
      </div>
    </main>
  );
}
