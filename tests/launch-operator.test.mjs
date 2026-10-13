import assert from "node:assert/strict";
import { createServer } from "node:http";
import { after, before, test } from "node:test";
import {
  draftLaunchFromPrompt, nextOperatorAction, normalizeLaunchIntent,
} from "../server/services/launch-operator.js";
import { handleToluvaMcp } from "../server/services/toluva-mcp.js";

test("guided draft extracts identity and target without creating a launch", async () => {
  const draft = await draftLaunchFromPrompt({ prompt: "Launch a token called Aurora with symbol AURA and a 7 SOL target." });
  assert.deepEqual(draft.draft, { name: "Aurora", symbol: "AURA", description: "", migrationThresholdSol: "7" });
  assert.equal(draft.terms.curveFeeBps, 100);
  assert.equal(draft.terms.migratedPoolFeeBps, 30);
  assert.match(draft.message, /No token/);
});

test("unsupported economics and network are flagged; overlong identity is rejected", async () => {
  const draft = await draftLaunchFromPrompt({ prompt: "Launch a token called Aurora with symbol AURA, on mainnet with a 2% trading fee." });
  assert.equal(draft.unsupportedRequests.length, 2);
  assert.throws(() => normalizeLaunchIntent({ name: "A".repeat(33), symbol: "AA", migrationThresholdSol: 5 }), /32 characters/);
  assert.throws(() => normalizeLaunchIntent({ name: "Aurora", symbol: "AURA", migrationThresholdSol: 101 }), /between 1 and 100/);
});

test("lifecycle guidance follows verified chain stage", () => {
  assert.equal(nextOperatorAction(null, false).id, "refresh");
  assert.equal(nextOperatorAction({ migrationStage: "bonding" }, false).id, "track_curve");
  assert.equal(nextOperatorAction({ migrationStage: "curve-complete", migrationReady: true }, false).id, "review_migration");
  assert.equal(nextOperatorAction({ dammV2: { verified: true } }, false).id, "link_dlmm");
  assert.equal(nextOperatorAction({ dammV2: { verified: true } }, true).id, "manage_liquidity");
});

let mcpServer;
let mcpOrigin;
before(async () => {
  mcpServer = createServer(handleToluvaMcp);
  await new Promise((resolve) => mcpServer.listen(0, "127.0.0.1", resolve));
  mcpOrigin = `http://127.0.0.1:${mcpServer.address().port}`;
});
after(async () => { await new Promise((resolve) => mcpServer.close(resolve)); });

async function mcp(method, params, id) {
  const response = await fetch(mcpOrigin, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream", "MCP-Protocol-Version": "2025-11-25" },
    body: JSON.stringify({ jsonrpc: "2.0", id, method, params }),
  });
  assert.equal(response.status, 200);
  const text = await response.text();
  const payload = text.startsWith("event:")
    ? JSON.parse(text.split("\n").find((line) => line.startsWith("data: ")).slice(6))
    : JSON.parse(text);
  assert.equal(payload.id, id);
  return payload.result;
}

test("public MCP lists read-only tools and prepares an unsigned handoff", async () => {
  const initialized = await mcp("initialize", { protocolVersion: "2025-11-25", capabilities: {}, clientInfo: { name: "test", version: "1" } }, 1);
  assert.equal(initialized.serverInfo.name, "toluva-meteora");
  const listed = await mcp("tools/list", {}, 2);
  const tool = listed.tools.find((entry) => entry.name === "prepare_launch");
  assert.equal(tool.annotations.readOnlyHint, true);
  const prepared = await mcp("tools/call", { name: "prepare_launch", arguments: { name: "Aurora", symbol: "AURA", graduationTargetSol: 5 } }, 3);
  assert.equal(prepared.structuredContent.draft.name, "Aurora");
  assert.match(prepared.structuredContent.handoffUrl, /\/launches\?operator=1/);
  assert.match(prepared.structuredContent.message, /No token/);
});
