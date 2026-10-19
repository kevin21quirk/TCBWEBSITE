"use server";

import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { audit } from "@/lib/audit";
import {
  createSession,
  currentUser,
  destroySession,
  hashPassword,
  requireSuperAdmin,
  requireUser,
  verifyLogin,
} from "@/lib/auth";
import {
  CONTACT_ACTIVITY_TYPES,
  LEAD_STATUSES,
  LINKEDIN_SCRIPTS,
  LOGGABLE_ACTIVITIES,
  fillTemplate,
  type LeadStatus,
} from "@/lib/crm";
import { site } from "@/lib/content";
import { sql } from "@/lib/db";
import {
  SEQUENCE_STEPS,
  deliverLeadEmail,
  sendPreviewEmail,
  templateForLead,
} from "@/lib/outreach";

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
  if (!userId) {
    await audit({
      user: null,
      name: email.trim().toLowerCase(),
      action: "auth.login_failed",
      detail: "Failed login attempt",
    });
    return { error: "Invalid email or password" };
  }

  await createSession(userId);
  const name =
    (await sql`SELECT name FROM users WHERE id = ${userId}`)[0]?.name ??
    email;
  await audit({
    user: { id: userId, name },
    action: "auth.login",
    detail: "Signed in",
  });
  redirect("/admin?welcome=1");
}

export async function logoutAction() {
  const user = await currentUser();
  if (user) {
    await audit({
      user,
      action: "auth.logout",
      detail: "Signed out",
    });
  }
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
  await audit({
    user,
    action: "lead.status",
    entity: "lead",
    entityId: leadId,
    detail: `Status → ${status}`,
  });
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
  await audit({
    user,
    action: "lead.assign",
    entity: "lead",
    entityId: leadId,
    detail: `Assigned to ${assignee}`,
  });
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
  await audit({
    user,
    action: "lead.activity",
    entity: "lead",
    entityId: leadId,
    detail: `Logged ${type}: ${body.slice(0, 120)}`,
  });
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
  await audit({
    user,
    action: "lead.update",
    entity: "lead",
    entityId: leadId,
    detail: `Edited details of "${name}"`,
  });
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
  await audit({
    user,
    action: "lead.linkedin_save",
    entity: "lead",
    entityId: leadId,
    detail: `Saved LinkedIn profile ${url}`,
  });
  revalidateLead(leadId);
}

const MAX_ATTACHMENTS = 5;
const MAX_ATTACHMENT_BYTES = 20 * 1024 * 1024;
const MAX_ATTACHMENTS_TOTAL = 25 * 1024 * 1024;

// Files upload in chunks to /api/attachments ahead of submit — the form
// only carries their upload ids, which stay well under the platform's
// request-size cap no matter how large the files are.
async function collectAttachments(
  formData: FormData,
  userId: number
): Promise<{
  attachments: { filename: string; content: string }[];
  uploadIds: string[];
  error?: string;
}> {
  const uploadIds = formData.getAll("attachment_id").map(String).filter(Boolean);
  const uploadNames = formData.getAll("attachment_name").map(String);
  const attachments: { filename: string; content: string }[] = [];
  let totalBytes = 0;
  const fail = (error: string) => ({ attachments, uploadIds, error });
  for (const [i, uploadId] of uploadIds.entries()) {
    if (attachments.length >= MAX_ATTACHMENTS)
      return fail(`Up to ${MAX_ATTACHMENTS} attachments per email`);
    const name = uploadNames[i] || "attachment";
    const rows = await sql`
      SELECT data_hex FROM attachment_uploads
      WHERE upload_id = ${uploadId} AND user_id = ${userId}
      ORDER BY chunk_index`;
    const hex = rows.map((r) => r.data_hex as string).join("");
    if (!hex) return fail(`"${name}" hasn't finished uploading — remove it and try again`);
    const size = hex.length / 2;
    if (size > MAX_ATTACHMENT_BYTES)
      return fail(`"${name}" is over the 20 MB per-file limit`);
    totalBytes += size;
    if (totalBytes > MAX_ATTACHMENTS_TOTAL)
      return fail("Attachments are over the 25 MB total limit");
    attachments.push({ filename: name, content: Buffer.from(hex, "hex").toString("base64") });
  }
  return { attachments, uploadIds };
}

/** Send a one-to-one email from the CRM via Resend and log it. */
export async function sendLeadEmail(
  leadId: number,
  _prev: { ok?: boolean; error?: string } | undefined,
  formData: FormData
): Promise<{ ok?: boolean; error?: string }> {
  const user = await requireUser();
  const subject = str(formData, "subject");
  const body = str(formData, "body");
  if (!subject || !body) return { error: "Subject and message are required" };

  const lead = (await sql`SELECT id, email, name, company, status FROM leads WHERE id = ${leadId}`)[0] as
    | { id: number; email: string | null; name: string; company: string | null; status: LeadStatus }
    | undefined;
  if (!lead?.email) return { error: "This lead has no email address" };

  const { attachments, uploadIds, error } = await collectAttachments(formData, user.id);
  if (error) return { error };

  const result = await deliverLeadEmail({
    lead: { ...lead, email: lead.email },
    subject,
    body,
    template: str(formData, "template") || undefined,
    userId: user.id,
    origin: await siteOrigin(),
    attachments,
    activityLabel: `Sent${
      attachments.length
        ? ` (attachments: ${attachments.map((a) => a.filename).join(", ")})`
        : ""
    }`,
  });
  if (result.error) return result;
  if (uploadIds.length) {
    await sql`DELETE FROM attachment_uploads WHERE upload_id = ANY(${uploadIds})`;
  }
  await audit({
    user,
    action: "email.send",
    entity: "lead",
    entityId: leadId,
    detail: `Sent "${subject}" to ${lead.name} <${lead.email}>`,
  });
  revalidateLead(leadId);
  revalidatePath("/admin/calendar");
  return { ok: true };
}

/** Bulk send: one campaign row + a personalised email per selected lead. */
export async function sendCampaign(
  _prev: { ok?: boolean; sent?: number; failed?: number; skipped?: number; error?: string } | undefined,
  formData: FormData
): Promise<{ ok?: boolean; sent?: number; failed?: number; skipped?: number; error?: string }> {
  const user = await requireUser();
  const name =
    str(formData, "name") ||
    `Outreach ${new Date().toLocaleDateString("en-GB")}`;
  const template = str(formData, "template") || undefined;
  const subject = str(formData, "subject");
  const body = str(formData, "body");
  if (!subject || !body) return { error: "Subject and message are required" };
  const ids = formData
    .getAll("lead_ids")
    .map(Number)
    .filter((n) => Number.isInteger(n) && n > 0)
    .slice(0, 200);
  if (!ids.length) return { error: "Select at least one lead" };

  const { attachments, uploadIds, error } = await collectAttachments(formData, user.id);
  if (error) return { error };

  const leads = (await sql`
    SELECT id, name, email, company, status FROM leads WHERE id = ANY(${ids}::int[])`) as {
    id: number; name: string; email: string | null; company: string | null; status: LeadStatus;
  }[];
  const mailable = leads.filter(
    (l): l is typeof l & { email: string } => Boolean(l.email)
  );
  const skipped = leads.length - mailable.length;

  const campaign = (
    await sql`
      INSERT INTO campaigns (name, template, subject, body, created_by, total)
      VALUES (${name}, ${template ?? "custom"}, ${subject}, ${body}, ${user.id}, ${mailable.length})
      RETURNING id`
  )[0] as { id: number };

  const origin = await siteOrigin();
  let sent = 0;
  let failed = 0;
  for (let i = 0; i < mailable.length; i += 5) {
    const results = await Promise.all(
      mailable.slice(i, i + 5).map((lead) =>
        deliverLeadEmail({
          lead,
          subject: fillTemplate(subject, lead, site.senderName),
          body: fillTemplate(body, lead, site.senderName),
          template,
          userId: user.id,
          origin,
          campaignId: campaign.id,
          attachments,
          activityLabel: `Campaign "${name}" — sent${
            attachments.length
              ? ` (attachments: ${attachments.map((a) => a.filename).join(", ")})`
              : ""
          }`,
        }).then(
          (r) => !r.error,
          () => false
        )
      )
    );
    sent += results.filter(Boolean).length;
    failed += results.filter((r) => !r).length;
  }
  await sql`UPDATE campaigns SET sent = ${sent}, failed = ${failed}, skipped = ${skipped} WHERE id = ${campaign.id}`;
  if (uploadIds.length) {
    await sql`DELETE FROM attachment_uploads WHERE upload_id = ANY(${uploadIds})`;
  }
  await audit({
    user,
    action: "email.campaign",
    entity: "campaign",
    entityId: campaign.id,
    detail: `Campaign "${name}" — ${sent} sent, ${failed} failed, ${skipped} skipped`,
  });
  revalidatePath("/admin/outreach");
  revalidatePath("/admin/leads");
  revalidatePath("/admin");
  return { ok: true, sent, failed, skipped };
}

/** Enrol a lead in the intro sequence — step 1 sends now, the cron chases. */
export async function enrollSequence(
  leadId: number,
  _prev: { ok?: boolean; error?: string } | undefined,
  _formData: FormData
): Promise<{ ok?: boolean; error?: string }> {
  const user = await requireUser();
  const lead = (await sql`
    SELECT id, name, email, company, status FROM leads WHERE id = ${leadId}`)[0] as
    | { id: number; name: string; email: string | null; company: string | null; status: LeadStatus }
    | undefined;
  if (!lead?.email) return { error: "This lead has no email address" };

  const running = await sql`
    SELECT id FROM sequence_enrolments WHERE lead_id = ${leadId} AND active = true`;
  if (running.length) return { error: "A sequence is already running" };

  const first = SEQUENCE_STEPS[0];
  const t = templateForLead(first.template, lead);
  if (!t) return { error: "Sequence template missing" };
  const result = await deliverLeadEmail({
    lead: { ...lead, email: lead.email },
    subject: t.subject,
    body: t.body,
    template: first.template,
    userId: user.id,
    origin: await siteOrigin(),
    sequenceStep: 0,
  });
  if (result.error) return result;

  const next = SEQUENCE_STEPS[1];
  const nextAt = new Date(
    Date.now() + (next?.delayDays ?? 3) * 864e5
  ).toISOString();
  await sql`
    INSERT INTO sequence_enrolments (lead_id, step, next_send_at, created_by)
    VALUES (${leadId}, 1, ${nextAt}, ${user.id})
    ON CONFLICT (lead_id) DO UPDATE SET
      step = 1, next_send_at = ${nextAt}, active = true, created_by = ${user.id}`;
  await sql`
    INSERT INTO lead_activities (lead_id, user_id, type, body)
    VALUES (${leadId}, ${user.id}, 'note', 'Enrolled in email sequence (intro + 2 chases)')`;
  await audit({
    user,
    action: "sequence.start",
    entity: "lead",
    entityId: leadId,
    detail: `Started email sequence for ${lead.name}`,
  });
  revalidateLead(leadId);
  revalidatePath("/admin/outreach");
  return { ok: true };
}

export async function stopSequence(
  leadId: number,
  _prev: { ok?: boolean; error?: string } | undefined,
  _formData: FormData
): Promise<{ ok?: boolean; error?: string }> {
  const user = await requireUser();
  await sql`UPDATE sequence_enrolments SET active = false WHERE lead_id = ${leadId} AND active = true`;
  await sql`
    INSERT INTO lead_activities (lead_id, user_id, type, body)
    VALUES (${leadId}, ${user.id}, 'note', 'Email sequence stopped')`;
  await audit({
    user,
    action: "sequence.stop",
    entity: "lead",
    entityId: leadId,
    detail: "Stopped email sequence",
  });
  revalidateLead(leadId);
  revalidatePath("/admin/outreach");
  return { ok: true };
}

/** Mark a LinkedIn playbook step done — step 0 resets the playbook. */
export async function markLinkedinStep(
  leadId: number,
  _prev: { ok?: boolean; error?: string } | undefined,
  formData: FormData
): Promise<{ ok?: boolean; error?: string }> {
  const user = await requireUser();
  const step = Number(str(formData, "step"));
  if (!Number.isInteger(step) || step < 0 || step > LINKEDIN_SCRIPTS.length) {
    return { error: "Invalid step" };
  }
  if (step === 0) {
    await sql`UPDATE leads SET linkedin_step = 0, updated_at = now() WHERE id = ${leadId}`;
    await sql`
      INSERT INTO lead_activities (lead_id, user_id, type, body)
      VALUES (${leadId}, ${user.id}, 'note', 'LinkedIn playbook reset')`;
  } else {
    const script = LINKEDIN_SCRIPTS[step - 1];
    await sql`
      UPDATE leads SET linkedin_step = GREATEST(linkedin_step, ${step}), updated_at = now()
      WHERE id = ${leadId}`;
    await sql`
      INSERT INTO lead_activities (lead_id, user_id, type, body)
      VALUES (${leadId}, ${user.id}, 'linkedin',
              ${`Sent the ${script.label.toLowerCase()} on LinkedIn`})`;
  }
  await audit({
    user,
    action: "lead.linkedin_step",
    entity: "lead",
    entityId: leadId,
    detail:
      step === 0
        ? "Reset LinkedIn playbook"
        : `Marked LinkedIn step ${step} done`,
  });
  revalidateLead(leadId);
  revalidatePath("/admin/outreach");
  return { ok: true };
}

/** Send a filled-in preview of a campaign message to your own inbox. */
export async function sendTestEmail(
  subject: string,
  body: string,
  template?: string
): Promise<{ ok?: boolean; error?: string }> {
  const user = await requireUser();
  if (!subject.trim() || !body.trim()) {
    return { error: "Subject and message are required" };
  }
  const result = await sendPreviewEmail({
    to: user.email,
    subject: subject.trim(),
    body: body.trim(),
    template,
    origin: await siteOrigin(),
  });
  if (!result.error) {
    await audit({
      user,
      action: "email.test",
      detail: `Sent test email "${subject.slice(0, 80)}" to self`,
    });
  }
  return result;
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
  await audit({
    user,
    action: "leads.import",
    detail: `Imported ${fresh.length} leads, skipped ${clean.length - fresh.length} duplicates${tag.trim() ? ` (tag: ${tag.trim()})` : ""}`,
  });
  revalidatePath("/admin/leads");
  revalidatePath("/admin/prospecting");
  revalidatePath("/admin/calendar");
  return { imported: fresh.length, skipped: clean.length - fresh.length };
}

export async function createLead(
  _prev: { error?: string } | undefined,
  formData: FormData
) {
  const user = await requireUser();
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
  await audit({
    user,
    action: "lead.create",
    entity: "lead",
    entityId: rows[0].id,
    detail: `Created lead "${name}"`,
  });
  revalidatePath("/admin/leads");
  redirect(`/admin/leads/${rows[0].id}`);
}

/** Import a Companies House prospect from the Lead Radar as a CRM lead. */
export async function addProspect(formData: FormData) {
  const user = await requireUser();
  const company = str(formData, "company").slice(0, 200);
  const number = str(formData, "company_number").slice(0, 20);
  const detail = str(formData, "detail").slice(0, 2000);
  const returnTo = str(formData, "return") || "/admin/radar";
  if (!company) redirect(returnTo);

  const dup = await sql`
    SELECT id FROM leads WHERE lower(company) = lower(${company}) LIMIT 1`;
  if (dup.length === 0) {
    const rows = await sql`
      INSERT INTO leads (name, company, message, source, assigned_to, tags)
      VALUES (${company}, ${company}, ${`Lead Radar prospect — Companies House ${number}. ${detail}`},
              'lead radar', ${user.id}, ${["agency", "lead-radar"]}::text[])
      RETURNING id`;
    await sql`
      INSERT INTO follow_ups (lead_id, assigned_to, title, due_at, auto)
      VALUES (${rows[0].id}, ${user.id}, ${`First outreach to ${company.slice(0, 100)}`}, now() + interval '1 day', true)`;
    await sql`
      INSERT INTO lead_activities (lead_id, user_id, type, body)
      VALUES (${rows[0].id}, ${user.id}, 'update', ${`Imported from Lead Radar (Companies House ${number})`})`;
    await audit({
      user,
      action: "lead.create",
      entity: "lead",
      entityId: rows[0].id,
      detail: `Added Radar prospect "${company}"`,
    });
    revalidatePath("/admin/leads");
    revalidatePath("/admin/prospecting");
    revalidatePath("/admin/calendar");
  }
  redirect(returnTo);
}

/** Add a named person (a Companies House officer) as a lead. */
export async function addProspectPerson(formData: FormData) {
  const user = await requireUser();
  const name = str(formData, "name").slice(0, 200);
  const company = str(formData, "company").slice(0, 200);
  const jobTitle = str(formData, "job_title").slice(0, 120);
  const returnTo = str(formData, "return") || "/admin/radar";
  if (!name) redirect(returnTo);

  const dup = await sql`
    SELECT id FROM leads
    WHERE lower(name) = lower(${name})
      AND lower(company) = lower(${company})
    LIMIT 1`;
  if (dup.length === 0) {
    const rows = await sql`
      INSERT INTO leads (name, company, job_title, message, source, assigned_to, tags)
      VALUES (${name}, ${company || null}, ${jobTitle || null},
              ${`Officer at ${company || "unknown company"} — found via Lead Radar.`},
              'lead radar', ${user.id}, ${["lead-radar"]}::text[])
      RETURNING id`;
    await sql`
      INSERT INTO follow_ups (lead_id, assigned_to, title, due_at, auto)
      VALUES (${rows[0].id}, ${user.id}, ${`First outreach to ${name.slice(0, 80)}`}, now() + interval '1 day', true)`;
    await sql`
      INSERT INTO lead_activities (lead_id, user_id, type, body)
      VALUES (${rows[0].id}, ${user.id}, 'update',
              ${`Imported from Lead Radar — ${jobTitle || "officer"} at ${company}`})`;
    await audit({
      user,
      action: "lead.create",
      entity: "lead",
      entityId: rows[0].id,
      detail: `Added officer "${name}"${company ? ` (${company})` : ""} from Radar`,
    });
    revalidatePath("/admin/leads");
    revalidatePath("/admin/prospecting");
    revalidatePath("/admin/calendar");
  }
  redirect(returnTo);
}

export async function deleteLead(leadId: number) {
  const user = await requireSuperAdmin();
  const name =
    (await sql`SELECT name FROM leads WHERE id = ${leadId}`)[0]?.name ??
    `#${leadId}`;
  await sql`DELETE FROM leads WHERE id = ${leadId}`;
  await audit({
    user,
    action: "lead.delete",
    entity: "lead",
    entityId: leadId,
    detail: `Deleted lead "${name}"`,
  });
  revalidatePath("/admin/leads");
  revalidatePath("/admin");
  revalidatePath("/admin/calendar");
  redirect("/admin/leads");
}

/** Bulk delete (spam clean-up) — stays on the current page. */
export async function deleteLeads(ids: number[]) {
  const user = await requireSuperAdmin();
  const clean = [...new Set(ids.map(Number).filter((n) => Number.isInteger(n) && n > 0))];
  if (!clean.length) return { deleted: 0 };
  const rows = await sql`DELETE FROM leads WHERE id = ANY(${clean}::int[]) RETURNING name`;
  await audit({
    user,
    action: "leads.delete",
    detail: `Deleted ${rows.length} lead${rows.length === 1 ? "" : "s"}${rows.length <= 4 ? `: ${rows.map((r) => r.name).join(", ")}` : ""}`,
  });
  revalidatePath("/admin/leads");
  revalidatePath("/admin");
  revalidatePath("/admin/pipeline");
  revalidatePath("/admin/calendar");
  return { deleted: rows.length };
}

export async function deleteSelectedLeads(formData: FormData) {
  await deleteLeads(formData.getAll("ids").map(Number));
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
  await audit({
    user,
    action: "followup.create",
    entity: "lead",
    entityId: leadId,
    detail: `Scheduled follow-up "${title}" for ${due}`,
  });
  revalidatePath(`/admin/leads/${leadId}`);
  revalidatePath("/admin/calendar");
  revalidatePath("/admin");
}

export async function completeFollowUp(id: number, leadId: number | null) {
  const user = await requireUser();
  await sql`UPDATE follow_ups SET done = true, done_at = now() WHERE id = ${id}`;
  await audit({
    user,
    action: "followup.complete",
    entity: leadId ? "lead" : null,
    entityId: leadId,
    detail: `Completed follow-up #${id}`,
  });
  if (leadId) revalidatePath(`/admin/leads/${leadId}`);
  revalidatePath("/admin/calendar");
  revalidatePath("/admin");
}

/* ---------- users (super admin) ---------- */

export async function createUser(
  _prev: { error?: string } | undefined,
  formData: FormData
) {
  const admin = await requireSuperAdmin();
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
  await audit({
    user: admin,
    action: "user.create",
    entity: "user",
    detail: `Created ${role === "super_admin" ? "super admin" : "staff"} account "${name}" <${email}>`,
  });
  revalidatePath("/admin/users");
  return { error: undefined };
}

export async function toggleUserActive(userId: number) {
  const admin = await requireSuperAdmin();
  if (userId === admin.id) return; // can't deactivate yourself
  await sql`UPDATE users SET active = NOT active WHERE id = ${userId}`;
  await sql`DELETE FROM sessions WHERE user_id = ${userId} AND (SELECT active FROM users WHERE id = ${userId}) = false`;
  const target = (
    await sql`SELECT name, active FROM users WHERE id = ${userId}`
  )[0];
  await audit({
    user: admin,
    action: target?.active ? "user.enable" : "user.disable",
    entity: "user",
    entityId: userId,
    detail: `${target?.active ? "Enabled" : "Disabled"} account "${target?.name ?? `#${userId}`}"`,
  });
  revalidatePath("/admin/users");
}

/** Force-sign-out a user's sessions (super admin, from the audit page).
 *  The admin's own current session is always spared. */
export async function revokeUserSessions(userId: number) {
  const admin = await requireSuperAdmin();
  const jar = await cookies();
  const myToken = jar.get("tcb_session")?.value ?? "";
  const rows = await sql`
    DELETE FROM sessions WHERE user_id = ${userId} AND token <> ${myToken}
    RETURNING token`;
  if (rows.length) {
    const name =
      (await sql`SELECT name FROM users WHERE id = ${userId}`)[0]?.name ??
      `#${userId}`;
    await audit({
      user: admin,
      action: "session.revoke",
      entity: "user",
      entityId: userId,
      detail: `Signed out "${name}" — ${rows.length} session${rows.length === 1 ? "" : "s"}`,
    });
  }
  revalidatePath("/admin/audit");
}
