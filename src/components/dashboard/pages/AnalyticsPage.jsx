import React from "react";
import { TokenIcon } from "../tokenIcons";
import { getRegistryAnalytics, useRegistry } from "../../../lib/launchRegistry";

function EmptyState({ title, detail }) {
  return (
    <div style={{ textAlign: "center", padding: 56, color: "var(--ink-dim)" }}>
      <div style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)" }}>{title}</div>
      <div style={{ marginTop: 8, fontSize: 13 }}>{detail}</div>
    </div>
  );
}

export default function AnalyticsPage() {
  const { registry } = useRegistry();
  const analytics = getRegistryAnalytics(registry);
  const maxVolume = Math.max(...analytics.volumeSeries.map((point) => point.value), 0);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Analytics</h1>
          <div className="sub">Derived from local API launch records and Torque event receipts only.</div>
        </div>
      </div>

      <div className="card" style={{ position: "relative", overflow: "hidden", padding: 0 }}>
        <div className="relative z-10 grid gap-0 lg:grid-cols-4">
          {analytics.stats.map((s) => (
            <div key={s.label} className="flex flex-col gap-2 p-6" style={{ borderRight: "1px solid var(--line)" }}>
              <div className="text-[12px] font-medium text-slate-500">{s.label}</div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-mono text-[26px] font-bold tabular-nums text-slate-900">{s.value}</span>
                <span className="text-[12px] font-medium text-slate-400">{s.unit}</span>
              </div>
              <div className="text-[11.5px] font-semibold text-slate-500">{s.delta}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ position: "relative", overflow: "hidden" }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 24 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em" }}>
              Buy volume from Torque events
            </h3>
            <div className="mt-1 text-[12.5px] text-slate-500">
              Uses `buy_completed` and `first_buy_completed` receipts recorded by the local API.
            </div>
          </div>
        </div>

        {analytics.volumeSeries.length > 0 ? (
          <div style={{ position: "relative", height: 280 }}>
            <div className="flex h-full items-end gap-3">
              {analytics.volumeSeries.map((point) => (
                <div key={point.date} className="flex h-full flex-1 flex-col justify-end gap-2">
                  <div
                    className="rounded-t-xl"
                    style={{
                      minHeight: 8,
                      height: `${Math.round((point.value / Math.max(maxVolume, 1)) * 100)}%`,
                      background: "linear-gradient(180deg,#ec4899,#fb7185)",
                    }}
                  />
                  <div className="text-center font-mono text-[11px] text-slate-400">{point.date.slice(5)}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <EmptyState title="No buy volume yet" detail="Run a real buy event through Torque to populate this chart." />
        )}
      </div>

      <div className="grid gap-[18px] md:grid-cols-2">
        <div className="card">
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, letterSpacing: "-0.02em" }}>
            Top launches
          </h3>
          <div className="mt-5 space-y-3">
            {analytics.topLaunches.map((row) => (
              <div key={row.sym} className="flex items-center gap-3">
                <TokenIcon symbol={row.sym} size={28} />
                <span className="font-mono text-[12px] font-semibold text-slate-700" style={{ width: 60 }}>
                  ${row.sym}
                </span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${row.pct}%`, background: "linear-gradient(90deg,#fb7185,#ec4899)" }}
                  />
                </div>
                <span className="font-mono text-[11px] text-slate-400" style={{ minWidth: 110, textAlign: "right" }}>
                  {row.metric}
                </span>
              </div>
            ))}
            {analytics.topLaunches.length === 0 && (
              <div className="text-[13px] text-slate-500">No launches recorded yet.</div>
            )}
          </div>
        </div>

        <div className="card">
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, letterSpacing: "-0.02em" }}>
            Campaign progress
          </h3>
          <div className="mt-4 space-y-4">
            {analytics.templateConversion.map((t) => (
              <div key={t.name}>
                <div className="mb-1 flex items-center justify-between text-[12.5px]">
                  <span className="text-slate-700">{t.name}</span>
                  <span className="font-mono font-semibold text-slate-900">{t.conv}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full" style={{ width: `${t.conv}%`, background: t.color }} />
                </div>
              </div>
            ))}
            {analytics.templateConversion.length === 0 && (
              <div className="text-[13px] text-slate-500">No campaign records yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
