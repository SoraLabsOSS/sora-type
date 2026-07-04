/**
 * Runs compareAccuracy against every font file in a folder and prints any
 * discrepancies found — where a cmap-only check (FontDrop-style) would
 * claim language support that the shaping-verified engine says fails.
 *
 * Usage: bun run scripts/benchmark-accuracy.ts <fonts-dir> [language-codes...]
 */

import { readdirSync, readFileSync } from "node:fs";
import { extname, join } from "node:path";
import { create as createFont } from "fontkit";
import { compareAccuracy } from "@/lib/font-benchmark";

const FONT_EXTENSIONS = new Set([".ttf", ".otf", ".woff", ".woff2"]);

const fontsDir = process.argv[2];
if (!fontsDir) {
  console.error(
    "Usage: bun run scripts/benchmark-accuracy.ts <fonts-dir> [language-codes...]"
  );
  process.exit(1);
}

const languageCodes = process.argv.slice(3);

const fontFiles = readdirSync(fontsDir).filter((f) =>
  FONT_EXTENSIONS.has(extname(f).toLowerCase())
);

if (fontFiles.length === 0) {
  console.error(`No font files found in ${fontsDir}`);
  process.exit(1);
}

let totalDiscrepancies = 0;

for (const file of fontFiles) {
  const path = join(fontsDir, file);
  const buf = readFileSync(path);
  const arrayBuffer = buf.buffer.slice(
    buf.byteOffset,
    buf.byteOffset + buf.byteLength
  );

  let discrepancies: ReturnType<typeof compareAccuracy>;
  try {
    const opened = createFont(buf);
    const font = "fonts" in opened ? opened.fonts[0] : opened;
    const results = compareAccuracy(
      font,
      arrayBuffer,
      languageCodes.length > 0 ? languageCodes : undefined
    );
    discrepancies = results.filter((r) => r.discrepancy);
  } catch (err) {
    console.warn(`Skipping ${file}: ${(err as Error).message}`);
    continue;
  }

  if (discrepancies.length === 0) {
    console.log(`${file}: no discrepancies`);
    continue;
  }

  console.log(`${file}: ${discrepancies.length} discrepancy(ies)`);
  for (const d of discrepancies) {
    console.log(
      `  - ${d.name} (${d.code}, ${d.script}): cmap-only says supported, ` +
        `shaping-verified says "${d.shapingVerifiedSupport}"`
    );
  }
  totalDiscrepancies += discrepancies.length;
}

console.log(
  `\nTotal: ${totalDiscrepancies} discrepancy(ies) across ${fontFiles.length} font(s).`
);
