import { NextResponse } from "next/server";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export async function GET() {
  const robotsTxt = `User-agent: *
Allow: /
Disallow: /admin/

Sitemap: ${SITE_URL}/api/sitemap
`;

  return new NextResponse(robotsTxt, {
    headers: {
      "Content-Type": "text/plain",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
