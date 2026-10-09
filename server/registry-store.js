import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { config } from "./config.js";

// ─── Supabase client (optional) ───────────────────────────────────────────────

let supabase = null;

if (config.supabase.url && config.supabase.serviceRoleKey) {
  const { createClient } = await import("@supabase/supabase-js");
  supabase = createClient(config.supabase.url, config.supabase.serviceRoleKey);
  console.log("Registry: using Supabase.");
} else {
  console.log("Registry: using file-backed store (no Supabase config).");
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const registryPath = config.registry.path;
const seedRegistryPath = config.registry.seedPath;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function nextId(items) {
  return items.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1;
}

function dbErr(label, error) {
  const err = new Error(`Supabase ${label} failed: ${error?.message || JSON.stringify(error)}`);
  err.status = 500;
  throw err;
}

// ─── Row mappers (snake_case DB → camelCase app) ──────────────────────────────

function launchFromRow(row) {
  return {
    sym: row.sym,
    name: row.name,
    description: row.description ?? "",
    image: row.image ?? null,
    status: row.status,
    bonded: row.bonded ?? 0,
    campaign: row.campaign ?? null,
    buyers: row.buyers ?? 0,
    pool: row.pool ?? null,
    age: row.age,
    migrationTime: row.migration_time,
    migrationState: row.migration_state,
    raydium: row.raydium ?? null,
    dbc: row.dbc ?? null,
    torque: row.torque ?? null,
    creator: row.creator ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function campaignFromRow(row) {
  return {
    id: row.id,
    type: row.type,
    launch: row.launch,
    status: row.status,
    pool: row.pool,
    paid: row.paid,
    progress: row.progress,
    info: row.info,
    state: row.state,
    accent: row.accent,
    torque: row.torque ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function eventFromRow(row) {
  return {
    id: row.id,
    type: row.type,
    token: row.token ?? null,
    wallet: row.wallet ?? null,
    payload: row.payload ?? {},
    torqueRequest: row.torque_request ?? null,
    torqueReceipt: row.torque_receipt ?? null,
    torqueError: row.torque_error ?? null,
    status: row.status,
    createdAt: row.created_at,
  };
}

function liveEventFromEvent(event) {
  const token = event.token ? String(event.token).toUpperCase() : null;
  const wallet = event.wallet ? `${event.wallet.slice(0, 5)}…${event.wallet.slice(-4)}` : "unknown wallet";
  return {
    type: event.type.includes("claim") ? "claim" : event.type.includes("referral") ? "raffle" : "sprint",
    token,
    time: "now",
    line: [
      { text: wallet, className: "font-mono" },
      { text: ` emitted ${event.type.replaceAll("_", " ")}` },
    ],
  };
}

// ─── Normalizers (input → DB insert shape) ────────────────────────────────────

function normalizeLaunchInsert(input) {
  const sym = String(input.sym || input.symbol || "").trim().toUpperCase();
  const name = String(input.name || "").trim();
  if (!sym || !name) {
    const error = new Error("Launch requires `sym` and `name`.");
    error.status = 400;
    throw error;
  }
  return {
    sym,
    name,
    description: typeof input.description === "string" ? input.description : "",
    image: input.image || null,
    status: input.status || "draft",
    bonded: Number(input.bonded || 0),
    campaign: input.campaign || null,
    buyers: Number(input.buyers || 0),
    pool: input.pool || null,
    age: input.age || "Draft",
    migration_time: input.migrationTime || input.migration_time || "Draft",
    migration_state: input.migrationState || input.migration_state || input.status || "draft",
    raydium: input.raydium || null,
    dbc: input.dbc || null,
    torque: input.torque || null,
    creator: input.creator || null,
    created_at: input.createdAt || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function normalizeCampaignInsert(input) {
  const type = String(input.type || "").trim();
  const launch = String(input.launch || input.sym || "").trim().toUpperCase();
  if (!type || !launch) {
    const error = new Error("Campaign requires `type` and `launch`.");
    error.status = 400;
    throw error;
  }
  return {
    type,
    launch,
    status: input.status || "scheduled",
    pool: String(input.pool || "0.0"),
    paid: String(input.paid || "0.0"),
    progress: Number(input.progress || 0),
    info: input.info || "Pending Torque setup",
    state: input.state || "Scheduled",
    accent: input.accent || "pink",
    torque: input.torque || null,
    created_at: input.createdAt || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function normalizeEventInsert(input) {
  const type = String(input.type || input.eventType || "").trim();
  if (!type) {
    const error = new Error("Event requires `type`.");
    error.status = 400;
    throw error;
  }
  return {
    id: input.id || `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type,
    token: input.token || input.launch || null,
    wallet: input.wallet || null,
    payload: input.payload || {},
    torque_request: input.torqueRequest || null,
    torque_receipt: input.torqueReceipt || null,
    torque_error: input.torqueError || null,
    status: input.status || "recorded",
    created_at: input.createdAt || new Date().toISOString(),
  };
}

// ─── Supabase registry ────────────────────────────────────────────────────────

async function readSupabaseRegistry() {
  const [launchRes, campaignRes, eventRes] = await Promise.all([
    supabase.from("launches").select("*").order("created_at", { ascending: false }),
    supabase.from("campaigns").select("*").order("created_at", { ascending: false }),
    supabase.from("event_receipts").select("*").order("created_at", { ascending: false }).limit(200),
  ]);

  if (launchRes.error) dbErr("launches select", launchRes.error);
  if (campaignRes.error) dbErr("campaigns select", campaignRes.error);
  if (eventRes.error) dbErr("event_receipts select", eventRes.error);

  const launches = (launchRes.data || []).map(launchFromRow);
  const campaigns = (campaignRes.data || []).map(campaignFromRow);
  const eventReceipts = (eventRes.data || []).map(eventFromRow);

  return {
    workspace: { name: "Toluva Studio", cluster: "devnet" },
    source: "supabase",
    launches,
    campaigns,
    liveEvents: eventReceipts.slice(0, 20).map(liveEventFromEvent),
    eventReceipts,
    campaignResults: [],
  };
}

// ─── File-backed registry (fallback) ─────────────────────────────────────────

async function readFileRegistry() {
  try {
    const raw = await readFile(registryPath, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    const seed = JSON.parse(await readFile(seedRegistryPath, "utf8"));
    await writeFileRegistry(seed);
    return seed;
  }
}

async function writeFileRegistry(nextRegistry) {
  await mkdir(path.dirname(registryPath), { recursive: true });
  const tmpPath = `${registryPath}.${process.pid}.tmp`;
  await writeFile(tmpPath, `${JSON.stringify(nextRegistry, null, 2)}\n`, "utf8");
  await rename(tmpPath, registryPath);
  return nextRegistry;
}

let fileWriteQueue = Promise.resolve();

async function updateFileRegistry(updater) {
  const write = fileWriteQueue.then(async () => {
    const current = await readFileRegistry();
    const draft = clone(current);
    const result = await updater(draft);
    await writeFileRegistry(draft);
    return result ?? draft;
  });
  fileWriteQueue = write.catch(() => {});
  return write;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function readRegistry() {
  if (supabase) return readSupabaseRegistry();
  return readFileRegistry();
}

export async function createLaunch(input) {
  if (supabase) {
    const row = normalizeLaunchInsert(input);
    const { data: existing } = await supabase.from("launches").select("sym").eq("sym", row.sym).maybeSingle();
    if (existing) {
      const error = new Error(`Launch ${row.sym} already exists.`);
      error.status = 409;
      throw error;
    }
    const { data, error } = await supabase.from("launches").insert(row).select().single();
    if (error) dbErr("launches insert", error);
    return launchFromRow(data);
  }

  return updateFileRegistry((registry) => {
    const sym = String(input.sym || input.symbol || "").trim().toUpperCase();
    const name = String(input.name || "").trim();
    if (!sym || !name) {
      const error = new Error("Launch requires `sym` and `name`.");
      error.status = 400;
      throw error;
    }
    const existing = registry.launches.find((item) => item.sym === sym);
    if (existing) {
      const error = new Error(`Launch ${sym} already exists.`);
      error.status = 409;
      throw error;
    }
    const launch = {
      sym, name,
      description: typeof input.description === "string" ? input.description : "",
      image: input.image || null, status: input.status || "draft",
      bonded: Number(input.bonded || 0), campaign: input.campaign || null,
      buyers: Number(input.buyers || 0), pool: input.pool || null,
      age: input.age || "Draft", migrationTime: input.migrationTime || "Draft",
      migrationState: input.migrationState || input.status || "draft",
      raydium: input.raydium || null, dbc: input.dbc || null, torque: input.torque || null,
      creator: input.creator || null,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    registry.launches.unshift(launch);
    return launch;
  });
}

export async function createCampaign(input) {
  if (supabase) {
    const row = normalizeCampaignInsert(input);
    const { data, error } = await supabase.from("campaigns").insert(row).select().single();
    if (error) dbErr("campaigns insert", error);
    return campaignFromRow(data);
  }

  return updateFileRegistry((registry) => {
    const type = String(input.type || "").trim();
    const launch = String(input.launch || input.sym || "").trim().toUpperCase();
    if (!type || !launch) {
      const error = new Error("Campaign requires `type` and `launch`.");
      error.status = 400;
      throw error;
    }
    const campaign = {
      id: nextId(registry.campaigns), type, launch,
      status: input.status || "scheduled", pool: String(input.pool || "0.0"),
      paid: String(input.paid || "0.0"), progress: Number(input.progress || 0),
      info: input.info || "Pending Torque setup", state: input.state || "Scheduled",
      accent: input.accent || "pink", torque: input.torque || null,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    registry.campaigns.unshift(campaign);
    return campaign;
  });
}

export async function recordEvent(input) {
  if (String(input.type || input.eventType || "").startsWith("dbc_") || String(input.id || "").startsWith("dbc_swap_")) {
    const error = new Error("DBC activity is recorded only by the on-chain transaction verifier.");
    error.status = 400;
    throw error;
  }
  if (supabase) {
    const row = normalizeEventInsert(input);
    const { data, error } = await supabase.from("event_receipts").insert(row).select().single();
    if (error) dbErr("event_receipts insert", error);

    if (row.type === "first_buy_completed" || row.type === "buy_completed") {
      const token = String(row.token || "").toUpperCase();
      try {
        await supabase.rpc("increment_buyers", { p_sym: token });
      } catch {}
    }

    return eventFromRow(data);
  }

  return updateFileRegistry((registry) => {
    const type = String(input.type || input.eventType || "").trim();
    if (!type) {
      const error = new Error("Event requires `type`.");
      error.status = 400;
      throw error;
    }
    const event = {
      id: input.id || `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      type, token: input.token || input.launch || null, wallet: input.wallet || null,
      payload: input.payload || {}, torqueRequest: input.torqueRequest || null,
      torqueReceipt: input.torqueReceipt || null, torqueError: input.torqueError || null,
      status: input.status || "recorded", createdAt: new Date().toISOString(),
    };
    registry.eventReceipts = registry.eventReceipts || [];
    registry.eventReceipts.unshift(event);
    registry.liveEvents = [liveEventFromEvent(event), ...(registry.liveEvents || [])].slice(0, 20);
    if (event.type === "first_buy_completed" || event.type === "buy_completed") {
      const token = String(event.token || "").toUpperCase();
      const launch = (registry.launches || []).find((item) => item.sym === token);
      if (launch) {
        launch.buyers = Number(launch.buyers || 0) + 1;
        launch.updatedAt = new Date().toISOString();
      }
    }
    return event;
  });
}

const DBC_ACTIVITY_TYPES = ["dbc_buy_verified", "dbc_sell_verified"];
const MAX_ACTIVITY_EVENTS = 500;

export async function recordVerifiedDbcTrade(launch, trade) {
  const row = normalizeEventInsert({
    id: `dbc_swap_${trade.signature}`,
    type: trade.direction === "buy" ? "dbc_buy_verified" : "dbc_sell_verified",
    token: launch.sym,
    wallet: trade.wallet,
    payload: trade,
    status: "finalized",
    createdAt: trade.blockTime ? new Date(trade.blockTime * 1000).toISOString() : new Date().toISOString(),
  });
  if (supabase) {
    const { data, error } = await supabase.from("event_receipts").upsert(row, { onConflict: "id", ignoreDuplicates: true }).select().maybeSingle();
    if (error) dbErr("verified DBC trade insert", error);
    if (data) return eventFromRow(data);
    const existing = await supabase.from("event_receipts").select("*").eq("id", row.id).single();
    if (existing.error) dbErr("verified DBC trade lookup", existing.error);
    return eventFromRow(existing.data);
  }
  return updateFileRegistry((registry) => {
    registry.eventReceipts = registry.eventReceipts || [];
    const existing = registry.eventReceipts.find((event) => event.id === row.id);
    if (existing) return existing;
    const event = eventFromRow(row);
    registry.eventReceipts.unshift(event);
    return event;
  });
}

export async function getVerifiedDbcActivity(launch) {
  let events;
  let complete;
  if (supabase) {
    const response = await supabase.from("event_receipts")
      .select("*")
      .eq("token", launch.sym)
      .in("type", DBC_ACTIVITY_TYPES)
      .order("created_at", { ascending: false })
      .limit(MAX_ACTIVITY_EVENTS + 1);
    if (response.error) dbErr("verified DBC activity select", response.error);
    complete = response.data.length <= MAX_ACTIVITY_EVENTS;
    events = response.data.slice(0, MAX_ACTIVITY_EVENTS).map(eventFromRow);
  } else {
    const registry = await readFileRegistry();
    const matching = (registry.eventReceipts || [])
      .filter((event) => event.token === launch.sym && DBC_ACTIVITY_TYPES.includes(event.type))
      .sort((a, b) => Number(b.payload?.slot || 0) - Number(a.payload?.slot || 0));
    complete = matching.length <= MAX_ACTIVITY_EVENTS;
    events = matching.slice(0, MAX_ACTIVITY_EVENTS);
  }
  const buys = events.filter((event) => event.type === "dbc_buy_verified");
  return {
    source: "finalized_signatures_submitted_to_toluva",
    complete,
    trackedBuys: buys.length,
    trackedSells: events.length - buys.length,
    trackedBuyers: new Set(buys.map((event) => event.wallet)).size,
    recent: events.slice(0, 10).map((event) => ({
      signature: event.payload?.signature,
      direction: event.type === "dbc_buy_verified" ? "buy" : "sell",
      wallet: event.wallet,
      baseAmount: event.payload?.baseAmount,
      quoteLamports: event.payload?.quoteLamports,
      slot: event.payload?.slot,
      blockTime: event.payload?.blockTime,
    })),
  };
}

export async function hasBuyEventForWallet({ token, wallet }) {
  const normalizedToken = String(token || "").toUpperCase();
  const normalizedWallet = String(wallet || "");

  if (supabase) {
    const { data } = await supabase
      .from("event_receipts")
      .select("id")
      .in("type", ["first_buy_completed", "buy_completed"])
      .eq("token", normalizedToken)
      .eq("wallet", normalizedWallet)
      .limit(1)
      .maybeSingle();
    return Boolean(data);
  }

  const registry = await readFileRegistry();
  return (registry.eventReceipts || []).some((event) => {
    if (event.type !== "first_buy_completed" && event.type !== "buy_completed") return false;
    return String(event.token || "").toUpperCase() === normalizedToken && String(event.wallet || "") === normalizedWallet;
  });
}

export async function attachCampaignToLaunch(launchSym, campaign) {
  const sym = String(launchSym || "").trim().toUpperCase();
  if (!sym) return;

  const label = campaign.type === "early-buyer" ? "Early Buyer Leaderboard"
    : campaign.type === "referral-raffle" ? "Referral Raffle"
    : campaign.type === "migration-sprint" ? "Migration Sprint"
    : campaign.type;

  if (supabase) {
    await supabase.from("launches").update({ campaign: label, updated_at: new Date().toISOString() }).eq("sym", sym);
    return;
  }

  await updateFileRegistry((registry) => {
    const launch = (registry.launches || []).find((l) => l.sym === sym);
    if (launch) { launch.campaign = label; launch.updatedAt = new Date().toISOString(); }
  });
}

export async function getCampaignResults(id) {
  const campaignId = Number(id);

  if (supabase) {
    const { data: campaign, error } = await supabase.from("campaigns").select("*").eq("id", campaignId).maybeSingle();
    if (error) dbErr("campaigns select", error);
    if (!campaign) {
      const err = new Error(`Campaign ${id} was not found.`);
      err.status = 404;
      throw err;
    }
    const { data: result } = await supabase.from("campaign_results").select("*").eq("campaign_id", campaignId).maybeSingle();
    return {
      campaignId,
      source: result ? "supabase" : "stub",
      campaign: campaignFromRow(campaign),
      leaderboard: result?.leaderboard || [],
      claimStatus: result?.claim_status || "pending_torque_integration",
      updatedAt: result?.updated_at || null,
    };
  }

  const registry = await readFileRegistry();
  const campaign = registry.campaigns.find((item) => Number(item.id) === campaignId);
  if (!campaign) {
    const error = new Error(`Campaign ${id} was not found.`);
    error.status = 404;
    throw error;
  }
  const result = (registry.campaignResults || []).find((item) => Number(item.campaignId) === campaignId);
  return {
    campaignId,
    source: result ? "file" : "stub",
    campaign,
    leaderboard: result?.leaderboard || [],
    claimStatus: result?.claimStatus || "pending_torque_integration",
    updatedAt: result?.updatedAt || null,
  };
}
