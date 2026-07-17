import { createRateLimit } from "@sora-type/rate-limit";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { createDb } from "../db/client";
import { sessions } from "../db/schema";
import { generateSessionId } from "../lib/id";
import type { AppContext } from "../types";

const MAX_FONT_FILE_SIZE = 10 * 1024 * 1024;
const MAX_FONT_SIZE_PX = 500;
const UPLOAD_RATE_LIMIT = 15;
const UPLOAD_RATE_LIMIT_WINDOW = "60 s" as const;
const DOWNLOAD_RATE_LIMIT = 60;
const DOWNLOAD_RATE_LIMIT_WINDOW = "60 s" as const;

const rateLimitersByCredentials = new Map<
  string,
  ReturnType<typeof createRateLimit>
>();

function getRateLimiter(env: Env) {
  const key = `${env.UPSTASH_REDIS_REST_URL}:${env.UPSTASH_REDIS_REST_TOKEN}`;
  let instance = rateLimitersByCredentials.get(key);
  if (!instance) {
    instance = createRateLimit({
      url: env.UPSTASH_REDIS_REST_URL,
      token: env.UPSTASH_REDIS_REST_TOKEN,
    });
    rateLimitersByCredentials.set(key, instance);
  }
  return instance;
}

function getClientIp(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip") ??
    // No IP header (shouldn't happen behind Cloudflare's edge in
    // production): give each such request its own bucket instead of
    // lumping unrelated clients into a single shared "unknown" identifier.
    `unknown:${crypto.randomUUID()}`
  );
}

async function checkRouteRateLimit(
  c: AppContext,
  key: string,
  limit: number,
  window: `${number} s`
) {
  const { checkRateLimit } = getRateLimiter(c.env);
  const rateLimit = await checkRateLimit(`${key}:${getClientIp(c.req.raw)}`, {
    limit,
    window,
  });
  if (rateLimit.success) {
    return null;
  }
  const retryAfterSeconds = Math.max(
    0,
    Math.ceil((rateLimit.reset - Date.now()) / 1000)
  );
  return c.json(
    { error: "Too many requests" },
    { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
  );
}

export const sessionsRouter = new Hono<{ Bindings: Env }>();

sessionsRouter.post("/", async (c) => {
  const limited = await checkRouteRateLimit(
    c,
    "upload",
    UPLOAD_RATE_LIMIT,
    UPLOAD_RATE_LIMIT_WINDOW
  );
  if (limited) {
    return limited;
  }

  let formData: FormData;
  try {
    formData = await c.req.formData();
  } catch {
    return c.json(
      { error: "Expected multipart/form-data body" },
      { status: 400 }
    );
  }

  const fontA = formData.get("fontA");
  const fontB = formData.get("fontB");
  const fontSizeRaw = formData.get("fontSize");

  if (!(fontA instanceof File && fontB instanceof File)) {
    return c.json(
      { error: "Missing 'fontA' or 'fontB' file field" },
      { status: 400 }
    );
  }

  if (fontA.size > MAX_FONT_FILE_SIZE || fontB.size > MAX_FONT_FILE_SIZE) {
    return c.json(
      {
        error: `Font file exceeds ${MAX_FONT_FILE_SIZE / (1024 * 1024)}MB limit`,
      },
      { status: 400 }
    );
  }

  const fontSize = Number(fontSizeRaw);
  if (
    !Number.isInteger(fontSize) ||
    fontSize <= 0 ||
    fontSize > MAX_FONT_SIZE_PX
  ) {
    return c.json(
      {
        error: `'fontSize' must be a positive integer up to ${MAX_FONT_SIZE_PX}`,
      },
      { status: 400 }
    );
  }

  const id = generateSessionId();
  const fontAKey = `sessions/${id}/a`;
  const fontBKey = `sessions/${id}/b`;

  const db = createDb(c.env.DB);

  // Insert before touching R2: if `id` collides with an existing row (the
  // 8-char nanoid keyspace is huge but not zero), the unique-constraint
  // failure happens here, before any R2 write can overwrite another
  // session's font files.
  let row: typeof sessions.$inferSelect | undefined;
  try {
    [row] = await db
      .insert(sessions)
      .values({ id, fontAKey, fontBKey, fontSize })
      .returning();
  } catch {
    return c.json(
      { error: "Could not create session, please retry" },
      { status: 500 }
    );
  }

  try {
    // Never trust the browser-supplied MIME type — it is echoed on download
    // and would let an attacker host HTML/SVG as a "font". Store a fixed type.
    await Promise.all([
      c.env.R2.put(fontAKey, fontA, {
        httpMetadata: { contentType: "application/octet-stream" },
      }),
      c.env.R2.put(fontBKey, fontB, {
        httpMetadata: { contentType: "application/octet-stream" },
      }),
    ]);
  } catch {
    // Compensate: don't leave a session row with no backing files.
    await db.delete(sessions).where(eq(sessions.id, id));
    return c.json({ error: "Could not upload font files" }, { status: 500 });
  }

  return c.json(row, 201);
});

sessionsRouter.get("/:id", async (c) => {
  const id = c.req.param("id");
  const db = createDb(c.env.DB);

  const [row] = await db
    .update(sessions)
    .set({ lastAccessedAt: new Date() })
    .where(eq(sessions.id, id))
    .returning();

  if (!row) {
    return c.json({ error: "Session not found" }, 404);
  }

  return c.json(row);
});

async function serveSessionFont(c: AppContext, slot: "a" | "b") {
  const limited = await checkRouteRateLimit(
    c,
    "download",
    DOWNLOAD_RATE_LIMIT,
    DOWNLOAD_RATE_LIMIT_WINDOW
  );
  if (limited) {
    return limited;
  }

  const id = c.req.param("id");
  const db = createDb(c.env.DB);

  const [row] = await db
    .update(sessions)
    .set({ lastAccessedAt: new Date() })
    .where(eq(sessions.id, id))
    .returning();

  if (!row) {
    return c.json({ error: "Session not found" }, 404);
  }

  const key = slot === "a" ? row.fontAKey : row.fontBKey;
  const object = await c.env.R2.get(key);
  if (!object) {
    return c.json({ error: "Font file not found" }, 404);
  }

  const headers = new Headers();
  // Fixed type + nosniff + attachment: never reflect client Content-Type
  // (upload path already stores octet-stream; this also covers legacy objects).
  headers.set("Content-Type", "application/octet-stream");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Content-Disposition", `attachment; filename="font-${slot}.bin"`);
  headers.set("Cache-Control", "private, max-age=3600");
  if (object.size != null) {
    headers.set("Content-Length", String(object.size));
  }

  return c.body(object.body, { headers });
}

sessionsRouter.get("/:id/a", (c) => serveSessionFont(c, "a"));
sessionsRouter.get("/:id/b", (c) => serveSessionFont(c, "b"));
