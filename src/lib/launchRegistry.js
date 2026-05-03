import React from "react";
import fallbackRegistry from "../../data/launch-registry.json";

const apiBaseUrl = import.meta.env.VITE_TOLUVA_API_URL || "http://127.0.0.1:8787";
const listeners = new Set();

let registryState = {
  registry: fallbackRegistry,
  source: "static",
  loading: false,
  error: null,
};

function notify() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return registryState;
}

function setRegistryState(nextState) {
  registryState = {
    ...registryState,
    ...nextState,
  };
  notify();
}

export const workspace = fallbackRegistry.workspace;
export const launches = fallbackRegistry.launches;
export const campaigns = fallbackRegistry.campaigns;
export const liveEvents = fallbackRegistry.liveEvents;
export const analytics = fallbackRegistry.analytics;

export async function refreshRegistry({ force = false } = {}) {
  if (registryState.loading || (!force && registryState.source === "api")) {
    return registryState.registry;
  }

  setRegistryState({ loading: true, error: null });

  try {
    if (!apiBaseUrl) {
      throw new Error("Registry API not configured.");
    }

    const response = await fetch(`${apiBaseUrl}/api/registry`, {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(`Registry API returned ${response.status}.`);
    }

    const nextRegistry = await response.json();
    setRegistryState({
      registry: nextRegistry,
      source: "api",
      loading: false,
      error: null,
    });
    return nextRegistry;
  } catch (error) {
    setRegistryState({
      registry: fallbackRegistry,
      source: "offline",
      loading: false,
      error: error instanceof Error ? error.message : "Registry API unavailable.",
    });
    return fallbackRegistry;
  }
}

export function useRegistry() {
  const state = React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  React.useEffect(() => {
    refreshRegistry();
  }, []);

  return state;
}

export function getLaunchFilters(sourceRegistry = fallbackRegistry) {
  const sourceLaunches = sourceRegistry.launches || [];
  const statuses = ["bonding", "migrating", "migrated", "draft"];
  const labels = {
    bonding: "Bonding",
    migrating: "Migrating",
    migrated: "Migrated",
    draft: "Drafts",
  };

  return [
    { key: "all", label: "All", count: sourceLaunches.length },
    ...statuses.map((status) => ({
      key: status,
      label: labels[status],
      count: sourceLaunches.filter((launch) => launch.status === status).length,
    })),
  ];
}

export function getMigrationSpotlightLaunches(sourceRegistry = fallbackRegistry, limit = 3) {
  return [...(sourceRegistry.launches || [])]
    .filter((launch) => launch.status !== "draft" && launch.status !== "migrated")
    .sort((a, b) => b.bonded - a.bonded)
    .slice(0, limit)
    .map((launch) => ({
      symbol: launch.sym,
      bonded: launch.bonded,
      time: launch.migrationTime,
      state: launch.migrationState,
    }));
}

export function getCampaignCounts(sourceRegistry = fallbackRegistry) {
  return (sourceRegistry.campaigns || []).reduce(
    (counts, campaign) => ({
      ...counts,
      [campaign.status]: (counts[campaign.status] || 0) + 1,
    }),
    { live: 0, scheduled: 0, ended: 0 },
  );
}

function eventAmount(event) {
  const payload = event?.payload || {};
  const data = event?.torqueRequest?.data || {};
  const value = payload.amountUsd ?? payload.amount_usd ?? data.amount_usd ?? payload.amount ?? data.amount ?? 0;
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : 0;
}

function dayKey(dateValue) {
  const date = dateValue ? new Date(dateValue) : new Date();
  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString().slice(0, 10);
  }
  return date.toISOString().slice(0, 10);
}

export function getRegistryAnalytics(sourceRegistry = fallbackRegistry) {
  const sourceLaunches = sourceRegistry.launches || [];
  const sourceCampaigns = sourceRegistry.campaigns || [];
  const sourceEvents = sourceRegistry.eventReceipts || [];
  const buyEvents = sourceEvents.filter((event) => event.type === "buy_completed" || event.type === "first_buy_completed");
  const raydiumLaunches = sourceLaunches.filter((launch) => launch.raydium?.poolId);
  const activeCampaigns = sourceCampaigns.filter((campaign) => campaign.status === "live");
  const emittedTorqueEvents = sourceEvents.filter((event) => event.status === "emitted");
  const volumeByDay = buyEvents.reduce((days, event) => {
    const key = dayKey(event.createdAt);
    days[key] = (days[key] || 0) + eventAmount(event);
    return days;
  }, {});
  const volumeSeries = Object.entries(volumeByDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-7)
    .map(([date, value]) => ({ date, value }));

  return {
    stats: [
      { label: "Real launches", value: String(sourceLaunches.length), unit: "tokens", delta: "API registry", positive: true },
      { label: "Raydium pools", value: String(raydiumLaunches.length), unit: "devnet", delta: "pool-backed", positive: true },
      { label: "Torque events", value: String(emittedTorqueEvents.length), unit: "accepted", delta: "ingest receipts", positive: true },
      { label: "Active campaigns", value: String(activeCampaigns.length), unit: "live", delta: "registry records", positive: true },
    ],
    topLaunches: [...sourceLaunches]
      .sort((a, b) => Number(b.buyers || 0) - Number(a.buyers || 0) || Number(b.bonded || 0) - Number(a.bonded || 0))
      .slice(0, 5)
      .map((launch) => ({
        sym: launch.sym,
        metric: `${launch.buyers || 0} buyers · ${launch.status}`,
        pct: Math.max(0, Math.min(100, Number(launch.bonded || 0))),
      })),
    templateConversion: sourceCampaigns.map((campaign) => ({
      name: `${campaign.type} · ${campaign.launch}`,
      conv: Math.max(0, Math.min(100, Number(campaign.progress || 0))),
      color: campaign.accent === "indigo" ? "#4f46e5" : campaign.accent === "violet" ? "#7c3aed" : "#ec4899",
    })),
    volumeSeries,
  };
}
