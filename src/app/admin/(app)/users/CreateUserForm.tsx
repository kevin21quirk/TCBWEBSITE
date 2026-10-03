"use client";

import { useActionState, useEffect, useRef } from "react";
import { createUser } from "@/app/admin/actions";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-ink placeholder:text-slate-400 focus:border-brand focus:bg-white focus:outline-none";

export default function CreateUserForm() {
  const [state, action, pending] = useActionState(createUser, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state?.error) {
      formRef.current?.reset();
    }
    wasPending.current = pending;
  }, [pending, state]);

  return (
    <form ref={formRef} action={action} className="mt-5 space-y-4">
      {state?.error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {state.error}
        </p>
      )}
      <input name="name" required placeholder="Full name" className={inputClass} />
      <input
        name="email"
        type="email"
        required
        placeholder="Email address"
        className={inputClass}
      />
      <input
        name="password"
        type="password"
        required
        minLength={8}
        placeholder="Password (min 8 chars)"
        autoComplete="new-password"
        className={inputClass}
      />
      <select name="role" defaultValue="staff" className={inputClass}>
        <option value="staff">Staff</option>
        <option value="super_admin">Super Admin</option>
      </select>
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-gradient-to-r from-brand to-brand-light py-3 text-sm font-semibold uppercase tracking-wide text-white shadow-lg shadow-brand/30 transition-all hover:shadow-brand/50 disabled:opacity-60"
      >
        {pending ? "Creating…" : "Create User"}
      </button>
    </form>
  );
}
