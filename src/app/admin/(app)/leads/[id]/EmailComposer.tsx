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
  const [files, setFiles] = useState<File[]>([]);
  const formRef = useRef<HTMLFormElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state?.ok) {
      setSubject("");
      setBody("");
      setBranded(false);
      setFiles([]);
      if (fileRef.current) fileRef.current.value = "";
    }
  }, [state]);

  const syncFiles = (list: File[]) => {
    const dt = new DataTransfer();
    list.forEach((f) => dt.items.add(f));
    if (fileRef.current) fileRef.current.files = dt.files;
  };

  const addFiles = (picked: FileList | null) => {
    const merged = [...files];
    for (const f of Array.from(picked ?? [])) {
      if (!merged.some((x) => x.name === f.name && x.size === f.size))
        merged.push(f);
    }
    const next = merged.slice(0, 5);
    setFiles(next);
    syncFiles(next);
  };

  const removeFile = (i: number) => {
    const next = files.filter((_, x) => x !== i);
    setFiles(next);
    syncFiles(next);
  };

  const fmtSize = (n: number) =>
    n >= 1e6 ? `${(n / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.ceil(n / 1e3))} KB`;

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
      <div>
        <input
          ref={fileRef}
          type="file"
          name="attachment"
          multiple
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-brand hover:text-brand"
        >
          Attach files
        </button>
        {files.length > 0 && (
          <ul className="mt-2 space-y-1">
            {files.map((f, i) => (
              <li
                key={`${f.name}-${f.size}`}
                className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs"
              >
                <span className="truncate font-medium text-ink">{f.name}</span>
                <span className="flex shrink-0 items-center gap-2 text-slate-400">
                  {fmtSize(f.size)}
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    aria-label={`Remove ${f.name}`}
                    className="font-bold text-slate-400 hover:text-red-600"
                  >
                    &times;
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-1 text-[11px] text-slate-400">
          Up to 5 files, 10 MB each.
        </p>
      </div>
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
