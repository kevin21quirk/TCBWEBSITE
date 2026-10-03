import { toggleUserActive } from "@/app/admin/actions";
import CreateUserForm from "@/app/admin/(app)/users/CreateUserForm";
import { requireSuperAdmin } from "@/lib/auth";
import type { CrmUser } from "@/lib/crm";
import { sql } from "@/lib/db";

export const metadata = { title: "Team" };
export const dynamic = "force-dynamic";

const fmt = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export default async function UsersPage() {
  const me = await requireSuperAdmin();
  const users = (await sql`
    SELECT id, email, name, role, active, created_at FROM users ORDER BY created_at
  `) as (CrmUser & { created_at: string })[];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-ink">Team</h1>

      <div className="grid gap-6 xl:grid-cols-3">
        {/* users table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm xl:col-span-2">
          <div className="border-b border-slate-100 px-6 py-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-ink">
              Users ({users.length})
            </h2>
          </div>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-xs font-semibold uppercase tracking-widest text-slate-500">
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="hidden px-6 py-4 lg:table-cell">Added</th>
                <th className="px-6 py-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} className="transition-colors hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand to-orange-500 text-sm font-bold text-white">
                        {u.name.charAt(0).toUpperCase()}
                      </span>
                      <div>
                        <p className="font-semibold text-ink">
                          {u.name}
                          {u.id === me.id && (
                            <span className="ml-2 text-xs text-slate-400">(you)</span>
                          )}
                        </p>
                        <p className="text-xs text-slate-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${
                        u.role === "super_admin"
                          ? "bg-brand/10 text-brand ring-brand/30"
                          : "bg-slate-100 text-slate-600 ring-slate-200"
                      }`}
                    >
                      {u.role === "super_admin" ? "Super Admin" : "Staff"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`flex w-fit items-center gap-2 text-xs font-semibold ${
                        u.active ? "text-emerald-600" : "text-slate-400"
                      }`}
                    >
                      <span
                        className={`h-2 w-2 rounded-full ${u.active ? "bg-emerald-500" : "bg-slate-300"}`}
                      />
                      {u.active ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td className="hidden px-6 py-4 text-slate-500 lg:table-cell">
                    {fmt.format(new Date(u.created_at))}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {u.id !== me.id && (
                      <form action={toggleUserActive.bind(null, u.id)}>
                        <button
                          type="submit"
                          className={`rounded-full px-4 py-1.5 text-xs font-semibold ring-1 transition-colors ${
                            u.active
                              ? "text-slate-500 ring-slate-200 hover:text-red-600 hover:ring-red-200"
                              : "text-emerald-600 ring-emerald-200 hover:bg-emerald-50"
                          }`}
                        >
                          {u.active ? "Disable" : "Enable"}
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* create user */}
        <div className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-bold uppercase tracking-widest text-ink">
            Add Employee
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            They can sign in at /admin immediately.
          </p>
          <CreateUserForm />
        </div>
      </div>
    </div>
  );
}
