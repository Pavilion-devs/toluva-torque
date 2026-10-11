import assert from "node:assert/strict";
import test from "node:test";
import { config, integrationReadiness } from "../server/config.js";
import { getSolanaStatus } from "../server/services/solana.js";

test("public integration status never reveals a server-side RPC credential", async () => {
  const originalUrl = config.solana.rpcUrl;
  const originalTimeout = config.solana.statusTimeoutMs;
  const secret = "private-rpc-key-for-test";
  try {
    config.solana.rpcUrl = `http://127.0.0.1:1/${secret}?api-key=${secret}`;
    config.solana.statusTimeoutMs = 200;

    const readiness = integrationReadiness();
    const status = await getSolanaStatus();
    assert.equal(readiness.solana.rpcConfigured, true);
    assert.equal(status.ok, false);
    assert.doesNotMatch(JSON.stringify({ readiness, status }), new RegExp(secret));
    assert.equal("rpcUrl" in readiness.solana, false);
    assert.equal("rpcUrl" in status, false);
    assert.equal("error" in status, false);
  } finally {
    config.solana.rpcUrl = originalUrl;
    config.solana.statusTimeoutMs = originalTimeout;
  }
});
