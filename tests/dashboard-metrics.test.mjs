import test from "node:test";
import assert from "node:assert/strict";
import { graduated, migrationSpotlight, sevenDayTradeVolume, verifiedDbcTrades } from "../src/lib/dashboardMetrics.js";

const launch = {
  sym: "TEST-MINT",
  dbc: { symbol: "TEST", mint: "MINT", pool: "POOL", liveStatus: { progressPercent: 0.17, migrationProgress: 0 } },
};

function trade({ id, type = "dbc_buy_verified", quoteLamports = "10000000", createdAt = "2026-10-10T10:48:00.000Z", ...changes }) {
  return {
    id,
    type,
    token: launch.sym,
    wallet: "WALLET",
    status: "finalized",
    createdAt,
    payload: { signature: `SIG-${id}`, pool: "POOL", mint: "MINT", direction: type === "dbc_buy_verified" ? "buy" : "sell", commitment: "finalized", quoteLamports },
    ...changes,
  };
}

test("dashboard reads the persisted finalized DBC trade schema and excludes unrelated records", () => {
  const validBuy = trade({ id: "buy" });
  const validSell = trade({ id: "sell", type: "dbc_sell_verified", quoteLamports: "1563831", createdAt: "2026-10-11T08:45:08.000Z" });
  const records = [validBuy, validSell, trade({ id: "duplicate", payload: { ...validBuy.payload } }),
    trade({ id: "wrong-pool", payload: { ...validBuy.payload, signature: "OTHER", pool: "OTHER" } }),
    trade({ id: "pending", status: "pending" }),
    trade({ id: "checkpoint", type: "conviction_balance_checkpoint_v2" })];
  const result = verifiedDbcTrades({ launches: [launch], eventReceipts: records });
  assert.deepEqual(result.map((item) => item.id), ["sell", "buy"]);
  assert.equal(result[0].symbol, "TEST");
  assert.equal(result[0].amountSol, 0.001563831);
  assert.equal(result[1].amountSol, 0.01);
});

test("seven-day chart includes buys and sells by UTC trade day and excludes older trades", () => {
  const trades = verifiedDbcTrades({ launches: [launch], eventReceipts: [
    trade({ id: "buy", createdAt: "2026-10-08T23:59:00.000Z" }),
    trade({ id: "sell", type: "dbc_sell_verified", quoteLamports: "5000000", createdAt: "2026-10-13T00:05:00.000Z" }),
    trade({ id: "old", createdAt: "2026-10-06T23:59:00.000Z" }),
  ] });
  const result = sevenDayTradeVolume(trades, new Date("2026-10-13T23:30:00.000Z"));
  assert.equal(result.days[0].date, "2026-10-07");
  assert.equal(result.days[6].date, "2026-10-13");
  assert.equal(result.tradeCount, 2);
  assert.equal(result.totalSol, 0.015);
});

test("migration spotlight chooses the active pool nearest graduation", () => {
  const newest = { ...launch, dbc: { ...launch.dbc, liveStatus: { progressPercent: 0.1, migrationProgress: 0 } } };
  const migrated = { ...launch, sym: "DONE", dbc: { ...launch.dbc, liveStatus: { progressPercent: 100, migrationProgress: 3 } } };
  const closest = { ...launch, sym: "CLOSEST" };
  assert.equal(migrationSpotlight([newest, migrated, closest]), closest);
  assert.equal(graduated(migrated), true);
  assert.equal(migrationSpotlight([migrated]), migrated);
});
