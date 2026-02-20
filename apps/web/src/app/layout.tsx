import type { Metadata } from "next";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: {
    default: "NetPulse — Network & Internet Blog",
    template: "%s | NetPulse",
  },
  description:
    "Blog seputar network & dunia internet. Artikel tentang DNS, BGP, HTTP/3, cloud, security, dan teknologi jaringan lainnya.",
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: process.env.NEXT_PUBLIC_SITE_URL,
    siteName: "NetPulse",
  },
  twitter: {
    card: "summary_large_image",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-white text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}
