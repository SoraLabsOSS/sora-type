import type { GridProps } from "@/components/og/grid";
import { getMetadataBaseUrl, SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

export function getSiteOgContent(): GridProps {
  return {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    brand: SITE_NAME,
    logo: `${getMetadataBaseUrl()}/android-chrome-192x192.png`,
  };
}
