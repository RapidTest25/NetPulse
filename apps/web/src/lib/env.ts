// Environment variable helpers

export function getEnv(key: string, fallback = ""): string {
  return process.env[key] || fallback;
}

export const env = {
  apiUrl: getEnv("NEXT_PUBLIC_API_URL", "http://localhost:8080"),
  siteUrl: getEnv("NEXT_PUBLIC_SITE_URL", "http://localhost:3000"),
  isProd: process.env.NODE_ENV === "production",
};
