import { config } from "../config.js";
import { getTorqueEventSchema } from "./torque-event-catalog.js";
import { PublicKey } from "@solana/web3.js";

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
  const eventName = String(input.eventName || input.type || input.eventType || "").trim();
  const schema = getTorqueEventSchema(eventName);
  const allowedFields = schema ? new Set(schema.fields.map((field) => field.fieldName)) : null;
  const payload = input.payload && typeof input.payload === "object" && !Array.isArray(input.payload) ? input.payload : {};
  const data = {};

  for (const [key, value] of Object.entries(payload)) {
    const fieldName = normalizeFieldName(key);

    if (isPrimitive(value) && (typeof value !== "number" || Number.isFinite(value)) && (!allowedFields || allowedFields.has(fieldName))) {
      data[fieldName] = value;
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
    if (value !== undefined && value !== null && value !== "" && (!allowedFields || allowedFields.has(key))) {
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

function isValidFieldValue(value, type) {
  if (type === "string") {
    return typeof value === "string" && value.trim().length > 0;
  }

  if (type === "number") {
    return typeof value === "number" && Number.isFinite(value);
  }

  if (type === "boolean") {
    return typeof value === "boolean";
  }

  return false;
}

export function validateTorqueEventRequest(request) {
  const issues = [];

  if (!request.eventName) {
    issues.push({ field: "eventName", code: "required", message: "Event name is required." });
  }

  if (!request.userPubkey) {
    issues.push({ field: "userPubkey", code: "required", message: "User wallet is required." });
  } else {
    try {
      new PublicKey(request.userPubkey);
    } catch {
      issues.push({ field: "userPubkey", code: "invalid_pubkey", message: "User wallet must be a valid Solana public key." });
    }
  }

  if (!request.eventName) {
    return issues;
  }

  const schema = getTorqueEventSchema(request.eventName);

  if (!schema) {
    issues.push({
      field: "eventName",
      code: "unknown_event",
      message: `${request.eventName} is not in the local Torque event catalog.`,
    });
    return issues;
  }

  for (const field of schema.fields) {
    const value = request.data[field.fieldName];

    if (value === undefined || value === null || value === "") {
      issues.push({
        field: field.fieldName,
        code: "required",
        message: `${field.fieldName} is required for ${request.eventName}.`,
      });
      continue;
    }

    if (!isValidFieldValue(value, field.type)) {
      issues.push({
        field: field.fieldName,
        code: "invalid_type",
        expectedType: field.type,
        actualType: Array.isArray(value) ? "array" : typeof value,
        message: `${field.fieldName} must be a ${field.type}.`,
      });
    }
  }

  return issues;
}

export async function emitTorqueEvent(input) {
  const request = buildTorqueEvent(input);
  const validationIssues = validateTorqueEventRequest(request);

  if (validationIssues.some((issue) => issue.field === "eventName" && issue.code === "required")) {
    return {
      ok: false,
      skipped: true,
      reason: "missing_event_name",
      validationIssues,
      request,
    };
  }

  if (validationIssues.some((issue) => issue.field === "userPubkey" && issue.code === "required")) {
    return {
      ok: false,
      skipped: true,
      reason: "missing_user_pubkey",
      validationIssues,
      request,
    };
  }

  if (validationIssues.length > 0) {
    return {
      ok: false,
      skipped: true,
      reason: "invalid_event_payload",
      validationIssues,
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
