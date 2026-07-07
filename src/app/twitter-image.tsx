import {
  createOgImageResponse,
  OG_IMAGE_SIZE,
} from "@/lib/og/create-og-image-response";
import { getSiteOgContent } from "@/lib/og/site-og-content";
import { SITE_NAME } from "@/lib/site";

export const alt = SITE_NAME;
export const size = OG_IMAGE_SIZE;
export const contentType = "image/png";

export default async function Image() {
  return await createOgImageResponse(getSiteOgContent());
}
