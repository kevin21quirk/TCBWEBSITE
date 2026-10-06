import Link from "next/link";
import { notFound } from "next/navigation";
import DeleteLeadButton from "@/app/admin/(app)/leads/[id]/DeleteLeadButton";
import {
  addFollowUp,
  addNote,
  assignLead,
  completeFollowUp,
  updateLeadStatus,
} from "@/app/admin/actions";
import { requireUser } from "@/lib/auth";
import {
  LEAD_STATUSES,
  STATUS_STYLES,
  nextSteps,
  type FollowUp,
  type Lead,
  type LeadActivity,
} from "@/lib/crm";
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
  const me = await requireUser();

  const [leads, staff, activity, followUps] = await Promise.all([
    sql`SELECT l.*, u.name AS assignee_name FROM leads l LEFT JOIN users u ON u.id = l.assigned_to WHERE l.id = ${leadId}`,
    sql`SELECT id, name FROM users WHERE active = true ORDER BY name`,
    sql`SELECT a.*, u.name AS user_name FROM lead_activities a LEFT JOIN users u ON u.id = a.user_id WHERE a.lead_id = ${leadId} ORDER BY a.created_at DESC`,
    sql`SELECT f.*, u.name AS assignee_name FROM follow_ups f LEFT JOIN users u ON u.id = f.assigned_to WHERE f.lead_id = ${leadId} ORDER BY f.done, f.due_at`,
  ]);
  const lead = leads[0] as Lead | undefined;
  if (!lead) notFound();

  const statusAction = updateLeadStatus.bind(null, leadId);
  const assignAction = assignLead.bind(null, leadId);
  const noteAction = addNote.bind(null, leadId);
  const followUpAction = addFollowUp.bind(null, leadId);

  const now = new Date();
  const openFollowUps = (followUps as FollowUp[]).filter((f) => !f.done);
  const steps = nextSteps(lead, {
    overdue: openFollowUps.some((f) => new Date(f.due_at) < now),
    hasNotes: (activity as LeadActivity[]).some((a) => a.type === "note"),
  });

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

            {/* LinkedIn / Sales Navigator */}
            <div className="mt-6">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                LinkedIn
              </p>
              <div className="mt-2 flex flex-wrap gap-3">
                {lead.linkedin_url && (
                  <a
                    href={lead.linkedin_url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl bg-[#0a66c2] px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#004182]"
                  >
                    View LinkedIn Profile
                  </a>
                )}
                <a
                  href={`https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(
                    [lead.name, lead.company].filter(Boolean).join(" ")
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-ink transition-colors hover:border-[#0a66c2] hover:text-[#0a66c2]"
                >
                  Search on LinkedIn
                </a>
                <a
                  href={`https://www.linkedin.com/sales/search/people?query=(keywords:${encodeURIComponent(
                    [lead.name, lead.company].filter(Boolean).join(" ")
                  )})`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-ink transition-colors hover:border-[#0a66c2] hover:text-[#0a66c2]"
                >
                  Search in Sales Navigator
                </a>
              </div>
              {lead.linkedin_url && (
                <p className="mt-2 truncate text-xs text-slate-400">
                  {lead.linkedin_url}
                </p>
              )}
            </div>

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
          {/* recommended next steps */}
          <div className="rounded-2xl border border-brand/20 bg-gradient-to-br from-brand/[0.04] to-orange-50 p-6 shadow-sm">
            <h2 className="text-sm font-bold uppercase tracking-widest text-ink">
              Recommended Next Steps
            </h2>
            <ol className="mt-4 space-y-2.5">
              {steps.map((s, i) => (
                <li key={i} className="flex gap-3 text-sm text-ink">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand text-[10px] font-bold text-white">
                    {i + 1}
                  </span>
                  <span className="leading-snug">{s}</span>
                </li>
              ))}
            </ol>
          </div>

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

          {/* follow-ups */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-widest text-ink">
                Follow-ups
              </h2>
              <Link
                href="/admin/calendar"
                className="text-xs font-semibold text-brand hover:text-brand-light"
              >
                Calendar →
              </Link>
            </div>
            <div className="mt-4 space-y-2">
              {(followUps as FollowUp[]).map((f) => {
                const overdue = !f.done && new Date(f.due_at) < now;
                return (
                  <div
                    key={f.id}
                    className={`flex items-center gap-3 rounded-xl border px-3.5 py-2.5 text-sm ${
                      f.done
                        ? "border-slate-100 text-slate-400"
                        : overdue
                          ? "border-red-200 bg-red-50/60 text-red-700"
                          : "border-slate-200 text-ink"
                    }`}
                  >
                    <form action={completeFollowUp.bind(null, f.id, leadId)}>
                      <button
                        type="submit"
                        disabled={f.done}
                        aria-label={f.done ? "Done" : "Mark done"}
                        className={`flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-bold transition-colors ${
                          f.done
                            ? "border-emerald-300 bg-emerald-500 text-white"
                            : "border-slate-300 text-transparent hover:border-emerald-400 hover:text-emerald-500"
                        }`}
                      >
                        ✓
                      </button>
                    </form>
                    <div className="min-w-0 flex-1">
                      <p className={`truncate font-medium ${f.done ? "line-through" : ""}`}>
                        {f.title}
                      </p>
                      <p className="text-xs opacity-80">
                        {fmt.format(new Date(f.due_at))}
                        {f.assignee_name ? ` · ${f.assignee_name}` : ""}
                        {f.auto ? " · auto" : ""}
                        {overdue ? " · overdue" : ""}
                      </p>
                    </div>
                  </div>
                );
              })}
              {followUps.length === 0 && (
                <p className="text-xs text-slate-400">No follow-ups scheduled.</p>
              )}
            </div>
            <form action={followUpAction} className="mt-4 flex gap-2">
              <input
                name="title"
                required
                placeholder="New follow-up…"
                className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-brand focus:bg-white focus:outline-none"
              />
              <input
                name="due_at"
                type="date"
                required
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-brand focus:bg-white focus:outline-none"
              />
              <button
                type="submit"
                className="shrink-0 rounded-xl bg-ink px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white transition-colors hover:bg-slate-800"
              >
                Add
              </button>
            </form>
          </div>

          {lead.email && (
            <a
              href={`mailto:${lead.email}`}
              className="block rounded-2xl bg-gradient-to-r from-brand to-brand-light py-3.5 text-center text-xs font-semibold uppercase tracking-widest text-white shadow-lg shadow-brand/30 transition-all hover:shadow-brand/50"
            >
              Email {lead.name.split(" ")[0]}
            </a>
          )}

          {me.role === "super_admin" && (
            <DeleteLeadButton leadId={leadId} leadName={lead.name} />
          )}
        </div>
      </div>
    </div>
  );
}
