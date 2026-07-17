import { and, inArray, lt } from "drizzle-orm";
import { createDb } from "../db/client";
import { sessions } from "../db/schema";

export const SESSION_RETENTION_MS = 10 * 24 * 60 * 60 * 1000;
const BATCH_SIZE = 100;

export interface CleanupExpiredSessionsResult {
  deleted: number;
}

export interface CleanupExpiredSessionsOptions {
  /** Test-only: runs after selecting a batch, before the conditional delete. */
  afterSelect?: (ids: string[]) => void | Promise<void>;
}

/**
 * Deletes sessions whose `lastAccessedAt` is older than the retention window,
 * along with their R2 font objects. D1 is deleted first so a mid-run failure
 * cannot leave share links pointing at missing files — orphan R2 objects are
 * preferable to broken sessions.
 *
 * The delete re-checks `lastAccessedAt < cutoff` so a session revived by a
 * GET between select and delete is not removed.
 */
export async function cleanupExpiredSessions(
  env: Env,
  now = Date.now(),
  options: CleanupExpiredSessionsOptions = {}
): Promise<CleanupExpiredSessionsResult> {
  const db = createDb(env.DB);
  const cutoff = new Date(now - SESSION_RETENTION_MS);
  let deleted = 0;

  for (;;) {
    const batch = await db
      .select()
      .from(sessions)
      .where(lt(sessions.lastAccessedAt, cutoff))
      .limit(BATCH_SIZE);

    if (batch.length === 0) {
      break;
    }

    const ids = batch.map((row) => row.id);
    await options.afterSelect?.(ids);

    // Re-check cutoff so a concurrent GET that bumps lastAccessedAt cannot
    // have its session wiped by a stale id list.
    const removed = await db
      .delete(sessions)
      .where(
        and(inArray(sessions.id, ids), lt(sessions.lastAccessedAt, cutoff))
      )
      .returning();

    const keys = removed.flatMap((row) => [row.fontAKey, row.fontBKey]);
    if (keys.length > 0) {
      try {
        await env.R2.delete(keys);
      } catch (error) {
        // D1 rows are already gone — log so orphans can be swept manually.
        console.error("cleanup: R2 delete failed; orphaned keys:", keys, error);
      }
    }

    deleted += removed.length;

    // Only stop when this was the last page. A full batch with removed.length
    // === 0 (everything revived mid-flight) must continue — those rows no
    // longer match the cutoff, so the next select advances to remaining work.
    if (batch.length < BATCH_SIZE) {
      break;
    }
  }

  return { deleted };
}
