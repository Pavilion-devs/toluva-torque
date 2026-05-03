import React from "react";
import "./dashboard.css";
import Link from "./Link";
import useWallet from "./useWallet";
import { useRegistry } from "../../lib/launchRegistry";

const menuLinks = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: (
      <svg viewBox="0 0 24 24" fill="none">
        <rect x={3} y={3} width="7.5" height="7.5" rx={2} stroke="currentColor" strokeWidth="1.8" />
        <rect x="13.5" y={3} width="7.5" height="7.5" rx={2} fill="currentColor" />
        <rect x={3} y="13.5" width="7.5" height="7.5" rx={2} stroke="currentColor" strokeWidth="1.8" />
        <rect x="13.5" y="13.5" width="7.5" height="7.5" rx={2} stroke="currentColor" strokeWidth="1.8" />
      </svg>
    ),
  },
  {
    href: "/launches",
    label: "Launches",
    icon: (
      <svg viewBox="0 0 24 24" fill="none">
        <path d="M9 5H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <rect x={9} y={3} width={6} height={4} rx="1.5" stroke="currentColor" strokeWidth="1.8" />
        <path d="m8 13 2.5 2.5L16 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: "/campaigns",
    label: "Campaigns",
    icon: (
      <svg viewBox="0 0 24 24" fill="none">
        <path d="M12 2 4 6v6c0 5 3.4 9.5 8 10 4.6-.5 8-5 8-10V6l-8-4Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: "/analytics",
    label: "Analytics",
    icon: (
      <svg viewBox="0 0 24 24" fill="none">
        <path d="M4 20V10M10 20V4M16 20v-7M22 20V8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/incentives",
    label: "Incentives",
    icon: (
      <svg viewBox="0 0 24 24" fill="none">
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx={12} cy={12} r={3} stroke="currentColor" strokeWidth="1.8" />
      </svg>
    ),
  },
];

const generalLinks = [
  {
    href: "/settings",
    label: "Settings",
    icon: (
      <svg viewBox="0 0 24 24" fill="none">
        <circle cx={12} cy={12} r={3} stroke="currentColor" strokeWidth="1.8" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    ),
  },
  {
    href: "/help",
    label: "Help",
    icon: (
      <svg viewBox="0 0 24 24" fill="none">
        <circle cx={12} cy={12} r={9} stroke="currentColor" strokeWidth="1.8" />
        <path d="M9.5 9.5a2.5 2.5 0 0 1 5 .3c0 1.7-2.5 1.9-2.5 3.7M12 17h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/",
    label: "Logout",
    icon: (
      <svg viewBox="0 0 24 24" fill="none">
        <path d="M15 17l5-5-5-5M20 12H9M9 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

function NavLink({ href, label, icon, badge, active }) {
  return (
    <Link href={href} className={`sb-link${active ? " active" : ""}`}>
      {icon}
      {label}
      {badge && <span className="sb-badge">{badge}</span>}
    </Link>
  );
}

export default function DashboardLayout({ pathname, children }) {
  const wallet = useWallet();
  const { registry, source, error } = useRegistry();
  const workspace = registry.workspace;
  const dataSourceLabel = source === "api" ? "API data" : "API offline";
  const dataSourceTitle =
    source === "api"
      ? "Dashboard data is loaded from the local API file registry."
      : error || "Dashboard is empty because the local API is unavailable.";
  const links = menuLinks.map((link) =>
    link.href === "/launches" ? { ...link, badge: String((registry.launches || []).length) } : link,
  );

  return (
    <div className="shell" data-screen-label="Dashboard">
      <aside className="sb">
        <Link href="/dashboard" className="brand" aria-label="Toluva home">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M12 2c3.5 3 5 6.5 5 10v4l3 3v2h-6v-2a2 2 0 1 0-4 0v2H4v-2l3-3v-4c0-3.5 1.5-7 5-10Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
              <circle cx={12} cy={10} r="1.8" fill="currentColor" />
            </svg>
          </span>
          <span className="brand-name">Toluva</span>
        </Link>
        <div className="sb-section">Menu</div>
        <nav className="sb-nav">
          {links.map((link) => (
            <NavLink key={link.href} {...link} active={pathname === link.href} />
          ))}
        </nav>
        <div className="sb-section" style={{ marginTop: 22 }}>
          General
        </div>
        <nav className="sb-nav">
          {generalLinks.map((link) => (
            <NavLink key={link.label} {...link} active={pathname === link.href && link.label !== "Logout"} />
          ))}
        </nav>
        <div className="sb-spacer" />
        <div className="promo">
          <div className="promo-ic">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="promo-title">
            Powered by <b>Torque</b>
          </div>
          <div className="promo-sub">Attach growth at launch</div>
          <Link href="/incentives" className="promo-btn" style={{ display: "block", textAlign: "center" }}>
            New campaign
          </Link>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="search">
            <svg viewBox="0 0 24 24" fill="none">
              <circle cx={11} cy={11} r={7} stroke="currentColor" strokeWidth="1.8" />
              <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <input type="text" placeholder="Search launches, campaigns, claims…" />
            <span className="kbd">⌘ F</span>
          </div>
          <div className="tb-right">
            <div
              className={`data-source-pill ${source === "api" ? "api" : "seed"}`}
              title={dataSourceTitle}
              aria-label={`Dashboard source: ${dataSourceLabel}`}
            >
              <span className="source-dot" />
              {dataSourceLabel}
            </div>
            <div className="network-pill" aria-label={`Connected to Solana ${workspace.cluster}`}>
              <span className="ndot" />
              {workspace.cluster}
            </div>
            {wallet.connected ? (
              <button
                type="button"
                className="wallet-chip"
                onClick={() => wallet.disconnect()}
                aria-label="Wallet menu"
              >
                <span className="wavatar" />
                <span className="waddr">{wallet.short}</span>
                <svg className="wcaret" viewBox="0 0 24 24" fill="none">
                  <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            ) : (
              <button
                type="button"
                className="connect-wallet-btn"
                onClick={() => wallet.connect()}
              >
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M3 8a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3Z" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M3 10h13a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2H3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  <circle cx={16.5} cy={12} r="0.9" fill="currentColor" />
                </svg>
                Connect wallet
              </button>
            )}
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}
