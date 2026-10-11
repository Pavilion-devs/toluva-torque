import { getPoolStatus } from "./meteora-dbc.js";

// Public pages can poll frequently. Share each chain read across requests and
// spread pool reads over time so a page view does not fan out into an RPC burst.
export function createPoolStatusCache(readStatus, {
  now = Date.now,
  freshMs = 60_000,
  failureMs = 90_000,
} = {}) {
  const entries = new Map();
  let queue = Promise.resolve();

  function read(pool) {
    const previous = entries.get(pool);
    if (previous?.promise) return previous.promise;
    if (previous && previous.nextReadAt > now()) {
      return Promise.resolve(previous.result);
    }

    const chainRead = queue.then(() => readStatus(pool));
    queue = chainRead.then(() => {}, () => {});
    const promise = chainRead.then((status) => {
      const result = {
        status,
        checkedAt: new Date(now()).toISOString(),
        stale: false,
        error: null,
      };
      entries.set(pool, { result, nextReadAt: now() + freshMs });
      return result;
    }, (error) => {
      const result = {
        status: previous?.result.status || null,
        checkedAt: previous?.result.checkedAt || null,
        stale: true,
        error,
      };
      entries.set(pool, { result, nextReadAt: now() + failureMs });
      return result;
    });
    entries.set(pool, { result: previous?.result || null, nextReadAt: 0, promise });
    return promise;
  }

  function invalidate(pool) { entries.delete(pool); }

  return { read, invalidate };
}

export const publicPoolStatusCache = createPoolStatusCache(getPoolStatus);
