import React from "react";
import Link, { navigate } from "../Link";
import { TokenIcon } from "../tokenIcons";
import useWallet from "../useWallet";
import { refreshRegistry, useRegistry } from "../../../lib/launchRegistry";
import { getJson, postJson } from "../../../lib/toluvaApi";

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

const CAMPAIGN_TEMPLATES = [
  {
    id: "early-buyer",
    name: "Early Buyer Leaderboard",
    description: "Top buyers ranked by volume split a fixed SOL pool. Powered by first_buy_completed events.",
    accent: "#ec4899",
    accentBg: "#fce7f3",
    info: "Torque Early Buyer Leaderboard",
    pool: "0.01",
  },
  {
    id: "referral-raffle",
    name: "Referral Raffle",
    description: "Wallets that refer buyers earn raffle tickets. Torque draws and pays winners automatically.",
    accent: "#7c3aed",
    accentBg: "#ede9fe",
    info: "Torque Referral Raffle",
    pool: "0.01",
  },
  {
    id: "migration-sprint",
    name: "Migration Sprint",
    description: "Reward wallets that push the bonding curve toward 100% before the deadline.",
    accent: "#4f46e5",
    accentBg: "#e0e7ff",
    info: "Torque Migration Sprint",
    pool: "0.01",
  },
];

function AttachCampaignModal({ launch, onClose, onAttached }) {
  const [selected, setSelected] = React.useState(null);
  const [state, setState] = React.useState({ status: "idle", error: null });

  async function handleAttach() {
    if (!selected) return;
    setState({ status: "submitting", error: null });
    try {
      const template = CAMPAIGN_TEMPLATES.find((t) => t.id === selected);
      await postJson("/api/campaigns", {
        type: selected,
        launch: launch.sym,
        status: "live",
        pool: template.pool,
        info: template.info,
        accent: selected === "early-buyer" ? "pink" : selected === "referral-raffle" ? "violet" : "indigo",
        torque: { recurringOfferId: null, eventSource: "first_buy_completed" },
      });
      setState({ status: "done", error: null });
      onAttached?.();
      setTimeout(onClose, 800);
    } catch (err) {
      setState({ status: "idle", error: err.message || "Failed to attach campaign." });
    }
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)",
    }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: "#fff", borderRadius: 20, padding: 28, width: "100%", maxWidth: 540,
        boxShadow: "0 24px 64px rgba(15,23,42,0.18)", display: "flex", flexDirection: "column", gap: 20,
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#ec4899", marginBottom: 4 }}>
              Powered by Torque
            </div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, letterSpacing: "-0.025em", color: "var(--ink)" }}>
              Attach campaign to ${launch.sym}
            </h2>
          </div>
          <button type="button" onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: 20, lineHeight: 1 }}>✕</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {CAMPAIGN_TEMPLATES.map((template) => {
            const isSelected = selected === template.id;
            return (
              <button
                key={template.id}
                type="button"
                onClick={() => setSelected(template.id)}
                style={{
                  display: "flex", alignItems: "flex-start", gap: 14, padding: "14px 16px",
                  border: `1.5px solid ${isSelected ? template.accent + "66" : "var(--line)"}`,
                  borderRadius: 14, cursor: "pointer", textAlign: "left",
                  background: isSelected ? template.accentBg : "#fff",
                  transition: "all 120ms",
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: template.accentBg, display: "flex", alignItems: "center", justifyContent: "center",
                  border: `1px solid ${template.accent}33`,
                }}>
                  <span style={{ fontSize: 16 }}>{template.id === "early-buyer" ? "🏆" : template.id === "referral-raffle" ? "🎟️" : "🚀"}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)", marginBottom: 3 }}>{template.name}</div>
                  <div style={{ fontSize: 12, color: "var(--ink-dim)", lineHeight: 1.4 }}>{template.description}</div>
                </div>
                {isSelected && (
                  <div style={{ width: 18, height: 18, borderRadius: "50%", background: template.accent, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width={10} height={10} viewBox="0 0 24 24" fill="none"><path d="M20 6 9 17l-5-5" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {state.error && (
          <div style={{ background: "#fff1f2", border: "1px solid #fecdd3", color: "#9f1239", fontSize: 12, padding: "10px 14px", borderRadius: 10 }}>
            {state.error}
          </div>
        )}

        <div style={{ display: "flex", gap: 10 }}>
          <button type="button" onClick={onClose} className="btn ghost" style={{ flex: 1, justifyContent: "center" }}>
            Cancel
          </button>
          <button
            type="button"
            className="btn primary"
            onClick={handleAttach}
            disabled={!selected || state.status === "submitting" || state.status === "done"}
            style={{ flex: 2, justifyContent: "center" }}
          >
            {state.status === "submitting" ? "Attaching…" : state.status === "done" ? "Attached ✓" : "Attach campaign"}
          </button>
        </div>
      </div>
    </div>
  );
}

function CampaignCard({ launch, onAttached }) {
  const [showModal, setShowModal] = React.useState(false);

  return (
    <>
      <div className="card" style={{ padding: 22, display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, letterSpacing: "-0.02em" }}>Torque campaign</h3>
          {!launch.campaign && (
            <button
              type="button"
              onClick={() => setShowModal(true)}
              style={{
                fontSize: 12, fontWeight: 600, color: "var(--green)", cursor: "pointer",
                padding: "5px 11px", borderRadius: 999, background: "var(--green-pale)",
                border: "1px solid var(--green-light)", fontFamily: "inherit",
              }}
            >
              + Attach campaign
            </button>
          )}
        </div>

        {launch.campaign ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "var(--green-pale)", color: "var(--green)", padding: "7px 13px",
              borderRadius: 999, fontSize: 12, fontWeight: 600, border: "1px solid var(--green-light)",
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--green)" }} />
              {launch.campaign}
            </div>
            <Link href="/incentives" style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-dim)", textDecoration: "none" }}>
              View leaderboard →
            </Link>
          </div>
        ) : (
          <div style={{ fontSize: 13, color: "var(--ink-dim)", lineHeight: 1.5 }}>
            No incentive attached yet. Attach an early-buyer leaderboard, referral raffle, or migration sprint to drive activity into this launch.
          </div>
        )}
      </div>

      {showModal && (
        <AttachCampaignModal
          launch={launch}
          onClose={() => setShowModal(false)}
          onAttached={onAttached}
        />
      )}
    </>
  );
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

function MeteoraTradeCard({ launch }) {
  const wallet = useWallet();
  const [direction, setDirection] = React.useState("buy");
  const [amount, setAmount] = React.useState("");
  const [slippageBps, setSlippageBps] = React.useState(100);
  const [quote, setQuote] = React.useState(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [signature, setSignature] = React.useState(null);
  const canTrade = launch.dbc.liveStatus?.migrationProgress === 0;

  React.useEffect(() => { setQuote(null); }, [direction, amount, slippageBps, launch.dbc.pool]);

  async function review() {
    setBusy(true); setError(null);
    try {
      const params = new URLSearchParams({ pool: launch.dbc.pool, direction, amount, slippageBps: String(slippageBps) });
      const result = await getJson(`/api/meteora/swap/quote?${params}`);
      setQuote(result.quote);
    } catch (cause) {
      setError(cause.message || "Unable to quote this trade.");
    } finally { setBusy(false); }
  }

  async function trade() {
    if (!quote) return;
    setBusy(true); setError(null);
    try {
      const { tradeMeteoraToken } = await import("../../../lib/meteoraDbc");
      const result = await tradeMeteoraToken({ wallet, reviewedQuote: quote });
      setSignature(result.signature);
      setQuote(null);
      setAmount("");
      await refreshRegistry({ force: true });
    } catch (cause) {
      setError(cause.message || "Trade failed.");
    } finally { setBusy(false); }
  }

  return (
    <div className="card" style={{ padding: 24, display: "grid", gap: 14 }}>
      <div>
        <h3 style={{ margin: 0 }}>Trade on Meteora DBC</h3>
        <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>Devnet · exact input · wallet-signed</div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        {["buy", "sell"].map((mode) => <button key={mode} type="button" className={`btn ${direction === mode ? "primary" : "ghost"}`} onClick={() => setDirection(mode)}>{mode === "buy" ? `Buy ${launch.dbc.symbol}` : `Sell ${launch.dbc.symbol}`}</button>)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 150px", gap: 12 }}>
        <label style={{ display: "grid", gap: 6, fontSize: 12, fontWeight: 600 }}>Amount ({direction === "buy" ? "SOL" : launch.dbc.symbol})
          <input type="text" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder={direction === "buy" ? "0.01" : "100"} style={{ width: "100%", border: "1px solid var(--line)", borderRadius: 10, padding: "10px 12px" }} />
        </label>
        <label style={{ display: "grid", gap: 6, fontSize: 12, fontWeight: 600 }}>Slippage
          <select value={slippageBps} onChange={(event) => setSlippageBps(Number(event.target.value))} style={{ border: "1px solid var(--line)", borderRadius: 10, padding: "10px 12px" }}>
            <option value={50}>0.5%</option><option value={100}>1%</option><option value={200}>2%</option><option value={500}>5%</option>
          </select>
        </label>
      </div>
      {!canTrade && <div style={{ fontSize: 12, color: "var(--muted)" }}>{launch.dbc.liveStatus ? "The DBC curve has finished; trading here is closed." : "Waiting for live pool state before trading."}</div>}
      {quote && <div style={{ background: "var(--card-muted)", borderRadius: 12, padding: 14, fontSize: 12, lineHeight: 1.7 }}>
        <div>Estimated received: <strong>{quote.outputAmountDisplay} {direction === "buy" ? launch.dbc.symbol : "SOL"}</strong></div>
        <div>Minimum received: <strong>{quote.minimumAmountOutDisplay} {direction === "buy" ? launch.dbc.symbol : "SOL"}</strong></div>
        <div style={{ color: "var(--muted)" }}>The transaction will fail if the minimum cannot be met. Network and token account costs may also apply.</div>
      </div>}
      {error && <div style={{ color: "#9f1239", fontSize: 12 }}>{error}</div>}
      {wallet.error && <div style={{ color: "#9f1239", fontSize: 12 }}>{wallet.error}</div>}
      {signature && <a href={`https://explorer.solana.com/tx/${signature}?cluster=devnet`} target="_blank" rel="noreferrer" style={{ color: "var(--green)", fontSize: 12 }}>Confirmed trade {shortAddress(signature)} ↗</a>}
      <div style={{ display: "flex", gap: 10 }}>
        <button type="button" className="btn ghost" disabled={busy || !canTrade || !amount} onClick={review}>{busy && !quote ? "Quoting…" : "Review quote"}</button>
        {quote && <button type="button" className="btn primary" disabled={busy || !wallet.connected || !canTrade} onClick={trade}>{busy ? "Signing…" : "Sign trade"}</button>}
        {!wallet.connected && <button type="button" className="btn ghost" onClick={wallet.connect}>Connect wallet</button>}
      </div>
    </div>
  );
}

function MeteoraTokenDetailPage({ launch }) {
  const dbc = launch.dbc;
  const chain = dbc.liveStatus;
  const terms = dbc.onchainConfig || {};
  const progress = chain?.progressPercent;
  const targetSol = terms.migrationQuoteThreshold ? Number(terms.migrationQuoteThreshold) / LAMPORTS_PER_SOL : null;
  const status = chain
    ? chain.migrationProgress === 3 ? "Migrated to DAMM v2" : progress >= 100 ? "Curve complete · migration pending" : "Trading on DBC"
    : "Waiting for chain status";
  const explorer = (kind, value) => `https://explorer.solana.com/${kind}/${value}?cluster=${encodeURIComponent(dbc.cluster || "devnet")}`;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <Link href="/launches" style={{ fontSize: 12, color: "var(--muted)" }}>← All launches</Link>
          <h1 style={{ marginTop: 10 }}>{launch.name}</h1>
          <div className="sub">${dbc.symbol} · Meteora DBC · {dbc.cluster}</div>
        </div>
        <div className="actions"><span className={`status-pill ${chain?.migrationProgress === 3 ? "completed" : "progress"}`}>{status}</span></div>
      </div>

      {dbc.liveError && <div className="card" style={{ padding: 14, color: "#9f1239" }}>Live pool state is unavailable: {dbc.liveError}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 18 }}>
        <div className="card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <TokenIcon symbol={dbc.symbol} size={72} imageUrl={launch.image} rounded={16} />
            <div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{launch.name}</div>
              <div style={{ fontSize: 13, color: "var(--ink-dim)" }}>{launch.description || "Public Meteora DBC launch"}</div>
            </div>
          </div>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 8 }}>
              <strong>Graduation progress</strong><span>{Number.isFinite(progress) ? `${progress.toFixed(2)}%` : "—"}</span>
            </div>
            <div style={{ height: 10, background: "var(--card-muted)", borderRadius: 999, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${Math.max(0, Math.min(100, progress || 0))}%`, background: "linear-gradient(90deg,#fb7185,#ec4899)" }} />
            </div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 8 }}>Target: {targetSol === null ? "—" : `${targetSol} SOL`} · Destination: DAMM v2</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
            <StatTile label="DBC fee" value={terms.curveFeeBps === undefined ? "—" : `${terms.curveFeeBps / 100}%`} />
            <StatTile label="DAMM v2 fee" value={terms.migratedPoolFeeBps === undefined ? "—" : `${terms.migratedPoolFeeBps / 100}%`} />
            <StatTile label="Permanent lock" value={`${terms.creatorPermanentLockedLiquidityPercentage ?? 0}%`} sub="Creator liquidity" />
            <StatTile label="Creator liquidity" value={`${terms.creatorLiquidityPercentage ?? 0}%`} sub="Unlocked at migration" />
          </div>
        </div>
        <div className="card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
          <h3 style={{ margin: 0 }}>On-chain launch record</h3>
          {[
            ["Token mint", dbc.mint, "address"],
            ["DBC pool", dbc.pool, "address"],
            ["Config", dbc.config, "address"],
            ["Creator", launch.creator, "address"],
            ["Fee claimer", terms.feeClaimer, "address"],
            ["Leftover receiver", terms.leftoverReceiver, "address"],
            ["Launch transaction", dbc.signature, "tx"],
          ].map(([label, address, kind]) => address && (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 12 }}>
              <span style={{ color: "var(--muted)" }}>{label}</span>
              <a href={explorer(kind, address)} target="_blank" rel="noreferrer" style={{ fontFamily: "'Geist Mono', monospace", color: "var(--green)" }}>{shortAddress(address)} ↗</a>
            </div>
          ))}
          {dbc.uri && <a href={dbc.uri} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: "var(--green)" }}>Token metadata ↗</a>}
          <div style={{ fontSize: 11, color: "var(--muted)", lineHeight: 1.5 }}>Progress and terms are read from the selected devnet pool and config. The launch transaction is independently inspectable.</div>
        </div>
        <MeteoraTradeCard launch={launch} />
      </div>
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

  if (launch.dbc) return <MeteoraTokenDetailPage launch={launch} />;

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
          <CampaignCard launch={launch} onAttached={() => refreshRegistry({ force: true })} />

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
