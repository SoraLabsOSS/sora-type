# Contributing to Sora Type

Thank you for helping improve Sora Type. Contributions to the web inspector, browser extension, font engine, translations, documentation, and backend are welcome.

## Before you start

- Search existing issues and pull requests before starting duplicate work.
- For a large feature or architectural change, open an issue first and describe the problem and proposed approach.
- Keep pull requests focused. Avoid unrelated refactors or formatting changes.
- Never commit font files unless they are redistributable and are required as small test fixtures.
- Never commit credentials, `.env` files, Cloudflare state, build output, or other generated development artifacts.

## Repository structure

Sora Type is a Bun workspace managed with Turborepo.

```text
apps/
├── web/          Next.js web inspector and comparison tools
├── extension/    WXT browser extension
└── api/          Hono API on Cloudflare Workers, D1, and R2
packages/
├── font-engine/  Framework-agnostic font parsing and language detection
├── i18n-content/ Shared English and Vietnamese copy
└── rate-limit/   Shared Upstash rate-limiting utilities
```

Shared code belongs in a package and must be consumed through its package exports. For example, import font logic from `@sora-type/font-engine` rather than reaching into `packages/font-engine/src` with a relative path.

## Prerequisites

- [Git](https://git-scm.com/)
- [Bun](https://bun.sh/) 1.3.5 or a compatible version
- A Chromium-based browser for web and extension development
- Firefox when working on Firefox-specific extension behavior
- A Cloudflare account only when working with remote API resources or deployment

## Set up the project

1. Fork the repository and clone your fork:

   ```bash
   git clone https://github.com/<YOUR_USERNAME>/sora-type.git
   cd sora-type
   ```

2. Create a branch from the latest default branch:

   ```bash
   git checkout -b fix/short-description
   ```

3. Install dependencies:

   ```bash
   bun install
   ```

4. Start the part of the project you are changing:

   ```bash
   bun run dev:web
   bun run dev:extension
   cd apps/api && bun run dev
   ```

   Run `bun dev` from the repository root only when you need all workspace development tasks.

The web app is available at [http://localhost:3000](http://localhost:3000). WXT opens a development browser for the extension.

### Environment variables

Copy only the example file needed by the app you are working on:

```bash
cp apps/web/.env.example apps/web/.env
cp apps/api/.env.example apps/api/.env
```

- The web app uses Upstash credentials for PDF export rate limiting.
- The API example also documents Cloudflare credentials used by Drizzle for remote D1 operations.
- Local `.env` files must not be committed.

## Development guidelines

### Web UI

- Astryx is the primary design system for layout, typography, forms, navigation, tables, and other static UI.
- Use Sora UI only when motion is an essential part of the experience. Keep `apps/web/src/components/sora-ui` limited to animation effects and sheets.
- Before adding Astryx UI, discover the intended components with `bunx astryx build "<idea>"`, then inspect each component with `bunx astryx component <Name>`.
- Prefer component props and design tokens over custom styling. Do not introduce raw colors or arbitrary spacing when an existing token is available.
- This repository uses a version of Next.js with breaking changes. Read the relevant guide under `node_modules/next/dist/docs/` before changing framework APIs or conventions.

### Font engine

- Keep `packages/font-engine` independent of React, Next.js, WXT, and other UI frameworks.
- Add reusable parsing, shaping, language-detection, and export logic to this package rather than duplicating it in an app.
- Treat `packages/font-engine/src/data/languages.json` as generated output. Rebuild it with:

  ```bash
  bun run build:languages
  ```

### Internationalization

- Keep user-facing copy in both English and Vietnamese where the feature is localized.
- Edit extension copy in `packages/i18n-content/src/locales/{en,vi}/extension.json`.
- Do not edit `apps/extension/locales` directly; regenerate it with:

  ```bash
  bun run i18n:sync-extension
  ```

- Web locale files are consumed directly and do not need a generation step.

### Browser extension

- Keep content scripts lightweight and clean up listeners, observers, and injected UI when their context is invalidated.
- Use typed messaging and the `browser` API abstraction supported by WXT.
- Test changes in every browser affected by the pull request.

### API and database

- Keep Worker bindings typed and avoid exposing secrets in source code or logs.
- Generate schema migrations with `bun run db:generate` from `apps/api`.
- Review generated SQL before committing it. Do not rewrite an already-applied migration; add a new migration instead.
- Test destructive or remote database commands carefully. Local development should use local D1 state by default.

## Quality checks

Run checks that cover the files you changed. Before opening a pull request, the minimum repository-wide checks are:

```bash
bun run check
bun run build
```

Additional checks:

```bash
bun run test:e2e                  # Web Playwright suite
cd apps/extension && bun run compile
cd apps/extension && bun run build
cd apps/api && bun run test
```

The Playwright suite starts the web development server automatically. If browser binaries are missing, install Chromium with `bunx playwright install chromium`.

Lefthook runs formatting fixes before a commit and a production build before a push. Do not bypass these hooks; fix the reported problem instead.

## Submitting a pull request

1. Rebase or update your branch from the current default branch.
2. Check the diff for secrets, generated local state, debug logs, and unrelated changes.
3. Commit with a short, descriptive, imperative message.
4. Push the branch to your fork and open a pull request.

In the pull request, include:

- What changed and why.
- The issue it resolves, when applicable.
- How the change was tested.
- Screenshots or a short recording for visible UI or animation changes.
- Browser coverage for extension changes.
- Migration and rollback notes for database changes.
- Credits and license information for adapted code, datasets, icons, or test fonts.

Maintainers may request changes to keep package boundaries, accessibility, performance, privacy, and generated data consistent across the project.

Thank you for contributing to Sora Type!
