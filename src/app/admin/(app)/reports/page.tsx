import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { LEAD_STATUSES, STATUS_STYLES, money, type LeadStatus } from "@/lib/crm";
import { sql } from "@/lib/db";

export const metadata = { title: "Reports" };
export const dynamic = "force-dynamic";

const RANGES = { "30": "Last 30 days", "90": "Last 90 days", "365": "Last 12 months" } as const;
type Range = keyof typeof RANGES;

const card = "rounded-2xl border border-slate-200 bg-white p-6 shadow-sm";
const h2 = "text-sm font-bold uppercase tracking-widest text-ink";
const pct = (n: number, d: number) => (d ? Math.round((n / d) * 100) : 0);
const weekFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });

function Bar({ value, max, color = "bg-brand" }: { value: number; max: number; color?: string }) {
  return (
    <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${max ? (value / max) * 100 : 0}%` }} />
    </div>
  );
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  await requireUser();
  const { range: r } = await searchParams;
  const range: Range = r && r in RANGES ? (r as Range) : "90";
  const days = Number(range);

  const [kpiRows, statusRows, sourceRows, campaignRows, weekRows, teamRows, pageRows, activityRows] =
    await Promise.all([
      sql`SELECT
          count(*) FILTER (WHERE created_at > now() - make_interval(days => ${days}))::int AS leads,
          count(*) FILTER (WHERE created_at > now() - make_interval(days => ${days * 2})
                             AND created_at <= now() - make_interval(days => ${days}))::int AS prev_leads,
          count(*) FILTER (WHERE status = 'won' AND updated_at > now() - make_interval(days => ${days}))::int AS won,
          count(*) FILTER (WHERE status = 'lost' AND updated_at > now() - make_interval(days => ${days}))::int AS lost,
          coalesce(sum(deal_value) FILTER (WHERE status = 'won' AND updated_at > now() - make_interval(days => ${days})), 0)::float AS won_value,
          coalesce(sum(deal_value) FILTER (WHERE status NOT IN ('won','lost')), 0)::float AS open_value,
          (SELECT avg(EXTRACT(EPOCH FROM (first_touch - l2.created_at)) / 3600)::float
             FROM (SELECT l.created_at,
                     (SELECT min(a.created_at) FROM lead_activities a
                       WHERE a.lead_id = l.id AND a.type IN ('call','email','meeting','linkedin')) AS first_touch
                   FROM leads l WHERE l.created_at > now() - make_interval(days => ${days})) l2
             WHERE first_touch IS NOT NULL) AS avg_response_hours
        FROM leads`,
      sql`SELECT status, count(*)::int AS n FROM leads
          WHERE created_at > now() - make_interval(days => ${days}) GROUP BY status`,
      sql`SELECT source, count(*)::int AS n,
            count(*) FILTER (WHERE status = 'won')::int AS won
          FROM leads WHERE created_at > now() - make_interval(days => ${days})
          GROUP BY source ORDER BY n DESC`,
      sql`SELECT coalesce(utm_campaign, '(none)') AS campaign,
            coalesce(utm_source, '') AS src, coalesce(utm_medium, '') AS medium,
            count(*)::int AS n, count(*) FILTER (WHERE status = 'won')::int AS won,
            coalesce(sum(deal_value) FILTER (WHERE status = 'won'), 0)::float AS value
          FROM leads
          WHERE created_at > now() - make_interval(days => ${days})
            AND (utm_campaign IS NOT NULL OR utm_source IS NOT NULL OR referrer IS NOT NULL)
          GROUP BY 1, 2, 3 ORDER BY n DESC LIMIT 12`,
      sql`SELECT to_char(w, 'YYYY-MM-DD') AS week,
            (SELECT count(*) FROM leads l WHERE l.created_at >= w AND l.created_at < w + interval '7 days')::int AS n
          FROM generate_series(date_trunc('week', now()) - interval '11 weeks', date_trunc('week', now()), interval '1 week') AS w
          ORDER BY w`,
      sql`SELECT u.id, u.name,
            count(l.id) FILTER (WHERE l.status NOT IN ('won','lost'))::int AS open,
            count(l.id) FILTER (WHERE l.status = 'won' AND l.updated_at > now() - make_interval(days => ${days}))::int AS won,
            coalesce(sum(l.deal_value) FILTER (WHERE l.status = 'won' AND l.updated_at > now() - make_interval(days => ${days})), 0)::float AS won_value,
            (SELECT count(*) FROM lead_activities a WHERE a.user_id = u.id
               AND a.type IN ('note','call','email','meeting','linkedin')
               AND a.created_at > now() - make_interval(days => ${days}))::int AS activities
          FROM users u LEFT JOIN leads l ON l.assigned_to = u.id
          WHERE u.active GROUP BY u.id, u.name ORDER BY won DESC, activities DESC`,
      sql`SELECT path, count(*)::int AS n, count(DISTINCT visitor_id)::int AS visitors
          FROM page_views WHERE created_at > now() - make_interval(days => ${days})
          GROUP BY path ORDER BY n DESC LIMIT 8`,
      sql`SELECT type, count(*)::int AS n FROM lead_activities
          WHERE type IN ('note','call','email','meeting','linkedin')
            AND created_at > now() - make_interval(days => ${days})
          GROUP BY type ORDER BY n DESC`,
    ]);

  const k = kpiRows[0] as {
    leads: number; prev_leads: number; won: number; lost: number;
    won_value: number; open_value: number; avg_response_hours: number | null;
  };
  const byStatus = Object.fromEntries(statusRows.map((s) => [s.status, s.n])) as Partial<Record<LeadStatus, number>>;
  // Funnel: everyone who reached at least this stage.
  const reached = (stages: LeadStatus[]) => stages.reduce((s, x) => s + (byStatus[x] ?? 0), 0);
  const funnel = [
    { label: "Leads", n: reached(["new", "contacted", "qualified", "won", "lost"]), color: "bg-slate-500" },
    { label: "Contacted", n: reached(["contacted", "qualified", "won"]), color: "bg-amber-500" },
    { label: "Qualified", n: reached(["qualified", "won"]), color: "bg-violet-500" },
    { label: "Won", n: byStatus.won ?? 0, color: "bg-emerald-500" },
  ];
  const growth = k.prev_leads ? Math.round(((k.leads - k.prev_leads) / k.prev_leads) * 100) : null;
  const winRate = pct(k.won, k.won + k.lost);
  const weeks = weekRows as { week: string; n: number }[];
  const maxWeek = Math.max(1, ...weeks.map((w) => w.n));
  const sources = sourceRows as { source: string; n: number; won: number }[];
  const maxSource = Math.max(1, ...sources.map((s) => s.n));
  const pages = pageRows as { path: string; n: number; visitors: number }[];
  const activities = activityRows as { type: string; n: number }[];
  const maxActivity = Math.max(1, ...activities.map((a) => a.n));

  const kpis = [
    { label: "New leads", value: String(k.leads), sub: growth == null ? "No prior data" : `${growth >= 0 ? "▲" : "▼"} ${Math.abs(growth)}% vs previous period`, good: growth == null || growth >= 0 },
    { label: "Win rate", value: `${winRate}%`, sub: `${k.won} won · ${k.lost} lost`, good: true },
    { label: "Revenue won", value: money.format(k.won_value), sub: `Open pipeline ${money.format(k.open_value)}`, good: true },
    { label: "Avg. first response", value: k.avg_response_hours == null ? "—" : k.avg_response_hours < 24 ? `${Math.round(k.avg_response_hours)}h` : `${(k.avg_response_hours / 24).toFixed(1)}d`, sub: "Lead received → first touch", good: (k.avg_response_hours ?? 0) <= 24 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-ink">Sales &amp; Marketing Reports</h1>
        <div className="flex gap-2">
          {(Object.keys(RANGES) as Range[]).map((key) => (
            <Link
              key={key}
              href={`/admin/reports?range=${key}`}
              className={`rounded-full px-4 py-2 text-xs font-semibold ring-1 ${
                range === key ? "bg-ink text-white ring-ink" : "bg-white text-slate-600 ring-slate-200 hover:ring-slate-300"
              }`}
            >
              {RANGES[key]}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((x) => (
          <div key={x.label} className={card}>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">{x.label}</p>
            <p className="mt-3 text-3xl font-extrabold text-ink">{x.value}</p>
            <p className={`mt-1 text-xs font-medium ${x.good ? "text-emerald-600" : "text-red-600"}`}>{x.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {/* funnel */}
        <div className={card}>
          <h2 className={h2}>Conversion Funnel</h2>
          <div className="mt-5 space-y-4">
            {funnel.map((f, i) => (
              <div key={f.label}>
                <div className="mb-1.5 flex justify-between text-sm">
                  <span className="font-semibold text-ink">{f.label}</span>
                  <span className="text-slate-500">
                    {f.n}
                    {i > 0 && <span className="ml-2 text-xs text-slate-400">{pct(f.n, funnel[0].n)}%</span>}
                  </span>
                </div>
                <Bar value={f.n} max={funnel[0].n} color={f.color} />
              </div>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-3 border-t border-slate-100 pt-4">
            {LEAD_STATUSES.map((s) => (
              <span key={s} className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className={`h-2 w-2 rounded-full ${STATUS_STYLES[s].dot}`} />
                {STATUS_STYLES[s].label} {byStatus[s] ?? 0}
              </span>
            ))}
          </div>
        </div>

        {/* weekly trend */}
        <div className={card}>
          <h2 className={h2}>New Leads per Week</h2>
          <div className="mt-6 flex h-48 items-end gap-2">
            {weeks.map((w) => (
              <div key={w.week} className="group flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                <span className="text-[10px] font-semibold text-slate-500 opacity-0 group-hover:opacity-100">{w.n}</span>
                <div
                  className="w-full rounded-t-md bg-gradient-to-t from-brand to-orange-400 transition-opacity group-hover:opacity-80"
                  style={{ height: `${Math.max((w.n / maxWeek) * 100, w.n ? 4 : 1)}%` }}
                />
              </div>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            {weeks.map((w, i) => (
              <span key={w.week} className="flex-1 text-center text-[9px] text-slate-400">
                {i % 2 === 0 ? weekFmt.format(new Date(w.week)) : ""}
              </span>
            ))}
          </div>
        </div>

        {/* sources */}
        <div className={card}>
          <h2 className={h2}>Lead Sources</h2>
          <div className="mt-5 space-y-4">
            {sources.map((s) => (
              <div key={s.source}>
                <div className="mb-1.5 flex justify-between text-sm">
                  <Link href={`/admin/leads?source=${encodeURIComponent(s.source)}`} className="font-semibold capitalize text-ink hover:text-brand">
                    {s.source}
                  </Link>
                  <span className="text-slate-500">
                    {s.n} <span className="ml-2 text-xs text-emerald-600">{s.won} won · {pct(s.won, s.n)}%</span>
                  </span>
                </div>
                <Bar value={s.n} max={maxSource} />
              </div>
            ))}
            {sources.length === 0 && <p className="text-sm text-slate-400">No leads in this period.</p>}
          </div>
        </div>

        {/* activity mix */}
        <div className={card}>
          <h2 className={h2}>Sales Activity</h2>
          <div className="mt-5 space-y-4">
            {activities.map((a) => (
              <div key={a.type}>
                <div className="mb-1.5 flex justify-between text-sm">
                  <span className="font-semibold capitalize text-ink">{a.type === "linkedin" ? "LinkedIn" : a.type}</span>
                  <span className="text-slate-500">{a.n}</span>
                </div>
                <Bar value={a.n} max={maxActivity} color="bg-sky-500" />
              </div>
            ))}
            {activities.length === 0 && <p className="text-sm text-slate-400">No calls, emails or meetings logged yet.</p>}
          </div>
        </div>
      </div>

      {/* campaigns */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className={h2}>Campaign Performance</h2>
          <p className="mt-1 text-xs text-slate-500">
            Add <code className="rounded bg-slate-100 px-1">?utm_source=linkedin&amp;utm_medium=paid&amp;utm_campaign=spring-it</code> to
            links in ads, emails and posts to track them here.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-xs font-semibold uppercase tracking-widest text-slate-500">
                <th className="px-6 py-3">Campaign</th>
                <th className="px-6 py-3">Source / medium</th>
                <th className="px-6 py-3">Leads</th>
                <th className="px-6 py-3">Won</th>
                <th className="px-6 py-3">Conversion</th>
                <th className="px-6 py-3">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(campaignRows as { campaign: string; src: string; medium: string; n: number; won: number; value: number }[]).map((c, i) => (
                <tr key={i}>
                  <td className="px-6 py-3 font-semibold text-ink">{c.campaign}</td>
                  <td className="px-6 py-3 text-slate-500">{[c.src, c.medium].filter(Boolean).join(" / ") || "referral"}</td>
                  <td className="px-6 py-3">{c.n}</td>
                  <td className="px-6 py-3">{c.won}</td>
                  <td className="px-6 py-3">{pct(c.won, c.n)}%</td>
                  <td className="px-6 py-3 font-semibold">{money.format(c.value)}</td>
                </tr>
              ))}
              {campaignRows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-slate-400">
                    No tracked campaign traffic yet. Enquiries arriving via UTM-tagged links will appear here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {/* team */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-4">
            <h2 className={h2}>Team Leaderboard</h2>
          </div>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-xs font-semibold uppercase tracking-widest text-slate-500">
                <th className="px-6 py-3">Member</th>
                <th className="px-4 py-3">Open</th>
                <th className="px-4 py-3">Activities</th>
                <th className="px-4 py-3">Won</th>
                <th className="px-4 py-3">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(teamRows as { id: number; name: string; open: number; won: number; won_value: number; activities: number }[]).map((t, i) => (
                <tr key={t.id}>
                  <td className="px-6 py-3">
                    <span className="flex items-center gap-2 font-semibold text-ink">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-brand to-orange-500 text-[11px] font-bold text-white">
                        {i === 0 && t.won > 0 ? "★" : t.name.charAt(0).toUpperCase()}
                      </span>
                      {t.name}
                    </span>
                  </td>
                  <td className="px-4 py-3">{t.open}</td>
                  <td className="px-4 py-3">{t.activities}</td>
                  <td className="px-4 py-3">{t.won}</td>
                  <td className="px-4 py-3 font-semibold">{money.format(t.won_value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* top pages */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-4">
            <h2 className={h2}>Top Website Pages</h2>
          </div>
          <div className="space-y-4 px-6 py-5">
            {pages.map((p) => (
              <div key={p.path}>
                <div className="mb-1.5 flex justify-between text-sm">
                  <span className="truncate font-semibold text-ink">{p.path}</span>
                  <span className="shrink-0 text-slate-500">
                    {p.n} views <span className="ml-1 text-xs text-slate-400">· {p.visitors} visitors</span>
                  </span>
                </div>
                <Bar value={p.n} max={pages[0]?.n ?? 1} color="bg-ink" />
              </div>
            ))}
            {pages.length === 0 && <p className="text-sm text-slate-400">No page views recorded yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
