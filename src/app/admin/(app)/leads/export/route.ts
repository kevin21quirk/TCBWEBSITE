import { requireUser } from "@/lib/auth";
import { LEAD_STATUSES, dealValue, scoreLead, type Lead } from "@/lib/crm";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

const cell = (v: unknown) => {
  const s = v == null ? "" : String(v);
  // Quote everything; neutralise spreadsheet formula injection.
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
};

export async function GET(req: Request) {
  await requireUser();
  const p = new URL(req.url).searchParams;
  const q = p.get("q") ?? "";
  const status = (LEAD_STATUSES as readonly string[]).includes(p.get("status") ?? "")
    ? p.get("status")
    : null;
  const source = p.get("source") ?? "";
  const tag = p.get("tag") ?? "";
  const pattern = `%${q}%`;

  const rows = (await sql`
    SELECT l.*, u.name AS assignee_name FROM leads l
    LEFT JOIN users u ON u.id = l.assigned_to
    WHERE (${q} = '' OR l.name ILIKE ${pattern} OR l.email ILIKE ${pattern}
           OR l.phone ILIKE ${pattern} OR l.company ILIKE ${pattern})
      AND (${status}::text IS NULL OR l.status = ${status})
      AND (${source} = '' OR l.source = ${source})
      AND (${tag} = '' OR ${tag} = ANY(l.tags))
    ORDER BY l.created_at DESC LIMIT 10000`) as Lead[];

  const header = [
    "Name", "Email", "Phone", "Company", "Job title", "LinkedIn", "Stage",
    "Score", "Temperature", "Value (GBP)", "Owner", "Source", "Tags",
    "UTM source", "UTM medium", "UTM campaign", "Landing page",
    "Last contacted", "Created",
  ];
  const lines = rows.map((l) => {
    const { score, temperature } = scoreLead(l);
    return [
      l.name, l.email, l.phone, l.company, l.job_title, l.linkedin_url, l.status,
      score, temperature, dealValue(l) || "", l.assignee_name, l.source,
      l.tags.join("; "), l.utm_source, l.utm_medium, l.utm_campaign, l.landing_page,
      l.last_contacted_at ? new Date(l.last_contacted_at).toISOString() : "",
      new Date(l.created_at).toISOString(),
    ]
      .map(cell)
      .join(",");
  });

  const csv = "\uFEFF" + [header.map(cell).join(","), ...lines].join("\r\n");
  const date = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="tcb-leads-${date}.csv"`,
    },
  });
}
