import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { PublicKey } from "@solana/web3.js";
import { verifyDbcSwapTransaction } from "../server/services/meteora-activity.js";

const wallet = "Dc12XGCWDcnxpjDsYuz89vFqYJ4YHxYb3dvGFBC22MdL";
const pool = "DFxmgj3i6rRsf1p13FxuvKELZ3Ktk5MVGLNcKPu8Kbaa";
const mint = "4eRL2sk1EUdAi3YuBDfqT2xx46X5WFpN7N3xmN9QSDtj";
const nativeMint = "So11111111111111111111111111111111111111112";
const program = "dbcij3LWUppWqq96dh6gJWwBifmcGfLSB5D4DuSMaqN";
const keys = [wallet, pool, mint, nativeMint, "G8Qm7wzmVq99rdRychUGRJ3RL8qvriZi19jjn7aNNTg6", "8PvaPgHY3PPxn8sxDKe83AXUWrnov463o2UqFtvEGSuE", "Z1vH3uJbagf8FC8Q6EpSpEmsJK6azZpawJse47iRfQQ", program, "Che9BeFUM6LwY8zmkxZkyKQoYDXwCpvV9oWSvrFXHAMj"].map((address) => new PublicKey(address));
const discriminator = createHash("sha256").update("global:swap2").digest().subarray(0, 8);

function balance(accountIndex, tokenMint, amount, owner = pool) {
  return { accountIndex, mint: tokenMint, owner, uiTokenAmount: { amount: String(amount) } };
}

function fixture(direction = "buy") {
  const buy = direction === "buy";
  return {
    slot: 12345,
    blockTime: 1_700_000_000,
    meta: {
      err: null,
      preTokenBalances: [balance(4, mint, buy ? 0 : 100, wallet), balance(5, mint, buy ? 1000 : 900), balance(6, nativeMint, buy ? 0 : 1000)],
      postTokenBalances: [balance(4, mint, buy ? 100 : 0, wallet), balance(5, mint, buy ? 900 : 1000), balance(6, nativeMint, buy ? 1000 : 0)],
    },
    transaction: {
      signatures: ["example-signature"],
      message: {
        header: { numRequiredSignatures: 1 },
        getAccountKeys: () => ({ get: (index) => keys[index] }),
        compiledInstructions: [{ programIdIndex: 7, data: discriminator, accountKeyIndexes: [0, 0, 1, buy ? 8 : 4, buy ? 4 : 8, 5, 6, 2, 3, 0] }],
      },
    },
  };
}

const expected = { signature: "example-signature", pool, mint };

test("verifies signed DBC buys and sells from pool and wallet token balances", () => {
  const buy = verifyDbcSwapTransaction(fixture("buy"), expected);
  assert.equal(buy.direction, "buy");
  assert.equal(buy.wallet, wallet);
  assert.equal(buy.baseAmount, "100");
  assert.equal(buy.quoteLamports, "1000");
  const sell = verifyDbcSwapTransaction(fixture("sell"), expected);
  assert.equal(sell.direction, "sell");
  assert.equal(sell.baseAmount, "100");
});

test("rejects unrelated, unsigned, failed, and ambiguous swap evidence", () => {
  assert.throws(() => verifyDbcSwapTransaction(fixture(), { ...expected, pool: wallet }), /does not belong/);
  const unsigned = fixture();
  unsigned.transaction.message.header.numRequiredSignatures = 0;
  assert.throws(() => verifyDbcSwapTransaction(unsigned, expected), /did not sign/);
  const failed = fixture();
  failed.meta.err = { InstructionError: [0, "Custom"] };
  assert.throws(() => verifyDbcSwapTransaction(failed, expected), /failed on chain/);
  const ambiguous = fixture();
  ambiguous.transaction.message.compiledInstructions.push(ambiguous.transaction.message.compiledInstructions[0]);
  assert.throws(() => verifyDbcSwapTransaction(ambiguous, expected), /exactly one/);
  const wrongBalance = fixture();
  wrongBalance.meta.postTokenBalances[1].uiTokenAmount.amount = "901";
  assert.throws(() => verifyDbcSwapTransaction(wrongBalance, expected), /disagree/);
});
