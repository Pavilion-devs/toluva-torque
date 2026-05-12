import React from "react";
import useWallet from "../useWallet";
import { fetchClaimDetails, fetchLeaderboard, triggerClaim } from "../../../lib/toluvaApi";

function shortAddress(value) {
  const text = String(value || "");
  return text.length > 12 ? `${text.slice(0, 6)}...${text.slice(-5)}` : text;
}

function formatSol(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n === 0) return "0 SOL";
  return `${n.toLocaleString(undefined, { maximumFractionDigits: 5 })} SOL`;
}

function RankBadge({ rank }) {
  const colors = { 1: "#f59e0b", 2: "#94a3b8", 3: "#b45309" };
  const color = colors[rank] || "var(--ink-dim)";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      width: 28, height: 28, borderRadius: "50%", fontSize: 12, fontWeight: 700,
      background: rank <= 3 ? color + "22" : "var(--card-muted)",
      color: rank <= 3 ? color : "var(--ink-dim)",
      border: `1.5px solid ${rank <= 3 ? color + "44" : "var(--line)"}`,
      fontFamily: "'Geist Mono', monospace",
    }}>
      {rank}
    </span>
  );
}

function LeaderboardRow({ rank, wallet, metricValue, rewardAmount, isYou }) {
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "40px 1fr auto",
      gap: 16, alignItems: "center", padding: "12px 0",
      borderBottom: "1px solid var(--line)",
      ...(isYou ? { background: "linear-gradient(90deg, rgba(236,72,153,0.04), transparent)", borderRadius: 8 } : {}),
    }}>
      <RankBadge rank={rank} />
      <div>
        <div style={{ fontFamily: "'Geist Mono', monospace", fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>
          {shortAddress(wallet)}
          {isYou && (
            <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 700, color: "var(--green)",
              background: "var(--green-pale)", border: "1px solid var(--green-light)",
              padding: "2px 7px", borderRadius: 999 }}>
              You
            </span>
          )}
        </div>
        <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 2 }}>
          {Number(metricValue).toLocaleString()} lamports volume
        </div>
      </div>
      <div style={{ fontFamily: "'Geist Mono', monospace", fontSize: 13, fontWeight: 700, color: "var(--ink)", textAlign: "right" }}>
        {rewardAmount ? formatSol(rewardAmount) : "—"}
      </div>
    </div>
  );
}

function ClaimCard({ wallet, claimDetails, onClaim, claiming, claimResult }) {
  const eligible = claimDetails.find((offer) => offer.isEligible);
  const doneCrank = claimResult?.crank || eligible?.cranks?.find((c) => c.status === "DONE");
  const claimTx = doneCrank?.signature;
  const alreadyClaimed = Boolean(doneCrank);
  const claimed = claimResult?.status === "SUCCESS" || alreadyClaimed;

  if (!wallet.connected) {
    return (
      <div className="card" style={{ padding: 24 }}>
        <div style={{ fontSize: 13, color: "var(--ink-dim)" }}>Connect your wallet to check claim eligibility.</div>
      </div>
    );
  }

  if (!eligible) {
    return (
      <div className="card" style={{ padding: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>No active claim for {shortAddress(wallet.address)}</div>
        <div style={{ marginTop: 6, fontSize: 13, color: "var(--ink-dim)" }}>
          Buy tokens during an active epoch to earn leaderboard rewards.
        </div>
      </div>
    );
  }

  const amount = eligible.eligibleAmounts?.[0]?.amount;

  return (
    <div className="card" style={{ padding: 24, border: "1.5px solid var(--green-light)", background: "var(--green-pale)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--green)", marginBottom: 4 }}>
            Eligible to claim
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.03em", color: "var(--ink)", fontFamily: "'Geist Mono', monospace" }}>
            {formatSol(amount)}
          </div>
          <div style={{ fontSize: 12, color: "var(--ink-dim)", marginTop: 4 }}>{eligible.title}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
          {claimed ? (
            <span className="status-pill completed">Claimed</span>
          ) : (
            <button
              type="button"
              className="btn primary"
              onClick={() => onClaim(wallet.address)}
              disabled={claiming}
              style={{ minWidth: 120, justifyContent: "center" }}
            >
              {claiming ? "Claiming…" : "Claim reward"}
            </button>
          )}
          {claimTx && (
            <a
              href={`https://solscan.io/tx/${claimTx}`}
              target="_blank"
              rel="noreferrer"
              style={{ fontSize: 11.5, fontFamily: "'Geist Mono', monospace", color: "var(--green)", textDecoration: "none" }}
            >
              {shortAddress(claimTx)} ↗
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default function IncentivesPage() {
  const wallet = useWallet();
  const [leaderboard, setLeaderboard] = React.useState([]);
  const [claimDetails, setClaimDetails] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [claiming, setClaiming] = React.useState(false);
  const [claimResult, setClaimResult] = React.useState(null);
  const [claimError, setClaimError] = React.useState(null);

  React.useEffect(() => {
    setLoading(true);
    fetchLeaderboard().then(setLeaderboard).finally(() => setLoading(false));
  }, []);

  React.useEffect(() => {
    if (!wallet.address) return;
    fetchClaimDetails(wallet.address).then(setClaimDetails);
  }, [wallet.address]);

  async function handleClaim(address) {
    setClaiming(true);
    setClaimError(null);
    try {
      const result = await triggerClaim(address);
      if (result.status === "SUCCESS") {
        setClaimResult(result);
        fetchClaimDetails(address).then(setClaimDetails);
      } else {
        setClaimError("Claim did not succeed. Try again shortly.");
      }
    } catch (err) {
      setClaimError(err.message || "Claim failed.");
    } finally {
      setClaiming(false);
    }
  }

  const sortedRows = [...leaderboard]
    .sort((a, b) => Number(b.metricValue) - Number(a.metricValue))
    .map((row, i) => ({ ...row, rank: i + 1 }));

  const totalPool = claimDetails[0]?.totalRewards?.[0]?.amount || 0.01;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Incentives</h1>
          <div className="sub">Live leaderboard and rewards — powered by Torque MCP.</div>
        </div>
        <div className="actions">
          <a
            className="btn ghost"
            href="https://solscan.io/tx/4pKH581LXxHPt6uyTfkzAHaP12a8jBd3psQkkJC9Z4JjwXcvQteyM1KKu4E7isRxgMPfazxoCBPdGNzMshmYgwNX"
            target="_blank"
            rel="noreferrer"
            style={{ textDecoration: "none" }}
          >
            Claim tx ↗
          </a>
          <a
            className="btn primary"
            href="https://platform.torque.so/project/cmp03b5ml0274k01h12kf07dc/incentives/cmp03y0i2029sk01hm3br7vld"
            target="_blank"
            rel="noreferrer"
            style={{ textDecoration: "none" }}
          >
            View on Torque
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M7 17 17 7M8 7h9v9" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </div>
      </div>

      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#ec4899", marginBottom: 6 }}>
              Live · Torque leaderboard
            </div>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: "-0.025em", color: "var(--ink)" }}>
              Toluva Early Buyer Leaderboard
            </h2>
            <div style={{ marginTop: 4, fontSize: 13, color: "var(--ink-dim)" }}>
              Ranked by{" "}
              <code style={{ fontSize: 12, background: "var(--card-muted)", padding: "1px 5px", borderRadius: 4 }}>
                first_buy_completed
              </code>{" "}
              custom events · {formatSol(totalPool)} reward pool
            </div>
          </div>
          <span className="status-pill completed">epoch 1 · claiming</span>
        </div>

        {loading ? (
          <div style={{ padding: "32px 0", textAlign: "center", color: "var(--ink-dim)", fontSize: 13 }}>
            Loading leaderboard…
          </div>
        ) : sortedRows.length === 0 ? (
          <div style={{ padding: "32px 0", textAlign: "center", color: "var(--ink-dim)", fontSize: 13 }}>
            No leaderboard data yet. Buy a token during an active epoch to appear here.
          </div>
        ) : (
          <div>
            <div style={{
              display: "grid", gridTemplateColumns: "40px 1fr auto",
              gap: 16, padding: "0 0 8px",
              fontSize: 11, fontWeight: 600, letterSpacing: "0.1em",
              textTransform: "uppercase", color: "var(--muted)",
            }}>
              <div>Rank</div>
              <div>Wallet</div>
              <div style={{ textAlign: "right" }}>Reward</div>
            </div>
            {sortedRows.map((row) => (
              <LeaderboardRow
                key={row.walletAddress}
                rank={row.rank}
                wallet={row.walletAddress}
                metricValue={row.metricValue}
                rewardAmount={row.rank === 1 ? totalPool * 0.5 : row.rank <= 3 ? totalPool * 0.25 : 0}
                isYou={wallet.address && row.walletAddress === wallet.address}
              />
            ))}
          </div>
        )}
      </div>

      <ClaimCard
        wallet={wallet}
        claimDetails={claimDetails}
        onClaim={handleClaim}
        claiming={claiming}
        claimResult={claimResult}
      />

      {claimError && (
        <div style={{
          background: "#fff1f2", border: "1px solid #fecdd3", color: "#9f1239",
          fontSize: 13, padding: "12px 16px", borderRadius: 12,
        }}>
          {claimError}
        </div>
      )}
    </div>
  );
}
