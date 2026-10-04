import Link from "next/link";
import { completeFollowUp } from "@/app/admin/actions";
import { requireUser } from "@/lib/auth";
import { sql } from "@/lib/db";

export const metadata = { title: "Calendar" };
export const dynamic = "force-dynamic";

const fmt = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});
const monthName = new Intl.DateTimeFormat("en-GB", {
  month: "long",
  year: "numeric",
});

type Item = {
  id: number;
  title: string;
  done: boolean;
  auto: boolean;
  due_at: string;
  day: string;
  lead_id: number;
  lead_name: string;
  assignee_name: string | null;
};

const pad = (n: number) => String(n).padStart(2, "0");
const ym = (d: Date) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`;
const ymd = (d: Date) =>
  `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  await requireUser();
  const { month } = await searchParams;

  const now = new Date();
  const [y, m] = /^\d{4}-\d{2}$/.test(month ?? "")
    ? month!.split("-").map(Number)
    : [now.getUTCFullYear(), now.getUTCMonth() + 1];
  const firstDay = `${y}-${pad(m)}-01`;
  const monthDate = new Date(Date.UTC(y, m - 1, 1));
  const prevMonth = ym(new Date(Date.UTC(y, m - 2, 1)));
  const nextMonth = ym(new Date(Date.UTC(y, m, 1)));
  const todayStr = ymd(now);

  const [items, newLeads, overdue, upcoming] = await Promise.all([
    sql`SELECT f.id, f.title, f.done, f.auto, f.due_at,
        to_char(f.due_at, 'YYYY-MM-DD') AS day,
        f.lead_id, l.name AS lead_name, u.name AS assignee_name
      FROM follow_ups f
      JOIN leads l ON l.id = f.lead_id
      LEFT JOIN users u ON u.id = f.assigned_to
      WHERE f.due_at >= ${firstDay}::date
        AND f.due_at < (${firstDay}::date + interval '1 month')
      ORDER BY f.due_at`,
    sql`SELECT l.id, l.name, to_char(l.created_at, 'YYYY-MM-DD') AS day
      FROM leads l
      WHERE l.created_at >= ${firstDay}::date
        AND l.created_at < (${firstDay}::date + interval '1 month')`,
    sql`SELECT f.id, f.title, f.due_at, f.lead_id, l.name AS lead_name, u.name AS assignee_name
      FROM follow_ups f
      JOIN leads l ON l.id = f.lead_id
      LEFT JOIN users u ON u.id = f.assigned_to
      WHERE f.done = false AND f.due_at < now()
      ORDER BY f.due_at LIMIT 20`,
    sql`SELECT f.id, f.title, f.due_at, f.lead_id, l.name AS lead_name, u.name AS assignee_name
      FROM follow_ups f
      JOIN leads l ON l.id = f.lead_id
      LEFT JOIN users u ON u.id = f.assigned_to
      WHERE f.done = false AND f.due_at >= now()
        AND f.due_at < now() + interval '14 days'
      ORDER BY f.due_at LIMIT 30`,
  ]);

  const byDay = new Map<string, Item[]>();
  for (const it of items as Item[]) {
    const list = byDay.get(it.day) ?? [];
    list.push(it);
    byDay.set(it.day, list);
  }
  const leadsByDay = new Map<string, { id: number; name: string }[]>();
  for (const l of newLeads as { id: number; name: string; day: string }[]) {
    const list = leadsByDay.get(l.day) ?? [];
    list.push(l);
    leadsByDay.set(l.day, list);
  }

  // Build the month grid (weeks start Monday)
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const startDow = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7;
  const cells: (number | null)[] = [
    ...Array<null>(startDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7) cells.push(null);

  const chipFor = (f: Item) => {
    if (f.done) return "bg-slate-100 text-slate-400 line-through";
    if (f.due_at < now.toISOString()) return "bg-red-50 text-red-700 ring-1 ring-red-200";
    if (f.day === todayStr) return "bg-brand/10 text-brand ring-1 ring-brand/30";
    return "bg-sky-50 text-sky-700 ring-1 ring-sky-200";
  };

  const listRow = (f: {
    id: number;
    title: string;
    due_at: string;
    lead_id: number;
    lead_name: string;
    assignee_name: string | null;
  }) => (
    <div key={f.id} className="flex items-center gap-3 px-6 py-3.5">
      <form action={completeFollowUp.bind(null, f.id, f.lead_id)}>
        <button
          type="submit"
          aria-label="Mark done"
          className="flex h-5 w-5 items-center justify-center rounded-full border border-slate-300 text-transparent transition-colors hover:border-emerald-400 hover:text-emerald-500"
        >
          ✓
        </button>
      </form>
      <div className="min-w-0 flex-1">
        <Link
          href={`/admin/leads/${f.lead_id}`}
          className="truncate text-sm font-semibold text-ink hover:text-brand"
        >
          {f.lead_name}
        </Link>
        <p className="truncate text-xs text-slate-500">
          {f.title}
          {f.assignee_name ? ` · ${f.assignee_name}` : ""}
        </p>
      </div>
      <p className="shrink-0 text-xs text-slate-400">
        {fmt.format(new Date(f.due_at))}
      </p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink">Calendar</h1>
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/calendar?month=${prevMonth}`}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold hover:border-brand hover:text-brand"
          >
            ← Prev
          </Link>
          <Link
            href="/admin/calendar"
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold hover:border-brand hover:text-brand"
          >
            Today
          </Link>
          <Link
            href={`/admin/calendar?month=${nextMonth}`}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold hover:border-brand hover:text-brand"
          >
            Next →
          </Link>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        {/* month grid */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm xl:col-span-2">
          <div className="border-b border-slate-100 px-6 py-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-ink">
              {monthName.format(monthDate)}
            </h2>
          </div>
          <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/60 text-center text-[11px] font-semibold uppercase tracking-widest text-slate-500">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <div key={d} className="py-2">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {cells.map((day, i) => {
              const dayStr = day ? `${firstDay.slice(0, 8)}${pad(day)}` : "";
              const dayItems = day ? (byDay.get(dayStr) ?? []) : [];
              const dayLeads = day ? (leadsByDay.get(dayStr) ?? []) : [];
              return (
                <div
                  key={i}
                  className={`min-h-[104px] border-b border-r border-slate-100 p-1.5 [&:nth-child(7n)]:border-r-0 ${
                    dayStr === todayStr ? "bg-brand/[0.04]" : ""
                  } ${day ? "" : "bg-slate-50/40"}`}
                >
                  {day && (
                    <>
                      <p
                        className={`mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                          dayStr === todayStr
                            ? "bg-brand text-white"
                            : "text-slate-500"
                        }`}
                      >
                        {day}
                      </p>
                      <div className="space-y-1">
                        {dayLeads.map((l) => (
                          <Link
                            key={`lead-${l.id}`}
                            href={`/admin/leads/${l.id}`}
                            title={`New lead: ${l.name}`}
                            className="block truncate rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-100"
                          >
                            ● {l.name}
                          </Link>
                        ))}
                        {dayItems.slice(0, 3).map((f) => (
                          <Link
                            key={f.id}
                            href={`/admin/leads/${f.lead_id}`}
                            title={`${f.title} — ${f.lead_name}`}
                            className={`block truncate rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${chipFor(f)}`}
                          >
                            {f.title} — {f.lead_name}
                          </Link>
                        ))}
                        {dayItems.length > 3 && (
                          <p className="px-1.5 text-[10px] text-slate-400">
                            +{dayItems.length - 3} more
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-4 px-6 py-3 text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> New lead
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-sky-500" /> Follow-up due
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-red-500" /> Overdue
            </span>
          </div>
        </div>

        {/* side lists */}
        <div className="space-y-6">
          <div className="overflow-hidden rounded-2xl border border-red-200 bg-white shadow-sm">
            <div className="border-b border-red-100 bg-red-50/60 px-6 py-4">
              <h2 className="text-sm font-bold uppercase tracking-widest text-red-700">
                Overdue ({overdue.length})
              </h2>
            </div>
            <div className="divide-y divide-slate-100">
              {(overdue as Item[]).map(listRow)}
              {overdue.length === 0 && (
                <p className="px-6 py-8 text-center text-sm text-slate-400">
                  Nothing overdue — nice work.
                </p>
              )}
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-6 py-4">
              <h2 className="text-sm font-bold uppercase tracking-widest text-ink">
                Next 14 Days
              </h2>
            </div>
            <div className="divide-y divide-slate-100">
              {(upcoming as Item[]).map(listRow)}
              {upcoming.length === 0 && (
                <p className="px-6 py-8 text-center text-sm text-slate-400">
                  No follow-ups scheduled.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
