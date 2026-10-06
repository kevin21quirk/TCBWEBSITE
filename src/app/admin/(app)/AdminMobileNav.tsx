"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { logoutAction } from "@/app/admin/actions";
import AdminNav from "./AdminNav";

export default function AdminMobileNav({
  isSuperAdmin,
  userName,
  roleLabel,
}: {
  isSuperAdmin: boolean;
  userName: string;
  roleLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => setMounted(true), []);
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition-colors hover:border-brand hover:text-brand"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
          <path d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z" />
        </svg>
      </button>

      {/* portalled to body: the sticky header's backdrop-blur would otherwise
          trap these fixed elements inside the header's 64px box */}
      {mounted &&
        createPortal(
          <>
            <div
              onClick={() => setOpen(false)}
              className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 lg:hidden ${
                open ? "opacity-100" : "pointer-events-none opacity-0"
              }`}
            />
            <div
              className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col bg-ink transition-transform duration-300 lg:hidden ${
                open ? "translate-x-0" : "-translate-x-full"
              }`}
            >
              <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
                <div className="flex items-center gap-3">
                  <Image
                    src="/images/tcb-logo-2.png"
                    alt="The Contractor Broker"
                    width={300}
                    height={90}
                    className="h-8 w-auto rounded bg-white px-1.5 py-0.5"
                  />
                  <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                    CRM
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close menu"
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                    <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" />
                  </svg>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                <AdminNav isSuperAdmin={isSuperAdmin} />
              </div>

              <div className="border-t border-white/10 p-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand to-orange-500 text-sm font-bold text-white">
                    {userName.charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">
                      {userName}
                    </p>
                    <p className="truncate text-xs text-slate-400">{roleLabel}</p>
                  </div>
                </div>
                <Link
                  href="/"
                  className="mt-3 block rounded-lg border border-white/15 py-2 text-center text-xs font-semibold uppercase tracking-widest text-slate-300 transition-colors hover:border-brand hover:text-white"
                >
                  View Website
                </Link>
                <form action={logoutAction} className="mt-2">
                  <button
                    type="submit"
                    className="w-full rounded-lg border border-white/15 py-2 text-xs font-semibold uppercase tracking-widest text-slate-300 transition-colors hover:border-brand hover:text-white"
                  >
                    Sign Out
                  </button>
                </form>
              </div>
            </div>
          </>,
          document.body
        )}
    </div>
  );
}
