"use client";

import { useState } from "react";
import { smartLink } from "@/lib/crm";

const DESTINATIONS = [
  { path: "/", label: "Homepage" },
  { path: "/services", label: "Services" },
  { path: "/contact", label: "Contact page" },
];

/**
 * Copy-ready tracked links. When the lead clicks one, every page they view
 * is attributed to them — timeline note, journey panel and the outreach
 * "browsing the site" list.
 */
export default function SmartLinks({ leadId }: { leadId: number }) {
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (path: string) => {
    try {
      await navigator.clipboard.writeText(smartLink(leadId, path));
      setCopied(path);
      setTimeout(() => setCopied(null), 1600);
    } catch {}
  };

  return (
    <div className="space-y-2">
      {DESTINATIONS.map((d) => {
        const url = smartLink(leadId, d.path);
        return (
          <div
            key={d.path}
            className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
          >
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-ink">{d.label}</p>
              <p className="truncate text-[10px] text-slate-400">{url}</p>
            </div>
            <button
              type="button"
              onClick={() => copy(d.path)}
              className="shrink-0 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-ink transition-colors hover:border-brand hover:text-brand"
            >
              {copied === d.path ? "Copied!" : "Copy"}
            </button>
          </div>
        );
      })}
      <p className="text-[11px] leading-relaxed text-slate-400">
        Paste one into a LinkedIn message or email — when they click, every page
        they view appears on this lead&apos;s timeline and in Outreach.
      </p>
    </div>
  );
}
