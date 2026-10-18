"use client";

import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { deleteLeads, deleteSelectedLeads } from "@/app/admin/actions";

/** Trash icon that deletes one lead in place (no navigation). */
export function QuickDelete({
  leadId,
  leadName,
  className = "",
}: {
  leadId: number;
  leadName: string;
  className?: string;
}) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      title={`Delete ${leadName}`}
      aria-label={`Delete ${leadName}`}
      disabled={pending}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (window.confirm(`Delete "${leadName}"? This cannot be undone.`))
          start(async () => {
            await deleteLeads([leadId]);
          });
      }}
      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white/35 transition-colors hover:bg-red-500/20 hover:text-red-300 disabled:opacity-40 ${className}`}
    >
      {pending ? (
        <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
      ) : (
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
          <path d="M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
        </svg>
      )}
    </button>
  );
}

/** Small "likely spam" pill with the reasons on hover. */
export function SpamBadge({ reasons }: { reasons: string[] }) {
  if (!reasons.length) return null;
  return (
    <span
      title={`Flagged: ${reasons.join(", ")}`}
      className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-300 ring-1 ring-red-400/40"
    >
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-2.5 w-2.5">
        <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
      </svg>
      Spam?
    </span>
  );
}

/**
 * Wraps the leads table in a form. Rows render
 * <input type="checkbox" name="ids" value={id} data-spam="1|0" /> and this
 * component supplies the floating action bar.
 */
export function BulkSelect({
  children,
  spamCount,
  enabled,
}: {
  children: ReactNode;
  spamCount: number;
  enabled: boolean;
}) {
  if (!enabled) return <>{children}</>;
  return <BulkSelectForm spamCount={spamCount}>{children}</BulkSelectForm>;
}

function BulkSelectForm({ children, spamCount }: { children: ReactNode; spamCount: number }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [count, setCount] = useState(0);
  const [pending, start] = useTransition();

  const boxes = () =>
    Array.from(formRef.current?.querySelectorAll<HTMLInputElement>('input[name="ids"]') ?? []);
  const recount = () => setCount(boxes().filter((b) => b.checked).length);
  const setAll = (pred: (b: HTMLInputElement) => boolean) => {
    boxes().forEach((b) => (b.checked = pred(b)));
    recount();
  };

  useEffect(() => recount(), []);

  return (
    <form
      ref={formRef}
      onChange={recount}
      action={(fd) => {
        const n = fd.getAll("ids").length;
        if (!n) return;
        if (!window.confirm(`Delete ${n} lead${n === 1 ? "" : "s"}? This cannot be undone.`)) return;
        start(async () => {
          await deleteSelectedLeads(fd);
          setCount(0);
        });
      }}
    >
      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
        <button
          type="button"
          onClick={() => setAll(() => true)}
          className="rounded-full border border-white/15 px-3 py-1.5 font-semibold text-white/70 transition-colors hover:border-white/40 hover:text-white"
        >
          Select page
        </button>
        <button
          type="button"
          disabled={!spamCount}
          onClick={() => setAll((b) => b.dataset.spam === "1")}
          className="rounded-full border border-red-400/30 bg-red-500/10 px-3 py-1.5 font-semibold text-red-200 transition-colors hover:border-red-300/60 hover:bg-red-500/20 disabled:opacity-40"
        >
          Select likely spam ({spamCount})
        </button>
        {count > 0 && (
          <button
            type="button"
            onClick={() => setAll(() => false)}
            className="rounded-full px-3 py-1.5 font-semibold text-white/50 hover:text-white"
          >
            Clear
          </button>
        )}
      </div>

      {children}

      <div
        className={`pointer-events-none fixed inset-x-0 bottom-6 z-40 flex justify-center transition-all duration-300 lg:left-64 ${
          count ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
        }`}
      >
        <div className="glass pointer-events-auto flex items-center gap-4 rounded-full py-2 pl-5 pr-2 shadow-[0_20px_60px_-10px_rgba(0,0,0,0.8)]">
          <p className="text-sm font-semibold text-white">
            {count} selected
          </p>
          <button
            type="submit"
            disabled={pending || !count}
            className="flex items-center gap-2 rounded-full bg-gradient-to-r from-red-600 to-rose-500 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white shadow-[0_0_24px_-4px_rgba(239,68,68,0.9)] transition-shadow hover:shadow-[0_0_32px_-2px_rgba(239,68,68,1)] disabled:opacity-50"
          >
            {pending ? (
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            ) : (
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
                <path d="M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
              </svg>
            )}
            Delete
          </button>
        </div>
      </div>
    </form>
  );
}
