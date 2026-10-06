import Link from "next/link";
import { saveLinkedinProfile } from "@/app/admin/actions";
import { requireUser } from "@/lib/auth";
import {
  STATUS_STYLES,
  TEMPERATURE_STYLES,
  linkedinSearches,
  scoreLead,
  type Lead,
} from "@/lib/crm";
import { sql } from "@/lib/db";

export const metadata = { title: "LinkedIn Prospecting" };
export const dynamic = "force-dynamic";

const fmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });
const inputClass =
  "w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-ink placeholder:text-slate-400 focus:border-[#0a66c2] focus:bg-white focus:outline-none";

export default async function ProspectingPage() {
  await requireUser();

  const [queue, statsRows, recent] = await Promise.all([
    sql`SELECT l.*, u.name AS assignee_name FROM leads l
      LEFT JOIN users u ON u.id = l.assigned_to
      WHERE l.linkedin_url IS NULL AND l.status NOT IN ('won','lost')
        AND l.source <> 'newsletter'
      ORDER BY l.created_at DESC LIMIT 50`,
    sql`SELECT
      count(*) FILTER (WHERE status NOT IN ('won','lost') AND source <> 'newsletter')::int AS open,
      count(*) FILTER (WHERE linkedin_url IS NOT NULL AND status NOT IN ('won','lost') AND source <> 'newsletter')::int AS researched,
      count(*) FILTER (WHERE linkedin_url IS NULL AND status NOT IN ('won','lost') AND source <> 'newsletter')::int AS pending
      FROM leads`,
    sql`SELECT l.id, l.name, l.company, l.job_title, l.linkedin_url FROM leads l
      WHERE l.linkedin_url IS NOT NULL ORDER BY l.updated_at DESC LIMIT 8`,
  ]);
  const stats = statsRows[0] as { open: number; researched: number; pending: number };
  const coverage = stats.open ? Math.round((stats.researched / stats.open) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-bold text-ink">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0a66c2] text-sm font-bold text-white">
              in
            </span>
            LinkedIn Prospecting
          </h1>
          <p className="mt-1 max-w-2xl text-xs text-slate-500">
            Every new lead lands here until their LinkedIn profile is saved. Use the
            pre-filled searches, check job title and company, then paste the profile
            URL to enrich the lead.
          </p>
        </div>
        <Link
          href="/admin/leads/import"
          className="rounded-full bg-[#0a66c2] px-5 py-2.5 text-xs font-semibold uppercase tracking-widest text-white shadow-lg shadow-[#0a66c2]/30 hover:bg-[#004182]"
        >
          Import Sales Navigator list
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            Awaiting research
          </p>
          <p className="mt-2 text-3xl font-extrabold text-ink">{stats.pending}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            Profiles saved
          </p>
          <p className="mt-2 text-3xl font-extrabold text-ink">{stats.researched}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            LinkedIn coverage
          </p>
          <p className="mt-2 text-3xl font-extrabold text-ink">{coverage}%</p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-[#0a66c2]" style={{ width: `${coverage}%` }} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm xl:col-span-2">
          <div className="border-b border-slate-100 px-6 py-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-ink">
              Research Queue ({queue.length})
            </h2>
          </div>
          <div className="divide-y divide-slate-100">
            {(queue as Lead[]).map((l) => {
              const { score, temperature } = scoreLead(l);
              return (
                <div key={l.id} className="px-6 py-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={`/admin/leads/${l.id}`}
                        className="text-sm font-semibold text-ink hover:text-brand"
                      >
                        {l.name}
                      </Link>
                      <p className="mt-0.5 truncate text-xs text-slate-500">
                        {[l.job_title, l.company, l.email].filter(Boolean).join(" · ") ||
                          "No other details"}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2 text-[11px]">
                      <span className={`rounded-full px-2 py-0.5 font-bold ring-1 ${TEMPERATURE_STYLES[temperature].badge}`}>
                        {score}
                      </span>
                      <span className={`rounded-full px-2 py-0.5 font-semibold ring-1 ${STATUS_STYLES[l.status].badge}`}>
                        {STATUS_STYLES[l.status].label}
                      </span>
                      <span className="text-slate-400">{fmt.format(new Date(l.created_at))}</span>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {linkedinSearches(l).map((s) => (
                      <a
                        key={s.label}
                        href={s.href}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 hover:border-[#0a66c2] hover:text-[#0a66c2]"
                      >
                        {s.label} ↗
                      </a>
                    ))}
                  </div>
                  <form
                    action={saveLinkedinProfile.bind(null, l.id)}
                    className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-[2fr_1fr_1fr_auto]"
                  >
                    <input name="linkedin_url" required placeholder="Paste profile URL" className={inputClass} />
                    <input name="job_title" defaultValue={l.job_title ?? ""} placeholder="Job title" className={inputClass} />
                    <input name="company" defaultValue={l.company ?? ""} placeholder="Company" className={inputClass} />
                    <button
                      type="submit"
                      className="rounded-lg bg-[#0a66c2] px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-white hover:bg-[#004182]"
                    >
                      Save
                    </button>
                  </form>
                </div>
              );
            })}
            {queue.length === 0 && (
              <p className="px-6 py-14 text-center text-sm text-slate-400">
                All open leads have a LinkedIn profile saved. Nice work!
              </p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-6 py-4">
              <h2 className="text-sm font-bold uppercase tracking-widest text-ink">
                Recently Researched
              </h2>
            </div>
            <div className="divide-y divide-slate-100">
              {(recent as Pick<Lead, "id" | "name" | "company" | "job_title" | "linkedin_url">[]).map((l) => (
                <div key={l.id} className="flex items-center justify-between gap-3 px-6 py-3.5">
                  <div className="min-w-0">
                    <Link href={`/admin/leads/${l.id}`} className="truncate text-sm font-semibold text-ink hover:text-brand">
                      {l.name}
                    </Link>
                    <p className="truncate text-xs text-slate-500">
                      {[l.job_title, l.company].filter(Boolean).join(" · ") || "—"}
                    </p>
                  </div>
                  <a
                    href={l.linkedin_url!}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 rounded bg-[#0a66c2] px-1.5 py-0.5 text-[11px] font-bold text-white"
                  >
                    in
                  </a>
                </div>
              ))}
              {recent.length === 0 && (
                <p className="px-6 py-8 text-center text-sm text-slate-400">None yet.</p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-[#0a66c2]/20 bg-[#0a66c2]/[0.03] p-6 shadow-sm">
            <h2 className="text-sm font-bold uppercase tracking-widest text-ink">
              Outreach Playbook
            </h2>
            <ol className="mt-4 space-y-3 text-sm text-slate-600">
              {[
                "Find and save the profile. Confirm role and company match.",
                "Send a personalised connection request (mention their sector or contract type).",
                "Log it as LinkedIn activity on the lead.",
                "Once connected, use the “After LinkedIn connect” email template.",
                "Book a follow-up for 3–5 days if there's no reply.",
              ].map((s, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#0a66c2] text-[10px] font-bold text-white">
                    {i + 1}
                  </span>
                  <span className="leading-snug">{s}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
