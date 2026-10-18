"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import AdminMobileNav from "./AdminMobileNav";

const QUICK = [
  {
    href: "/admin/leads",
    label: "Leads",
    icon: (
      <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
    ),
  },
  {
    href: "/admin/pipeline",
    label: "Pipeline",
    icon: <path d="M3 3h5v18H3V3zm6.5 0h5v12h-5V3zM16 3h5v8h-5V3z" />,
  },
  {
    href: "/admin/calendar",
    label: "Calendar",
    icon: (
      <path d="M19 3h-1V1h-2v2H8V1H6v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm0 16H5V9h14v10zM5 7V5h14v2H5zm2 4h5v5H7v-5z" />
    ),
  },
  {
    href: "/admin/radar",
    label: "Lead Radar",
    icon: (
      <path d="M12 2a10 10 0 1 0 9.54 7h-2.06A8 8 0 1 1 12 4V2zm0 4a6 6 0 1 0 5.66 4H12V6zm0 3a1 1 0 1 0 0 2 1 1 0 0 0 0-2z" />
    ),
  },
];

/** Sticky dark-glass top bar with a quick-launch strip for the core screens. */
export default function AdminHeader({
  isSuperAdmin,
  userName,
  roleLabel,
}: {
  isSuperAdmin: boolean;
  userName: string;
  roleLabel: string;
}) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-white/10 bg-[#070b16]/55 px-4 backdrop-blur-xl sm:px-6 lg:px-8 [&_button]:border-white/15 [&_button]:text-slate-300">
      <div className="flex min-w-0 items-center gap-3">
        <AdminMobileNav
          isSuperAdmin={isSuperAdmin}
          userName={userName}
          roleLabel={roleLabel}
        />
        <p className="hidden truncate text-sm text-white/55 md:block">
          Welcome back, <span className="font-semibold text-white">{userName}</span>
        </p>
      </div>

      {/* quick launch */}
      <nav
        aria-label="Quick launch"
        className="glass flex items-center gap-1 rounded-full p-1"
      >
        {QUICK.map((q) => {
          const active = pathname.startsWith(q.href);
          return (
            <Link
              key={q.href}
              href={q.href}
              title={q.label}
              className={`group flex h-9 items-center gap-2 rounded-full px-3 text-xs font-semibold transition-all ${
                active
                  ? "bg-gradient-to-r from-brand to-orange-500 text-white shadow-[0_0_18px_-4px_rgba(220,38,38,0.9)]"
                  : "text-white/60 hover:bg-white/10 hover:text-white"
              }`}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 shrink-0">
                {q.icon}
              </svg>
              <span className="hidden xl:inline">{q.label}</span>
            </Link>
          );
        })}
        <Link
          href="/admin/leads/new"
          title="Add lead"
          className="ml-1 flex h-9 w-9 items-center justify-center rounded-full border border-brand-light/50 text-brand-light transition-all hover:bg-brand hover:text-white hover:shadow-[0_0_18px_-4px_rgba(220,38,38,0.9)]"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
          </svg>
        </Link>
      </nav>

      <Link
        href="/"
        className="hidden shrink-0 text-xs font-semibold uppercase tracking-widest text-white/55 transition-colors hover:text-brand-light sm:block"
      >
        View website →
      </Link>
    </header>
  );
}
