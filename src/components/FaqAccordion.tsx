"use client";

import { useState } from "react";

export default function FaqAccordion({
  items,
}: {
  items: { q: string; a: string }[];
}) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="space-y-3">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div
            key={i}
            className={`overflow-hidden rounded-tcb border transition-colors ${
              isOpen ? "border-brand bg-white" : "border-slate-200 bg-white"
            }`}
          >
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left"
            >
              <span className="font-semibold text-ink">{item.q}</span>
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-lg leading-none transition-colors ${
                  isOpen
                    ? "bg-brand text-white"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {isOpen ? "−" : "+"}
              </span>
            </button>
            {isOpen && (
              <p className="px-6 pb-5 leading-relaxed text-muted">{item.a}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
