import React from "react";
import Link from "../Link";
import { TokenIcon } from "../tokenIcons";
import { refreshRegistry, useRegistry } from "../../../lib/launchRegistry";

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

export default function ConvictionPage() {
  const { registry, loading } = useRegistry();
  const [refreshing, setRefreshing] = React.useState(false);
  const launches = (registry.launches || []).filter((l) => l.dbc?.pool);

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
          <h1>Conviction Retention</h1>
          <div className="sub">Verified buys and two balance checks after graduation. This devnet trial has no payout.</div>
        </div>
        <div className="actions">
          <button className="btn ghost" type="button" onClick={handleRefresh} disabled={refreshing || loading}>
            {refreshing || loading ? "Refreshing..." : "↻ Refresh"}
          </button>
        </div>
      </div>

      <div className="grid">
        <div className="c-stat-1">
          <StatCard title="Tracked Launches" value={launches.length} foot="Meteora DBC tokens" dark />
        </div>
        <div className="c-stat-2">
          <StatCard title="Check Interval" value="24h" foot="Minimum elapsed time between checks" />
        </div>
        <div className="c-stat-3">
          <StatCard title="Checkpoints" value="2" foot="Finalized Solana slot balance reads" />
        </div>
        <div className="c-stat-4">
          <StatCard title="Policy Engine" value="v2" foot="conviction-checkpoints-v2" />
        </div>
      </div>

      <div className="card" style={{ padding: 24 }}>
        <h3 style={{ margin: "0 0 16px", fontSize: 18, fontWeight: 700 }}>Conviction Token Programs</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {launches.map((launch) => {
            const isGrad = launch.dbc.liveStatus?.dammV2?.verified === true;
            const symbol = launch.dbc.symbol;

            return (
              <div
                key={launch.sym}
                className="conviction-program-row"
                style={{
                  display: "grid",
                  alignItems: "center",
                  gap: 16,
                  padding: "16px 18px",
                  borderRadius: 14,
                  background: "var(--card-muted)",
                  border: "1px solid var(--line)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                  <TokenIcon symbol={symbol} size={40} imageUrl={launch.image} rounded={10} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>{launch.name}</div>
                    <div style={{ fontSize: 12, color: "var(--muted)", fontFamily: "'Geist Mono', monospace" }}>
                      ${symbol}
                    </div>
                  </div>
                </div>

                <div>
                  <span
                    className={`status-pill ${isGrad ? "completed" : "progress"}`}
                    style={{ fontSize: 11, fontWeight: 600 }}
                  >
                    {isGrad ? "Graduated · Proof Available" : "Bonding · Buys Tracked"}
                  </span>
                </div>

                <div style={{ fontSize: 12 }}>
                  <div style={{ color: "var(--muted)", fontSize: 11 }}>Qualifying Criteria</div>
                  <div style={{ fontWeight: 600, color: "var(--ink)" }}>
                    Min 0.01 SOL Buy · 2 Checks
                  </div>
                </div>

                <div>
                  <Link
                    href={`/launches/${launch.sym}#conviction`}
                    className="btn primary"
                    style={{ fontSize: 12, padding: "7px 16px" }}
                  >
                    View Leaderboard →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card" style={{ padding: 24 }}>
        <h3 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 700 }}>How Conviction Holding Verification Works</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16, marginTop: 14 }}>
          <div style={{ padding: 16, borderRadius: 12, background: "var(--card-muted)", border: "1px solid var(--line)" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--green)" }}>1 · QUALIFYING BUY</div>
            <div style={{ fontSize: 13.5, fontWeight: 700, margin: "6px 0 4px" }}>Verified DBC Swaps</div>
            <div style={{ fontSize: 12, color: "var(--ink-dim)", lineHeight: 1.5 }}>
              A participant executes a wallet-signed buy of at least 0.01 SOL on the Meteora DBC curve before graduation.
            </div>
          </div>
          <div style={{ padding: 16, borderRadius: 12, background: "var(--card-muted)", border: "1px solid var(--line)" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--green)" }}>2 · DAMM V2 GRADUATION</div>
            <div style={{ fontSize: 13.5, fontWeight: 700, margin: "6px 0 4px" }}>Milestone Trigger</div>
            <div style={{ fontSize: 12, color: "var(--ink-dim)", lineHeight: 1.5 }}>
              After migration, Toluva can save a finalized balance reading for a wallet with a qualifying buy.
            </div>
          </div>
          <div style={{ padding: 16, borderRadius: 12, background: "var(--card-muted)", border: "1px solid var(--line)" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--green)" }}>3 · 24H FOLLOW-UP CHECK</div>
            <div style={{ fontSize: 13.5, fontWeight: 700, margin: "6px 0 4px" }}>Second Balance Snapshot</div>
            <div style={{ fontSize: 12, color: "var(--ink-dim)", lineHeight: 1.5 }}>
              After at least 24 hours, Toluva saves a second finalized balance reading. The two readings are shown with their Solana slots; they do not prove uninterrupted holding.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
