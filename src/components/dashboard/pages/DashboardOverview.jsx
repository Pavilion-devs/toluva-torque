import React from "react";
import Link from "../Link";
import { TokenIcon } from "../tokenIcons";
import { getRegistryAnalytics, useRegistry } from "../../../lib/launchRegistry";

const lamportsPerSol = 1_000_000_000;

function numeric(value) {
  const next = Number(value);
  return Number.isFinite(next) ? next : 0;
}

function shortAddress(value) {
  const text = String(value || "");
  return text.length > 12 ? `${text.slice(0, 5)}...${text.slice(-4)}` : text;
}

function formatSol(value) {
  const amount = numeric(value);

  if (amount === 0) {
    return "0 SOL";
  }

  if (amount < 0.001) {
    return `${amount.toFixed(6)} SOL`;
  }

  if (amount < 1) {
    return `${amount.toFixed(5).replace(/0+$/, "").replace(/\.$/, "")} SOL`;
  }

  return `${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })} SOL`;
}

function formatPct(value) {
  const pct = Math.max(0, Math.min(100, numeric(value)));

  if (pct > 0 && pct < 0.01) {
    return "<0.01%";
  }

  if (pct < 1) {
    return `${pct.toFixed(3).replace(/0+$/, "").replace(/\.$/, "")}%`;
  }

  if (pct < 10) {
    return `${pct.toFixed(2).replace(/0+$/, "").replace(/\.$/, "")}%`;
  }

  return `${Math.round(pct)}%`;
}

function parseDate(value) {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
}

function formatUptime(ms) {
  if (ms <= 0) return "00:00:00";
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

function gaugeArcEnd(pct) {
  const angle = (1 - Math.max(0, Math.min(100, pct)) / 100) * Math.PI;
  return {
    x: +(110 + 90 * Math.cos(angle)).toFixed(2),
    y: +(120 - 90 * Math.sin(angle)).toFixed(2),
  };
}

function formatRelative(value, now) {
  const date = parseDate(value);

  if (!date) {
    return "not recorded";
  }

  const elapsed = Math.max(0, now.getTime() - date.getTime());
  const totalSeconds = Math.floor(elapsed / 1000);

  if (totalSeconds < 60) {
    return `${totalSeconds}s ago`;
  }

  const minutes = Math.floor(totalSeconds / 60);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }

  return `${Math.floor(hours / 24)}d ago`;
}

function poolProgress(launch) {
  const pool = launch?.raydium?.livePool;
  const realB = numeric(pool?.realB);
  const totalFundRaisingB = numeric(pool?.totalFundRaisingB);

  if (totalFundRaisingB > 0) {
    return (realB / totalFundRaisingB) * 100;
  }

  return numeric(launch?.bonded);
}

function poolRaisedSol(launch) {
  const pool = launch?.raydium?.livePool;
  return numeric(pool?.realB) / lamportsPerSol;
}

function poolTargetSol(launch) {
  const pool = launch?.raydium?.livePool;
  return numeric(pool?.totalFundRaisingB) / lamportsPerSol;
}

function eventAmountSol(event) {
  const raw = numeric(event?.payload?.amount ?? event?.torqueRequest?.data?.amount);
  return raw >= 1_000_000 ? raw / lamportsPerSol : raw;
}

function torqueStatus(event) {
  return event?.torqueReceipt?.status || (event?.status === "emitted" ? "ACCEPTED" : event?.status || "recorded");
}

function EmptyCard({ title, detail }) {
  return (
    <div style={{ padding: 28, color: "var(--ink-dim)" }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)" }}>{title}</div>
      <div style={{ marginTop: 8, fontSize: 13, lineHeight: 1.5 }}>{detail}</div>
    </div>
  );
}

function ActivityRow({ event, now }) {
  const status = torqueStatus(event);
  const isAccepted = status === "ACCEPTED";
  const txSignature = event?.payload?.txSignature || event?.torqueRequest?.data?.tx_signature;
  const amount = event.type === "buy_completed" || event.type === "first_buy_completed" ? formatSol(eventAmountSol(event)) : null;

  return (
    <div className="team-row">
      <div className="t-avatar a1">{String(event.type || "EV").slice(0, 2).toUpperCase()}</div>
      <div className="t-body">
        <div className="t-name">{String(event.type || "event").replaceAll("_", " ")}</div>
        <div className="t-task">
          {event.token ? <b>{String(event.token).toUpperCase()}</b> : "No token"} · {formatRelative(event.createdAt, now)}
        </div>
        <div className="t-extra">
          {amount ? <span>{amount}</span> : null}
          {txSignature ? <span className="mono">{shortAddress(txSignature)}</span> : null}
          {event.torqueReceipt?.ingestionId ? <span className="mono">{shortAddress(event.torqueReceipt.ingestionId)}</span> : null}
        </div>
      </div>
      <span className={`status-pill ${isAccepted ? "completed" : "pending"}`}>
        {status.toLowerCase()}
      </span>
    </div>
  );
}

export default function DashboardOverview() {
  const { registry } = useRegistry();
  const [now, setNow] = React.useState(() => new Date());

  React.useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const launches = registry.launches || [];
  const campaigns = registry.campaigns || [];
  const events = registry.eventReceipts || [];
  const analytics = getRegistryAnalytics(registry);
  const activeCampaigns = campaigns.filter((campaign) => campaign.status === "live").length;
  const raydiumLaunches = launches.filter((launch) => launch.raydium?.poolId);
  const liveRaydiumLaunches = raydiumLaunches.filter((launch) => launch.raydium?.liveStatus === "pool_read");
  const acceptedEvents = events.filter((event) => torqueStatus(event) === "ACCEPTED");
  const buyEvents = events.filter((event) => event.type === "buy_completed" || event.type === "first_buy_completed");
  const totalBuySol = buyEvents.reduce((total, event) => total + eventAmountSol(event), 0);
  const migrationLaunch = raydiumLaunches[0] || launches[0] || null;
  const migrationProgress = poolProgress(migrationLaunch);
  const visibleMigrationProgress = migrationProgress > 0 ? Math.max(0.8, Math.min(100, migrationProgress)) : 0;
  const raisedSol = poolRaisedSol(migrationLaunch);
  const targetSol = poolTargetSol(migrationLaunch);
  const firstLaunchAt = launches.reduce((oldest, launch) => {
    const createdAt = parseDate(launch.createdAt);
    if (!createdAt) return oldest;
    return !oldest || createdAt < oldest ? createdAt : oldest;
  }, null);
  const latestEvent = events[0] || null;
  const uptimeDisplay = formatUptime(firstLaunchAt ? now.getTime() - firstLaunchAt.getTime() : 0);
  const latestEventMs = latestEvent ? parseDate(latestEvent.createdAt)?.getTime() : null;
  const heartbeatAgeSec = latestEventMs ? Math.round((now.getTime() - latestEventMs) / 1000) : null;
  const healthLabel = heartbeatAgeSec === null
    ? "No pulse"
    : heartbeatAgeSec <= 45
      ? `Online · ${heartbeatAgeSec}s ago`
      : heartbeatAgeSec <= 120
        ? `Stale · ${heartbeatAgeSec}s ago`
        : `Offline · ${Math.round(heartbeatAgeSec / 60)}m ago`;
  const healthTone = heartbeatAgeSec === null || heartbeatAgeSec > 120
    ? "rgba(240, 140, 150, 0.85)"
    : heartbeatAgeSec <= 45
      ? "rgba(130, 230, 170, 0.95)"
      : "rgba(255, 195, 120, 0.9)";
  const visibleLaunches = launches.slice(0, 5);
  const visibleEvents = events.slice(0, 5);
  const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
  const volumeMap = Object.fromEntries(analytics.volumeSeries.map((p) => [p.date, p.value]));
  const sevenDayWindow = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(now.getDate() - (6 - i));
    const key = d.toISOString().slice(0, 10);
    return { date: key, value: volumeMap[key] || 0, dayLabel: DAY_LABELS[d.getDay()] };
  });
  const maxVolume = Math.max(...sevenDayWindow.map((p) => p.value), 0);

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
            <div className="stat-arrow">
              <svg viewBox="0 0 24 24" fill="none"><path d="M7 17L17 7M17 7H7M17 7v10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
          </div>
          <div className="stat-value">{launches.length}</div>
          <div className="stat-foot">Records written by the local API</div>
        </div>

        <div className="card stat c-stat-2">
          <div className="stat-head">
            <div className="stat-title">Raydium Pools</div>
            <div className="stat-arrow">
              <svg viewBox="0 0 24 24" fill="none"><path d="M7 17L17 7M17 7H7M17 7v10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
          </div>
          <div className="stat-value">{liveRaydiumLaunches.length}</div>
          <div className="stat-foot">{raydiumLaunches.length} pool-backed launch{raydiumLaunches.length === 1 ? "" : "es"}</div>
        </div>

        <div className="card stat c-stat-3">
          <div className="stat-head">
            <div className="stat-title">Torque Events</div>
            <div className="stat-arrow">
              <svg viewBox="0 0 24 24" fill="none"><path d="M7 17L17 7M17 7H7M17 7v10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
          </div>
          <div className="stat-value">{acceptedEvents.length}</div>
          <div className="stat-foot">Torque accepted receipts</div>
        </div>

        <div className="card stat c-stat-4">
          <div className="stat-head">
            <div className="stat-title">Active Campaigns</div>
            <div className="stat-arrow">
              <svg viewBox="0 0 24 24" fill="none"><path d="M7 17L17 7M17 7H7M17 7v10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
          </div>
          <div className="stat-value">{activeCampaigns}</div>
          <div className="stat-foot">Real campaign records</div>
        </div>

        <div className="card c-analytics">
          <div className="analytics-head">
            <h3>Buy Volume Events · last 7 days</h3>
            <div className="menu" style={{ marginLeft: "auto", color: "var(--muted)", cursor: "pointer", padding: "6px 8px", borderRadius: 8 }}>
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <circle cx="5" cy="12" r="1.6" fill="currentColor" />
                <circle cx="12" cy="12" r="1.6" fill="currentColor" />
                <circle cx="19" cy="12" r="1.6" fill="currentColor" />
              </svg>
            </div>
          </div>
          <div className="chart">
            {sevenDayWindow.map((point) => (
              <div className="bar-wrap" key={point.date}>
                <div
                  className={`bar${point.value > 0 ? " on" : ""}`}
                  style={{ height: `${point.value > 0 ? Math.max(10, Math.round((point.value / Math.max(maxVolume, 1)) * 100)) : 14}%` }}
                >
                  {point.value === maxVolume && maxVolume > 0 ? <div className="peak-label">{formatSol(point.value)}</div> : null}
                </div>
                <div className="bar-label">{point.dayLabel}</div>
              </div>
            ))}
          </div>
          <div style={{ padding: "0 4px 4px", fontSize: 12, color: "var(--ink-dim)", letterSpacing: "-0.01em" }}>
            {formatSol(totalBuySol)} total this week
          </div>
        </div>

        <div className="card c-reminder">
          <div className="rem-head">
            <h4>Next milestone</h4>
          </div>
          <div className="rem-title">
            {migrationLaunch ? "Move toward migration" : "No active launch yet"}
          </div>
          <div className="rem-time">
            {migrationLaunch
              ? `${migrationLaunch.sym} · ${formatSol(raisedSol)} raised of ${formatSol(targetSol)}`
              : "Create a devnet LaunchLab token"}
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
                  <div className="p-meta">
                    {launch.raydium?.poolId
                      ? `${formatPct(poolProgress(launch))} · ${launch.buyers || 0} buyer${Number(launch.buyers || 0) === 1 ? "" : "s"}`
                      : launch.status}
                  </div>
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
              <ActivityRow key={event.id} event={event} now={now} />
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
              <defs>
                <pattern id="migrationStripe" patternUnits="userSpaceOnUse" width={6} height={6} patternTransform="rotate(45)">
                  <rect width={6} height={6} fill="#f1f3ee" />
                  <rect width={3} height={6} fill="#e8eae5" />
                </pattern>
              </defs>
              <path d="M 20 120 A 90 90 0 0 1 200 120" fill="none" stroke="url(#migrationStripe)" strokeWidth={26} strokeLinecap="round" />
              {visibleMigrationProgress > 0 && (() => {
                const end = gaugeArcEnd(visibleMigrationProgress);
                const large = visibleMigrationProgress > 50 ? 1 : 0;
                return (
                  <>
                    <path d={`M 20 120 A 90 90 0 ${large} 1 ${end.x} ${end.y}`} fill="none" stroke="#831843" strokeWidth={26} strokeLinecap="round" />
                    <path d={`M 20 120 A 90 90 0 ${large} 1 ${end.x} ${end.y}`} fill="none" stroke="#ec4899" strokeWidth={16} strokeLinecap="round" />
                  </>
                );
              })()}
            </svg>
            <div className="gauge-value">
              <div className="pct">{formatPct(migrationProgress)}</div>
              <div className="lbl">{migrationLaunch ? `${migrationLaunch.sym} live pool` : "No pool yet"}</div>
            </div>
          </div>
          <div className="gauge-legend">
            <span className="lg"><span className="sw c" />{formatSol(raisedSol)} raised</span>
            <span className="lg"><span className="sw p" />{formatSol(targetSol)} target</span>
          </div>
        </div>

        <div className="card dark tracker c-tracker">
          <h3>Uptime</h3>
          <div className="time">{uptimeDisplay}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: healthTone, marginTop: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor", boxShadow: "0 0 6px currentColor", flexShrink: 0 }} />
            {healthLabel}
          </div>
        </div>
      </div>
    </div>
  );
}
