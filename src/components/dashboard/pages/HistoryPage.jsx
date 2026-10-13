import React from "react";
import { refreshRegistry, useRegistry } from "../../../lib/launchRegistry";
import { verifiedDbcTrades } from "../../../lib/dashboardMetrics";

const HISTORY_COLS = "minmax(140px, 1fr) minmax(110px, 0.8fr) minmax(140px, 0.9fr) minmax(160px, 1.1fr) minmax(180px, 1.2fr) minmax(110px, 0.8fr) minmax(140px, 0.9fr)";

function shortAddress(value) {
  const text = String(value || "");
  return text.length > 12 ? `${text.slice(0, 5)}...${text.slice(-4)}` : text || "—";
}

function formatSol(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n) || n === 0) return "0 SOL";
  if (n < 0.001) return `${n.toFixed(6)} SOL`;
  if (n < 1) return `${n.toFixed(6).replace(/0+$/, "").replace(/\.$/, "")} SOL`;
  return `${n.toLocaleString(undefined, { maximumFractionDigits: 2 })} SOL`;
}

function formatDate(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return "not recorded";
  return date.toLocaleString();
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
      <div className="text-[16px] font-bold tracking-tight text-slate-900">No trading activity yet</div>
      <div className="mx-auto mt-2 max-w-md text-[13px] leading-6 text-slate-500">
        Trading activity appears after swaps on Meteora DBC curves are submitted to Toluva and verified.
      </div>
    </div>
  );
}

function TradeRow({ trade }) {
  const isBuy = trade.direction === "buy";

  return (
    <div className="data-row" style={{ gridTemplateColumns: HISTORY_COLS, gap: 16 }}>
      <div className="min-w-0">
        <div className="font-mono text-[13px] font-bold text-slate-900">${trade.symbol}</div>
        <div className="mt-1 text-[11px] text-slate-400">Meteora DBC</div>
      </div>
      <div>
        <span
          className="status-pill"
          style={{
            background: isBuy ? "var(--green-pale)" : "#fee2e2",
            color: isBuy ? "var(--green)" : "#b91c1c",
            borderColor: isBuy ? "#fbcfe8" : "#fca5a5",
            fontWeight: 700,
            textTransform: "uppercase",
            fontSize: 10.5,
          }}
        >
          {trade.direction}
        </span>
      </div>
      <div className="font-mono text-[13px] font-semibold tabular-nums text-slate-800">
        {formatSol(trade.amountSol)}
      </div>
      <div className="min-w-0 font-mono text-[12px] text-slate-500" title={trade.wallet || ""}>
        {shortAddress(trade.wallet)}
      </div>
      <div className="min-w-0">
        <a
          href={explorerTxUrl(trade.signature)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-8 items-center rounded-full border border-slate-200 bg-white px-3 font-mono text-[11.5px] font-semibold text-slate-700 transition-colors hover:border-pink-200 hover:text-pink-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300"
          title={trade.signature}
        >
          {shortAddress(trade.signature)} ↗
        </a>
      </div>
      <div>
        <span className="status-pill completed">finalized</span>
      </div>
      <div className="text-[12px] text-slate-500">{formatDate(trade.createdAt)}</div>
    </div>
  );
}

export default function HistoryPage() {
  const { registry, loading } = useRegistry();
  const [refreshing, setRefreshing] = React.useState(false);
  const trades = verifiedDbcTrades(registry);
  const buyCount = trades.filter((t) => t.direction === "buy").length;
  const sellCount = trades.filter((t) => t.direction === "sell").length;
  const totalSol = trades.reduce((sum, t) => sum + t.amountSol, 0);

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
          <h1>Activity</h1>
          <div className="sub">Verified on-chain Meteora DBC swaps and finality receipts.</div>
        </div>
        <div className="actions">
          <button className="btn ghost" type="button" onClick={handleRefresh} disabled={refreshing || loading}>
            {refreshing || loading ? "Refreshing..." : "↻ Refresh"}
          </button>
        </div>
      </div>

      <div className="grid">
        <div className="c-stat-1">
          <StatCard title="Verified Trades" value={trades.length} foot={`${buyCount} ${buyCount === 1 ? "buy" : "buys"} · ${sellCount} ${sellCount === 1 ? "sell" : "sells"}`} dark />
        </div>
        <div className="c-stat-2">
          <StatCard title="DBC Volume" value={formatSol(totalSol).replace(" SOL", "")} foot="SOL traded across curves" />
        </div>
        <div className="c-stat-3">
          <StatCard title="Distinct Wallets" value={new Set(trades.map((t) => t.wallet)).size} foot="Addresses in tracked swaps" />
        </div>
        <div className="c-stat-4">
          <StatCard title="Chain Status" value="Finalized" foot="Solana devnet confirmed" />
        </div>
      </div>

      {trades.length > 0 ? (
        <div className="history-table-scroll">
          <div className="data-table history-table">
            <div className="data-thead" style={{ gridTemplateColumns: HISTORY_COLS, gap: 16 }}>
              <div>Token</div>
              <div>Action</div>
              <div>Amount</div>
              <div>Wallet</div>
              <div>Transaction</div>
              <div>Status</div>
              <div>Time</div>
            </div>
            <div>
              {trades.map((trade) => (
                <TradeRow key={trade.signature} trade={trade} />
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
