# sora-type

A browser-based font inspector — drag and drop OpenType or TrueType files to explore what's inside. Supports OTF, TTF, WOFF, and WOFF2. Everything runs client-side; no server required.

## UI

The interface uses **primitives from [Sora UI](https://ui.soralabs.io.vn/)** (via the `@soralabs` shadcn registry), styled with Tailwind CSS.

## Planned features

- Font metadata: name, style, version, copyright (when available)
- Display all glyphs and per-glyph details
- Detect and show OpenType features
- Detect and show ligatures
- Detect supported languages
- Show font table data
- Font preview with sample text and waterfall lines
- Live type tester
- Variable font support

Planned subpages: compare two fonts, language report, Vertical Metrics Report, Advance Width Report, glyph search.

## Tech stack

| Purpose | Library / tool |
|---------|----------------|
| Framework | [Next.js](https://nextjs.org), [React](https://react.dev) |
| UI primitives | [Sora UI](https://ui.soralabs.io.vn/) |
| Styling | [Tailwind CSS](https://tailwindcss.com) |
| Font parsing | [opentype.js](https://github.com/opentypejs/opentype.js), [fontkit](https://github.com/foliojs/fontkit) |
| Variable fonts | [variableFonts.js](https://github.com/Monotype/variableFonts.js), opentype.js's built-in `VariationManager` |
| Text shaping | [harfbuzzjs](https://github.com/harfbuzz/harfbuzzjs) — official WASM build of HarfBuzz |
| Language support data | [Hyperglot](https://github.com/rosettatype/hyperglot) (CLDR-based) |
| Lint / format | [Ultracite](https://github.com/haydenbleasel/ultracite) (Biome) |
| Git hooks | [Lefthook](https://github.com/evilmartians/lefthook) |

## Language detection

Language support detection ports [Hyperglot](https://github.com/rosettatype/hyperglot)'s checking approach (the same database FontDrop's own "Language Report" cites) to JS, using `harfbuzzjs` instead of Python's `uharfbuzz` — both bind the same HarfBuzz C library, so shaping results are equivalent, not reimplemented.

Hyperglot is Apache License 2.0. `packages/font-engine/src/data/languages.json` is a generated derivative of its per-language YAML database (see `packages/font-engine/scripts/build-language-db.ts`), not hand-authored — the checking *logic* below is a from-scratch reimplementation, but the *data* is theirs, compiled to JSON.

Three tiers, checked in order (see `packages/font-engine/src/font-language-detection.ts`):

1. **Coverage** — every character's codepoint(s) present in the font (`fontkit`'s `characterSet`).
2. **Decomposed fallback** — a missing precomposed character (e.g. `ế`) can still count if the font has the base letter + combining marks separately (`String.prototype.normalize('NFD')`).
3. **Shaping** — for anything relying on tier 2, or already an unencoded base+mark sequence in the source data, confirm HarfBuzz's GPOS actually positions the marks (`packages/font-engine/src/font-shaping.ts`), not just that the glyphs exist.

**Not ported:** Hyperglot's Brahmi conjunct/half-form checks and Arabic joining-form checks (script-specific tests beyond generic mark attachment). Results should not be presented as 1:1 Hyperglot parity — only as FontDrop-equivalent-and-better (real GPOS shaping instead of cmap-only) for scripts that rely on generic base+mark attachment (Latin, Cyrillic, Greek, Vietnamese diacritics, etc.).

The database itself (`packages/font-engine/src/data/languages.json`) is generated, not hand-maintained:

```bash
bun run build:languages
```

This downloads Hyperglot's data fresh from GitHub, extracts it to a temp dir, and rebuilds the JSON — run it whenever Hyperglot's upstream data should be refreshed.

## Internationalization (i18n)

UI copy is authored once, centrally, and consumed by both apps:

- **`packages/i18n-content`** holds the source strings — `src/locales/{en,vi}/*.json`, one file per feature area (`common`, `about`, `privacy`, `compare`, `inspector`, `extension`). Ships as raw TS/JSON (no build step), same pattern as `font-engine`.
- **`apps/web`** consumes it directly via `next-intl` (`getMessages()` from the package). Routing: `/` = English (default, unprefixed), `/vi` = Vietnamese (`localePrefix: "as-needed"`).
- **`apps/extension`** consumes the `extension` namespace via `@wxt-dev/i18n`, but WXT reads locale files from disk at build time (`apps/extension/locales/{en,vi}.json`), not at runtime import — so those two files are **generated**, not hand-edited, and are committed to the repo (same convention as `packages/font-engine/src/data/languages.json`).

To edit extension copy: change `packages/i18n-content/src/locales/{en,vi}/extension.json`, then regenerate:

```bash
bun run i18n:sync-extension
```

Web copy (`common`/`about`/`privacy`/`compare`/`inspector`) needs no regeneration step — edit the JSON and it's picked up on next dev/build.

The extension itself has no in-app locale switcher; Chrome/Edge selects `en` or `vi` automatically based on the browser's own UI language setting, falling back to `en` (the extension's `default_locale`) if the browser is set to anything else.

## Environment variables

`apps/web` needs Upstash Redis credentials to rate-limit `POST /api/export-pdf` (see `apps/web/.env.example`):

```bash
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

Copy `apps/web/.env.example` to `apps/web/.env` and fill in values from your [Upstash](https://upstash.com) Redis database's REST API tab. Without these, rate-limit checks will fail (the endpoint fails closed).

## Releasing the extension

`apps/extension` publishes to Microsoft Edge Add-ons via `.github/workflows/publish-extension.yml`, triggered by pushing a tag — pushing to `main` does **not** publish.

1. Bump `version` in `apps/extension/package.json`.
2. Tag the release commit and push the tag:
   ```bash
   git tag extension-vX.Y.Z
   git push origin extension-vX.Y.Z
   ```
3. The workflow builds and zips the extension with `bun run zip` (`apps/extension/.output/*-chrome.zip`) and publishes it via the [`wdzeng/edge-addon`](https://github.com/wdzeng/edge-addon) action.

This only *updates* an existing Edge Add-ons listing — the first submission must be done once, manually, through [Partner Center](https://partner.microsoft.com/dashboard/microsoftedge/overview) to obtain a Product ID. The workflow needs three repo secrets: `EDGE_PRODUCT_ID`, `EDGE_CLIENT_ID`, `EDGE_API_KEY`.

## Credits

- **OpenType feature defaults and native CSS mappings** (`packages/font-engine/src/opentype-feature-classification.ts`, `packages/font-engine/src/opentype-feature-variants.ts`) — the fixed/on/off feature-state table and the `font-variant-*` equivalents table are ported from [Wakamai Fondue](https://github.com/Wakamai-Fondue/wakamai-fondue-engine)'s `layout-features.js` (Google LLC, Apache License 2.0), trimmed to tag-only lookups.
- **Generated stylesheet architecture** (`packages/font-engine/src/font-stylesheet.ts`) — the "combine feature/instance classes freely via CSS custom properties" approach follows the same design [Wakamai Fondue uses](https://pixelambacht.nl/2019/fixing-variable-font-inheritance/), reimplemented independently against this project's own extracted font data rather than vendoring theirs.
- **Language database** (`packages/font-engine/src/data/languages.json`) — generated from [Hyperglot](https://github.com/rosettatype/hyperglot)'s per-language YAML data (Apache License 2.0) via `packages/font-engine/scripts/build-language-db.ts`; see [Language detection](#language-detection) above for what's ported vs. reimplemented.

## Getting started

```bash
bun install
bun dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
|---------|-------------|
| `bun dev` | Start dev server |
| `bun run build` | Production build |
| `bun run start` | Run production build |
| `bun run check` | Lint and format check |
| `bun run fix` | Auto-fix lint and format |
| `bun run build:languages` | Rebuild `packages/font-engine/src/data/languages.json` from Hyperglot's upstream data |
| `bun run i18n:sync-extension` | Regenerate `apps/extension/locales/{en,vi}.json` from `packages/i18n-content` after editing extension copy |
