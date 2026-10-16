"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { sendLeadEmail } from "@/app/admin/actions";
import { site } from "@/lib/content";
import { EMAIL_TEMPLATES, fillTemplate } from "@/lib/crm";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-ink placeholder:text-slate-400 focus:border-brand focus:bg-white focus:outline-none";

export default function EmailComposer({
  leadId,
  leadName,
  leadEmail,
  company,
  senderName,
}: {
  leadId: number;
  leadName: string;
  leadEmail: string;
  company: string | null;
  senderName: string;
}) {
  const [state, action, pending] = useActionState(
    sendLeadEmail.bind(null, leadId),
    undefined
  );
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [branded, setBranded] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) {
      setSubject("");
      setBody("");
      setBranded(false);
    }
  }, [state]);

  const applyTemplate = (id: string) => {
    const t = EMAIL_TEMPLATES.find((x) => x.id === id);
    if (!t) return;
    const lead = { name: leadName, company };
    setSubject(fillTemplate(t.subject, lead, senderName));
    setBody(fillTemplate(t.body, lead, senderName));
    setBranded(t.id === "new-lead");
  };

  return (
    <form ref={formRef} action={action} className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {EMAIL_TEMPLATES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => applyTemplate(t.id)}
            className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-brand hover:text-brand"
          >
            {t.label}
          </button>
        ))}
      </div>
      {branded && <input type="hidden" name="template" value="new-lead" />}
      <p className="text-xs text-slate-500">
        To: <span className="font-semibold text-ink">{leadEmail}</span> · from{" "}
        <span className="font-semibold text-ink">{site.email}</span> — replies
        land there too
      </p>
      {branded && (
        <div className="rounded-xl border border-brand/20 bg-brand/5 px-4 py-2.5 text-xs leading-relaxed text-slate-600">
          Sends as our branded introduction: the message below plus a
          &ldquo;why choose us&rdquo; section and reply, call and website
          buttons.{" "}
          <button
            type="button"
            onClick={() => setBranded(false)}
            className="font-semibold text-brand underline underline-offset-2"
          >
            Send as a plain email instead
          </button>
        </div>
      )}
      <input
        name="subject"
        required
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        placeholder="Subject"
        className={inputClass}
      />
      <textarea
        name="body"
        required
        rows={9}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Write your message, or pick a template above…"
        className={`${inputClass} resize-y leading-relaxed`}
      />
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-gradient-to-r from-brand to-brand-light px-6 py-2.5 text-xs font-semibold uppercase tracking-widest text-white shadow-lg shadow-brand/30 transition-all hover:shadow-brand/50 disabled:opacity-60"
        >
          {pending ? "Sending…" : "Send Email"}
        </button>
        {state?.ok && (
          <p className="text-sm font-medium text-emerald-600">
            ✓ Sent and logged to the timeline.
          </p>
        )}
        {state?.error && (
          <p className="text-sm font-medium text-red-600">{state.error}</p>
        )}
      </div>
    </form>
  );
}
