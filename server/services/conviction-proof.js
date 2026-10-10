import { Connection, PublicKey } from "@solana/web3.js";
import { config } from "../config.js";
import { listConvictionObservations, listVerifiedDbcTrades, recordConvictionObservation } from "../registry-store.js";
import { getPoolStatus } from "./meteora-dbc.js";

export const CONVICTION_PROOF_POLICY = Object.freeze({
  id: "conviction-checkpoints-v2",
  minimumVerifiedBuyLamports: "10000000",
  minimumTokenBaseUnitsAtEachCheckpoint: "1000000",
  tokenDecimals: 6,
  minimumSecondsBetweenCheckpoints: 86400,
  pointsPerPassingCheckpoint: 1,
  pointsRequiredForEligibility: 2,
  rewardStatus: "unfunded_proof_only",
  balanceRule: "Two finalized token-balance observations at least 24 hours apart after verified DAMM v2 migration. This does not prove uninterrupted holding.",
});

const connection = new Connection(config.solana.rpcUrl, "finalized");
const cache = new Map();
const CACHE_MS = 30_000;
const MAX_WALLETS = 50;

function qualifyingBuys(events) {
  const firstBuys = new Map();
  for (const event of events) {
    if (event.type !== "dbc_buy_verified" || !event.wallet || !event.payload?.signature) continue;
    const amount = String(event.payload?.quoteLamports || "");
    const slot = Number(event.payload?.slot);
    if (!/^\d+$/.test(amount) || !Number.isSafeInteger(slot) || slot <= 0
      || BigInt(amount) < BigInt(CONVICTION_PROOF_POLICY.minimumVerifiedBuyLamports)) continue;
    const existing = firstBuys.get(event.wallet);
    if (!existing || slot < Number(existing.payload.slot)) firstBuys.set(event.wallet, event);
  }
  return [...firstBuys.values()].sort((a, b) => Number(a.payload.slot) - Number(b.payload.slot)
    || a.wallet.localeCompare(b.wallet));
}

function checkpointMap(observations) {
  const byWallet = new Map();
  for (const event of observations) {
    const observation = event.payload;
    if (event.type !== "conviction_balance_checkpoint_v2" || observation?.policyId !== CONVICTION_PROOF_POLICY.id
      || !event.wallet || observation.wallet !== event.wallet
      || (observation.phase !== "entry" && observation.phase !== "followup")) continue;
    const phases = byWallet.get(event.wallet) || {};
    phases[observation.phase] = observation;
    byWallet.set(event.wallet, phases);
  }
  return byWallet;
}

export function nextCheckpointPhase({ checkpoints, migrated, blockTime }) {
  if (!migrated || !Number.isSafeInteger(blockTime)) return null;
  if (!checkpoints?.entry) return "entry";
  if (checkpoints.followup || !Number.isSafeInteger(checkpoints.entry.blockTime)) return null;
  return blockTime >= checkpoints.entry.blockTime + CONVICTION_PROOF_POLICY.minimumSecondsBetweenCheckpoints
    ? "followup" : null;
}

export function scoreConvictionProof({ events, observations, migrated }) {
  const byWallet = checkpointMap(observations);
  return qualifyingBuys(events).map((event) => {
    const checkpoints = byWallet.get(event.wallet) || {};
    const entry = checkpoints.entry || null;
    const followup = checkpoints.followup || null;
    const minimum = BigInt(CONVICTION_PROOF_POLICY.minimumTokenBaseUnitsAtEachCheckpoint);
    const entryPass = entry && entry.slot > event.payload.slot && /^\d+$/.test(String(entry.amount)) && BigInt(entry.amount) >= minimum;
    const followupPass = followup && /^\d+$/.test(String(followup.amount)) && BigInt(followup.amount) >= minimum;
    const validWindow = entry && followup && Number.isSafeInteger(entry.blockTime) && Number.isSafeInteger(followup.blockTime)
      && followup.slot > entry.slot
      && followup.blockTime - entry.blockTime >= CONVICTION_PROOF_POLICY.minimumSecondsBetweenCheckpoints;
    const score = migrated ? ((entryPass ? 1 : 0) + (validWindow && followupPass ? 1 : 0)) * CONVICTION_PROOF_POLICY.pointsPerPassingCheckpoint : 0;
    const eligible = Boolean(migrated && validWindow && entryPass && followupPass);
    return {
      wallet: event.wallet,
      buySignature: event.payload.signature,
      buySlot: event.payload.slot,
      verifiedBuyLamports: event.payload.quoteLamports,
      checkpoints: { entry, followup },
      nextCheckpointAfter: entry && !followup
        ? new Date((entry.blockTime + CONVICTION_PROOF_POLICY.minimumSecondsBetweenCheckpoints) * 1000).toISOString() : null,
      status: !migrated ? "awaiting_migration" : eligible ? "eligible" : !entry ? "awaiting_entry"
        : !followup ? "awaiting_followup" : "did_not_meet_policy",
      score,
      eligible,
    };
  }).sort((a, b) => b.score - a.score || a.buySlot - b.buySlot || a.wallet.localeCompare(b.wallet));
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
  const blockTime = await connection.getBlockTime(response.context.slot);
  if (!Number.isSafeInteger(blockTime) || blockTime <= 0) throw new Error("Finalized balance slot has no chain timestamp yet.");
  return { amount: amount.toString(), slot: response.context.slot, blockTime, accounts };
}

async function buildConvictionProof(launch) {
  const [{ events, complete }, pool, existing] = await Promise.all([
    listVerifiedDbcTrades(launch), getPoolStatus(launch.dbc.pool), listConvictionObservations(launch),
  ]);
  const migrated = pool.dammV2?.verified === true;
  const candidates = qualifyingBuys(events);
  const selected = candidates.slice(0, MAX_WALLETS);
  const observations = [...existing];
  const byWallet = checkpointMap(existing);
  const errors = [];
  if (migrated) {
    for (let index = 0; index < selected.length; index += 4) {
      await Promise.all(selected.slice(index, index + 4).map(async (buy) => {
        const wallet = buy.wallet;
        const checkpoints = byWallet.get(wallet) || {};
        if (checkpoints.followup) return;
        if (checkpoints.entry && Date.now() / 1000 < checkpoints.entry.blockTime + CONVICTION_PROOF_POLICY.minimumSecondsBetweenCheckpoints) return;
        try {
          const balance = await readWalletBalance(wallet, launch.dbc.mint);
          const phase = nextCheckpointPhase({ checkpoints, migrated, blockTime: balance.blockTime });
          if (!phase) return;
          const event = await recordConvictionObservation(launch, { ...balance, wallet, phase });
          observations.push(event);
        } catch (error) {
          errors.push({ wallet, message: error.message || "Balance observation failed." });
        }
      }));
    }
  }
  const selectedWallets = new Set(selected.map((event) => event.wallet));
  const participants = scoreConvictionProof({ events, observations, migrated })
    .filter((person) => selectedWallets.has(person.wallet));
  return {
    policy: CONVICTION_PROOF_POLICY,
    pool: launch.dbc.pool,
    mint: launch.dbc.mint,
    migrated,
    source: "finalized_submitted_swaps_and_persisted_finalized_balance_checkpoints",
    complete: complete && candidates.length <= MAX_WALLETS,
    checkedAt: new Date().toISOString(),
    qualifyingWalletsTracked: participants.length,
    walletsEligible: participants.filter((person) => person.eligible).length,
    observationErrors: errors,
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
