import React from "react";
import { TokenIcon } from "../tokenIcons";
import { useRegistry } from "../../../lib/launchRegistry";
import { graduated, sevenDayTradeVolume, verifiedDbcTrades } from "../../../lib/dashboardMetrics";

function formatSol(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n) || n === 0) return "0 SOL";
  if (n < 0.001) return `${n.toFixed(6)} SOL`;
  if (n < 1) return `${n.toFixed(4).replace(/0+$/, "").replace(/\.$/, "")} SOL`;
  return `${n.toLocaleString(undefined, { maximumFractionDigits: 2 })} SOL`;
}

function sharedConfigValue(launches, field, format) {
  if (!launches.length) return "—";
  const values = launches.map((launch) => launch.dbc?.onchainConfig?.[field]);
  if (!values.every((value) => Number.isFinite(value))) return "See launch terms";
  return new Set(values).size === 1 ? format(values[0]) : "Varies by launch";
}

function StatTile({ label, value, unit, delta }) {
  return (
    <div className="flex flex-col gap-2 p-6" style={{ borderRight: "1px solid var(--line)" }}>
      <div className="text-[12px] font-medium text-slate-500">{label}</div>
      <div className="flex items-baseline gap-1.5">
        <span className="font-mono text-[26px] font-bold tabular-nums text-slate-900">{value}</span>
        {unit && <span className="text-[12px] font-medium text-slate-400">{unit}</span>}
      </div>
      {delta && <div className="text-[11.5px] font-semibold text-slate-500">{delta}</div>}
    </div>
  );
}

export default function AnalyticsPage() {
  const { registry } = useRegistry();
  const launches = registry.launches || [];
  const meteoraLaunches = launches.filter((l) => l.dbc?.pool);
  const graduatedLaunches = meteoraLaunches.filter((l) => l.dbc?.liveStatus?.dammV2?.verified === true);
  const linkedDlmmCount = meteoraLaunches.filter((l) => l.dbc?.dlmm?.pool).length;
  const trades = verifiedDbcTrades(registry);
  const { days: sevenDayWindow, totalSol: sevenDaySol, tradeCount: sevenDayCount } = sevenDayTradeVolume(trades);
  const maxVolume = Math.max(...sevenDayWindow.map((point) => point.value), 0);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Analytics</h1>
          <div className="sub">Toluva launches and finalized DBC swaps submitted for verification.</div>
        </div>
      </div>

      <div className="card" style={{ position: "relative", overflow: "hidden", padding: 0 }}>
        <div className="relative z-10 grid gap-0 md:grid-cols-2 lg:grid-cols-4">
          <StatTile label="DBC Launches" value={meteoraLaunches.length} unit="pools" delta="Confirmed on Solana" />
          <StatTile label="Graduated Pools" value={graduatedLaunches.length} unit="DAMM v2" delta={`${meteoraLaunches.length > 0 ? Math.round((graduatedLaunches.length / meteoraLaunches.length) * 100) : 0}% graduation rate`} />
          <StatTile label="7-Day Volume" value={formatSol(sevenDaySol).replace(" SOL", "")} unit="SOL" delta={`${sevenDayCount} verified trades`} />
          <StatTile label="Verified Swaps" value={trades.length} unit="receipts" delta="Finalized on devnet" />
        </div>
      </div>

      <div className="card" style={{ position: "relative", overflow: "hidden" }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 24 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em" }}>
              7-Day Verified DBC Trading Volume
            </h3>
            <div className="mt-1 text-[12.5px] text-slate-500">
              Aggregated across all verified buy and sell swaps submitted to Toluva.
            </div>
          </div>
        </div>

        {sevenDayWindow.some((p) => p.value > 0) ? (
          <div style={{ position: "relative", height: 260 }}>
            <div className="flex h-full items-end gap-4">
              {sevenDayWindow.map((point) => {
                const heightPct = maxVolume > 0 ? Math.max(8, Math.round((point.value / maxVolume) * 100)) : 8;
                return (
                  <div key={point.date} className="flex h-full flex-1 flex-col justify-end gap-2">
                    <div style={{ textAlign: "center", fontSize: 11, fontFamily: "'Geist Mono', monospace", color: "var(--muted)" }}>
                      {point.value > 0 ? `${point.value.toFixed(3)}` : ""}
                    </div>
                    <div
                      className="rounded-t-xl"
                      style={{
                        minHeight: 8,
                        height: `${heightPct}%`,
                        background: point.value > 0 ? "linear-gradient(180deg, #ec4899, #635bff)" : "var(--card-muted)",
                        transition: "height 300ms ease",
                      }}
                    />
                    <div className="text-center font-mono text-[11px] text-slate-400">
                      {point.dayLabel}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: 48, color: "var(--muted)" }}>
            No verified swap volume recorded in the last 7 days.
          </div>
        )}
      </div>

      <div className="grid gap-[18px] md:grid-cols-2">
        <div className="card">
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, letterSpacing: "-0.02em" }}>
            Launches by Progress
          </h3>
          <div className="mt-5 space-y-4">
            {meteoraLaunches.map((launch) => {
              const chain = launch.dbc.liveStatus;
              const progress = Number(chain?.progressPercent ?? (graduated(launch) ? 100 : 0)) || 0;
              return (
                <div key={launch.sym} className="flex items-center gap-3">
                  <TokenIcon symbol={launch.dbc.symbol} size={28} imageUrl={launch.image} rounded={8} />
                  <span className="font-mono text-[12px] font-semibold text-slate-700" style={{ width: 80 }}>
                    ${launch.dbc.symbol}
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(100, progress)}%`,
                        background: "linear-gradient(90deg, #635bff, #ec4899)",
                      }}
                    />
                  </div>
                  <span className="font-mono text-[11.5px] font-semibold text-slate-600" style={{ minWidth: 60, textAlign: "right" }}>
                    {progress.toFixed(1)}%
                  </span>
                </div>
              );
            })}
            {meteoraLaunches.length === 0 && (
              <div className="text-[13px] text-slate-500">No launches recorded yet.</div>
            )}
          </div>
        </div>

        <div className="card">
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, letterSpacing: "-0.02em" }}>
            Protocol Fee & Liquidity Architecture
          </h3>
          <div className="mt-4 space-y-3" style={{ fontSize: 13 }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--line)" }}>
              <span style={{ color: "var(--muted)" }}>Bonding Curve Program</span>
              <span style={{ fontWeight: 600 }}>Meteora DBC</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--line)" }}>
              <span style={{ color: "var(--muted)" }}>DBC Trading Fee</span>
              <span style={{ fontWeight: 600 }}>{sharedConfigValue(meteoraLaunches, "curveFeeBps", (value) => `${(value / 100).toFixed(2)}% (${value} bps)`)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--line)" }}>
              <span style={{ color: "var(--muted)" }}>DAMM v2 Pool Fee</span>
              <span style={{ fontWeight: 600 }}>{sharedConfigValue(meteoraLaunches, "migratedPoolFeeBps", (value) => `${(value / 100).toFixed(2)}% (${value} bps)`)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--line)" }}>
              <span style={{ color: "var(--muted)" }}>Permanent Liquidity Lock</span>
              <span style={{ fontWeight: 600, color: "var(--green)" }}>{sharedConfigValue(meteoraLaunches, "creatorPermanentLockedLiquidityPercentage", (value) => `${value}% of creator LP`)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0" }}>
              <span style={{ color: "var(--muted)" }}>Linked DLMM Markets</span>
              <span style={{ fontWeight: 600 }}>{linkedDlmmCount}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
