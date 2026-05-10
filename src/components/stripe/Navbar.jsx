import React from "react";

const navLinks = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Templates", href: "#templates" },
  { label: "Docs", href: "#docs" },
];

function BrandMark() {
  return (
    <a
      href="/"
      className="flex min-h-10 items-center gap-2 text-xl font-semibold tracking-tight text-slate-900"
      data-aura-component-name="Navbar"
      aria-label="Toluva home"
    >
      <iconify-icon
        icon="solar:rocket-2-bold"
        classname="text-2xl text-pink-500"
        strokewidth="1.5"
        data-aura-component-name="Navbar"
      />
      <span>Toluva</span>
    </a>
  );
}

function DesktopNav() {
  return (
    <div
      className="hidden items-center gap-6 text-sm font-normal text-slate-600 lg:flex"
      data-aura-component-name="Navbar"
    >
      {navLinks.map(({ label, href }) => (
        <a
          key={label}
          href={href}
          className="flex min-h-10 items-center rounded-full px-2 transition-colors hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2"
          data-aura-component-name="Navbar"
        >
          {label}
        </a>
      ))}
    </div>
  );
}

function NavActions() {
  return (
    <div className="flex items-center gap-4 text-sm font-normal" data-aura-component-name="Navbar">
      <a
        href="/dashboard"
        className="flex min-h-10 items-center gap-2 rounded-full bg-pink-500 px-5 py-2.5 text-white transition-all duration-300 hover:bg-pink-600 hover:shadow-lg hover:shadow-pink-500/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2"
        data-aura-component-name="Navbar"
      >
        Open launchpad
        <iconify-icon
          icon="solar:arrow-right-linear"
          classname="text-lg"
          strokewidth="1.5"
          data-aura-component-name="Navbar"
        />
      </a>
    </div>
  );
}

export default function Navbar() {
  return (
    <nav
      className="fixed left-0 right-0 top-0 z-50 flex w-full justify-center border-b border-slate-200/50 bg-slate-50/80 backdrop-blur-md transition-all duration-300"
      data-aura-component-name="Navbar"
    >
      <div
        className="flex w-full max-w-screen-2xl items-center justify-between px-6 py-4 lg:px-12"
        data-aura-component-name="Navbar"
      >
        <BrandMark />
        <DesktopNav />
        <NavActions />
      </div>
    </nav>
  );
}
