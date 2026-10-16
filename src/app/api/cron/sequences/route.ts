import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import {
  SEQUENCE_STEPS,
  deliverLeadEmail,
  templateForLead,
} from "@/lib/outreach";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/*
 * Daily sender for sequence steps. Vercel cron hits this once a day
 * (see vercel.json). Set CRON_SECRET in the environment to require a
 * matching `Authorization: Bearer <secret>` header; unset = open (dev).
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const origin = (
    process.env.SITE_URL ?? "https://thecontractorbroker.com"
  ).replace(/\/$/, "");

  const due = (await sql`
    SELECT e.id AS enrolment_id, e.step, e.created_by,
           l.id AS lead_id, l.name, l.email, l.company, l.status
    FROM sequence_enrolments e
    JOIN leads l ON l.id = e.lead_id
    WHERE e.active = true AND e.next_send_at <= now()
    ORDER BY e.next_send_at
    LIMIT 100`) as {
    enrolment_id: number;
    step: number;
    created_by: number | null;
    lead_id: number;
    name: string;
    email: string | null;
    company: string | null;
    status: string;
  }[];

  let sent = 0;
  let stopped = 0;
  let failed = 0;
  for (const row of due) {
    const stepDef = SEQUENCE_STEPS[row.step];
    // Stop when the lead is closed, engaged, missing an email, or out of steps.
    if (!stepDef || !row.email || ["won", "lost", "qualified"].includes(row.status)) {
      await sql`UPDATE sequence_enrolments SET active = false WHERE id = ${row.enrolment_id}`;
      stopped++;
      continue;
    }
    const t = templateForLead(stepDef.template, row);
    if (!t) {
      await sql`UPDATE sequence_enrolments SET active = false WHERE id = ${row.enrolment_id}`;
      stopped++;
      continue;
    }
    const result = await deliverLeadEmail({
      lead: { id: row.lead_id, name: row.name, email: row.email, company: row.company, status: row.status },
      subject: t.subject,
      body: t.body,
      template: stepDef.template,
      userId: row.created_by,
      origin,
      sequenceStep: row.step,
    });
    if (result.error) {
      failed++;
      continue;
    }
    sent++;
    const next = SEQUENCE_STEPS[row.step + 1];
    if (next) {
      const nextAt = new Date(Date.now() + next.delayDays * 864e5).toISOString();
      await sql`
        UPDATE sequence_enrolments
        SET step = ${row.step + 1}, next_send_at = ${nextAt}
        WHERE id = ${row.enrolment_id}`;
    } else {
      await sql`UPDATE sequence_enrolments SET active = false WHERE id = ${row.enrolment_id}`;
    }
  }

  return NextResponse.json({ due: due.length, sent, stopped, failed });
}
