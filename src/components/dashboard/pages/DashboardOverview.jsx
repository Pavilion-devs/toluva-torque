import React from "react";
import Link from "../Link";
import { TokenIcon } from "../tokenIcons";
import { getRegistryAnalytics, useRegistry } from "../../../lib/launchRegistry";

function EmptyCard({ title, detail }) {
  return (
    <div style={{ padding: 28, color: "var(--ink-dim)" }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)" }}>{title}</div>
      <div style={{ marginTop: 8, fontSize: 13, lineHeight: 1.5 }}>{detail}</div>
    </div>
  );
}

function ActivityRow({ event }) {
  return (
    <div className="team-row">
      <div className="t-avatar a1">{String(event.type || "EV").slice(0, 2).toUpperCase()}</div>
      <div className="t-body">
        <div className="t-name">{String(event.type || "event").replaceAll("_", " ")}</div>
        <div className="t-task">
          {event.token ? <b>{String(event.token).toUpperCase()}</b> : "No token"} ·{" "}
          {event.status || "recorded"} · {event.createdAt ? new Date(event.createdAt).toLocaleString() : "just now"}
        </div>
      </div>
      <span className={`status-pill ${event.status === "emitted" ? "completed" : "pending"}`}>
        {event.status || "recorded"}
      </span>
    </div>
  );
}

export default function DashboardOverview() {
  const { registry } = useRegistry();
  const launches = registry.launches || [];
  const campaigns = registry.campaigns || [];
  const events = registry.eventReceipts || [];
  const analytics = getRegistryAnalytics(registry);
  const activeCampaigns = campaigns.filter((campaign) => campaign.status === "live").length;
  const raydiumLaunches = launches.filter((launch) => launch.raydium?.poolId);
  const averageBonded = Math.round(
    launches.reduce((total, launch) => total + Number(launch.bonded || 0), 0) / Math.max(launches.length, 1),
  );
  const visibleLaunches = launches.slice(0, 5);
  const visibleEvents = events.slice(0, 5);
  const maxVolume = Math.max(...analytics.volumeSeries.map((point) => point.value), 0);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Dashboard</h1>
          <div className="sub">Live local API records only. New test launches will appear here after signing.</div>
        </div>
        <div className="actions">
          <Link href="/launches" className="btn primary">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
            New launch
          </Link>
          <Link href="/campaigns" className="btn ghost">
            Campaigns
          </Link>
        </div>
      </div>

      <div className="grid">
        <div className="card stat dark c-stat-1">
          <div className="stat-head">
            <div className="stat-title">Total Launches</div>
          </div>
          <div className="stat-value">{launches.length}</div>
          <div className="stat-foot">Records written by the local API</div>
        </div>

        <div className="card stat c-stat-2">
          <div className="stat-head">
            <div className="stat-title">Raydium Pools</div>
          </div>
          <div className="stat-value">{raydiumLaunches.length}</div>
          <div className="stat-foot">Launches with pool IDs</div>
        </div>

        <div className="card stat c-stat-3">
          <div className="stat-head">
            <div className="stat-title">Torque Events</div>
          </div>
          <div className="stat-value">{events.filter((event) => event.status === "emitted").length}</div>
          <div className="stat-foot">Accepted ingest receipts</div>
        </div>

        <div className="card stat c-stat-4">
          <div className="stat-head">
            <div className="stat-title">Active Campaigns</div>
          </div>
          <div className="stat-value">{activeCampaigns}</div>
          <div className="stat-foot">Real campaign records</div>
        </div>

        <div className="card c-analytics">
          <div className="analytics-head">
            <h3>Buy Volume Events</h3>
          </div>
          {analytics.volumeSeries.length > 0 ? (
            <div className="chart">
              {analytics.volumeSeries.map((point) => (
                <div className="bar-wrap" key={point.date}>
                  <div
                    className="bar on"
                    style={{ height: `${Math.max(8, Math.round((point.value / Math.max(maxVolume, 1)) * 100))}%` }}
                  />
                  <div className="bar-label">{point.date.slice(5)}</div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyCard title="No buy events yet" detail="Buy volume will populate after real Torque buy events are emitted." />
          )}
        </div>

        <div className="card c-reminder">
          <div className="rem-head">
            <h4>Next milestone</h4>
          </div>
          <div className="rem-title">
            {launches.length > 0 ? "Track first real launch" : "No active launch yet"}
          </div>
          <div className="rem-time">
            {launches.length > 0 ? `${launches[0].sym} · ${launches[0].status}` : "Create a devnet LaunchLab token"}
          </div>
          <Link href="/launches" className="rem-btn">
            Open launches
          </Link>
        </div>

        <div className="card c-project">
          <div className="plist-head">
            <h3>Your launches</h3>
            <Link href="/launches" className="plist-new">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
              New
            </Link>
          </div>
          <div className="plist">
            {visibleLaunches.map((launch) => (
              <div key={launch.sym} className="p-item">
                <TokenIcon symbol={launch.sym} size={34} />
                <div className="p-body">
                  <div className="p-name">{launch.sym}</div>
                  <div className="p-meta">{launch.raydium?.poolId ? "Raydium LaunchLab pool" : launch.status}</div>
                </div>
              </div>
            ))}
            {visibleLaunches.length === 0 && (
              <div style={{ color: "var(--ink-dim)", fontSize: 13 }}>No launches recorded yet.</div>
            )}
          </div>
        </div>

        <div className="card c-team">
          <div className="team-head">
            <h3>Recent activity</h3>
          </div>
          <div className="team-list">
            {visibleEvents.map((event) => (
              <ActivityRow key={event.id} event={event} />
            ))}
            {visibleEvents.length === 0 && (
              <div style={{ color: "var(--ink-dim)", fontSize: 13 }}>No Torque event receipts yet.</div>
            )}
          </div>
        </div>

        <div className="card c-progress">
          <div className="gauge-head">
            <h3>Migration Progress</h3>
          </div>
          <div className="gauge-wrap">
            <svg width={220} height={140} viewBox="0 0 220 140">
              <path d="M 20 120 A 90 90 0 0 1 200 120" fill="none" stroke="#f1f5f9" strokeWidth={26} strokeLinecap="round" />
              {averageBonded > 0 && (
                <path d="M 20 120 A 90 90 0 0 1 184 64" fill="none" stroke="#ec4899" strokeWidth={18} strokeLinecap="round" />
              )}
            </svg>
            <div className="gauge-value">
              <div className="pct">{averageBonded}%</div>
              <div className="lbl">Across recorded launches</div>
            </div>
          </div>
        </div>

        <div className="card dark tracker c-tracker">
          <h3>Live Test State</h3>
          <div className="time">{launches.length > 0 ? "READY" : "EMPTY"}</div>
          <div style={{ color: "rgba(255,255,255,0.68)", fontSize: 13 }}>
            {launches.length > 0 ? "Latest launch is stored in the API registry." : "Run a signed devnet launch to populate this workspace."}
          </div>
        </div>
      </div>
    </div>
  );
}
