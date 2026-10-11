import test from "node:test";
import assert from "node:assert/strict";
import { createPoolStatusCache } from "../server/services/meteora-status-cache.js";

test("page polls share reads and pool refreshes do not burst together", async () => {
  let now = 1_000;
  let calls = 0;
  let active = 0;
  let peak = 0;
  const cache = createPoolStatusCache(async (pool) => {
    calls += 1;
    active += 1;
    peak = Math.max(peak, active);
    await new Promise((resolve) => setImmediate(resolve));
    active -= 1;
    return { pool, progressPercent: 10 };
  }, { now: () => now, freshMs: 60_000 });

  const [first, duplicate, second] = await Promise.all([cache.read("pool-a"), cache.read("pool-a"), cache.read("pool-b")]);
  assert.equal(calls, 2);
  assert.equal(peak, 1);
  assert.deepEqual(first, duplicate);
  assert.equal(second.status.pool, "pool-b");
  assert.equal((await cache.read("pool-a")).status.progressPercent, 10);
  assert.equal(calls, 2);

  now += 60_001;
  await cache.read("pool-a");
  assert.equal(calls, 3);
});

test("rate-limit failure preserves verified state and backs off before retry", async () => {
  let now = 10_000;
  let calls = 0;
  const cache = createPoolStatusCache(async () => {
    calls += 1;
    if (calls === 2) throw new Error("429 Too Many Requests");
    return { progressPercent: calls * 10 };
  }, { now: () => now, freshMs: 60_000, failureMs: 90_000 });

  const first = await cache.read("pool-a");
  now += 60_001;
  const delayed = await cache.read("pool-a");
  assert.equal(delayed.stale, true);
  assert.equal(delayed.status.progressPercent, first.status.progressPercent);
  assert.equal(delayed.checkedAt, first.checkedAt);
  assert.match(delayed.error.message, /429/);
  await cache.read("pool-a");
  assert.equal(calls, 2);

  now += 90_001;
  const recovered = await cache.read("pool-a");
  assert.equal(recovered.stale, false);
  assert.equal(recovered.status.progressPercent, 30);
  assert.equal(calls, 3);
});
