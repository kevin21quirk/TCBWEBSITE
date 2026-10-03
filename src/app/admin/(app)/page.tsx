import Link from "next/link";
import { LEAD_STATUSES, STATUS_STYLES, type Lead, type LeadStatus } from "@/lib/crm";
import { sql } from "@/lib/db";

export const metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

const fmt = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function DashboardPage() {
  const [counts, recent, recentActivity] = await Promise.all([
    sql`SELECT status, count(*)::int AS n FROM leads GROUP BY status`,
    sql`SELECT l.*, u.name AS assignee_name FROM leads l
        LEFT JOIN users u ON u.id = l.assigned_to
        ORDER BY l.created_at DESC LIMIT 8`,
    sql`SELECT a.*, u.name AS user_name, l.name AS lead_name
        FROM lead_activities a
        LEFT JOIN users u ON u.id = a.user_id
        JOIN leads l ON l.id = a.lead_id
        ORDER BY a.created_at DESC LIMIT 8`,
  ]);

  const byStatus = Object.fromEntries(
    counts.map((c) => [c.status as LeadStatus, c.n as number])
  );
  const total = counts.reduce((s, c) => s + (c.n as number), 0);
  const open = total - (byStatus.won ?? 0) - (byStatus.lost ?? 0);

  const cards = [
    { label: "Total Leads", value: total, accent: "from-slate-500 to-slate-600" },
    { label: "New", value: byStatus.new ?? 0, accent: "from-sky-500 to-sky-600" },
    {
      label: "In Progress",
      value: (byStatus.contacted ?? 0) + (byStatus.qualified ?? 0),
      accent: "from-amber-500 to-orange-500",
    },
    { label: "Won", value: byStatus.won ?? 0, accent: "from-emerald-500 to-emerald-600" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink">Dashboard</h1>
        <Link
          href="/admin/leads/new"
          className="rounded-full bg-gradient-to-r from-brand to-brand-light px-5 py-2.5 text-xs font-semibold uppercase tracking-widest text-white shadow-lg shadow-brand/30 transition-all hover:shadow-brand/50"
        >
          + Add Lead
        </Link>
      </div>

      {/* stat cards */}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div
              className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${c.accent}`}
            />
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              {c.label}
            </p>
            <p className="mt-3 text-4xl font-extrabold text-ink">{c.value}</p>
          </div>
        ))}
      </div>

      {/* pipeline bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-widest text-ink">
            Pipeline
          </h2>
          <p className="text-xs text-slate-500">{open} open leads</p>
        </div>
        <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-slate-100">
          {LEAD_STATUSES.map((s) => {
            const n = byStatus[s] ?? 0;
            if (!n) return null;
            return (
              <div
                key={s}
                className={`${STATUS_STYLES[s].dot} transition-all`}
                style={{ width: `${(n / Math.max(total, 1)) * 100}%` }}
                title={`${STATUS_STYLES[s].label}: ${n}`}
              />
            );
          })}
        </div>
        <div className="mt-4 flex flex-wrap gap-4">
          {LEAD_STATUSES.map((s) => (
            <span
              key={s}
              className="flex items-center gap-2 text-xs font-medium text-slate-600"
            >
              <span className={`h-2.5 w-2.5 rounded-full ${STATUS_STYLES[s].dot}`} />
              {STATUS_STYLES[s].label} ({byStatus[s] ?? 0})
            </span>
          ))}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        {/* recent leads */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm xl:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-ink">
              Recent Leads
            </h2>
            <Link
              href="/admin/leads"
              className="text-xs font-semibold text-brand hover:text-brand-light"
            >
              View all →
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {(recent as Lead[]).map((l) => (
              <Link
                key={l.id}
                href={`/admin/leads/${l.id}`}
                className="flex items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-slate-50"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">
                    {l.name}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {l.email ?? "—"} · {l.source}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${STATUS_STYLES[l.status].badge}`}
                  >
                    {STATUS_STYLES[l.status].label}
                  </span>
                  <span className="hidden text-xs text-slate-400 sm:block">
                    {fmt.format(new Date(l.created_at))}
                  </span>
                </div>
              </Link>
            ))}
            {recent.length === 0 && (
              <p className="px-6 py-10 text-center text-sm text-slate-400">
                No leads yet — they'll appear here when the website form is
                submitted.
              </p>
            )}
          </div>
        </div>

        {/* activity feed */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-ink">
              Activity
            </h2>
          </div>
          <div className="divide-y divide-slate-100">
            {(recentActivity as { id: number; body: string | null; type: string; user_name: string | null; lead_name: string; created_at: string; lead_id: number }[]).map(
              (a) => (
                <div key={a.id} className="px-6 py-4">
                  <p className="text-sm text-ink">
                    <span className="font-semibold">
                      {a.user_name ?? "System"}
                    </span>{" "}
                    <span className="text-slate-500">
                      {a.type === "note" ? "added a note on" : ""}
                    </span>{" "}
                    <Link
                      href={`/admin/leads/${a.lead_id}`}
                      className="font-semibold text-brand hover:underline"
                    >
                      {a.lead_name}
                    </Link>
                  </p>
                  {a.type === "note" && a.body && (
                    <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                      {a.body}
                    </p>
                  )}
                  {a.type !== "note" && a.body && (
                    <p className="mt-1 text-xs text-slate-500">{a.body}</p>
                  )}
                  <p className="mt-1 text-[11px] text-slate-400">
                    {fmt.format(new Date(a.created_at))}
                  </p>
                </div>
              )
            )}
            {recentActivity.length === 0 && (
              <p className="px-6 py-10 text-center text-sm text-slate-400">
                No activity yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
