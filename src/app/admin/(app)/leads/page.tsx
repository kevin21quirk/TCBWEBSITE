import Link from "next/link";
import {
  LEAD_STATUSES,
  STATUS_STYLES,
  TEMPERATURE_STYLES,
  dealValue,
  money,
  scoreLead,
  type Lead,
  type LeadStats,
  type LeadStatus,
} from "@/lib/crm";
import { sql } from "@/lib/db";

export const metadata = { title: "Leads" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;
const fmt = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
    source?: string;
    tag?: string;
    page?: string;
  }>;
}) {
  const { q = "", status = "", source = "", tag = "", page = "1" } = await searchParams;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const offset = (pageNum - 1) * PAGE_SIZE;
  const pattern = `%${q}%`;
  const validStatus = (LEAD_STATUSES as readonly string[]).includes(status)
    ? (status as LeadStatus)
    : null;

  const where = sql`
    WHERE (${q} = '' OR l.name ILIKE ${pattern} OR l.email ILIKE ${pattern}
           OR l.phone ILIKE ${pattern} OR l.company ILIKE ${pattern})
      AND (${validStatus}::text IS NULL OR l.status = ${validStatus})
      AND (${source} = '' OR l.source = ${source})
      AND (${tag} = '' OR ${tag} = ANY(l.tags))`;

  const [rows, totalRows, sources] = await Promise.all([
    sql`SELECT l.*, u.name AS assignee_name,
          (SELECT count(*) FROM lead_activities a WHERE a.lead_id = l.id
            AND a.type NOT IN ('status','assign'))::int AS activity_count,
          (SELECT max(created_at) FROM lead_activities a WHERE a.lead_id = l.id) AS last_activity_at
        FROM leads l
        LEFT JOIN users u ON u.id = l.assigned_to ${where}
        ORDER BY l.created_at DESC LIMIT ${PAGE_SIZE} OFFSET ${offset}`,
    sql`SELECT count(*)::int AS n FROM leads l ${where}`,
    sql`SELECT source, count(*)::int AS n FROM leads GROUP BY source ORDER BY n DESC`,
  ]);
  const total = (totalRows[0]?.n as number) ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const filters = { q, status, source, tag };
  const qs = (over: Record<string, string>) =>
    `/admin/leads?${new URLSearchParams({ ...filters, ...over }).toString()}`;
  const exportHref = `/admin/leads/export?${new URLSearchParams(filters).toString()}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-ink">
          Leads <span className="text-base font-normal text-slate-400">({total})</span>
        </h1>
        <div className="flex flex-wrap gap-2">
          <a
            href={exportHref}
            className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold uppercase tracking-widest text-slate-600 hover:border-brand hover:text-brand"
          >
            Export CSV
          </a>
          <Link
            href="/admin/leads/import"
            className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold uppercase tracking-widest text-slate-600 hover:border-brand hover:text-brand"
          >
            Import
          </Link>
          <Link
            href="/admin/leads/new"
            className="rounded-full bg-gradient-to-r from-brand to-brand-light px-5 py-2.5 text-xs font-semibold uppercase tracking-widest text-white shadow-lg shadow-brand/30 transition-all hover:shadow-brand/50"
          >
            + Add Lead
          </Link>
        </div>
      </div>

      {/* filters */}
      <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <form className="flex flex-wrap items-center gap-2" action="/admin/leads">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search name, email, phone or company…"
            className="w-full max-w-sm flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-brand focus:bg-white focus:outline-none"
          />
          <select
            name="source"
            defaultValue={source}
            className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm capitalize focus:border-brand focus:outline-none"
          >
            <option value="">All sources</option>
            {(sources as { source: string; n: number }[]).map((s) => (
              <option key={s.source} value={s.source}>
                {s.source} ({s.n})
              </option>
            ))}
          </select>
          <input type="hidden" name="status" value={status} />
          {tag && <input type="hidden" name="tag" value={tag} />}
          <button
            type="submit"
            className="rounded-full bg-ink px-5 py-2.5 text-xs font-semibold uppercase tracking-widest text-white transition-colors hover:bg-slate-800"
          >
            Filter
          </button>
          {tag && (
            <Link
              href={qs({ tag: "", page: "1" })}
              className="rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200"
            >
              #{tag} ✕
            </Link>
          )}
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
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60 text-xs font-semibold uppercase tracking-widest text-slate-500">
              <th className="px-6 py-4">Lead</th>
              <th className="px-4 py-4">Score</th>
              <th className="hidden px-4 py-4 md:table-cell">Contact</th>
              <th className="px-4 py-4">Stage</th>
              <th className="hidden px-4 py-4 lg:table-cell">Value</th>
              <th className="hidden px-4 py-4 lg:table-cell">Owner</th>
              <th className="hidden px-4 py-4 md:table-cell">Received</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(rows as (Lead & LeadStats)[]).map((l) => {
              const { score, temperature } = scoreLead(l);
              const value = dealValue(l);
              return (
                <tr key={l.id} className="transition-colors hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/leads/${l.id}`}
                        className="font-semibold text-ink hover:text-brand"
                      >
                        {l.name}
                      </Link>
                      {l.linkedin_url ? (
                        <a
                          href={l.linkedin_url}
                          target="_blank"
                          rel="noreferrer"
                          title="LinkedIn profile"
                          className="rounded bg-[#0a66c2] px-1 text-[10px] font-bold text-white"
                        >
                          in
                        </a>
                      ) : (
                        <Link
                          href={`/admin/leads/${l.id}#linkedin`}
                          title="Not yet researched on LinkedIn"
                          className="rounded border border-dashed border-slate-300 px-1 text-[10px] font-bold text-slate-400 hover:border-[#0a66c2] hover:text-[#0a66c2]"
                        >
                          in
                        </Link>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">
                      {[l.job_title, l.company].filter(Boolean).join(" · ") ||
                        <span className="capitalize">{l.source}</span>}
                    </p>
                    {l.tags.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {l.tags.slice(0, 3).map((t) => (
                          <Link
                            key={t}
                            href={qs({ tag: t, page: "1" })}
                            className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500 hover:bg-slate-200"
                          >
                            #{t}
                          </Link>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ${TEMPERATURE_STYLES[temperature].badge}`}
                    >
                      {TEMPERATURE_STYLES[temperature].label} {score}
                    </span>
                  </td>
                  <td className="hidden px-4 py-4 md:table-cell">
                    <p className="text-slate-600">{l.email ?? "—"}</p>
                    <p className="text-xs text-slate-400">{l.phone ?? ""}</p>
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${STATUS_STYLES[l.status].badge}`}
                    >
                      {STATUS_STYLES[l.status].label}
                    </span>
                  </td>
                  <td className="hidden px-4 py-4 font-semibold text-ink lg:table-cell">
                    {value ? money.format(value) : "—"}
                  </td>
                  <td className="hidden px-4 py-4 text-slate-600 lg:table-cell">
                    {l.assignee_name ?? "—"}
                  </td>
                  <td className="hidden px-4 py-4 text-slate-500 md:table-cell">
                    {fmt.format(new Date(l.created_at))}
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-14 text-center text-slate-400">
                  No leads match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

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
