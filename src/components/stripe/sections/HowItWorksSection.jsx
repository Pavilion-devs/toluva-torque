import React from "react";

const steps = [
  {
    number: "01",
    label: "Design",
    title: "Set a clear graduation target.",
    copy: "Start with the Conviction recipe. Review supply, curve fees, migration target and the liquidity commitment before signing a config.",
    lines: ["1B immutable tokens", "1% DBC fee", "Graduation target chosen by you"],
    tint: "from-pink-50 to-rose-50",
    border: "border-pink-100",
  },
  {
    number: "02",
    label: "Launch",
    title: "Create the pool from your wallet.",
    copy: "Your wallet signs the config and token launch. Toluva records the resulting on-chain config, mint and DBC pool after confirmation.",
    lines: ["Creator-paid config", "Wallet-signed pool", "Public transaction links"],
    tint: "from-violet-50 to-fuchsia-50",
    border: "border-violet-100",
  },
  {
    number: "03",
    label: "Verify",
    title: "Make the terms public.",
    copy: "Anyone can inspect the token's live curve progress, fee recipients and DAMM v2 migration terms from the launch page.",
    lines: ["Live DBC progress", "Fee recipient addresses", "50% permanent liquidity lock"],
    tint: "from-indigo-50 to-blue-50",
    border: "border-indigo-100",
  },
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="relative w-full bg-white px-6 py-24 lg:px-12 lg:py-28" data-aura-component-name="HowItWorks">
      <div className="mx-auto max-w-[1200px]">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <span className="mb-4 inline-block text-xs font-medium uppercase tracking-[0.22em] text-pink-500">How it works</span>
          <h2 className="text-4xl font-medium leading-[1.1] tracking-tight text-slate-900 md:text-5xl">A launch people can inspect.</h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-500">Toluva turns a launch recipe into a wallet-signed Meteora DBC pool with public terms.</p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {steps.map((step) => (
            <div key={step.number} className={`flex min-h-[420px] flex-col rounded-3xl border ${step.border} bg-gradient-to-br ${step.tint} p-8 shadow-[0_15px_45px_rgba(15,23,42,0.05)]`}>
              <div className="flex items-center gap-3 text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-white font-mono font-semibold text-pink-600 shadow-sm">{step.number}</span>
                {step.label}
              </div>
              <h3 className="mt-6 text-[26px] font-medium leading-[1.15] tracking-tight text-slate-900">{step.title}</h3>
              <p className="mt-4 text-[15px] leading-relaxed text-slate-600">{step.copy}</p>
              <div className="mt-auto space-y-2 pt-8">
                {step.lines.map((line) => (
                  <div key={line} className="rounded-xl border border-white/80 bg-white/75 px-4 py-3 font-mono text-xs text-slate-700">{line}</div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
