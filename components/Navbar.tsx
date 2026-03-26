"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const desktopLinks = [
  { href: "/", label: "Dashboard" },
  { href: "/calendar", label: "Calendar" },
  { href: "/goals/create", label: "+ New Goal" },
  { href: "/archive", label: "Badges & Archive" },
];

const mobileLinks = [
  {
    href: "/",
    label: "Home",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7m-9 2v8m4-8v8m-4 0h4" />
      </svg>
    ),
  },
  {
    href: "/calendar",
    label: "Calendar",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    href: "/archive",
    label: "Archive",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 3h14a2 2 0 012 2v2H3V5a2 2 0 012-2zM3 9h18v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9zm6 4h6" />
      </svg>
    ),
  },
];

export default function Navbar({ username }: { username: string }) {
  const pathname = usePathname();

  return (
    <>
      {/* ── Top bar ─────────────────────────────────────────── */}
      <nav className="t-navbar bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="t-navbar-container max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="t-navbar-logo-area flex items-center gap-6">
            <Link href="/" className="t-navbar-logo-link flex items-center gap-2 font-bold text-sky-600 text-lg">
              🎯 <span className="t-navbar-logo-text">GoalTrack</span>
            </Link>
            {/* Desktop links */}
            <div className="t-navbar-links hidden sm:flex items-center gap-1">
              {desktopLinks.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={`t-navbar-link px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    pathname === href
                      ? "bg-sky-50 text-sky-700"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
          {username && (
            <span className="t-navbar-username text-sm text-gray-500">
              👤 <span className="t-navbar-username-text font-medium text-gray-700">{username}</span>
            </span>
          )}
        </div>
      </nav>

      {/* ── Mobile bottom navigation ────────────────────────── */}
      <nav className="t-navbar-mobile sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 safe-area-inset-bottom">
        <div className="t-navbar-mobile-inner flex items-end justify-around px-2 h-16">

          {/* Left two items */}
          {mobileLinks.slice(0, 2).map(({ href, label, icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`t-navbar-mobile-link flex flex-col items-center justify-center gap-0.5 flex-1 h-full pt-2 transition-colors ${
                  active ? "text-sky-600" : "text-gray-400 hover:text-gray-600"
                }`}
              >
                {icon}
                <span className="t-navbar-mobile-link-label text-xs font-medium">{label}</span>
                {active && (
                  <span className="t-navbar-mobile-active-dot absolute bottom-1 w-1 h-1 rounded-full bg-sky-500" />
                )}
              </Link>
            );
          })}

          {/* Center FAB — New Goal */}
          <div className="t-navbar-mobile-fab-wrapper flex flex-col items-center justify-end flex-1 pb-3">
            <Link
              href="/goals/create"
              className="t-navbar-mobile-fab flex items-center justify-center w-14 h-14 rounded-full bg-sky-600 hover:bg-sky-700 active:scale-95 text-white shadow-lg shadow-sky-200 transition-all -translate-y-3"
              aria-label="New Goal"
            >
              <svg className="t-navbar-mobile-fab-icon w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </Link>
            <span className="t-navbar-mobile-fab-label text-xs font-medium text-gray-400 -mt-1">New Goal</span>
          </div>

          {/* Right item */}
          {mobileLinks.slice(2).map(({ href, label, icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`t-navbar-mobile-link flex flex-col items-center justify-center gap-0.5 flex-1 h-full pt-2 transition-colors ${
                  active ? "text-sky-600" : "text-gray-400 hover:text-gray-600"
                }`}
              >
                {icon}
                <span className="t-navbar-mobile-link-label text-xs font-medium">{label}</span>
                {active && (
                  <span className="t-navbar-mobile-active-dot absolute bottom-1 w-1 h-1 rounded-full bg-sky-500" />
                )}
              </Link>
            );
          })}

        </div>
      </nav>
    </>
  );
}
