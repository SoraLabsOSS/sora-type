import { ImageResponse } from "next/og";
import { Grid, type GridProps } from "@/components/og/grid";
import { getOgDmSansFontData, OG_FONT_FAMILY } from "@/lib/og/dm-sans-font";

export const OG_IMAGE_SIZE = { width: 1200, height: 630 } as const;

export async function createOgImageResponse(
  content: GridProps
): Promise<ImageResponse> {
  const [medium, semibold] = await Promise.all([
    getOgDmSansFontData(500),
    getOgDmSansFontData(600),
  ]);

  return new ImageResponse(
    <div
      style={{
        display: "flex",
        fontFamily: OG_FONT_FAMILY,
        height: "100%",
        width: "100%",
      }}
    >
      <Grid {...content} />
    </div>,
    {
      ...OG_IMAGE_SIZE,
      fonts: [
        {
          name: OG_FONT_FAMILY,
          data: medium,
          style: "normal",
          weight: 500,
        },
        {
          name: OG_FONT_FAMILY,
          data: semibold,
          style: "normal",
          weight: 600,
        },
      ],
    }
  );
}
