import Link from "next/link";
import { revokeUserSessions } from "@/app/admin/actions";
import { requireSuperAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";

export const metadata = { title: "Audit Log" };
export const dynamic = "force-dynamic";

const fmt = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});
const fmtDay = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});
const cardClass =
  "rounded-2xl border border-slate-200 bg-white p-6 shadow-sm";

const ACTION_LABELS: Record<string, string> = {
  "auth.login": "Signed in",
  "auth.login_failed": "Failed login",
  "auth.logout": "Signed out",
  "lead.create": "Created lead",
  "lead.status": "Status change",
  "lead.assign": "Reassigned",
  "lead.update": "Edited lead",
  "lead.activity": "Logged activity",
  "lead.linkedin_save": "Saved LinkedIn",
  "lead.linkedin_step": "LinkedIn step",
  "lead.delete": "Deleted lead",
  "leads.delete": "Bulk delete",
  "leads.import": "CSV import",
  "leads.export": "CSV export",
  "email.send": "Sent email",
  "email.campaign": "Campaign",
  "email.test": "Test email",
  "sequence.start": "Sequence start",
  "sequence.stop": "Sequence stop",
  "followup.create": "Follow-up booked",
  "followup.complete": "Follow-up done",
  "user.create": "Created user",
  "user.disable": "Disabled user",
  "user.enable": "Enabled user",
  "session.revoke": "Signed out",
};

const CATEGORIES: [string, string][] = [
  ["", "All activity"],
  ["auth", "Sign-ins"],
  ["lead", "Lead actions"],
  ["email", "Emails"],
  ["sequence", "Sequences"],
  ["followup", "Follow-ups"],
  ["user", "Accounts"],
];

const CAT_STYLES: Record<string, string> = {
  auth: "bg-sky-50 text-sky-700 ring-sky-200",
  lead: "bg-brand/10 text-brand ring-brand/30",
  email: "bg-violet-50 text-violet-700 ring-violet-200",
  sequence: "bg-amber-50 text-amber-700 ring-amber-200",
  followup: "bg-teal-50 text-teal-700 ring-teal-200",
  user: "bg-rose-50 text-rose-700 ring-rose-200",
};

const catOf = (action: string) => action.split(".")[0];
const actionLabel = (a: string) =>
  ACTION_LABELS[a] ??
  a.replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

type Row = {
  id: number;
  user_id: number | null;
  user_name: string;
  action: string;
  entity: string | null;
  entity_id: number | null;
  detail: string | null;
  ip: string | null;
  created_at: string;
};

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ user?: string; cat?: string; days?: string; q?: string }>;
}) {
  const me = await requireSuperAdmin();
  const sp = await searchParams;
  const userId = Number(sp.user) || null;
  const cat = CATEGORIES.some(([c]) => c === sp.cat) ? (sp.cat ?? "") : "";
  const days = [7, 30, 90, 365].includes(Number(sp.days))
    ? Number(sp.days)
    : 30;
  const q = (sp.q ?? "").trim().slice(0, 100);
  const pattern = `%${q}%`;

  const [rows, users, stats, sessions] = await Promise.all([
    sql`
      SELECT id, user_id, user_name, action, entity, entity_id, detail, ip, created_at
      FROM audit_log
      WHERE created_at > now() - ${`${days} days`}::interval
        AND (${userId}::int IS NULL OR user_id = ${userId})
        AND (${cat} = '' OR action LIKE ${`${cat}.%`})
        AND (${q} = '' OR detail ILIKE ${pattern} OR user_name ILIKE ${pattern})
      ORDER BY created_at DESC
      LIMIT 300`,
    sql`SELECT id, name FROM users ORDER BY name`,
    sql`
      SELECT
        count(*) FILTER (WHERE created_at > now() - interval '24 hours')::int AS today,
        count(*) FILTER (WHERE created_at > now() - interval '7 days')::int AS week,
        count(DISTINCT user_id) FILTER (
          WHERE created_at > now() - interval '24 hours' AND user_id IS NOT NULL
        )::int AS active_today,
        count(*) FILTER (
          WHERE action = 'auth.login_failed'
            AND created_at > now() - interval '24 hours'
        )::int AS failed_logins
      FROM audit_log`,
    sql`
      SELECT DISTINCT ON (u.id)
             u.id AS user_id, u.name, u.email, u.role,
             s.created_at AS signed_in_at,
             (SELECT count(*) FROM sessions s2
              WHERE s2.user_id = u.id AND s2.expires_at > now())::int AS session_count,
             (SELECT ip FROM audit_log a
              WHERE a.user_id = u.id AND a.action = 'auth.login'
              ORDER BY a.created_at DESC LIMIT 1) AS ip,
             (SELECT max(a.created_at) FROM audit_log a
              WHERE a.user_id = u.id) AS last_active
      FROM sessions s JOIN users u ON u.id = s.user_id
      WHERE s.expires_at > now()
      ORDER BY u.id, s.created_at DESC`,
  ]);

  const s = stats[0] as {
    today: number;
    week: number;
    active_today: number;
    failed_logins: number;
  };
  const statCards = [
    { label: "Events today", value: s.today },
    { label: "Events this week", value: s.week },
    { label: "Active users today", value: s.active_today },
    { label: "Failed logins (24h)", value: s.failed_logins, warn: s.failed_logins > 0 },
  ];

  const inputClass =
    "rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-brand focus:bg-white focus:outline-none";

  // Group rows into day sections for readability.
  const grouped = new Map<string, Row[]>();
  for (const r of rows as Row[]) {
    const key = fmtDay.format(new Date(r.created_at));
    (grouped.get(key) ?? grouped.set(key, []).get(key)!).push(r);
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-ink">Audit Log</h1>
        <p className="mt-1 text-sm text-slate-500">
          Everything the team does in the CRM — sign-ins, lead changes, emails
          sent, imports, exports and account changes. Super admins only.
        </p>
      </header>

      {/* live sessions */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-ink">
            Signed in now ({sessions.length})
          </h2>
          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            Live
          </span>
        </div>
        {sessions.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">
            Nobody is signed in.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {(sessions as {
              user_id: number;
              name: string;
              email: string;
              role: string;
              signed_in_at: string;
              session_count: number;
              ip: string | null;
              last_active: string | null;
            }[]).map((s) => (
              <li
                key={s.user_id}
                className="flex items-center gap-4 px-6 py-3.5"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand to-orange-500 text-sm font-bold text-white">
                  {s.name.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-x-2 text-sm">
                    <span className="font-semibold text-ink">{s.name}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ${
                        s.role === "super_admin"
                          ? "bg-brand/10 text-brand ring-brand/30"
                          : "bg-slate-100 text-slate-600 ring-slate-200"
                      }`}
                    >
                      {s.role === "super_admin" ? "Super Admin" : "Staff"}
                    </span>
                    {s.user_id === me.id && (
                      <span className="text-[10px] font-semibold text-slate-400">
                        (you)
                      </span>
                    )}
                    {s.session_count > 1 && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500 ring-1 ring-slate-200">
                        {s.session_count} sessions
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {s.email}
                    {s.ip && ` · ${s.ip}`} · signed in{" "}
                    {fmt.format(new Date(s.signed_in_at))}
                    {s.last_active &&
                      ` · last active ${fmt.format(new Date(s.last_active))}`}
                  </p>
                </div>
                {(s.user_id !== me.id || s.session_count > 1) && (
                  <form action={revokeUserSessions.bind(null, s.user_id)}>
                    <button
                      type="submit"
                      className="shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold text-red-600 ring-1 ring-red-200 transition-colors hover:bg-red-50"
                    >
                      {s.user_id === me.id ? "Sign out other devices" : "Sign out"}
                    </button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((c) => (
          <div key={c.label} className={`${cardClass} !p-4`}>
            <p
              className={`text-2xl font-bold ${c.warn ? "text-red-600" : "text-ink"}`}
            >
              {c.value.toLocaleString("en-GB")}
            </p>
            <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
              {c.label}
            </p>
          </div>
        ))}
      </div>

      {/* filters */}
      <form
        method="GET"
        action="/admin/audit"
        className="flex flex-wrap items-center gap-2"
      >
        <select name="user" defaultValue={sp.user ?? ""} className={inputClass}>
          <option value="">Everyone</option>
          {(users as { id: number; name: string }[]).map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
        <select name="cat" defaultValue={cat} className={inputClass}>
          {CATEGORIES.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <select name="days" defaultValue={String(days)} className={inputClass}>
          {[7, 30, 90, 365].map((d) => (
            <option key={d} value={d}>
              Last {d} days
            </option>
          ))}
        </select>
        <input
          name="q"
          defaultValue={q}
          placeholder="Search details or names…"
          className={`${inputClass} min-w-0 flex-1 sm:max-w-xs`}
        />
        <button
          type="submit"
          className="rounded-xl bg-ink px-5 py-2 text-xs font-semibold uppercase tracking-widest text-white hover:bg-slate-800"
        >
          Filter
        </button>
      </form>

      {/* log */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-ink">
            Activity ({rows.length}
            {rows.length === 300 ? "+" : ""})
          </h2>
        </div>
        {rows.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-400">
            Nothing recorded for these filters yet.
          </p>
        ) : (
          [...grouped.entries()].map(([day, items]) => (
            <div key={day}>
              <p className="border-b border-slate-100 bg-slate-50/60 px-6 py-2 text-[11px] font-bold uppercase tracking-widest text-slate-500">
                {day}
              </p>
              <ul className="divide-y divide-slate-100">
                {items.map((r) => (
                  <li
                    key={r.id}
                    className="flex items-start gap-4 px-6 py-3.5 transition-colors hover:bg-slate-50/60"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand to-orange-500 text-sm font-bold text-white">
                      {r.user_name.charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                        <span className="font-semibold text-ink">
                          {r.user_name}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ${
                            CAT_STYLES[catOf(r.action)] ??
                            "bg-slate-100 text-slate-600 ring-slate-200"
                          }`}
                        >
                          {actionLabel(r.action)}
                        </span>
                        {r.entity === "lead" && r.entity_id && (
                          <Link
                            href={`/admin/leads/${r.entity_id}`}
                            className="text-xs font-semibold text-brand hover:underline"
                          >
                            lead #{r.entity_id} →
                          </Link>
                        )}
                      </p>
                      {r.detail && (
                        <p className="mt-0.5 break-words text-sm text-slate-600">
                          {r.detail}
                        </p>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs font-medium text-slate-500">
                        {fmt.format(new Date(r.created_at))}
                      </p>
                      {r.ip && (
                        <p className="mt-0.5 text-[10px] text-slate-400">
                          {r.ip}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
