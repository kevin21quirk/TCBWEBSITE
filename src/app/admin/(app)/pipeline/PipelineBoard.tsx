"use client";

import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";
import { updateLeadStatus } from "@/app/admin/actions";
import {
  LEAD_STATUSES,
  STATUS_STYLES,
  TEMPERATURE_STYLES,
  money,
  type LeadStatus,
} from "@/lib/crm";

export type BoardCard = {
  id: number;
  name: string;
  company: string | null;
  job_title: string | null;
  status: LeadStatus;
  value: number;
  score: number;
  temperature: "hot" | "warm" | "cold";
  assignee: string | null;
  linkedin: boolean;
  overdue: boolean;
};

export default function PipelineBoard({ cards }: { cards: BoardCard[] }) {
  const [, startTransition] = useTransition();
  const [dragId, setDragId] = useState<number | null>(null);
  const [over, setOver] = useState<LeadStatus | null>(null);
  const [optimistic, move] = useOptimistic(
    cards,
    (state, { id, status }: { id: number; status: LeadStatus }) =>
      state.map((c) => (c.id === id ? { ...c, status } : c))
  );

  const drop = (status: LeadStatus) => {
    setOver(null);
    const card = optimistic.find((c) => c.id === dragId);
    setDragId(null);
    if (!card || card.status === status) return;
    startTransition(async () => {
      move({ id: card.id, status });
      await updateLeadStatus(card.id, status);
    });
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {LEAD_STATUSES.map((status) => {
        const col = optimistic.filter((c) => c.status === status);
        const total = col.reduce((s, c) => s + c.value, 0);
        return (
          <div
            key={status}
            onDragOver={(e) => {
              e.preventDefault();
              setOver(status);
            }}
            onDragLeave={() => setOver((o) => (o === status ? null : o))}
            onDrop={() => drop(status)}
            className={`flex min-w-[13rem] flex-1 flex-col rounded-2xl border bg-slate-50/80 transition-colors ${
              over === status ? "border-brand bg-brand/5" : "border-slate-200"
            }`}
          >
            <div className="border-b border-slate-200 px-4 py-3">
              <div className="flex items-center justify-between">
                <p className="flex items-center gap-2 text-sm font-bold text-ink">
                  <span className={`h-2.5 w-2.5 rounded-full ${STATUS_STYLES[status].dot}`} />
                  {STATUS_STYLES[status].label}
                </p>
                <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-slate-500 ring-1 ring-slate-200">
                  {col.length}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">{money.format(total)}</p>
            </div>
            <div className="flex min-h-[200px] flex-1 flex-col gap-2.5 p-3">
              {col.map((c) => (
                <div
                  key={c.id}
                  draggable
                  onDragStart={() => setDragId(c.id)}
                  onDragEnd={() => setDragId(null)}
                  className={`cursor-grab rounded-xl border bg-white p-3.5 shadow-sm transition-all hover:shadow-md active:cursor-grabbing ${
                    dragId === c.id ? "opacity-40" : ""
                  } ${c.overdue ? "border-red-200" : "border-slate-200"}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      href={`/admin/leads/${c.id}`}
                      className="truncate text-sm font-semibold text-ink hover:text-brand"
                    >
                      {c.name}
                    </Link>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ${TEMPERATURE_STYLES[c.temperature].badge}`}
                    >
                      {c.score}
                    </span>
                  </div>
                  {(c.job_title || c.company) && (
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {[c.job_title, c.company].filter(Boolean).join(" · ")}
                    </p>
                  )}
                  <div className="mt-3 flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-ink">
                      {c.value ? money.format(c.value) : "—"}
                    </span>
                    <span className="flex items-center gap-1.5 text-slate-400">
                      {c.overdue && <span className="font-semibold text-red-600">Overdue</span>}
                      {c.linkedin && (
                        <span className="rounded bg-[#0a66c2] px-1 font-bold text-white">in</span>
                      )}
                      {c.assignee && (
                        <span
                          title={c.assignee}
                          className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-brand to-orange-500 text-[9px] font-bold text-white"
                        >
                          {c.assignee.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              ))}
              {col.length === 0 && (
                <p className="py-8 text-center text-xs text-slate-400">Drop leads here</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
