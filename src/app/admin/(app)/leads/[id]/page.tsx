import Link from "next/link";
import { notFound } from "next/navigation";
import DeleteLeadButton from "@/app/admin/(app)/leads/[id]/DeleteLeadButton";
import EmailComposer from "@/app/admin/(app)/leads/[id]/EmailComposer";
import {
  addFollowUp,
  assignLead,
  completeFollowUp,
  logActivity,
  saveLinkedinProfile,
  updateLeadDetails,
  updateLeadStatus,
} from "@/app/admin/actions";
import { requireUser } from "@/lib/auth";
import {
  ACTIVITY_STYLES,
  LEAD_STATUSES,
  LOGGABLE_ACTIVITIES,
  STATUS_STYLES,
  TEMPERATURE_STYLES,
  dealValue,
  linkedinSearches,
  money,
  nextSteps,
  scoreLead,
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

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-ink placeholder:text-slate-400 focus:border-brand focus:bg-white focus:outline-none";
const cardClass = "rounded-2xl border border-slate-200 bg-white p-6 shadow-sm";
const labelClass =
  "text-[11px] font-semibold uppercase tracking-widest text-slate-400";

const SOURCES = [
  ["contact form", "Website contact form"],
  ["manual", "Manual entry"],
  ["phone", "Phone enquiry"],
  ["linkedin", "LinkedIn / Sales Navigator"],
  ["linkedin import", "LinkedIn import"],
  ["referral", "Referral"],
  ["event", "Event / expo"],
  ["newsletter", "Newsletter"],
  ["other", "Other"],
];

function hostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

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

  // Pages this person viewed on the website (matched by IP).
  const journey = lead.ip
    ? ((await sql`
        SELECT pv.path, pv.created_at, v.city, v.country
        FROM page_views pv JOIN visitors v ON v.id = pv.visitor_id
        WHERE v.ip = ${lead.ip}
        ORDER BY pv.created_at DESC LIMIT 25`) as {
        path: string;
        created_at: string;
        city: string | null;
        country: string | null;
      }[])
    : [];

  const acts = activity as LeadActivity[];
  const { score, temperature } = scoreLead({
    ...lead,
    activity_count: acts.filter((a) => a.type !== "status" && a.type !== "assign").length,
    last_activity_at: acts[0]?.created_at ?? null,
  });

  const statusAction = updateLeadStatus.bind(null, leadId);
  const assignAction = assignLead.bind(null, leadId);
  const followUpAction = addFollowUp.bind(null, leadId);

  const now = new Date();
  const openFollowUps = (followUps as FollowUp[]).filter((f) => !f.done);
  const steps = nextSteps(lead, {
    overdue: openFollowUps.some((f) => new Date(f.due_at) < now),
    hasNotes: acts.some((a) => a.type === "note"),
  });
  const value = dealValue(lead);
  const telHref = lead.phone ? `tel:${lead.phone.replace(/[^\d+]/g, "")}` : null;

  return (
    <div className="space-y-6">
      <Link
        href="/admin/leads"
        className="text-xs font-semibold uppercase tracking-widest text-slate-500 hover:text-brand"
      >
        ← Back to leads
      </Link>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          {/* header */}
          <div className={cardClass}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-orange-500 text-xl font-bold text-white">
                  {lead.name.charAt(0).toUpperCase()}
                </span>
                <div>
                  <h1 className="text-2xl font-bold text-ink">{lead.name}</h1>
                  <p className="mt-0.5 text-sm text-slate-500">
                    {[lead.job_title, lead.company].filter(Boolean).join(" at ") ||
                      "No job title or company yet"}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ${TEMPERATURE_STYLES[temperature].badge}`}
                  title="Lead score based on fit, intent, engagement and recency"
                >
                  {TEMPERATURE_STYLES[temperature].label} · {score}
                </span>
                <span
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ${STATUS_STYLES[lead.status].badge}`}
                >
                  {STATUS_STYLES[lead.status].label}
                </span>
              </div>
            </div>

            {lead.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {lead.tags.map((t) => (
                  <Link
                    key={t}
                    href={`/admin/leads?tag=${encodeURIComponent(t)}`}
                    className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-200"
                  >
                    #{t}
                  </Link>
                ))}
              </div>
            )}

            {/* quick actions */}
            <div className="mt-5 flex flex-wrap gap-2">
              {lead.email && (
                <a
                  href="#email"
                  className="rounded-xl bg-ink px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-800"
                >
                  ✉ Email
                </a>
              )}
              {telHref && (
                <a
                  href={telHref}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-ink hover:border-brand hover:text-brand"
                >
                  ☎ Call {lead.phone}
                </a>
              )}
              {lead.linkedin_url ? (
                <a
                  href={lead.linkedin_url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl bg-[#0a66c2] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#004182]"
                >
                  in LinkedIn Profile
                </a>
              ) : (
                <a
                  href="#linkedin"
                  className="rounded-xl border border-[#0a66c2]/40 px-4 py-2.5 text-xs font-semibold text-[#0a66c2] hover:bg-[#0a66c2]/5"
                >
                  in Find on LinkedIn
                </a>
              )}
            </div>

            <dl className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["Email", lead.email],
                ["Phone", lead.phone],
                ["Est. value", value ? money.format(value) : null],
                ["Assigned to", lead.assignee_name],
                ["Source", lead.source],
                ["Received", fmt.format(new Date(lead.created_at))],
                [
                  "Last contacted",
                  lead.last_contacted_at
                    ? fmt.format(new Date(lead.last_contacted_at))
                    : null,
                ],
                ["Company", lead.company],
              ].map(([k, v]) => (
                <div key={k} className="min-w-0 rounded-xl bg-slate-50 px-4 py-3">
                  <dt className={labelClass}>{k}</dt>
                  <dd className="mt-1 truncate text-sm font-medium text-ink">
                    {v ?? "—"}
                  </dd>
                </div>
              ))}
            </dl>

            {lead.message && (
              <div className="mt-6">
                <p className={labelClass}>Enquiry message</p>
                <p className="mt-2 whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm leading-relaxed text-ink">
                  {lead.message}
                </p>
              </div>
            )}

            {/* edit details */}
            <details className="group mt-6 rounded-xl border border-slate-200">
              <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-xs font-semibold uppercase tracking-widest text-slate-500 hover:text-brand">
                Edit details
                <span className="transition-transform group-open:rotate-180">⌄</span>
              </summary>
              <form
                action={updateLeadDetails.bind(null, leadId)}
                className="grid gap-3 border-t border-slate-100 p-4 sm:grid-cols-2"
              >
                <input name="name" required defaultValue={lead.name} placeholder="Full name *" className={inputClass} />
                <input name="email" type="email" defaultValue={lead.email ?? ""} placeholder="Email" className={inputClass} />
                <input name="phone" defaultValue={lead.phone ?? ""} placeholder="Phone" className={inputClass} />
                <input name="company" defaultValue={lead.company ?? ""} placeholder="Company" className={inputClass} />
                <input name="job_title" defaultValue={lead.job_title ?? ""} placeholder="Job title" className={inputClass} />
                <input name="deal_value" inputMode="decimal" defaultValue={value || ""} placeholder="Estimated value (£)" className={inputClass} />
                <input name="linkedin_url" defaultValue={lead.linkedin_url ?? ""} placeholder="LinkedIn profile URL" className={`${inputClass} sm:col-span-2`} />
                <input name="tags" defaultValue={lead.tags.join(", ")} placeholder="Tags, comma separated (e.g. it, outside-ir35)" className={inputClass} />
                <select name="source" defaultValue={lead.source} className={inputClass}>
                  {SOURCES.map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                  {!SOURCES.some(([v]) => v === lead.source) && (
                    <option value={lead.source}>{lead.source}</option>
                  )}
                </select>
                <button
                  type="submit"
                  className="rounded-xl bg-ink px-5 py-2.5 text-xs font-semibold uppercase tracking-widest text-white hover:bg-slate-800 sm:col-span-2 sm:justify-self-start"
                >
                  Save changes
                </button>
              </form>
            </details>
          </div>

          {/* LinkedIn research */}
          <div id="linkedin" className={`${cardClass} scroll-mt-24`}>
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-ink">
                <span className="flex h-6 w-6 items-center justify-center rounded bg-[#0a66c2] text-[11px] font-bold normal-case text-white">
                  in
                </span>
                LinkedIn Research
              </h2>
              {lead.linkedin_url && (
                <span className="text-xs font-semibold text-emerald-600">✓ Profile saved</span>
              )}
            </div>
            {lead.linkedin_url && (
              <a
                href={lead.linkedin_url}
                target="_blank"
                rel="noreferrer"
                className="mt-3 block truncate text-sm font-medium text-[#0a66c2] hover:underline"
              >
                {lead.linkedin_url}
              </a>
            )}
            <p className="mt-3 text-xs text-slate-500">
              Search pre-filled with their name{lead.company ? " and company" : ""}. Open a
              search, find the right person, then paste their profile below.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {linkedinSearches(lead).map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-ink transition-colors hover:border-[#0a66c2] hover:text-[#0a66c2]"
                >
                  {s.label} ↗
                </a>
              ))}
            </div>
            <form
              action={saveLinkedinProfile.bind(null, leadId)}
              className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto]"
            >
              <input
                name="linkedin_url"
                required
                defaultValue={lead.linkedin_url ?? ""}
                placeholder="Paste LinkedIn profile URL"
                className={inputClass}
              />
              <button
                type="submit"
                className="rounded-xl bg-[#0a66c2] px-5 py-2.5 text-xs font-semibold uppercase tracking-widest text-white hover:bg-[#004182]"
              >
                Save profile
              </button>
              <input
                name="job_title"
                defaultValue={lead.job_title ?? ""}
                placeholder="Job title (from their profile)"
                className={inputClass}
              />
              <input
                name="company"
                defaultValue={lead.company ?? ""}
                placeholder="Company"
                className={`${inputClass} sm:w-56`}
              />
            </form>
          </div>

          {/* email composer */}
          {lead.email && (
            <div id="email" className={`${cardClass} scroll-mt-24`}>
              <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-ink">
                Send Email
              </h2>
              <EmailComposer
                leadId={leadId}
                leadName={lead.name}
                leadEmail={lead.email}
                company={lead.company}
                senderName={me.name}
              />
            </div>
          )}

          {/* timeline */}
          <div className={cardClass}>
            <h2 className="text-sm font-bold uppercase tracking-widest text-ink">
              Activity Timeline
            </h2>
            <form
              action={logActivity.bind(null, leadId)}
              className="mt-4 flex flex-col gap-3 sm:flex-row"
            >
              <select name="type" defaultValue="note" className={`${inputClass} sm:w-36`}>
                {LOGGABLE_ACTIVITIES.map((a) => (
                  <option key={a.type} value={a.type}>
                    {a.label}
                  </option>
                ))}
              </select>
              <input
                name="note"
                required
                placeholder="Call outcome, meeting notes, LinkedIn message sent…"
                className={`${inputClass} flex-1`}
              />
              <button
                type="submit"
                className="rounded-xl bg-ink px-5 py-2.5 text-xs font-semibold uppercase tracking-widest text-white transition-colors hover:bg-slate-800"
              >
                Log
              </button>
            </form>
            <div className="mt-6">
              {acts.map((a, i) => {
                const style = ACTIVITY_STYLES[a.type] ?? ACTIVITY_STYLES.update;
                return (
                  <div key={a.id} className="relative flex gap-4 pb-6 last:pb-0">
                    {i !== acts.length - 1 && (
                      <span className="absolute left-[9px] top-6 h-full w-px bg-slate-200" />
                    )}
                    <span
                      className={`relative z-10 mt-1 h-[18px] w-[18px] shrink-0 rounded-full border-4 border-white shadow ${style.dot}`}
                    />
                    <div className="min-w-0">
                      <p className="text-sm text-ink">
                        <span className="font-semibold">{a.user_name ?? "System"}</span>{" "}
                        <span className="text-slate-500">{style.verb}</span>
                      </p>
                      {a.body && (
                        <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">
                          {a.type === "email" && a.body.length > 400
                            ? `${a.body.slice(0, 400)}…`
                            : a.body}
                        </p>
                      )}
                      <p className="mt-1 text-[11px] text-slate-400">
                        {fmt.format(new Date(a.created_at))}
                      </p>
                    </div>
                  </div>
                );
              })}
              {acts.length === 0 && (
                <p className="py-4 text-center text-sm text-slate-400">
                  No activity yet. Log the first touchpoint above.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* sidebar */}
        <div className="space-y-6">
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

          <div className={cardClass}>
            <h2 className="text-sm font-bold uppercase tracking-widest text-ink">
              Pipeline Stage
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
                    <span className={`h-2.5 w-2.5 rounded-full ${STATUS_STYLES[s].dot}`} />
                    {STATUS_STYLES[s].label}
                    {lead.status === s && <span className="ml-auto text-xs">current</span>}
                  </button>
                </form>
              ))}
            </div>
          </div>

          <div className={cardClass}>
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
          <div className={cardClass}>
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
            <form action={followUpAction} className="mt-4 flex flex-wrap gap-2">
              <input
                name="title"
                required
                placeholder="New follow-up, e.g. Call to discuss comparison"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-brand focus:bg-white focus:outline-none"
              />
              <input
                name="due_at"
                type="date"
                required
                className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-brand focus:bg-white focus:outline-none"
              />
              <button
                type="submit"
                className="shrink-0 rounded-xl bg-ink px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white transition-colors hover:bg-slate-800"
              >
                Add
              </button>
            </form>
          </div>

          {/* marketing attribution */}
          <div className={cardClass}>
            <h2 className="text-sm font-bold uppercase tracking-widest text-ink">
              Marketing Attribution
            </h2>
            <dl className="mt-4 space-y-2.5 text-sm">
              {[
                ["Source", lead.source],
                ["Campaign", lead.utm_campaign],
                ["UTM source / medium", [lead.utm_source, lead.utm_medium].filter(Boolean).join(" / ") || null],
                ["Referrer", lead.referrer ? hostname(lead.referrer) : null],
                ["Landing page", lead.landing_page],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3">
                  <dt className="text-slate-500">{k}</dt>
                  <dd className="truncate text-right font-medium text-ink">{v ?? "—"}</dd>
                </div>
              ))}
            </dl>
            {journey.length > 0 && (
              <>
                <p className={`${labelClass} mt-5`}>
                  Website journey
                  {journey[0].city || journey[0].country
                    ? ` · ${[journey[0].city, journey[0].country].filter(Boolean).join(", ")}`
                    : ""}
                </p>
                <ol className="mt-2 space-y-1.5">
                  {journey.map((j, i) => (
                    <li key={i} className="flex justify-between gap-3 text-xs">
                      <span className="truncate font-medium text-ink">{j.path}</span>
                      <span className="shrink-0 text-slate-400">
                        {fmt.format(new Date(j.created_at))}
                      </span>
                    </li>
                  ))}
                </ol>
              </>
            )}
            {!lead.ip && lead.source === "contact form" && (
              <p className="mt-4 text-xs text-slate-400">
                Website journey is recorded for enquiries from now on.
              </p>
            )}
          </div>

          {me.role === "super_admin" && (
            <DeleteLeadButton leadId={leadId} leadName={lead.name} />
          )}
        </div>
      </div>
    </div>
  );
}
