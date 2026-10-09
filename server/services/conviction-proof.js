import { Connection, PublicKey } from "@solana/web3.js";
import { config } from "../config.js";
import { listVerifiedDbcTrades } from "../registry-store.js";
import { getPoolStatus } from "./meteora-dbc.js";

export const CONVICTION_PROOF_POLICY = Object.freeze({
  id: "graduation-checkpoint-v1",
  minimumVerifiedBuyLamports: "10000000",
  minimumCurrentTokenBaseUnits: "1000000",
  scorePerWallet: 1,
  rewardStatus: "unfunded_proof_only",
  balanceRule: "Current finalized token balance after verified DAMM v2 migration; uninterrupted holding is not asserted.",
});

const connection = new Connection(config.solana.rpcUrl, "finalized");
const cache = new Map();
const CACHE_MS = 30_000;
const MAX_WALLETS = 50;

export function scoreConvictionProof({ events, balances, migrated }) {
  const firstBuys = new Map();
  for (const event of events) {
    if (event.type !== "dbc_buy_verified") continue;
    const lamports = BigInt(event.payload?.quoteLamports || "0");
    if (lamports < BigInt(CONVICTION_PROOF_POLICY.minimumVerifiedBuyLamports)) continue;
    const wallet = event.wallet;
    if (!wallet) continue;
    const existing = firstBuys.get(wallet);
    if (!existing || Number(event.payload.slot) < Number(existing.payload.slot)) firstBuys.set(wallet, event);
  }
  return [...firstBuys.values()]
    .sort((a, b) => Number(a.payload.slot) - Number(b.payload.slot))
    .map((event) => {
      const balance = balances.get(event.wallet);
      const heldBaseUnits = balance?.amount ?? null;
      const meetsCheckpoint = migrated && heldBaseUnits !== null
        && BigInt(heldBaseUnits) >= BigInt(CONVICTION_PROOF_POLICY.minimumCurrentTokenBaseUnits);
      return {
        wallet: event.wallet,
        buySignature: event.payload.signature,
        buySlot: event.payload.slot,
        verifiedBuyLamports: event.payload.quoteLamports,
        heldBaseUnits,
        balanceSlot: balance?.slot ?? null,
        tokenAccounts: balance?.accounts ?? [],
        status: !migrated ? "awaiting_migration" : heldBaseUnits === null ? "balance_unavailable" : meetsCheckpoint ? "meets_checkpoint_now" : "balance_below_minimum",
        score: meetsCheckpoint ? CONVICTION_PROOF_POLICY.scorePerWallet : 0,
      };
    });
}

async function readWalletBalance(wallet, mint) {
  const response = await connection.getParsedTokenAccountsByOwner(new PublicKey(wallet), { mint: new PublicKey(mint) }, "finalized");
  let amount = 0n;
  const accounts = [];
  for (const entry of response.value) {
    const info = entry.account.data?.parsed?.info;
    if (info?.mint !== mint || info?.owner !== wallet || !/^\d+$/.test(String(info.tokenAmount?.amount))) continue;
    amount += BigInt(info.tokenAmount.amount);
    accounts.push(entry.pubkey.toBase58());
  }
  return { amount: amount.toString(), slot: response.context.slot, accounts };
}

async function buildConvictionProof(launch) {
  const { events, complete } = await listVerifiedDbcTrades(launch);
  const pool = await getPoolStatus(launch.dbc.pool);
  const migrated = pool.dammV2?.verified === true;
  const qualifyingWallets = scoreConvictionProof({ events, balances: new Map(), migrated: false }).map((person) => person.wallet);
  const selectedWallets = qualifyingWallets.slice(0, MAX_WALLETS);
  const balances = new Map();
  if (migrated) {
    for (let index = 0; index < selectedWallets.length; index += 4) {
      const batch = selectedWallets.slice(index, index + 4);
      await Promise.all(batch.map(async (wallet) => {
        try { balances.set(wallet, await readWalletBalance(wallet, launch.dbc.mint)); }
        catch { balances.set(wallet, { amount: null, slot: null, accounts: [] }); }
      }));
    }
  }
  const selectedSet = new Set(selectedWallets);
  const participants = scoreConvictionProof({ events, balances, migrated }).filter((person) => selectedSet.has(person.wallet));
  return {
    policy: CONVICTION_PROOF_POLICY,
    pool: launch.dbc.pool,
    mint: launch.dbc.mint,
    migrated,
    source: "finalized_submitted_swaps_and_current_finalized_token_balances",
    complete: complete && qualifyingWallets.length <= MAX_WALLETS,
    checkedAt: new Date().toISOString(),
    qualifyingWalletsTracked: participants.length,
    walletsMeetingCheckpointNow: participants.filter((participant) => participant.status === "meets_checkpoint_now").length,
    participants,
  };
}

export async function getConvictionProof(launch) {
  const pool = launch.dbc?.pool;
  if (!pool) throw new Error("A registered DBC pool is required.");
  const existing = cache.get(pool);
  if (existing && existing.expiresAt > Date.now()) return existing.promise;
  const promise = buildConvictionProof(launch);
  cache.set(pool, { promise, expiresAt: Date.now() + CACHE_MS });
  try { return await promise; }
  catch (error) { cache.delete(pool); throw error; }
}
