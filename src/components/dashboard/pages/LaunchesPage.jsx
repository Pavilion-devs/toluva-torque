import React from "react";
import { TokenIcon, TOKENS } from "../tokenIcons";
import { getLaunchFilters, getMigrationSpotlightLaunches, useRegistry } from "../../../lib/launchRegistry";

const statusMap = {
  bonding: { label: "Bonding", pill: "progress" },
  migrating: { label: "Migrating", pill: "progress" },
  migrated: { label: "Migrated", pill: "completed" },
  draft: { label: "Draft", pill: "pending" },
};

const COLS = "minmax(220px, 2.4fr) 0.9fr 1.4fr 1.3fr 0.7fr 0.8fr 36px";

const stateThemes = {
  migrating: { label: "Migrating now", bg: "#e0e7ff", text: "#3730a3", dot: "#6366f1" },
  sprinting: { label: "Active sprint", bg: "#ede9fe", text: "#5b21b6", dot: "#8b5cf6" },
  bonding: { label: "Bonding", bg: "#fce7f3", text: "#831843", dot: "#ec4899" },
};

function MigrationRing({ symbol, bonded, ringSize = 132, stroke = 9 }) {
  const meta = TOKENS[symbol];
  if (!meta) return null;
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
            <stop offset="0%" stopColor={meta.from} />
            <stop offset="100%" stopColor={meta.to} />
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
          background: meta.gradient,
          boxShadow: `0 8px 18px ${meta.glow}, inset 0 1px 0 rgba(255,255,255,0.3)`,
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
        style={{ background: `radial-gradient(circle at 50% 30%, ${meta.glow}, transparent 65%)` }}
      />
      <div className="relative">
        <MigrationRing symbol={symbol} bonded={bonded} />
      </div>
      <div className="mt-7 text-[15px] font-bold tracking-tight text-slate-900">{meta.name}</div>
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

export default function LaunchesPage() {
  const { registry } = useRegistry();
  const pageLaunches = registry.launches || [];
  const [filter, setFilter] = React.useState("all");
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
          <button className="btn primary" type="button">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
            New launch
          </button>
          <button className="btn ghost" type="button">
            Import from LaunchLab
          </button>
        </div>
      </div>

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
          <div>Buyers</div>
          <div>Pool</div>
          <div />
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
              <div className="font-mono text-[13px] font-semibold tabular-nums text-slate-700">
                {l.pool || <span className="text-slate-400">—</span>}
              </div>
              <div className="open-arrow">
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                  <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
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
