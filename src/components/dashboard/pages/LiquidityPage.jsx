import React from "react";
import Link from "../Link";
import { TokenIcon } from "../tokenIcons";
import { refreshRegistry, useRegistry } from "../../../lib/launchRegistry";

function shortAddress(value) {
  const text = String(value || "");
  return text.length > 12 ? `${text.slice(0, 5)}...${text.slice(-4)}` : text || "—";
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

export default function LiquidityPage() {
  const { registry, loading } = useRegistry();
  const [refreshing, setRefreshing] = React.useState(false);
  const launches = registry.launches || [];
  const meteoraLaunches = launches.filter((l) => l.dbc?.pool);
  const graduatedLaunches = meteoraLaunches.filter((l) => l.dbc?.liveStatus?.dammV2?.verified === true);
  const dlmmPools = meteoraLaunches.filter((l) => l.dbc?.dlmm?.pool);
  const lockValues = meteoraLaunches.map((l) => l.dbc?.onchainConfig?.creatorPermanentLockedLiquidityPercentage);
  const lockDisplay = lockValues.length > 0 && lockValues.every((value) => Number.isFinite(value))
    ? new Set(lockValues).size === 1 ? `${lockValues[0]}%` : "Varies"
    : "—";

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
          <h1>Liquidity Pools</h1>
          <div className="sub">Meteora DAMM v2 pools and concentrated DLMM markets from Toluva launches.</div>
        </div>
        <div className="actions">
          <button className="btn ghost" type="button" onClick={handleRefresh} disabled={refreshing || loading}>
            {refreshing || loading ? "Refreshing..." : "↻ Refresh"}
          </button>
        </div>
      </div>

      <div className="grid">
        <div className="c-stat-1">
          <StatCard title="DAMM v2 Pools" value={graduatedLaunches.length} foot="Completed migrations" dark />
        </div>
        <div className="c-stat-2">
          <StatCard title="DLMM Markets" value={dlmmPools.length} foot="Concentrated 21-bin spot pools" />
        </div>
        <div className="c-stat-3">
          <StatCard title="Creator LP Lock" value={lockDisplay} foot="From on-chain launch configs" />
        </div>
        <div className="c-stat-4">
          <StatCard title="Network" value="devnet" foot="Solana Meteora programs" />
        </div>
      </div>

      <div className="card" style={{ padding: 24 }}>
        <h3 style={{ margin: "0 0 16px", fontSize: 18, fontWeight: 700 }}>Meteora Launch Pools</h3>

        {meteoraLaunches.length === 0 ? (
          <div style={{ textAlign: "center", padding: 48, color: "var(--muted)" }}>
            No Meteora launches recorded yet.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {meteoraLaunches.map((launch) => {
              const chain = launch.dbc.liveStatus;
              const damm = chain?.dammV2;
              const dlmm = launch.dbc.dlmm;
              const isGrad = damm?.verified === true && Boolean(damm.pool);
              const progress = Number(chain?.progressPercent) || 0;
              const feeBps = isGrad ? launch.dbc.onchainConfig?.migratedPoolFeeBps : launch.dbc.onchainConfig?.curveFeeBps;

              return (
                <div
                  key={launch.sym}
                  className="liquidity-pool-row"
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
                    <TokenIcon symbol={launch.dbc.symbol} size={40} imageUrl={launch.image} rounded={10} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>{launch.name}</div>
                      <div style={{ fontSize: 12, color: "var(--muted)", fontFamily: "'Geist Mono', monospace" }}>
                        ${launch.dbc.symbol}
                      </div>
                    </div>
                  </div>

                  <div>
                    <span
                      className={`status-pill ${isGrad ? "completed" : "progress"}`}
                      style={{ fontSize: 11, fontWeight: 600 }}
                    >
                      {isGrad ? "DAMM v2 Graduated" : `Bonding ${progress.toFixed(1)}%`}
                    </span>
                  </div>

                  <div style={{ fontSize: 12 }}>
                    <div style={{ color: "var(--muted)", fontSize: 11 }}>
                      {isGrad ? "DAMM v2 Pool" : "DBC Pool"}
                    </div>
                    <a
                      href={`https://explorer.solana.com/address/${isGrad ? damm?.pool : launch.dbc.pool}?cluster=devnet`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ fontFamily: "'Geist Mono', monospace", color: "var(--green)", fontWeight: 600 }}
                    >
                      {shortAddress(isGrad ? damm?.pool : launch.dbc.pool)} ↗
                    </a>
                  </div>

                  <div style={{ fontSize: 12 }}>
                    <div style={{ color: "var(--muted)", fontSize: 11 }}>{isGrad ? "DAMM v2 Fee" : "DBC Swap Fee"}</div>
                    <div style={{ fontWeight: 600, color: "var(--ink)" }}>
                      {Number.isFinite(feeBps) ? `${feeBps / 100}%` : "—"}
                    </div>
                  </div>

                  <div>
                    <Link
                      href={`/launches/${launch.sym}#${isGrad ? "liquidity" : "overview"}`}
                      className="btn primary"
                      style={{ fontSize: 12, padding: "7px 16px" }}
                    >
                      {isGrad ? "Manage Liquidity →" : "View Curve →"}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="card" style={{ padding: 24 }}>
        <h3 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 700 }}>The Meteora Liquidity Lifecycle</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 18, marginTop: 14 }}>
          <div style={{ padding: 16, borderRadius: 12, background: "var(--card-muted)", border: "1px solid var(--line)" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--green)" }}>STAGE 1</div>
            <div style={{ fontSize: 14, fontWeight: 700, margin: "6px 0 4px" }}>Dynamic Bonding Curve</div>
            <div style={{ fontSize: 12.5, color: "var(--ink-dim)", lineHeight: 1.5 }}>
              Participants trade SOL on the DBC curve. 100% of quote threshold (e.g. 1 SOL) is accumulated before graduation.
            </div>
          </div>
          <div style={{ padding: 16, borderRadius: 12, background: "var(--card-muted)", border: "1px solid var(--line)" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--green)" }}>STAGE 2</div>
            <div style={{ fontSize: 14, fontWeight: 700, margin: "6px 0 4px" }}>DAMM v2 Migration</div>
            <div style={{ fontSize: 12.5, color: "var(--ink-dim)", lineHeight: 1.5 }}>
              The curve closes at its target. Migration to DAMM v2 can happen automatically or be submitted by a connected wallet. The configured share of creator liquidity is permanently locked.
            </div>
          </div>
          <div style={{ padding: 16, borderRadius: 12, background: "var(--card-muted)", border: "1px solid var(--line)" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--green)" }}>STAGE 3</div>
            <div style={{ fontSize: 14, fontWeight: 700, margin: "6px 0 4px" }}>Concentrated DLMM Market</div>
            <div style={{ fontSize: 12.5, color: "var(--ink-dim)", lineHeight: 1.5 }}>
              Creators can link a 21-bin spot DLMM pool. Participants can add token and SOL; their positions may earn trading fees.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
