"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createSession,
  destroySession,
  hashPassword,
  requireSuperAdmin,
  requireUser,
  verifyLogin,
} from "@/lib/auth";
import { LEAD_STATUSES, type LeadStatus } from "@/lib/crm";
import { sql } from "@/lib/db";

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
  await sql`INSERT INTO lead_activities (lead_id, user_id, type, body) VALUES (${leadId}, ${user.id}, 'status', ${`Status changed to ${status}`})`;
  revalidatePath(`/admin/leads/${leadId}`);
  revalidatePath("/admin/leads");
  revalidatePath("/admin");
}

export async function assignLead(leadId: number, userId: number | null) {
  const user = await requireUser();
  await sql`UPDATE leads SET assigned_to = ${userId}, updated_at = now() WHERE id = ${leadId}`;
  const assignee = userId
    ? ((await sql`SELECT name FROM users WHERE id = ${userId}`)[0]?.name ?? "a team member")
    : "Unassigned";
  await sql`INSERT INTO lead_activities (lead_id, user_id, type, body) VALUES (${leadId}, ${user.id}, 'assign', ${`Assigned to ${assignee}`})`;
  revalidatePath(`/admin/leads/${leadId}`);
  revalidatePath("/admin/leads");
}

export async function addNote(leadId: number, formData: FormData) {
  const user = await requireUser();
  const body = String(formData.get("note") ?? "").trim();
  if (!body) return;
  await sql`INSERT INTO lead_activities (lead_id, user_id, type, body) VALUES (${leadId}, ${user.id}, 'note', ${body})`;
  await sql`UPDATE leads SET updated_at = now() WHERE id = ${leadId}`;
  revalidatePath(`/admin/leads/${leadId}`);
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
  const linkedinUrl =
    String(formData.get("linkedin_url") ?? "").trim() || null;
  const message = String(formData.get("message") ?? "").trim() || null;
  const source = String(formData.get("source") ?? "manual").trim() || "manual";

  const rows = await sql`
    INSERT INTO leads (name, email, phone, company, linkedin_url, message, source)
    VALUES (${name}, ${email}, ${phone}, ${company}, ${linkedinUrl}, ${message}, ${source})
    RETURNING id`;
  revalidatePath("/admin/leads");
  redirect(`/admin/leads/${rows[0].id}`);
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
