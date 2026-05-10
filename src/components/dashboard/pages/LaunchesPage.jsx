import React from "react";
import Link, { navigate } from "../Link";
import { TokenIcon } from "../tokenIcons";
import useWallet from "../useWallet";
import { getLaunchFilters, refreshRegistry, useRegistry } from "../../../lib/launchRegistry";

const statusMap = {
  bonding:   { label: "Bonding",   pill: "progress"  },
  migrating: { label: "Migrating", pill: "progress"  },
  migrated:  { label: "Migrated",  pill: "completed" },
  draft:     { label: "Draft",     pill: "pending"   },
};

// ─── helpers ──────────────────────────────────────────────────────────────────

async function fileToCompressedDataUrl(file, maxSize = 512, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Failed to load image."));
      img.onload = () => {
        const ratio = Math.min(maxSize / img.width, maxSize / img.height, 1);
        const w = Math.max(1, Math.round(img.width * ratio));
        const h = Math.max(1, Math.round(img.height * ratio));
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

// ─── modal shell ──────────────────────────────────────────────────────────────

function Modal({ onClose, children }) {
  React.useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handler);
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        background: "rgba(15,23,42,0.55)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 24, overflowY: "auto",
      }}
    >
      <div style={{ width: "100%", maxWidth: 720, maxHeight: "92vh", overflowY: "auto", borderRadius: "var(--radius)" }}>
        {children}
      </div>
    </div>
  );
}

// ─── filter dropdown ──────────────────────────────────────────────────────────

function FilterDropdown({ filters, active, onChange }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);

  React.useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const current = filters.find((f) => f.key === active) || filters[0];

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-[13px] font-medium text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-900"
      >
        <svg width={13} height={13} viewBox="0 0 24 24" fill="none">
          <path d="M3 6h18M6 12h12M10 18h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        {current.label}
        <span className="rounded-full bg-slate-100 px-1.5 font-mono text-[11px] text-slate-500">{current.count}</span>
        <svg width={11} height={11} viewBox="0 0 24 24" fill="none" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 160ms" }}>
          <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 20,
          background: "#fff", border: "1px solid var(--line)", borderRadius: 14,
          padding: 6, minWidth: 176,
          boxShadow: "0 4px 24px rgba(17,24,39,0.1), 0 1px 3px rgba(17,24,39,0.06)",
        }}>
          {filters.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => { onChange(f.key); setOpen(false); }}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                width: "100%", padding: "9px 12px", borderRadius: 9, border: 0,
                background: active === f.key ? "var(--green-pale)" : "transparent",
                color: active === f.key ? "var(--green)" : "var(--ink-dim)",
                fontSize: 13, fontWeight: active === f.key ? 600 : 500,
                cursor: "pointer", gap: 8, fontFamily: "'Geist', sans-serif",
              }}
            >
              {f.label}
              <span style={{
                background: active === f.key ? "var(--green-light)" : "var(--card-muted)",
                color: active === f.key ? "var(--green)" : "var(--muted)",
                borderRadius: 999, padding: "1px 8px",
                fontFamily: "'Geist Mono', monospace", fontSize: 11,
              }}>{f.count}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── image dropzone ───────────────────────────────────────────────────────────

function ImageDropzone({ value, onChange, error }) {
  const inputRef = React.useRef(null);
  const [hover, setHover] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [localError, setLocalError] = React.useState(null);

  async function handleFile(file) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setLocalError("Please upload an image file.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setLocalError("Image must be under 8MB.");
      return;
    }
    setBusy(true);
    setLocalError(null);
    try {
      const dataUrl = await fileToCompressedDataUrl(file, 512, 0.85);
      onChange(dataUrl);
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : "Could not process image.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-dim)" }}>Token image</span>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setHover(true); }}
        onDragLeave={() => setHover(false)}
        onDrop={(e) => { e.preventDefault(); setHover(false); handleFile(e.dataTransfer.files?.[0]); }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") inputRef.current?.click(); }}
        style={{
          width: "100%", aspectRatio: "1 / 1",
          borderRadius: 16, overflow: "hidden", position: "relative",
          border: `2px dashed ${hover ? "var(--green)" : value ? "transparent" : "var(--line)"}`,
          background: value ? "transparent" : hover ? "var(--green-pale)" : "var(--card-muted)",
          cursor: "pointer", display: "grid", placeItems: "center",
          transition: "border-color 160ms, background 160ms",
        }}
      >
        {value ? (
          <>
            <img src={value} alt="Token preview" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onChange(null); }}
              style={{
                position: "absolute", top: 8, right: 8,
                width: 28, height: 28, borderRadius: "50%",
                background: "rgba(15,23,42,0.7)", color: "#fff",
                border: 0, cursor: "pointer",
                display: "grid", placeItems: "center",
                backdropFilter: "blur(4px)",
              }}
              aria-label="Remove image"
            >
              <svg width={12} height={12} viewBox="0 0 24 24" fill="none">
                <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
            </button>
          </>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, color: "var(--ink-dim)", textAlign: "center", padding: 16 }}>
            {busy ? (
              <div style={{ fontSize: 12, color: "var(--muted)" }}>Processing…</div>
            ) : (
              <>
                <div style={{
                  width: 44, height: 44, borderRadius: 14, background: "#fff",
                  border: "1px solid var(--line)", display: "grid", placeItems: "center",
                  color: "var(--ink)", boxShadow: "0 1px 2px rgba(17,24,39,0.05)",
                }}>
                  <svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7M16 6l-4-4-4 4M12 2v13"
                      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>Drop an image or click to upload</div>
                <div style={{ fontSize: 11, color: "var(--muted)" }}>PNG, JPG, or WebP · 1:1 recommended</div>
              </>
            )}
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={(e) => handleFile(e.target.files?.[0])}
          style={{ display: "none" }}
        />
      </div>
      {(localError || error) && (
        <div style={{ fontSize: 11.5, color: "#be123c", fontWeight: 500 }}>{localError || error}</div>
      )}
    </div>
  );
}

// ─── form field primitives ────────────────────────────────────────────────────

function Field({ label, hint, children }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-dim)" }}>{label}</span>
      {children}
      {hint && <span style={{ fontSize: 11, color: "var(--muted)" }}>{hint}</span>}
    </label>
  );
}

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid var(--line)",
  borderRadius: 10,
  fontSize: 13,
  fontFamily: "'Geist', sans-serif",
  color: "var(--ink)",
  outline: "none",
  background: "#fff",
  transition: "border-color 160ms",
};

const monoInputStyle = { ...inputStyle, fontFamily: "'Geist Mono', monospace" };

// ─── launch form (modal body) ─────────────────────────────────────────────────

function NewLaunchForm({ wallet, onClose, onLaunched }) {
  const [form, setForm] = React.useState(() => ({
    name: "",
    symbol: `TLV${Math.floor(Math.random() * 900 + 100)}`,
    description: "",
    image: null,
    uri: "https://example.com/toluva-devnet-token.json",
    buyAmount: "10000000",
    supply: "1000000000000000",
    totalSellA: "793100000000000",
    totalFundRaisingB: "85000000000",
  }));
  const [advancedOpen, setAdvancedOpen] = React.useState(false);
  const [state, setState] = React.useState({ status: "idle", error: null, result: null, diagnostics: null });

  const update = (field) => (e) => setForm((c) => ({ ...c, [field]: e.target.value }));
  const setImage = (image) => setForm((c) => ({ ...c, image }));

  async function submit(e) {
    e.preventDefault();
    if (!form.name.trim()) {
      setState({ status: "error", error: "Token name is required.", result: null, diagnostics: null });
      return;
    }
    setState({ status: "submitting", error: null, result: null, diagnostics: null });
    try {
      const { launchDevnetToken } = await import("../../../lib/raydiumLaunchlab");
      const result = await launchDevnetToken({ wallet, launch: form });
      await refreshRegistry({ force: true });
      setState({ status: "submitted", error: null, result, diagnostics: result.diagnostics || null });
      onLaunched?.(result);
    } catch (err) {
      setState({
        status: "error",
        error: err instanceof Error ? err.message : "Launch failed.",
        result: null,
        diagnostics: err?.diagnostics || null,
      });
    }
  }

  const disabled = state.status === "submitting" || !wallet.connected || wallet.source !== "injected";

  return (
    <form className="card" onSubmit={submit} style={{ padding: 28 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--green)", letterSpacing: "0.18em", textTransform: "uppercase" }}>
            Raydium devnet
          </div>
          <h3 style={{ margin: "4px 0 4px", fontSize: 22, fontWeight: 700, letterSpacing: "-0.025em", color: "var(--ink)" }}>
            New LaunchLab token
          </h3>
          <div style={{ fontSize: 13, color: "var(--ink-dim)", maxWidth: 480, lineHeight: 1.5 }}>
            Generates a mint keypair in-browser, asks your wallet to sign, and submits to devnet. Torque telemetry fires on launch.
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          style={{
            width: 32, height: 32, borderRadius: "50%", border: "1px solid var(--line)",
            background: "#fff", display: "grid", placeItems: "center", cursor: "pointer",
            color: "var(--ink-dim)", flexShrink: 0,
          }}
          aria-label="Close"
        >
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none">
            <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div style={{ marginTop: 22, display: "grid", gridTemplateColumns: "200px 1fr", gap: 22 }}>
        <ImageDropzone value={form.image} onChange={setImage} />

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Field label="Token name">
            <input value={form.name} onChange={update("name")} placeholder="e.g. Toluva Devnet Token" style={inputStyle} />
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Symbol" hint="3–6 characters">
              <input value={form.symbol} onChange={update("symbol")} maxLength={10} style={{ ...monoInputStyle, textTransform: "uppercase" }} />
            </Field>
            <Field label="Metadata URI" hint="Off-chain JSON">
              <input value={form.uri} onChange={update("uri")} style={monoInputStyle} />
            </Field>
          </div>

          <Field label="Description" hint="Optional · 1–2 sentences shown on the token page">
            <textarea
              value={form.description}
              onChange={update("description")}
              rows={3}
              placeholder="What is this token about?"
              style={{ ...inputStyle, resize: "vertical", minHeight: 70, fontFamily: "'Geist', sans-serif" }}
            />
          </Field>
        </div>
      </div>

      {/* Advanced */}
      <div style={{ marginTop: 18 }}>
        <button
          type="button"
          onClick={() => setAdvancedOpen((o) => !o)}
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "transparent", border: 0, padding: "6px 0", cursor: "pointer",
            fontSize: 12, fontWeight: 600, color: "var(--ink-dim)",
            fontFamily: "'Geist', sans-serif",
          }}
        >
          <svg width={12} height={12} viewBox="0 0 24 24" fill="none" style={{ transform: advancedOpen ? "rotate(90deg)" : "none", transition: "transform 160ms" }}>
            <path d="m9 6 6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Advanced parameters
        </button>

        {advancedOpen && (
          <div style={{
            marginTop: 12, padding: 16, borderRadius: 14, border: "1px solid var(--line)",
            background: "var(--card-muted)",
            display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12,
          }}>
            <Field label="Buy amount" hint="Lamports the creator pre-buys at launch">
              <input value={form.buyAmount} onChange={update("buyAmount")} style={monoInputStyle} />
            </Field>
            <Field label="Supply" hint="Total token supply, with decimals">
              <input value={form.supply} onChange={update("supply")} style={monoInputStyle} />
            </Field>
            <Field label="Sell A" hint="Tokens sold along the bonding curve">
              <input value={form.totalSellA} onChange={update("totalSellA")} style={monoInputStyle} />
            </Field>
            <Field label="Raise B" hint="Quote raised before migration">
              <input value={form.totalFundRaisingB} onChange={update("totalFundRaisingB")} style={monoInputStyle} />
            </Field>
          </div>
        )}
      </div>

      {/* States */}
      {wallet.connected && wallet.source !== "injected" && (
        <Banner tone="amber" style={{ marginTop: 16 }}>
          Demo wallet cannot sign LaunchLab transactions. Connect Phantom, Backpack, or another injected Solana wallet.
        </Banner>
      )}
      {state.status === "submitting" && (
        <Banner tone="indigo" style={{ marginTop: 16 }}>
          Checking devnet wallet, simulating the Raydium transaction, then requesting wallet approval.
        </Banner>
      )}
      {state.error && (
        <Banner tone="rose" style={{ marginTop: 16 }}>{state.error}</Banner>
      )}
      {state.result && (
        <Banner tone="emerald" style={{ marginTop: 16 }}>
          <div style={{ fontWeight: 600 }}>Submitted to devnet</div>
          <div style={{ fontFamily: "'Geist Mono', monospace", fontSize: 11.5, marginTop: 3 }}>Pool {state.result.poolId}</div>
          <div style={{ fontFamily: "'Geist Mono', monospace", fontSize: 11.5 }}>Tx {state.result.signature}</div>
        </Banner>
      )}

      <div style={{ marginTop: 22, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div style={{
          fontFamily: "'Geist Mono', monospace", fontSize: 11, color: "var(--muted)",
          background: "var(--card-muted)", border: "1px solid var(--line)",
          padding: "6px 12px", borderRadius: 999,
        }}>
          {wallet.connected ? wallet.short : "no wallet connected"}
        </div>
        <button
          type="submit"
          disabled={disabled}
          className="btn primary"
          style={disabled ? { opacity: 0.55, cursor: "not-allowed" } : undefined}
        >
          {state.status === "submitting" ? "Submitting…" : "Sign & launch on devnet"}
        </button>
      </div>
    </form>
  );
}

function Banner({ tone, children, style }) {
  const tones = {
    rose:    { bg: "#fff1f2", border: "#fecdd3", text: "#9f1239" },
    amber:   { bg: "#fffbeb", border: "#fde68a", text: "#92400e" },
    indigo:  { bg: "#eef2ff", border: "#c7d2fe", text: "#3730a3" },
    emerald: { bg: "#ecfdf5", border: "#a7f3d0", text: "#065f46" },
  };
  const t = tones[tone] || tones.indigo;
  return (
    <div style={{
      background: t.bg, border: `1px solid ${t.border}`, color: t.text,
      padding: "10px 14px", borderRadius: 12, fontSize: 12.5, lineHeight: 1.5,
      ...(style || {}),
    }}>
      {children}
    </div>
  );
}

// ─── token card (pump.fun style) ──────────────────────────────────────────────

function GradientTile({ symbol }) {
  const PALETTE = [
    ["#f43f5e", "#ec4899"], ["#8b5cf6", "#6366f1"], ["#06b6d4", "#3b82f6"],
    ["#f59e0b", "#ef4444"], ["#10b981", "#06b6d4"], ["#fb923c", "#f59e0b"],
    ["#a855f7", "#ec4899"], ["#22d3ee", "#818cf8"],
  ];
  let h = 0;
  const s = symbol || "?";
  for (let i = 0; i < s.length; i++) h = Math.imul(31, h) + s.charCodeAt(i) | 0;
  const [from, to] = PALETTE[Math.abs(h) % PALETTE.length];
  const label = s.slice(0, 4).toUpperCase();

  return (
    <div style={{
      width: "100%", height: "100%",
      background: `linear-gradient(135deg, ${from}, ${to})`,
      display: "grid", placeItems: "center", position: "relative",
    }}>
      <span style={{
        position: "absolute", inset: 0, borderRadius: 0,
        background: "radial-gradient(circle at 30% 25%, rgba(255,255,255,0.22), transparent 55%)",
      }} />
      <span style={{
        fontFamily: "'Geist', sans-serif", color: "#fff", fontWeight: 800,
        fontSize: "clamp(32px, 15cqw, 64px)", letterSpacing: "-0.04em",
        textShadow: "0 4px 22px rgba(0,0,0,0.18)", position: "relative",
      }}>
        {label}
      </span>
    </div>
  );
}

function LaunchCard({ launch }) {
  const statusInfo = statusMap[launch.status] || { label: launch.status, pill: "pending" };
  const progress = Math.max(0, Math.min(100, Number(launch.bonded) || 0));
  const buyers = Number(launch.buyers) || 0;

  function open() {
    navigate(`/launches/${encodeURIComponent(launch.sym)}`);
  }

  return (
    <div
      onClick={open}
      onKeyDown={(e) => { if (e.key === "Enter") open(); }}
      role="button"
      tabIndex={0}
      className="card"
      style={{
        padding: 0, overflow: "hidden", cursor: "pointer",
        display: "flex", flexDirection: "column",
        transition: "transform 160ms ease, box-shadow 200ms ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "var(--shadow-lift)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "none";
        e.currentTarget.style.boxShadow = "var(--shadow)";
      }}
    >
      {/* Image area */}
      <div style={{ width: "100%", aspectRatio: "1 / 1", position: "relative", background: "var(--card-muted)" }}>
        {launch.image ? (
          <img
            src={launch.image}
            alt={launch.name}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        ) : (
          <GradientTile symbol={launch.sym} />
        )}
        <span
          className={`status-pill ${statusInfo.pill}`}
          style={{ position: "absolute", top: 10, left: 10, backdropFilter: "blur(6px)" }}
        >
          {statusInfo.label}
        </span>
      </div>

      {/* Body */}
      <div style={{ padding: "14px 16px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
          <div style={{
            fontSize: 15, fontWeight: 700, letterSpacing: "-0.02em",
            color: "var(--ink)", lineHeight: 1.2, overflow: "hidden",
            textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {launch.name}
          </div>
          <div style={{
            fontFamily: "'Geist Mono', monospace", fontSize: 11, color: "var(--muted)",
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <span>${launch.sym}</span>
            <span style={{ width: 3, height: 3, borderRadius: "50%", background: "var(--muted)" }} />
            <span>{launch.age || "now"}</span>
          </div>
        </div>

        {launch.description && (
          <div style={{
            fontSize: 12, color: "var(--ink-dim)", lineHeight: 1.4,
            display: "-webkit-box",
            WebkitBoxOrient: "vertical",
            WebkitLineClamp: 2,
            overflow: "hidden",
          }}>
            {launch.description}
          </div>
        )}

        {/* Progress bar */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ height: 4, borderRadius: 999, background: "var(--card-muted)", overflow: "hidden" }}>
            <div style={{
              height: "100%", width: `${Math.max(2, progress)}%`,
              background: launch.status === "migrated" ? "linear-gradient(90deg,#10b981,#059669)" : "linear-gradient(90deg,#fb7185,#ec4899)",
              borderRadius: 999, transition: "width 360ms ease",
            }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 11.5 }}>
            <span style={{
              fontFamily: "'Geist Mono', monospace", fontWeight: 700,
              color: "var(--ink-dim)", fontVariantNumeric: "tabular-nums",
            }}>
              {progress.toFixed(progress < 10 ? 2 : 1)}%
            </span>
            <span style={{ color: "var(--muted)", fontWeight: 500 }}>
              {buyers} buyer{buyers === 1 ? "" : "s"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── empty state ──────────────────────────────────────────────────────────────

function EmptyState({ onCreate }) {
  return (
    <div className="card" style={{
      padding: "64px 28px", textAlign: "center",
      display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: 18,
        background: "var(--green-pale)", color: "var(--green)",
        display: "grid", placeItems: "center",
      }}>
        <svg width={26} height={26} viewBox="0 0 24 24" fill="none">
          <path d="M12 2c3.5 3 5 6.5 5 10v4l3 3v2h-6v-2a2 2 0 1 0-4 0v2H4v-2l3-3v-4c0-3.5 1.5-7 5-10Z"
            stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          <circle cx={12} cy={10} r="1.8" fill="currentColor" />
        </svg>
      </div>
      <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--ink)" }}>
        No launches yet
      </div>
      <div style={{ fontSize: 13.5, color: "var(--ink-dim)", maxWidth: 360, lineHeight: 1.5 }}>
        Launch a Raydium LaunchLab token on devnet to see it here. Every launch ships with growth campaigns attached.
      </div>
      <button type="button" className="btn primary" onClick={onCreate} style={{ marginTop: 6 }}>
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
        New launch
      </button>
    </div>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function LaunchesPage() {
  const { registry } = useRegistry();
  const wallet = useWallet();
  const launches = registry.launches || [];
  const [filter, setFilter] = React.useState("all");
  const [showLaunchModal, setShowLaunchModal] = React.useState(false);
  const filters = getLaunchFilters(registry);
  const visible = launches.filter((l) => filter === "all" || l.status === filter);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Launches</h1>
          <div className="sub">Every token you've shipped through Toluva.</div>
        </div>
        <div className="actions">
          <button type="button" className="btn primary" onClick={() => setShowLaunchModal(true)}>
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
            New launch
          </button>
        </div>
      </div>

      {showLaunchModal && (
        <Modal onClose={() => setShowLaunchModal(false)}>
          <NewLaunchForm
            wallet={wallet}
            onClose={() => setShowLaunchModal(false)}
            onLaunched={(result) => {
              setFilter("all");
              setShowLaunchModal(false);
              if (result?.launch?.sym) {
                navigate(`/launches/${encodeURIComponent(result.launch.sym)}`);
              }
            }}
          />
        </Modal>
      )}

      {launches.length === 0 ? (
        <EmptyState onCreate={() => setShowLaunchModal(true)} />
      ) : (
        <>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <FilterDropdown filters={filters} active={filter} onChange={setFilter} />
            <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[12px] text-slate-500">
              <svg width={13} height={13} viewBox="0 0 24 24" fill="none">
                <path d="M3 6h18M6 12h12M10 18h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              Sort: Newest
            </div>
          </div>

          {visible.length > 0 ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
              {visible.map((l) => <LaunchCard key={l.sym} launch={l} />)}
            </div>
          ) : (
            <div className="card" style={{ textAlign: "center", padding: 60, color: "var(--ink-dim)" }}>
              No launches match this filter.
            </div>
          )}
        </>
      )}
    </div>
  );
}
