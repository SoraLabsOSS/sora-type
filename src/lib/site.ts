export const SITE_NAME = "Sora Type";

export const SITE_DESCRIPTION =
  "A browser-based font inspector — drag and drop OpenType or TrueType files to explore what's inside.";

/** Production site origin — used for sitemap, robots, and metadata. */
export const SITE_URL = "https://type.soralabs.io.vn" as const;

/**
 * Origin for resolving metadata and OG image URLs.
 * - Vercel production: `SITE_URL`
 * - Vercel preview: deployment host
 * - Dev: `NEXT_PUBLIC_SITE_URL` or localhost
 */
export function getMetadataBaseUrl(): string {
  if (process.env.VERCEL_ENV === "production") {
    return SITE_URL;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  if (process.env.NODE_ENV === "development") {
    return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  }

  return SITE_URL;
}
