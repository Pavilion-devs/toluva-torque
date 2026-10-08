import http from "node:http";
import { config, integrationReadiness } from "./config.js";
import {
  attachCampaignToLaunch,
  createCampaign,
  createLaunch,
  getCampaignResults,
  hasBuyEventForWallet,
  readRegistry,
  recordEvent,
} from "./registry-store.js";
import {
  buildBuyTransaction,
  buildLaunchTransaction,
  getLaunchLabStatus,
  prepareLaunchDraft,
  prepareLaunchTransactionPlan,
} from "./services/raydium-launchlab.js";
import { getSolanaStatus } from "./services/solana.js";
import {
  buildConfigTransaction,
  buildMigrationTransaction,
  buildPoolTransaction,
  buildSwapTransaction,
  convictionTerms,
  getConfigTerms,
  getPoolStatus,
  quoteDbcSwap,
  summarizeConfig,
  verifyPoolLaunch,
} from "./services/meteora-dbc.js";
import { torqueEventSchemas } from "./services/torque-event-catalog.js";
import { emitTorqueEvent } from "./services/torque-client.js";

const port = config.api.port;
const allowedOrigin = config.api.allowedOrigin;
const lastVerifiedDbcStatus = new Map();

function livePoolError(error) {
  const message = error?.message || "";
  if (message === "fetch failed" || /ECONNREFUSED|ETIMEDOUT|EAI_AGAIN|ENOTFOUND|network request failed/i.test(message)) {
    return "Solana RPC is unreachable. Retrying automatically.";
  }
  return message || "Unable to read DBC pool.";
}

function sendJson(res, status, body) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  });
  res.end(JSON.stringify(body, null, 2));
}

function sendError(res, error) {
  sendJson(res, error.status || 500, {
    error: error.message || "Unexpected server error.",
  });
}

async function readBody(req) {
  const chunks = [];
  let bytes = 0;

  for await (const chunk of req) {
    bytes += chunk.length;
    if (bytes > 64 * 1024) {
      const error = new Error("Request body must be smaller than 64 KB.");
      error.status = 413;
      throw error;
    }
    chunks.push(chunk);
  }

  const raw = Buffer.concat(chunks).toString("utf8").trim();

  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw);
  } catch {
    const error = new Error("Request body must be valid JSON.");
    error.status = 400;
    throw error;
  }
}

function routePath(req) {
  return new URL(req.url, `http://${req.headers.host || "localhost"}`).pathname;
}

function bondingProgressFromPool(pool) {
  if (!pool?.realB || !pool?.totalFundRaisingB) {
    return null;
  }

  const realB = BigInt(pool.realB);
  const totalFundRaisingB = BigInt(pool.totalFundRaisingB);

  if (totalFundRaisingB <= 0n) {
    return null;
  }

  return Number((realB * 100000n) / totalFundRaisingB) / 1000;
}

async function registryWithLivePoolState() {
  const registry = await readRegistry();
  const launches = registry.launches || [];

  await Promise.all(
    launches.map(async (launch) => {
      const poolId = launch.raydium?.poolId;

      if (launch.dbc?.pool) {
        try {
          const status = await getPoolStatus(launch.dbc.pool);
          const checkedAt = new Date().toISOString();
          lastVerifiedDbcStatus.set(launch.dbc.pool, { status, checkedAt });
          launch.dbc = { ...launch.dbc, liveStatus: status, liveCheckedAt: checkedAt, liveStale: false, liveError: null };
          launch.bonded = status.progressPercent;
          launch.migrationState = status.dammV2.verified ? "migrated" : status.migrationStage === "bonding" ? "bonding" : "migrating";
          launch.status = launch.migrationState;
        } catch (error) {
          const previous = lastVerifiedDbcStatus.get(launch.dbc.pool);
          launch.dbc = {
            ...launch.dbc,
            liveStatus: previous?.status || null,
            liveCheckedAt: previous?.checkedAt || null,
            liveLastAttemptAt: new Date().toISOString(),
            liveStale: true,
            liveError: livePoolError(error),
          };
        }
        return;
      }

      if (!poolId || !config.legacyEnabled) {
        return;
      }

      try {
        const status = await getLaunchLabStatus(poolId);
        launch.raydium = {
          ...launch.raydium,
          liveStatus: status.status,
          livePool: status.pool || null,
          liveCheckedAt: new Date().toISOString(),
        };

        const bonded = bondingProgressFromPool(status.pool);

        if (bonded !== null) {
          launch.bonded = bonded;
          launch.migrationState = bonded >= 100 ? "migrating" : "bonding";
        }
      } catch (error) {
        launch.raydium = {
          ...launch.raydium,
          liveStatus: "pool_read_failed",
          liveError: error.message || "Unable to read Raydium pool.",
          liveCheckedAt: new Date().toISOString(),
        };
      }
    }),
  );

  return {
    ...registry,
    source: "local_api_live_registry",
  };
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    sendJson(res, 204, {});
    return;
  }

  const pathname = routePath(req);

  try {
    const legacyWrite = req.method === "POST" && (
      pathname === "/api/launches"
      || pathname === "/api/campaigns"
      || pathname === "/api/events"
      || /^\/api\/launches\/[^/]+\/buy-events$/.test(pathname)
    );
    if (!config.legacyEnabled && (legacyWrite || pathname.startsWith("/api/raydium/") || pathname.startsWith("/api/torque/"))) {
      sendJson(res, 410, { error: "This prior-project endpoint is disabled in the Meteora product." });
      return;
    }

    if (req.method === "GET" && pathname === "/api/health") {
      sendJson(res, 200, { ok: true, service: "toluva-api" });
      return;
    }

    if (req.method === "GET" && pathname === "/api/integrations/status") {
      sendJson(res, 200, {
        ok: true,
        integrations: integrationReadiness(),
        solana: await getSolanaStatus(),
      });
      return;
    }

    if (req.method === "GET" && pathname === "/api/torque/event-schemas") {
      sendJson(res, 200, { events: torqueEventSchemas });
      return;
    }

    if (req.method === "GET" && pathname === "/api/registry") {
      sendJson(res, 200, await registryWithLivePoolState());
      return;
    }

    if (req.method === "GET" && pathname === "/api/meteora/terms") {
      const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
      sendJson(res, 200, { terms: convictionTerms({ migrationThresholdSol: url.searchParams.get("migrationThresholdSol") || undefined }) });
      return;
    }

    if (req.method === "GET" && pathname === "/api/meteora/config") {
      const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
      const { address, state } = await getConfigTerms(url.searchParams.get("address"));
      sendJson(res, 200, { config: summarizeConfig(address, state) });
      return;
    }

    if (req.method === "GET" && pathname === "/api/meteora/pool") {
      const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
      sendJson(res, 200, { pool: await getPoolStatus(url.searchParams.get("address")) });
      return;
    }

    if (req.method === "GET" && pathname === "/api/meteora/swap/quote") {
      const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
      sendJson(res, 200, { quote: await quoteDbcSwap(Object.fromEntries(url.searchParams)) });
      return;
    }

    if (req.method === "POST" && pathname === "/api/meteora/swap/build") {
      sendJson(res, 200, await buildSwapTransaction(await readBody(req)));
      return;
    }

    if (req.method === "POST" && pathname === "/api/meteora/migration/build") {
      sendJson(res, 200, await buildMigrationTransaction(await readBody(req)));
      return;
    }

    if (req.method === "POST" && pathname === "/api/meteora/config/build") {
      sendJson(res, 200, await buildConfigTransaction(await readBody(req)));
      return;
    }

    if (req.method === "POST" && pathname === "/api/meteora/pool/build") {
      sendJson(res, 200, await buildPoolTransaction(await readBody(req)));
      return;
    }

    if (req.method === "POST" && pathname === "/api/meteora/launches") {
      const body = await readBody(req);
      const verified = await verifyPoolLaunch(body);
      const existing = (await readRegistry()).launches.find((item) => item.dbc?.mint === verified.mint && item.dbc?.cluster === config.solana.cluster);
      if (existing) {
        sendJson(res, 200, { launch: existing, alreadyRegistered: true });
        return;
      }
      const symbol = String(verified.metadata.symbol).trim().toUpperCase();
      const name = String(verified.metadata.name).trim();
      if (!/^[A-Z0-9]{2,10}$/.test(symbol) || !name || name.length > 32) {
        const error = new Error("A 2–10 character symbol and token name are required.");
        error.status = 400;
        throw error;
      }
      const launch = await createLaunch({
        sym: `${symbol}-${verified.mint}`.toUpperCase(),
        name,
        description: "",
        image: null,
        status: "bonding",
        pool: verified.pool,
        age: "now",
        migrationTime: "Pending",
        migrationState: "bonding",
        creator: String(body.creator),
        dbc: {
          cluster: config.solana.cluster,
          symbol,
          mint: verified.mint,
          pool: verified.pool,
          config: verified.config,
          signature: String(body.signature),
          uri: verified.metadata.uri,
          onchainConfig: summarizeConfig(verified.config, verified.configState),
        },
      });
      sendJson(res, 201, { launch });
      return;
    }

    if (req.method === "GET" && pathname === "/api/launches") {
      const registry = await readRegistry();
      sendJson(res, 200, { launches: registry.launches });
      return;
    }

    if (req.method === "POST" && pathname === "/api/launches") {
      const launch = await createLaunch(await readBody(req));
      sendJson(res, 201, { launch });
      return;
    }

    if (req.method === "GET" && pathname === "/api/campaigns") {
      const registry = await readRegistry();
      sendJson(res, 200, { campaigns: registry.campaigns });
      return;
    }

    if (req.method === "POST" && pathname === "/api/campaigns") {
      const body = await readBody(req);
      const campaign = await createCampaign(body);
      if (body.launch) await attachCampaignToLaunch(body.launch, campaign);
      sendJson(res, 201, { campaign });
      return;
    }

    const campaignResultsMatch = pathname.match(/^\/api\/campaigns\/([^/]+)\/results$/);
    if (req.method === "GET" && campaignResultsMatch) {
      sendJson(res, 200, await getCampaignResults(campaignResultsMatch[1]));
      return;
    }

    if (req.method === "POST" && pathname === "/api/events") {
      const body = await readBody(req);
      const torque = await emitTorqueEvent(body);

      if (torque.validationIssues?.length) {
        sendJson(res, 400, {
          error: "Event payload failed local Torque schema validation.",
          validationIssues: torque.validationIssues || [],
          torqueRequest: torque.request || null,
        });
        return;
      }

      if (!torque.ok && !torque.skipped && config.torque.strictEvents) {
        const error = new Error("Torque event emission failed.");
        error.status = torque.status || 502;
        error.details = torque;
        throw error;
      }

      const event = await recordEvent({
        ...body,
        torqueRequest: torque.request || null,
        torqueReceipt: torque.receipt || null,
        torqueError: torque.ok
          ? null
          : { reason: torque.reason || "torque_emit_failed", error: torque.error || null, validationIssues: torque.validationIssues || [] },
        status: torque.ok ? "emitted" : torque.skipped ? "torque_skipped" : "torque_failed",
      });
      sendJson(res, 201, { event, torque });
      return;
    }

    const buyEventMatch = pathname.match(/^\/api\/launches\/([^/]+)\/buy-events$/);
    if (req.method === "POST" && buyEventMatch) {
      const body = await readBody(req);
      const token = decodeURIComponent(buyEventMatch[1]).toUpperCase();
      const wallet = body.wallet || body.userPubkey || body.walletAddress;
      const isRepeatBuyer = await hasBuyEventForWallet({ token, wallet });
      const eventInput = {
        type: isRepeatBuyer ? "buy_completed" : "first_buy_completed",
        token,
        wallet,
        launchId: body.launchId || token,
        payload: {
          poolState: body.poolState,
          amount: Number(body.amount || body.buyAmount || 0),
          amountUsd: Number(body.amountUsd || body.amount_usd || 0),
          txSignature: body.txSignature || body.signature,
        },
      };
      const torque = await emitTorqueEvent(eventInput);

      if (torque.validationIssues?.length) {
        sendJson(res, 400, {
          error: "Buy event failed local Torque schema validation.",
          validationIssues: torque.validationIssues || [],
          torqueRequest: torque.request || null,
        });
        return;
      }

      if (!torque.ok && !torque.skipped && config.torque.strictEvents) {
        const error = new Error("Torque buy event emission failed.");
        error.status = torque.status || 502;
        error.details = torque;
        throw error;
      }

      const event = await recordEvent({
        ...eventInput,
        torqueRequest: torque.request || null,
        torqueReceipt: torque.receipt || null,
        torqueError: torque.ok
          ? null
          : { reason: torque.reason || "torque_emit_failed", error: torque.error || null, validationIssues: torque.validationIssues || [] },
        status: torque.ok ? "emitted" : torque.skipped ? "torque_skipped" : "torque_failed",
      });
      sendJson(res, 201, { event, torque });
      return;
    }

    if (req.method === "GET" && pathname === "/api/raydium/launchlab/status") {
      const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
      sendJson(res, 200, await getLaunchLabStatus(url.searchParams.get("poolId")));
      return;
    }

    if (req.method === "POST" && pathname === "/api/raydium/launches/prepare") {
      sendJson(res, 200, prepareLaunchDraft(await readBody(req)));
      return;
    }

    if (req.method === "POST" && pathname === "/api/raydium/launches/transaction-plan") {
      sendJson(res, 200, await prepareLaunchTransactionPlan(await readBody(req)));
      return;
    }

    if (req.method === "POST" && pathname === "/api/raydium/launches/build-transaction") {
      sendJson(res, 200, await buildLaunchTransaction(await readBody(req)));
      return;
    }

    if (req.method === "POST" && pathname === "/api/raydium/launches/build-buy-transaction") {
      sendJson(res, 200, await buildBuyTransaction(await readBody(req)));
      return;
    }

    if (req.method === "GET" && pathname === "/api/torque/leaderboard") {
      const { projectId, recurringOfferId, serverBaseUrl } = config.torque;
      if (!projectId || !recurringOfferId) {
        sendJson(res, 200, { status: "SUCCESS", data: { results: [], total: 0 } });
        return;
      }
      const url = `${serverBaseUrl}/project/${projectId}/recurring-offer/${recurringOfferId}/latest-eval-results?limit=200`;
      const upstream = await fetch(url);
      sendJson(res, upstream.status, await upstream.json().catch(() => ({})));
      return;
    }

    if (req.method === "GET" && pathname === "/api/torque/claim-details") {
      const { projectId, serverBaseUrl } = config.torque;
      const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
      const wallet = url.searchParams.get("wallet");
      if (!projectId || !wallet) {
        sendJson(res, 400, { error: "projectId config and wallet param are required." });
        return;
      }
      const upstream = await fetch(
        `${serverBaseUrl}/claim/details/byOffer?projectId=${projectId}&offerStatus=ACTIVE&wallet=${encodeURIComponent(wallet)}`
      );
      sendJson(res, upstream.status, await upstream.json().catch(() => ({})));
      return;
    }

    if (req.method === "POST" && pathname === "/api/torque/claim") {
      const { projectId, serverBaseUrl } = config.torque;
      const body = await readBody(req);
      const wallet = body.wallet;
      if (!projectId || !wallet) {
        sendJson(res, 400, { error: "wallet is required." });
        return;
      }
      const upstream = await fetch(
        `${serverBaseUrl}/claim?projectId=${projectId}&wallet=${encodeURIComponent(wallet)}`
      );
      const result = await upstream.json().catch(() => ({}));

      if (result.status === "SUCCESS") {
        const detailsRes = await fetch(
          `${serverBaseUrl}/claim/details/byOffer?projectId=${projectId}&offerStatus=ACTIVE&wallet=${encodeURIComponent(wallet)}`
        ).catch(() => null);
        const details = await detailsRes?.json().catch(() => null);
        const offer = details?.data?.[0];
        const crank = offer?.cranks?.find((c) => c.status === "DONE");
        const rewardAmount = crank?.amount ?? offer?.eligibleAmounts?.[0]?.amount ?? 0;

        await recordEvent({
          type: "reward_claimed",
          token: body.token || null,
          wallet,
          launchId: body.launchId || null,
          campaignId: body.campaignId || offer?.id || null,
          payload: {
            campaign_id: offer?.id || null,
            reward_amount: rewardAmount,
            txSignature: crank?.signature || null,
          },
          torqueReceipt: crank ? { status: "ACCEPTED", crankId: crank.id, signature: crank.signature } : null,
          status: "emitted",
        }).catch(() => {});

        sendJson(res, upstream.status, { ...result, crank: crank || null });
        return;
      }

      sendJson(res, upstream.status, result);
      return;
    }

    sendJson(res, 404, { error: `No route for ${req.method} ${pathname}.` });
  } catch (error) {
    sendError(res, error);
  }
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Toluva API listening on port ${port}`);
});
