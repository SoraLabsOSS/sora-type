import { env, SELF } from "cloudflare:test";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { createDb } from "../../src/db/client";
import { sessions } from "../../src/db/schema";
import {
  cleanupExpiredSessions,
  SESSION_RETENTION_MS,
} from "../../src/lib/cleanup-expired-sessions";

const DAY_MS = 24 * 60 * 60 * 1000;

interface SessionResponse {
  fontAKey: string;
  fontBKey: string;
  id: string;
}

function buildForm() {
  const form = new FormData();
  form.append(
    "fontA",
    new File([new Uint8Array([1, 2, 3])], "a.ttf", { type: "font/ttf" })
  );
  form.append(
    "fontB",
    new File([new Uint8Array([4, 5, 6])], "b.ttf", { type: "font/ttf" })
  );
  form.append("fontSize", "14");
  return form;
}

async function createSession(ip: string) {
  const response = await SELF.fetch("http://local.test/sessions", {
    method: "POST",
    body: buildForm(),
    headers: { "cf-connecting-ip": ip },
  });
  expect(response.status).toBe(201);
  return await response.json<SessionResponse>();
}

async function expectR2Present(key: string) {
  const object = await env.R2.get(key);
  expect(object).not.toBeNull();
  // Consume the body so vitest-pool-workers can dispose R2 resources.
  await object?.arrayBuffer();
}

describe("cleanupExpiredSessions", () => {
  it("deletes sessions idle longer than the retention window and keeps fresh ones", async () => {
    const now = Date.now();
    const expired = await createSession("198.51.100.1");
    const fresh = await createSession("198.51.100.2");

    const db = createDb(env.DB);
    await db
      .update(sessions)
      .set({
        lastAccessedAt: new Date(now - SESSION_RETENTION_MS - DAY_MS),
      })
      .where(eq(sessions.id, expired.id));

    const result = await cleanupExpiredSessions(env, now);
    expect(result.deleted).toBeGreaterThanOrEqual(1);

    const [expiredRow] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, expired.id));
    expect(expiredRow).toBeUndefined();
    expect(await env.R2.get(expired.fontAKey)).toBeNull();
    expect(await env.R2.get(expired.fontBKey)).toBeNull();

    const [freshRow] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, fresh.id));
    expect(freshRow).toBeDefined();
    await expectR2Present(fresh.fontAKey);
    await expectR2Present(fresh.fontBKey);
  });

  it("returns zero when nothing is expired", async () => {
    await cleanupExpiredSessions(env);

    const fresh = await createSession("198.51.100.3");
    const result = await cleanupExpiredSessions(env);
    expect(result.deleted).toBe(0);

    const db = createDb(env.DB);
    const [row] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, fresh.id));
    expect(row).toBeDefined();
  });

  it("does not delete a session revived after it was selected as expired", async () => {
    const now = Date.now();
    const revived = await createSession("198.51.100.4");
    const stillExpired = await createSession("198.51.100.5");

    const db = createDb(env.DB);
    const staleAt = new Date(now - SESSION_RETENTION_MS - DAY_MS);
    await db
      .update(sessions)
      .set({ lastAccessedAt: staleAt })
      .where(eq(sessions.id, revived.id));
    await db
      .update(sessions)
      .set({ lastAccessedAt: staleAt })
      .where(eq(sessions.id, stillExpired.id));

    const result = await cleanupExpiredSessions(env, now, {
      afterSelect: async (ids) => {
        expect(ids).toContain(revived.id);
        // Simulate GET /sessions/:id between select and delete.
        await db
          .update(sessions)
          .set({ lastAccessedAt: new Date(now) })
          .where(eq(sessions.id, revived.id));
      },
    });
    expect(result.deleted).toBeGreaterThanOrEqual(1);

    const [revivedRow] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, revived.id));
    expect(revivedRow).toBeDefined();
    await expectR2Present(revived.fontAKey);
    await expectR2Present(revived.fontBKey);

    const [expiredRow] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, stillExpired.id));
    expect(expiredRow).toBeUndefined();
    expect(await env.R2.get(stillExpired.fontAKey)).toBeNull();
    expect(await env.R2.get(stillExpired.fontBKey)).toBeNull();
  });

  it("keeps D1 removal when R2 delete fails and does not throw", async () => {
    const now = Date.now();
    const expired = await createSession("198.51.100.6");
    const db = createDb(env.DB);
    await db
      .update(sessions)
      .set({
        lastAccessedAt: new Date(now - SESSION_RETENTION_MS - DAY_MS),
      })
      .where(eq(sessions.id, expired.id));

    const originalDelete = env.R2.delete.bind(env.R2);
    env.R2.delete = () => Promise.reject(new Error("simulated R2 failure"));

    try {
      const result = await cleanupExpiredSessions(env, now);
      expect(result.deleted).toBeGreaterThanOrEqual(1);

      const [row] = await db
        .select()
        .from(sessions)
        .where(eq(sessions.id, expired.id));
      expect(row).toBeUndefined();
    } finally {
      env.R2.delete = originalDelete;
    }

    // Best-effort restore so later tests don't see leftover R2 objects.
    await originalDelete([expired.fontAKey, expired.fontBKey]);
  });
});
