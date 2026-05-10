import { config } from "../config.js";

function withTimeout(promise, ms) {
  let timeout;
  const timeoutPromise = new Promise((_, reject) => {
    timeout = setTimeout(() => reject(new Error(`Solana RPC status timed out after ${ms}ms.`)), ms);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeout));
}

export async function getSolanaStatus() {
  try {
    const { Connection } = await import("@solana/web3.js");
    const connection = new Connection(config.solana.rpcUrl, config.solana.commitment);
    const version = await withTimeout(connection.getVersion(), config.solana.statusTimeoutMs);

    return {
      ok: true,
      cluster: config.solana.cluster,
      rpcUrl: config.solana.rpcUrl,
      version,
    };
  } catch (error) {
    const missingDependency = error?.code === "ERR_MODULE_NOT_FOUND";

    return {
      ok: false,
      cluster: config.solana.cluster,
      rpcUrl: config.solana.rpcUrl,
      reason: missingDependency ? "missing_dependency" : "rpc_unavailable",
      dependency: missingDependency ? "@solana/web3.js" : undefined,
      timeoutMs: config.solana.statusTimeoutMs,
      error: error.message,
    };
  }
}
