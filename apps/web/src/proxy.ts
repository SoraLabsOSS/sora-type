import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Skip metadata image routes — they live at app/opengraph-image.tsx (no
  // file extension), so without this exclusion next-intl rewrites them into
  // /[locale]/[...rest] and they 404.
  matcher: "/((?!api|_next|_vercel|opengraph-image|twitter-image|.*\\..*).*)",
};
