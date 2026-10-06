import { NextResponse } from "next/server";
import { site } from "@/lib/content";
import { sql } from "@/lib/db";
import {
  confirmationEmail,
  newsletterNotification,
  notificationEmail,
  type Enquiry,
} from "@/lib/emails";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // Honeypot — bots fill hidden fields, humans don't.
  if (typeof body.company === "string" && body.company.trim() !== "") {
    return NextResponse.json({ ok: true });
  }

  const type = body.type === "newsletter" ? "newsletter" : "contact";
  const email = typeof body.email === "string" ? body.email.trim() : "";

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
  }

  const fields = {
    firstName: String(body.firstName ?? "").trim(),
    lastName: String(body.lastName ?? "").trim(),
    phone: String(body.phone ?? "").trim(),
    subject: String(body.subject ?? "").trim(),
    message: String(body.message ?? "").trim(),
  };

  if (type === "contact" && (!fields.firstName || !fields.message)) {
    return NextResponse.json(
      { error: "Name and message are required" },
      { status: 400 }
    );
  }

  const to = process.env.CONTACT_TO_EMAIL ?? "hello@thecontractorbroker.com";
  const from = process.env.CONTACT_FROM_EMAIL ?? "website@thecontractorbroker.com";
  // Absolute base for logo/links in emails. SITE_URL pins it to the live
  // domain; otherwise use the host that served this request.
  const origin = (
    process.env.SITE_URL ??
    `${request.headers.get("x-forwarded-proto") ?? "https"}://${
      request.headers.get("x-forwarded-host") ??
      request.headers.get("host") ??
      "thecontractorbroker.com"
    }`
  ).replace(/\/$/, "");

  // Store the enquiry as a CRM lead — never let a DB hiccup lose the enquiry.
  let leadSaved = false;
  let leadId: number | null = null;
  try {
    const rows = await sql`
      INSERT INTO leads (name, email, phone, message, source)
      VALUES (
        ${type === "newsletter" ? email : `${fields.firstName} ${fields.lastName}`.trim() || email},
        ${email},
        ${fields.phone || null},
        ${type === "newsletter"
          ? "Newsletter signup"
          : (fields.subject ? `Subject: ${fields.subject}\n\n` : "") + fields.message || null},
        ${type === "newsletter" ? "newsletter" : "contact form"}
      )
      RETURNING id`;
    leadId = rows[0].id as number;
    // Chase the enquiry after 1 week if nobody's responded by then —
    // the follow-up auto-completes once the lead is progressed.
    if (type === "contact") {
      await sql`
        INSERT INTO follow_ups (lead_id, title, due_at, auto)
        VALUES (${rows[0].id}, 'Chase up — no response yet', now() + interval '7 days', true)`;
    }
    leadSaved = true;
  } catch (err) {
    console.error("[crm] failed to store lead", err);
  }

  const enquiry: Enquiry = { ...fields, email };
  const internal =
    type === "newsletter"
      ? newsletterNotification(email, origin)
      : notificationEmail(enquiry, origin, leadId);

  // Emails — a provider failure must not lose the enquiry now that it is
  // stored in the CRM. Only error out if nothing was captured at all.
  const resendKey = process.env.RESEND_API_KEY;
  let emailed = false;
  if (resendKey) {
    const send = async (payload: Record<string, unknown>) => {
      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: from.includes("<") ? from : `${site.name} <${from}>`,
            ...payload,
          }),
        });
        if (!res.ok) console.error("Resend error", res.status, await res.text());
        return res.ok;
      } catch (err) {
        console.error("Resend request failed", err);
        return false;
      }
    };

    const confirmation =
      type === "contact" ? confirmationEmail(enquiry, origin) : null;
    const [internalOk] = await Promise.all([
      send({ to, reply_to: email, ...internal }),
      // Customer replies land in the team inbox, not the no-reply sender.
      confirmation && send({ to: email, reply_to: to, ...confirmation }),
    ]);
    emailed = internalOk;
  } else {
    // No email provider configured — log the submission so nothing is lost
    // in local/dev environments.
    console.log(`[contact] ${internal.subject}\n${internal.text}`);
  }

  if (!emailed && !leadSaved && resendKey) {
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}
