import React from "react";
import { refreshRegistry, useRegistry } from "../../../lib/launchRegistry";

const HISTORY_COLS = "minmax(150px, 1fr) minmax(130px, 0.9fr) minmax(150px, 0.95fr) minmax(170px, 1.1fr) minmax(140px, 0.9fr) minmax(190px, 1.2fr) minmax(120px, 0.8fr)";
const LAMPORTS_PER_SOL = 1_000_000_000;

function numeric(value) {
  const next = Number(value);
  return Number.isFinite(next) ? next : 0;
}

function shortAddress(value) {
  const text = String(value || "");
  return text.length > 12 ? `${text.slice(0, 6)}...${text.slice(-5)}` : text || "none";
}

function eventAmountSol(event) {
  const raw = numeric(event?.payload?.amount ?? event?.torqueRequest?.data?.amount);
  return raw >= 1_000_000 ? raw / LAMPORTS_PER_SOL : raw;
}

function formatSol(value) {
  const amount = numeric(value);

  if (amount === 0) {
    return "0 SOL";
  }

  if (amount < 0.001) {
    return `${amount.toFixed(6)} SOL`;
  }

  return `${amount.toLocaleString(undefined, {
    maximumFractionDigits: amount < 1 ? 5 : 2,
  })} SOL`;
}

function formatDate(value) {
  const date = value ? new Date(value) : null;

  if (!date || Number.isNaN(date.getTime())) {
    return "not recorded";
  }

  return date.toLocaleString();
}

function torqueStatus(event) {
  return event?.torqueReceipt?.status || (event?.status === "emitted" ? "ACCEPTED" : event?.status || "recorded");
}

function buyEvents(registry) {
  return (registry.eventReceipts || []).filter(
    (event) => event.type === "first_buy_completed" || event.type === "buy_completed",
  );
}

function explorerTxUrl(signature) {
  return `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
}

function StatCard({ title, value, foot, dark = false }) {
  return (
    <div className={`card stat${dark ? " dark" : ""}`}>
      <div className="stat-head">
        <div className="stat-title">{title}</div>
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-foot">{foot}</div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="card" style={{ padding: 56, textAlign: "center" }}>
      <div className="text-[16px] font-bold tracking-tight text-slate-900">No buy history yet</div>
      <div className="mx-auto mt-2 max-w-md text-[13px] leading-6 text-slate-500">
        Buy history appears after a real Raydium devnet buy is submitted and the local API records the Torque receipt.
      </div>
    </div>
  );
}

function HistoryRow({ event }) {
  const txSignature = event?.payload?.txSignature || event?.torqueRequest?.data?.tx_signature;
  const ingestionId = event?.torqueReceipt?.ingestionId;
  const status = torqueStatus(event);
  const accepted = status === "ACCEPTED";

  return (
    <div className="data-row" style={{ gridTemplateColumns: HISTORY_COLS, gap: 16 }}>
      <div className="min-w-0">
        <div className="font-mono text-[13px] font-bold text-slate-900">{String(event.token || "UNKNOWN").toUpperCase()}</div>
        <div className="mt-1 text-[11.5px] text-slate-500">{event.type.replaceAll("_", " ")}</div>
      </div>
      <div className="font-mono text-[13px] font-semibold tabular-nums text-slate-800">{formatSol(eventAmountSol(event))}</div>
      <div className="min-w-0 font-mono text-[12px] text-slate-500" title={event.wallet || ""}>
        {shortAddress(event.wallet)}
      </div>
      <div className="min-w-0">
        {txSignature ? (
          <a
            href={explorerTxUrl(txSignature)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-8 items-center rounded-full border border-slate-200 bg-white px-3 font-mono text-[11.5px] font-semibold text-slate-700 transition-colors hover:border-pink-200 hover:text-pink-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300"
            title={txSignature}
          >
            {shortAddress(txSignature)}
          </a>
        ) : (
          <span className="text-[12px] text-slate-400">No transaction</span>
        )}
      </div>
      <div>
        <span className={`status-pill ${accepted ? "completed" : "pending"}`}>{status.toLowerCase()}</span>
      </div>
      <div className="min-w-0 font-mono text-[11.5px] text-slate-500" title={ingestionId || ""}>
        {ingestionId ? shortAddress(ingestionId) : "not ingested"}
      </div>
      <div className="text-[12px] text-slate-500">{formatDate(event.createdAt)}</div>
    </div>
  );
}

export default function HistoryPage() {
  const { registry, source, loading } = useRegistry();
  const [refreshing, setRefreshing] = React.useState(false);
  const events = buyEvents(registry);
  const firstBuys = events.filter((event) => event.type === "first_buy_completed").length;
  const repeatBuys = events.filter((event) => event.type === "buy_completed").length;
  const accepted = events.filter((event) => torqueStatus(event) === "ACCEPTED").length;
  const totalSol = events.reduce((total, event) => total + eventAmountSol(event), 0);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await refreshRegistry({ force: true });
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>History</h1>
          <div className="sub">Real Raydium buy events and Torque receipts recorded by the local API.</div>
        </div>
        <div className="actions">
          <button className="btn ghost" type="button" onClick={handleRefresh} disabled={refreshing || loading}>
            {refreshing || loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      <div className="grid">
        <div className="c-stat-1">
          <StatCard title="Buy Events" value={events.length} foot={`${firstBuys} first · ${repeatBuys} repeat`} dark />
        </div>
        <div className="c-stat-2">
          <StatCard title="Buy Volume" value={formatSol(totalSol).replace(" SOL", "")} foot="SOL recorded from receipts" />
        </div>
        <div className="c-stat-3">
          <StatCard title="Torque Accepted" value={accepted} foot="Accepted ingest receipts" />
        </div>
        <div className="c-stat-4">
          <StatCard title="Source" value={source === "api" ? "API" : "Off"} foot={source === "api" ? "Local live registry" : "API unavailable"} />
        </div>
      </div>

      {events.length > 0 ? (
        <div className="history-table-scroll">
          <div className="data-table history-table">
            <div className="data-thead" style={{ gridTemplateColumns: HISTORY_COLS, gap: 16 }}>
              <div>Token</div>
              <div>Amount</div>
              <div>Wallet</div>
              <div>Transaction</div>
              <div>Torque</div>
              <div>Ingestion</div>
              <div>Time</div>
            </div>
            <div>
              {events.map((event) => (
                <HistoryRow key={event.id} event={event} />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <EmptyState />
      )}
    </div>
  );
}
