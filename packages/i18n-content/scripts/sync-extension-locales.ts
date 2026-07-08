import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { locales } from "../src/get-messages";

const packageRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const outDir = join(packageRoot, "..", "..", "apps", "extension", "locales");

/**
 * WXT's plural syntax (`{ 0, 1, n }`) differs from the CLDR-style
 * `{ zero, one, other }` shape we'd author plurals in in the source JSON.
 * This walks the tree and rewrites any plural object it finds. No source
 * namespace uses plurals yet, so this is currently a no-op passthrough —
 * kept so adding a plural key later doesn't require touching this script.
 */
function toWxtFormat(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(toWxtFormat);
  }
  if (value === null || typeof value !== "object") {
    return value;
  }
  const entries = Object.entries(value as Record<string, unknown>);
  const isCldrPlural = entries.some(([key]) =>
    ["zero", "one", "few", "many", "other"].includes(key)
  );
  if (isCldrPlural) {
    const cldr = value as Record<string, string>;
    return {
      ...(cldr.zero !== undefined && { 0: cldr.zero }),
      ...(cldr.one !== undefined && { 1: cldr.one }),
      n: cldr.other,
    };
  }
  return Object.fromEntries(
    entries.map(([key, nested]) => [key, toWxtFormat(nested)])
  );
}

async function main() {
  await mkdir(outDir, { recursive: true });

  for (const locale of locales) {
    const source = (
      await import(`../src/locales/${locale}/extension.json`, {
        with: { type: "json" },
      })
    ).default;
    const converted = toWxtFormat(source);
    await writeFile(
      join(outDir, `${locale}.json`),
      `${JSON.stringify(converted, null, 2)}\n`
    );
  }
}

await main();
