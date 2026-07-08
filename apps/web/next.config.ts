import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const emptyNodeModuleStub = "@sora-type/font-engine/stubs/empty-node-module";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // @sora-type/font-engine ships raw TS source (JIT internal package), so
  // Next must transpile it itself instead of treating it as pre-built.
  transpilePackages: ["@sora-type/font-engine", "@sora-type/i18n-content"],
  // pdfkit reads its .afm font-metric files from node_modules at runtime via
  // relative paths; bundling it breaks that resolution, so it must run via
  // native Node require instead (used by src/app/api/export-pdf/route.ts,
  // via @sora-type/font-engine's report-export.ts).
  serverExternalPackages: ["pdfkit"],
  // harfbuzzjs's Emscripten glue has a `await import("module")` guarded by
  // `if (ENVIRONMENT_IS_NODE)` for its Node code path — that branch never
  // runs in the browser, but Turbopack still resolves the specifier at
  // build time and fails. Alias it to a harmless stub for browser builds
  // only; the real "module" import is still used server-side.
  turbopack: {
    resolveAlias: {
      module: { browser: emptyNodeModuleStub },
    },
  },
};

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

export default withNextIntl(nextConfig);
