"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/dashboard", label: "Bookings" },
  { href: "/dashboard/availability", label: "Hours & days off" },
  { href: "/dashboard/profile", label: "Profile" },
] as const;

export function DashboardNav() {
  const pathname = usePathname();
  return (
    <nav className="mt-6 flex gap-1 overflow-x-auto border-b border-slate-200">
      {TABS.map((t) => {
        const active = pathname === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`-mb-px shrink-0 border-b-2 px-4 py-3 text-sm font-semibold ${active ? "border-accent-600 text-slate-900" : "border-transparent text-slate-500 hover:text-slate-800"}`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
