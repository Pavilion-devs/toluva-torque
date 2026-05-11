import React from "react";
import Link, { navigate } from "../Link";
import { TokenIcon } from "../tokenIcons";
import { refreshRegistry, useRegistry } from "../../../lib/launchRegistry";

const accentMap = {
  pink:   { fg: "#ec4899", bg: "#fce7f3", border: "rgba(236,72,153,0.2)" },
  violet: { fg: "#7c3aed", bg: "#ede9fe", border: "rgba(124,58,237,0.2)" },
  indigo: { fg: "#4f46e5", bg: "#e0e7ff", border: "rgba(79,70,229,0.2)"  },
};

const typeLabel = {
  "early-buyer":      "Early Buyer Leaderboard",
  "referral-raffle":  "Referral Raffle",
  "migration-sprint": "Migration Sprint",
};

function CampaignRow({ campaign }) {
  const a = accentMap[campaign.accent] || accentMap.pink;
  const label = typeLabel[campaign.type] || campaign.type;

  return (
    <div className="data-row" style={{ gridTemplateColumns: "1fr 160px 110px 110px 90px", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
        <TokenIcon symbol={campaign.launch} size={34} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>{label}</div>
          <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 2, fontFamily: "'Geist Mono', monospace" }}>
            ${campaign.launch}
          </div>
        </div>
      </div>
      <div>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px",
          borderRadius: 999, fontSize: 11.5, fontWeight: 600,
          background: a.bg, color: a.fg, border: `1px solid ${a.border}`,
        }}>
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: a.fg }} />
          {campaign.status}
        </span>
      </div>
      <div style={{ fontFamily: "'Geist Mono', monospace", fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>
        {campaign.pool} SOL
      </div>
      <div style={{ fontFamily: "'Geist Mono', monospace", fontSize: 13, color: "var(--ink-dim)" }}>
        {campaign.paid} SOL
      </div>
      <div>
        <button
          type="button"
          onClick={() => navigate(`/incentives`)}
          className="btn ghost"
          style={{ fontSize: 11.5, padding: "5px 12px" }}
        >
          View →
        </button>
      </div>
    </div>
  );
}

export default function CampaignsPage() {
  const { registry, loading } = useRegistry();
  const campaigns = registry.campaigns || [];
  const launches = registry.launches || [];

  const live = campaigns.filter((c) => c.status === "live").length;
  const scheduled = campaigns.filter((c) => c.status === "scheduled").length;
  const ended = campaigns.filter((c) => c.status === "ended").length;

  async function handleRefresh() {
    await refreshRegistry({ force: true });
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Campaigns</h1>
          <div className="sub">Torque incentive campaigns attached to your token launches.</div>
        </div>
        <div className="actions">
          <button className="btn ghost" type="button" onClick={handleRefresh} disabled={loading}>
            {loading ? "Loading…" : "Refresh"}
          </button>
          {launches.length > 0 && (
            <button
              type="button"
              className="btn primary"
              onClick={() => navigate(`/launches/${encodeURIComponent(launches[0].sym)}`)}
            >
              + Attach campaign
            </button>
          )}
        </div>
      </div>

      <div className="grid">
        <div className="card stat dark c-stat-1">
          <div className="stat-head"><div className="stat-title">Live</div></div>
          <div className="stat-value">{live}</div>
          <div className="stat-foot">Active campaigns</div>
        </div>
        <div className="card stat c-stat-2">
          <div className="stat-head"><div className="stat-title">Scheduled</div></div>
          <div className="stat-value">{scheduled}</div>
          <div className="stat-foot">Upcoming epochs</div>
        </div>
        <div className="card stat c-stat-3">
          <div className="stat-head"><div className="stat-title">Ended</div></div>
          <div className="stat-value">{ended}</div>
          <div className="stat-foot">Completed</div>
        </div>
        <div className="card stat c-stat-4">
          <div className="stat-head"><div className="stat-title">Total</div></div>
          <div className="stat-value">{campaigns.length}</div>
          <div className="stat-foot">All campaigns</div>
        </div>
      </div>

      {campaigns.length === 0 ? (
        <div className="card" style={{ padding: 56, textAlign: "center" }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)", marginBottom: 8 }}>No campaigns yet</div>
          <div style={{ fontSize: 13, color: "var(--ink-dim)", marginBottom: 20 }}>
            Open a token launch and click "Attach campaign" to create your first Torque incentive.
          </div>
          {launches.length > 0 && (
            <button
              type="button"
              className="btn primary"
              onClick={() => navigate(`/launches/${encodeURIComponent(launches[0].sym)}`)}
            >
              Go to {launches[0]?.sym} →
            </button>
          )}
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div className="data-table">
            <div className="data-thead" style={{ gridTemplateColumns: "1fr 160px 110px 110px 90px", gap: 16 }}>
              <div>Campaign</div>
              <div>Status</div>
              <div>Pool</div>
              <div>Paid</div>
              <div></div>
            </div>
            <div>
              {campaigns.map((campaign) => (
                <CampaignRow key={campaign.id} campaign={campaign} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
