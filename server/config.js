import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnv } from "./load-env.js";

loadEnv();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

const DEFAULT_SOLANA_RPC = {
  devnet: "https://api.devnet.solana.com",
  mainnet: "https://api.mainnet-beta.solana.com",
};

const RAYDIUM_LAUNCHPAD_PROGRAM = {
  mainnet: "LanMV9sAd7wArD4vJFi2qDdfnVhFxYSUg6eADduJ3uj",
  devnet: "DRay6fNdQ5J82H7xV6uq2aV3mNrUZ1J4PgSKsWgptcm6",
};

const RAYDIUM_LAUNCHPAD_PLATFORM = {
  mainnet: "4Bu96XjU84XjPDSpveTVf6LYGCkfW5FK7SNkREWcEfV4",
  devnet: "2Jx4KTDrVSdWNazuGpcA8n3ZLTRGGBDxAWhuKe2Xcj2a",
};

const RAYDIUM_LAUNCHPAD_CONFIG = {
  mainnet: "6s1xP3hpbAfFoNtUNF8mfHsjr2Bd97JxFJRWLbL6aHuX",
  devnet: "7ZR4zD7PYfY2XxoG1Gxcy2EgEeGYrpxrwzPuwdUBssEt",
};

function firstSet(...values) {
  return values.find((value) => typeof value === "string" && value.trim())?.trim() || "";
}

function normalizedCluster(value) {
  const cluster = String(value || "devnet").toLowerCase();
  return cluster === "mainnet-beta" ? "mainnet" : cluster;
}

function numberFromEnv(value, fallback) {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

export const config = {
  projectRoot,
  legacyEnabled: process.env.TOLUVA_LEGACY_API_ENABLED === "true",
  api: {
    port: numberFromEnv(process.env.PORT || process.env.TOLUVA_API_PORT, 8787),
    allowedOrigin: process.env.TOLUVA_ALLOWED_ORIGIN || "*",
  },
  registry: {
    path: process.env.TOLUVA_REGISTRY_PATH
      ? path.resolve(process.env.TOLUVA_REGISTRY_PATH)
      : path.join(projectRoot, "data", "local-launch-registry.json"),
    seedPath: path.join(projectRoot, "data", "launch-registry.json"),
  },
  torque: {
    eventApiKey: firstSet(process.env.TORQUE_EVENT_API_KEY, process.env.TORQUE_API_KEY),
    eventIngestUrl: process.env.TORQUE_EVENT_INGEST_URL || "https://ingest.torque.so/events",
    projectId: firstSet(process.env.TORQUE_PROJECT_ID),
    recurringOfferId: firstSet(process.env.TORQUE_RECURRING_OFFER_ID),
    serverBaseUrl: "https://server.torque.so",
    strictEvents: process.env.TORQUE_STRICT_EVENTS === "true",
  },
  solana: {
    cluster: normalizedCluster(firstSet(process.env.SOLANA_CLUSTER, process.env.VITE_SOLANA_CLUSTER, "devnet")),
    rpcUrl: firstSet(
      process.env.SOLANA_RPC_URL,
      process.env.VITE_SOLANA_RPC_URL,
      DEFAULT_SOLANA_RPC[normalizedCluster(firstSet(process.env.SOLANA_CLUSTER, process.env.VITE_SOLANA_CLUSTER, "devnet"))],
    ),
    commitment: process.env.SOLANA_COMMITMENT || "confirmed",
    statusTimeoutMs: numberFromEnv(process.env.SOLANA_STATUS_TIMEOUT_MS, 4000),
  },
  supabase: {
    url: firstSet(process.env.SUPABASE_URL),
    serviceRoleKey: firstSet(process.env.SUPABASE_SERVICE_ROLE_KEY),
  },
};

const raydiumCluster = normalizedCluster(firstSet(process.env.RAYDIUM_CLUSTER, config.solana.cluster));

config.raydium = {
  cluster: raydiumCluster,
  launchpadProgramId: firstSet(
    process.env.RAYDIUM_LAUNCHPAD_PROGRAM_ID,
    process.env.RAYDIUM_PROGRAM_ID,
    RAYDIUM_LAUNCHPAD_PROGRAM[raydiumCluster],
  ),
  platformId: firstSet(process.env.RAYDIUM_PLATFORM_ID),
  configId: firstSet(process.env.RAYDIUM_CONFIG_ID, RAYDIUM_LAUNCHPAD_CONFIG[raydiumCluster]),
  defaultPlatformId: RAYDIUM_LAUNCHPAD_PLATFORM[raydiumCluster],
  quoteMint: firstSet(process.env.RAYDIUM_QUOTE_MINT),
  curveType: numberFromEnv(process.env.RAYDIUM_CURVE_TYPE, 0),
  configIndex: numberFromEnv(process.env.RAYDIUM_CONFIG_INDEX, 0),
  sdkPackage: "@raydium-io/raydium-sdk-v2",
};

export function integrationReadiness() {
  return {
    torque: {
      configured: Boolean(config.torque.eventApiKey),
      eventIngestUrl: config.torque.eventIngestUrl,
      projectId: config.torque.projectId || null,
      strictEvents: config.torque.strictEvents,
    },
    solana: {
      cluster: config.solana.cluster,
      rpcUrl: config.solana.rpcUrl,
      commitment: config.solana.commitment,
      statusTimeoutMs: config.solana.statusTimeoutMs,
    },
    raydium: {
      cluster: config.raydium.cluster,
      launchpadProgramId: config.raydium.launchpadProgramId,
      platformId: config.raydium.platformId || config.raydium.defaultPlatformId || null,
      configId: config.raydium.configId || null,
      quoteMint: config.raydium.quoteMint || null,
      curveType: config.raydium.curveType,
      configIndex: config.raydium.configIndex,
      sdkPackage: config.raydium.sdkPackage,
      readyForTransactionBuild: Boolean(config.raydium.launchpadProgramId && (config.raydium.platformId || config.raydium.defaultPlatformId)),
    },
  };
}
