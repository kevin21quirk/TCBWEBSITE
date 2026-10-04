"use client";

import { useActionState } from "react";
import { createLead } from "@/app/admin/actions";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-ink placeholder:text-slate-400 focus:border-brand focus:bg-white focus:outline-none";

export default function NewLeadForm() {
  const [state, action, pending] = useActionState(createLead, undefined);

  return (
    <form action={action} className="space-y-4">
      {state?.error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {state.error}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <input name="name" required placeholder="Full name *" className={inputClass} />
        <input name="company" placeholder="Company" className={inputClass} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <input name="email" type="email" placeholder="Email" className={inputClass} />
        <input name="phone" placeholder="Phone" className={inputClass} />
      </div>
      <input
        name="linkedin_url"
        type="url"
        placeholder="LinkedIn profile URL (https://www.linkedin.com/in/…)"
        className={inputClass}
      />
      <select name="source" defaultValue="manual" className={inputClass}>
        <option value="manual">Manual entry</option>
        <option value="phone">Phone enquiry</option>
        <option value="linkedin">LinkedIn / Sales Navigator</option>
        <option value="referral">Referral</option>
        <option value="event">Event / expo</option>
        <option value="other">Other</option>
      </select>
      <textarea
        name="message"
        rows={4}
        placeholder="Notes about this lead…"
        className={inputClass}
      />
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-gradient-to-r from-brand to-brand-light py-3.5 text-sm font-semibold uppercase tracking-wide text-white shadow-lg shadow-brand/30 transition-all hover:shadow-brand/50 disabled:opacity-60"
      >
        {pending ? "Saving…" : "Create Lead"}
      </button>
    </form>
  );
}
