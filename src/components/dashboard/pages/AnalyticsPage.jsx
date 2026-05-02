import React from "react";
import { TokenIcon } from "../tokenIcons";
import { useRegistry } from "../../../lib/launchRegistry";

export default function AnalyticsPage() {
  const { registry } = useRegistry();
  const analytics = registry.analytics;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Analytics</h1>
          <div className="sub">Volume, conversion, migration velocity. Across every launch and campaign.</div>
        </div>
        <div className="actions">
          <button className="btn ghost" type="button">
            Export CSV
          </button>
          <button className="btn primary" type="button">
            Connect data source
          </button>
        </div>
      </div>

      <div
        className="card"
        style={{
          position: "relative",
          overflow: "hidden",
          padding: 0,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse 60% 40% at 0% 0%, rgba(99,91,255,0.10), transparent), radial-gradient(ellipse 50% 40% at 100% 100%, rgba(236,72,153,0.10), transparent)",
            pointerEvents: "none",
          }}
        />
        <div className="relative z-10 grid gap-0 lg:grid-cols-4">
          {analytics.stats.map((s) => (
            <div
              key={s.label}
              className="flex flex-col gap-2 p-6"
              style={{ borderRight: "1px solid var(--line)" }}
            >
              <div className="text-[12px] font-medium text-slate-500">{s.label}</div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-mono text-[26px] font-bold tabular-nums text-slate-900">{s.value}</span>
                <span className="text-[12px] font-medium text-slate-400">{s.unit}</span>
              </div>
              <div className={`text-[11.5px] font-semibold ${s.positive ? "text-emerald-600" : "text-rose-600"}`}>
                {s.delta} vs prev. 7d
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ position: "relative", overflow: "hidden" }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 24 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em" }}>
              Buy volume across launches
            </h3>
            <div className="mt-1 text-[12.5px] text-slate-500">
              Sample preview. Hook up Torque event ingest to populate live data.
            </div>
          </div>
          <div className="flex items-center gap-2">
            {["7d", "30d", "All"].map((r, i) => (
              <button
                key={r}
                type="button"
                className={`rounded-full border px-3 py-1.5 text-[12px] font-medium ${
                  i === 0 ? "border-pink-200 bg-pink-50 text-pink-700" : "border-slate-200 bg-white text-slate-600"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div style={{ position: "relative", height: 280 }}>
          <svg viewBox="0 0 800 240" preserveAspectRatio="none" style={{ width: "100%", height: "100%" }}>
            <defs>
              <linearGradient id="ana-area" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#ec4899" stopOpacity="0.32" />
                <stop offset="100%" stopColor="#ec4899" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="ana-line" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0%" stopColor="#635bff" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
              <linearGradient id="ana-area-2" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#635bff" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#635bff" stopOpacity="0" />
              </linearGradient>
            </defs>
            {[40, 80, 120, 160, 200].map((y) => (
              <line key={y} x1="0" x2="800" y1={y} y2={y} stroke="#eef2f7" strokeWidth="1" />
            ))}
            <path
              d="M0,180 C60,170 100,160 160,150 C220,140 260,130 320,115 C380,100 420,90 480,75 C540,60 600,50 660,40 C720,32 760,28 800,25 L800,240 L0,240 Z"
              fill="url(#ana-area)"
            />
            <path
              d="M0,180 C60,170 100,160 160,150 C220,140 260,130 320,115 C380,100 420,90 480,75 C540,60 600,50 660,40 C720,32 760,28 800,25"
              fill="none"
              stroke="url(#ana-line)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path
              d="M0,210 C60,205 100,200 160,195 C220,190 260,182 320,175 C380,168 420,160 480,150 C540,140 600,128 660,120 C720,112 760,108 800,105 L800,240 L0,240 Z"
              fill="url(#ana-area-2)"
            />
            <circle cx="800" cy="25" r="5" fill="#ec4899" />
            <circle cx="800" cy="25" r="9" fill="#ec4899" fillOpacity="0.25" />
          </svg>

          <div
            style={{
              position: "absolute",
              right: 16,
              top: 16,
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 12px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.85)",
              border: "1px solid var(--line)",
              fontSize: 11,
              fontWeight: 600,
              color: "var(--ink-dim)",
              backdropFilter: "blur(6px)",
            }}
          >
            <span
              style={{
                display: "inline-block",
                width: 6,
                height: 6,
                borderRadius: 999,
                background: "#a855f7",
                animation: "pulse 1.6s infinite",
              }}
            />
            Sample preview
          </div>
        </div>
      </div>

      <div className="grid gap-[18px] md:grid-cols-2">
        <div className="card">
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, letterSpacing: "-0.02em" }}>
            Top performing launches
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
          </div>
        </div>

        <div className="card">
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, letterSpacing: "-0.02em" }}>
            Conversion by template
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
          </div>
        </div>
      </div>
    </div>
  );
}
