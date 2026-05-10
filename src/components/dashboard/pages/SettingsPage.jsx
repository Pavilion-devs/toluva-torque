import React from "react";
import useWallet from "../useWallet";
import { useRegistry } from "../../../lib/launchRegistry";

function FormRow({ label, hint, children }) {
  return (
    <div
      className="grid items-start gap-6 py-5"
      style={{ gridTemplateColumns: "minmax(180px, 240px) 1fr", borderTop: "1px solid var(--line)" }}
    >
      <div>
        <div className="text-[14px] font-semibold tracking-tight text-slate-900">{label}</div>
        {hint && <div className="mt-1 text-[12.5px] text-slate-500">{hint}</div>}
      </div>
      <div>{children}</div>
    </div>
  );
}

function TextInput({ defaultValue, mono, ...rest }) {
  return (
    <input
      defaultValue={defaultValue}
      className={`w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[14px] text-slate-900 outline-none transition-colors focus:border-pink-300 focus:ring-2 focus:ring-pink-100 ${
        mono ? "font-mono" : ""
      }`}
      {...rest}
    />
  );
}

function ToggleRow({ on, label, description }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3.5 transition-colors hover:border-slate-300">
      <span className="relative mt-0.5 inline-block h-5 w-9 shrink-0">
        <span
          className={`absolute inset-0 rounded-full transition-colors ${on ? "bg-pink-500" : "bg-slate-200"}`}
        />
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
            on ? "translate-x-[18px]" : "translate-x-0.5"
          }`}
        />
      </span>
      <span>
        <span className="block text-[13.5px] font-semibold text-slate-900">{label}</span>
        <span className="mt-0.5 block text-[12px] text-slate-500">{description}</span>
      </span>
    </label>
  );
}

export default function SettingsPage() {
  const wallet = useWallet();
  const { registry } = useRegistry();
  const workspace = registry.workspace;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Settings</h1>
          <div className="sub">Workspace, wallet, RPC. Anything that needs configuring lives here.</div>
        </div>
        <div className="actions">
          <button className="btn ghost" type="button">
            Discard
          </button>
          <button className="btn primary" type="button">
            Save changes
          </button>
        </div>
      </div>

      <div className="card">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-pink-500">Workspace</div>
          <h3 style={{ margin: "6px 0 0", fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em" }}>
            How Toluva shows up across your launches
          </h3>
        </div>
        <FormRow label="Workspace name" hint="Shown on every launch page and creator dashboard.">
          <TextInput defaultValue={workspace.name} />
        </FormRow>
        <FormRow label="Default reward asset" hint="Asset Torque pays out by default when a campaign settles.">
          <TextInput defaultValue={workspace.defaultRewardAsset} mono />
        </FormRow>
        <FormRow label="Public profile URL" hint="Where your launches live for the public.">
          <TextInput defaultValue={workspace.publicProfileUrl} mono />
        </FormRow>
      </div>

      <div className="card">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-violet-500">Wallet & RPC</div>
          <h3 style={{ margin: "6px 0 0", fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em" }}>
            Connection to Solana
          </h3>
        </div>
        <FormRow label="Connected wallet" hint="The wallet that signs LaunchLab and campaign transactions.">
          {wallet.connected ? (
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-3">
              <div className="flex items-center gap-3">
                <div
                  className="h-9 w-9 rounded-xl"
                  style={{
                    background:
                      "radial-gradient(circle at 30% 25%, rgba(255,255,255,0.4), transparent 55%), linear-gradient(135deg,#a78bfa,#ec4899)",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3)",
                  }}
                />
                <div>
                  <div className="text-[13.5px] font-semibold text-slate-900">{wallet.walletName}</div>
                  <div className="font-mono text-[11.5px] text-slate-500">{wallet.short}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => wallet.disconnect()}
                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[12px] font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-900"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between rounded-xl border border-dashed border-slate-300 bg-slate-50/40 px-3.5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                  <svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                    <path
                      d="M3 8a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3Z"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    />
                    <path d="M3 10h13a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2H3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </div>
                <div>
                  <div className="text-[13.5px] font-semibold text-slate-900">No wallet connected</div>
                  <div className="text-[11.5px] text-slate-500">Connect a Solana wallet to launch tokens</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => wallet.connect()}
                className="rounded-full px-4 py-2 text-[12px] font-semibold text-white"
                style={{
                  background: "linear-gradient(135deg, #635bff, #ec4899)",
                  boxShadow: "0 6px 16px rgba(236, 72, 153, 0.22)",
                }}
              >
                Connect wallet
              </button>
            </div>
          )}
        </FormRow>
        <FormRow label="RPC endpoint" hint="Devnet for now. Plug in a Helius / Triton URL for mainnet.">
          <TextInput defaultValue={workspace.rpcEndpoint} mono />
        </FormRow>
        <FormRow label="Cluster" hint="Toluva is currently devnet-only.">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[12px] text-slate-600">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {workspace.cluster}
          </div>
        </FormRow>
      </div>

      <div className="card">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-indigo-500">Notifications</div>
          <h3 style={{ margin: "6px 0 0", fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em" }}>
            What pings you, and how
          </h3>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <ToggleRow on label="Migration threshold approached" description="Ping me when a launch hits 80% of the bonding curve." />
          <ToggleRow on label="Campaign payouts settled" description="Notify me when Torque pays out winners." />
          <ToggleRow on={false} label="New referral cluster joined" description="Group notification for >5 referrals in a window." />
          <ToggleRow on={false} label="Weekly performance digest" description="Friday rollup of last 7 days across launches." />
        </div>
      </div>
    </div>
  );
}
