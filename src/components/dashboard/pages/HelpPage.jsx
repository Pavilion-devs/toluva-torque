import React from "react";

const docCards = [
  {
    label: "Raydium LaunchLab",
    desc: "How tokens, platform PDAs, and bonding curves work on LaunchLab.",
    href: "https://docs.raydium.io/raydium/launchlab/launchlab",
    icon: "M12 2 4 6v6c0 5 3.4 9.5 8 10 4.6-.5 8-5 8-10V6l-8-4Z",
    accent: "pink",
  },
  {
    label: "Torque MCP",
    desc: "Wire custom events, generate queries, attach recurring incentives.",
    href: "https://platform.torque.so/docs/mcp/quickstart",
    icon: "M13 2 4 14h7l-1 8 9-12h-7l1-8Z",
    accent: "violet",
  },
  {
    label: "Solana docs",
    desc: "Cluster info, RPC reference, transactions, account model.",
    href: "https://solana.com/developers",
    icon: "M5 16l5-8 4 6 5-10",
    accent: "indigo",
  },
];

const quickLinks = [
  { label: "Friction log (Torque integration)", href: "#", meta: "Updated daily" },
  { label: "GitHub repo", href: "#", meta: "github.com/toluva/launchpad" },
  { label: "Submit feedback", href: "#", meta: "feedback@toluva.xyz" },
  { label: "Tag @torqueprotocol on X", href: "https://x.com/torqueprotocol", meta: "x.com" },
];

const accents = {
  pink: { bg: "#fce7f3", fg: "#ec4899", glow: "rgba(236, 72, 153, 0.18)" },
  violet: { bg: "#ede9fe", fg: "#7c3aed", glow: "rgba(124, 58, 237, 0.18)" },
  indigo: { bg: "#e0e7ff", fg: "#4f46e5", glow: "rgba(79, 70, 229, 0.18)" },
};

function DocCard({ d }) {
  const a = accents[d.accent];
  return (
    <a
      href={d.href}
      target="_blank"
      rel="noreferrer"
      className="card group"
      style={{
        position: "relative",
        overflow: "hidden",
        textDecoration: "none",
        transition: "transform 200ms ease, box-shadow 200ms ease",
      }}
    >
      <div
        style={{
          position: "absolute",
          right: -40,
          top: -40,
          width: 160,
          height: 160,
          borderRadius: "50%",
          background: a.glow,
          filter: "blur(40px)",
          pointerEvents: "none",
        }}
      />
      <div className="relative z-10">
        <div
          className="flex h-11 w-11 items-center justify-center rounded-2xl"
          style={{ background: a.bg, color: a.fg }}
        >
          <svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <path d={d.icon} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h3 className="mt-4 text-[17px] font-semibold tracking-tight text-slate-900">{d.label}</h3>
        <p className="mt-1.5 text-[13.5px] leading-relaxed text-slate-500">{d.desc}</p>
        <div className="mt-5 inline-flex items-center gap-1.5 text-[13px] font-semibold" style={{ color: a.fg }}>
          Open docs
          <svg width={13} height={13} viewBox="0 0 24 24" fill="none">
            <path d="M7 17 17 7M8 7h9v9" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </a>
  );
}

export default function HelpPage() {
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Help</h1>
          <div className="sub">Docs, friction log, and the fastest way to reach the team.</div>
        </div>
      </div>

      <div className="grid gap-[18px] md:grid-cols-3">
        {docCards.map((d) => (
          <DocCard key={d.label} d={d} />
        ))}
      </div>

      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-pink-500">Quick links</div>
            <h3 style={{ margin: "6px 0 0", fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em" }}>
              Open issues, friction, and reach-outs
            </h3>
          </div>
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] text-slate-500">
            Hackathon-mode
          </span>
        </div>
        <div className="mt-5 divide-y divide-slate-100">
          {quickLinks.map((q) => (
            <a
              key={q.label}
              href={q.href}
              className="flex items-center justify-between py-3.5 transition-colors hover:bg-slate-50/60"
              style={{ textDecoration: "none" }}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                    <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <div className="text-[14px] font-semibold text-slate-900">{q.label}</div>
                  <div className="font-mono text-[11.5px] text-slate-400">{q.meta}</div>
                </div>
              </div>
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" className="text-slate-300">
                <path d="M7 17 17 7M8 7h9v9" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          ))}
        </div>
      </div>

      <div className="card" style={{ position: "relative", overflow: "hidden" }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse 60% 60% at 0% 0%, rgba(99,91,255,0.14), transparent), radial-gradient(ellipse 60% 60% at 100% 100%, rgba(236,72,153,0.14), transparent)",
            pointerEvents: "none",
          }}
        />
        <div className="relative z-10 flex flex-col items-start gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em" }}>
              Stuck on Torque or LaunchLab?
            </h3>
            <p className="mt-1 text-[14px] text-slate-500">
              Open a friction-log entry. The team triages everything tagged hackathon weekly.
            </p>
          </div>
          <button className="btn primary" type="button">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
            New friction entry
          </button>
        </div>
      </div>
    </div>
  );
}
