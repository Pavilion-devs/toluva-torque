import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { NATIVE_MINT } from "@solana/spl-token";
import { DynamicBondingCurveClient, MigrationOption, validateConfigParameters } from "@meteora-ag/dynamic-bonding-curve-sdk";
import { amountInBaseUnits, assertConvictionConfig, buildConvictionConfig, convictionTerms, summarizeConfig, verifyPoolLaunch } from "../server/services/meteora-dbc.js";

const confirmedConfig = JSON.parse(fs.readFileSync(new URL("./fixtures/devnet-conviction-config.json", import.meta.url), "utf8"));
const dbcClient = DynamicBondingCurveClient.create(new Connection("https://api.devnet.solana.com"), "confirmed");
const decodeConfirmedConfig = () => dbcClient.state.program.coder.accounts.decode("poolConfig", Buffer.from(confirmedConfig.data, "base64"));

test("Conviction builds a valid DAMM v2 config at the supported thresholds", () => {
  for (const migrationThresholdSol of [1, 5, 100]) {
    const payer = Keypair.generate().publicKey;
    const { curve, terms } = buildConvictionConfig({ migrationThresholdSol });
    assert.equal(curve.migrationQuoteThreshold.toString(), String(migrationThresholdSol * 1_000_000_000));
    assert.equal(curve.migrationOption, MigrationOption.MET_DAMM_V2);
    assert.equal(curve.partnerLiquidityPercentage, 0);
    assert.equal(curve.partnerPermanentLockedLiquidityPercentage, 0);
    assert.equal(curve.creatorLiquidityPercentage + curve.creatorPermanentLockedLiquidityPercentage, 100);
    assert.ok(curve.creatorPermanentLockedLiquidityPercentage >= 10);
    assert.equal(curve.tokenSupply.preMigrationTokenSupply.toString(), "1000000000000000");
    assert.equal(terms.quoteMint, NATIVE_MINT.toBase58());
    assert.doesNotThrow(() => validateConfigParameters({
      config: Keypair.generate().publicKey,
      payer,
      feeClaimer: payer,
      leftoverReceiver: payer,
      quoteMint: NATIVE_MINT,
      ...curve,
    }));
  }
});

test("Conviction rejects unsupported or invalid thresholds", () => {
  for (const migrationThresholdSol of [0, -1, 0.5, 101, Infinity, "wat"]) {
    assert.throws(() => convictionTerms({ migrationThresholdSol }), /Migration threshold/);
  }
});

test("confirmed on-chain config decodes to the disclosed Conviction terms", () => {
  const state = decodeConfirmedConfig();
  const summary = assertConvictionConfig(confirmedConfig.address, state, new PublicKey(confirmedConfig.creator), 1);
  assert.equal(summary.migratedPoolFeeBps, 30);
  assert.equal(summary.migrationQuoteThreshold, "1000000000");
  assert.equal(summary.feeClaimer, confirmedConfig.creator);
  assert.equal(summarizeConfig(confirmedConfig.address, state).fixedTokenSupply, true);
});

test("confirmed config cannot be reused with altered economics or another creator", () => {
  const state = decodeConfirmedConfig();
  state.migratedPoolFeeBps = 100;
  assert.throws(() => assertConvictionConfig(confirmedConfig.address, state, new PublicKey(confirmedConfig.creator), 1), /DAMM v2 fee/);
  assert.throws(() => assertConvictionConfig(confirmedConfig.address, decodeConfirmedConfig(), Keypair.generate().publicKey, 1), /fee claimer/);
  assert.throws(() => assertConvictionConfig(confirmedConfig.address, decodeConfirmedConfig(), new PublicKey(confirmedConfig.creator), 5), /graduation target/);
});

test("launch registration rejects a pool address unrelated to its mint and config", async () => {
  await assert.rejects(verifyPoolLaunch({
    pool: Keypair.generate().publicKey.toBase58(),
    mint: Keypair.generate().publicKey.toBase58(),
    config: Keypair.generate().publicKey.toBase58(),
    creator: Keypair.generate().publicKey.toBase58(),
    signature: Keypair.generate().publicKey.toBase58(),
  }), /Pool does not match mint and config/);
});

test("trade amounts preserve token base units and reject excess precision", () => {
  assert.equal(amountInBaseUnits("0.01", 9).toString(), "10000000");
  assert.equal(amountInBaseUnits("100.123456", 6).toString(), "100123456");
  assert.throws(() => amountInBaseUnits("0.0000001", 6), /at most 6/);
  assert.throws(() => amountInBaseUnits("0", 9), /outside the supported/);
});
