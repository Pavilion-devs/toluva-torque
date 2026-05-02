import { config } from "../config.js";

function parseJsonMaybe(text) {
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function normalizeTimestamp(value) {
  if (!value) {
    return Date.now();
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : Date.now();
}

function normalizeFieldName(key) {
  return String(key)
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[^a-zA-Z0-9_]/g, "_")
    .toLowerCase();
}

function isPrimitive(value) {
  return ["string", "number", "boolean"].includes(typeof value);
}

function buildEventData(input) {
  const payload = input.payload && typeof input.payload === "object" && !Array.isArray(input.payload) ? input.payload : {};
  const data = {};

  for (const [key, value] of Object.entries(payload)) {
    if (isPrimitive(value) && (typeof value !== "number" || Number.isFinite(value))) {
      data[normalizeFieldName(key)] = value;
    }
  }

  const reserved = {
    source: "toluva",
    token: input.token || input.launch || input.sym,
    launch_id: input.launchId,
    campaign_id: input.campaignId,
    project_id: config.torque.projectId,
  };

  for (const [key, value] of Object.entries(reserved)) {
    if (value !== undefined && value !== null && value !== "") {
      data[key] = value;
    }
  }

  return data;
}

export function buildTorqueEvent(input) {
  const eventName = String(input.eventName || input.type || input.eventType || "").trim();
  const userPubkey = String(input.userPubkey || input.wallet || input.walletAddress || "").trim();

  return {
    userPubkey,
    timestamp: normalizeTimestamp(input.timestamp || input.createdAt),
    eventName,
    data: buildEventData(input),
  };
}

export async function emitTorqueEvent(input) {
  const request = buildTorqueEvent(input);

  if (!request.eventName) {
    return {
      ok: false,
      skipped: true,
      reason: "missing_event_name",
      request,
    };
  }

  if (!request.userPubkey) {
    return {
      ok: false,
      skipped: true,
      reason: "missing_user_pubkey",
      request,
    };
  }

  if (!config.torque.eventApiKey) {
    return {
      ok: false,
      skipped: true,
      reason: "missing_torque_api_key",
      request,
    };
  }

  const response = await fetch(config.torque.eventIngestUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": config.torque.eventApiKey,
    },
    body: JSON.stringify(request),
  });
  const body = parseJsonMaybe(await response.text());

  if (!response.ok) {
    return {
      ok: false,
      skipped: false,
      status: response.status,
      error: body || response.statusText,
      request,
    };
  }

  return {
    ok: true,
    skipped: false,
    status: response.status,
    receipt: body || { accepted: true },
    request,
  };
}
