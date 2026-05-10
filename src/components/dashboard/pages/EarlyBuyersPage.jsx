import React from "react";
import Link from "../Link";
import { TokenIcon } from "../tokenIcons";
import { refreshRegistry, useRegistry } from "../../../lib/launchRegistry";

const LEADERBOARD_COLS = "72px minmax(190px, 1.2fr) minmax(120px, 0.8fr) minmax(110px, 0.7fr) minmax(150px, 0.9fr) minmax(180px, 1fr) minmax(120px, 0.7fr)";
const LAMPORTS_PER_SOL = 1_000_000_000;
const BUY_EVENT_TYPES = new Set(["first_buy_completed", "buy_completed"]);

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

function tokenOptions(registry) {
  const symbols = new Set();
  (registry.launches || []).forEach((launch) => launch.sym && symbols.add(String(launch.sym).toUpperCase()));
  (registry.eventReceipts || []).forEach((event) => event.token && symbols.add(String(event.token).toUpperCase()));
  return [...symbols];
}

function buyEventsForToken(registry, token) {
  const selected = String(token || "").toUpperCase();
  return (registry.eventReceipts || []).filter((event) => {
    if (!BUY_EVENT_TYPES.has(event.type)) {
      return false;
    }

    return !selected || String(event.token || "").toUpperCase() === selected;
  });
}

function leaderboardRows(events) {
  const wallets = new Map();

  events.forEach((event) => {
    const wallet = event.wallet || event.torqueRequest?.userPubkey || "unknown";
    const current = wallets.get(wallet) || {
      wallet,
      totalSol: 0,
      buyCount: 0,
      firstBuyAt: null,
      latestBuyAt: null,
      latestTx: null,
      acceptedCount: 0,
    };
    const createdAt = event.createdAt || new Date().toISOString();
    const txSignature = event?.payload?.txSignature || event?.torqueRequest?.data?.tx_signature || current.latestTx;

    current.totalSol += eventAmountSol(event);
    current.buyCount += 1;
    current.acceptedCount += torqueStatus(event) === "ACCEPTED" ? 1 : 0;
    current.firstBuyAt = !current.firstBuyAt || new Date(createdAt) < new Date(current.firstBuyAt) ? createdAt : current.firstBuyAt;
    current.latestBuyAt = !current.latestBuyAt || new Date(createdAt) > new Date(current.latestBuyAt) ? createdAt : current.latestBuyAt;
    current.latestTx = txSignature;
    wallets.set(wallet, current);
  });

  return [...wallets.values()]
    .sort((a, b) => b.totalSol - a.totalSol || new Date(a.firstBuyAt) - new Date(b.firstBuyAt))
    .map((row, index) => ({
      ...row,
      rank: index + 1,
      status: row.acceptedCount === row.buyCount ? "accepted" : "partial",
    }));
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

function LeaderboardRow({ row }) {
  return (
    <div className="data-row" style={{ gridTemplateColumns: LEADERBOARD_COLS, gap: 16 }}>
      <div className="font-mono text-[18px] font-bold text-slate-900">#{row.rank}</div>
      <div className="min-w-0">
        <div className="font-mono text-[13px] font-bold text-slate-900" title={row.wallet}>
          {shortAddress(row.wallet)}
        </div>
        <div className="mt-1 text-[11.5px] text-slate-500">First buy {formatDate(row.firstBuyAt)}</div>
      </div>
      <div className="font-mono text-[13px] font-semibold tabular-nums text-slate-800">{formatSol(row.totalSol)}</div>
      <div className="font-mono text-[13px] font-semibold tabular-nums text-slate-800">{row.buyCount}</div>
      <div className="text-[12px] text-slate-500">{formatDate(row.latestBuyAt)}</div>
      <div>
        {row.latestTx ? (
          <a
            href={explorerTxUrl(row.latestTx)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-8 items-center rounded-full border border-slate-200 bg-white px-3 font-mono text-[11.5px] font-semibold text-slate-700 transition-colors hover:border-pink-200 hover:text-pink-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300"
            title={row.latestTx}
          >
            {shortAddress(row.latestTx)}
          </a>
        ) : (
          <span className="text-[12px] text-slate-400">No transaction</span>
        )}
      </div>
      <div>
        <span className={`status-pill ${row.status === "accepted" ? "completed" : "pending"}`}>{row.status}</span>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="card" style={{ padding: 56, textAlign: "center" }}>
      <div className="text-[16px] font-bold tracking-tight text-slate-900">No early buyers yet</div>
      <div className="mx-auto mt-2 max-w-md text-[13px] leading-6 text-slate-500">
        Run a real buy from the Launches page. This leaderboard uses only recorded Torque buy receipts.
      </div>
    </div>
  );
}

function TorquePreview({ token, rows, events }) {
  const hasRepeatBuys = events.some((event) => event.type === "buy_completed");
  const totalSol = rows.reduce((total, row) => total + row.totalSol, 0);

  return (
    <div className="card" style={{ padding: 24 }}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-pink-500">Torque preview</div>
          <h3 className="mt-1 text-[20px] font-bold tracking-tight text-slate-900">Early Buyer Leaderboard</h3>
          <div className="mt-1 text-[13px] leading-6 text-slate-500">
            Preview only. This does not create, fund, or confirm a real incentive.
          </div>
        </div>
        <span className="status-pill completed">ready to preview</span>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Metric</div>
          <div className="mt-1 text-[13px] font-semibold text-slate-800">SUM buy amount by wallet</div>
          <div className="mt-1 text-[12px] text-slate-500">{formatSol(totalSol)} across {events.length} buy events</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Sources</div>
          <div className="mt-1 text-[13px] font-semibold text-slate-800">first_buy_completed + buy_completed</div>
          <div className="mt-1 text-[12px] text-slate-500">{hasRepeatBuys ? "Repeat buys included" : "Waiting for repeat buys"}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Filter</div>
          <div className="mt-1 font-mono text-[13px] font-semibold text-slate-800">{token || "All launches"}</div>
          <div className="mt-1 text-[12px] text-slate-500">Devnet registry receipts only</div>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-950 p-4">
        <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Incentive draft</div>
        <pre className="mt-3 overflow-auto whitespace-pre-wrap break-words font-mono text-[11.5px] leading-6 text-slate-100">
{`type: leaderboard
name: Toluva Early Buyer Leaderboard
token: ${token || "ALL"}
metric: SUM(amount) grouped by wallet
event sources: first_buy_completed, buy_completed
reward draft: RANK == 1 ? TOTAL_REWARD_POOL * 0.3 : RANK <= 3 ? TOTAL_REWARD_POOL * 0.15 : RANK <= 10 ? TOTAL_REWARD_POOL * 0.4 / 7 : 0
execution: preview only; confirmed funding still requires operator approval`}
        </pre>
      </div>
    </div>
  );
}

export default function EarlyBuyersPage() {
  const { registry, loading } = useRegistry();
  const options = tokenOptions(registry);
  const [selectedToken, setSelectedToken] = React.useState("");
  const [refreshing, setRefreshing] = React.useState(false);

  React.useEffect(() => {
    if (!selectedToken && options.length > 0) {
      setSelectedToken(options[0]);
    }
  }, [options, selectedToken]);

  const events = buyEventsForToken(registry, selectedToken);
  const rows = leaderboardRows(events);
  const totalSol = rows.reduce((total, row) => total + row.totalSol, 0);
  const acceptedEvents = events.filter((event) => torqueStatus(event) === "ACCEPTED").length;

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
          <h1>Early Buyers</h1>
          <div className="sub">Campaign leaderboard built from real Raydium buy events and Torque receipts.</div>
        </div>
        <div className="actions">
          <Link href="/campaigns" className="btn ghost">Campaigns</Link>
          <button className="btn primary" type="button" onClick={handleRefresh} disabled={refreshing || loading}>
            {refreshing || loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3">
        <span className="text-[12.5px] font-semibold text-slate-600">Launch</span>
        {options.map((symbol) => (
          <button
            key={symbol}
            type="button"
            onClick={() => setSelectedToken(symbol)}
            className={`inline-flex min-h-8 items-center gap-2 rounded-full border px-3 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300 ${
              selectedToken === symbol
                ? "border-pink-200 bg-pink-50 text-pink-700"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
            }`}
          >
            <TokenIcon symbol={symbol} size={18} />
            {symbol}
          </button>
        ))}
        {options.length === 0 && <span className="text-[12.5px] text-slate-500">No launches recorded yet.</span>}
      </div>

      <div className="grid">
        <div className="c-stat-1">
          <StatCard title="Ranked Wallets" value={rows.length} foot="Grouped by buyer wallet" dark />
        </div>
        <div className="c-stat-2">
          <StatCard title="Buy Volume" value={formatSol(totalSol).replace(" SOL", "")} foot="SOL in selected launch" />
        </div>
        <div className="c-stat-3">
          <StatCard title="Buy Events" value={events.length} foot="First and repeat buys" />
        </div>
        <div className="c-stat-4">
          <StatCard title="Torque Accepted" value={acceptedEvents} foot="Accepted receipt count" />
        </div>
      </div>

      <TorquePreview token={selectedToken} rows={rows} events={events} />

      {rows.length > 0 ? (
        <div className="history-table-scroll">
          <div className="data-table history-table">
            <div className="data-thead" style={{ gridTemplateColumns: LEADERBOARD_COLS, gap: 16 }}>
              <div>Rank</div>
              <div>Wallet</div>
              <div>Total</div>
              <div>Buys</div>
              <div>Latest buy</div>
              <div>Latest tx</div>
              <div>Status</div>
            </div>
            <div>
              {rows.map((row) => (
                <LeaderboardRow key={row.wallet} row={row} />
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
