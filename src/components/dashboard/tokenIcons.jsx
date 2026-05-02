import React from "react";

export const TOKENS = {
  OKRA: {
    name: "Okra Protocol",
    icon: "solar:leaf-bold",
    from: "#a78bfa",
    to: "#6b4fd0",
    gradient: "linear-gradient(135deg, #a78bfa 0%, #6b4fd0 100%)",
    glow: "rgba(107, 79, 208, 0.32)",
  },
  VERDE: {
    name: "Verde Capital",
    icon: "solar:dollar-bold",
    from: "#6ee7b7",
    to: "#10b981",
    gradient: "linear-gradient(135deg, #6ee7b7 0%, #10b981 100%)",
    glow: "rgba(16, 185, 129, 0.32)",
  },
  HOTSOL: {
    name: "Hot Solana",
    icon: "solar:fire-bold",
    from: "#fb923c",
    to: "#ec4899",
    gradient: "linear-gradient(135deg, #fb923c 0%, #ec4899 100%)",
    glow: "rgba(236, 72, 153, 0.32)",
  },
  NEBL: {
    name: "Nebula",
    icon: "solar:stars-bold",
    from: "#fcd34d",
    to: "#e89c2a",
    gradient: "linear-gradient(135deg, #fcd34d 0%, #e89c2a 100%)",
    glow: "rgba(232, 156, 42, 0.32)",
  },
  LCAT: {
    name: "Laser Cat",
    icon: "solar:bolt-bold",
    from: "#93c5fd",
    to: "#3b82f6",
    gradient: "linear-gradient(135deg, #93c5fd 0%, #3b82f6 100%)",
    glow: "rgba(59, 130, 246, 0.32)",
  },
  WAVE: {
    name: "Wave Foundation",
    icon: "solar:waterdrop-bold",
    from: "#67e8f9",
    to: "#06b6d4",
    gradient: "linear-gradient(135deg, #67e8f9 0%, #06b6d4 100%)",
    glow: "rgba(6, 182, 212, 0.32)",
  },
  POLY: {
    name: "PolyDrop",
    icon: "solar:diamond-bold",
    from: "#c084fc",
    to: "#a855f7",
    gradient: "linear-gradient(135deg, #c084fc 0%, #a855f7 100%)",
    glow: "rgba(168, 85, 247, 0.32)",
  },
  ZIG: {
    name: "ZigZag DAO",
    icon: "solar:bolt-circle-bold",
    from: "#34d399",
    to: "#059669",
    gradient: "linear-gradient(135deg, #34d399 0%, #059669 100%)",
    glow: "rgba(5, 150, 105, 0.32)",
  },
};

export function getTokenMeta(symbol) {
  return TOKENS[symbol] || null;
}

export function TokenIcon({ symbol, size = 40, ring = false }) {
  const meta = TOKENS[symbol];
  const iconPx = Math.round(size * 0.5);

  if (!meta) {
    return (
      <div
        className="flex shrink-0 items-center justify-center rounded-full bg-slate-200 font-bold text-slate-500"
        style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}
        aria-hidden="true"
      >
        {symbol?.slice(0, 2) || "?"}
      </div>
    );
  }

  return (
    <div
      className="relative flex shrink-0 items-center justify-center rounded-full text-white"
      style={{
        width: size,
        height: size,
        background: meta.gradient,
        boxShadow: `0 6px 16px ${meta.glow}, inset 0 1px 0 rgba(255,255,255,0.28), inset 0 -1px 0 rgba(0,0,0,0.08)`,
      }}
      aria-hidden="true"
    >
      <span
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          background:
            "radial-gradient(circle at 30% 25%, rgba(255,255,255,0.32), transparent 55%)",
          pointerEvents: "none",
        }}
      />
      <iconify-icon
        icon={meta.icon}
        style={{ fontSize: iconPx, color: "#fff", lineHeight: 0, position: "relative", zIndex: 1 }}
      />
      {ring && (
        <span
          style={{
            position: "absolute",
            inset: -2,
            borderRadius: "50%",
            border: "2px solid rgba(255,255,255,0.85)",
            boxShadow: `0 0 0 1px ${meta.glow}`,
            pointerEvents: "none",
          }}
        />
      )}
    </div>
  );
}

export default TokenIcon;
