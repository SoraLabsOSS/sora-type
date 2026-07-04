/**
 * Builds src/data/languages.json from the Hyperglot language database
 * (https://github.com/rosettatype/hyperglot).
 *
 * Usage:
 *   bun run scripts/build-language-db.ts              # auto-downloads Hyperglot's data
 *   bun run scripts/build-language-db.ts <local-dir>  # use an already-extracted data dir
 */

import { execFileSync } from "node:child_process";
import {
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { load } from "js-yaml";

const HYPERGLOT_TARBALL_URL =
  "https://github.com/rosettatype/hyperglot/archive/refs/heads/master.tar.gz";

interface HyperglotOrthography {
  auxiliary?: string;
  base?: string;
  script?: string;
  status?: string;
}

interface HyperglotLanguage {
  name?: string;
  orthographies?: HyperglotOrthography[];
  speakers?: number;
  status?: string;
}

interface BuiltOrthography {
  base: number[];
  /** Space-separated tokens as authored (may be multi-codepoint sequences,
   * e.g. an unencoded base+mark combination). Needed for shaping checks. */
  characters: string[];
  script: string;
  status: string;
}

interface BuiltLanguage {
  name: string;
  orthographies: BuiltOrthography[];
}

const WHITESPACE = /\s+/;
const YAML_EXTENSION = /\.yaml$/;

function tokensToCodePoints(tokens: string[]): number[] {
  const points = new Set<number>();
  for (const token of tokens) {
    for (const ch of token) {
      points.add(ch.codePointAt(0) as number);
    }
  }
  return [...points].sort((a, b) => a - b);
}

/** Downloads the Hyperglot repo tarball and extracts it into a temp dir,
 * returning the path to its lib/hyperglot/data directory. */
async function downloadHyperglotData(): Promise<{
  dataDir: string;
  cleanup: () => void;
}> {
  const workDir = mkdtempSync(join(tmpdir(), "hyperglot-"));
  const cleanup = () => rmSync(workDir, { force: true, recursive: true });

  try {
    const tarballPath = join(workDir, "hyperglot.tar.gz");

    console.log(`Downloading ${HYPERGLOT_TARBALL_URL} ...`);
    const response = await fetch(HYPERGLOT_TARBALL_URL);
    if (!response.ok) {
      throw new Error(
        `Failed to download Hyperglot tarball: ${response.status}`
      );
    }
    writeFileSync(tarballPath, Buffer.from(await response.arrayBuffer()));

    console.log("Extracting ...");
    execFileSync("tar", ["--force-local", "-xzf", tarballPath, "-C", workDir]);

    const extractedRoot = readdirSync(workDir).find(
      (name) => name.startsWith("hyperglot-") && name !== "hyperglot.tar.gz"
    );
    if (!extractedRoot) {
      throw new Error("Could not find extracted Hyperglot directory.");
    }

    const dataDir = join(workDir, extractedRoot, "lib", "hyperglot", "data");
    return { dataDir, cleanup };
  } catch (err) {
    cleanup();
    throw err;
  }
}

function buildDatabase(dataDir: string): {
  database: Record<string, BuiltLanguage>;
  skipped: number;
} {
  const files = readdirSync(dataDir).filter((f) => f.endsWith(".yaml"));
  const database: Record<string, BuiltLanguage> = {};
  let skipped = 0;

  for (const file of files) {
    const code = file.replace(YAML_EXTENSION, "");
    const raw = readFileSync(join(dataDir, file), "utf8");
    const doc = load(raw) as HyperglotLanguage;

    const orthographies = (doc.orthographies ?? [])
      .filter((o) => o.base)
      .map((o) => {
        const characters = [
          ...new Set((o.base as string).split(WHITESPACE).filter(Boolean)),
        ];
        return {
          script: o.script ?? "Unknown",
          status: o.status ?? "primary",
          characters,
          base: tokensToCodePoints(characters),
        };
      });

    if (orthographies.length === 0 || !doc.name) {
      skipped++;
      continue;
    }

    database[code] = {
      name: doc.name,
      orthographies,
    };
  }

  return { database, skipped };
}

async function main() {
  const providedDir = process.argv[2];
  let dataDir: string;
  let cleanup: (() => void) | undefined;

  if (providedDir) {
    dataDir = providedDir;
  } else {
    const downloaded = await downloadHyperglotData();
    dataDir = downloaded.dataDir;
    cleanup = downloaded.cleanup;
  }

  try {
    const { database, skipped } = buildDatabase(dataDir);
    const outPath = join(process.cwd(), "src/data/languages.json");
    writeFileSync(outPath, JSON.stringify(database), "utf8");

    console.log(
      `Built ${Object.keys(database).length} languages -> ${outPath}`
    );
    console.log(`Skipped ${skipped} entries with no usable orthography/base.`);
  } finally {
    cleanup?.();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
