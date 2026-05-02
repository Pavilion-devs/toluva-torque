import React from "react";
import fallbackRegistry from "../../data/launch-registry.json";

const apiBaseUrl = import.meta.env.VITE_TOLUVA_API_URL || "";
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
      source: "static",
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
