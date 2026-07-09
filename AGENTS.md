<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- ASTRYX:START -->
Astryx v0.1.3 · 149 components
CLI: run every command as `bunx astryx <cmd>` (shown below as `astryx ...`).

SETUP (once, in your app entry e.g. main.tsx) — without these, components render unstyled:
  import "@astryxdesign/core/reset.css";
  import "@astryxdesign/core/astryx.css";

WORKFLOW — discover, don't guess. Before writing UI:
1. `astryx build "<idea>"` — START HERE: returns a kit (closest [page] + [block]s + [component]s). No args = full playbook.
2. `astryx template <name> [--skeleton]` — scaffold the [page]/[block]s it named, or study their layout. Templates are reference code.
3. `astryx component <Name>` — props + examples for every component you use.

RULES:
- No <div> — components do all layout/spacing. Full page → AppShell; sidebar nav → SideNav.
- Frame first: pick the shell (AppShell / Layout+LayoutPanel) and budget regions in px BEFORE writing content (`astryx docs layout`).
- Dense data = rows (Table, List/Item) edge-to-edge — never Card-wrapped list items. Card = dashboard widgets, galleries, settings groups only.
- Status → StatusDot/Token; Badge only for counts and enumerated states, never decoration.
- Custom styling: component props first; else Tailwind utilities backed by tokens (bg-surface, text-primary, rounded-lg) via tailwind-theme.css. No raw hex/px.
- Tokens for every value (`astryx docs tokens`). Brand/accent via `astryx theme` — never override --color-* in :root.

MORE CLI:
  search "<query>"   find any component / hook / doc / template / block
  component --list   149 components by category
  template --list    page + block recipes
  docs <topic>       color, elevation, icons, illustrations, layout, migration, motion, principles, shape, spacing, styling, theme, tokens, typography
  swizzle <Name>     eject component source for deep customization
  upgrade --apply    run after any @astryxdesign/core bump
<!-- ASTRYX:END -->

<!-- SORA-TYPE:START -->
# Sora Type

Browser-based font inspector — drop OTF/TTF/WOFF/WOFF2, analyze locally. Everything runs client-side; no backend.

Turborepo monorepo: `apps/web` is the Next.js app; `packages/font-engine` (`@sora-type/font-engine`) is the framework-agnostic font-parsing/language-detection logic, extracted so it can be reused by the future browser extension (Launch 2). Language data lives at `packages/font-engine/src/data/languages.json` (build via `bun run build:languages`). `apps/web` consumes it via `@sora-type/font-engine` / `@sora-type/font-engine/<module>` — never reach into `packages/font-engine/src/*` with a relative import.

## UI stack

**Astryx is the primary design system.** Use `@astryxdesign/core` for layout, typography, forms, tables, navigation, theme, and all inspector shell UI.

**Sora UI is animation-only.** Add primitives from the `@soralabs` shadcn registry (`components/sora-ui/`) only when motion is part of the UX — bottom sheets, text effects, drop-zone feedback, panel transitions. Do not use Sora UI for static UI that Astryx already covers (Button, Card, Table, Input, etc.).

| Need | Use |
|------|-----|
| Shell, data UI, forms, tables | Astryx |
| Simple fade/slide | CSS transition or `motion` directly |
| Bespoke motion (sheet drag, text morph, reveal) | Sora UI primitive in `components/sora-ui/` |
| Font parsing / language detection | `packages/font-engine/*` (`@sora-type/font-engine`) — no UI library |

Keep `components/sora-ui/` thin (effects/sheets only). Sora UI tokens bridge to Matcha via `apps/web/src/themes/matcha/registry-bridge.css` when a Sora UI component is added.

## Extension copy (i18n)

Extension UI text lives in `packages/i18n-content/src/locales/{en,vi}/extension.json` — this is the source of truth. `apps/extension/locales/**` is generated output; never edit it directly. After changing `extension.json`, run `bun run i18n:sync-extension` to regenerate it (a lefthook pre-commit hook already does this automatically and stages the result when `extension.json` is part of the commit).

## Product context (for scope decisions)

- Launch 1: Sora Type web inspector (font-first; not a Sora UI showcase).
- Launch 2 (later): browser extension — identify fonts on the web; may reuse the same animation primitives.
- Prefer minimal diffs; do not expand scope into unrelated features or docs unless asked.
<!-- SORA-TYPE:END -->
