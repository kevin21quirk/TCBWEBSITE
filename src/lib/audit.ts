import { headers } from "next/headers";
import { sql } from "@/lib/db";

export type AuditActor = { id: number; name: string } | null;

/**
 * Write an audit_log row. Never throws — auditing must never break the
 * action it's recording.
 */
export async function audit(opts: {
  user: AuditActor;
  /** Display name fallback when user is null (e.g. the attempted email). */
  name?: string;
  action: string;
  entity?: string | null;
  entityId?: number | null;
  detail?: string | null;
}) {
  try {
    const h = await headers();
    const ip =
      h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      h.get("x-real-ip") ||
      null;
    await sql`
      INSERT INTO audit_log (user_id, user_name, action, entity, entity_id, detail, ip)
      VALUES (${opts.user?.id ?? null}, ${opts.user?.name ?? opts.name ?? "Unknown"},
              ${opts.action}, ${opts.entity ?? null}, ${opts.entityId ?? null},
              ${opts.detail ?? null}, ${ip})`;
  } catch {
    /* swallow — see docblock */
  }
}
