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

Three tiers, checked in order (see `src/lib/font-language-detection.ts`):

1. **Coverage** — every character's codepoint(s) present in the font (`fontkit`'s `characterSet`).
2. **Decomposed fallback** — a missing precomposed character (e.g. `ế`) can still count if the font has the base letter + combining marks separately (`String.prototype.normalize('NFD')`).
3. **Shaping** — for anything relying on tier 2, or already an unencoded base+mark sequence in the source data, confirm HarfBuzz's GPOS actually positions the marks (`src/lib/font-shaping.ts`), not just that the glyphs exist.

**Not ported:** Hyperglot's Brahmi conjunct/half-form checks and Arabic joining-form checks (script-specific tests beyond generic mark attachment). Results should not be presented as 1:1 Hyperglot parity — only as FontDrop-equivalent-and-better (real GPOS shaping instead of cmap-only) for scripts that rely on generic base+mark attachment (Latin, Cyrillic, Greek, Vietnamese diacritics, etc.).

The database itself (`src/data/languages.json`) is generated, not hand-maintained:

```bash
bun run build:languages
```

This downloads Hyperglot's data fresh from GitHub, extracts it to a temp dir, and rebuilds the JSON — run it whenever Hyperglot's upstream data should be refreshed.

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
| `bun run build:languages` | Rebuild `src/data/languages.json` from Hyperglot's upstream data |
