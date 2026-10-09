import assert from "node:assert/strict";
import test from "node:test";
import { CONVICTION_PROOF_POLICY, scoreConvictionProof } from "../server/services/conviction-proof.js";

function buy(wallet, signature, slot, quoteLamports) {
  return { type: "dbc_buy_verified", wallet, payload: { signature, slot, quoteLamports: String(quoteLamports) } };
}

test("checkpoint scores distinct wallets only from qualifying verified buys and current balances", () => {
  const events = [
    buy("wallet-a", "small", 1, 1_000_000),
    buy("wallet-a", "first-qualifying", 2, 20_000_000),
    buy("wallet-a", "repeat", 3, 30_000_000),
    buy("wallet-b", "another", 4, 10_000_000),
    { type: "dbc_sell_verified", wallet: "wallet-c", payload: { slot: 5, quoteLamports: "999999999" } },
  ];
  const balances = new Map([
    ["wallet-a", { amount: "1000000", slot: 8, accounts: ["ata-a"] }],
    ["wallet-b", { amount: "0", slot: 9, accounts: ["ata-b"] }],
  ]);
  const result = scoreConvictionProof({ events, balances, migrated: true });
  assert.equal(result.length, 2);
  assert.equal(result[0].buySignature, "first-qualifying");
  assert.equal(result[0].status, "meets_checkpoint_now");
  assert.equal(result[0].score, 1);
  assert.equal(result[1].status, "balance_below_minimum");
  assert.equal(result[1].score, 0);
  assert.equal(CONVICTION_PROOF_POLICY.rewardStatus, "unfunded_proof_only");
});

test("before migration the same buy is tracked without asserting retention", () => {
  const result = scoreConvictionProof({ events: [buy("wallet-a", "buy", 1, 10_000_000)], balances: new Map(), migrated: false });
  assert.equal(result[0].status, "awaiting_migration");
  assert.equal(result[0].score, 0);
});
