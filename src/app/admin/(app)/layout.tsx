import Image from "next/image";
import { logoutAction } from "@/app/admin/actions";
import AdminHeader from "@/app/admin/(app)/AdminHeader";
import AdminNav from "@/app/admin/(app)/AdminNav";
import { HoloBackdrop } from "@/app/admin/(app)/DashboardFx";
import { requireUser } from "@/lib/auth";

export const metadata = {
  title: { default: "CRM", template: "%s — TCB CRM" },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <div className="holo-theme flex min-h-screen bg-[#070b16]">
      <HoloBackdrop fixed />

      {/* sidebar */}
      <aside className="glass fixed inset-y-0 left-0 z-40 hidden w-64 flex-col lg:flex">
        <div className="flex h-16 items-center gap-3 border-b border-white/10 px-6">
          <Image
            src="/images/tcb-logo-2.png"
            alt="The Contractor Broker"
            width={300}
            height={90}
            className="h-8 w-auto rounded bg-white px-1.5 py-0.5"
          />
          <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            CRM
          </span>
        </div>
        <AdminNav isSuperAdmin={user.role === "super_admin"} />
        <div className="mt-auto border-t border-white/10 p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand to-orange-500 text-sm font-bold text-white shadow-[0_0_18px_-2px_rgba(220,38,38,0.8)]">
              {user.name.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">
                {user.name}
              </p>
              <p className="truncate text-xs text-slate-400">
                {user.role === "super_admin" ? "Super Admin" : "Staff"}
              </p>
            </div>
          </div>
          <form action={logoutAction} className="mt-3">
            <button
              type="submit"
              className="w-full rounded-lg border border-white/15 py-2 text-xs font-semibold uppercase tracking-widest text-slate-300 transition-colors hover:border-brand hover:text-white"
            >
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* content */}
      <div className="relative min-w-0 flex-1 lg:ml-64">
        <AdminHeader
          isSuperAdmin={user.role === "super_admin"}
          userName={user.name}
          roleLabel={user.role === "super_admin" ? "Super Admin" : "Staff"}
        />
        <main className="holo-scene p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
