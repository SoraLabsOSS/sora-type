/**
 * Builds packages/font-engine/src/data/languages.json from the Hyperglot
 * language database
 * (https://github.com/rosettatype/hyperglot, Apache License 2.0). The
 * output is a generated derivative of Hyperglot's per-language YAML data,
 * not hand-authored — see the "Language detection" / "Credits" sections
 * in the project README for what's ported vs. reimplemented.
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
const REFERENCE_TOKEN = /^<([A-Za-z0-9-]+)>$/;
const MAX_REFERENCE_DEPTH = 5;

function tokensToCodePoints(tokens: string[]): number[] {
  const points = new Set<number>();
  for (const token of tokens) {
    for (const ch of token) {
      points.add(ch.codePointAt(0) as number);
    }
  }
  return [...points].sort((a, b) => a - b);
}

/**
 * Hyperglot lets a `base` field be (or contain) a `<code>` token meaning
 * "inherit these characters from language `code`" — e.g. Baharna Arabic's
 * `base: <arb>` means "same as Standard Arabic", and Ainu's Katakana
 * orthography is `base: <jpn> ㇷ゚ セ゚ ツ゚ ト゚` ("same as Japanese's
 * Katakana orthography, plus these 4 extra characters"). Left unresolved,
 * these tokens get stored as literal "characters" (5 plain Latin codepoints
 * for "<arb>"), which every font trivially "supports" — silently reporting
 * full language support regardless of actual script coverage. Resolves by
 * looking up the referenced language's orthography matching the same
 * script (falling back to its first orthography), recursively — bounded by
 * `depth` in case of an unexpected reference cycle. Unresolvable references
 * (unknown code, no usable `base`) are dropped rather than re-emitted as a
 * literal token.
 */
function resolveBaseTokens(
  tokens: string[],
  script: string,
  rawByCode: Map<string, HyperglotLanguage>,
  depth = 0
): string[] {
  if (depth >= MAX_REFERENCE_DEPTH) {
    return [];
  }

  const resolved: string[] = [];
  for (const token of tokens) {
    const match = token.match(REFERENCE_TOKEN);
    if (!match) {
      resolved.push(token);
      continue;
    }

    const refDoc = rawByCode.get(match[1]);
    const refOrthography =
      refDoc?.orthographies?.find((o) => o.script === script) ??
      refDoc?.orthographies?.[0];
    if (!refOrthography?.base) {
      continue;
    }

    const refTokens = refOrthography.base.split(WHITESPACE).filter(Boolean);
    resolved.push(
      ...resolveBaseTokens(refTokens, script, rawByCode, depth + 1)
    );
  }
  return resolved;
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

  // Read every file first so resolveBaseTokens can look up any language's
  // raw `base` field regardless of file iteration order (a language's
  // `<code>` reference may point to a file read later than its own).
  const rawByCode = new Map<string, HyperglotLanguage>();
  for (const file of files) {
    const code = file.replace(YAML_EXTENSION, "");
    const raw = readFileSync(join(dataDir, file), "utf8");
    rawByCode.set(code, load(raw) as HyperglotLanguage);
  }

  const database: Record<string, BuiltLanguage> = {};
  let skipped = 0;

  for (const [code, doc] of rawByCode) {
    const orthographies = (doc.orthographies ?? [])
      .filter((o) => o.base)
      .map((o) => {
        const script = o.script ?? "Unknown";
        const rawTokens = (o.base as string).split(WHITESPACE).filter(Boolean);
        const characters = [
          ...new Set(resolveBaseTokens(rawTokens, script, rawByCode)),
        ];
        return {
          script,
          status: o.status ?? "primary",
          characters,
          base: tokensToCodePoints(characters),
        };
      })
      // A fully-unresolvable reference chain resolves to zero characters —
      // drop it rather than keep an empty orthography, which would
      // vacuously "pass" every coverage check the same way the original
      // unresolved-token bug did, just via a different path.
      .filter((o) => o.characters.length > 0);

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
