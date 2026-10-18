import Link from "next/link";
import {
  ACTIVITY_STYLES,
  LEAD_STATUSES,
  STATUS_STYLES,
  TEMPERATURE_STYLES,
  dealValue,
  money,
  scoreLead,
  type FollowUp,
  type Lead,
  type LeadStats,
  type LeadStatus,
} from "@/lib/crm";
import { sql } from "@/lib/db";
import { AreaChart, Bars, Donut, Gauge, RankBars } from "./DashboardCharts";
import { CountUp, HoloBackdrop, HoloCard, LiveClock } from "./DashboardFx";

export const metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

const fmt = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});
const dayFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });
const weekdayFmt = new Intl.DateTimeFormat("en-GB", { weekday: "narrow" });

const STATUS_HEX: Record<LeadStatus, string> = {
  new: "#38bdf8",
  contacted: "#fbbf24",
  qualified: "#a78bfa",
  won: "#34d399",
  lost: "#64748b",
};

type Suggestion = {
  level: "urgent" | "warn" | "tip" | "good";
  title: string;
  detail: string;
  href: string;
  cta: string;
};

const LEVEL_STYLES: Record<Suggestion["level"], { ring: string; dot: string; label: string }> = {
  urgent: { ring: "border-red-400/40 bg-red-500/10", dot: "bg-red-400", label: "Act now" },
  warn: { ring: "border-amber-400/30 bg-amber-400/10", dot: "bg-amber-300", label: "Soon" },
  tip: { ring: "border-sky-400/30 bg-sky-400/10", dot: "bg-sky-300", label: "Tip" },
  good: { ring: "border-emerald-400/30 bg-emerald-400/10", dot: "bg-emerald-300", label: "On track" },
};

const panelTitle = "text-[11px] font-bold uppercase tracking-[0.2em] text-white/55";
const linkCta = "text-[11px] font-semibold uppercase tracking-widest text-brand-light transition-colors hover:text-white";

export default async function DashboardPage() {
  const [
    counts,
    recent,
    recentActivity,
    followUps,
    openLeads,
    touchRows,
    weekRows,
    dayRows,
    sourceRows,
    fuCounts,
    pendingFuLeads,
    responseRows,
  ] = await Promise.all([
    sql`SELECT status, count(*)::int AS n FROM leads GROUP BY status`,
    sql`SELECT l.*, u.name AS assignee_name FROM leads l
        LEFT JOIN users u ON u.id = l.assigned_to
        ORDER BY l.created_at DESC LIMIT 7`,
    sql`SELECT a.*, u.name AS user_name, l.name AS lead_name
        FROM lead_activities a
        LEFT JOIN users u ON u.id = a.user_id
        JOIN leads l ON l.id = a.lead_id
        ORDER BY a.created_at DESC LIMIT 7`,
    sql`SELECT f.*, l.name AS lead_name, u.name AS assignee_name
        FROM follow_ups f
        JOIN leads l ON l.id = f.lead_id
        LEFT JOIN users u ON u.id = f.assigned_to
        WHERE f.done = false AND f.due_at < now() + interval '7 days'
        ORDER BY f.due_at LIMIT 7`,
    sql`SELECT l.*,
          (SELECT count(*) FROM lead_activities a WHERE a.lead_id = l.id
            AND a.type NOT IN ('status','assign'))::int AS activity_count,
          (SELECT count(*) FROM lead_activities a WHERE a.lead_id = l.id
            AND a.type IN ('call','meeting','open','click','visit'))::int AS engagement_count,
          (SELECT max(created_at) FROM lead_activities a WHERE a.lead_id = l.id) AS last_activity_at
        FROM leads l WHERE l.status NOT IN ('won','lost')`,
    sql`SELECT count(*)::int AS n FROM lead_activities
        WHERE type IN ('call','email','meeting','linkedin')
          AND created_at > now() - interval '7 days'`,
    sql`SELECT to_char(w, 'YYYY-MM-DD') AS week,
          (SELECT count(*) FROM leads l WHERE l.created_at >= w AND l.created_at < w + interval '7 days')::int AS n,
          (SELECT count(*) FROM leads l WHERE l.status = 'won' AND l.updated_at >= w AND l.updated_at < w + interval '7 days')::int AS won
        FROM generate_series(date_trunc('week', now()) - interval '11 weeks', date_trunc('week', now()), interval '1 week') AS w
        ORDER BY w`,
    sql`SELECT to_char(d, 'YYYY-MM-DD') AS day,
          (SELECT count(*) FROM lead_activities a
             WHERE a.created_at >= d AND a.created_at < d + interval '1 day'
               AND a.type IN ('call','email','meeting','linkedin','note'))::int AS n
        FROM generate_series(date_trunc('day', now()) - interval '13 days', date_trunc('day', now()), interval '1 day') AS d
        ORDER BY d`,
    sql`SELECT source, count(*)::int AS n, count(*) FILTER (WHERE status = 'won')::int AS won
        FROM leads GROUP BY source ORDER BY n DESC LIMIT 6`,
    sql`SELECT count(*) FILTER (WHERE due_at < now())::int AS overdue,
          count(*) FILTER (WHERE due_at >= now() AND due_at < date_trunc('day', now()) + interval '1 day')::int AS today
        FROM follow_ups WHERE done = false`,
    sql`SELECT DISTINCT lead_id FROM follow_ups WHERE done = false`,
    sql`SELECT avg(EXTRACT(EPOCH FROM (first_touch - l2.created_at)) / 3600)::float AS hours
        FROM (SELECT l.created_at,
                (SELECT min(a.created_at) FROM lead_activities a
                  WHERE a.lead_id = l.id AND a.type IN ('call','email','meeting','linkedin')) AS first_touch
              FROM leads l WHERE l.created_at > now() - interval '30 days') l2
        WHERE first_touch IS NOT NULL`,
  ]);

  /* ---------- derived numbers ---------- */

  const byStatus = Object.fromEntries(
    counts.map((c) => [c.status as LeadStatus, c.n as number])
  ) as Partial<Record<LeadStatus, number>>;
  const total = counts.reduce((s, c) => s + (c.n as number), 0);
  const won = byStatus.won ?? 0;
  const lost = byStatus.lost ?? 0;
  const open = total - won - lost;
  const winRate = won + lost ? (won / (won + lost)) * 100 : 0;

  const scored = (openLeads as (Lead & LeadStats)[])
    .map((l) => ({ lead: l, ...scoreLead(l) }))
    .sort((a, b) => b.score - a.score);
  const hot = scored.filter((s) => s.temperature === "hot");
  const pipelineValue = scored.reduce((s, x) => s + dealValue(x.lead), 0);
  const needLinkedin = scored.filter(
    (s) => !s.lead.linkedin_url && s.lead.source !== "newsletter"
  ).length;
  const touchpoints = (touchRows[0]?.n as number) ?? 0;

  const weeks = weekRows as { week: string; n: number; won: number }[];
  const weekLabels = weeks.map((w) => dayFmt.format(new Date(w.week)));
  const thisWeek = weeks.at(-1)?.n ?? 0;
  const lastWeek = weeks.at(-2)?.n ?? 0;
  const weekDelta = lastWeek ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100) : null;

  const days = dayRows as { day: string; n: number }[];
  const dayLabels = days.map((d) => weekdayFmt.format(new Date(d.day)));

  const overdueCount = (fuCounts[0]?.overdue as number) ?? 0;
  const dueToday = (fuCounts[0]?.today as number) ?? 0;
  const hasFollowUp = new Set(pendingFuLeads.map((r) => r.lead_id as number));
  const avgResponse = responseRows[0]?.hours as number | null;

  const now = Date.now();
  const ageDays = (iso: string) => (now - new Date(iso).getTime()) / 864e5;
  const newWaiting = scored.filter(
    (s) => s.lead.status === "new" && ageDays(s.lead.created_at) > 1
  );
  const unassigned = scored.filter((s) => !s.lead.assigned_to);
  const goingCold = scored.filter((s) => {
    if (s.lead.status === "new") return false;
    const last = s.lead.last_activity_at ?? s.lead.last_contacted_at ?? s.lead.created_at;
    return ageDays(last) > 14;
  });
  const hotNoNext = hot.filter((s) => !hasFollowUp.has(s.lead.id));
  const qualifiedNoValue = scored.filter(
    (s) => s.lead.status === "qualified" && !dealValue(s.lead)
  );

  /* ---------- suggestions engine ---------- */

  const suggestions: Suggestion[] = [];
  if (overdueCount)
    suggestions.push({
      level: "urgent",
      title: `${overdueCount} follow-up${overdueCount > 1 ? "s" : ""} overdue`,
      detail: "Promises made to leads have slipped past their due time. Clear these first.",
      href: "/admin/calendar",
      cta: "Open calendar",
    });
  if (newWaiting.length)
    suggestions.push({
      level: "urgent",
      title: `${newWaiting.length} new enquir${newWaiting.length > 1 ? "ies" : "y"} waiting over 24h`,
      detail: "Response time is the biggest driver of conversion. Call or email them today.",
      href: "/admin/leads?status=new",
      cta: "View new leads",
    });
  if (hotNoNext.length)
    suggestions.push({
      level: "warn",
      title: `${hotNoNext.length} hot lead${hotNoNext.length > 1 ? "s have" : " has"} no next step booked`,
      detail: `Highest scorer: ${hotNoNext[0].lead.name} (${hotNoNext[0].score}). Schedule a follow-up so momentum isn't lost.`,
      href: `/admin/leads/${hotNoNext[0].lead.id}`,
      cta: "Book follow-up",
    });
  if (unassigned.length)
    suggestions.push({
      level: "warn",
      title: `${unassigned.length} open lead${unassigned.length > 1 ? "s are" : " is"} unassigned`,
      detail: "Nobody owns these conversations. Assign them so they get worked.",
      href: "/admin/leads",
      cta: "Assign owners",
    });
  if (goingCold.length)
    suggestions.push({
      level: "warn",
      title: `${goingCold.length} lead${goingCold.length > 1 ? "s are" : " is"} going cold`,
      detail: "No touchpoint in 14+ days. A gentle chase email usually revives a third of these.",
      href: "/admin/outreach",
      cta: "Send a chase",
    });
  if (avgResponse != null)
    suggestions.push({
      level: avgResponse <= 24 ? "good" : "tip",
      title: `Average first response: ${avgResponse < 1 ? `${Math.round(avgResponse * 60)} min` : `${avgResponse.toFixed(1)} h`}`,
      detail:
        avgResponse <= 24
          ? "You're inside the 24-hour window over the last 30 days. Keep it up."
          : "Aim for under 24 hours — leads contacted within a day convert far more often.",
      href: "/admin/reports",
      cta: "See reports",
    });
  if (qualifiedNoValue.length)
    suggestions.push({
      level: "tip",
      title: `${qualifiedNoValue.length} qualified lead${qualifiedNoValue.length > 1 ? "s" : ""} missing a deal value`,
      detail: "Add estimated values so the pipeline forecast reflects reality.",
      href: "/admin/pipeline",
      cta: "Open pipeline",
    });
  if (needLinkedin)
    suggestions.push({
      level: "tip",
      title: `${needLinkedin} lead${needLinkedin > 1 ? "s" : ""} without a LinkedIn profile`,
      detail: "Researched leads score higher and give you a second channel for outreach.",
      href: "/admin/prospecting",
      cta: "Start researching",
    });
  if (weekDelta != null)
    suggestions.push({
      level: weekDelta >= 0 ? "good" : "tip",
      title: `Lead flow ${weekDelta >= 0 ? "up" : "down"} ${Math.abs(weekDelta)}% week on week`,
      detail:
        weekDelta >= 0
          ? `${thisWeek} new lead${thisWeek === 1 ? "" : "s"} this week versus ${lastWeek} last week.`
          : `${thisWeek} this week versus ${lastWeek} last week — worth a campaign push.`,
      href: weekDelta >= 0 ? "/admin/reports" : "/admin/outreach",
      cta: weekDelta >= 0 ? "View trend" : "Plan outreach",
    });
  if (!suggestions.length)
    suggestions.push({
      level: "good",
      title: "All clear",
      detail: "No overdue work and every lead has an owner. Time to prospect.",
      href: "/admin/radar",
      cta: "Open Lead Radar",
    });
  const order = { urgent: 0, warn: 1, tip: 2, good: 3 };
  suggestions.sort((a, b) => order[a.level] - order[b.level]);

  /* Focus queue: what to pick up first today */
  const focus = scored
    .map((s) => {
      const reasons: string[] = [];
      if (s.lead.status === "new") reasons.push("fresh enquiry");
      if (hasFollowUp.has(s.lead.id)) reasons.push("follow-up pending");
      if (s.temperature === "hot") reasons.push("hot");
      if (dealValue(s.lead)) reasons.push(money.format(dealValue(s.lead)));
      return { ...s, reasons };
    })
    .slice(0, 5);

  /* ---------- view ---------- */

  const heroStats = [
    {
      label: "Open pipeline",
      value: pipelineValue,
      prefix: "£",
      sub: `${open} open lead${open === 1 ? "" : "s"}`,
      href: "/admin/pipeline",
      glow: "rgba(220,38,38,0.4)",
    },
    {
      label: "Hot leads",
      value: hot.length,
      sub: hotNoNext.length ? `${hotNoNext.length} need a next step` : "all have next steps",
      href: "/admin/leads",
      glow: "rgba(251,146,60,0.4)",
    },
    {
      label: "Touchpoints · 7d",
      value: touchpoints,
      sub: `${dueToday} follow-up${dueToday === 1 ? "" : "s"} due today`,
      href: "/admin/calendar",
      glow: "rgba(56,189,248,0.4)",
    },
    {
      label: "New this week",
      value: thisWeek,
      sub:
        weekDelta == null
          ? "no prior week data"
          : `${weekDelta >= 0 ? "▲" : "▼"} ${Math.abs(weekDelta)}% vs last week`,
      href: "/admin/reports",
      glow: "rgba(167,139,250,0.4)",
    },
  ];

  const sources = (sourceRows as { source: string; n: number; won: number }[]).map((r) => ({
    label: r.source,
    value: r.n,
    sub: r.won ? `${r.won} won` : undefined,
  }));

  return (
    <div className="holo-scene relative -m-4 min-h-[calc(100vh-4rem)] overflow-hidden p-4 text-white sm:-m-6 sm:p-6 lg:-m-8 lg:p-8">
      <HoloBackdrop />

      <div className="relative space-y-6">
        {/* command deck header */}
        <div className="animate-holo-in flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-white/45">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              Live · <LiveClock />
            </p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Command{" "}
              <span className="bg-gradient-to-r from-brand-light via-orange-300 to-amber-200 bg-clip-text text-transparent">
                Deck
              </span>
            </h1>
            <p className="mt-1 text-sm text-white/55">
              {total} leads in the system · {won} won · {money.format(pipelineValue)} in play
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/admin/radar"
              className="glass rounded-full px-5 py-2.5 text-xs font-semibold uppercase tracking-widest text-white/80 transition-colors hover:text-white"
            >
              Lead Radar
            </Link>
            <Link
              href="/admin/leads/new"
              className="rounded-full bg-gradient-to-r from-brand to-orange-500 px-5 py-2.5 text-xs font-semibold uppercase tracking-widest text-white shadow-[0_0_30px_-5px_rgba(220,38,38,0.8)] transition-shadow hover:shadow-[0_0_40px_-2px_rgba(220,38,38,0.9)]"
            >
              + Add Lead
            </Link>
          </div>
        </div>

        {/* hero stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {heroStats.map((s, i) => (
            <HoloCard key={s.label} href={s.href} delay={80 + i * 90} className="group">
              <div
                className="pointer-events-none absolute inset-0 rounded-3xl opacity-70 transition-opacity group-hover:opacity-100"
                style={{ background: `radial-gradient(220px circle at 100% 0%, ${s.glow}, transparent 70%)` }}
              />
              <div className="holo-lift p-5">
                <p className={panelTitle}>{s.label}</p>
                <p className="mt-3 text-4xl font-extrabold leading-none tracking-tight">
                  <CountUp value={s.value} prefix={s.prefix} />
                </p>
                <p className="mt-2 text-xs text-white/50">{s.sub}</p>
                <p className="mt-3 text-[11px] font-semibold uppercase tracking-widest text-brand-light opacity-0 transition-opacity group-hover:opacity-100">
                  Open →
                </p>
              </div>
            </HoloCard>
          ))}
        </div>

        {/* trend + copilot */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
          <HoloCard delay={420} tilt={4} lift={14} className="xl:col-span-3">
            <div className="p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className={panelTitle}>Lead flow · 12 weeks</p>
                  <p className="mt-1 text-2xl font-extrabold">
                    {weeks.reduce((s, w) => s + w.n, 0)}{" "}
                    <span className="text-sm font-medium text-white/45">new leads</span>
                  </p>
                </div>
                <div className="flex gap-4 text-xs">
                  <span className="flex items-center gap-2 text-white/60">
                    <span className="h-2 w-6 rounded-full bg-brand-light shadow-[0_0_10px_#ef4444]" /> New
                  </span>
                  <span className="flex items-center gap-2 text-white/60">
                    <span className="h-2 w-6 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]" /> Won
                  </span>
                </div>
              </div>
              <div className="relative mt-4">
                <AreaChart points={weeks.map((w) => w.n)} labels={weekLabels} />
                <div className="pointer-events-none absolute inset-0 opacity-70">
                  <AreaChart points={weeks.map((w) => w.won)} labels={weekLabels} color="#34d399" />
                </div>
              </div>
            </div>
          </HoloCard>

          <HoloCard delay={500} tilt={4} lift={14} className="xl:col-span-2">
            <div className="flex h-full flex-col p-6">
              <div className="flex items-center justify-between">
                <p className={panelTitle}>Copilot suggestions</p>
                <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-white/60">
                  {suggestions.length} insights
                </span>
              </div>
              <ul className="mt-4 space-y-2.5">
                {suggestions.slice(0, 5).map((s) => {
                  const st = LEVEL_STYLES[s.level];
                  return (
                    <li key={s.title}>
                      <Link
                        href={s.href}
                        className={`group block rounded-2xl border p-3.5 transition-all hover:translate-x-1 hover:bg-white/10 ${st.ring}`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${st.dot} shadow-[0_0_8px_currentColor]`} />
                          <p className="truncate text-sm font-semibold text-white">{s.title}</p>
                          <span className="ml-auto shrink-0 text-[10px] font-semibold uppercase tracking-widest text-white/40">
                            {st.label}
                          </span>
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-white/60">{s.detail}</p>
                        <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-widest text-brand-light opacity-70 transition-opacity group-hover:opacity-100">
                          {s.cta} →
                        </p>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </HoloCard>
        </div>

        {/* pipeline mix / win rate / activity rhythm / sources */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <HoloCard delay={600} href="/admin/pipeline">
            <div className="p-6">
              <p className={panelTitle}>Pipeline mix</p>
              <div className="mt-4 flex items-center justify-center">
                <Donut
                  segments={LEAD_STATUSES.map((s) => ({
                    label: STATUS_STYLES[s].label,
                    value: byStatus[s] ?? 0,
                    color: STATUS_HEX[s],
                  }))}
                >
                  <p className="text-3xl font-extrabold leading-none">{total}</p>
                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-white/50">leads</p>
                </Donut>
              </div>
              <ul className="mt-4 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                {LEAD_STATUSES.map((s) => (
                  <li key={s} className="flex items-center gap-2 text-white/70">
                    <span className="h-2 w-2 rounded-full" style={{ background: STATUS_HEX[s], boxShadow: `0 0 8px ${STATUS_HEX[s]}` }} />
                    {STATUS_STYLES[s].label}
                    <span className="ml-auto tabular-nums text-white/45">{byStatus[s] ?? 0}</span>
                  </li>
                ))}
              </ul>
            </div>
          </HoloCard>

          <HoloCard delay={680} href="/admin/reports">
            <div className="flex h-full flex-col p-6">
              <p className={panelTitle}>Win rate · all time</p>
              <div className="mt-4 flex flex-1 items-center justify-center">
                <Gauge value={winRate} label="closed won" />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-center">
                <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 py-2">
                  <p className="text-xl font-extrabold text-emerald-300">{won}</p>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-white/50">won</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 py-2">
                  <p className="text-xl font-extrabold text-white/80">{lost}</p>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-white/50">lost</p>
                </div>
              </div>
            </div>
          </HoloCard>

          <HoloCard delay={760}>
            <div className="flex h-full flex-col p-6">
              <p className={panelTitle}>Activity rhythm · 14 days</p>
              <p className="mt-1 text-2xl font-extrabold">
                {days.reduce((s, d) => s + d.n, 0)}{" "}
                <span className="text-sm font-medium text-white/45">actions logged</span>
              </p>
              <div className="mt-auto pt-6">
                <Bars values={days.map((d) => d.n)} labels={days.map((d) => dayFmt.format(new Date(d.day)))} />
                <div className="mt-2 flex gap-1.5">
                  {dayLabels.map((l, i) => (
                    <span key={i} className="flex-1 text-center text-[10px] text-white/35">
                      {l}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </HoloCard>

          <HoloCard delay={840}>
            <div className="p-6">
              <p className={panelTitle}>Lead sources</p>
              <div className="mt-5">
                {sources.length ? (
                  <RankBars rows={sources} />
                ) : (
                  <p className="py-8 text-center text-sm text-white/40">No leads yet.</p>
                )}
              </div>
            </div>
          </HoloCard>
        </div>

        {/* focus queue + hottest */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
          <HoloCard delay={920} tilt={3} lift={12} className="xl:col-span-2">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <p className={panelTitle}>Today&apos;s focus queue</p>
                <Link href="/admin/leads" className={linkCta}>All leads →</Link>
              </div>
              <ol className="mt-4 space-y-2">
                {focus.map((f, i) => (
                  <li key={f.lead.id}>
                    <Link
                      href={`/admin/leads/${f.lead.id}`}
                      className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 transition-all hover:translate-x-1 hover:border-white/25 hover:bg-white/10"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-white/15 to-white/5 text-sm font-extrabold text-white/80">
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{f.lead.name}</p>
                        <p className="truncate text-xs text-white/50">
                          {[f.lead.company, ...f.reasons].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ${TEMPERATURE_STYLES[f.temperature].badge}`}>
                        {f.score}
                      </span>
                    </Link>
                  </li>
                ))}
                {!focus.length && (
                  <p className="py-8 text-center text-sm text-white/40">No open leads to work.</p>
                )}
              </ol>
            </div>
          </HoloCard>

          <HoloCard delay={1000} tilt={3} lift={12} className="xl:col-span-3">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <p className={panelTitle}>Hottest leads</p>
                <span className="text-xs text-white/45">{hot.length} scoring 60+ with engagement</span>
              </div>
              {hot.length ? (
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {hot.slice(0, 6).map(({ lead, score }) => (
                    <Link
                      key={lead.id}
                      href={`/admin/leads/${lead.id}`}
                      className="group relative overflow-hidden rounded-2xl border border-red-400/25 bg-gradient-to-br from-red-500/15 to-transparent p-4 transition-all hover:-translate-y-0.5 hover:border-red-300/50"
                    >
                      <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-red-500/30 blur-2xl transition-opacity group-hover:opacity-100" />
                      <div className="relative">
                        <div className="flex items-start justify-between gap-2">
                          <p className="truncate text-sm font-semibold">{lead.name}</p>
                          <span className="shrink-0 rounded-full bg-red-400/20 px-2 py-0.5 text-[10px] font-bold text-red-200 ring-1 ring-red-300/40">
                            {score}
                          </span>
                        </div>
                        <p className="mt-0.5 truncate text-xs text-white/55">
                          {[lead.job_title, lead.company].filter(Boolean).join(" · ") || lead.source}
                        </p>
                        <p className="mt-2 text-xs font-semibold text-white/75">
                          {STATUS_STYLES[lead.status].label}
                          {dealValue(lead) ? ` · ${money.format(dealValue(lead))}` : ""}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="py-10 text-center text-sm text-white/40">
                  No hot leads right now — engage warm leads to heat them up.
                </p>
              )}
            </div>
          </HoloCard>
        </div>

        {/* streams: recent leads / activity / follow-ups */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <HoloCard delay={1080} tilt={3} lift={10}>
            <div className="flex items-center justify-between px-6 pt-6">
              <p className={panelTitle}>Recent leads</p>
              <Link href="/admin/leads" className={linkCta}>View all →</Link>
            </div>
            <div className="mt-3 divide-y divide-white/[0.06] pb-2">
              {(recent as Lead[]).map((l) => (
                <Link
                  key={l.id}
                  href={`/admin/leads/${l.id}`}
                  className="flex items-center justify-between gap-3 px-6 py-3 transition-colors hover:bg-white/5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{l.name}</p>
                    <p className="truncate text-xs text-white/50">{l.email ?? "—"} · {l.source}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                      style={{ color: STATUS_HEX[l.status], background: `${STATUS_HEX[l.status]}22`, boxShadow: `inset 0 0 0 1px ${STATUS_HEX[l.status]}55` }}
                    >
                      {STATUS_STYLES[l.status].label}
                    </span>
                    <span className="text-[10px] text-white/35">{fmt.format(new Date(l.created_at))}</span>
                  </div>
                </Link>
              ))}
              {recent.length === 0 && (
                <p className="px-6 py-10 text-center text-sm text-white/40">
                  No leads yet — they&apos;ll appear here when the website form is submitted.
                </p>
              )}
            </div>
          </HoloCard>

          <HoloCard delay={1160} tilt={3} lift={10}>
            <div className="px-6 pt-6">
              <p className={panelTitle}>Activity stream</p>
            </div>
            <ol className="relative mt-3 space-y-0 pb-4">
              {(recentActivity as { id: number; body: string | null; type: string; user_name: string | null; lead_name: string; created_at: string; lead_id: number }[]).map((a) => (
                <li key={a.id} className="relative flex gap-3 px-6 py-3">
                  <span className="relative mt-1.5 flex h-2 w-2 shrink-0">
                    <span className={`absolute inset-0 rounded-full ${ACTIVITY_STYLES[a.type]?.dot ?? "bg-slate-400"} opacity-60 blur-[3px]`} />
                    <span className={`relative h-2 w-2 rounded-full ${ACTIVITY_STYLES[a.type]?.dot ?? "bg-slate-400"}`} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">
                      <span className="font-semibold">{a.user_name ?? "System"}</span>{" "}
                      <span className="text-white/50">
                        {ACTIVITY_STYLES[a.type]?.verb ? `${ACTIVITY_STYLES[a.type].verb} ·` : "on"}
                      </span>{" "}
                      <Link href={`/admin/leads/${a.lead_id}`} className="font-semibold text-brand-light hover:underline">
                        {a.lead_name}
                      </Link>
                    </p>
                    {a.body && <p className="mt-0.5 line-clamp-2 text-xs text-white/50">{a.body}</p>}
                    <p className="mt-0.5 text-[10px] text-white/35">{fmt.format(new Date(a.created_at))}</p>
                  </div>
                </li>
              ))}
              {recentActivity.length === 0 && (
                <p className="px-6 py-10 text-center text-sm text-white/40">No activity yet.</p>
              )}
            </ol>
          </HoloCard>

          <HoloCard delay={1240} tilt={3} lift={10}>
            <div className="flex items-center justify-between px-6 pt-6">
              <p className={panelTitle}>Follow-ups · next 7 days</p>
              <Link href="/admin/calendar" className={linkCta}>Calendar →</Link>
            </div>
            <div className="mt-3 divide-y divide-white/[0.06] pb-2">
              {(followUps as (FollowUp & { lead_name: string })[]).map((f) => {
                const overdue = new Date(f.due_at).getTime() < now;
                return (
                  <Link
                    key={f.id}
                    href={`/admin/leads/${f.lead_id}`}
                    className="block px-6 py-3 transition-colors hover:bg-white/5"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-sm font-semibold">{f.lead_name}</p>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          overdue
                            ? "bg-red-500/20 text-red-200 ring-1 ring-red-400/40"
                            : "bg-white/5 text-white/55 ring-1 ring-white/10"
                        }`}
                      >
                        {overdue ? "Overdue" : fmt.format(new Date(f.due_at))}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-white/50">
                      {f.title}
                      {f.assignee_name ? ` · ${f.assignee_name}` : ""}
                    </p>
                  </Link>
                );
              })}
              {followUps.length === 0 && (
                <p className="px-6 py-10 text-center text-sm text-white/40">Nothing due in the next 7 days.</p>
              )}
            </div>
          </HoloCard>
        </div>
      </div>
    </div>
  );
}
