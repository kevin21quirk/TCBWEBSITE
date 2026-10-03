import NewLeadForm from "@/app/admin/(app)/leads/new/NewLeadForm";
import { requireUser } from "@/lib/auth";

export const metadata = { title: "Add Lead" };
export const dynamic = "force-dynamic";

export default async function NewLeadPage() {
  await requireUser();
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Add Lead</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manually record a lead — phone enquiry, referral, event contact…
        </p>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <NewLeadForm />
      </div>
    </div>
  );
}
