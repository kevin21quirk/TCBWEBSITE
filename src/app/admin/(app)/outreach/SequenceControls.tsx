"use client";

import { useActionState } from "react";
import { enrollSequence, stopSequence } from "@/app/admin/actions";

const fmtDate = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
});

export default function SequenceControls({
  leadId,
  step,
  nextSendAt,
  totalSteps,
  compact = false,
}: {
  leadId: number;
  /** Active step index (0-based) or null when no sequence is running. */
  step: number | null;
  nextSendAt: string | null;
  totalSteps: number;
  compact?: boolean;
}) {
  const [enrollState, enrollAction, enrolling] = useActionState(
    enrollSequence.bind(null, leadId),
    undefined
  );
  const [stopState, stopAction, stopping] = useActionState(
    stopSequence.bind(null, leadId),
    undefined
  );
  const error = enrollState?.error ?? stopState?.error;

  if (step !== null) {
    return (
      <form action={stopAction} className={compact ? "" : "space-y-2"}>
        <div className="flex items-center gap-3">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </span>
          <p className="text-xs text-slate-600">
            Step {step + 1} of {totalSteps}
            {nextSendAt && (
              <> · next send {fmtDate.format(new Date(nextSendAt))}</>
            )}
          </p>
          <button
            type="submit"
            disabled={stopping}
            className="ml-auto rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-500 transition-colors hover:border-red-200 hover:text-red-600 disabled:opacity-50"
          >
            {stopping ? "Stopping…" : "Stop"}
          </button>
        </div>
        {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
      </form>
    );
  }

  return (
    <form action={enrollAction} className={compact ? "" : "space-y-2"}>
      <button
        type="submit"
        disabled={enrolling}
        className={
          compact
            ? "rounded-lg bg-ink px-2.5 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
            : "w-full rounded-xl bg-ink px-4 py-2.5 text-xs font-semibold uppercase tracking-widest text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
        }
      >
        {enrolling ? "Starting…" : compact ? "Start" : "Start sequence"}
      </button>
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </form>
  );
}
