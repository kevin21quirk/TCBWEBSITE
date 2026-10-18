"use client";

import Link from "next/link";
import AdminMobileNav from "./AdminMobileNav";

/** Sticky dark-glass top bar for the admin shell. */
export default function AdminHeader({
  isSuperAdmin,
  userName,
  roleLabel,
}: {
  isSuperAdmin: boolean;
  userName: string;
  roleLabel: string;
}) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-white/10 bg-[#070b16]/55 px-4 backdrop-blur-xl sm:px-6 lg:px-8 [&_button]:border-white/15 [&_button]:text-slate-300">
      <div className="flex min-w-0 items-center gap-3">
        <AdminMobileNav
          isSuperAdmin={isSuperAdmin}
          userName={userName}
          roleLabel={roleLabel}
        />
        <p className="truncate text-sm text-white/55">
          Welcome back, <span className="font-semibold text-white">{userName}</span>
        </p>
      </div>
      <Link
        href="/"
        className="shrink-0 text-xs font-semibold uppercase tracking-widest text-white/55 transition-colors hover:text-brand-light"
      >
        View website →
      </Link>
    </header>
  );
}
