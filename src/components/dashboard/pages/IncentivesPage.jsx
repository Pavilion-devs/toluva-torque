import React from "react";

const templates = [
  {
    id: "early-buyer",
    name: "Early Buyer Leaderboard",
    eyebrow: "Reward",
    badge: "Most popular",
    icon: "M12 2v6l4-2-2 4 6 0-4 4 4 4-6 0 2 4-4-2v6l-4-6 4 2v-6l-6 0 4-4-4-4 6 0-4-4 4 2V2",
    accent: "pink",
    summary: "Top buyers in the first window split a fixed pool the moment your launch closes.",
    metrics: ["Top N wallets ranked by buy volume", "Auto-paid by Torque", "Configurable cutoff window"],
    sample: "12 wallets paid out · 3.4 SOL pool",
  },
  {
    id: "referral-raffle",
    name: "Referral Raffle",
    eyebrow: "Acquire",
    icon: "M16 11a4 4 0 1 0-8 0 4 4 0 0 0 8 0ZM2 22a8 8 0 0 1 16 0M22 12l-3 2 3 2-3 2 3 2",
    accent: "violet",
    summary: "Each holder gets a referral link. Qualified referrals earn raffle tickets. Torque draws and pays winners.",
    metrics: ["Per-wallet referral links", "Raffle entries on qualified buys", "Auto-draw at end of window"],
    sample: "8 valid referrers · raffle in 2h",
  },
  {
    id: "migration-sprint",
    name: "Migration Sprint",
    eyebrow: "Graduate",
    icon: "M5 16l5-8 4 6 5-10M5 16h14M3 21h18",
    accent: "indigo",
    summary: "Reward the wallets that push the bonding curve over its migration threshold before deadline.",
    metrics: ["Leaderboard around graduation", "Triggers on threshold hit", "Pays sprinters automatically"],
    sample: "38 sprinting · 78% to threshold",
  },
];

const accents = {
  pink: {
    glow: "from-pink-400/35 via-rose-300/20 to-transparent",
    orb: "bg-pink-400/30",
    icon: "text-pink-500",
    iconBg: "bg-pink-100",
    btn: "linear-gradient(135deg, #fb7185, #ec4899)",
    btnShadow: "rgba(236, 72, 153, 0.25)",
    eye: "text-pink-600",
    line: "rgba(236, 72, 153, 0.06)",
  },
  violet: {
    glow: "from-violet-400/35 via-fuchsia-300/20 to-transparent",
    orb: "bg-violet-400/30",
    icon: "text-violet-500",
    iconBg: "bg-violet-100",
    btn: "linear-gradient(135deg, #a78bfa, #7c3aed)",
    btnShadow: "rgba(124, 58, 237, 0.25)",
    eye: "text-violet-600",
    line: "rgba(139, 92, 246, 0.06)",
  },
  indigo: {
    glow: "from-indigo-400/35 via-sky-300/20 to-transparent",
    orb: "bg-indigo-400/30",
    icon: "text-indigo-500",
    iconBg: "bg-indigo-100",
    btn: "linear-gradient(135deg, #6366f1, #4f46e5)",
    btnShadow: "rgba(79, 70, 229, 0.25)",
    eye: "text-indigo-600",
    line: "rgba(99, 102, 241, 0.06)",
  },
};

function TemplateCard({ t }) {
  const a = accents[t.accent];
  return (
    <div
      className="card"
      style={{ position: "relative", overflow: "hidden", padding: 0, display: "flex", flexDirection: "column" }}
    >
      <div
        className={`pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full ${a.orb} blur-3xl`}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `repeating-linear-gradient(50deg, transparent 0 12px, ${a.line} 12px 13px)`,
          maskImage: "linear-gradient(180deg, transparent 0%, #000 25%, #000 75%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(180deg, transparent 0%, #000 25%, #000 75%, transparent 100%)",
        }}
      />

      <div className="relative z-10 flex flex-1 flex-col p-6">
        <div className="flex items-start justify-between gap-3">
          <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${a.iconBg} ${a.icon}`}>
            <svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <path d={t.icon} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          {t.badge && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900/95 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
              <span className="h-1 w-1 rounded-full bg-pink-400" />
              {t.badge}
            </span>
          )}
        </div>

        <div className={`mt-5 text-xs font-medium uppercase tracking-[0.18em] ${a.eye}`}>
          {t.eyebrow}
        </div>
        <h3 className="mt-1.5 text-[22px] font-semibold leading-[1.15] tracking-tight text-slate-900">
          {t.name}
        </h3>
        <p className="mt-2.5 text-[14px] leading-relaxed text-slate-500">{t.summary}</p>

        <ul className="mt-5 space-y-2.5">
          {t.metrics.map((m) => (
            <li key={m} className="flex items-start gap-2.5 text-[13px] text-slate-600">
              <svg width={15} height={15} viewBox="0 0 24 24" fill="none" className="mt-0.5 shrink-0">
                <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {m}
            </li>
          ))}
        </ul>

        <div
          className="mt-6 flex items-center gap-2 rounded-xl bg-slate-50 px-3.5 py-2.5 font-mono text-[11.5px] text-slate-500"
          style={{ border: "1px solid var(--line)" }}
        >
          <svg width={13} height={13} viewBox="0 0 24 24" fill="none">
            <path d="M3 12h18M3 6h18M3 18h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          {t.sample}
        </div>

        <div className="mt-auto flex items-center gap-3 pt-6">
          <button
            type="button"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2.5 text-[13.5px] font-semibold text-white transition-transform hover:-translate-y-0.5"
            style={{ background: a.btn, boxShadow: `0 8px 22px ${a.btnShadow}` }}
          >
            Use template
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none">
              <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            className="inline-flex items-center justify-center gap-1 rounded-full border border-slate-200 bg-white px-3.5 py-2.5 text-[13px] font-semibold text-slate-700 transition-colors hover:border-slate-300"
          >
            Preview
          </button>
        </div>
      </div>
    </div>
  );
}

export default function IncentivesPage() {
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Incentive templates</h1>
          <div className="sub">Pick a Torque-powered template to attach at launch.</div>
        </div>
        <div className="actions">
          <a
            className="btn ghost"
            href="https://platform.torque.so/docs/mcp/tools/incentives"
            target="_blank"
            rel="noreferrer"
            style={{ textDecoration: "none" }}
          >
            Torque docs
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M7 17 17 7M8 7h9v9" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </div>
      </div>

      <div className="grid gap-[18px] md:grid-cols-3">
        {templates.map((t) => (
          <TemplateCard key={t.id} t={t} />
        ))}
      </div>

      <div className="card" style={{ position: "relative", overflow: "hidden" }}>
        <div
          className="pointer-events-none absolute -bottom-24 -right-16 h-64 w-64 rounded-full bg-pink-400/20 blur-3xl"
        />
        <div className="relative z-10 flex flex-col items-start gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-[18px] font-semibold tracking-tight text-slate-900">
              Need a custom incentive?
            </h3>
            <p className="mt-1 text-[14px] text-slate-500">
              Torque MCP lets you wire any onchain event to a recurring incentive. Roll your own template.
            </p>
          </div>
          <a
            href="https://platform.torque.so/docs/mcp/quickstart"
            target="_blank"
            rel="noreferrer"
            className="btn ghost"
            style={{ textDecoration: "none" }}
          >
            MCP quickstart
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}
