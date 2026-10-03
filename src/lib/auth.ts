import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { sql } from "@/lib/db";
import type { CrmUser } from "@/lib/crm";

const COOKIE = "tcb_session";
const SESSION_DAYS = 7;

export async function createSession(userId: number) {
  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await sql`INSERT INTO sessions (token, user_id, expires_at) VALUES (${token}, ${userId}, ${expires.toISOString()})`;
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires,
    path: "/",
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) {
    await sql`DELETE FROM sessions WHERE token = ${token}`;
    jar.delete(COOKIE);
  }
}

export async function currentUser(): Promise<CrmUser | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  const rows = await sql`
    SELECT u.id, u.email, u.name, u.role, u.active
    FROM sessions s JOIN users u ON u.id = s.user_id
    WHERE s.token = ${token} AND s.expires_at > now() AND u.active`;
  return (rows[0] as CrmUser | undefined) ?? null;
}

export async function verifyLogin(email: string, password: string) {
  const rows = await sql`
    SELECT id, password_hash, active FROM users WHERE email = ${email.toLowerCase().trim()}`;
  const user = rows[0] as
    | { id: number; password_hash: string; active: boolean }
    | undefined;
  if (!user || !user.active) return null;
  const ok = await bcrypt.compare(password, user.password_hash);
  return ok ? user.id : null;
}

export async function requireUser(): Promise<CrmUser> {
  const user = await currentUser();
  if (!user) redirect("/admin/login");
  return user;
}

export async function requireSuperAdmin(): Promise<CrmUser> {
  const user = await requireUser();
  if (user.role !== "super_admin") redirect("/admin");
  return user;
}

export function hashPassword(password: string) {
  return bcrypt.hashSync(password, 10);
}
