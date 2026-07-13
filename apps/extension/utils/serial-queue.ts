export interface SerialQueue {
  run<T>(task: () => Promise<T>): Promise<T>;
}

/**
 * Chains `task`s onto a `Promise<void>` tail so a read-modify-write against
 * shared storage can't interleave with another in-flight one. The tail
 * itself never rejects (swallowed via `.catch`), so one task's failure
 * can't wedge every task queued after it — callers still see the real
 * result/rejection through `run`'s own return value.
 */
export function createSerialQueue(): SerialQueue {
  let tail: Promise<void> = Promise.resolve();

  return {
    run<T>(task: () => Promise<T>): Promise<T> {
      const result = tail.then(task);
      tail = result.then(
        () => undefined,
        () => undefined
      );
      return result;
    },
  };
}

export interface KeyedSerialQueue<K> {
  /** Drops the queue for `key` once nothing will ever run for it again
   * (e.g. its tab closed). Pure memory hygiene, not correctness-critical —
   * a task already in flight for `key` is unaffected. */
  delete(key: K): void;
  run<T>(key: K, task: () => Promise<T>): Promise<T>;
}

/** Per-key variant of `createSerialQueue`, so unrelated keys (e.g. two
 * different tabs) never block on each other. */
export function createKeyedSerialQueue<K>(): KeyedSerialQueue<K> {
  const queues = new Map<K, SerialQueue>();

  function getQueue(key: K): SerialQueue {
    let queue = queues.get(key);
    if (!queue) {
      queue = createSerialQueue();
      queues.set(key, queue);
    }
    return queue;
  }

  return {
    run<T>(key: K, task: () => Promise<T>): Promise<T> {
      return getQueue(key).run(task);
    },
    delete(key: K): void {
      queues.delete(key);
    },
  };
}
