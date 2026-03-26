"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/goals/create", label: "+ New Goal" },
  { href: "/archive", label: "Badges & Archive" },
];

export default function Navbar({ username }: { username: string }) {
  const pathname = usePathname();

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-bold text-sky-600 text-lg">
            🎯 <span>GoalTrack</span>
          </Link>
          <div className="hidden sm:flex items-center gap-1">
            {links.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
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
          <span className="text-sm text-gray-500">
            👤 <span className="font-medium text-gray-700">{username}</span>
          </span>
        )}
      </div>
    </nav>
  );
}
