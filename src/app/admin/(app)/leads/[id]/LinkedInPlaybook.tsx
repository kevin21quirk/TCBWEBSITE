"use client";

import { useActionState, useState } from "react";
import { markLinkedinStep } from "@/app/admin/actions";
import { LINKEDIN_SCRIPTS, fillTemplate } from "@/lib/crm";

function StepForm({
  leadId,
  step,
  label,
  variant,
}: {
  leadId: number;
  step: number;
  label: string;
  variant?: "ghost";
}) {
  const [state, action, pending] = useActionState(
    markLinkedinStep.bind(null, leadId),
    undefined
  );
  return (
    <form action={action}>
      <input type="hidden" name="step" value={step} />
      <button
        type="submit"
        disabled={pending}
        className={
          variant === "ghost"
            ? "text-[11px] font-semibold text-slate-400 hover:text-red-500 disabled:opacity-50"
            : "rounded-lg bg-[#0a66c2] px-2.5 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-[#004182] disabled:opacity-50"
        }
      >
        {pending ? "Saving…" : label}
      </button>
      {state?.error && (
        <p className="mt-1 text-[11px] text-red-600">{state.error}</p>
      )}
    </form>
  );
}

/**
 * The manual Sales Navigator replacement: ready-written, personalised
 * connect/message/follow-up scripts with copy buttons and a progress tracker.
 */
export default function LinkedInPlaybook({
  leadId,
  leadName,
  company,
  linkedinUrl,
  searchUrl,
  step,
  senderName,
}: {
  leadId: number;
  leadName: string;
  company: string | null;
  linkedinUrl: string | null;
  searchUrl: string | null;
  /** steps completed, 0..3 */
  step: number;
  senderName: string;
}) {
  const [copied, setCopied] = useState<string | null>(null);
  const lead = { name: leadName, company };

  const copy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied(null), 1600);
    } catch {}
  };

  const profileHref = linkedinUrl ?? searchUrl;

  return (
    <div className="space-y-3">
      {profileHref && (
        <a
          href={profileHref}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-2 rounded-xl bg-[#0a66c2] px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#004182]"
        >
          {linkedinUrl ? "Open LinkedIn profile" : "Find them on LinkedIn"} ↗
        </a>
      )}

      {LINKEDIN_SCRIPTS.map((s, i) => {
        const done = i < step;
        const current = i === step;
        const text = fillTemplate(s.body, lead, senderName);
        return (
          <div
            key={s.id}
            className={`rounded-xl border px-3.5 py-3 ${
              done
                ? "border-emerald-200 bg-emerald-50/50"
                : current
                  ? "border-[#0a66c2]/40 bg-[#0a66c2]/[0.03]"
                  : "border-slate-200 bg-slate-50/60"
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                  done
                    ? "bg-emerald-500 text-white"
                    : "bg-slate-200 text-slate-500"
                }`}
              >
                {done ? "✓" : i + 1}
              </span>
              <p className="text-xs font-bold text-ink">{s.label}</p>
            </div>
            <p className="mt-1 text-[10px] text-slate-400">{s.hint}</p>
            <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-slate-700">
              {text}
            </p>
            <div className="mt-2.5 flex items-center gap-2">
              <button
                type="button"
                onClick={() => copy(s.id, text)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-ink transition-colors hover:border-[#0a66c2] hover:text-[#0a66c2]"
              >
                {copied === s.id ? "Copied!" : "Copy"}
              </button>
              {!done && (
                <StepForm
                  leadId={leadId}
                  step={i + 1}
                  label="Mark sent"
                />
              )}
              {done && (
                <span className="text-[11px] font-semibold text-emerald-600">
                  Sent
                </span>
              )}
            </div>
          </div>
        );
      })}

      {step > 0 && (
        <StepForm leadId={leadId} step={0} label="Reset playbook" variant="ghost" />
      )}
    </div>
  );
}
