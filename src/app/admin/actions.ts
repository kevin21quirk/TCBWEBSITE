"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  createSession,
  destroySession,
  hashPassword,
  requireSuperAdmin,
  requireUser,
  verifyLogin,
} from "@/lib/auth";
import {
  CONTACT_ACTIVITY_TYPES,
  LEAD_STATUSES,
  LOGGABLE_ACTIVITIES,
  type LeadStatus,
} from "@/lib/crm";
import { sql } from "@/lib/db";
import { salesEmail } from "@/lib/emails";

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const opt = (fd: FormData, k: string) => str(fd, k) || null;

function revalidateLead(leadId: number) {
  revalidatePath(`/admin/leads/${leadId}`);
  revalidatePath("/admin/leads");
  revalidatePath("/admin/pipeline");
  revalidatePath("/admin/prospecting");
  revalidatePath("/admin");
}

async function siteOrigin() {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, "");
  const h = await headers();
  return `${h.get("x-forwarded-proto") ?? "https"}://${h.get("x-forwarded-host") ?? h.get("host")}`;
}

function normaliseLinkedin(url: string | null) {
  if (!url) return null;
  const u = url.startsWith("http") ? url : `https://${url}`;
  return /linkedin\.com\//i.test(u) ? u.split("?")[0] : null;
}

/* ---------- auth ---------- */

export async function loginAction(
  _prev: { error?: string } | undefined,
  formData: FormData
) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Email and password are required" };

  const userId = await verifyLogin(email, password).catch(() => null);
  if (!userId) return { error: "Invalid email or password" };

  await createSession(userId);
  redirect("/admin");
}

export async function logoutAction() {
  await destroySession();
  redirect("/admin/login");
}

/* ---------- leads ---------- */

function validStatus(s: string): s is LeadStatus {
  return (LEAD_STATUSES as readonly string[]).includes(s);
}

export async function updateLeadStatus(leadId: number, status: string) {
  const user = await requireUser();
  if (!validStatus(status)) return;
  await sql`UPDATE leads SET status = ${status}, updated_at = now() WHERE id = ${leadId}`;
  // Progressing a lead means we've made contact — the automatic
  // "no response" chase is no longer needed.
  if (status !== "new") {
    await sql`UPDATE follow_ups SET done = true, done_at = now()
      WHERE lead_id = ${leadId} AND auto = true AND done = false`;
  }
  await sql`INSERT INTO lead_activities (lead_id, user_id, type, body) VALUES (${leadId}, ${user.id}, 'status', ${`Status changed to ${status}`})`;
  revalidateLead(leadId);
  revalidatePath("/admin/calendar");
}

export async function assignLead(leadId: number, userId: number | null) {
  const user = await requireUser();
  await sql`UPDATE leads SET assigned_to = ${userId}, updated_at = now() WHERE id = ${leadId}`;
  await sql`UPDATE follow_ups SET assigned_to = ${userId}
    WHERE lead_id = ${leadId} AND done = false`;
  const assignee = userId
    ? ((await sql`SELECT name FROM users WHERE id = ${userId}`)[0]?.name ?? "a team member")
    : "Unassigned";
  await sql`INSERT INTO lead_activities (lead_id, user_id, type, body) VALUES (${leadId}, ${user.id}, 'assign', ${`Assigned to ${assignee}`})`;
  revalidateLead(leadId);
}

/** Log a note, call, email, meeting or LinkedIn touchpoint. */
export async function logActivity(leadId: number, formData: FormData) {
  const user = await requireUser();
  const body = str(formData, "note");
  const requested = str(formData, "type");
  const type = LOGGABLE_ACTIVITIES.some((a) => a.type === requested)
    ? requested
    : "note";
  if (!body) return;
  await sql`INSERT INTO lead_activities (lead_id, user_id, type, body) VALUES (${leadId}, ${user.id}, ${type}, ${body})`;
  if (CONTACT_ACTIVITY_TYPES.includes(type)) {
    await sql`UPDATE leads SET updated_at = now(), last_contacted_at = now() WHERE id = ${leadId}`;
  } else {
    await sql`UPDATE leads SET updated_at = now() WHERE id = ${leadId}`;
  }
  revalidateLead(leadId);
}

export async function updateLeadDetails(leadId: number, formData: FormData) {
  const user = await requireUser();
  const name = str(formData, "name");
  if (!name) return;
  const raw = str(formData, "deal_value").replace(/[£,\s]/g, "");
  const value = raw && !Number.isNaN(Number(raw)) ? Number(raw) : null;
  const tags = str(formData, "tags")
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 12);
  await sql`
    UPDATE leads SET
      name = ${name},
      email = ${opt(formData, "email")},
      phone = ${opt(formData, "phone")},
      company = ${opt(formData, "company")},
      job_title = ${opt(formData, "job_title")},
      linkedin_url = ${normaliseLinkedin(opt(formData, "linkedin_url"))},
      deal_value = ${value},
      tags = ${tags},
      source = ${str(formData, "source") || "manual"},
      updated_at = now()
    WHERE id = ${leadId}`;
  await sql`INSERT INTO lead_activities (lead_id, user_id, type, body) VALUES (${leadId}, ${user.id}, 'update', 'Lead details updated')`;
  revalidateLead(leadId);
}

/** Quick-save from LinkedIn research (lead page or prospecting queue). */
export async function saveLinkedinProfile(leadId: number, formData: FormData) {
  const user = await requireUser();
  const url = normaliseLinkedin(opt(formData, "linkedin_url"));
  if (!url) return;
  const title = opt(formData, "job_title");
  const company = opt(formData, "company");
  await sql`
    UPDATE leads SET linkedin_url = ${url},
      job_title = COALESCE(${title}, job_title),
      company = COALESCE(${company}, company),
      updated_at = now()
    WHERE id = ${leadId}`;
  await sql`INSERT INTO lead_activities (lead_id, user_id, type, body) VALUES (${leadId}, ${user.id}, 'linkedin', ${`LinkedIn profile saved: ${url}`})`;
  revalidateLead(leadId);
}

/** Send a one-to-one email from the CRM via Resend and log it. */
export async function sendLeadEmail(
  leadId: number,
  _prev: { ok?: boolean; error?: string } | undefined,
  formData: FormData
) {
  const user = await requireUser();
  const subject = str(formData, "subject");
  const body = str(formData, "body");
  if (!subject || !body) return { error: "Subject and message are required" };

  const lead = (await sql`SELECT email, status FROM leads WHERE id = ${leadId}`)[0] as
    | { email: string | null; status: LeadStatus }
    | undefined;
  if (!lead?.email) return { error: "This lead has no email address" };

  const key = process.env.RESEND_API_KEY;
  if (!key) return { error: "Email sending isn't configured (RESEND_API_KEY)" };
  const from = process.env.CONTACT_FROM_EMAIL ?? "website@thecontractorbroker.com";
  const mail = salesEmail({
    body,
    origin: await siteOrigin(),
    senderName: user.name,
    senderEmail: user.email,
  });

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: from.includes("<") ? from : `${user.name} at The Contractor Broker <${from}>`,
        to: lead.email,
        reply_to: user.email,
        subject,
        html: mail.html,
        text: mail.text,
      }),
    });
    if (!res.ok) {
      console.error("Resend error", res.status, await res.text());
      return { error: "The email provider rejected the message — check Resend." };
    }
  } catch {
    return { error: "Couldn't reach the email provider. Try again." };
  }

  await sql`INSERT INTO lead_activities (lead_id, user_id, type, body) VALUES (${leadId}, ${user.id}, 'email', ${`Sent: ${subject}\n\n${body}`})`;
  await sql`UPDATE leads SET last_contacted_at = now(), updated_at = now() WHERE id = ${leadId}`;
  // First outbound email moves a new lead into the pipeline.
  if (lead.status === "new") {
    await sql`UPDATE leads SET status = 'contacted' WHERE id = ${leadId}`;
    await sql`UPDATE follow_ups SET done = true, done_at = now() WHERE lead_id = ${leadId} AND auto = true AND done = false`;
    await sql`INSERT INTO lead_activities (lead_id, user_id, type, body) VALUES (${leadId}, ${user.id}, 'status', 'Status changed to contacted')`;
  }
  revalidateLead(leadId);
  revalidatePath("/admin/calendar");
  return { ok: true };
}

/** Bulk import (e.g. a Sales Navigator / LinkedIn export). */
export async function importLeads(
  rows: {
    name: string;
    email: string;
    phone: string;
    company: string;
    job_title: string;
    linkedin_url: string;
  }[],
  tag: string
) {
  const user = await requireUser();
  const clean = rows
    .slice(0, 2000)
    .map((r) => ({
      name: r.name.trim().slice(0, 200),
      email: r.email.trim().toLowerCase() || null,
      phone: r.phone.trim() || null,
      company: r.company.trim() || null,
      job_title: r.job_title.trim() || null,
      linkedin_url: normaliseLinkedin(r.linkedin_url.trim() || null),
    }))
    .filter((r) => r.name);

  const emails = clean.map((r) => r.email).filter(Boolean) as string[];
  const urls = clean.map((r) => r.linkedin_url).filter(Boolean) as string[];
  const existing = await sql`
    SELECT lower(email) AS email, linkedin_url FROM leads
    WHERE lower(email) = ANY(${emails}) OR linkedin_url = ANY(${urls})`;
  const seen = new Set<string>();
  for (const e of existing) {
    if (e.email) seen.add(`e:${e.email}`);
    if (e.linkedin_url) seen.add(`l:${e.linkedin_url}`);
  }
  const fresh = clean.filter((r) => {
    const keys = [r.email && `e:${r.email}`, r.linkedin_url && `l:${r.linkedin_url}`].filter(
      Boolean
    ) as string[];
    if (keys.some((k) => seen.has(k))) return false;
    keys.forEach((k) => seen.add(k));
    return true;
  });

  if (fresh.length) {
    const tags = tag.trim() ? [tag.trim().toLowerCase()] : [];
    await sql`
      WITH ins AS (
        INSERT INTO leads (name, email, phone, company, job_title, linkedin_url, source, assigned_to, tags)
        SELECT n, e, p, c, j, li, 'linkedin import', ${user.id}::int, ${tags}::text[]
        FROM unnest(
          ${fresh.map((r) => r.name)}::text[],
          ${fresh.map((r) => r.email)}::text[],
          ${fresh.map((r) => r.phone)}::text[],
          ${fresh.map((r) => r.company)}::text[],
          ${fresh.map((r) => r.job_title)}::text[],
          ${fresh.map((r) => r.linkedin_url)}::text[]
        ) AS t(n, e, p, c, j, li)
        RETURNING id
      )
      INSERT INTO follow_ups (lead_id, assigned_to, title, due_at, auto)
      SELECT id, ${user.id}::int, 'First outreach', now() + interval '1 day', true FROM ins`;
  }
  revalidatePath("/admin/leads");
  revalidatePath("/admin/prospecting");
  revalidatePath("/admin/calendar");
  return { imported: fresh.length, skipped: clean.length - fresh.length };
}

export async function createLead(
  _prev: { error?: string } | undefined,
  formData: FormData
) {
  await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Name is required" };
  const email = String(formData.get("email") ?? "").trim() || null;
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const company = String(formData.get("company") ?? "").trim() || null;
  const linkedinUrl = normaliseLinkedin(opt(formData, "linkedin_url"));
  const jobTitle = opt(formData, "job_title");
  const rawValue = str(formData, "deal_value").replace(/[£,\s]/g, "");
  const dealValue = rawValue && !Number.isNaN(Number(rawValue)) ? Number(rawValue) : null;
  const message = String(formData.get("message") ?? "").trim() || null;
  const source = String(formData.get("source") ?? "manual").trim() || "manual";

  const rows = await sql`
    INSERT INTO leads (name, email, phone, company, job_title, linkedin_url, deal_value, message, source)
    VALUES (${name}, ${email}, ${phone}, ${company}, ${jobTitle}, ${linkedinUrl}, ${dealValue}, ${message}, ${source})
    RETURNING id`;
  await sql`
    INSERT INTO follow_ups (lead_id, title, due_at, auto)
    VALUES (${rows[0].id}, 'Chase up — no response yet', now() + interval '7 days', true)`;
  revalidatePath("/admin/leads");
  redirect(`/admin/leads/${rows[0].id}`);
}

export async function deleteLead(leadId: number) {
  await requireSuperAdmin();
  await sql`DELETE FROM leads WHERE id = ${leadId}`;
  revalidatePath("/admin/leads");
  revalidatePath("/admin");
  revalidatePath("/admin/calendar");
  redirect("/admin/leads");
}

/* ---------- follow-ups ---------- */

export async function addFollowUp(leadId: number, formData: FormData) {
  const user = await requireUser();
  const title = String(formData.get("title") ?? "").trim();
  const due = String(formData.get("due_at") ?? "").trim();
  const date = new Date(due);
  if (!title || Number.isNaN(date.getTime())) return;
  await sql`
    INSERT INTO follow_ups (lead_id, assigned_to, title, due_at)
    VALUES (${leadId}, ${user.id}, ${title}, ${date.toISOString()})`;
  await sql`INSERT INTO lead_activities (lead_id, user_id, type, body) VALUES (${leadId}, ${user.id}, 'follow_up', ${`Follow-up scheduled: ${title}`})`;
  revalidatePath(`/admin/leads/${leadId}`);
  revalidatePath("/admin/calendar");
  revalidatePath("/admin");
}

export async function completeFollowUp(id: number, leadId: number | null) {
  await requireUser();
  await sql`UPDATE follow_ups SET done = true, done_at = now() WHERE id = ${id}`;
  if (leadId) revalidatePath(`/admin/leads/${leadId}`);
  revalidatePath("/admin/calendar");
  revalidatePath("/admin");
}

/* ---------- users (super admin) ---------- */

export async function createUser(
  _prev: { error?: string } | undefined,
  formData: FormData
) {
  await requireSuperAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const role = formData.get("role") === "super_admin" ? "super_admin" : "staff";

  if (!name || !email || !password)
    return { error: "Name, email and password are required" };
  if (password.length < 8)
    return { error: "Password must be at least 8 characters" };

  try {
    await sql`INSERT INTO users (name, email, password_hash, role) VALUES (${name}, ${email}, ${hashPassword(password)}, ${role})`;
  } catch {
    return { error: "A user with that email already exists" };
  }
  revalidatePath("/admin/users");
  return { error: undefined };
}

export async function toggleUserActive(userId: number) {
  const admin = await requireSuperAdmin();
  if (userId === admin.id) return; // can't deactivate yourself
  await sql`UPDATE users SET active = NOT active WHERE id = ${userId}`;
  await sql`DELETE FROM sessions WHERE user_id = ${userId} AND (SELECT active FROM users WHERE id = ${userId}) = false`;
  revalidatePath("/admin/users");
}
