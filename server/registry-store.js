import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { config } from "./config.js";

const registryPath = config.registry.path;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function nextId(items) {
  return items.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1;
}

function normalizeLaunch(input) {
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
    status: input.status || "draft",
    bonded: Number(input.bonded || 0),
    campaign: input.campaign || null,
    buyers: Number(input.buyers || 0),
    pool: input.pool || null,
    age: input.age || "Draft",
    migrationTime: input.migrationTime || "Draft",
    migrationState: input.migrationState || input.status || "draft",
    raydium: input.raydium || null,
    torque: input.torque || null,
    createdAt: input.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function normalizeCampaign(input, campaigns) {
  const type = String(input.type || "").trim();
  const launch = String(input.launch || input.sym || "").trim().toUpperCase();

  if (!type || !launch) {
    const error = new Error("Campaign requires `type` and `launch`.");
    error.status = 400;
    throw error;
  }

  return {
    id: input.id || nextId(campaigns),
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
    createdAt: input.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function normalizeEvent(input) {
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
    torqueRequest: input.torqueRequest || null,
    torqueReceipt: input.torqueReceipt || null,
    torqueError: input.torqueError || null,
    status: input.status || "recorded",
    createdAt: input.createdAt || new Date().toISOString(),
  };
}

function liveEventFromReceipt(event) {
  const token = event.token ? String(event.token).toUpperCase() : null;
  const wallet = event.wallet ? `${event.wallet.slice(0, 5)}…${event.wallet.slice(-4)}` : "demo wallet";

  return {
    type: event.type.includes("claim") ? "claim" : event.type.includes("referral") ? "raffle" : "sprint",
    icon: event.type.includes("claim")
      ? "solar:cup-star-bold"
      : event.type.includes("referral")
        ? "solar:ticket-bold"
        : "solar:bolt-bold",
    token,
    time: "now",
    line: [
      { text: wallet, className: "font-mono" },
      { text: ` emitted ${event.type.replaceAll("_", " ")}` },
    ],
  };
}

export async function readRegistry() {
  const raw = await readFile(registryPath, "utf8");
  return JSON.parse(raw);
}

export async function writeRegistry(nextRegistry) {
  await mkdir(path.dirname(registryPath), { recursive: true });
  const tmpPath = `${registryPath}.${process.pid}.tmp`;
  await writeFile(tmpPath, `${JSON.stringify(nextRegistry, null, 2)}\n`, "utf8");
  await rename(tmpPath, registryPath);
  return nextRegistry;
}

export async function updateRegistry(updater) {
  const current = await readRegistry();
  const draft = clone(current);
  const result = await updater(draft);
  await writeRegistry(draft);
  return result ?? draft;
}

export async function createLaunch(input) {
  return updateRegistry((registry) => {
    const launch = normalizeLaunch(input);
    const existing = registry.launches.find((item) => item.sym === launch.sym);

    if (existing) {
      const error = new Error(`Launch ${launch.sym} already exists.`);
      error.status = 409;
      throw error;
    }

    registry.launches.unshift(launch);
    return launch;
  });
}

export async function createCampaign(input) {
  return updateRegistry((registry) => {
    const campaign = normalizeCampaign(input, registry.campaigns);
    registry.campaigns.unshift(campaign);
    return campaign;
  });
}

export async function recordEvent(input) {
  return updateRegistry((registry) => {
    const event = normalizeEvent(input);
    registry.eventReceipts = registry.eventReceipts || [];
    registry.eventReceipts.unshift(event);
    registry.liveEvents = [liveEventFromReceipt(event), ...(registry.liveEvents || [])].slice(0, 20);
    return event;
  });
}

export async function getCampaignResults(id) {
  const registry = await readRegistry();
  const campaignId = Number(id);
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
