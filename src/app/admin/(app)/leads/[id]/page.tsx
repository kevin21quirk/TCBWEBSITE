import Link from "next/link";
import { notFound } from "next/navigation";
import { addNote, assignLead, updateLeadStatus } from "@/app/admin/actions";
import { LEAD_STATUSES, STATUS_STYLES, type Lead, type LeadActivity } from "@/lib/crm";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

const fmt = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const selectClass =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-ink focus:border-brand focus:bg-white focus:outline-none";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const leadId = parseInt(id, 10);
  if (Number.isNaN(leadId)) notFound();

  const [leads, staff, activity] = await Promise.all([
    sql`SELECT l.*, u.name AS assignee_name FROM leads l LEFT JOIN users u ON u.id = l.assigned_to WHERE l.id = ${leadId}`,
    sql`SELECT id, name FROM users WHERE active = true ORDER BY name`,
    sql`SELECT a.*, u.name AS user_name FROM lead_activities a LEFT JOIN users u ON u.id = a.user_id WHERE a.lead_id = ${leadId} ORDER BY a.created_at DESC`,
  ]);
  const lead = leads[0] as Lead | undefined;
  if (!lead) notFound();

  const statusAction = updateLeadStatus.bind(null, leadId);
  const assignAction = assignLead.bind(null, leadId);
  const noteAction = addNote.bind(null, leadId);

  return (
    <div className="space-y-6">
      <Link
        href="/admin/leads"
        className="text-xs font-semibold uppercase tracking-widest text-slate-500 hover:text-brand"
      >
        ← Back to leads
      </Link>

      <div className="grid gap-6 xl:grid-cols-3">
        {/* lead info */}
        <div className="space-y-6 xl:col-span-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-ink">{lead.name}</h1>
                <p className="mt-1 text-sm capitalize text-slate-500">
                  Source: {lead.source} · Received{" "}
                  {fmt.format(new Date(lead.created_at))}
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ${STATUS_STYLES[lead.status].badge}`}
              >
                {STATUS_STYLES[lead.status].label}
              </span>
            </div>
            <dl className="mt-6 grid gap-4 sm:grid-cols-2">
              {[
                ["Email", lead.email],
                ["Phone", lead.phone],
                ["Company", lead.company],
                ["Assigned to", lead.assignee_name],
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl bg-slate-50 px-4 py-3">
                  <dt className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                    {k}
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-ink">
                    {v ?? "—"}
                  </dd>
                </div>
              ))}
            </dl>
            {lead.message && (
              <div className="mt-6">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                  Message
                </p>
                <p className="mt-2 whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm leading-relaxed text-ink">
                  {lead.message}
                </p>
              </div>
            )}
          </div>

          {/* timeline */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-bold uppercase tracking-widest text-ink">
              Activity &amp; Notes
            </h2>
            <form action={noteAction} className="mt-4 flex gap-3">
              <input
                name="note"
                required
                placeholder="Add a note — call outcome, follow-up, next step…"
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-brand focus:bg-white focus:outline-none"
              />
              <button
                type="submit"
                className="rounded-xl bg-ink px-5 py-2.5 text-xs font-semibold uppercase tracking-widest text-white transition-colors hover:bg-slate-800"
              >
                Add
              </button>
            </form>
            <div className="mt-6 space-y-0">
              {(activity as LeadActivity[]).map((a, i) => (
                <div key={a.id} className="relative flex gap-4 pb-6 last:pb-0">
                  {i !== activity.length - 1 && (
                    <span className="absolute left-[9px] top-6 h-full w-px bg-slate-200" />
                  )}
                  <span
                    className={`relative z-10 mt-1 h-[18px] w-[18px] shrink-0 rounded-full border-4 border-white shadow ${
                      a.type === "note"
                        ? "bg-brand"
                        : a.type === "status"
                          ? "bg-amber-500"
                          : "bg-sky-500"
                    }`}
                  />
                  <div className="min-w-0">
                    <p className="text-sm text-ink">
                      <span className="font-semibold">
                        {a.user_name ?? "System"}
                      </span>{" "}
                      <span className="text-slate-500">
                        {a.type === "note" ? "added a note" : ""}
                      </span>
                    </p>
                    {a.body && (
                      <p className="mt-1 text-sm text-slate-600">{a.body}</p>
                    )}
                    <p className="mt-1 text-[11px] text-slate-400">
                      {fmt.format(new Date(a.created_at))}
                    </p>
                  </div>
                </div>
              ))}
              {activity.length === 0 && (
                <p className="py-4 text-center text-sm text-slate-400">
                  No activity yet — add the first note above.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* actions sidebar */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-bold uppercase tracking-widest text-ink">
              Update Status
            </h2>
            <div className="mt-4 space-y-2">
              {LEAD_STATUSES.map((s) => (
                <form key={s} action={statusAction.bind(null, s)}>
                  <button
                    type="submit"
                    disabled={lead.status === s}
                    className={`flex w-full items-center gap-3 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all ${
                      lead.status === s
                        ? `${STATUS_STYLES[s].badge} border-transparent ring-1`
                        : "border-slate-200 text-slate-600 hover:border-brand hover:text-brand"
                    }`}
                  >
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${STATUS_STYLES[s].dot}`}
                    />
                    {STATUS_STYLES[s].label}
                    {lead.status === s && (
                      <span className="ml-auto text-xs">current</span>
                    )}
                  </button>
                </form>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-bold uppercase tracking-widest text-ink">
              Assign To
            </h2>
            <div className="mt-4 space-y-2">
              <form action={assignAction.bind(null, null)}>
                <button
                  type="submit"
                  className={`w-full rounded-xl border px-4 py-2.5 text-left text-sm transition-all ${
                    !lead.assigned_to
                      ? "border-brand bg-brand/5 font-semibold text-brand"
                      : "border-slate-200 text-slate-600 hover:border-brand hover:text-brand"
                  }`}
                >
                  Unassigned
                </button>
              </form>
              {(staff as { id: number; name: string }[]).map((u) => (
                <form key={u.id} action={assignAction.bind(null, u.id)}>
                  <button
                    type="submit"
                    className={`w-full rounded-xl border px-4 py-2.5 text-left text-sm transition-all ${
                      lead.assigned_to === u.id
                        ? "border-brand bg-brand/5 font-semibold text-brand"
                        : "border-slate-200 text-slate-600 hover:border-brand hover:text-brand"
                    }`}
                  >
                    {u.name}
                  </button>
                </form>
              ))}
            </div>
          </div>

          {lead.email && (
            <a
              href={`mailto:${lead.email}`}
              className="block rounded-2xl bg-gradient-to-r from-brand to-brand-light py-3.5 text-center text-xs font-semibold uppercase tracking-widest text-white shadow-lg shadow-brand/30 transition-all hover:shadow-brand/50"
            >
              Email {lead.name.split(" ")[0]}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
