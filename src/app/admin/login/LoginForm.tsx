"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/admin/actions";

const inputClass =
  "w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-brand-light focus:bg-white/15 focus:outline-none";

export default function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, undefined);

  return (
    <form action={action} className="mt-8 space-y-4">
      {state?.error && (
        <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {state.error}
        </p>
      )}
      <input
        name="email"
        type="email"
        required
        autoComplete="username"
        placeholder="Email address"
        className={inputClass}
      />
      <input
        name="password"
        type="password"
        required
        autoComplete="current-password"
        placeholder="Password"
        className={inputClass}
      />
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-gradient-to-r from-brand to-brand-light py-3.5 text-sm font-semibold uppercase tracking-wide text-white shadow-lg shadow-brand/30 transition-all duration-300 hover:shadow-brand/50 disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign In"}
      </button>
    </form>
  );
}
