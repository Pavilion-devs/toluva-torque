import React from "react";
import { TokenIcon, TOKENS } from "../tokenIcons";
import useWallet from "../useWallet";
import { getLaunchFilters, getMigrationSpotlightLaunches, refreshRegistry, useRegistry } from "../../../lib/launchRegistry";

const statusMap = {
  bonding: { label: "Bonding", pill: "progress" },
  migrating: { label: "Migrating", pill: "progress" },
  migrated: { label: "Migrated", pill: "completed" },
  draft: { label: "Draft", pill: "pending" },
};

const COLS = "minmax(220px, 2fr) 0.8fr 1.05fr 0.9fr 0.55fr 0.95fr minmax(220px, 1.35fr)";
const BUY_PRESETS_SOL = ["0.01", "0.05", "0.1"];
const LAMPORTS_PER_SOL = 1_000_000_000;

const stateThemes = {
  migrating: { label: "Migrating now", bg: "#e0e7ff", text: "#3730a3", dot: "#6366f1" },
  sprinting: { label: "Active sprint", bg: "#ede9fe", text: "#5b21b6", dot: "#8b5cf6" },
  bonding: { label: "Bonding", bg: "#fce7f3", text: "#831843", dot: "#ec4899" },
};

function MigrationRing({ symbol, bonded, ringSize = 132, stroke = 9 }) {
  const meta = TOKENS[symbol];
  const from = meta?.from || "#fb7185";
  const to = meta?.to || "#ec4899";
  const gradient = meta?.gradient || "linear-gradient(135deg, #fb7185 0%, #ec4899 100%)";
  const glow = meta?.glow || "rgba(236, 72, 153, 0.28)";
  const r = (ringSize - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - bonded / 100);
  const gradId = `ring-grad-${symbol}`;
  const blurId = `ring-blur-${symbol}`;
  const c = ringSize / 2;

  return (
    <div className="relative" style={{ width: ringSize, height: ringSize }}>
      <svg width={ringSize} height={ringSize} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={from} />
            <stop offset="100%" stopColor={to} />
          </linearGradient>
          <filter id={blurId} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="4" />
          </filter>
        </defs>
        {/* Track */}
        <circle cx={c} cy={c} r={r} fill="none" stroke="#f1f5f9" strokeWidth={stroke} />
        {/* Glow under */}
        <circle
          cx={c}
          cy={c}
          r={r}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth={stroke}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${c} ${c})`}
          filter={`url(#${blurId})`}
          opacity={0.55}
        />
        {/* Main arc */}
        <circle
          cx={c}
          cy={c}
          r={r}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth={stroke}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${c} ${c})`}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <TokenIcon symbol={symbol} size={Math.round(ringSize * 0.48)} />
      </div>
      <div
        className="absolute left-1/2 -translate-x-1/2 rounded-full px-3 py-1 font-mono text-[12px] font-bold tracking-tight text-white"
        style={{
          bottom: -10,
          background: gradient,
          boxShadow: `0 8px 18px ${glow}, inset 0 1px 0 rgba(255,255,255,0.3)`,
        }}
      >
        {bonded}%
      </div>
    </div>
  );
}

function MigrationEntry({ symbol, bonded, time, state }) {
  const meta = TOKENS[symbol];
  const theme = stateThemes[state] || stateThemes.bonding;
  return (
    <div className="group relative flex flex-col items-center text-center transition-transform duration-300 hover:-translate-y-1">
      <div
        className="pointer-events-none absolute -inset-x-4 -bottom-4 -top-4 rounded-3xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: `radial-gradient(circle at 50% 30%, ${meta?.glow || "rgba(236, 72, 153, 0.18)"}, transparent 65%)` }}
      />
      <div className="relative">
        <MigrationRing symbol={symbol} bonded={bonded} />
      </div>
      <div className="mt-7 text-[15px] font-bold tracking-tight text-slate-900">{meta?.name || symbol}</div>
      <div className="mt-0.5 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-slate-400">
        <span>${symbol}</span>
        <span className="h-1 w-1 rounded-full bg-slate-300" />
        <span>{time}</span>
      </div>
      <div
        className="mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
        style={{ background: theme.bg, color: theme.text }}
      >
        <span
          className="relative flex h-1.5 w-1.5"
        >
          <span
            className="absolute inset-0 rounded-full opacity-75"
            style={{ background: theme.dot, animation: "ping 1.6s cubic-bezier(0,0,0.2,1) infinite" }}
          />
          <span className="relative h-1.5 w-1.5 rounded-full" style={{ background: theme.dot }} />
        </span>
        {theme.label}
      </div>
    </div>
  );
}

function MigrationSpotlight({ tokens }) {
  if (tokens.length === 0) {
    return (
      <div className="card" style={{ padding: 28 }}>
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-pink-500">Raydium migration</div>
        <h3 className="mt-2 text-[22px] font-bold leading-tight tracking-tight text-slate-900">
          No active LaunchLab pools yet
        </h3>
        <div className="mt-2 text-[13px] text-slate-500">
          This area will populate from real launch records after a devnet token is signed and submitted.
        </div>
      </div>
    );
  }

  return (
    <div
      className="card"
      style={{
        position: "relative",
        overflow: "hidden",
        padding: "28px 32px 36px",
      }}
    >
      <div
        className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(236,72,153,0.18), transparent 70%)" }}
      />
      <div
        className="pointer-events-none absolute -left-24 -bottom-32 h-72 w-72 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(99,91,255,0.14), transparent 70%)" }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "repeating-linear-gradient(50deg, transparent 0 14px, rgba(236, 72, 153, 0.04) 14px 15px)",
          maskImage: "linear-gradient(180deg, transparent 0%, #000 35%, #000 65%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(180deg, transparent 0%, #000 35%, #000 65%, transparent 100%)",
        }}
      />

      <div className="relative z-10 mb-10 flex items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-pink-500">
            <iconify-icon icon="solar:rocket-bold" style={{ fontSize: 14 }} />
            Closest to migration
          </div>
          <h3 className="mt-2 text-[22px] font-bold leading-tight tracking-tight text-slate-900">
            Tokens about to graduate to Raydium AMM
          </h3>
        </div>
        <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3.5 py-1.5 text-[12px] text-slate-600 shadow-sm backdrop-blur md:inline-flex">
          <span className="relative flex h-2 w-2">
            <span className="absolute inset-0 rounded-full bg-emerald-500 opacity-75" style={{ animation: "ping 1.6s cubic-bezier(0,0,0.2,1) infinite" }} />
          <span className="relative h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="font-semibold">{tokens.length} active sprints</span>
        </div>
      </div>

      <div className="relative z-10 grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-4">
        {tokens.map((t) => (
          <MigrationEntry key={t.symbol} {...t} />
        ))}
      </div>
    </div>
  );
}

function ProgressBar({ value, status }) {
  if (status === "draft") {
    return <span className="text-xs text-slate-400">—</span>;
  }
  const color =
    status === "migrated"
      ? "linear-gradient(90deg,#10b981,#059669)"
      : "linear-gradient(90deg,#fb7185,#ec4899)";
  return (
    <div className="flex items-center gap-2.5">
      <div className="h-1.5 w-28 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full"
          style={{ width: `${value}%`, background: color, boxShadow: "0 2px 6px rgba(236,72,153,0.18)" }}
        />
      </div>
      <span className="font-mono text-[12px] font-semibold tabular-nums text-slate-700" style={{ minWidth: 32 }}>
        {value}%
      </span>
    </div>
  );
}

function CampaignChip({ label }) {
  if (!label) {
    return <span className="text-xs text-slate-400">No campaign</span>;
  }
  const color =
    label === "Early Buyer"
      ? { bg: "#fce7f3", text: "#831843", ring: "#fbcfe8" }
      : label === "Referral Raffle"
        ? { bg: "#ede9fe", text: "#5b21b6", ring: "#ddd6fe" }
        : { bg: "#e0e7ff", text: "#3730a3", ring: "#c7d2fe" };
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{ background: color.bg, color: color.text, boxShadow: `inset 0 0 0 1px ${color.ring}` }}
    >
      <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: color.text }} />
      {label}
    </span>
  );
}

function FilterChip({ label, count, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
        active
          ? "border-pink-200 bg-pink-50 text-pink-700"
          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
      }`}
    >
      {label}
      <span
        className={`rounded-full px-1.5 font-mono text-[11px] ${
          active ? "bg-pink-200/70 text-pink-800" : "bg-slate-100 text-slate-500"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

function DevnetLaunchPanel({ wallet, onClose, onLaunched }) {
  const [form, setForm] = React.useState(() => ({
    name: "Toluva Devnet Token",
    symbol: `TLV${Math.floor(Math.random() * 900 + 100)}`,
    uri: "https://example.com/toluva-devnet-token.json",
    buyAmount: "10000000",
    supply: "1000000000000000",
    totalSellA: "793100000000000",
    totalFundRaisingB: "85000000000",
  }));
  const [state, setState] = React.useState({ status: "idle", error: null, result: null, diagnostics: null });

  function update(field) {
    return (event) => {
      setForm((current) => ({ ...current, [field]: event.target.value }));
    };
  }

  async function submit(event) {
    event.preventDefault();
    setState({ status: "submitting", error: null, result: null, diagnostics: null });

    try {
      const { launchDevnetToken } = await import("../../../lib/raydiumLaunchlab");
      const result = await launchDevnetToken({ wallet, launch: form });
      await refreshRegistry({ force: true });
      setState({ status: "submitted", error: null, result, diagnostics: result.diagnostics || null });
      onLaunched?.();
    } catch (error) {
      setState({
        status: "error",
        error: error instanceof Error ? error.message : "Launch failed.",
        result: null,
        diagnostics: error?.diagnostics || null,
      });
    }
  }

  const disabled = state.status === "submitting" || !wallet.connected || wallet.source !== "injected";

  return (
    <form className="card" onSubmit={submit} style={{ padding: 22 }}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-pink-500">Raydium devnet</div>
          <h3 className="mt-1 text-[18px] font-bold tracking-tight text-slate-900">Wallet-signed LaunchLab token</h3>
          <div className="mt-1 text-[12.5px] text-slate-500">
            Generates a mint keypair in-browser, asks your wallet to sign, submits to devnet, then emits Torque launch telemetry.
          </div>
        </div>
        <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 font-mono text-[11px] text-slate-500">
          {wallet.connected ? wallet.short : "no wallet"}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-900"
        >
          Close
        </button>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <label className="grid gap-1.5">
          <span className="text-[12px] font-semibold text-slate-600">Name</span>
          <input className="rounded-xl border border-slate-200 px-3 py-2 text-[13px] outline-none focus:border-pink-300" value={form.name} onChange={update("name")} />
        </label>
        <label className="grid gap-1.5">
          <span className="text-[12px] font-semibold text-slate-600">Symbol</span>
          <input className="rounded-xl border border-slate-200 px-3 py-2 font-mono text-[13px] uppercase outline-none focus:border-pink-300" value={form.symbol} onChange={update("symbol")} />
        </label>
        <label className="grid gap-1.5">
          <span className="text-[12px] font-semibold text-slate-600">Metadata URI</span>
          <input className="rounded-xl border border-slate-200 px-3 py-2 font-mono text-[13px] outline-none focus:border-pink-300" value={form.uri} onChange={update("uri")} />
        </label>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-4">
        <label className="grid gap-1.5">
          <span className="text-[12px] font-semibold text-slate-600">Buy amount</span>
          <input className="rounded-xl border border-slate-200 px-3 py-2 font-mono text-[13px] outline-none focus:border-pink-300" value={form.buyAmount} onChange={update("buyAmount")} />
        </label>
        <label className="grid gap-1.5">
          <span className="text-[12px] font-semibold text-slate-600">Supply</span>
          <input className="rounded-xl border border-slate-200 px-3 py-2 font-mono text-[13px] outline-none focus:border-pink-300" value={form.supply} onChange={update("supply")} />
        </label>
        <label className="grid gap-1.5">
          <span className="text-[12px] font-semibold text-slate-600">Sell A</span>
          <input className="rounded-xl border border-slate-200 px-3 py-2 font-mono text-[13px] outline-none focus:border-pink-300" value={form.totalSellA} onChange={update("totalSellA")} />
        </label>
        <label className="grid gap-1.5">
          <span className="text-[12px] font-semibold text-slate-600">Raise B</span>
          <input className="rounded-xl border border-slate-200 px-3 py-2 font-mono text-[13px] outline-none focus:border-pink-300" value={form.totalFundRaisingB} onChange={update("totalFundRaisingB")} />
        </label>
      </div>

      {wallet.connected && wallet.source !== "injected" && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-[12.5px] font-medium text-amber-800">
          Demo wallet cannot sign LaunchLab transactions. Connect Phantom, Backpack, or another injected Solana wallet.
        </div>
      )}

      {state.status === "submitting" && (
        <div className="mt-4 rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-3 text-[12.5px] font-medium text-indigo-800">
          Checking devnet wallet, simulating the Raydium transaction, then requesting wallet approval.
        </div>
      )}

      {state.error && (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-[12.5px] font-medium text-rose-700">
          {state.error}
        </div>
      )}

      {state.diagnostics && (
        <details className="mt-4 rounded-xl border border-slate-200 bg-slate-950 px-3.5 py-3 text-[12px] text-slate-100" open={state.status === "error"}>
          <summary className="cursor-pointer text-[12px] font-semibold text-slate-200">Launch diagnostics</summary>
          <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed text-slate-200">
            {JSON.stringify(state.diagnostics, null, 2)}
          </pre>
        </details>
      )}

      {state.result && (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-[12.5px] text-emerald-800">
          <div className="font-semibold">Submitted to devnet</div>
          <div className="mt-1 font-mono text-[11.5px]">Pool {state.result.poolId}</div>
          <div className="font-mono text-[11.5px]">Tx {state.result.signature}</div>
        </div>
      )}

      <div className="mt-5 flex items-center justify-end gap-3">
        <button className="btn primary" type="submit" disabled={disabled} style={disabled ? { opacity: 0.55, cursor: "not-allowed" } : undefined}>
          {state.status === "submitting" ? "Submitting..." : "Sign & launch on devnet"}
        </button>
      </div>
    </form>
  );
}

function RaydiumPoolCell({ launch }) {
  const poolId = launch.raydium?.poolId || launch.pool;
  const liveStatus = launch.raydium?.liveStatus;

  if (!poolId) {
    return <span className="text-slate-400">—</span>;
  }

  return (
    <div className="min-w-0">
      <div className="truncate font-mono text-[12px] font-semibold text-slate-700" title={poolId}>
        {poolId.slice(0, 4)}…{poolId.slice(-4)}
      </div>
      <div className={`mt-1 text-[10.5px] font-semibold ${liveStatus === "pool_read" ? "text-emerald-600" : "text-slate-400"}`}>
        {liveStatus === "pool_read" ? "live pool" : liveStatus || "pending read"}
      </div>
    </div>
  );
}

function solToLamports(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  return String(Math.floor(amount * LAMPORTS_PER_SOL));
}

function BuyButton({ launch, wallet, onBought }) {
  const [state, setState] = React.useState({ status: "idle", error: null, diagnostics: null });
  const [amountSol, setAmountSol] = React.useState(BUY_PRESETS_SOL[0]);
  const canBuy = Boolean(launch.raydium?.mint && (launch.raydium?.poolId || launch.pool));
  const buyAmountLamports = solToLamports(amountSol);
  const disabled = state.status === "submitting" || !wallet.connected || wallet.source !== "injected" || !buyAmountLamports;

  async function buy() {
    if (!buyAmountLamports) {
      setState({ status: "error", error: "Enter a valid SOL amount.", diagnostics: null });
      return;
    }

    setState({ status: "submitting", error: null, diagnostics: null });

    try {
      const { buyDevnetToken } = await import("../../../lib/raydiumLaunchlab");
      const result = await buyDevnetToken({ wallet, launch, buyAmount: buyAmountLamports });
      await refreshRegistry({ force: true });
      setState({ status: "done", error: null, diagnostics: result.diagnostics || null });
      onBought?.();
    } catch (error) {
      setState({
        status: "error",
        error: error instanceof Error ? error.message : "Buy failed.",
        diagnostics: error?.diagnostics || error?.payload || null,
      });
    }
  }

  if (!canBuy) {
    return <span className="text-xs text-slate-400">—</span>;
  }

  return (
    <div className="flex min-w-0 flex-col items-start gap-2">
      <div className="flex w-full flex-wrap items-center gap-1.5">
        {BUY_PRESETS_SOL.map((amount) => (
          <button
            key={amount}
            type="button"
            onClick={() => {
              setAmountSol(amount);
              setState((current) => ({ ...current, error: null }));
            }}
            className={`min-h-8 rounded-full border px-2.5 text-[11.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300 ${
              amountSol === amount
                ? "border-pink-200 bg-pink-50 text-pink-700"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
            }`}
            aria-pressed={amountSol === amount}
          >
            {amount}
          </button>
        ))}
        <label className="min-w-0 flex-1">
          <span className="sr-only">Custom buy amount in SOL</span>
          <input
            type="number"
            min="0.000001"
            step="0.001"
            inputMode="decimal"
            value={amountSol}
            onChange={(event) => {
              setAmountSol(event.target.value);
              setState((current) => ({ ...current, error: null }));
            }}
            className="min-h-8 w-full rounded-full border border-slate-200 bg-white px-2.5 font-mono text-[11.5px] text-slate-700 outline-none transition-colors focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
            placeholder="SOL"
          />
        </label>
      </div>
      <button
        type="button"
        onClick={buy}
        disabled={disabled}
        className="min-h-9 w-full rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-700 transition-colors hover:border-pink-200 hover:text-pink-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {state.status === "submitting" ? "Buying..." : `Buy ${amountSol || "0"} SOL`}
      </button>
      {state.error && <div className="max-w-[160px] text-[10.5px] font-medium leading-snug text-rose-600">{state.error}</div>}
      {state.diagnostics && state.status === "error" && (
        <details className="max-w-[180px] text-[10.5px] text-slate-500">
          <summary className="cursor-pointer font-semibold">Details</summary>
          <pre className="mt-1 max-h-36 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-slate-950 p-2 font-mono text-[10px] text-slate-100">
            {JSON.stringify(state.diagnostics, null, 2)}
          </pre>
        </details>
      )}
      {state.status === "done" && <div className="text-[10.5px] font-semibold text-emerald-600">Buy recorded</div>}
    </div>
  );
}

export default function LaunchesPage() {
  const { registry, source, error } = useRegistry();
  const wallet = useWallet();
  const pageLaunches = registry.launches || [];
  const [filter, setFilter] = React.useState("all");
  const [showLaunchPanel, setShowLaunchPanel] = React.useState(false);
  const filters = getLaunchFilters(registry);
  const spotlightLaunches = getMigrationSpotlightLaunches(registry);
  const visible = pageLaunches.filter((l) => filter === "all" || l.status === filter);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Launches</h1>
          <div className="sub">Every token you've shipped through Toluva.</div>
        </div>
        <div className="actions">
          <button className="btn primary" type="button" onClick={() => setShowLaunchPanel(true)}>
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
            New launch
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[12.5px] text-slate-600">
        <div>
          Registry source:{" "}
          <span className={`font-semibold ${source === "api" ? "text-emerald-700" : "text-amber-700"}`}>
            {source === "api" ? "local API file registry" : "local API offline"}
          </span>
        </div>
        {error && <div className="font-medium text-amber-700">{error}</div>}
      </div>

      {showLaunchPanel && (
        <DevnetLaunchPanel
          wallet={wallet}
          onClose={() => setShowLaunchPanel(false)}
          onLaunched={() => setFilter("all")}
        />
      )}

      <MigrationSpotlight tokens={spotlightLaunches} />

      <div className="flex flex-wrap items-center gap-2">
        {filters.map((f) => (
          <FilterChip
            key={f.key}
            label={f.label}
            count={f.count}
            active={filter === f.key}
            onClick={() => setFilter(f.key)}
          />
        ))}
        <div className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[12px] text-slate-500">
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none">
            <path d="M3 6h18M6 12h12M10 18h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          Sort: Newest
        </div>
      </div>

      <div className="data-table">
        <div className="data-thead" style={{ gridTemplateColumns: COLS }}>
          <div>Token</div>
          <div>Status</div>
          <div>Bonding curve</div>
          <div>Campaign</div>
          <div>Buys</div>
          <div>Pool</div>
          <div>Action</div>
        </div>
        <div>
          {visible.map((l) => (
            <div key={l.sym} className="data-row" style={{ gridTemplateColumns: COLS }}>
              <div className="flex min-w-0 items-center gap-3">
                <TokenIcon symbol={l.sym} size={40} />
                <div className="min-w-0">
                  <div className="truncate text-[14px] font-semibold tracking-tight text-slate-900">
                    {l.name}
                  </div>
                  <div className="font-mono text-[11px] uppercase tracking-wider text-slate-400">
                    ${l.sym} · {l.age}
                  </div>
                </div>
              </div>
              <div>
                <span className={`status-pill ${statusMap[l.status].pill}`}>
                  {statusMap[l.status].label}
                </span>
              </div>
              <div>
                <ProgressBar value={l.bonded} status={l.status} />
              </div>
              <div>
                <CampaignChip label={l.campaign} />
              </div>
              <div className="font-mono text-[13px] font-semibold tabular-nums text-slate-700">
                {l.buyers > 0 ? l.buyers : <span className="text-slate-400">—</span>}
              </div>
              <div>
                <RaydiumPoolCell launch={l} />
              </div>
              <div>
                <BuyButton launch={l} wallet={wallet} onBought={() => setFilter("all")} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {visible.length === 0 && (
        <div className="card" style={{ textAlign: "center", padding: 60, color: "var(--ink-dim)" }}>
          No launches match this filter yet.
        </div>
      )}
    </div>
  );
}
