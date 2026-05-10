import React from "react";
import Link from "../Link";
import { TokenIcon } from "../tokenIcons";
import useWallet from "../useWallet";
import { refreshRegistry, useRegistry } from "../../../lib/launchRegistry";

const BUY_PRESETS_SOL  = ["0.01", "0.05", "0.1", "0.5"];
const LAMPORTS_PER_SOL = 1_000_000_000;

const statusMap = {
  bonding:   { label: "Bonding",   pill: "progress"  },
  migrating: { label: "Migrating", pill: "progress"  },
  migrated:  { label: "Migrated",  pill: "completed" },
  draft:     { label: "Draft",     pill: "pending"   },
};

function shortAddress(value) {
  const text = String(value || "");
  return text.length > 12 ? `${text.slice(0, 5)}…${text.slice(-4)}` : text;
}

function solToLamports(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return String(Math.floor(n * LAMPORTS_PER_SOL));
}

function eventAmountSol(event) {
  const raw = Number(event?.payload?.amount ?? event?.torqueRequest?.data?.amount ?? 0);
  if (!Number.isFinite(raw)) return 0;
  return raw >= 1_000_000 ? raw / LAMPORTS_PER_SOL : raw;
}

function formatRelative(value, now) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const elapsed = Math.max(0, now.getTime() - date.getTime());
  const sec = Math.floor(elapsed / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

function poolProgress(launch) {
  const pool = launch?.raydium?.livePool;
  const realB = Number(pool?.realB) || 0;
  const totalB = Number(pool?.totalFundRaisingB) || 0;
  if (totalB > 0) return (realB / totalB) * 100;
  return Number(launch?.bonded) || 0;
}

function poolRaisedSol(launch) {
  return (Number(launch?.raydium?.livePool?.realB) || 0) / LAMPORTS_PER_SOL;
}

function poolTargetSol(launch) {
  return (Number(launch?.raydium?.livePool?.totalFundRaisingB) || 0) / LAMPORTS_PER_SOL;
}

function formatSol(amount) {
  if (!Number.isFinite(amount) || amount === 0) return "0 SOL";
  if (amount < 0.001) return `${amount.toFixed(6)} SOL`;
  if (amount < 1) return `${amount.toFixed(4).replace(/0+$/, "").replace(/\.$/, "")} SOL`;
  return `${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })} SOL`;
}

function BuyPanel({ launch, wallet, onBought }) {
  const [amountSol, setAmountSol] = React.useState(BUY_PRESETS_SOL[0]);
  const [state, setState] = React.useState({ status: "idle", error: null, signature: null });

  const canBuy = Boolean(launch.raydium?.mint && (launch.raydium?.poolId || launch.pool));
  const lamports = solToLamports(amountSol);
  const disabled = state.status === "submitting" || !wallet.connected || wallet.source !== "injected" || !lamports || !canBuy;

  async function handleBuy() {
    if (!lamports) {
      setState({ status: "error", error: "Enter a valid SOL amount.", signature: null });
      return;
    }
    setState({ status: "submitting", error: null, signature: null });
    try {
      const { buyDevnetToken } = await import("../../../lib/raydiumLaunchlab");
      const result = await buyDevnetToken({ wallet, launch, buyAmount: lamports });
      await refreshRegistry({ force: true });
      setState({ status: "done", error: null, signature: result?.signature || null });
      onBought?.();
    } catch (err) {
      setState({ status: "error", error: err instanceof Error ? err.message : "Buy failed.", signature: null });
    }
  }

  return (
    <div className="card" style={{ padding: 20, position: "sticky", top: 90, display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", gap: 6, padding: 4, background: "var(--card-muted)", borderRadius: 12 }}>
        <button type="button" style={{
          flex: 1, padding: "9px 10px", borderRadius: 9, border: 0, cursor: "pointer",
          background: "var(--green)", color: "#fff", fontWeight: 600, fontSize: 13,
          fontFamily: "'Geist', sans-serif",
          boxShadow: "0 4px 12px rgba(236,72,153,0.25)",
        }}>Buy</button>
        <button type="button" disabled style={{
          flex: 1, padding: "9px 10px", borderRadius: 9, border: 0, cursor: "not-allowed",
          background: "transparent", color: "var(--muted)", fontWeight: 600, fontSize: 13,
          fontFamily: "'Geist', sans-serif",
        }}>Sell</button>
      </div>

      <div>
        <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>
          Amount (SOL)
        </div>
        <input
          type="number"
          min="0.000001"
          step="0.001"
          inputMode="decimal"
          value={amountSol}
          onChange={(e) => { setAmountSol(e.target.value); setState((c) => ({ ...c, error: null })); }}
          placeholder="0.00"
          style={{
            width: "100%",
            padding: "14px 16px",
            border: "1px solid var(--line)",
            borderRadius: 12,
            fontFamily: "'Geist Mono', monospace",
            fontSize: 22,
            fontWeight: 600,
            color: "var(--ink)",
            outline: "none",
            background: "#fff",
            letterSpacing: "-0.02em",
          }}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
        {BUY_PRESETS_SOL.map((amount) => {
          const isActive = amountSol === amount;
          return (
            <button
              key={amount}
              type="button"
              onClick={() => { setAmountSol(amount); setState((c) => ({ ...c, error: null })); }}
              style={{
                padding: "8px 6px",
                borderRadius: 999,
                border: `1px solid ${isActive ? "var(--green-light)" : "var(--line)"}`,
                background: isActive ? "var(--green-pale)" : "#fff",
                color: isActive ? "var(--green)" : "var(--ink-dim)",
                fontFamily: "'Geist Mono', monospace",
                fontSize: 11.5,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 120ms",
              }}
            >
              {amount}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={handleBuy}
        disabled={disabled}
        className="btn primary"
        style={{
          width: "100%", justifyContent: "center", padding: "14px",
          ...(disabled ? { opacity: 0.55, cursor: "not-allowed" } : {}),
        }}
      >
        {!wallet.connected ? "Connect wallet" :
          wallet.source !== "injected" ? "Use injected wallet" :
            !canBuy ? "Pool not ready" :
              state.status === "submitting" ? "Buying…" :
                `Buy ${amountSol || "0"} SOL`}
      </button>

      {state.error && (
        <div style={{
          background: "#fff1f2", border: "1px solid #fecdd3", color: "#9f1239",
          fontSize: 12, padding: "10px 12px", borderRadius: 10, lineHeight: 1.4,
        }}>
          {state.error}
        </div>
      )}
      {state.status === "done" && (
        <div style={{
          background: "#ecfdf5", border: "1px solid #a7f3d0", color: "#065f46",
          fontSize: 12, padding: "10px 12px", borderRadius: 10, lineHeight: 1.4,
        }}>
          <div style={{ fontWeight: 600 }}>Buy recorded</div>
          {state.signature && (
            <div style={{ fontFamily: "'Geist Mono', monospace", fontSize: 11, marginTop: 3 }}>
              {shortAddress(state.signature)}
            </div>
          )}
        </div>
      )}

      <div style={{ borderTop: "1px solid var(--line)", paddingTop: 14, display: "flex", flexDirection: "column", gap: 8, fontSize: 11.5, color: "var(--ink-dim)" }}>
        <Row label="Mint" value={shortAddress(launch.raydium?.mint)} mono copyable={launch.raydium?.mint} />
        <Row label="Pool" value={shortAddress(launch.raydium?.poolId || launch.pool)} mono copyable={launch.raydium?.poolId || launch.pool} />
        {launch.creator && <Row label="Creator" value={shortAddress(launch.creator)} mono copyable={launch.creator} />}
      </div>
    </div>
  );
}

function Row({ label, value, mono, copyable }) {
  const [copied, setCopied] = React.useState(false);
  const handleCopy = () => {
    if (!copyable) return;
    navigator.clipboard?.writeText(copyable).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    });
  };
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
      <span>{label}</span>
      <button
        type="button"
        onClick={copyable ? handleCopy : undefined}
        style={{
          background: "transparent", border: 0, padding: 0,
          fontFamily: mono ? "'Geist Mono', monospace" : undefined,
          color: copied ? "var(--green)" : "var(--ink)",
          fontSize: 11.5, fontWeight: 500,
          cursor: copyable ? "pointer" : "default",
        }}
      >
        {copied ? "copied" : value || "—"}
      </button>
    </div>
  );
}

function ProgressArc({ percent }) {
  const pct = Math.max(0, Math.min(100, percent));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Bonding curve
        </span>
        <span style={{
          fontFamily: "'Geist Mono', monospace", fontSize: 22, fontWeight: 700,
          color: "var(--ink)", letterSpacing: "-0.025em", fontVariantNumeric: "tabular-nums",
        }}>
          {pct.toFixed(2)}%
        </span>
      </div>
      <div style={{ height: 10, borderRadius: 999, background: "var(--card-muted)", overflow: "hidden", position: "relative" }}>
        <div style={{
          height: "100%", width: `${Math.max(2, pct)}%`,
          background: "linear-gradient(90deg, #fb7185, #ec4899)",
          borderRadius: 999, transition: "width 360ms ease",
          boxShadow: "0 1px 4px rgba(236,72,153,0.3)",
        }} />
      </div>
    </div>
  );
}

function StatTile({ label, value, sub }) {
  return (
    <div style={{
      background: "var(--card-muted)", border: "1px solid var(--line)", borderRadius: 14,
      padding: "14px 16px", display: "flex", flexDirection: "column", gap: 4,
    }}>
      <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: "var(--ink)", letterSpacing: "-0.025em", lineHeight: 1.1, fontVariantNumeric: "tabular-nums" }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 11.5, color: "var(--ink-dim)" }}>{sub}</div>
      )}
    </div>
  );
}

export default function TokenDetailPage({ sym }) {
  const { registry } = useRegistry();
  const wallet = useWallet();
  const [now, setNow] = React.useState(() => new Date());

  React.useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(t);
  }, []);

  const launch = (registry.launches || []).find((l) => l.sym === sym);

  if (!launch) {
    return (
      <div className="page">
        <div className="page-head">
          <div>
            <h1>Token not found</h1>
            <div className="sub">No launch with symbol ${sym} in the local registry.</div>
          </div>
        </div>
        <div>
          <Link href="/launches" className="btn ghost">← Back to launches</Link>
        </div>
      </div>
    );
  }

  const events = (registry.eventReceipts || []).filter((ev) => String(ev.token || "").toUpperCase() === sym).slice(0, 12);
  const buyEvents = events.filter((ev) => ev.type === "buy_completed" || ev.type === "first_buy_completed");
  const totalBuyVolume = buyEvents.reduce((sum, ev) => sum + eventAmountSol(ev), 0);
  const progress = poolProgress(launch);
  const raisedSol = poolRaisedSol(launch);
  const targetSol = poolTargetSol(launch);
  const statusInfo = statusMap[launch.status] || { label: launch.status, pill: "pending" };

  return (
    <div className="page">
      <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 13 }}>
        <Link href="/launches" style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          color: "var(--ink-dim)", textDecoration: "none", fontWeight: 500,
          padding: "6px 12px", borderRadius: 999, border: "1px solid var(--line)", background: "#fff",
        }}>
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Launches
        </Link>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 340px", gap: 22, alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Hero */}
          <div className="card" style={{ padding: 22, display: "flex", gap: 20, alignItems: "flex-start" }}>
            <TokenIcon symbol={launch.sym} size={120} imageUrl={launch.image} rounded={20} />
            <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <h1 style={{ margin: 0, fontSize: 30, fontWeight: 700, letterSpacing: "-0.03em", color: "var(--ink)", lineHeight: 1.1 }}>
                  {launch.name}
                </h1>
                <span className={`status-pill ${statusInfo.pill}`}>{statusInfo.label}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "'Geist Mono', monospace", fontSize: 12.5, color: "var(--muted)" }}>
                <span style={{ fontWeight: 600, color: "var(--ink-dim)" }}>${launch.sym}</span>
                <span style={{ width: 3, height: 3, borderRadius: "50%", background: "var(--muted)" }} />
                <span>{launch.age}</span>
                {launch.creator && (
                  <>
                    <span style={{ width: 3, height: 3, borderRadius: "50%", background: "var(--muted)" }} />
                    <span>by {shortAddress(launch.creator)}</span>
                  </>
                )}
              </div>
              {launch.description && (
                <p style={{ margin: "6px 0 0", fontSize: 14, lineHeight: 1.5, color: "var(--ink-dim)" }}>
                  {launch.description}
                </p>
              )}
            </div>
          </div>

          {/* Bonding curve */}
          <div className="card" style={{ padding: 22 }}>
            <ProgressArc percent={progress} />
            {targetSol > 0 && (
              <div style={{ marginTop: 12, fontSize: 12.5, color: "var(--ink-dim)" }}>
                {formatSol(raisedSol)} raised of {formatSol(targetSol)} target — token graduates to Raydium AMM at 100%.
              </div>
            )}
          </div>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            <StatTile label="Buyers" value={launch.buyers || 0} sub={`${buyEvents.length} buy event${buyEvents.length === 1 ? "" : "s"}`} />
            <StatTile label="Buy volume" value={formatSol(totalBuyVolume)} sub="Recorded on devnet" />
            <StatTile
              label="Pool"
              value={launch.raydium?.liveStatus === "pool_read" ? "Live" : "Pending"}
              sub={launch.raydium?.poolId ? shortAddress(launch.raydium.poolId) : "—"}
            />
          </div>

          {/* Campaign */}
          <div className="card" style={{ padding: 22, display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, letterSpacing: "-0.02em" }}>Torque campaign</h3>
              {!launch.campaign && (
                <Link href="/incentives" style={{
                  fontSize: 12, fontWeight: 600, color: "var(--green)", textDecoration: "none",
                  padding: "5px 11px", borderRadius: 999, background: "var(--green-pale)", border: "1px solid var(--green-light)",
                }}>
                  + Attach campaign
                </Link>
              )}
            </div>
            {launch.campaign ? (
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 8, alignSelf: "flex-start",
                background: "var(--green-pale)", color: "var(--green)", padding: "7px 13px",
                borderRadius: 999, fontSize: 12, fontWeight: 600, border: "1px solid var(--green-light)",
              }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--green)" }} />
                {launch.campaign}
              </div>
            ) : (
              <div style={{ fontSize: 13, color: "var(--ink-dim)", lineHeight: 1.5 }}>
                No incentive attached yet. Attach an early-buyer leaderboard, referral raffle, or migration sprint to drive activity into this launch.
              </div>
            )}
          </div>

          {/* Recent activity */}
          <div className="card" style={{ padding: 22 }}>
            <h3 style={{ margin: "0 0 14px", fontSize: 16, fontWeight: 700, letterSpacing: "-0.02em" }}>Recent activity</h3>
            {events.length === 0 ? (
              <div style={{ fontSize: 13, color: "var(--ink-dim)" }}>No events recorded for this launch yet.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {events.map((ev) => {
                  const amount = ev.type === "buy_completed" || ev.type === "first_buy_completed" ? formatSol(eventAmountSol(ev)) : null;
                  const tx = ev.payload?.txSignature || ev.torqueRequest?.data?.tx_signature;
                  const accepted = ev.torqueReceipt?.status === "ACCEPTED" || ev.status === "emitted";
                  return (
                    <div key={ev.id || `${ev.type}-${ev.createdAt}`} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      gap: 14, padding: "10px 0", borderBottom: "1px solid var(--line)",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                          background: "linear-gradient(135deg, #635bff, #ec4899)",
                          display: "grid", placeItems: "center", color: "#fff",
                          fontFamily: "'Geist Mono', monospace", fontSize: 11, fontWeight: 700,
                        }}>
                          {(ev.type || "EV").slice(0, 2).toUpperCase()}
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>
                            {String(ev.type || "event").replaceAll("_", " ")}
                          </div>
                          <div style={{ fontSize: 11.5, color: "var(--muted)", display: "flex", gap: 8, alignItems: "center" }}>
                            {amount && <span>{amount}</span>}
                            {tx && <span style={{ fontFamily: "'Geist Mono', monospace" }}>{shortAddress(tx)}</span>}
                            <span>{formatRelative(ev.createdAt, now)}</span>
                          </div>
                        </div>
                      </div>
                      <span className={`status-pill ${accepted ? "completed" : "pending"}`}>
                        {accepted ? "accepted" : "pending"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: buy panel */}
        <div>
          <BuyPanel launch={launch} wallet={wallet} onBought={() => refreshRegistry({ force: true })} />
        </div>
      </div>
    </div>
  );
}
