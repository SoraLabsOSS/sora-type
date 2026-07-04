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
| Font parsing | [opentype.js](https://github.com/opentypejs/opentype.js) |
| Variable fonts | [variableFonts.js](https://github.com/Monotype/variableFonts.js) |
| Lint / format | [Ultracite](https://github.com/haydenbleasel/ultracite) (Biome) |
| Git hooks | [Lefthook](https://github.com/evilmartians/lefthook) |

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
