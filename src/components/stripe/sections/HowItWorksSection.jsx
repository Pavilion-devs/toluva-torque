import React from "react";

const accents = {
  pink: {
    tint: "from-white via-white to-pink-50/60",
    blurA: "bg-pink-400/25",
    blurB: "bg-rose-300/20",
    badge: "from-pink-500 to-rose-500",
    ring: "ring-pink-500/15",
    line: "rgba(236, 72, 153, 0.07)",
  },
  violet: {
    tint: "from-white via-white to-violet-50/60",
    blurA: "bg-violet-400/25",
    blurB: "bg-fuchsia-300/20",
    badge: "from-violet-500 to-purple-500",
    ring: "ring-violet-500/15",
    line: "rgba(139, 92, 246, 0.07)",
  },
  indigo: {
    tint: "from-white via-white to-indigo-50/60",
    blurA: "bg-indigo-400/25",
    blurB: "bg-sky-300/20",
    badge: "from-indigo-500 to-blue-500",
    ring: "ring-indigo-500/15",
    line: "rgba(99, 102, 241, 0.07)",
  },
};

function StepCard({ step, accent, eyebrow, title, description, children }) {
  const a = accents[accent];
  return (
    <div
      className={`group relative flex min-h-[480px] cursor-default flex-col overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-[0_15px_45px_rgba(15,23,42,0.05)] ring-1 ${a.ring} transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_25px_60px_rgba(15,23,42,0.08)]`}
      data-aura-component-name="HowItWorks"
    >
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${a.tint}`} />
      <div className={`pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full ${a.blurA} blur-3xl`} />
      <div className={`pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full ${a.blurB} blur-3xl`} />
      <div
        className="pointer-events-none absolute inset-0 opacity-90"
        style={{
          backgroundImage: `repeating-linear-gradient(50deg, transparent 0 12px, ${a.line} 12px 13px)`,
          maskImage: "linear-gradient(180deg, transparent 0%, #000 30%, #000 70%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(180deg, transparent 0%, #000 30%, #000 70%, transparent 100%)",
        }}
      />

      <div className="relative z-10 flex flex-1 flex-col p-7 md:p-8">
        <div className="flex items-center gap-3">
          <span
            className={`flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br ${a.badge} text-sm font-semibold text-white shadow-lg shadow-slate-900/10`}
          >
            {step}
          </span>
          <span className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
            {eyebrow}
          </span>
        </div>
        <h3 className="mt-5 text-[26px] font-medium leading-[1.15] tracking-tight text-slate-900">
          {title}
        </h3>
        <p className="mt-3 text-[15px] leading-relaxed text-slate-500">{description}</p>
        <div className="mt-auto pt-8">{children}</div>
      </div>
    </div>
  );
}

function LaunchMockup() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-[0_18px_45px_rgba(15,23,42,0.07)] backdrop-blur-md">
      <div className="flex items-center gap-3">
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-pink-400 via-rose-400 to-orange-300">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.7),transparent_55%)]" />
        </div>
        <div className="flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold text-slate-900">New token</span>
            <span className="text-[11px] font-mono text-slate-400">TOKEN</span>
          </div>
          <div className="mt-1.5 h-1.5 w-3/4 rounded-full bg-slate-100">
            <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-pink-500 to-rose-400" />
          </div>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 text-[11px]">
        <div className="rounded-lg border border-slate-200/80 bg-white px-2.5 py-2">
          <div className="text-slate-400">Supply</div>
          <div className="mt-0.5 font-mono font-medium text-slate-700">1,000,000,000</div>
        </div>
        <div className="rounded-lg border border-slate-200/80 bg-white px-2.5 py-2">
          <div className="text-slate-400">Curve</div>
          <div className="mt-0.5 font-mono font-medium text-slate-700">LaunchLab v2</div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-900/95 px-3 py-2.5">
        <span className="text-[11px] font-medium text-slate-300">Ready to deploy</span>
        <span className="rounded-full bg-gradient-to-r from-pink-500 to-rose-500 px-3 py-1 text-[11px] font-semibold text-white shadow-md shadow-pink-500/30">
          Launch →
        </span>
      </div>
    </div>
  );
}

function CampaignMockup() {
  const templates = [
    { label: "Early Buyer Leaderboard", chip: "Top 10", picked: true },
    { label: "Referral Raffle", chip: "8 winners", picked: false },
    { label: "Migration Sprint", chip: "T-4h", picked: false },
  ];
  return (
    <div className="relative space-y-1.5 overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 p-3 shadow-[0_18px_45px_rgba(15,23,42,0.07)] backdrop-blur-md">
      {templates.map((t) => (
        <div
          key={t.label}
          className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all ${
            t.picked
              ? "border-violet-300 bg-gradient-to-r from-violet-50 to-fuchsia-50/60 shadow-sm shadow-violet-200/50"
              : "border-slate-200/70 bg-white/70"
          }`}
        >
          <span
            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
              t.picked ? "border-violet-500 bg-violet-500" : "border-slate-300 bg-white"
            }`}
          >
            {t.picked && (
              <iconify-icon icon="lucide:check" classname="text-white text-[12px]" strokewidth="3" />
            )}
          </span>
          <span className="flex-1 text-[13px] font-medium text-slate-800">{t.label}</span>
          <span
            className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-medium ${
              t.picked ? "bg-violet-500 text-white" : "bg-slate-100 text-slate-500"
            }`}
          >
            {t.chip}
          </span>
        </div>
      ))}
      <div className="mt-2 flex items-center justify-between rounded-xl bg-slate-900/95 px-3 py-2.5">
        <span className="text-[11px] font-medium text-slate-300">Reward budget</span>
        <span className="font-mono text-[12px] font-semibold text-white">5.0 SOL</span>
      </div>
    </div>
  );
}

function TrackMockup() {
  const rows = [
    { addr: "0xab2…fe19", vol: "12.4", you: false },
    { addr: "0x9c4…01a3", vol: "8.7", you: true },
    { addr: "0x71f…cc02", vol: "6.1", you: false },
  ];
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-[0_18px_45px_rgba(15,23,42,0.07)] backdrop-blur-md">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="text-[11px] font-medium text-slate-400">Live leaderboard</div>
          <div className="text-sm font-semibold text-slate-900">TOKEN · early buyers</div>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-medium text-indigo-600 ring-1 ring-indigo-100">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-500" />
          Live
        </span>
      </div>
      <div className="space-y-1.5">
        {rows.map((r, i) => (
          <div
            key={r.addr}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 ${
              r.you ? "bg-gradient-to-r from-indigo-50 to-blue-50/50 ring-1 ring-indigo-200/70" : "bg-slate-50/70"
            }`}
          >
            <span className="w-4 font-mono text-[11px] font-medium text-slate-400">{i + 1}</span>
            <span className="flex-1 font-mono text-[12px] text-slate-700">{r.addr}</span>
            {r.you && (
              <span className="rounded-full bg-indigo-500 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
                You
              </span>
            )}
            <span className="font-mono text-[12px] font-semibold text-slate-900">{r.vol} SOL</span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-900/95 px-3 py-2.5">
        <span className="text-[11px] font-medium text-slate-300">Your reward</span>
        <span className="font-mono text-[12px] font-semibold text-white">0.42 SOL claimable</span>
      </div>
    </div>
  );
}

export default function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="relative w-full bg-white px-6 py-24 lg:px-12 lg:py-28"
      data-aura-component-name="HowItWorks"
    >
      <div className="mx-auto max-w-[1200px]">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <span className="mb-4 inline-block text-xs font-medium uppercase tracking-[0.22em] text-pink-500">
            How it works
          </span>
          <h2 className="text-4xl font-medium leading-[1.1] tracking-tight text-slate-900 md:text-5xl">
            Three steps from token to traction.
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-500">
            Every launch ships with growth attached. Pick a token, pick a campaign, ship the buyer rewards in the same flow.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <StepCard
            step={1}
            accent="pink"
            eyebrow="Launch"
            title="Spin up a token on Raydium LaunchLab."
            description="Name, symbol, image, supply, social links. We handle the platform PDA and the bonding curve config so you can focus on the project."
          >
            <LaunchMockup />
          </StepCard>

          <StepCard
            step={2}
            accent="violet"
            eyebrow="Attach"
            title="Pick a Torque campaign template."
            description="Early-buyer leaderboard, referral raffle, migration sprint. One click attaches a campaign to your launch with a reward budget."
          >
            <CampaignMockup />
          </StepCard>

          <StepCard
            step={3}
            accent="indigo"
            eyebrow="Track"
            title="Watch activity, payouts, and migration live."
            description="Buyer joins, referral clicks, threshold hits, claim states. Every event flows into Torque and back into your dashboard."
          >
            <TrackMockup />
          </StepCard>
        </div>
      </div>
    </section>
  );
}
