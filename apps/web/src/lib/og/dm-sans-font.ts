export const OG_FONT_FAMILY = "DM Sans";

const DM_SANS_MEDIUM_URL =
  "https://fonts.gstatic.com/s/dmsans/v17/rP2tp2ywxg089UriI5-g4vlH9VoD8CmcqZG40F9JadbnoEwAkJxhTg.ttf";

const DM_SANS_SEMIBOLD_URL =
  "https://fonts.gstatic.com/s/dmsans/v17/rP2tp2ywxg089UriI5-g4vlH9VoD8CmcqZG40F9JadbnoEwAfJthTg.ttf";

let mediumData: Promise<ArrayBuffer> | undefined;
let semiboldData: Promise<ArrayBuffer> | undefined;

async function fetchFont(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch OG font (${response.status})`);
  }

  return response.arrayBuffer();
}

export function getOgDmSansFontData(weight: 500 | 600): Promise<ArrayBuffer> {
  if (weight === 500) {
    mediumData ??= fetchFont(DM_SANS_MEDIUM_URL);
    return mediumData;
  }

  semiboldData ??= fetchFont(DM_SANS_SEMIBOLD_URL);
  return semiboldData;
}
