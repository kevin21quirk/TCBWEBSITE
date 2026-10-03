"use client";

import { useState } from "react";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "newsletter", email }),
      });
      setStatus(res.ok ? "sent" : "error");
      if (res.ok) setEmail("");
    } catch {
      setStatus("error");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <label htmlFor="newsletter-email" className="sr-only">
        Email
      </label>
      <input
        id="newsletter-email"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        className="w-full rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm text-white placeholder:text-slate-400 focus:border-brand focus:outline-none"
      />
      <button
        type="submit"
        disabled={status === "sending"}
        className="w-full rounded-full bg-brand px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-white transition-colors hover:bg-brand-dark disabled:opacity-60"
      >
        {status === "sending" ? "Sending…" : "Submit"}
      </button>
      {status === "sent" && (
        <p className="text-xs text-green-400">Thanks — we&apos;ll be in touch.</p>
      )}
      {status === "error" && (
        <p className="text-xs text-red-400">
          Something went wrong. Please email us directly.
        </p>
      )}
    </form>
  );
}
