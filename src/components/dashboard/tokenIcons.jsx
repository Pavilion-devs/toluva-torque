import React from "react";

export const TOKENS = {};

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
