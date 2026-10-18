import type { ComponentType, ReactNode } from "react";

/* ------------------------------------------------------------------ */
/*  Lesson model                                                       */
/* ------------------------------------------------------------------ */

export type Typing = { spot: string; text: string; chars: number } | null;

export type Scene = ComponentType<{ variant: string | null; typing?: Typing }>;

export type Step = {
  /** Short label shown in the chapter strip. */
  chapter: string;
  /** On-screen narration — typed out during the step. */
  caption: string;
  /** Step length in ms (leave undefined → computed from caption length). */
  dur?: number;
  /** data-spot value of the element to spotlight. Omit = whole screen. */
  spot?: string;
  /** Center the hotspot vertically inside the frame. */
  scroll?: boolean;
  /** Cursor click ripple at ~60% into the step. */
  click?: boolean;
  /** Type this text into the spotlighted input during the step. */
  type?: string;
  /** Variant string passed to the scene after the click lands. */
  set?: string;
  /** Multi-phase variants: v applies once tIn/dur passes `at` (0–1). Overrides `set`. */
  sets?: { at: number; v: string }[];
};

export type Lesson = {
  id: string;
  nav: string;
  title: string;
  blurb: string;
  /** Opens the real section — "try it live" deep link. */
  liveHref: string;
  scene: Scene;
  steps: Step[];
};

export const stepDur = (s: Step) =>
  s.dur ?? Math.min(10500, Math.max(5200, 3200 + s.caption.length * 52));

export const lessonDur = (l: Lesson) => l.steps.reduce((s, x) => s + stepDur(x), 0);

/* ------------------------------------------------------------------ */
/*  Stage constants                                                    */
/* ------------------------------------------------------------------ */

export const STAGE_W = 1280;
export const STAGE_H = 640;
const CHROME_H = 56;
export const SCENE_H = STAGE_H - CHROME_H;

/* ------------------------------------------------------------------ */
/*  Mock chrome — a mini replica of the real sidebar + quick-launch    */
/*  header so every scene looks like the actual app                    */
/* ------------------------------------------------------------------ */

const NAV: { href: string; label: string; icon: ReactNode }[] = [
  { href: "/admin", label: "Dashboard", icon: <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" /> },
  { href: "/admin/leads", label: "Leads", icon: <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" /> },
  { href: "/admin/pipeline", label: "Pipeline", icon: <path d="M3 3h5v18H3V3zm6.5 0h5v12h-5V3zM16 3h5v8h-5V3z" /> },
  { href: "/admin/radar", label: "Lead Radar", icon: <path d="M12 2a10 10 0 1 0 9.54 7h-2.06A8 8 0 1 1 12 4V2zm0 4a6 6 0 1 0 5.66 4H12V6zm0 3a1 1 0 1 0 0 2 1 1 0 0 0 0-2z" /> },
  { href: "/admin/prospecting", label: "LinkedIn", icon: <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14zM8.34 17.34V10H5.9v7.34h2.44zM7.12 8.98a1.42 1.42 0 1 0 0-2.84 1.42 1.42 0 0 0 0 2.84zm11.22 8.36v-4.03c0-2.16-1.15-3.17-2.7-3.17-1.24 0-1.8.68-2.11 1.16V10h-2.44c.03.69 0 7.34 0 7.34h2.44v-4.1c0-.22.02-.44.08-.6.18-.44.58-.9 1.26-.9.89 0 1.25.68 1.25 1.67v3.93h2.22z" /> },
  { href: "/admin/outreach", label: "Outreach", icon: <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /> },
  { href: "/admin/calendar", label: "Calendar", icon: <path d="M19 3h-1V1h-2v2H8V1H6v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm0 16H5V9h14v10zM5 7V5h14v2H5zm2 4h5v5H7v-5z" /> },
  { href: "/admin/reports", label: "Reports", icon: <path d="M5 9.2h3V19H5V9.2zM10.6 5h2.8v14h-2.8V5zm5.6 8H19v6h-2.8v-6z" /> },
  { href: "/admin/leads/new", label: "Add Lead", icon: <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" /> },
  { href: "/admin/training", label: "Training", icon: <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z" /> },
  { href: "/admin/visitors", label: "Visitors", icon: <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" /> },
  { href: "/admin/users", label: "Team", icon: <path d="M12 12.75c1.63 0 3.07.39 4.24.9 1.08.48 1.76 1.56 1.76 2.73V18H6v-1.61c0-1.18.68-2.26 1.76-2.73 1.17-.52 2.61-.91 4.24-.91zM4 13c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm1.13 1.1c-.37-.06-.74-.1-1.13-.1-.99 0-1.93.21-2.78.58C.48 14.9 0 15.62 0 16.43V18h4.5v-1.61c0-.83.23-1.61.63-2.29zM20 13c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm4 3.43c0-.81-.48-1.53-1.22-1.85-.85-.37-1.79-.58-2.78-.58-.39 0-.76.04-1.13.1.4.68.63 1.46.63 2.29V18H24v-1.57zM12 6c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3z" /> },
];

const QUICK = ["/admin/leads", "/admin/pipeline", "/admin/calendar", "/admin/radar"];

export function AppFrame({
  nav,
  userName = "Kevin",
  children,
}: {
  nav: string;
  userName?: string;
  children: ReactNode;
}) {
  return (
    <div className="holo-theme flex h-full w-full bg-[#070b16] text-white">
      {/* mini sidebar */}
      <div className="glass flex w-[172px] shrink-0 flex-col border-r border-white/10">
        <div className="flex h-[56px] items-center gap-2 border-b border-white/10 px-4">
          <span className="flex h-6 w-9 items-center justify-center rounded bg-white px-1 text-[8px] font-black leading-none text-slate-900">
            TCB
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-white/40">
            CRM
          </span>
        </div>
        <div className="flex-1 space-y-0.5 overflow-hidden p-2">
          {NAV.map((n) => (
            <div
              key={n.href}
              className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[11px] font-medium ${
                n.href === nav
                  ? "bg-gradient-to-r from-brand to-brand-light text-white shadow-lg shadow-brand/30"
                  : "text-white/45"
              }`}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-3 w-3 shrink-0">
                {n.icon}
              </svg>
              <span className="truncate">{n.label}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 border-t border-white/10 p-2.5">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-brand to-orange-500 text-[10px] font-bold text-white">
            {userName.charAt(0)}
          </span>
          <span className="truncate text-[10px] font-semibold text-white/70">{userName}</span>
        </div>
      </div>

      {/* mini header + page */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-[56px] shrink-0 items-center justify-between gap-3 border-b border-white/10 bg-[#070b16]/55 px-4">
          <p className="truncate text-[11px] text-white/50">
            Welcome back, <span className="font-semibold text-white">{userName}</span>
          </p>
          <div className="glass flex items-center gap-1 rounded-full p-1">
            {NAV.filter((n) => QUICK.includes(n.href)).map((q) => (
              <span
                key={q.href}
                className={`flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[10px] font-semibold ${
                  q.href === nav
                    ? "bg-gradient-to-r from-brand to-orange-500 text-white"
                    : "text-white/55"
                }`}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-3 w-3">
                  {q.icon}
                </svg>
                <span className="hidden 2xl:inline">{q.label}</span>
              </span>
            ))}
            <span className="ml-1 flex h-7 w-7 items-center justify-center rounded-full border border-brand-light/50 text-brand-light">
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-3 w-3">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
              </svg>
            </span>
          </div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-white/40">
            View website →
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Shared scene bits                                                  */
/* ------------------------------------------------------------------ */

export const pTitle = "text-[11px] font-bold uppercase tracking-[0.2em] text-white/55";

export function Spot({ id, className = "", children }: { id: string; className?: string; children: ReactNode }) {
  return (
    <div data-spot={id} className={className}>
      {children}
    </div>
  );
}

/** Inline spotlight target (for chips/buttons). */
export function SpotInline({ id, className = "", children }: { id: string; className?: string; children: ReactNode }) {
  return (
    <span data-spot={id} className={`inline-block ${className}`}>
      {children}
    </span>
  );
}

/** Mock input that displays typed characters while the player "types" into it. */
export function Field({
  id,
  placeholder,
  typing,
  className = "",
}: {
  id: string;
  placeholder: string;
  typing?: Typing;
  className?: string;
}) {
  const active = typing && typing.spot === id && typing.chars > 0;
  return (
    <span data-spot={id} className={className}>
      {active ? (
        <span className="text-white">
          {typing.text.slice(0, typing.chars)}
          <span className="ml-px inline-block h-3 w-[2px] animate-pulse bg-white/80 align-middle" />
        </span>
      ) : (
        placeholder
      )}
    </span>
  );
}
