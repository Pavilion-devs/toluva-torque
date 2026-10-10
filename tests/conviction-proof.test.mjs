import assert from "node:assert/strict";
import test from "node:test";
import { CONVICTION_PROOF_POLICY, nextCheckpointPhase, scoreConvictionProof } from "../server/services/conviction-proof.js";
import { recordEvent } from "../server/registry-store.js";

function buy(wallet, signature, slot, quoteLamports) {
  return { type: "dbc_buy_verified", wallet, payload: { signature, slot, quoteLamports: String(quoteLamports) } };
}

function observation(wallet, phase, slot, blockTime, amount, policyId = CONVICTION_PROOF_POLICY.id) {
  return {
    type: "conviction_balance_checkpoint_v2", wallet,
    payload: { wallet, phase, slot, blockTime, amount: String(amount), accounts: [], policyId },
  };
}

test("two wallets rank by persisted checkpoints; repeat buys and sells add no points", () => {
  const events = [
    buy("wallet-a", "small", 1, 1_000_000),
    buy("wallet-a", "first-qualifying", 2, 20_000_000),
    buy("wallet-a", "repeat", 3, 30_000_000),
    buy("wallet-b", "another", 4, 10_000_000),
    { type: "dbc_sell_verified", wallet: "wallet-a", payload: { slot: 5, quoteLamports: "999999999" } },
  ];
  const observations = [
    observation("wallet-a", "entry", 10, 1_000_000, 1_000_000),
    observation("wallet-b", "entry", 11, 1_000_001, 1_000_000),
    observation("wallet-a", "followup", 20, 1_086_401, 2_000_000),
    observation("wallet-b", "followup", 21, 1_086_402, 0),
  ];
  const result = scoreConvictionProof({ events, observations, migrated: true });
  assert.equal(result.length, 2);
  assert.equal(result[0].wallet, "wallet-a");
  assert.equal(result[0].buySignature, "first-qualifying");
  assert.equal(result[0].score, 2);
  assert.equal(result[0].eligible, true);
  assert.equal(result[1].wallet, "wallet-b");
  assert.equal(result[1].score, 1);
  assert.equal(result[1].eligible, false);
  assert.equal(CONVICTION_PROOF_POLICY.rewardStatus, "unfunded_proof_only");
});

test("a replayed buy, client event, early second read, and wrong policy cannot create eligibility", () => {
  const events = [
    buy("wallet-a", "same-signature", 2, 10_000_000),
    buy("wallet-a", "same-signature", 2, 10_000_000),
    { type: "first_buy_completed", wallet: "wallet-c", payload: { signature: "fake", slot: 1, quoteLamports: "1000000000" } },
  ];
  const observations = [
    observation("wallet-a", "entry", 10, 1_000_000, 1_000_000),
    observation("wallet-a", "followup", 20, 1_086_399, 1_000_000),
    observation("wallet-c", "followup", 30, 1_086_500, 1_000_000),
    observation("wallet-a", "followup", 21, 1_086_500, 1_000_000, "old-policy"),
  ];
  const result = scoreConvictionProof({ events, observations, migrated: true });
  assert.equal(result.length, 1);
  assert.equal(result[0].score, 1);
  assert.equal(result[0].eligible, false);
  assert.equal(nextCheckpointPhase({ checkpoints: { entry: observations[0].payload }, migrated: true, blockTime: 1_086_399 }), null);
  assert.equal(nextCheckpointPhase({ checkpoints: { entry: observations[0].payload }, migrated: true, blockTime: 1_086_400 }), "followup");
});

test("migration and a post-buy first observation are required", () => {
  const events = [buy("wallet-a", "buy", 8, 10_000_000)];
  const observations = [observation("wallet-a", "entry", 7, 1_000_000, 1_000_000)];
  assert.equal(scoreConvictionProof({ events, observations, migrated: true })[0].score, 0);
  assert.equal(scoreConvictionProof({ events, observations, migrated: false })[0].score, 0);
  assert.equal(nextCheckpointPhase({ checkpoints: {}, migrated: false, blockTime: 1_000_000 }), null);
});

test("public event ingestion cannot forge DBC trades or conviction observations", async () => {
  await assert.rejects(recordEvent({ type: "dbc_buy_verified", wallet: "wallet-a" }), /recorded only by server verifiers/);
  await assert.rejects(recordEvent({ type: "conviction_balance_checkpoint_v2", wallet: "wallet-a" }), /recorded only by server verifiers/);
  await assert.rejects(recordEvent({ id: "conviction_v2_fake", type: "other" }), /recorded only by server verifiers/);
});
