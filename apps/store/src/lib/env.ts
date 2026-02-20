export const env = {
  apiURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080",
  siteURL: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3001",
  blogURL: process.env.NEXT_PUBLIC_BLOG_URL || "http://localhost:3000",
  waNumber: process.env.NEXT_PUBLIC_WA_NUMBER || "6281234567890",
} as const;
