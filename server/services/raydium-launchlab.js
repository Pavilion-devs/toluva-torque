import { config } from "../config.js";

export function getLaunchLabConfig() {
  return {
    cluster: config.raydium.cluster,
    launchpadProgramId: config.raydium.launchpadProgramId,
    platformId: config.raydium.platformId || null,
    quoteMint: config.raydium.quoteMint || null,
    curveType: config.raydium.curveType,
    configIndex: config.raydium.configIndex,
    sdkPackage: config.raydium.sdkPackage,
  };
}

export async function getLaunchLabStatus(poolId) {
  const base = {
    ok: Boolean(config.raydium.launchpadProgramId),
    config: getLaunchLabConfig(),
    poolId: poolId || null,
  };

  try {
    await import("@raydium-io/raydium-sdk-v2");
  } catch (error) {
    return {
      ...base,
      ok: false,
      reason: error?.code === "ERR_MODULE_NOT_FOUND" ? "missing_dependency" : "sdk_unavailable",
      dependency: config.raydium.sdkPackage,
      note: "Install the Raydium SDK before building signed LaunchLab transactions.",
    };
  }

  if (!poolId) {
    return {
      ...base,
      status: "sdk_available",
      note: "Pass a poolId to add live pool-state reads in the next integration step.",
    };
  }

  return {
    ...base,
    status: "pool_read_not_implemented",
    note: "SDK is installed; wire raydium.launchpad.getRpcPoolInfo({ poolId }) when wallet/RPC transaction flow is added.",
  };
}

export function prepareLaunchDraft(input) {
  const name = String(input.name || "").trim();
  const symbol = String(input.symbol || input.sym || "").trim().toUpperCase();
  const uri = String(input.uri || input.metadataUri || "").trim();

  if (!name || !symbol || !uri) {
    const error = new Error("Raydium launch prep requires `name`, `symbol`/`sym`, and `uri`.");
    error.status = 400;
    throw error;
  }

  return {
    mode: "transaction_prep",
    readyToBuildTransaction: false,
    reason: "wallet_signed_launch_not_enabled_yet",
    requiredNextDependencies: [
      "@raydium-io/raydium-sdk-v2",
      "@solana/web3.js",
      "@solana/spl-token",
      "bn.js",
    ],
    raydium: getLaunchLabConfig(),
    launchParams: {
      name,
      symbol,
      uri,
      decimals: Number.isFinite(Number(input.decimals)) ? Number(input.decimals) : 6,
      migrateType: input.migrateType || "cpmm",
      supply: input.supply || null,
      totalSellA: input.totalSellA || null,
      totalFundRaisingB: input.totalFundRaisingB || null,
      createOnly: input.createOnly !== false,
    },
  };
}
