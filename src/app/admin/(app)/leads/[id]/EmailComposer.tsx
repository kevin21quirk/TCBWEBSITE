"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { sendLeadEmail } from "@/app/admin/actions";
import { site } from "@/lib/content";
import { EMAIL_TEMPLATES, fillTemplate } from "@/lib/crm";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-ink placeholder:text-slate-400 focus:border-brand focus:bg-white focus:outline-none";

const CHUNK = 1024 * 1024;
const MAX_FILE_BYTES = 20 * 1024 * 1024;

type PickedFile = {
  id: string;
  name: string;
  size: number;
  status: "uploading" | "ready" | "failed";
};

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
  const [files, setFiles] = useState<PickedFile[]>([]);
  const [fileError, setFileError] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const uploading = files.some((f) => f.status === "uploading");

  useEffect(() => {
    if (state?.ok) {
      setSubject("");
      setBody("");
      setBranded(false);
      setFiles([]);
      setFileError("");
    }
  }, [state]);

  // Files upload in 1 MB chunks to /api/attachments so the request never
  // hits the platform's ~4.5 MB body cap — the form sends only upload ids.
  const uploadFile = async (file: File, id: string) => {
    for (let i = 0, n = Math.ceil(file.size / CHUNK); i < n; i++) {
      const res = await fetch(
        `/api/attachments?upload=${id}&name=${encodeURIComponent(file.name)}&chunk=${i}`,
        { method: "POST", body: file.slice(i * CHUNK, (i + 1) * CHUNK) }
      );
      if (!res.ok) throw new Error("upload failed");
    }
  };

  const addFiles = async (list: File[]) => {
    setFileError("");
    const additions: { id: string; file: File }[] = [];
    const next = [...files];
    for (const f of list) {
      if (next.length >= 5) break;
      if (f.size > MAX_FILE_BYTES) {
        setFileError(`"${f.name}" is over the 20 MB per-file limit`);
        continue;
      }
      if (next.some((x) => x.name === f.name && x.size === f.size)) continue;
      const id = crypto.randomUUID();
      next.push({ id, name: f.name, size: f.size, status: "uploading" });
      additions.push({ id, file: f });
    }
    setFiles(next);
    for (const { id, file } of additions) {
      const ok = await uploadFile(file, id).then(
        () => true,
        () => false
      );
      setFiles((prev) =>
        prev.map((x) =>
          x.id === id ? { ...x, status: ok ? "ready" : "failed" } : x
        )
      );
    }
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((x) => x.id !== id));
    fetch(`/api/attachments?upload=${id}`, { method: "DELETE" }).catch(
      () => {}
    );
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
          multiple
          className="hidden"
          onChange={(e) => {
            // Snapshot before clearing — input.files is a live FileList,
            // so resetting the input would empty it first.
            const list = Array.from(e.target.files ?? []);
            e.target.value = "";
            void addFiles(list);
          }}
        />
        {files
          .filter((f) => f.status === "ready")
          .map((f) => (
            <span key={f.id}>
              <input type="hidden" name="attachment_id" value={f.id} />
              <input type="hidden" name="attachment_name" value={f.name} />
            </span>
          ))}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-brand hover:text-brand"
        >
          Attach files
        </button>
        {files.length > 0 && (
          <ul className="mt-2 space-y-1">
            {files.map((f) => (
              <li
                key={f.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs"
              >
                <span className="truncate font-medium text-ink">{f.name}</span>
                <span className="flex shrink-0 items-center gap-2 text-slate-400">
                  {f.status === "uploading" ? (
                    <span className="text-slate-500">Uploading…</span>
                  ) : f.status === "failed" ? (
                    <span className="font-semibold text-red-600">
                      upload failed
                    </span>
                  ) : (
                    fmtSize(f.size)
                  )}
                  <button
                    type="button"
                    onClick={() => removeFile(f.id)}
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
        {fileError && (
          <p className="mt-1 text-xs font-medium text-red-600">{fileError}</p>
        )}
        <p className="mt-1 text-[11px] text-slate-400">
          Up to 5 files · 20 MB each · 25 MB total.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending || uploading}
          className="rounded-xl bg-gradient-to-r from-brand to-brand-light px-6 py-2.5 text-xs font-semibold uppercase tracking-widest text-white shadow-lg shadow-brand/30 transition-all hover:shadow-brand/50 disabled:opacity-60"
        >
          {pending ? "Sending…" : uploading ? "Uploading…" : "Send Email"}
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
