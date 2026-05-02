import React from "react";
import { TokenIcon, getTokenMeta } from "../tokenIcons";
import { getCampaignCounts, useRegistry } from "../../../lib/launchRegistry";

const accentTheme = {
  pink: { fg: "#ec4899", bg: "#fce7f3", grad: "linear-gradient(90deg, #fb7185, #ec4899)", icon: "solar:cup-star-bold" },
  violet: { fg: "#7c3aed", bg: "#ede9fe", grad: "linear-gradient(90deg, #a78bfa, #7c3aed)", icon: "solar:users-group-rounded-bold" },
  indigo: { fg: "#4f46e5", bg: "#e0e7ff", grad: "linear-gradient(90deg, #6366f1, #4f46e5)", icon: "solar:rocket-bold" },
};

const statusTheme = {
  live: { label: "Live", pill: "progress", dot: "#10b981" },
  scheduled: { label: "Scheduled", pill: "pending", dot: "#a855f7" },
  ended: { label: "Ended", pill: "completed", dot: "#94a3b8" },
};

const eventThemes = {
  claim: { iconBg: "#dcfce7", iconFg: "#16a34a", border: "rgba(34, 197, 94, 0.18)", tint: "rgba(220, 252, 231, 0.55)" },
  raffle: { iconBg: "#ede9fe", iconFg: "#7c3aed", border: "rgba(124, 58, 237, 0.18)", tint: "rgba(237, 233, 254, 0.55)" },
  payout: { iconBg: "#fce7f3", iconFg: "#ec4899", border: "rgba(236, 72, 153, 0.18)", tint: "rgba(252, 231, 243, 0.55)" },
  threshold: { iconBg: "#e0e7ff", iconFg: "#4f46e5", border: "rgba(79, 70, 229, 0.18)", tint: "rgba(224, 231, 255, 0.55)" },
  sprint: { iconBg: "#cffafe", iconFg: "#0891b2", border: "rgba(8, 145, 178, 0.18)", tint: "rgba(207, 250, 254, 0.55)" },
  settled: { iconBg: "#fef3c7", iconFg: "#b45309", border: "rgba(180, 83, 9, 0.18)", tint: "rgba(254, 243, 199, 0.55)" },
};

function EventLine({ line }) {
  return line.map((part, index) => (
    <span key={`${part.text}-${index}`} className={part.className}>
      {part.text}
    </span>
  ));
}

function ActivityPill({ event }) {
  const t = eventThemes[event.type];
  return (
    <div
      className="shrink-0 inline-flex items-center gap-3 rounded-2xl border bg-white/95 px-4 py-3 backdrop-blur-md"
      style={{
        minWidth: 360,
        borderColor: t.border,
        boxShadow: `0 8px 24px rgba(15, 23, 42, 0.05), 0 1px 0 rgba(255, 255, 255, 0.6) inset`,
        backgroundImage: `linear-gradient(180deg, ${t.tint}, transparent 60%)`,
      }}
    >
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
        style={{ background: t.iconBg, color: t.iconFg }}
      >
        <iconify-icon icon={event.icon} style={{ fontSize: 18 }} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-medium leading-tight text-slate-700">
          <EventLine line={event.line} />
        </div>
        <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-slate-500">
          {event.token && (
            <>
              <TokenIcon symbol={event.token} size={14} />
              <span className="font-mono font-semibold">${event.token}</span>
              <span className="text-slate-300">·</span>
            </>
          )}
          <span className="font-mono">{event.time}</span>
        </div>
      </div>
    </div>
  );
}

function LiveActivityTicker({ events }) {
  return (
    <div
      className="card"
      style={{
        position: "relative",
        overflow: "hidden",
        padding: 0,
      }}
    >
      <div
        className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(16,185,129,0.16), transparent 70%)" }}
      />

      <div className="relative z-10 flex items-center justify-between gap-3 px-7 pt-5 pb-4">
        <div className="flex items-center gap-3">
          <span className="relative flex h-2.5 w-2.5">
            <span
              className="absolute inset-0 rounded-full bg-emerald-500 opacity-70"
              style={{ animation: "ping 1.6s cubic-bezier(0,0,0.2,1) infinite" }}
            />
            <span className="relative h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </span>
          <div className="flex items-baseline gap-2.5">
            <span className="text-[15px] font-bold tracking-tight text-slate-900">Live activity</span>
            <span className="text-[12px] text-slate-500">Streaming from Torque</span>
          </div>
        </div>
        <div className="hidden items-center gap-2 sm:flex">
          <span
            className="font-mono text-[11px] font-semibold tabular-nums text-slate-500"
            style={{ letterSpacing: 0.4 }}
          >
            {events.length}/min
          </span>
          <span className="rounded-full border border-slate-200 bg-white/70 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-slate-500">
            Devnet
          </span>
        </div>
      </div>

      <div className="relative pb-5">
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24"
          style={{
            background: "linear-gradient(90deg, #ffffff 0%, rgba(255,255,255,0.85) 50%, transparent 100%)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24"
          style={{
            background: "linear-gradient(270deg, #ffffff 0%, rgba(255,255,255,0.85) 50%, transparent 100%)",
          }}
        />

        <div
          className="flex w-max gap-3 px-7 animate-marquee hover:[animation-play-state:paused]"
          style={{ willChange: "transform" }}
        >
          {events.map((e, i) => (
            <ActivityPill key={`a-${i}`} event={e} />
          ))}
          {events.map((e, i) => (
            <ActivityPill key={`b-${i}`} event={e} />
          ))}
        </div>
      </div>
    </div>
  );
}

function CampaignCard({ c }) {
  const a = accentTheme[c.accent];
  const s = statusTheme[c.status];
  const tokenMeta = getTokenMeta(c.launch);
  return (
    <div className="card" style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div className="flex items-start justify-between p-5" style={{ borderBottom: "1px solid var(--line)" }}>
        <div className="flex min-w-0 items-start gap-3">
          <TokenIcon symbol={c.launch} size={44} />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span
                style={{ background: a.bg, color: a.fg }}
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
              >
                <iconify-icon icon={a.icon} style={{ fontSize: 11 }} />
                {c.type}
              </span>
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="font-mono text-[16px] font-bold tracking-tight text-slate-900">${c.launch}</span>
              <span className="text-[12px] text-slate-400">{tokenMeta?.name}</span>
            </div>
          </div>
        </div>
        <span className={`status-pill ${s.pill}`} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: 999, background: s.dot, display: "inline-block" }} />
          {s.label}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex items-end gap-6">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Pool</div>
            <div className="mt-1 font-mono text-[28px] font-bold leading-none tracking-tight text-slate-900">
              {c.pool} <span className="text-[14px] font-semibold text-slate-400">SOL</span>
            </div>
          </div>
          <div className="ml-auto text-right">
            <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Paid out</div>
            <div className="mt-1 font-mono text-[16px] font-semibold tabular-nums text-slate-700">
              {c.paid} <span className="text-[12px] text-slate-400">SOL</span>
            </div>
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between text-[11px] text-slate-500">
            <span>Progress</span>
            <span className="font-mono font-semibold text-slate-700">{c.progress}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${c.progress}%`, background: a.grad }}
            />
          </div>
        </div>

        <div className="text-[12.5px] leading-relaxed text-slate-500">{c.info}</div>
      </div>

      <div
        className="flex items-center justify-between px-5 py-3.5"
        style={{ borderTop: "1px solid var(--line)", background: "var(--card-muted)" }}
      >
        <div className="flex items-center gap-1.5 text-[12px] font-medium text-slate-600">
          <svg width={13} height={13} viewBox="0 0 24 24" fill="none">
            <circle cx={12} cy={12} r={9} stroke="currentColor" strokeWidth="1.8" />
            <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          {c.state}
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-[12px] font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-900"
        >
          View
          <svg width={12} height={12} viewBox="0 0 24 24" fill="none">
            <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}

const tabs = [
  { key: "live", label: "Live" },
  { key: "scheduled", label: "Scheduled" },
  { key: "ended", label: "Ended" },
];

export default function CampaignsPage() {
  const { registry } = useRegistry();
  const pageCampaigns = registry.campaigns || [];
  const events = registry.liveEvents || [];
  const [tab, setTab] = React.useState("live");
  const visible = pageCampaigns.filter((c) => c.status === tab);
  const counts = getCampaignCounts(registry);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Campaigns</h1>
          <div className="sub">Every Torque incentive attached to your launches.</div>
        </div>
        <div className="actions">
          <button className="btn primary" type="button">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
            New campaign
          </button>
        </div>
      </div>

      <LiveActivityTicker events={events} />

      <div className="flex flex-wrap items-center gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
              tab === t.key
                ? "border-pink-200 bg-pink-50 text-pink-700"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
            }`}
          >
            {t.label}
            <span
              className={`rounded-full px-1.5 font-mono text-[11px] ${
                tab === t.key ? "bg-pink-200/70 text-pink-800" : "bg-slate-100 text-slate-500"
              }`}
            >
              {counts[t.key]}
            </span>
          </button>
        ))}
      </div>

      <div className="grid gap-[18px] sm:grid-cols-2 xl:grid-cols-3">
        {visible.map((c) => (
          <CampaignCard key={c.id} c={c} />
        ))}
      </div>

      {visible.length === 0 && (
        <div className="card" style={{ textAlign: "center", padding: 60, color: "var(--ink-dim)" }}>
          No campaigns in this state.
        </div>
      )}
    </div>
  );
}
