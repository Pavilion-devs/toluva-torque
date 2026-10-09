import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

test("verified DBC receipts are idempotent and count unique tracked buyers", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "toluva-activity-"));
  process.env.TOLUVA_REGISTRY_PATH = path.join(directory, "registry.json");
  await writeFile(process.env.TOLUVA_REGISTRY_PATH, JSON.stringify({ launches: [], campaigns: [], eventReceipts: [], liveEvents: [] }));
  try {
    const { recordVerifiedDbcTrade, getVerifiedDbcActivity, readRegistry, recordEvent } = await import("../server/registry-store.js");
    const launch = { sym: "TEST-MINT" };
    const first = { signature: "signature-one", direction: "buy", wallet: "wallet-one", pool: "pool", mint: "mint", baseAmount: "100", quoteLamports: "1000", slot: 10, blockTime: 1_700_000_000 };
    await recordVerifiedDbcTrade(launch, first);
    await recordVerifiedDbcTrade(launch, first);
    await recordVerifiedDbcTrade(launch, { ...first, signature: "signature-two", slot: 20 });
    const activity = await getVerifiedDbcActivity(launch);
    assert.equal(activity.trackedBuys, 2);
    assert.equal(activity.trackedBuyers, 1);
    assert.equal(activity.recent[0].signature, "signature-two");
    assert.equal((await readRegistry()).eventReceipts.length, 2);
    await assert.rejects(recordEvent({ type: "dbc_buy_verified", id: "dbc_swap_fake" }), /only by the on-chain transaction verifier/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
