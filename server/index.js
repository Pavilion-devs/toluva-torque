import http from "node:http";
import { config, integrationReadiness } from "./config.js";
import {
  createCampaign,
  createLaunch,
  getCampaignResults,
  readRegistry,
  recordEvent,
} from "./registry-store.js";
import { getLaunchLabStatus, prepareLaunchDraft } from "./services/raydium-launchlab.js";
import { getSolanaStatus } from "./services/solana.js";
import { torqueEventSchemas } from "./services/torque-event-catalog.js";
import { emitTorqueEvent } from "./services/torque-client.js";

const port = config.api.port;
const allowedOrigin = config.api.allowedOrigin;

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

  for await (const chunk of req) {
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

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    sendJson(res, 204, {});
    return;
  }

  const pathname = routePath(req);

  try {
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
      sendJson(res, 200, await readRegistry());
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
      const campaign = await createCampaign(await readBody(req));
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
        torqueError: torque.ok ? null : { reason: torque.reason || "torque_emit_failed", error: torque.error || null },
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

    sendJson(res, 404, { error: `No route for ${req.method} ${pathname}.` });
  } catch (error) {
    sendError(res, error);
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Toluva API listening on http://127.0.0.1:${port}`);
});
