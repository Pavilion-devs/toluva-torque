import { createPublicKey, verify } from "node:crypto";
import { createRequire } from "node:module";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { NATIVE_MINT } from "@solana/spl-token";
import BN from "bn.js";
import { config } from "../config.js";
import { getPoolStatus } from "./meteora-dbc.js";

// The published DLMM ESM bundle currently imports an Anchor directory that Node
// cannot resolve. Its documented CommonJS export works in the API runtime.
const require = createRequire(import.meta.url);
const DLMM = require("@meteora-ag/dlmm");
const {
  CollectFeeMode, ConcreteFunctionType, LBCLMM_PROGRAM_IDS,
  StrategyType, deriveLbPairWithPresetParamWithIndexKey,
} = DLMM;
const programId = new PublicKey(LBCLMM_PROGRAM_IDS.devnet);
const connection = new Connection(config.solana.rpcUrl, "confirmed");
const ED25519_SPKI_PREFIX = Buffer.from("302a300506032b6570032100", "hex");
const PRICE_SCALE = 10n ** 18n;
const Q128 = 1n << 128n;
const POSITION_RANGE_BINS = 10;

function fail(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  throw error;
}

function key(value, label) {
  try { return new PublicKey(value); }
  catch { return fail(`${label} must be a Solana public key.`); }
}

export function parseDlmmAmount(value, decimals, label) {
  const source = String(value ?? "").trim();
  if (!/^(?:0|[1-9]\d*)(?:\.\d+)?$/.test(source)) fail(`${label} must be a positive number.`);
  const [whole, fraction = ""] = source.split(".");
  if (fraction.length > decimals) fail(`${label} has too many decimal places.`);
  const units = BigInt(whole) * 10n ** BigInt(decimals) + BigInt((fraction.padEnd(decimals, "0") || "0"));
  if (units < 0n || units >= 1n << 64n) fail(`${label} is outside the supported range.`);
  return new BN(units.toString());
}

function decimal(numerator, denominator) {
  const scaled = numerator * PRICE_SCALE / denominator;
  return `${scaled / PRICE_SCALE}.${String(scaled % PRICE_SCALE).padStart(18, "0")}`;
}

export function dammSpotPriceRaw(sqrtPrice, baseIsTokenA) {
  const squared = BigInt(String(sqrtPrice)) ** 2n;
  if (squared <= 0n) fail("DAMM v2 has no usable reference price.");
  return baseIsTokenA ? decimal(squared, Q128) : decimal(Q128, squared);
}

function requireGraduated(launch, status) {
  if (config.solana.cluster !== "devnet" || launch.dbc?.cluster !== "devnet") fail("DLMM liquidity is currently available on devnet only.");
  if (!status?.dammV2?.verified || !status.dammV2.sqrtPrice) fail("The DBC launch must graduate to a verified DAMM v2 pool first.");
}

async function selectedPreset() {
  const { presetParameter2 } = await DLMM.getAllPresetParameters(connection, { cluster: "devnet" });
  const preset = presetParameter2.find(({ account }) => account.binStep === 10
    && account.concreteFunctionType === ConcreteFunctionType.LiquidityMining
    && account.collectFeeMode === CollectFeeMode.InputOnly);
  if (!preset) fail("The selected Meteora DLMM liquidity preset is unavailable on devnet.", 503);
  return preset;
}

function poolAddress(launch, preset) {
  return deriveLbPairWithPresetParamWithIndexKey(
    preset.publicKey, key(launch.dbc.mint, "Launch mint"), NATIVE_MINT, programId,
  )[0];
}

async function loadVerifiedPool(address, launch) {
  const pool = await DLMM.create(connection, address, { cluster: "devnet" });
  if (!pool.pubkey.equals(address)
    || !pool.tokenX.publicKey.equals(key(launch.dbc.mint, "Launch mint"))
    || !pool.tokenY.publicKey.equals(NATIVE_MINT)
    || pool.tokenX.mint.decimals !== 6 || pool.tokenY.mint.decimals !== 9) {
    fail("This DLMM pool does not trade the launch token against SOL.");
  }
  return pool;
}

export async function getDlmmPlan(launch) {
  const status = await getPoolStatus(launch.dbc.pool);
  requireGraduated(launch, status);
  const preset = await selectedPreset();
  const address = poolAddress(launch, preset);
  const baseIsTokenA = status.dammV2.tokenAMint === launch.dbc.mint;
  const rawPrice = dammSpotPriceRaw(status.dammV2.sqrtPrice, baseIsTokenA);
  const activeId = DLMM.getBinIdFromPrice(rawPrice, preset.account.binStep, true);
  if (!Number.isSafeInteger(activeId)) fail("The DAMM v2 price is outside the DLMM preset's range.");
  const account = await connection.getAccountInfo(address, "confirmed");
  if (account && !account.owner.equals(programId)) fail("Derived DLMM address has an unexpected owner.");
  if (account) await loadVerifiedPool(address, launch);
  return {
    cluster: "devnet", address: address.toBase58(), preset: preset.publicKey.toBase58(),
    binStep: preset.account.binStep, activeId, referencePriceRaw: rawPrice,
    referencePool: status.dammV2.pool, exists: Boolean(account), linked: launch.dbc.dlmm?.pool === address.toBase58(),
    tokenX: launch.dbc.mint, tokenY: NATIVE_MINT.toBase58(),
  };
}

async function unsigned(transaction, payer) {
  if (!(transaction instanceof Transaction)) fail("The DLMM SDK returned an unsupported transaction.", 503);
  const latest = await connection.getLatestBlockhash("confirmed");
  transaction.feePayer = payer;
  transaction.recentBlockhash = latest.blockhash;
  if (!transaction.instructions.some((instruction) => instruction.programId.equals(programId))) fail("Transaction does not invoke Meteora DLMM.", 503);
  return { transaction: transaction.serialize({ requireAllSignatures: false, verifySignatures: false }).toString("base64"), programId: programId.toBase58() };
}

export async function buildDlmmPoolTransaction(launch, payerAddress) {
  const payer = key(payerAddress, "Payer");
  if (!payer.equals(key(launch.creator, "Creator"))) fail("Only this launch's creator can link a DLMM pool.", 403);
  const plan = await getDlmmPlan(launch);
  if (plan.exists) fail("This linked DLMM pool already exists.", 409);
  const transaction = await DLMM.createLbPair2(
    connection, payer, key(plan.tokenX, "Launch mint"), NATIVE_MINT,
    key(plan.preset, "DLMM preset"), new BN(plan.activeId), { cluster: "devnet" },
  );
  return { ...(await unsigned(transaction, payer)), plan };
}

export function dlmmLinkMessage({ launch, pool, wallet, expiresAt }) {
  return [
    "Toluva DLMM pool link", "Network: devnet", `DBC pool: ${launch.dbc.pool}`,
    `Token mint: ${launch.dbc.mint}`, `DLMM pool: ${pool}`, `Creator: ${wallet}`,
    `Expires: ${expiresAt}`,
  ].join("\n");
}

export async function createDlmmLinkChallenge(launch, input, now = Date.now()) {
  const wallet = key(input.wallet, "Creator wallet").toBase58();
  if (wallet !== launch.creator) fail("Only the launch creator can link a DLMM pool.", 403);
  const plan = await getDlmmPlan(launch);
  if (!plan.exists || String(input.pool) !== plan.address) fail("The expected DLMM pool is not yet on chain.");
  const expiresAt = Math.floor(now / 1000) + 300;
  return { wallet, pool: plan.address, expiresAt, message: dlmmLinkMessage({ launch, pool: plan.address, wallet, expiresAt }) };
}

export async function verifyDlmmLinkAuthorization(launch, input, now = Date.now()) {
  const plan = await getDlmmPlan(launch);
  return verifyDlmmLinkSignature(launch, input, plan, now);
}

export function verifyDlmmLinkSignature(launch, input, plan, now = Date.now()) {
  const wallet = key(input.wallet, "Creator wallet").toBase58();
  if (wallet !== launch.creator) fail("Only the launch creator can link a DLMM pool.", 403);
  const expiresAt = Number(input.expiresAt);
  const current = Math.floor(now / 1000);
  if (!Number.isInteger(expiresAt) || expiresAt < current || expiresAt > current + 300) fail("DLMM approval expired. Review it again.");
  if (!plan.exists || String(input.pool) !== plan.address) fail("The expected DLMM pool is not yet on chain.");
  const message = dlmmLinkMessage({ launch, pool: plan.address, wallet, expiresAt });
  if (input.message !== message) fail("DLMM approval differs from the reviewed pool.");
  const signature = Buffer.from(String(input.signature || ""), "base64");
  if (signature.length !== 64) fail("A valid wallet approval is required.");
  const publicKey = createPublicKey({
    key: Buffer.concat([ED25519_SPKI_PREFIX, new PublicKey(wallet).toBuffer()]),
    format: "der", type: "spki",
  });
  if (!verify(null, Buffer.from(message), publicKey, signature)) fail("The creator wallet did not approve this DLMM pool.");
  return plan;
}

export async function getLinkedDlmmStatus(launch, walletAddress = null) {
  if (!launch.dbc?.dlmm?.pool) return { linked: false };
  const address = key(launch.dbc.dlmm.pool, "DLMM pool");
  const pool = await loadVerifiedPool(address, launch);
  const activeBin = await pool.getActiveBin();
  const result = {
    linked: true, pool: address.toBase58(), tokenX: pool.tokenX.publicKey.toBase58(),
    tokenY: pool.tokenY.publicKey.toBase58(), binStep: pool.lbPair.binStep,
    activeBinId: activeBin.binId, priceRaw: activeBin.price,
    tokenXReserve: pool.tokenX.amount.toString(), tokenYReserve: pool.tokenY.amount.toString(),
    positions: [],
  };
  if (walletAddress) {
    const wallet = key(walletAddress, "Wallet");
    const { userPositions } = await pool.getPositionsByUserAndLbPair(wallet);
    result.positions = userPositions.filter((item) => item.positionData.owner.equals(wallet)).map((item) => ({
      address: item.publicKey.toBase58(), lowerBinId: item.positionData.lowerBinId,
      upperBinId: item.positionData.upperBinId,
      tokenXAmount: item.positionData.totalXAmount,
      tokenYAmount: item.positionData.totalYAmount,
      feeXAmount: item.positionData.feeX.toString(),
      feeYAmount: item.positionData.feeY.toString(),
    }));
  }
  return result;
}

export async function buildDlmmPositionTransaction(launch, input) {
  if (!launch.dbc?.dlmm?.pool) fail("This launch has no linked DLMM pool.");
  const wallet = key(input.wallet, "Wallet");
  const position = key(input.position, "Position");
  const baseAmount = parseDlmmAmount(input.baseAmount, 6, "Token amount");
  const quoteAmount = parseDlmmAmount(input.quoteAmount, 9, "SOL amount");
  if (baseAmount.isZero() || quoteAmount.isZero()) fail("Enter positive token and SOL amounts to add.");
  const pool = await loadVerifiedPool(key(launch.dbc.dlmm.pool, "DLMM pool"), launch);
  const activeBin = await pool.getActiveBin();
  const transaction = await pool.initializePositionAndAddLiquidityByStrategy({
    positionPubKey: position, user: wallet,
    totalXAmount: baseAmount, totalYAmount: quoteAmount,
    strategy: { minBinId: activeBin.binId - POSITION_RANGE_BINS,
      maxBinId: activeBin.binId + POSITION_RANGE_BINS, strategyType: StrategyType.Spot },
    slippage: 1,
  });
  return {
    ...(await unsigned(transaction, wallet)), pool: pool.pubkey.toBase58(), position: position.toBase58(),
    baseAmount: input.baseAmount, quoteAmount: input.quoteAmount,
    minBinId: activeBin.binId - POSITION_RANGE_BINS,
    maxBinId: activeBin.binId + POSITION_RANGE_BINS,
  };
}

export async function buildDlmmWithdrawalTransactions(launch, input) {
  if (!launch.dbc?.dlmm?.pool) fail("This launch has no linked DLMM pool.");
  const wallet = key(input.wallet, "Wallet");
  const position = key(input.position, "Position");
  const pool = await loadVerifiedPool(key(launch.dbc.dlmm.pool, "DLMM pool"), launch);
  const { userPositions } = await pool.getPositionsByUserAndLbPair(wallet);
  const owned = userPositions.find((item) => item.publicKey.equals(position) && item.positionData.owner.equals(wallet));
  if (!owned) fail("This wallet does not own the selected DLMM position.", 403);
  const empty = owned.positionData.totalXAmount === "0"
    && owned.positionData.totalYAmount === "0"
    && owned.positionData.feeX.isZero() && owned.positionData.feeY.isZero()
    && owned.positionData.rewardOne.isZero() && owned.positionData.rewardTwo.isZero();
  const transactions = empty
    ? [await pool.closePositionIfEmpty({ owner: wallet, position: owned })]
    : await pool.removeLiquidity({
      user: wallet, position,
      fromBinId: owned.positionData.lowerBinId,
      toBinId: owned.positionData.upperBinId,
      bps: new BN(10_000), shouldClaimAndClose: true,
    });
  if (!Array.isArray(transactions) || !transactions.length) fail("No liquidity withdrawal transaction was created.", 503);
  return {
    pool: pool.pubkey.toBase58(), position: position.toBase58(), wallet: wallet.toBase58(),
    withdrawBps: 10_000, closePosition: true,
    transactions: await Promise.all(transactions.map((transaction) => unsigned(transaction, wallet))),
  };
}
