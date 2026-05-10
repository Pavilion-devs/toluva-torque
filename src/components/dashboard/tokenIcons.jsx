import React from "react";

export const TOKENS = {};

const GRADIENT_PALETTE = [
  { from: "#f43f5e", to: "#ec4899", glow: "rgba(236,72,153,0.32)" },
  { from: "#8b5cf6", to: "#6366f1", glow: "rgba(99,102,241,0.32)" },
  { from: "#06b6d4", to: "#3b82f6", glow: "rgba(59,130,246,0.32)" },
  { from: "#f59e0b", to: "#ef4444", glow: "rgba(239,68,68,0.28)" },
  { from: "#10b981", to: "#06b6d4", glow: "rgba(16,185,129,0.3)" },
  { from: "#fb923c", to: "#f59e0b", glow: "rgba(245,158,11,0.28)" },
  { from: "#a855f7", to: "#ec4899", glow: "rgba(168,85,247,0.3)" },
  { from: "#22d3ee", to: "#818cf8", glow: "rgba(129,140,248,0.3)" },
];

function symbolHash(symbol) {
  let h = 0;
  const s = symbol || "?";
  for (let i = 0; i < s.length; i++) h = Math.imul(31, h) + s.charCodeAt(i) | 0;
  return Math.abs(h);
}

export function getTokenGradient(symbol) {
  const p = GRADIENT_PALETTE[symbolHash(symbol) % GRADIENT_PALETTE.length];
  return { gradient: `linear-gradient(135deg, ${p.from}, ${p.to})`, glow: p.glow };
}

export function getTokenMeta(symbol) {
  return TOKENS[symbol] || null;
}

export function TokenIcon({ symbol, size = 40, ring = false, imageUrl, rounded = "full" }) {
  const radius = rounded === "full" ? "50%" : typeof rounded === "number" ? `${rounded}px` : rounded;
  const meta = TOKENS[symbol];
  const { gradient, glow } = meta ? { gradient: meta.gradient, glow: meta.glow } : getTokenGradient(symbol);
  const label = (symbol || "?").slice(0, 2).toUpperCase();
  const baseStyle = {
    width: size, height: size, borderRadius: radius,
    flexShrink: 0, position: "relative", overflow: "hidden",
    boxShadow: `0 6px 16px ${glow}, inset 0 1px 0 rgba(255,255,255,0.28), inset 0 -1px 0 rgba(0,0,0,0.08)`,
    ...(ring ? { outline: `2px solid rgba(255,255,255,0.85)`, outlineOffset: 2 } : {}),
  };

  if (imageUrl) {
    return (
      <div style={baseStyle} aria-hidden="true">
        <img src={imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      </div>
    );
  }

  return (
    <div
      style={{
        ...baseStyle,
        background: gradient,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
      aria-hidden="true"
    >
      <span
        style={{
          position: "absolute", inset: 0, borderRadius: radius,
          background: "radial-gradient(circle at 30% 25%, rgba(255,255,255,0.32), transparent 55%)",
          pointerEvents: "none",
        }}
      />
      {meta?.icon ? (
        <iconify-icon icon={meta.icon} style={{ fontSize: Math.round(size * 0.5), color: "#fff", lineHeight: 0, position: "relative", zIndex: 1 }} />
      ) : (
        <span style={{
          fontFamily: "'Geist', sans-serif", fontWeight: 700, color: "#fff",
          fontSize: Math.round(size * 0.35), letterSpacing: "-0.02em",
          position: "relative", zIndex: 1, lineHeight: 1,
        }}>
          {label}
        </span>
      )}
    </div>
  );
}

export default TokenIcon;
