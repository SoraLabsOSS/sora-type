#!/usr/bin/env node
/**
 * CLI for gating CI builds on font language coverage.
 *
 * Usage:
 *   bun run bin/sora-type-check.ts <font-file> [--languages vi,th] [--min-support decomposed] [--json] [--fast]
 *
 * Exit code 1 if any requested --languages code falls below --min-support
 * (or isn't found at all in the font), else 0.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { create as createFont, type Font as FontkitFont } from "fontkit";
import {
  buildFontReport,
  exportReportAsJson,
  type SupportLevel,
} from "@/lib/engine";

const SUPPORT_RANK: Record<SupportLevel, number> = {
  full: 3,
  decomposed: 2,
  "positioning-failed": 1,
  none: 0,
};

function openFont(path: string): FontkitFont {
  const buf = readFileSync(path);
  const opened = createFont(buf);
  return "fonts" in opened ? opened.fonts[0] : opened;
}

export function runCli(argv: string[]): number {
  const { values, positionals } = parseArgs({
    args: argv,
    options: {
      languages: { type: "string" },
      "min-support": { type: "string", default: "full" },
      json: { type: "boolean", default: false },
      fast: { type: "boolean", default: false },
    },
    allowPositionals: true,
  });

  const fontPath = positionals[0];
  if (!fontPath) {
    console.error(
      "Usage: sora-type-check <font-file> [--languages vi,th] [--min-support decomposed] [--json] [--fast]"
    );
    return 1;
  }

  const minSupport = values["min-support"] as SupportLevel;
  if (!(minSupport in SUPPORT_RANK)) {
    console.error(
      `Invalid --min-support "${minSupport}". Expected one of: full, decomposed, positioning-failed, none.`
    );
    return 1;
  }

  const buf = readFileSync(fontPath);
  const font = openFont(fontPath);
  const arrayBuffer = buf.buffer.slice(
    buf.byteOffset,
    buf.byteOffset + buf.byteLength
  );

  const report = buildFontReport(
    font,
    values.fast ? undefined : arrayBuffer,
    fontPath,
    "all"
  );

  const requestedCodes = values.languages
    ? values.languages.split(",").map((c) => c.trim())
    : null;

  if (values.json) {
    console.log(exportReportAsJson(report));
  } else {
    console.log(`${report.font.fullName} (${report.font.fileName})`);
    console.log(
      `Full: ${report.summary.full}  Decomposed: ${report.summary.decomposed}  ` +
        `Positioning failed: ${report.summary.positioningFailed}  None: ${report.summary.none}`
    );
  }

  if (!requestedCodes) {
    return 0;
  }

  let failed = false;
  for (const code of requestedCodes) {
    const matches = report.languages.filter((l) => l.code === code);
    if (matches.length === 0) {
      console.error(`✗ ${code}: not found in language database`);
      failed = true;
      continue;
    }
    for (const match of matches) {
      const ok = SUPPORT_RANK[match.support] >= SUPPORT_RANK[minSupport];
      if (!ok) {
        failed = true;
      }
      const marker = ok ? "✓" : "✗";
      console.error(
        `${marker} ${match.name} (${code}, ${match.script}): ${match.support}`
      );
    }
  }

  return failed ? 1 : 0;
}

const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);

if (isMainModule) {
  process.exit(runCli(process.argv.slice(2)));
}
