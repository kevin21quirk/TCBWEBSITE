"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

export type QuickLink = {
  href: string;
  label: string;
  hint: string;
  count?: number | string;
  icon: ReactNode;
};

/** Shown once, straight after login (loginAction redirects to ?welcome=1). */
export default function WelcomeModal(props: { name: string; links: QuickLink[] }) {
  return (
    <Suspense fallback={null}>
      <WelcomeModalInner {...props} />
    </Suspense>
  );
}

function WelcomeModalInner({ name, links }: { name: string; links: QuickLink[] }) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (params.get("welcome") === "1") setOpen(true);
  }, [params]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const close = () => {
    setOpen(false);
    if (params.get("welcome")) router.replace(pathname);
  };

  if (!open) return null;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  // Portalled to body so the page's entrance transform can't trap the overlay.
  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-[#04060d]/70 p-4 backdrop-blur-sm"
      onClick={close}
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-title"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass animate-holo-in relative w-full max-w-2xl overflow-y-auto rounded-3xl p-6 text-white shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9)] sm:p-8 max-h-[calc(100dvh-2rem)]"
      >
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-white/50 transition-colors hover:bg-white/10 hover:text-white"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
            <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        </button>

        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/45">
          {greeting}
        </p>
        <h2 id="welcome-title" className="mt-2 text-3xl font-extrabold tracking-tight">
          Welcome back,{" "}
          <span className="bg-gradient-to-r from-brand-light via-orange-300 to-amber-200 bg-clip-text text-transparent">
            {name.split(" ")[0]}
          </span>
        </h2>
        <p className="mt-1 text-sm text-white/55">Where would you like to start?</p>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {links.map((l, i) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="group animate-holo-in flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 transition-all hover:-translate-y-0.5 hover:border-brand-light/60 hover:bg-white/10 hover:shadow-[0_0_30px_-8px_rgba(239,68,68,0.7)]"
              style={{ ["--delay" as string]: `${120 + i * 70}ms` }}
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-orange-500 text-white shadow-[0_0_18px_-4px_rgba(220,38,38,0.9)]">
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                  {l.icon}
                </svg>
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold">{l.label}</span>
                  {l.count !== undefined && (
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-bold tabular-nums text-white/80">
                      {l.count}
                    </span>
                  )}
                </span>
                <span className="mt-0.5 block truncate text-xs text-white/50">{l.hint}</span>
              </span>
              <span className="text-white/30 transition-all group-hover:translate-x-1 group-hover:text-brand-light">→</span>
            </Link>
          ))}
        </div>

        <button
          type="button"
          onClick={close}
          className="mt-6 w-full rounded-full border border-white/15 py-2.5 text-xs font-semibold uppercase tracking-widest text-white/60 transition-colors hover:border-white/40 hover:text-white"
        >
          Stay on the dashboard
        </button>
      </div>
    </div>,
    document.body
  );
}
