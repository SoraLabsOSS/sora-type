import type { NextConfig } from "next";

const emptyNodeModuleStub = "./src/lib/stubs/empty-node-module.js";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // pdfkit reads its .afm font-metric files from node_modules at runtime via
  // relative paths; bundling it breaks that resolution, so it must run via
  // native Node require instead (used by src/app/api/export-pdf/route.ts).
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

export default nextConfig;
