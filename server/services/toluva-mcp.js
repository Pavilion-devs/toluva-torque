import { createMcpHandler, McpServer } from "@modelcontextprotocol/server";
import { toNodeHandler } from "@modelcontextprotocol/node";
import * as z from "zod/v4";
import { config } from "../config.js";
import { getVerifiedDbcActivity } from "../registry-store.js";
import { getLinkedDlmmStatus } from "./meteora-dlmm.js";
import {
  findOperatorLaunch, listOperatorLaunches, normalizeLaunchIntent,
  operatorLaunchReport, operatorLaunchTerms,
} from "./launch-operator.js";

function result(value) {
  return { content: [{ type: "text", text: JSON.stringify(value) }], structuredContent: value };
}

function safeTool(run) {
  return async (input) => {
    try { return result(await run(input)); }
    catch (error) {
      return { isError: true, content: [{ type: "text", text: error.status >= 400 && error.status < 500
        ? error.message : "This Toluva read is temporarily unavailable. Try again shortly." }] };
    }
  };
}

const handler = createMcpHandler(() => {
  const server = new McpServer({ name: "toluva-meteora", version: "1.0.0", websiteUrl: config.operator.publicOrigin || undefined });
  server.registerTool("list_launches", {
    description: "List public Toluva Meteora DBC launches on the current Solana network. Addresses are registry entries; call get_launch_report for current chain status.",
    inputSchema: z.object({}),
    annotations: { readOnlyHint: true },
  }, safeTool(listOperatorLaunches));
  server.registerTool("get_launch_report", {
    description: "Read a Toluva launch's live DBC and DAMM v2 state, submitted verified trades, conviction summary, linked DLMM status, and the next review step. No transaction is built or sent.",
    inputSchema: z.object({ launchId: z.string().min(1).max(100) }),
    annotations: { readOnlyHint: true },
  }, safeTool(({ launchId }) => operatorLaunchReport(launchId)));
  server.registerTool("get_launch_terms", {
    description: "Read current on-chain DBC configuration terms for a registered Toluva launch.",
    inputSchema: z.object({ launchId: z.string().min(1).max(100) }),
    annotations: { readOnlyHint: true },
  }, safeTool(({ launchId }) => operatorLaunchTerms(launchId)));
  server.registerTool("get_verified_activity", {
    description: "Read the finalized DBC swaps submitted to and verified by Toluva for one launch. This is not a complete market index.",
    inputSchema: z.object({ launchId: z.string().min(1).max(100) }),
    annotations: { readOnlyHint: true },
  }, safeTool(async ({ launchId }) => {
    const launch = await findOperatorLaunch(launchId);
    return { network: config.solana.cluster, launchId: launch.sym, ...(await getVerifiedDbcActivity(launch)) };
  }));
  server.registerTool("get_liquidity_market", {
    description: "Read a launch's linked Meteora DLMM pool and optional public wallet positions. No liquidity is changed.",
    inputSchema: z.object({ launchId: z.string().min(1).max(100), wallet: z.string().min(32).max(44).optional() }),
    annotations: { readOnlyHint: true },
  }, safeTool(async ({ launchId, wallet }) => {
    const launch = await findOperatorLaunch(launchId);
    return { network: config.solana.cluster, launchId: launch.sym,
      status: await getLinkedDlmmStatus(launch, wallet || null) };
  }));
  server.registerTool("prepare_launch", {
    description: "Prepare an editable Conviction v1 DBC launch plan and handoff URL. The fixed economics and devnet network are verified by Toluva. Opening the URL never signs or submits; the creator must review metadata and approve wallet transactions in the Toluva website.",
    inputSchema: z.object({ name: z.string().min(2).max(32), symbol: z.string().min(2).max(10), graduationTargetSol: z.number().min(1).max(100), description: z.string().max(280).optional() }),
    annotations: { readOnlyHint: true },
  }, safeTool(({ name, symbol, graduationTargetSol, description }) => {
    const plan = normalizeLaunchIntent({ name, symbol, description, migrationThresholdSol: graduationTargetSol }, "mcp");
    const query = new URLSearchParams({ operator: "1", name: plan.draft.name, symbol: plan.draft.symbol,
      targetSol: plan.draft.migrationThresholdSol, description: plan.draft.description });
    return { ...plan, handoffUrl: `${config.operator.publicOrigin || ""}/launches?${query.toString()}` };
  }));
  return server;
}, { responseMode: "json" });

export const handleToluvaMcp = toNodeHandler(handler, { maxRequestBodySize: 64 * 1024 });
