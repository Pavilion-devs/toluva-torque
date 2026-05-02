import React from "react";
import { TokenIcon } from "../tokenIcons";
import { useRegistry } from "../../../lib/launchRegistry";

export default function DashboardOverview() {
  const { registry } = useRegistry();
  const launches = registry.launches || [];
  const campaigns = registry.campaigns || [];
  const liveEvents = registry.liveEvents || [];
  const activeCampaigns = campaigns.filter((campaign) => campaign.status === "live").length;
  const migratingLaunches = launches.filter((launch) => launch.status === "bonding" || launch.status === "migrating");
  const pendingMigrations = migratingLaunches.length;
  const averageBonded = Math.round(
    migratingLaunches.reduce((total, launch) => total + launch.bonded, 0) / Math.max(migratingLaunches.length, 1),
  );
  const claimableRewards = liveEvents.filter((event) => event.type === "claim").length;
  const visibleLaunches = launches.filter((launch) => launch.status !== "draft").slice(0, 5);

  React.useEffect(() => {
    const el = document.getElementById("timer");

    if (!el) {
      return undefined;
    }

    let [h, m, s] = el.textContent.split(":").map(Number);
    const intervalId = window.setInterval(() => {
      if (h === 0 && m === 0 && s === 0) {
        return;
      }
      s -= 1;
      if (s < 0) {
        s = 59;
        m -= 1;
      }
      if (m < 0) {
        m = 59;
        h -= 1;
      }
      el.textContent = [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Dashboard</h1>
          <div className="sub">Every launch, every campaign, every claim — in one room.</div>
        </div>
        <div className="actions">
          <button className="btn primary" type="button">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
            New launch
          </button>
          <button className="btn ghost" type="button">
            Attach campaign
          </button>
        </div>
      </div>
      <div className="grid">
        {/* STAT 1 — dark accent */}
        <div className="card stat dark c-stat-1">
          <div className="stat-head">
            <div className="stat-title">Total Launches</div>
            <div className="stat-arrow">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M7 17 17 7M8 7h9v9" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
          <div className="stat-value">{launches.length}</div>
          <div className="stat-foot">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M6 16V8M6 8l-3 3M6 8l3 3M14 5l6 6M14 5v14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            +{launches.filter((launch) => launch.status !== "draft").length} launches this week
          </div>
        </div>
        {/* STAT 2 */}
        <div className="card stat c-stat-2">
          <div className="stat-head">
            <div className="stat-title">Active Campaigns</div>
            <div className="stat-arrow">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M7 17 17 7M8 7h9v9" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
          <div className="stat-value">{activeCampaigns}</div>
          <div className="stat-foot">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Live across {new Set(campaigns.filter((campaign) => campaign.status === "live").map((campaign) => campaign.launch)).size} launches
          </div>
        </div>
        {/* STAT 3 */}
        <div className="card stat c-stat-3">
          <div className="stat-head">
            <div className="stat-title">Pending Migrations</div>
            <div className="stat-arrow">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M7 17 17 7M8 7h9v9" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
          <div className="stat-value">{pendingMigrations}</div>
          <div className="stat-foot">
            <svg viewBox="0 0 24 24" fill="none">
              <circle cx={12} cy={12} r={9} stroke="currentColor" strokeWidth="1.8" />
              <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            Avg {averageBonded}% to threshold
          </div>
        </div>
        {/* STAT 4 */}
        <div className="card stat c-stat-4">
          <div className="stat-head">
            <div className="stat-title">Claimable Rewards</div>
            <div className="stat-arrow">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M7 17 17 7M8 7h9v9" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
          <div className="stat-value">{claimableRewards}</div>
          <div className="stat-foot">
            <svg viewBox="0 0 24 24" fill="none">
              <circle cx={12} cy={12} r={3} fill="currentColor" />
              <circle cx={12} cy={12} r={8} stroke="currentColor" strokeWidth="1.6" opacity=".5" />
            </svg>
            Eligible across {activeCampaigns} campaigns
          </div>
        </div>
        {/* PROJECT ANALYTICS */}
        <div className="card c-analytics">
          <div className="analytics-head">
            <h3>Buy Volume This Week</h3>
            <div className="menu" aria-label="More">
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <circle cx={5} cy={12} r="1.6" fill="currentColor" />
                <circle cx={12} cy={12} r="1.6" fill="currentColor" />
                <circle cx={19} cy={12} r="1.6" fill="currentColor" />
              </svg>
            </div>
          </div>
          <div className="chart">
            <div className="bar-wrap"><div className="bar" style={{ height: "55%" }} /><div className="bar-label">S</div></div>
            <div className="bar-wrap"><div className="bar on" style={{ height: "62%" }} /><div className="bar-label">M</div></div>
            <div className="bar-wrap"><div className="bar on" style={{ height: "48%" }} /><div className="bar-label">T</div></div>
            <div className="bar-wrap"><div className="bar peak" style={{ height: "92%" }}><div className="peak-label">+58 SOL</div></div><div className="bar-label">W</div></div>
            <div className="bar-wrap"><div className="bar" style={{ height: "70%" }} /><div className="bar-label">T</div></div>
            <div className="bar-wrap"><div className="bar" style={{ height: "44%" }} /><div className="bar-label">F</div></div>
            <div className="bar-wrap"><div className="bar" style={{ height: "60%" }} /><div className="bar-label">S</div></div>
          </div>
        </div>
        {/* REMINDERS */}
        <div className="card c-reminder">
          <div className="rem-head">
            <h4>Next milestone</h4>
            <span className="more">
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                <circle cx={5} cy={12} r="1.5" fill="currentColor" />
                <circle cx={12} cy={12} r="1.5" fill="currentColor" />
                <circle cx={19} cy={12} r="1.5" fill="currentColor" />
              </svg>
            </span>
          </div>
          <div className="rem-title">
            Migration sprint
            <br />
            closes — VERDE
          </div>
          <div className="rem-time">
            <svg viewBox="0 0 24 24" fill="none">
              <circle cx={12} cy={12} r={9} stroke="currentColor" strokeWidth="1.8" />
              <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            Closes in 4h 12m
          </div>
          <button className="rem-btn" type="button">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              <circle cx={12} cy={12} r={3} stroke="currentColor" strokeWidth="1.8" />
            </svg>
            Open campaign
          </button>
        </div>
        {/* PROJECT LIST */}
        <div className="card c-project">
          <div className="plist-head">
            <h3>Your launches</h3>
            <button className="plist-new" type="button">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
              New
            </button>
          </div>
          <div className="plist">
            {visibleLaunches.map((launch) => (
              <div key={launch.sym} className="p-item">
                <TokenIcon symbol={launch.sym} size={34} />
                <div className="p-body">
                  <div className="p-name">{launch.sym}</div>
                  <div className="p-meta">
                    {launch.status === "migrated" ? "Migrated · Raydium AMM" : `LaunchLab · Bonded ${launch.bonded}%`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* TEAM COLLABORATION */}
        <div className="card c-team">
          <div className="team-head">
            <h3>Recent activity</h3>
            <button className="add-member" type="button">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
              New campaign
            </button>
          </div>
          <div className="team-list">
            <div className="team-row">
              <div className="t-avatar a1">EB</div>
              <div className="t-body">
                <div className="t-name">Early Buyer Leaderboard</div>
                <div className="t-task">
                  Top 10 paid out · <b>OKRA</b> · 12m ago
                </div>
              </div>
              <span className="status-pill completed">Paid</span>
            </div>
            <div className="team-row">
              <div className="t-avatar a2">RR</div>
              <div className="t-body">
                <div className="t-name">Referral Raffle</div>
                <div className="t-task">
                  8 valid referrers · <b>VERDE</b> · 28m ago
                </div>
              </div>
              <span className="status-pill progress">Live</span>
            </div>
            <div className="team-row">
              <div className="t-avatar a3">MS</div>
              <div className="t-body">
                <div className="t-name">Migration Sprint</div>
                <div className="t-task">
                  <b>HOTSOL</b> crossed threshold · 41m ago
                </div>
              </div>
              <span className="status-pill completed">Triggered</span>
            </div>
            <div className="team-row">
              <div className="t-avatar a4">RR</div>
              <div className="t-body">
                <div className="t-name">Referral Raffle</div>
                <div className="t-task">
                  12 new clicks · <b>NEBL</b> · 1h 04m ago
                </div>
              </div>
              <span className="status-pill progress">Live</span>
            </div>
          </div>
        </div>
        {/* PROGRESS GAUGE */}
        <div className="card c-progress">
          <div className="gauge-head">
            <h3>Migration Progress</h3>
            <div className="menu">
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <circle cx={5} cy={12} r="1.5" fill="currentColor" />
                <circle cx={12} cy={12} r="1.5" fill="currentColor" />
                <circle cx={19} cy={12} r="1.5" fill="currentColor" />
              </svg>
            </div>
          </div>
          <div className="gauge-wrap">
            <svg width={220} height={140} viewBox="0 0 220 140">
              <defs>
                <pattern id="gaugeStripe" patternUnits="userSpaceOnUse" width={6} height={6} patternTransform="rotate(45)">
                  <rect width={6} height={6} fill="#f7f8fb" />
                  <rect width={3} height={6} fill="#fce7f3" />
                </pattern>
              </defs>
              <path d="M 20 120 A 90 90 0 0 1 200 120" fill="none" stroke="url(#gaugeStripe)" strokeWidth={26} strokeLinecap="round" />
              <path d="M 20 120 A 90 90 0 0 1 184 64" fill="none" stroke="#ec4899" strokeWidth={26} strokeLinecap="round" />
              <path d="M 20 120 A 90 90 0 0 1 184 64" fill="none" stroke="#fb7185" strokeWidth={16} strokeLinecap="round" />
            </svg>
            <div className="gauge-value">
            <div className="pct">{averageBonded}%</div>
              <div className="lbl">Across active launches</div>
            </div>
          </div>
          <div className="gauge-legend">
            <div className="lg"><span className="sw c" />Bonded</div>
            <div className="lg"><span className="sw p" />Migrating</div>
            <div className="lg"><span className="sw pd" />Stalled</div>
          </div>
        </div>
        {/* TIME TRACKER */}
        <div className="card dark tracker c-tracker">
          <h3>Campaign Countdown</h3>
          <div className="time" id="timer">
            04:12:36
          </div>
          <div className="tracker-ctrls">
            <button className="ctrl pause" aria-label="Pause">
              <svg viewBox="0 0 24 24" fill="none">
                <rect x={7} y={5} width="3.5" height={14} rx={1} fill="currentColor" />
                <rect x="13.5" y={5} width="3.5" height={14} rx={1} fill="currentColor" />
              </svg>
            </button>
            <button className="ctrl stop" aria-label="Stop">
              <svg viewBox="0 0 24 24" fill="none">
                <rect x={6} y={6} width={12} height={12} rx={2} fill="currentColor" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
