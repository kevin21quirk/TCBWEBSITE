import { site } from "@/lib/content";
import { sql } from "@/lib/db";
import { brandedEmail, salesEmail } from "@/lib/emails";
import { EMAIL_TEMPLATES, fillTemplate } from "@/lib/crm";

/** EMAIL_TEMPLATES ids that send as the fully branded outreach email. */
export const BRANDED_TEMPLATE_IDS = new Set(["new-lead", "follow-up"]);

/**
 * Intro sequence: the enrol action sends step 0 immediately; the daily cron
 * sends each later step `delayDays` after the previous one. Stops when the
 * lead is won/lost/qualified, loses its email, or someone stops it manually.
 */
export const SEQUENCE_STEPS = [
  { template: "new-lead", delayDays: 0 },
  { template: "follow-up", delayDays: 3 },
  { template: "chase", delayDays: 4 },
] as const;

export type LeadForEmail = {
  id: number;
  name: string;
  email: string;
  company: string | null;
  status: string;
};

function renderMail(opts: {
  subject: string;
  body: string;
  template?: string;
  origin: string;
}) {
  return opts.template && BRANDED_TEMPLATE_IDS.has(opts.template)
    ? brandedEmail({
        body: opts.body,
        subject: opts.subject,
        origin: opts.origin,
        senderName: site.senderName,
      })
    : salesEmail({
        body: opts.body,
        origin: opts.origin,
        senderName: site.senderName,
      });
}

export function templateForLead(
  templateId: string,
  lead: { name: string; company: string | null }
) {
  const t = EMAIL_TEMPLATES.find((x) => x.id === templateId);
  if (!t) return null;
  return {
    subject: fillTemplate(t.subject, lead, site.senderName),
    body: fillTemplate(t.body, lead, site.senderName),
  };
}

/** Fictional lead used for previews and test sends. */
const SAMPLE_LEAD = { name: "Jordan Smith", company: "Acme Contracts Ltd" };

/** Render a message with merge tags filled by the sample lead — for preview. */
export function previewEmailHtml(opts: {
  subject: string;
  body: string;
  template?: string;
  origin: string;
}) {
  return renderMail({
    subject: fillTemplate(opts.subject, SAMPLE_LEAD, site.senderName),
    body: fillTemplate(opts.body, SAMPLE_LEAD, site.senderName),
    template: opts.template,
    origin: opts.origin,
  }).html;
}

/**
 * Send a test copy straight to an inbox — no lead, no tracking, no timeline
 * entry. Used by the campaign composer's "send me a test" button.
 */
export async function sendPreviewEmail(opts: {
  to: string;
  subject: string;
  body: string;
  template?: string;
  origin: string;
}): Promise<{ ok?: boolean; error?: string }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { error: "Email sending isn't configured (RESEND_API_KEY)" };
  const mail = renderMail({
    subject: fillTemplate(opts.subject, SAMPLE_LEAD, site.senderName),
    body: fillTemplate(opts.body, SAMPLE_LEAD, site.senderName),
    template: opts.template,
    origin: opts.origin,
  });
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: `${site.senderName} at ${site.name} <${site.email}>`,
        to: opts.to,
        reply_to: site.email,
        subject: fillTemplate(opts.subject, SAMPLE_LEAD, site.senderName),
        html: mail.html,
        text: mail.text,
      }),
    });
    if (!res.ok) {
      console.error("Resend error", res.status, await res.text());
      return { error: "The email provider rejected the message — check Resend." };
    }
    return { ok: true };
  } catch {
    return { error: "Couldn't reach the email provider. Try again." };
  }
}

/**
 * Send one lead email via Resend, then log it: an email_sends row (so the
 * webhook can attribute opens/clicks), a timeline activity, last_contacted_at
 * and the new -> contacted pipeline bump.
 */
export async function deliverLeadEmail(opts: {
  lead: LeadForEmail;
  subject: string;
  body: string;
  template?: string;
  userId: number | null;
  origin: string;
  campaignId?: number;
  sequenceStep?: number;
  activityLabel?: string;
  attachments?: { filename: string; content: string }[];
}): Promise<{ ok?: boolean; error?: string }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { error: "Email sending isn't configured (RESEND_API_KEY)" };
  if (!opts.lead.email) return { error: "No email address" };

  const mail = renderMail({
    subject: opts.subject,
    body: opts.body,
    template: opts.template,
    origin: opts.origin,
  });

  let resendId: string | null = null;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: `${site.senderName} at ${site.name} <${site.email}>`,
        to: opts.lead.email,
        reply_to: site.email,
        subject: opts.subject,
        html: mail.html,
        text: mail.text,
        ...(opts.attachments?.length ? { attachments: opts.attachments } : {}),
      }),
    });
    if (!res.ok) {
      console.error("Resend error", res.status, await res.text());
      return { error: "The email provider rejected the message — check Resend." };
    }
    resendId = ((await res.json()) as { id?: string }).id ?? null;
  } catch {
    return { error: "Couldn't reach the email provider. Try again." };
  }

  const { lead } = opts;
  await sql`INSERT INTO email_sends (resend_id, lead_id, user_id, campaign_id, subject)
    VALUES (${resendId}, ${lead.id}, ${opts.userId}, ${opts.campaignId ?? null}, ${opts.subject})`;

  const prefix = opts.sequenceStep != null
    ? `Sequence step ${opts.sequenceStep + 1} — sent`
    : opts.activityLabel ?? "Sent";
  const logBody = `${prefix}: ${opts.subject}\n\n${mail.text}`;
  await sql`INSERT INTO lead_activities (lead_id, user_id, type, body) VALUES (${lead.id}, ${opts.userId}, 'email', ${logBody})`;
  await sql`UPDATE leads SET last_contacted_at = now(), updated_at = now() WHERE id = ${lead.id}`;
  if (lead.status === "new") {
    await sql`UPDATE leads SET status = 'contacted' WHERE id = ${lead.id}`;
    await sql`UPDATE follow_ups SET done = true, done_at = now() WHERE lead_id = ${lead.id} AND auto = true AND done = false`;
    await sql`INSERT INTO lead_activities (lead_id, user_id, type, body) VALUES (${lead.id}, ${opts.userId}, 'status', 'Status changed to contacted')`;
  }
  return { ok: true };
}
