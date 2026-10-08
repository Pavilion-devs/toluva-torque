import assert from "node:assert/strict";
import test from "node:test";
import { hasLockedVesting, migrationReady, migrationStage } from "../server/services/meteora-lifecycle.js";

const config = {
  migrationOption: 1,
  migrationQuoteThreshold: "1000000000",
  lockedVestingConfig: { amountPerPeriod: "0", cliffUnlockAmount: "0" },
};
const pool = { migrationProgress: 0, isMigrated: 0, quoteReserve: "990000" };

test("migration follows the DBC account stages and the on-chain quote threshold", () => {
  assert.equal(migrationStage(pool, config.migrationQuoteThreshold), "bonding");
  assert.equal(migrationReady(pool, config), false);
  assert.equal(migrationStage({ ...pool, quoteReserve: "1000000000" }, config.migrationQuoteThreshold), "curve-complete");
  assert.equal(migrationReady({ ...pool, quoteReserve: "1000000000" }, config), true);
  assert.equal(migrationStage({ ...pool, migrationProgress: 1 }, config.migrationQuoteThreshold), "post-bonding");
  assert.equal(migrationStage({ ...pool, migrationProgress: 2 }, config.migrationQuoteThreshold), "locked-vesting");
  assert.equal(migrationReady({ ...pool, migrationProgress: 2 }, config), false);
  assert.equal(migrationReady({ ...pool, migrationProgress: 2, quoteReserve: "1000000000" }, config), true);
  assert.equal(migrationStage({ ...pool, migrationProgress: 3 }, config.migrationQuoteThreshold), "created-pool");
  assert.equal(migrationReady({ ...pool, migrationProgress: 3, quoteReserve: "1000000000" }, config), false);
});

test("migration build eligibility rejects vesting and already migrated pools", () => {
  const complete = { ...pool, quoteReserve: "1000000000" };
  assert.equal(hasLockedVesting(config), false);
  assert.equal(hasLockedVesting({ lockedVestingConfig: { amountPerPeriod: "1", cliffUnlockAmount: "0" } }), true);
  assert.equal(migrationReady(complete, { ...config, lockedVestingConfig: { amountPerPeriod: "1" } }), false);
  assert.equal(migrationReady({ ...complete, isMigrated: 1 }, config), false);
  assert.equal(migrationReady(complete, { ...config, migrationOption: 0 }), false);
});
