import { useCallback, useRef, useState } from "react";

export type LatestAsyncKey = PropertyKey;

const DEFAULT_KEY = "default";

export interface UseLatestAsyncResult<K extends LatestAsyncKey> {
  isLoading(key?: K): boolean;
  /**
   * Guarded async entry point: bumps the token for `key` (invalidating any
   * in-flight rival for the same key), sets `isLoading(key)` true, invokes
   * `fn` with an `isCurrent` predicate the caller must re-check after every
   * `await` before committing state, and clears `isLoading(key)` in a
   * `finally` only if this call is still the most recent one for `key`.
   */
  run<T>(fn: (isCurrent: () => boolean) => Promise<T>, key?: K): Promise<T>;
  /**
   * Guarded synchronous entry point for loaders with no real async phase:
   * bumps the token for `key` and actively clears `isLoading(key)` — never
   * sets it true, so there's no true→false flicker for genuinely
   * synchronous work.
   */
  runSync<T>(fn: () => T, key?: K): T;
}

/**
 * Structurally enforces the "discard a stale/superseded async result"
 * guard that a growing number of independent async load entry points (file
 * drop, local-font pick, URL fetch, placeholder fetch, ...) all need to
 * participate in. Centralizing token bookkeeping alone wouldn't be enough —
 * `run` owns `isLoading` itself so a future entry point can't forget to
 * touch it, which is what let that class of bug through before this hook
 * existed.
 */
export function useLatestAsync<
  K extends LatestAsyncKey = string,
>(): UseLatestAsyncResult<K> {
  const tokens = useRef(new Map<K, number>());
  const [loadingKeys, setLoadingKeys] = useState<ReadonlySet<K>>(new Set());

  const bump = useCallback((key: K): number => {
    const token = (tokens.current.get(key) ?? 0) + 1;
    tokens.current.set(key, token);
    return token;
  }, []);

  const isCurrent = useCallback(
    (key: K, token: number) => tokens.current.get(key) === token,
    []
  );

  const setLoading = useCallback((key: K, value: boolean) => {
    setLoadingKeys((prev) => {
      const isSet = prev.has(key);
      if (isSet === value) {
        return prev;
      }
      const next = new Set(prev);
      if (value) {
        next.add(key);
      } else {
        next.delete(key);
      }
      return next;
    });
  }, []);

  const run = useCallback(
    <T>(
      fn: (isCurrentFn: () => boolean) => Promise<T>,
      key: K = DEFAULT_KEY as K
    ): Promise<T> => {
      const token = bump(key);
      setLoading(key, true);
      return fn(() => isCurrent(key, token)).finally(() => {
        if (isCurrent(key, token)) {
          setLoading(key, false);
        }
      });
    },
    [bump, isCurrent, setLoading]
  );

  const runSync = useCallback(
    <T>(fn: () => T, key: K = DEFAULT_KEY as K): T => {
      bump(key);
      setLoading(key, false);
      return fn();
    },
    [bump, setLoading]
  );

  const isLoadingFn = useCallback(
    (key: K = DEFAULT_KEY as K) => loadingKeys.has(key),
    [loadingKeys]
  );

  return { isLoading: isLoadingFn, run, runSync };
}
