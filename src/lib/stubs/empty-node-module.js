// Stub for the Node.js "module" builtin, aliased in for browser builds only
// (see next.config.ts `turbopack.resolveAlias`). harfbuzzjs's Emscripten
// glue does `await import("module")` inside an `if (ENVIRONMENT_IS_NODE)`
// branch that never executes in the browser, but Turbopack still needs the
// specifier to resolve to *something* at build time. This should never
// actually be called at runtime.
export function createRequire() {
  throw new Error("createRequire() stub should never run in the browser");
}
