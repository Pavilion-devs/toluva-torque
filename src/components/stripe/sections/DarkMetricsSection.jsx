import React from "react";

export default function DarkMetricsSection() {
  return (
    <section className="min-h-screen flex flex-col overflow-hidden select-none font-sans bg-[#050B14] border-t border-white/5 pt-24 pb-24 relative" data-aura-component-name="DarkMetricsSection">
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" data-aura-component-name="DarkMetricsSection" style={{backgroundImage: 'radial-gradient(rgb(255, 255, 255) 1px, transparent 1px)', backgroundSize: '32px 32px'}} />
      <div className="absolute top-[15%] right-[18%] w-[420px] h-[420px] bg-purple-900/20 blur-[140px] rounded-full mix-blend-screen pointer-events-none z-0" data-aura-component-name="DarkMetricsSection" />
      <div className="absolute bottom-[10%] left-[12%] w-[520px] h-[260px] bg-fuchsia-700/10 blur-[120px] rounded-full mix-blend-screen pointer-events-none z-0" data-aura-component-name="DarkMetricsSection" />
      <div className="absolute bottom-0 right-[8%] w-[900px] h-[420px] bg-indigo-600/20 blur-[150px] rounded-full mix-blend-screen pointer-events-none z-0" data-aura-component-name="DarkMetricsSection" />
      <style dangerouslySetInnerHTML={{__html: "\n    @keyframes fade-in-up-stagger { 0% { opacity: 0; transform: translateY(40px); } 100% { opacity: 1; transform: translateY(0); } } .animate-in-1 { animation: fade-in-up-stagger 1.1s cubic-bezier(0.16, 1, 0.3, 1) 0.05s forwards; opacity: 0; } .animate-in-2 { animation: fade-in-up-stagger 1.1s cubic-bezier(0.16, 1, 0.3, 1) 0.18s forwards; opacity: 0; } .animate-in-3 { animation: fade-in-up-stagger 1.1s cubic-bezier(0.16, 1, 0.3, 1) 0.3s forwards; opacity: 0; } .animate-in-4 { animation: fade-in-up-stagger 1.1s cubic-bezier(0.16, 1, 0.3, 1) 0.42s forwards; opacity: 0; } @keyframes gradient-shift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } } .animate-text-gradient { background-size: 200% auto; animation: gradient-shift 5s ease infinite; } @keyframes pulse-dash { to { stroke-dashoffset: -20; } } .pulse-line { animation: pulse-dash 1.4s linear infinite; } @keyframes logo-flip { 0%, 18%, 100% { transform: rotateY(0deg); } 9% { transform: rotateY(180deg); } } .logo-tile { transform-style: preserve-3d; backface-visibility: hidden; animation: logo-flip 8s ease-in-out infinite; } .logo-delay-1 { animation-delay: 0s; } .logo-delay-2 { animation-delay: 0.5s; } .logo-delay-3 { animation-delay: 1s; } .logo-delay-4 { animation-delay: 1.5s; } @keyframes wave-breathe-1 { 0%, 100% { transform: translateY(0) scaleY(1); } 50% { transform: translateY(-10px) scaleY(1.02); } } @keyframes wave-breathe-2 { 0%, 100% { transform: translateY(0) scaleY(1); } 50% { transform: translateY(15px) scaleY(0.98); } } @keyframes wave-breathe-3 { 0%, 100% { transform: translateX(0) rotate(0deg); } 50% { transform: translateX(-20px) rotate(0.5deg); } } .wave-group-1 { animation: wave-breathe-1 8s ease-in-out infinite; } .wave-group-2 { animation: wave-breathe-2 12s ease-in-out infinite; } .wave-group-3 { animation: wave-breathe-3 15s ease-in-out infinite; } .wave-line { fill: none; stroke-linecap: round; vector-effect: non-scaling-stroke; }\n  " }} />
      <div className="relative z-10 mx-auto w-full max-w-[1100px] border-l border-r border-slate-800/50 bg-[#0B0F19]/50 backdrop-blur-sm" data-aura-component-name="DarkMetricsSection">
        <div className="absolute -left-[3.5px] top-0 w-[6px] h-[6px] bg-[#0B0F19] border border-slate-700" data-aura-component-name="DarkMetricsSection" />
        <div className="absolute -right-[3.5px] top-0 w-[6px] h-[6px] bg-[#0B0F19] border border-slate-700" data-aura-component-name="DarkMetricsSection" />
        <div className="absolute -left-[3.5px] bottom-0 w-[6px] h-[6px] bg-[#0B0F19] border border-slate-700" data-aura-component-name="DarkMetricsSection" />
        <div className="absolute -right-[3.5px] bottom-0 w-[6px] h-[6px] bg-[#0B0F19] border border-slate-700" data-aura-component-name="DarkMetricsSection" />
        <section className="px-6 md:px-16 relative" data-aura-component-name="DarkMetricsSection">
          <div className="absolute top-0 left-0 w-full h-px bg-slate-800/50" data-aura-component-name="DarkMetricsSection" />
          <div className="max-w-2xl mb-12 pt-12 text-lg md:text-xl font-normal leading-relaxed tracking-tight animate-in-1" data-aura-component-name="DarkMetricsSection">
            <span className="text-slate-100 font-medium" data-aura-component-name="DarkMetricsSection">
              Connect to existing systems.
            </span>
            <span className="text-slate-400" data-aura-component-name="DarkMetricsSection">
              Orchestrate payments across multiple processors, build custom workflows, and connect to third parties using APIs, partner apps or pre-built integrations.
            </span>
          </div>
          <div className="relative w-full aspect-[4/3] md:aspect-[21/9] bg-[#0A0D17] border border-slate-800/80 rounded-[20px] overflow-hidden flex items-center justify-center shadow-2xl shadow-black/50" data-aura-component-name="DarkMetricsSection">
            <div className="absolute inset-0 pointer-events-none opacity-25" data-aura-component-name="DarkMetricsSection" style={{backgroundImage: 'radial-gradient(rgb(59, 91, 219) 0.8px, transparent 0.8px)', backgroundSize: '12px 12px'}} />
            <div className="relative w-[800px] h-[400px] scale-[0.4] sm:scale-75 md:scale-100 origin-center" data-aura-component-name="DarkMetricsSection">
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" data-aura-component-name="DarkMetricsSection">
                <g stroke="#4f46e5" strokeWidth="1.5" strokeDasharray="4 4" fill="none" data-aura-component-name="DarkMetricsSection" style={{opacity: '0.6'}}>
                  <path d="M 330,80 L 530,80" className="pulse-line" data-aura-component-name="DarkMetricsSection" />
                  <path d="M 400,160 L 400,80" className="pulse-line" data-aura-component-name="DarkMetricsSection" />
                  <path d="M 330,80 L 330,100" className="pulse-line" data-aura-component-name="DarkMetricsSection" />
                  <path d="M 380,80 L 380,100" className="pulse-line" data-aura-component-name="DarkMetricsSection" />
                  <path d="M 460,80 L 460,100" className="pulse-line" data-aura-component-name="DarkMetricsSection" />
                  <path d="M 530,80 L 530,100" className="pulse-line" data-aura-component-name="DarkMetricsSection" />
                  <path d="M 400,200 L 400,140 L 350,140" className="pulse-line" data-aura-component-name="DarkMetricsSection" />
                  <path d="M 400,200 L 400,140 L 500,140" className="pulse-line" data-aura-component-name="DarkMetricsSection" />
                  <path d="M 360,200 L 280,200" className="pulse-line" data-aura-component-name="DarkMetricsSection" />
                  <path d="M 440,200 L 610,200" className="pulse-line" data-aura-component-name="DarkMetricsSection" />
                  <path d="M 400,240 L 400,280" className="pulse-line" data-aura-component-name="DarkMetricsSection" />
                  <path d="M 400,280 L 380,280 L 380,310" className="pulse-line" data-aura-component-name="DarkMetricsSection" />
                  <path d="M 400,280 L 420,280 L 420,310" className="pulse-line" data-aura-component-name="DarkMetricsSection" />
                </g>
              </svg>
              <div className="absolute -translate-x-1/2 -translate-y-1/2 z-10" data-aura-component-name="DarkMetricsSection" style={{left: 330, top: 60}}>
                <div className="bg-[#3b2d9b] text-white text-[11px] px-3 py-1.5 rounded border border-[#5844e4]/50 shadow-[0_0_10px_rgba(72,52,212,0.25)] whitespace-nowrap" data-aura-component-name="DarkMetricsSection">
                  ERP
                </div>
              </div>
              <div className="absolute -translate-x-1/2 -translate-y-1/2 z-10" data-aura-component-name="DarkMetricsSection" style={{left: 380, top: 60}}>
                <div className="w-10 h-6 border border-dashed border-indigo-500/40 rounded bg-indigo-950/20" data-aura-component-name="DarkMetricsSection" />
              </div>
              <div className="absolute -translate-x-1/2 -translate-y-1/2 z-10" data-aura-component-name="DarkMetricsSection" style={{left: 430, top: 60}}>
                <div className="bg-[#3b2d9b] text-white text-[11px] px-3 py-1.5 rounded border border-[#5844e4]/50 shadow-[0_0_10px_rgba(72,52,212,0.25)] whitespace-nowrap" data-aura-component-name="DarkMetricsSection">
                  Subscriptions
                </div>
              </div>
              <div className="absolute -translate-x-1/2 -translate-y-1/2 z-10" data-aura-component-name="DarkMetricsSection" style={{left: 500, top: 60}}>
                <div className="bg-[#3b2d9b] text-white text-[11px] px-3 py-1.5 rounded border border-[#5844e4]/50 shadow-[0_0_10px_rgba(72,52,212,0.25)] whitespace-nowrap" data-aura-component-name="DarkMetricsSection">
                  Legacy billing
                </div>
              </div>
              <div className="absolute -translate-x-1/2 -translate-y-1/2 z-10" data-aura-component-name="DarkMetricsSection" style={{left: 580, top: 60}}>
                <div className="bg-[#3b2d9b] text-white text-[11px] px-3 py-1.5 rounded border border-[#5844e4]/50 shadow-[0_0_10px_rgba(72,52,212,0.25)] whitespace-nowrap" data-aura-component-name="DarkMetricsSection">
                  Booking system
                </div>
              </div>
              <div className="absolute -translate-x-1/2 -translate-y-1/2 z-10" data-aura-component-name="DarkMetricsSection" style={{left: 350, top: 140}}>
                <div className="bg-[#5d44ff] text-white text-[11px] px-3 py-1.5 rounded border border-[#7863ff]/60 shadow-[0_0_15px_rgba(93,68,255,0.35)]" data-aura-component-name="DarkMetricsSection">
                  SDK
                </div>
              </div>
              <div className="absolute -translate-x-1/2 -translate-y-1/2 z-10" data-aura-component-name="DarkMetricsSection" style={{left: 500, top: 140}}>
                <div className="bg-[#5d44ff] text-white text-[11px] px-3 py-1.5 rounded border border-[#7863ff]/60 shadow-[0_0_15px_rgba(93,68,255,0.35)]" data-aura-component-name="DarkMetricsSection">
                  Event Destinations
                </div>
              </div>
              <div className="absolute -translate-x-1/2 -translate-y-1/2 z-10" data-aura-component-name="DarkMetricsSection" style={{left: 310, top: 200}}>
                <div className="bg-[#5d44ff] text-white text-[11px] px-3 py-1.5 rounded border border-[#7863ff]/60 flex items-center gap-1.5 shadow-[0_0_15px_rgba(93,68,255,0.35)]" data-aura-component-name="DarkMetricsSection">
                  App Marketplace
                  <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="opacity-80" data-aura-component-name="DarkMetricsSection">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" data-aura-component-name="DarkMetricsSection" />
                    <polyline points="15 3 21 3 21 9" data-aura-component-name="DarkMetricsSection" />
                    <line x1={10} y1={14} x2={21} y2={3} data-aura-component-name="DarkMetricsSection" />
                  </svg>
                </div>
              </div>
              <div className="absolute -translate-x-1/2 -translate-y-1/2 z-20" data-aura-component-name="DarkMetricsSection" style={{left: 400, top: 200}}>
                <div className="bg-[#191c2e] text-white font-semibold text-[15px] tracking-tight w-[72px] h-[72px] rounded-xl flex items-center justify-center border border-[#635bff] shadow-[0_0_35px_rgba(99,91,255,0.35)] relative overflow-hidden" data-aura-component-name="DarkMetricsSection">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#635bff]/20 to-transparent" data-aura-component-name="DarkMetricsSection" />
                  stripe
                </div>
              </div>
              <div className="absolute -translate-x-1/2 -translate-y-1/2 z-10" data-aura-component-name="DarkMetricsSection" style={{left: 520, top: 200}}>
                <div className="bg-[#5d44ff] text-white text-[11px] px-3 py-1.5 rounded border border-[#7863ff]/60 shadow-[0_0_15px_rgba(93,68,255,0.35)]" data-aura-component-name="DarkMetricsSection">
                  Data Pipeline
                </div>
              </div>
              <div className="absolute -translate-x-1/2 -translate-y-1/2 z-10" data-aura-component-name="DarkMetricsSection" style={{left: 690, top: 200}}>
                <div className="bg-white w-8 h-8 rounded-md flex items-center justify-center shadow-lg" data-aura-component-name="DarkMetricsSection">
                  <svg width={16} height={16} viewBox="0 0 24 24" fill="#0ea5e9" data-aura-component-name="DarkMetricsSection">
                    <path d="M12 2C6.48 2 2 4.02 2 6.5C2 8.98 6.48 11 12 11C17.52 11 22 8.98 22 6.5C22 4.02 17.52 2 12 2ZM12 9.5C7.38 9.5 3.5 7.82 3.5 6.5C3.5 5.18 7.38 3.5 12 3.5C16.62 3.5 20.5 5.18 20.5 6.5C20.5 7.82 16.62 9.5 12 9.5Z" data-aura-component-name="DarkMetricsSection" />
                    <path d="M2 11.5V17.5C2 19.98 6.48 22 12 22C17.52 22 22 19.98 22 17.5V11.5C22 13.98 17.52 16 12 16C6.48 16 2 13.98 2 11.5Z" data-aura-component-name="DarkMetricsSection" />
                    <path d="M2 6.5V12.5C2 14.98 6.48 17 12 17C17.52 17 22 14.98 22 12.5V6.5C22 8.98 17.52 11 12 11C6.48 11 2 8.98 2 6.5Z" data-aura-component-name="DarkMetricsSection" />
                  </svg>
                </div>
              </div>
              <div className="absolute -translate-x-1/2 -translate-y-1/2 z-10" data-aura-component-name="DarkMetricsSection" style={{left: 400, top: 260}}>
                <div className="bg-[#5d44ff] text-white text-[11px] px-3 py-1.5 rounded border border-[#7863ff]/60 shadow-[0_0_15px_rgba(93,68,255,0.35)]" data-aura-component-name="DarkMetricsSection">
                  Orchestration
                </div>
              </div>
              <div className="absolute -translate-x-1/2 -translate-y-1/2 z-10" data-aura-component-name="DarkMetricsSection" style={{left: 350, top: 320}}>
                <div className="w-8 h-5 border border-dashed border-indigo-500/30 rounded bg-indigo-950/10" data-aura-component-name="DarkMetricsSection" />
              </div>
              <div className="absolute -translate-x-1/2 -translate-y-1/2 z-10" data-aura-component-name="DarkMetricsSection" style={{left: 380, top: 320}}>
                <div className="bg-[#2a2a4a] text-slate-300 text-[10px] px-2 py-1 rounded border border-indigo-500/30" data-aura-component-name="DarkMetricsSection">
                  PSP
                </div>
              </div>
              <div className="absolute -translate-x-1/2 -translate-y-1/2 z-10" data-aura-component-name="DarkMetricsSection" style={{left: 420, top: 320}}>
                <div className="bg-[#2a2a4a] text-slate-300 text-[10px] px-2 py-1 rounded border border-indigo-500/30" data-aura-component-name="DarkMetricsSection">
                  PSP
                </div>
              </div>
              <div className="absolute -translate-x-1/2 -translate-y-1/2 z-10" data-aura-component-name="DarkMetricsSection" style={{left: 450, top: 320}}>
                <div className="bg-[#2a2a4a] text-slate-300 text-[10px] px-2 py-1 rounded border border-indigo-500/30" data-aura-component-name="DarkMetricsSection">
                  PSP
                </div>
              </div>
              <div className="absolute -translate-x-1/2 -translate-y-1/2 bg-[#0c1222] border border-slate-700/50 rounded-lg p-1.5 grid grid-cols-3 gap-1.5 shadow-xl" data-aura-component-name="DarkMetricsSection" style={{left: 200, top: 200}}>
                <div className="logo-tile logo-delay-1 w-7 h-7 bg-[#111] rounded flex items-center justify-center shadow-sm" data-aura-component-name="DarkMetricsSection">
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="white" data-aura-component-name="DarkMetricsSection">
                    <path d="M3 7l6-4 3 4-6 4-3-4zm9 0l6-4 3 4-6 4-3-4zm-9 10l6-4 3 4-6 4-3-4z" data-aura-component-name="DarkMetricsSection" />
                  </svg>
                </div>
                <div className="logo-tile logo-delay-2 w-7 h-7 bg-[#0ea5e9] rounded flex items-center justify-center shadow-sm text-white text-[10px] font-semibold" data-aura-component-name="DarkMetricsSection">
                  X
                </div>
                <div className="logo-tile logo-delay-3 w-7 h-7 bg-[#2563eb] rounded flex items-center justify-center shadow-sm" data-aura-component-name="DarkMetricsSection">
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="white" data-aura-component-name="DarkMetricsSection">
                    <path d="M12 2l10 6-10 6L2 8l10-6zm0 8.5L5.5 7 12 3.5 18.5 7 12 10.5z" data-aura-component-name="DarkMetricsSection" />
                    <path d="M12 12l10-6v10l-10 6-10-6V6l10 6z" opacity="0.8" data-aura-component-name="DarkMetricsSection" />
                  </svg>
                </div>
                <div className="w-7 h-7 border border-dashed border-slate-600 rounded bg-[#111827]/50" data-aura-component-name="DarkMetricsSection" />
                <div className="logo-tile logo-delay-4 w-7 h-7 bg-white rounded flex items-center justify-center shadow-sm" data-aura-component-name="DarkMetricsSection">
                  <div className="w-3.5 h-3.5 bg-gradient-to-br from-[#6d28d9] to-[#ec4899] rounded-sm" data-aura-component-name="DarkMetricsSection" />
                </div>
                <div className="logo-tile logo-delay-2 w-7 h-7 bg-[#fb7185] rounded flex items-center justify-center shadow-sm text-white text-[10px] font-semibold" data-aura-component-name="DarkMetricsSection">
                  RC
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="px-6 md:px-16 relative pb-12" data-aura-component-name="DarkMetricsSection">
          <div className="absolute top-0 left-0 w-full h-px bg-slate-800/50" data-aura-component-name="DarkMetricsSection" />
          <div className="max-w-2xl mb-12 pt-12 text-lg md:text-xl font-normal leading-relaxed tracking-tight animate-in-2" data-aura-component-name="DarkMetricsSection">
            <span className="text-slate-100 font-medium" data-aura-component-name="DarkMetricsSection">
              Scale with confidence.
            </span>
            <span className="text-slate-400" data-aura-component-name="DarkMetricsSection">
              Handle thousands of transactions per second with consistent speed and reliability, even during peak traffic periods.
            </span>
          </div>
          <div className="relative w-full h-[450px] md:h-[400px] rounded-[20px] overflow-hidden border border-slate-800/80 bg-[#0A0D17] shadow-2xl shadow-black/50" data-aura-component-name="DarkMetricsSection">
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0D17] via-[#0A0D17]/60 to-transparent pointer-events-none z-10" data-aura-component-name="DarkMetricsSection" />
            <div className="absolute inset-0 w-full h-full opacity-90 mix-blend-screen scale-110" data-aura-component-name="DarkMetricsSection">
              <svg viewBox="0 0 1440 600" className="w-full h-full object-cover min-w-[1440px]" preserveAspectRatio="xMidYMax slice" data-aura-component-name="DarkMetricsSection">
                <defs>
                  <linearGradient id="wave-grad-1" x1="0%" y1="0%" x2="100%" y2="0%" data-aura-component-name="DarkMetricsSection">
                    <stop offset="0%" stopColor="#fb923c" stopOpacity={0} data-aura-component-name="DarkMetricsSection" />
                    <stop offset="20%" stopColor="#fb923c" stopOpacity="0.8" data-aura-component-name="DarkMetricsSection" />
                    <stop offset="50%" stopColor="#e879f9" stopOpacity={1} data-aura-component-name="DarkMetricsSection" />
                    <stop offset="80%" stopColor="#a855f7" stopOpacity="0.85" data-aura-component-name="DarkMetricsSection" />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} data-aura-component-name="DarkMetricsSection" />
                  </linearGradient>
                  <linearGradient id="wave-grad-2" x1="0%" y1="0%" x2="100%" y2="0%" data-aura-component-name="DarkMetricsSection">
                    <stop offset="0%" stopColor="#e879f9" stopOpacity={0} data-aura-component-name="DarkMetricsSection" />
                    <stop offset="30%" stopColor="#c084fc" stopOpacity="0.6" data-aura-component-name="DarkMetricsSection" />
                    <stop offset="70%" stopColor="#8b5cf6" stopOpacity="0.9" data-aura-component-name="DarkMetricsSection" />
                    <stop offset="100%" stopColor="#82B1FF" stopOpacity={0} data-aura-component-name="DarkMetricsSection" />
                  </linearGradient>
                </defs>
                <g className="wave-group-1 opacity-40" data-aura-component-name="DarkMetricsSection">
                  <path className="wave-line" stroke="url(#wave-grad-2)" strokeWidth={2} d="M -100,500 C 300,500 500,250 900,300 C 1300,350 1500,450 1600,450" data-aura-component-name="DarkMetricsSection" />
                  <path className="wave-line" stroke="url(#wave-grad-2)" strokeWidth="1.5" d="M -100,520 C 320,520 520,270 920,320 C 1320,370 1520,470 1600,470" data-aura-component-name="DarkMetricsSection" />
                  <path className="wave-line" stroke="url(#wave-grad-2)" strokeWidth={2} d="M -100,540 C 340,540 540,290 940,340 C 1340,390 1540,490 1600,490" data-aura-component-name="DarkMetricsSection" />
                  <path className="wave-line" stroke="url(#wave-grad-2)" strokeWidth={1} d="M -100,560 C 360,560 560,310 960,360 C 1360,410 1560,510 1600,510" data-aura-component-name="DarkMetricsSection" />
                </g>
                <g className="wave-group-2 opacity-60" data-aura-component-name="DarkMetricsSection">
                  <path className="wave-line" stroke="url(#wave-grad-1)" strokeWidth={1} d="M -100,450 C 250,450 600,350 1000,400 C 1400,450 1500,550 1600,550" data-aura-component-name="DarkMetricsSection" />
                  <path className="wave-line" stroke="url(#wave-grad-1)" strokeWidth="1.5" d="M -100,470 C 270,470 620,370 1020,420 C 1420,470 1520,570 1600,570" data-aura-component-name="DarkMetricsSection" />
                  <path className="wave-line" stroke="url(#wave-grad-1)" strokeWidth="0.5" d="M -100,490 C 290,490 640,390 1040,440 C 1440,490 1540,590 1600,590" data-aura-component-name="DarkMetricsSection" />
                  <path className="wave-line" stroke="url(#wave-grad-1)" strokeWidth={2} d="M -100,510 C 310,510 660,410 1060,460 C 1460,510 1560,610 1600,610" data-aura-component-name="DarkMetricsSection" />
                </g>
                <g className="wave-group-3 opacity-90" data-aura-component-name="DarkMetricsSection">
                  <path className="wave-line" stroke="url(#wave-grad-1)" strokeWidth={2} d="M -100,580 C 400,580 500,200 950,250 C 1400,300 1500,500 1600,500" data-aura-component-name="DarkMetricsSection" />
                  <path className="wave-line" stroke="url(#wave-grad-1)" strokeWidth={1} d="M -100,590 C 410,590 510,210 960,260 C 1410,310 1510,510 1600,510" data-aura-component-name="DarkMetricsSection" />
                  <path className="wave-line" stroke="url(#wave-grad-1)" strokeWidth={3} d="M -100,600 C 420,600 520,220 970,270 C 1420,320 1520,520 1600,520" data-aura-component-name="DarkMetricsSection" />
                  <path className="wave-line" stroke="url(#wave-grad-1)" strokeWidth="0.5" d="M -100,610 C 430,610 530,230 980,280 C 1430,330 1530,530 1600,530" data-aura-component-name="DarkMetricsSection" />
                  <path className="wave-line" stroke="url(#wave-grad-1)" strokeWidth="1.5" d="M -100,620 C 440,620 540,240 990,290 C 1440,340 1540,540 1600,540" data-aura-component-name="DarkMetricsSection" />
                </g>
              </svg>
            </div>
            <div className="absolute bottom-0 left-0 w-full p-8 md:p-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-10 z-20" data-aura-component-name="DarkMetricsSection">
              <div className="animate-in-2" data-aura-component-name="DarkMetricsSection">
                <div className="text-5xl font-medium tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[#fb923c] via-[#ec4899] to-[#d946ef] mb-2 drop-shadow-sm animate-text-gradient" data-aura-component-name="DarkMetricsSection">
                  500M+
                </div>
                <div className="text-xs md:text-sm text-slate-400 font-medium tracking-wide" data-aura-component-name="DarkMetricsSection">
                  API requests per day
                </div>
              </div>
              <div className="animate-in-3" data-aura-component-name="DarkMetricsSection">
                <div className="text-5xl font-medium tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[#e879f9] to-[#a855f7] mb-2 drop-shadow-sm animate-text-gradient" data-aura-component-name="DarkMetricsSection">
                  10K+
                </div>
                <div className="text-xs md:text-sm text-slate-400 font-medium tracking-wide" data-aura-component-name="DarkMetricsSection">
                  API requests per second
                </div>
              </div>
              <div className="animate-in-4" data-aura-component-name="DarkMetricsSection">
                <div className="text-5xl font-medium tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[#8b5cf6] to-[#6366f1] mb-2 drop-shadow-sm animate-text-gradient" data-aura-component-name="DarkMetricsSection">
                  150K+
                </div>
                <div className="text-xs md:text-sm text-slate-400 font-medium tracking-wide" data-aura-component-name="DarkMetricsSection">
                  transactions per minute
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </section>
    
  );
}
