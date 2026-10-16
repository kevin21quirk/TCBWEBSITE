import { NextResponse } from "next/server";
import { Webhook } from "svix";
import { sql } from "@/lib/db";

/*
 * Resend -> CRM event bridge. Configure in the Resend dashboard:
 * endpoint  https://thecontractorbroker.com/api/webhooks/resend
 * events    email.opened, email.clicked, email.bounced
 * secret    RESEND_WEBHOOK_SECRET (whsec_...)
 */
export async function POST(request: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  const payload = await request.text();
  let event: { type?: string; data?: { email_id?: string; to?: string[] } };
  try {
    event = new Webhook(secret).verify(payload, {
      "svix-id": request.headers.get("svix-id") ?? "",
      "svix-timestamp": request.headers.get("svix-timestamp") ?? "",
      "svix-signature": request.headers.get("svix-signature") ?? "",
    }) as unknown as typeof event;
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const emailId = event.data?.email_id;
  if (!emailId) return NextResponse.json({ ok: true });

  if (event.type === "email.opened" || event.type === "email.clicked") {
    const opened = event.type === "email.opened";
    const rows = opened
      ? await sql`
          UPDATE email_sends
          SET open_count = open_count + 1, opened_at = COALESCE(opened_at, now())
          WHERE resend_id = ${emailId}
          RETURNING lead_id, open_count AS n`
      : await sql`
          UPDATE email_sends
          SET click_count = click_count + 1, clicked_at = COALESCE(clicked_at, now())
          WHERE resend_id = ${emailId}
          RETURNING lead_id, click_count AS n`;
    const s = rows[0] as { lead_id: number; n: number } | undefined;
    if (!s) return NextResponse.json({ ok: true });
    // One timeline entry per send — the first open or click, not every pixel fire.
    if (s.n === 1) {
      await sql`
        INSERT INTO lead_activities (lead_id, user_id, type, body)
        VALUES (${s.lead_id}, NULL, ${opened ? "open" : "click"},
                ${opened ? "Opened the email" : "Clicked a link in the email"})`;
    }
  } else if (event.type === "email.bounced") {
    const rows = await sql`
      SELECT lead_id FROM email_sends WHERE resend_id = ${emailId} LIMIT 1`;
    const s = rows[0] as { lead_id: number } | undefined;
    if (s) {
      await sql`
        INSERT INTO lead_activities (lead_id, user_id, type, body)
        VALUES (${s.lead_id}, NULL, 'bounce', 'Email bounced — check the address')`;
    }
  }

  return NextResponse.json({ ok: true });
}
