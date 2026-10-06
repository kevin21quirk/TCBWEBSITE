"use client";

import { useTransition } from "react";
import { deleteLead } from "@/app/admin/actions";

export default function DeleteLeadButton({
  leadId,
  leadName,
}: {
  leadId: number;
  leadName: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (
          window.confirm(
            `Delete ${leadName}? This permanently removes the lead, its notes and its follow-ups.`
          )
        ) {
          startTransition(() => deleteLead(leadId));
        }
      }}
      className="block w-full rounded-2xl border border-red-200 py-3 text-center text-xs font-semibold uppercase tracking-widest text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
    >
      {pending ? "Deleting…" : "Delete Lead"}
    </button>
  );
}
