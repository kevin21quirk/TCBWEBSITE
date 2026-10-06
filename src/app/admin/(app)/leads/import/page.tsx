import Link from "next/link";
import ImportForm from "@/app/admin/(app)/leads/import/ImportForm";
import { requireUser } from "@/lib/auth";

export const metadata = { title: "Import Leads" };

export default async function ImportPage() {
  await requireUser();
  return (
    <div className="space-y-6">
      <Link
        href="/admin/leads"
        className="text-xs font-semibold uppercase tracking-widest text-slate-500 hover:text-brand"
      >
        ← Back to leads
      </Link>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
          <h1 className="text-2xl font-bold text-ink">Import Leads</h1>
          <p className="mb-6 mt-1 text-sm text-slate-500">
            Bring in prospects from LinkedIn Sales Navigator or any spreadsheet.
            Duplicates are skipped automatically.
          </p>
          <ImportForm />
        </div>
        <div className="h-fit rounded-2xl border border-[#0a66c2]/20 bg-[#0a66c2]/[0.03] p-6 shadow-sm">
          <h2 className="text-sm font-bold uppercase tracking-widest text-ink">
            Getting a CSV from LinkedIn
          </h2>
          <ul className="mt-4 space-y-3 text-sm leading-snug text-slate-600">
            <li>
              <strong className="text-ink">Sales Navigator:</strong> LinkedIn doesn&apos;t
              offer a direct export, but CRM-sync partners and approved export tools can
              save a lead list as CSV.
            </li>
            <li>
              <strong className="text-ink">Your connections:</strong> LinkedIn →
              Settings → Data privacy → Get a copy of your data → Connections.
            </li>
            <li>
              <strong className="text-ink">Recognised columns:</strong> Name or First/Last
              Name, Email, Phone, Company, Title, LinkedIn/Profile URL.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
