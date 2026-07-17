import { env, SELF } from "cloudflare:test";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { createDb } from "../../src/db/client";
import { sessions } from "../../src/db/schema";

interface SessionResponse {
  createdAt: string;
  fontAKey: string;
  fontBKey: string;
  fontSize: number;
  id: string;
  lastAccessedAt: string;
}

function buildForm(overrides: Record<string, string | Blob | undefined> = {}) {
  const form = new FormData();
  const fields: Record<string, string | Blob> = {
    fontA: new File([new Uint8Array([1, 2, 3])], "a.ttf", {
      type: "font/ttf",
    }),
    fontB: new File([new Uint8Array([4, 5, 6])], "b.ttf", {
      type: "font/ttf",
    }),
    fontSize: "14",
    ...overrides,
  };
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined) {
      form.append(key, value);
    }
  }
  return form;
}

async function createSession(
  overrides?: Record<string, string | Blob | undefined>,
  headers?: HeadersInit
) {
  return await SELF.fetch("http://local.test/sessions", {
    method: "POST",
    body: buildForm(overrides),
    headers,
  });
}

describe("Sessions API Integration Tests", () => {
  describe("POST /sessions", () => {
    it("creates a session and uploads both fonts to R2", async () => {
      const response = await createSession();
      const body = await response.json<SessionResponse>();

      expect(response.status).toBe(201);
      expect(body.id).toHaveLength(8);
      expect(body.fontAKey).toBe(`sessions/${body.id}/a`);
      expect(body.fontBKey).toBe(`sessions/${body.id}/b`);
      expect(body.fontSize).toBe(14);
      expect(body.createdAt).toBeTruthy();
      expect(body.lastAccessedAt).toBeTruthy();

      const objectA = await env.R2.get(body.fontAKey);
      expect(objectA).not.toBeNull();
      expect(objectA?.httpMetadata?.contentType).toBe(
        "application/octet-stream"
      );
      expect(new Uint8Array(await objectA?.arrayBuffer())).toEqual(
        new Uint8Array([1, 2, 3])
      );

      const objectB = await env.R2.get(body.fontBKey);
      expect(new Uint8Array(await objectB?.arrayBuffer())).toEqual(
        new Uint8Array([4, 5, 6])
      );
    });

    it("400s when fontA is missing", async () => {
      const response = await createSession({ fontA: undefined });
      expect(response.status).toBe(400);
    });

    it("400s when fontB is missing", async () => {
      const response = await createSession({ fontB: undefined });
      expect(response.status).toBe(400);
    });

    it("400s when a font file exceeds the size limit", async () => {
      const oversized = new File(
        [new Uint8Array(10 * 1024 * 1024 + 1)],
        "big.ttf"
      );
      const response = await createSession({ fontA: oversized });
      expect(response.status).toBe(400);
    });

    it.each([
      ["0", "zero"],
      ["-5", "negative"],
      ["3.5", "non-integer"],
      ["abc", "non-numeric"],
      ["501", "over the 500 cap"],
    ])("400s when fontSize is %s (%s)", async (fontSize) => {
      const response = await createSession({ fontSize });
      expect(response.status).toBe(400);
    });

    it("accepts fontSize at the upper bound", async () => {
      const response = await createSession({ fontSize: "500" });
      expect(response.status).toBe(201);
    });

    it("429s with Retry-After once the per-IP upload limit is exceeded", async () => {
      // The route's own cap (15 req/60s) — none of the other tests in this
      // file share an IP header, so they each get their own rate-limit
      // bucket and can't interfere with this one.
      const ip = "203.0.113.42";
      const responses: Response[] = [];
      for (let i = 0; i < 16; i++) {
        responses.push(
          await createSession(undefined, { "cf-connecting-ip": ip })
        );
      }

      const limited = responses.at(-1);
      expect(limited?.status).toBe(429);
      expect(Number(limited?.headers.get("Retry-After"))).toBeGreaterThan(0);
    });
  });

  describe("session id uniqueness", () => {
    it("rejects a duplicate id at the database level", async () => {
      // The route relies on the `sessions.id` primary key to turn a
      // (near-impossible but non-zero) id collision into a clean insert
      // failure *before* any R2 write happens, instead of one uploader's
      // files silently overwriting another session's. This exercises that
      // underlying DB guarantee directly.
      const db = createDb(env.DB);
      const row = {
        id: "collide-test-id",
        fontAKey: "sessions/collide-test-id/a",
        fontBKey: "sessions/collide-test-id/b",
        fontSize: 14,
      };

      await db.insert(sessions).values(row);
      await expect(db.insert(sessions).values(row)).rejects.toThrow();

      await db.delete(sessions).where(eq(sessions.id, row.id));
    });
  });

  describe("GET /sessions/:id", () => {
    it("returns the session", async () => {
      const created = await createSession();
      const createdBody = await created.json<SessionResponse>();

      const response = await SELF.fetch(
        `http://local.test/sessions/${createdBody.id}`
      );
      const body = await response.json<SessionResponse>();

      expect(response.status).toBe(200);
      expect(body.id).toBe(createdBody.id);
      expect(body.fontSize).toBe(createdBody.fontSize);
    });

    it("bumps lastAccessedAt on read", async () => {
      const created = await createSession();
      const { id } = await created.json<SessionResponse>();

      const first = await SELF.fetch(`http://local.test/sessions/${id}`);
      const firstBody = await first.json<SessionResponse>();

      // lastAccessedAt has 1-second resolution (sqlite integer timestamp
      // column) — advance the clock enough for a second read to differ.
      await new Promise((resolve) => setTimeout(resolve, 1100));

      const second = await SELF.fetch(`http://local.test/sessions/${id}`);
      const secondBody = await second.json<SessionResponse>();

      expect(new Date(secondBody.lastAccessedAt).getTime()).toBeGreaterThan(
        new Date(firstBody.lastAccessedAt).getTime()
      );
    });

    it("404s for an unknown id", async () => {
      const response = await SELF.fetch(
        "http://local.test/sessions/doesnotexist"
      );
      expect(response.status).toBe(404);
    });
  });

  describe("GET /sessions/:id/a and /b", () => {
    it("returns font bytes with safe download headers", async () => {
      const created = await createSession(undefined, {
        "cf-connecting-ip": "198.51.100.10",
      });
      const { id } = await created.json<SessionResponse>();

      const responseA = await SELF.fetch(`http://local.test/sessions/${id}/a`);
      expect(responseA.status).toBe(200);
      expect(responseA.headers.get("Content-Type")).toBe(
        "application/octet-stream"
      );
      expect(responseA.headers.get("X-Content-Type-Options")).toBe("nosniff");
      expect(responseA.headers.get("Content-Disposition")).toBe(
        'attachment; filename="font-a.bin"'
      );
      expect(responseA.headers.get("Cache-Control")).toBe(
        "private, max-age=3600"
      );
      expect(new Uint8Array(await responseA.arrayBuffer())).toEqual(
        new Uint8Array([1, 2, 3])
      );

      const responseB = await SELF.fetch(`http://local.test/sessions/${id}/b`);
      expect(responseB.status).toBe(200);
      expect(responseB.headers.get("Content-Disposition")).toBe(
        'attachment; filename="font-b.bin"'
      );
      expect(new Uint8Array(await responseB.arrayBuffer())).toEqual(
        new Uint8Array([4, 5, 6])
      );
    });

    it("does not reflect a malicious client Content-Type", async () => {
      const created = await createSession(
        {
          fontA: new File([new Uint8Array([9, 9, 9])], "evil.html", {
            type: "text/html",
          }),
          fontB: new File([new Uint8Array([8, 8, 8])], "evil.svg", {
            type: "image/svg+xml",
          }),
        },
        { "cf-connecting-ip": "198.51.100.11" }
      );
      const { id, fontAKey } = await created.json<SessionResponse>();
      expect(created.status).toBe(201);

      const stored = await env.R2.get(fontAKey);
      expect(stored?.httpMetadata?.contentType).toBe(
        "application/octet-stream"
      );

      const response = await SELF.fetch(`http://local.test/sessions/${id}/a`);
      expect(response.headers.get("Content-Type")).toBe(
        "application/octet-stream"
      );
      expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
      expect(response.headers.get("Content-Disposition")).toContain(
        "attachment"
      );
      expect(new Uint8Array(await response.arrayBuffer())).toEqual(
        new Uint8Array([9, 9, 9])
      );
    });

    it("404s for an unknown id", async () => {
      const response = await SELF.fetch(
        "http://local.test/sessions/doesnotexist/a"
      );
      expect(response.status).toBe(404);
    });
  });
});
