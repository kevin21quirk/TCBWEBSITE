"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import AdminMobileNav from "./AdminMobileNav";

/** Sticky top bar. Switches to dark glass on the dashboard's holo scene. */
export default function AdminHeader({
  isSuperAdmin,
  userName,
  roleLabel,
}: {
  isSuperAdmin: boolean;
  userName: string;
  roleLabel: string;
}) {
  const dark = usePathname() === "/admin";

  return (
    <header
      className={`sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b px-4 backdrop-blur-xl transition-colors duration-500 sm:px-6 lg:px-8 ${
        dark
          ? "border-white/10 bg-[#070b16]/60 [&_button]:border-white/15 [&_button]:text-slate-300"
          : "border-slate-200 bg-white/80"
      }`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <AdminMobileNav
          isSuperAdmin={isSuperAdmin}
          userName={userName}
          roleLabel={roleLabel}
        />
        <p className={`truncate text-sm ${dark ? "text-white/55" : "text-slate-500"}`}>
          Welcome back,{" "}
          <span className={`font-semibold ${dark ? "text-white" : "text-ink"}`}>{userName}</span>
        </p>
      </div>
      <Link
        href="/"
        className={`shrink-0 text-xs font-semibold uppercase tracking-widest transition-colors hover:text-brand ${
          dark ? "text-white/55" : "text-slate-500"
        }`}
      >
        View website →
      </Link>
    </header>
  );
}
