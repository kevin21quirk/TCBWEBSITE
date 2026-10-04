"use client";

import { useState } from "react";

const inputClass =
  "w-full rounded-tcb border border-slate-200 bg-slate-50 px-5 py-3 text-sm text-ink placeholder:text-slate-400 focus:border-brand focus:bg-white focus:outline-none";

export default function ContactForm({
  compact = false,
}: {
  compact?: boolean;
}) {
  const [status, setStatus] = useState<
    "idle" | "sending" | "sent" | "error"
  >("idle");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "contact", ...data }),
      });
      setStatus(res.ok ? "sent" : "error");
      if (res.ok) form.reset();
    } catch {
      setStatus("error");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <input
          name="firstName"
          required
          placeholder="First Name"
          className={inputClass}
        />
        <input
          name="lastName"
          required
          placeholder="Last Name"
          className={inputClass}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <input
          name="email"
          type="email"
          required
          placeholder="Email"
          className={inputClass}
        />
        <input
          name="phone"
          type="tel"
          placeholder={compact ? "Phone" : "Phone No."}
          className={inputClass}
        />
      </div>
      {!compact && (
        <input name="subject" placeholder="Subject" className={inputClass} />
      )}
      <textarea
        name="message"
        required
        rows={5}
        placeholder="Message"
        className={`${inputClass} resize-y`}
      />
      {/* honeypot */}
      <input
        name="company"
        type="text"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden="true"
      />
      <button
        type="submit"
        disabled={status === "sending"}
        className="w-full rounded-full bg-brand px-8 py-3.5 text-sm font-semibold uppercase tracking-wide text-white transition-colors hover:bg-brand-dark disabled:opacity-60 sm:w-auto"
      >
        {status === "sending" ? "Sending…" : "Send Message"}
      </button>
      {status === "sent" && (
        <p className="text-sm text-green-600">
          Thanks for getting in touch — one of our experts will be in contact
          shortly.
        </p>
      )}
      {status === "error" && (
        <p className="text-sm text-brand">
          Something went wrong. Please email hello@thecontractorbroker.com or
          call 0330 043 4815.
        </p>
      )}
    </form>
  );
}
