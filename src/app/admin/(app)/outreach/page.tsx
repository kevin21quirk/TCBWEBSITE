import Link from "next/link";
import { sql } from "@/lib/db";
import { STATUS_STYLES, type LeadStatus } from "@/lib/crm";
import { SEQUENCE_STEPS } from "@/lib/outreach";
import CampaignComposer from "./CampaignComposer";
import SequenceControls from "./SequenceControls";

export const metadata = { title: "Outreach" };
export const dynamic = "force-dynamic";

const fmt = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});
const fmtDate = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
});
const cardClass = "rounded-2xl border border-slate-200 bg-white p-6 shadow-sm";

type WarmLead = {
  id: number;
  name: string;
  company: string | null;
  status: LeadStatus;
  opens: number;
  last_open: string | null;
};

type BrowseLead = {
  id: number;
  name: string;
  company: string | null;
  status: LeadStatus;
  views: number;
  last_view: string | null;
  last_path: string | null;
};

type SeqRow = {
  lead_id: number;
  step: number;
  next_send_at: string | null;
  active: boolean;
  lead_name: string;
};

type CampaignRow = {
  id: number;
  name: string;
  template: string;
  sent: number;
  failed: number;
  skipped: number;
  opens: number | null;
  created_at: string;
  by_name: string | null;
};

export default async function OutreachPage() {
  const [
    leadRows,
    warmRows,
    seqRows,
    browsingRows,
    campaignRows,
    sendStats,
    weekOpenRows,
    seqCountRows,
  ] = await Promise.all([
    sql`SELECT id, name, email, company, status FROM leads
        WHERE email IS NOT NULL AND status NOT IN ('won','lost')
        ORDER BY created_at DESC LIMIT 300`,
    sql`SELECT l.id, l.name, l.company, l.status,
          sum(s.open_count)::int AS opens, max(s.opened_at) AS last_open
        FROM email_sends s JOIN leads l ON l.id = s.lead_id
        WHERE s.open_count > 0
          AND s.opened_at > now() - interval '30 days'
          AND l.status NOT IN ('won','lost')
        GROUP BY l.id, l.name, l.company, l.status
        ORDER BY last_open DESC LIMIT 10`,
    sql`SELECT e.lead_id, e.step, e.next_send_at, e.active, l.name AS lead_name
        FROM sequence_enrolments e JOIN leads l ON l.id = e.lead_id
        ORDER BY e.active DESC, e.next_send_at NULLS LAST LIMIT 30`,
    sql`SELECT l.id, l.name, l.company, l.status,
          count(*)::int AS views, max(pv.created_at) AS last_view,
          (SELECT path FROM page_views p2 WHERE p2.lead_id = l.id
            ORDER BY p2.created_at DESC LIMIT 1) AS last_path
        FROM page_views pv JOIN leads l ON l.id = pv.lead_id
        WHERE pv.created_at > now() - interval '14 days'
          AND l.status NOT IN ('won','lost')
        GROUP BY l.id, l.name, l.company, l.status
        ORDER BY last_view DESC LIMIT 10`,
    sql`SELECT c.*, u.name AS by_name,
          (SELECT sum(s.open_count)::int FROM email_sends s
            WHERE s.campaign_id = c.id) AS opens
        FROM campaigns c LEFT JOIN users u ON u.id = c.created_by
        ORDER BY c.created_at DESC LIMIT 15`,
    sql`SELECT count(*)::int AS sends,
          count(*) FILTER (WHERE open_count > 0)::int AS opened
        FROM email_sends`,
    sql`SELECT count(*)::int AS n FROM email_sends
        WHERE opened_at > now() - interval '7 days'`,
    sql`SELECT count(*)::int AS n FROM sequence_enrolments WHERE active = true`,
  ]);

  const stats = sendStats[0] as { sends: number; opened: number };
  const openRate = stats.sends
    ? Math.round((stats.opened / stats.sends) * 100)
    : 0;
  const opensThisWeek = (weekOpenRows[0] as { n: number }).n;
  const activeSequences = (seqCountRows[0] as { n: number }).n;

  const warm = warmRows as WarmLead[];
  const browsing = browsingRows as BrowseLead[];
  const seqs = seqRows as SeqRow[];
  const campaigns = campaignRows as CampaignRow[];
  const runningSeqs = seqs.filter((s) => s.active);
  const finishedSeqs = seqs.filter((s) => !s.active);

  const statCards = [
    { label: "Emails sent", value: stats.sends.toLocaleString("en-GB") },
    { label: "Open rate", value: `${openRate}%` },
    { label: "Opens this week", value: opensThisWeek.toLocaleString("en-GB") },
    { label: "Sequences running", value: activeSequences.toLocaleString("en-GB") },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-ink">Outreach</h1>
        <p className="mt-1 text-sm text-slate-500">
          Send campaigns, run automated follow-up sequences and see who&apos;s
          opening your emails — all from{" "}
          <span className="font-semibold text-ink">
            hello@thecontractorbroker.com
          </span>
          .
        </p>
      </header>

      {/* stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((s) => (
          <div key={s.label} className={`${cardClass} !p-4`}>
            <p className="text-2xl font-bold text-ink">{s.value}</p>
            <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
              {s.label}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          {/* campaign composer */}
          <div className={cardClass}>
            <h2 className="text-sm font-bold uppercase tracking-widest text-ink">
              Start a Campaign
            </h2>
            <p className="mb-4 mt-1 text-xs text-slate-500">
              One personalised email per selected lead — sent from Joey at
              hello@thecontractorbroker.com.
            </p>
            <CampaignComposer
              leads={
                leadRows as {
                  id: number;
                  name: string;
                  email: string | null;
                  company: string | null;
                  status: string;
                }[]
              }
            />
          </div>

          {/* past campaigns */}
          <div className={cardClass}>
            <h2 className="text-sm font-bold uppercase tracking-widest text-ink">
              Past Campaigns
            </h2>
            {campaigns.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-400">
                No campaigns sent yet — your first one is just above.
              </p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-[11px] uppercase tracking-widest text-slate-400">
                      <th className="pb-2 pr-4 font-semibold">Campaign</th>
                      <th className="pb-2 pr-4 font-semibold">Sent</th>
                      <th className="pb-2 pr-4 font-semibold">Failed</th>
                      <th className="pb-2 pr-4 font-semibold">Opens</th>
                      <th className="pb-2 font-semibold">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.map((c) => (
                      <tr
                        key={c.id}
                        className="border-b border-slate-100 last:border-0"
                      >
                        <td className="py-2.5 pr-4">
                          <p className="font-semibold text-ink">{c.name}</p>
                          <p className="text-[11px] text-slate-400">
                            {c.by_name ?? "Team"} · {c.template}
                            {c.skipped ? ` · ${c.skipped} skipped` : ""}
                          </p>
                        </td>
                        <td className="py-2.5 pr-4 font-semibold text-ink">
                          {c.sent}
                        </td>
                        <td className="py-2.5 pr-4 text-slate-500">
                          {c.failed}
                        </td>
                        <td className="py-2.5 pr-4">
                          {c.opens ? (
                            <span className="font-semibold text-emerald-600">
                              {c.opens}
                            </span>
                          ) : (
                            <span className="text-slate-400">0</span>
                          )}
                        </td>
                        <td className="py-2.5 text-xs text-slate-400">
                          {fmt.format(new Date(c.created_at))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* warm list */}
          <div className="rounded-2xl border border-brand/20 bg-gradient-to-br from-brand/[0.05] to-orange-50 p-6 shadow-sm">
            <h2 className="text-sm font-bold uppercase tracking-widest text-ink">
              Warm Right Now
            </h2>
            <p className="mb-4 mt-1 text-xs text-slate-500">
              Leads who opened an email in the last 30 days — strike while
              they&apos;re reading.
            </p>
            {warm.length === 0 ? (
              <p className="py-4 text-center text-sm text-slate-400">
                No opens tracked yet.
              </p>
            ) : (
              <ul className="space-y-2.5">
                {warm.map((l) => (
                  <li key={l.id}>
                    <Link
                      href={`/admin/leads/${l.id}`}
                      className="flex items-center gap-3 rounded-xl border border-white/60 bg-white/70 px-3.5 py-2.5 transition-colors hover:border-brand/40 hover:bg-white"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand to-orange-500 text-xs font-bold text-white">
                        {l.name.charAt(0).toUpperCase()}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-ink">
                          {l.name}
                          {l.company && (
                            <span className="font-normal text-slate-400">
                              {" "}
                              · {l.company}
                            </span>
                          )}
                        </span>
                        <span className="block text-[11px] text-slate-500">
                          Opened {l.opens}×
                          {l.last_open &&
                            ` · last ${fmtDate.format(new Date(l.last_open))}`}
                        </span>
                      </span>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${STATUS_STYLES[l.status].badge}`}
                      >
                        {STATUS_STYLES[l.status].label}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* tracked site visits */}
          <div className={cardClass}>
            <h2 className="text-sm font-bold uppercase tracking-widest text-ink">
              Browsing the Site
            </h2>
            <p className="mb-4 mt-1 text-xs text-slate-500">
              Leads who clicked a tracked link (?r=) in the last 14 days — every
              page they view is logged on their timeline.
            </p>
            {browsing.length === 0 ? (
              <p className="py-4 text-center text-sm text-slate-400">
                No tracked visits yet — send a smart link from a lead&apos;s
                profile.
              </p>
            ) : (
              <ul className="space-y-2.5">
                {browsing.map((l) => (
                  <li key={l.id}>
                    <Link
                      href={`/admin/leads/${l.id}`}
                      className="flex items-center gap-3 rounded-xl border border-slate-200 px-3.5 py-2.5 transition-colors hover:border-teal-300 hover:bg-teal-50/40"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-ink">
                          {l.name}
                          {l.company && (
                            <span className="font-normal text-slate-400">
                              {" "}
                              · {l.company}
                            </span>
                          )}
                        </span>
                        <span className="block truncate text-[11px] text-slate-500">
                          {l.views} view{l.views === 1 ? "" : "s"}
                          {l.last_path && ` · last on ${l.last_path}`}
                          {l.last_view &&
                            ` · ${fmt.format(new Date(l.last_view))}`}
                        </span>
                      </span>
                      <span className="flex h-2 w-2 shrink-0 rounded-full bg-teal-500" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* sequences */}
          <div className={cardClass}>
            <h2 className="text-sm font-bold uppercase tracking-widest text-ink">
              Sequences
            </h2>
            <p className="mb-4 mt-1 text-xs leading-relaxed text-slate-500">
              Auto-chase a lead until they convert or you stop it:{" "}
              {SEQUENCE_STEPS.map((s, i) => (
                <span key={s.template}>
                  {i > 0 && <span className="text-slate-300"> → </span>}
                  <span className="font-semibold text-ink">
                    {i === 0 ? "now" : `+${s.delayDays}d`}
                  </span>{" "}
                  {s.template}
                </span>
              ))}
              . Start one from any lead&apos;s profile.
            </p>
            {runningSeqs.length === 0 ? (
              <p className="py-4 text-center text-sm text-slate-400">
                No sequences running.
              </p>
            ) : (
              <ul className="space-y-3">
                {runningSeqs.map((s) => (
                  <li
                    key={s.lead_id}
                    className="rounded-xl border border-slate-200 px-3.5 py-2.5"
                  >
                    <Link
                      href={`/admin/leads/${s.lead_id}`}
                      className="block truncate text-sm font-semibold text-ink hover:text-brand"
                    >
                      {s.lead_name}
                    </Link>
                    <div className="mt-1.5">
                      <SequenceControls
                        leadId={s.lead_id}
                        step={s.step}
                        nextSendAt={s.next_send_at}
                        totalSteps={SEQUENCE_STEPS.length}
                        compact
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {finishedSeqs.length > 0 && (
              <details className="mt-4">
                <summary className="cursor-pointer text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                  Finished / stopped ({finishedSeqs.length})
                </summary>
                <ul className="mt-2 space-y-1.5">
                  {finishedSeqs.map((s) => (
                    <li key={s.lead_id}>
                      <Link
                        href={`/admin/leads/${s.lead_id}`}
                        className="text-xs text-slate-500 hover:text-brand"
                      >
                        {s.lead_name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
