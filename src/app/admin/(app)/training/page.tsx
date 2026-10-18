import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { lessonDur } from "./data";
import { LESSONS, getLesson } from "./lessons";
import TrainingPlayer from "./TrainingPlayer";

export const metadata = { title: "Training" };
export const dynamic = "force-dynamic";

const glass = "glass rounded-2xl";

const ICONS: Record<string, string> = {
  dashboard: "M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z",
  leads: "M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z",
  "lead-detail": "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z",
  pipeline: "M3 3h5v18H3V3zm6.5 0h5v12h-5V3zM16 3h5v8h-5V3z",
  radar: "M12 2a10 10 0 1 0 9.54 7h-2.06A8 8 0 1 1 12 4V2zm0 4a6 6 0 1 0 5.66 4H12V6zm0 3a1 1 0 1 0 0 2 1 1 0 0 0 0-2z",
  prospecting: "M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14zM8.34 17.34V10H5.9v7.34h2.44zM7.12 8.98a1.42 1.42 0 1 0 0-2.84 1.42 1.42 0 0 0 0 2.84z",
  outreach: "M2.01 21L23 12 2.01 3 2 10l15 2-15 2z",
  calendar: "M19 3h-1V1h-2v2H8V1H6v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm0 16H5V9h14v10z",
  reports: "M5 9.2h3V19H5V9.2zM10.6 5h2.8v14h-2.8V5zm5.6 8H19v6h-2.8v-6z",
  admin: "M12 12.75c1.63 0 3.07.39 4.24.9 1.08.48 1.76 1.56 1.76 2.73V18H6v-1.61c0-1.18.68-2.26 1.76-2.73 1.17-.52 2.61-.91 4.24-.91zM12 6c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3z",
};

export default async function TrainingPage({
  searchParams,
}: {
  searchParams: Promise<{ lesson?: string }>;
}) {
  await requireUser();
  const { lesson } = await searchParams;
  const active = getLesson(lesson);

  /* --------------------------- player view --------------------------- */
  if (active) {
    return (
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_280px]">
        <TrainingPlayer
          lesson={active}
          next={(() => {
            const i = LESSONS.indexOf(active);
            const n = LESSONS[i + 1];
            return n ? { href: `/admin/training?lesson=${n.id}`, title: n.title } : undefined;
          })()}
        />
        <div className="space-y-4">
          <div className={`${glass} p-5`}>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">
              Chapters
            </p>
            <ol className="mt-3 space-y-1.5">
              {active.steps.map((s, i) => (
                <li key={i} className="flex items-start gap-2.5 text-xs text-white/70">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-white/10 text-[9px] font-bold text-white/60">
                    {i + 1}
                  </span>
                  <span className="leading-snug">{s.chapter}</span>
                </li>
              ))}
            </ol>
          </div>
          <div className={`${glass} p-5`}>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">
              Try it for real
            </p>
            <p className="mt-2 text-xs leading-relaxed text-white/60">
              Nothing in this walkthrough touches real data. When you&apos;re
              ready, open the actual section and follow the same steps.
            </p>
            <Link
              href={active.liveHref}
              className="mt-3 inline-block rounded-full bg-gradient-to-r from-brand to-brand-light px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-white shadow-lg shadow-brand/30"
            >
              Open this section →
            </Link>
          </div>
          <div className={`${glass} p-5`}>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">
              More lessons
            </p>
            <ul className="mt-3 space-y-1">
              {LESSONS.filter((l) => l.id !== active.id).map((l) => (
                <li key={l.id}>
                  <Link
                    href={`/admin/training?lesson=${l.id}`}
                    className="block rounded-lg px-2.5 py-1.5 text-xs text-white/60 transition-colors hover:bg-white/5 hover:text-white"
                  >
                    {l.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  /* ---------------------------- index view ---------------------------- */
  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-3 text-2xl font-bold text-white">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-orange-500 text-white shadow-lg shadow-brand/40">
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
              <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z" />
            </svg>
          </span>
          Training
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-white/55">
          Guided, animated walkthroughs of every section of the CRM — a
          cursor shows you exactly what to click while captions explain what
          each part does. Watch one, then hit <strong>Open live</strong> to
          try it for real.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {LESSONS.map((l, i) => (
          <Link
            key={l.id}
            href={`/admin/training?lesson=${l.id}`}
            className={`${glass} group p-5 transition-transform duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_-16px_rgba(220,38,38,0.4)]`}
          >
            <div className="flex items-start justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white/80 ring-1 ring-white/15 transition-colors group-hover:bg-brand/20 group-hover:text-brand-light">
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                  <path d={ICONS[l.id] ?? ICONS.dashboard} />
                </svg>
              </span>
              <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-semibold text-white/60">
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-3 w-3 text-brand-light">
                  <path d="M8 5v14l11-7L8 5z" />
                </svg>
                ~{Math.round(lessonDur(l) / 6000) / 10} min
              </span>
            </div>
            <p className="mt-4 text-sm font-bold text-white">{l.title}</p>
            <p className="mt-1.5 text-xs leading-relaxed text-white/55">{l.blurb}</p>
            <p className="mt-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-brand-light">
              {l.steps.length} chapters
              <span className="text-white/25">·</span>
              <span className="text-white/45">Lesson {i + 1}</span>
              <span className="ml-auto text-white/40 transition-transform group-hover:translate-x-1">→</span>
            </p>
          </Link>
        ))}
      </div>

      <div className={`${glass} flex flex-wrap items-center gap-4 p-5`}>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-300 ring-1 ring-emerald-400/30">
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
            <path d="M11 18h2v-2h-2v2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16zm0-14a4 4 0 0 0-4 4h2a2 2 0 0 1 4 0c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5a4 4 0 0 0-4-4z" />
          </svg>
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-white">Safe to explore</p>
          <p className="text-xs text-white/55">
            Walkthroughs run on demo data — nothing you click here changes the
            real CRM. The best order is top-to-bottom, but each lesson stands
            alone.
          </p>
        </div>
        <Link
          href={`/admin/training?lesson=${LESSONS[0].id}`}
          className="rounded-full bg-gradient-to-r from-brand to-brand-light px-5 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-white shadow-lg shadow-brand/30"
        >
          Start with the dashboard →
        </Link>
      </div>
    </div>
  );
}
