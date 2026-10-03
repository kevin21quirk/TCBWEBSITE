import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

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

  const subject =
    type === "newsletter"
      ? `Newsletter signup: ${email}`
      : `Website enquiry: ${fields.subject || "General"} — ${fields.firstName} ${fields.lastName}`;

  const text =
    type === "newsletter"
      ? `New newsletter signup\n\nEmail: ${email}`
      : [
          `Name: ${fields.firstName} ${fields.lastName}`,
          `Email: ${email}`,
          `Phone: ${fields.phone || "-"}`,
          `Subject: ${fields.subject || "-"}`,
          "",
          fields.message,
        ].join("\n");

  // Store the enquiry as a CRM lead — never let a DB hiccup lose the enquiry.
  try {
    await sql`
      INSERT INTO leads (name, email, phone, message, source)
      VALUES (
        ${type === "newsletter" ? email : `${fields.firstName} ${fields.lastName}`.trim() || email},
        ${email},
        ${fields.phone || null},
        ${type === "newsletter"
          ? "Newsletter signup"
          : (fields.subject ? `Subject: ${fields.subject}\n\n` : "") + fields.message || null},
        ${type === "newsletter" ? "newsletter" : "contact form"}
      )`;
  } catch (err) {
    console.error("[crm] failed to store lead", err);
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        reply_to: email,
        subject,
        text,
      }),
    });
    if (!res.ok) {
      console.error("Resend error", res.status, await res.text());
      return NextResponse.json(
        { error: "Failed to send message" },
        { status: 502 }
      );
    }
  } else {
    // No email provider configured — log the submission so nothing is lost
    // in local/dev environments.
    console.log(`[contact] ${subject}\n${text}`);
  }

  return NextResponse.json({ ok: true });
}
