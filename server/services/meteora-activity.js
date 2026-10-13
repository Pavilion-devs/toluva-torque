import { Connection, PublicKey } from "@solana/web3.js";
import { NATIVE_MINT } from "@solana/spl-token";
import { createHash } from "node:crypto";
import { config } from "../config.js";
import { METEORA_DBC_PROGRAM } from "./meteora-dbc.js";

const connection = new Connection(config.solana.rpcUrl, "finalized");
const SWAP2_DISCRIMINATOR = createHash("sha256").update("global:swap2").digest().subarray(0, 8);

function badRequest(message) {
  const error = new Error(message);
  error.status = 400;
  throw error;
}

function key(value, label) {
  try { return new PublicKey(value).toBase58(); }
  catch { return badRequest(`${label} must be a Solana public key.`); }
}

function tokenAmount(balances, index, mint, owner = null) {
  const item = (balances || []).find((balance) => balance.accountIndex === index);
  if (!item) return null;
  if (item.mint !== mint || (owner && item.owner !== owner)) return null;
  const raw = item.uiTokenAmount?.amount;
  return /^\d+$/.test(String(raw)) ? BigInt(raw) : null;
}

function balanceDelta(transaction, index, mint, owner = null) {
  const before = tokenAmount(transaction.meta.preTokenBalances, index, mint, owner);
  const after = tokenAmount(transaction.meta.postTokenBalances, index, mint, owner);
  if (before === null && after === null) return null;
  return (after || 0n) - (before || 0n);
}

export function verifyDbcSwapTransaction(transaction, { signature, pool, mint }) {
  if (!transaction || transaction.meta?.err || !transaction.meta || !transaction.transaction?.message) {
    badRequest("Transaction is unavailable or failed on chain.");
  }
  if (transaction.transaction.signatures?.[0] !== signature) badRequest("Transaction signature does not match the chain record.");
  const message = transaction.transaction.message;
  const accountKeys = message.getAccountKeys({ accountKeysFromLookups: transaction.meta.loadedAddresses });
  const address = (index) => accountKeys.get(index)?.toBase58();
  const swaps = message.compiledInstructions.filter((instruction) =>
    address(instruction.programIdIndex) === METEORA_DBC_PROGRAM
    && Buffer.from(instruction.data).subarray(0, 8).equals(SWAP2_DISCRIMINATOR));
  if (swaps.length !== 1) badRequest("Expected exactly one Meteora DBC swap2 instruction.");

  const accounts = swaps[0].accountKeyIndexes;
  if (address(accounts[2]) !== pool || address(accounts[7]) !== mint || address(accounts[8]) !== NATIVE_MINT.toBase58()) {
    badRequest("Trade does not belong to this SOL-quoted DBC pool and mint.");
  }
  const ownerIndex = accounts[9];
  const wallet = address(ownerIndex);
  if (!wallet || ownerIndex >= message.header.numRequiredSignatures) badRequest("DBC trade owner did not sign the transaction.");

  const userSourceBaseDelta = balanceDelta(transaction, accounts[3], mint, wallet);
  const userDestinationBaseDelta = balanceDelta(transaction, accounts[4], mint, wallet);
  const userBaseDelta = userSourceBaseDelta === null ? userDestinationBaseDelta
    : userDestinationBaseDelta === null ? userSourceBaseDelta : null;
  const vaultBaseDelta = balanceDelta(transaction, accounts[5], mint);
  const vaultQuoteDelta = balanceDelta(transaction, accounts[6], NATIVE_MINT.toBase58());
  if (userBaseDelta === null || vaultBaseDelta === null || vaultQuoteDelta === null) {
    badRequest("Transaction lacks the token balance evidence needed to verify the swap.");
  }
  const buy = userSourceBaseDelta === null && userBaseDelta > 0n && vaultBaseDelta < 0n && vaultQuoteDelta > 0n;
  const sell = userDestinationBaseDelta === null && userBaseDelta < 0n && vaultBaseDelta > 0n && vaultQuoteDelta < 0n;
  if (!buy && !sell) badRequest("Token balance changes do not prove a DBC buy or sell.");
  if (userBaseDelta !== -vaultBaseDelta) badRequest("User and pool base-token balance changes disagree.");

  return {
    signature, pool, mint, wallet,
    direction: buy ? "buy" : "sell",
    baseAmount: (userBaseDelta < 0n ? -userBaseDelta : userBaseDelta).toString(),
    quoteLamports: (vaultQuoteDelta < 0n ? -vaultQuoteDelta : vaultQuoteDelta).toString(),
    slot: transaction.slot,
    blockTime: transaction.blockTime || null,
    commitment: "finalized",
  };
}

export async function verifyDbcSwapSignature({ signature, pool, mint }) {
  const verifiedSignature = String(signature || "").trim();
  if (!/^[1-9A-HJ-NP-Za-km-z]{80,90}$/.test(verifiedSignature)) badRequest("Transaction signature is invalid.");
  const verifiedPool = key(pool, "Pool");
  const verifiedMint = key(mint, "Mint");
  const transaction = await connection.getTransaction(verifiedSignature, {
    commitment: "finalized",
    maxSupportedTransactionVersion: 0,
  });
  if (!transaction) {
    const error = new Error("Trade is not finalized or is unavailable from this RPC. Retry shortly.");
    error.status = 503;
    throw error;
  }
  return verifyDbcSwapTransaction(transaction, { signature: verifiedSignature, pool: verifiedPool, mint: verifiedMint });
}
