import Link from "next/link";
import { LEAD_STATUSES, STATUS_STYLES, type Lead, type LeadStatus } from "@/lib/crm";
import { sql } from "@/lib/db";

export const metadata = { title: "Leads" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 15;
const fmt = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const { q = "", status = "", page = "1" } = await searchParams;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const offset = (pageNum - 1) * PAGE_SIZE;
  const pattern = `%${q}%`;
  const validStatus = (LEAD_STATUSES as readonly string[]).includes(status)
    ? (status as LeadStatus)
    : null;

  const where = sql`
    WHERE (${q} = '' OR l.name ILIKE ${pattern} OR l.email ILIKE ${pattern} OR l.phone ILIKE ${pattern})
      AND (${validStatus}::text IS NULL OR l.status = ${validStatus})`;

  const [rows, totalRows] = await Promise.all([
    sql`SELECT l.*, u.name AS assignee_name FROM leads l
        LEFT JOIN users u ON u.id = l.assigned_to ${where}
        ORDER BY l.created_at DESC LIMIT ${PAGE_SIZE} OFFSET ${offset}`,
    sql`SELECT count(*)::int AS n FROM leads l ${where}`,
  ]);
  const total = (totalRows[0]?.n as number) ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const qs = (over: Record<string, string>) => {
    const p = new URLSearchParams({ q, status, ...over });
    return `/admin/leads?${p.toString()}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-ink">
          Leads <span className="text-base font-normal text-slate-400">({total})</span>
        </h1>
        <Link
          href="/admin/leads/new"
          className="rounded-full bg-gradient-to-r from-brand to-brand-light px-5 py-2.5 text-xs font-semibold uppercase tracking-widest text-white shadow-lg shadow-brand/30 transition-all hover:shadow-brand/50"
        >
          + Add Lead
        </Link>
      </div>

      {/* filters */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <form className="flex flex-1 items-center gap-2" action="/admin/leads">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search name, email or phone…"
            className="w-full max-w-sm rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-brand focus:bg-white focus:outline-none"
          />
          <input type="hidden" name="status" value={status} />
          <button
            type="submit"
            className="rounded-full bg-ink px-5 py-2.5 text-xs font-semibold uppercase tracking-widest text-white transition-colors hover:bg-slate-800"
          >
            Search
          </button>
        </form>
        <div className="flex flex-wrap gap-2">
          <Link
            href={qs({ status: "", page: "1" })}
            className={`rounded-full px-4 py-2 text-xs font-semibold ring-1 transition-colors ${
              !status
                ? "bg-ink text-white ring-ink"
                : "bg-white text-slate-600 ring-slate-200 hover:ring-slate-300"
            }`}
          >
            All
          </Link>
          {LEAD_STATUSES.map((s) => (
            <Link
              key={s}
              href={qs({ status: s, page: "1" })}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold ring-1 transition-colors ${
                status === s
                  ? `${STATUS_STYLES[s].badge} ring-current`
                  : "bg-white text-slate-600 ring-slate-200 hover:ring-slate-300"
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${STATUS_STYLES[s].dot}`} />
              {STATUS_STYLES[s].label}
            </Link>
          ))}
        </div>
      </div>

      {/* table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60 text-xs font-semibold uppercase tracking-widest text-slate-500">
              <th className="px-6 py-4">Lead</th>
              <th className="hidden px-6 py-4 md:table-cell">Contact</th>
              <th className="hidden px-6 py-4 lg:table-cell">Source</th>
              <th className="px-6 py-4">Status</th>
              <th className="hidden px-6 py-4 lg:table-cell">Assigned</th>
              <th className="hidden px-6 py-4 md:table-cell">Received</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(rows as Lead[]).map((l) => (
              <tr key={l.id} className="transition-colors hover:bg-slate-50">
                <td className="px-6 py-4">
                  <Link
                    href={`/admin/leads/${l.id}`}
                    className="font-semibold text-ink hover:text-brand"
                  >
                    {l.name}
                  </Link>
                  {l.company && (
                    <p className="text-xs text-slate-400">{l.company}</p>
                  )}
                </td>
                <td className="hidden px-6 py-4 md:table-cell">
                  <p className="text-slate-600">{l.email ?? "—"}</p>
                  <p className="text-xs text-slate-400">{l.phone ?? ""}</p>
                </td>
                <td className="hidden px-6 py-4 capitalize text-slate-600 lg:table-cell">
                  {l.source}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${STATUS_STYLES[l.status].badge}`}
                  >
                    {STATUS_STYLES[l.status].label}
                  </span>
                </td>
                <td className="hidden px-6 py-4 text-slate-600 lg:table-cell">
                  {l.assignee_name ?? "—"}
                </td>
                <td className="hidden px-6 py-4 text-slate-500 md:table-cell">
                  {fmt.format(new Date(l.created_at))}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-14 text-center text-slate-400">
                  No leads match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-500">
          <p>
            Page {pageNum} of {pages}
          </p>
          <div className="flex gap-2">
            {pageNum > 1 && (
              <Link
                href={qs({ page: String(pageNum - 1) })}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 font-semibold hover:border-brand hover:text-brand"
              >
                ← Previous
              </Link>
            )}
            {pageNum < pages && (
              <Link
                href={qs({ page: String(pageNum + 1) })}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 font-semibold hover:border-brand hover:text-brand"
              >
                Next →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
