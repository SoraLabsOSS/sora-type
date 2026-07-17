import path from "node:path";
import {
  defineWorkersConfig,
  readD1Migrations,
} from "@cloudflare/vitest-pool-workers/config";

const migrationsPath = path.join(import.meta.dirname, "..", "drizzle");
const migrations = await readD1Migrations(migrationsPath);

export default defineWorkersConfig({
  esbuild: {
    target: "esnext",
  },
  test: {
    setupFiles: ["./tests/apply-migrations.ts"],
    poolOptions: {
      workers: {
        // R2 deletes trip Windows EBUSY when popping isolated storage
        // frames (miniflare sqlite sidecars stay locked). Shared storage
        // is fine here: singleWorker + unique session ids per test.
        isolatedStorage: false,
        singleWorker: true,
        wrangler: {
          configPath: "../wrangler.jsonc",
        },
        miniflare: {
          compatibilityFlags: ["experimental", "nodejs_compat"],
          bindings: {
            MIGRATIONS: migrations,
          },
        },
      },
    },
  },
});
