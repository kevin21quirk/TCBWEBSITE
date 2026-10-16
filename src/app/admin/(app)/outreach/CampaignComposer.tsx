"use client";

import { useActionState, useMemo, useState } from "react";
import { sendCampaign, sendTestEmail } from "@/app/admin/actions";
import { EMAIL_TEMPLATES, STATUS_STYLES, type LeadStatus } from "@/lib/crm";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-ink placeholder:text-slate-400 focus:border-brand focus:bg-white focus:outline-none";

const STATUS_BADGE: Record<string, string> = {
  new: "bg-sky-50 text-sky-700",
  contacted: "bg-amber-50 text-amber-700",
  qualified: "bg-emerald-50 text-emerald-700",
};

type ComposerLead = {
  id: number;
  name: string;
  email: string | null;
  company: string | null;
  status: string;
};

// Templates offered in the campaign picker — the two branded ones plus the
// most useful plain chases. "Custom" starts from a blank canvas.
const TEMPLATE_CHOICES = ["new-lead", "follow-up", "intro", "chase"] as const;
const BRANDED = new Set(["new-lead", "follow-up"]);

export default function CampaignComposer({ leads }: { leads: ComposerLead[] }) {
  const [state, action, pending] = useActionState(sendCampaign, undefined);
  const [templateId, setTemplateId] = useState<string>("new-lead");
  const [subject, setSubject] = useState(
    () => EMAIL_TEMPLATES.find((t) => t.id === "new-lead")?.subject ?? ""
  );
  const [body, setBody] = useState(
    () => EMAIL_TEMPLATES.find((t) => t.id === "new-lead")?.body ?? ""
  );
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const loadPreview = async () => {
    if (previewHtml) {
      setPreviewHtml(null);
      return;
    }
    setPreviewing(true);
    setPreviewError(null);
    try {
      const res = await fetch("/api/outreach/preview", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          subject,
          body,
          template: templateId || undefined,
        }),
      });
      const data = (await res.json()) as { html?: string; error?: string };
      if (data.html) setPreviewHtml(data.html);
      else setPreviewError(data.error ?? "Couldn't build the preview");
    } catch {
      setPreviewError("Couldn't build the preview");
    }
    setPreviewing(false);
  };

  const sendTest = async () => {
    setTesting(true);
    setTestResult(null);
    const r = await sendTestEmail(subject, body, templateId || undefined);
    setTestResult(r.ok ? "sent" : (r.error ?? "Failed to send"));
    setTesting(false);
  };

  const pickTemplate = (id: string) => {
    setTemplateId(id);
    const t = EMAIL_TEMPLATES.find((x) => x.id === id);
    setSubject(t?.subject ?? "");
    setBody(t?.body ?? "");
  };

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return leads.filter(
      (l) =>
        (statusFilter === "all" || l.status === statusFilter) &&
        (!q ||
          l.name.toLowerCase().includes(q) ||
          (l.company ?? "").toLowerCase().includes(q) ||
          (l.email ?? "").toLowerCase().includes(q))
    );
  }, [leads, statusFilter, search]);

  const visibleIds = visible.map((l) => l.id);
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selected.has(id));

  const toggleAll = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) visibleIds.forEach((id) => next.delete(id));
      else visibleIds.forEach((id) => next.add(id));
      return next;
    });
  };

  const toggle = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const statusLabel = (s: string) =>
    STATUS_STYLES[s as LeadStatus]?.label ?? s;

  return (
    <form action={action} className="space-y-4">
      {/* template picker */}
      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-slate-500">
          Message
        </p>
        <div className="flex flex-wrap gap-1.5">
          {TEMPLATE_CHOICES.map((id) => {
            const t = EMAIL_TEMPLATES.find((x) => x.id === id);
            if (!t) return null;
            return (
              <button
                key={id}
                type="button"
                onClick={() => pickTemplate(id)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  templateId === id
                    ? "bg-ink text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {t.label}
                {BRANDED.has(id) && <span className="ml-1.5 text-brand">◆</span>}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => pickTemplate("")}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              templateId === ""
                ? "bg-ink text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Custom
          </button>
        </div>
        {BRANDED.has(templateId) && (
          <p className="mt-2 rounded-lg bg-brand/[0.06] px-3 py-2 text-[11px] leading-relaxed text-slate-600">
            <span className="font-semibold text-brand">◆ Branded send</span> —
            every lead gets the full interactive email (buttons, benefits card,
            links), personalised with their name and company.
          </p>
        )}
      </div>

      <input
        name="name"
        placeholder="Campaign name (e.g. January intro blast)"
        className={inputClass}
      />
      <input
        name="subject"
        required
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        placeholder="Subject"
        className={inputClass}
      />
      <div>
        <textarea
          name="body"
          required
          rows={8}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write your message…"
          className={`${inputClass} resize-y`}
        />
        <p className="mt-1.5 text-[11px] text-slate-400">
          Merge tags: {"{firstName}"}, {"{companyClause}"}, {"{senderName}"} —
          filled in per lead automatically.
        </p>
      </div>
      <input type="hidden" name="template" value={templateId} />
      {/* selections that are filtered out of view must still submit */}
      {[...selected]
        .filter((id) => !visibleIds.includes(id))
        .map((id) => (
          <input key={id} type="hidden" name="lead_ids" value={id} />
        ))}

      {/* preview + test send */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={loadPreview}
          disabled={previewing}
          className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-ink transition-colors hover:border-brand hover:text-brand disabled:opacity-50"
        >
          {previewing ? "Building…" : previewHtml ? "Hide preview" : "Preview"}
        </button>
        <button
          type="button"
          onClick={sendTest}
          disabled={testing}
          className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-ink transition-colors hover:border-brand hover:text-brand disabled:opacity-50"
        >
          {testing ? "Sending…" : "Send me a test"}
        </button>
        {testResult && (
          <span
            className={`text-xs font-semibold ${
              testResult === "sent" ? "text-emerald-600" : "text-red-600"
            }`}
          >
            {testResult === "sent"
              ? "Test sent — check your inbox"
              : testResult}
          </span>
        )}
        {previewError && (
          <span className="text-xs font-semibold text-red-600">
            {previewError}
          </span>
        )}
      </div>

      {previewHtml && (
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <div className="border-b border-slate-200 bg-slate-50 px-3.5 py-2 text-[11px] font-semibold uppercase tracking-widest text-slate-500">
            Preview — shown as &ldquo;Jordan Smith at Acme Contracts Ltd&rdquo;
          </div>
          <iframe
            title="Email preview"
            srcDoc={previewHtml}
            sandbox=""
            className="h-[480px] w-full bg-slate-100"
          />
        </div>
      )}

      {/* audience picker */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
            Audience
          </p>
          <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-[11px] font-bold text-brand">
            {selected.size} selected
          </span>
        </div>
        <div className="mb-2 flex flex-wrap gap-1.5">
          {["all", "new", "contacted", "qualified"].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`rounded-full px-3 py-1 text-[11px] font-semibold capitalize transition-colors ${
                statusFilter === s
                  ? "bg-ink text-white"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
            >
              {s === "all" ? "All" : s}
            </button>
          ))}
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search…"
            className="ml-auto w-36 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] focus:border-brand focus:bg-white focus:outline-none"
          />
        </div>
        <div className="max-h-56 overflow-y-auto rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={toggleAll}
            className="sticky top-0 flex w-full items-center gap-2.5 border-b border-slate-200 bg-white px-3.5 py-2.5 text-left text-xs font-semibold text-ink hover:bg-slate-50"
          >
            <span
              className={`flex h-4 w-4 items-center justify-center rounded border text-[10px] ${
                allVisibleSelected
                  ? "border-brand bg-brand text-white"
                  : "border-slate-300"
              }`}
            >
              {allVisibleSelected && "✓"}
            </span>
            {allVisibleSelected ? "Deselect" : "Select"} all shown (
            {visible.length})
          </button>
          {visible.map((l) => (
            <label
              key={l.id}
              className="flex cursor-pointer items-center gap-2.5 border-b border-slate-100 px-3.5 py-2 text-xs last:border-0 hover:bg-slate-50"
            >
              <input
                type="checkbox"
                name="lead_ids"
                value={l.id}
                checked={selected.has(l.id)}
                onChange={() => toggle(l.id)}
                className="h-4 w-4 rounded border-slate-300 accent-brand"
              />
              <span className="min-w-0 flex-1 truncate font-semibold text-ink">
                {l.name}
                {l.company && (
                  <span className="font-normal text-slate-400">
                    {" "}
                    · {l.company}
                  </span>
                )}
              </span>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  STATUS_BADGE[l.status] ?? "bg-slate-100 text-slate-500"
                }`}
              >
                {statusLabel(l.status)}
              </span>
            </label>
          ))}
          {visible.length === 0 && (
            <p className="px-3.5 py-6 text-center text-xs text-slate-400">
              No leads match this filter.
            </p>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={pending || selected.size === 0}
        className="w-full rounded-xl bg-brand px-4 py-3 text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-orange-600 disabled:opacity-40"
      >
        {pending
          ? "Sending…"
          : `Send to ${selected.size} lead${selected.size === 1 ? "" : "s"}`}
      </button>

      {state?.ok && (
        <p className="rounded-xl bg-emerald-50 px-4 py-3 text-center text-xs font-semibold text-emerald-700">
          Sent {state.sent}
          {state.failed ? ` · ${state.failed} failed` : ""}
          {state.skipped ? ` · ${state.skipped} skipped (no email)` : ""}
        </p>
      )}
      {state?.error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-center text-xs font-semibold text-red-600">
          {state.error}
        </p>
      )}
    </form>
  );
}
