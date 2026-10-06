import Link from "next/link";
import PipelineBoard, { type BoardCard } from "@/app/admin/(app)/pipeline/PipelineBoard";
import { requireUser } from "@/lib/auth";
import { dealValue, money, scoreLead, type Lead, type LeadStats } from "@/lib/crm";
import { sql } from "@/lib/db";

export const metadata = { title: "Pipeline" };
export const dynamic = "force-dynamic";

export default async function PipelinePage({
  searchParams,
}: {
  searchParams: Promise<{ mine?: string }>;
}) {
  const me = await requireUser();
  const { mine } = await searchParams;
  const onlyMine = mine === "1";

  // Closed deals only show for the last 90 days to keep the board focused.
  const rows = (await sql`
    SELECT l.*, u.name AS assignee_name,
      (SELECT count(*) FROM lead_activities a WHERE a.lead_id = l.id
        AND a.type NOT IN ('status','assign'))::int AS activity_count,
      (SELECT max(created_at) FROM lead_activities a WHERE a.lead_id = l.id) AS last_activity_at,
      EXISTS (SELECT 1 FROM follow_ups f WHERE f.lead_id = l.id
        AND f.done = false AND f.due_at < now()) AS overdue
    FROM leads l LEFT JOIN users u ON u.id = l.assigned_to
    WHERE (l.status NOT IN ('won','lost') OR l.updated_at > now() - interval '90 days')
      AND (${onlyMine} = false OR l.assigned_to = ${me.id})
    ORDER BY l.updated_at DESC
    LIMIT 500`) as (Lead & LeadStats & { overdue: boolean })[];

  const cards: BoardCard[] = rows.map((l) => {
    const { score, temperature } = scoreLead(l);
    return {
      id: l.id,
      name: l.name,
      company: l.company,
      job_title: l.job_title,
      status: l.status,
      value: dealValue(l),
      score,
      temperature,
      assignee: l.assignee_name ?? null,
      linkedin: !!l.linkedin_url,
      overdue: l.overdue,
    };
  });

  const open = cards.filter((c) => c.status !== "won" && c.status !== "lost");
  const openValue = open.reduce((s, c) => s + c.value, 0);
  const wonValue = cards
    .filter((c) => c.status === "won")
    .reduce((s, c) => s + c.value, 0);
  // Weighted forecast by stage probability.
  const weights = { new: 0.1, contacted: 0.25, qualified: 0.6, won: 1, lost: 0 };
  const forecast = open.reduce((s, c) => s + c.value * weights[c.status], 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">Sales Pipeline</h1>
          <p className="mt-1 text-xs text-slate-500">
            Drag cards between stages. Badge shows the lead score.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/pipeline"
            className={`rounded-full px-4 py-2 text-xs font-semibold ring-1 ${
              !onlyMine ? "bg-ink text-white ring-ink" : "bg-white text-slate-600 ring-slate-200"
            }`}
          >
            All leads
          </Link>
          <Link
            href="/admin/pipeline?mine=1"
            className={`rounded-full px-4 py-2 text-xs font-semibold ring-1 ${
              onlyMine ? "bg-ink text-white ring-ink" : "bg-white text-slate-600 ring-slate-200"
            }`}
          >
            My leads
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          ["Open pipeline", money.format(openValue), `${open.length} open deals`],
          ["Weighted forecast", money.format(forecast), "Value × stage probability"],
          ["Won (90 days)", money.format(wonValue), `${cards.filter((c) => c.status === "won").length} deals`],
        ].map(([label, value, sub]) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-extrabold text-ink">{value}</p>
            <p className="mt-1 text-xs text-slate-400">{sub}</p>
          </div>
        ))}
      </div>

      <PipelineBoard cards={cards} />
    </div>
  );
}
