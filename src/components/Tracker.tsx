"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const ATTR_KEY = "tcb_attr";
const ATTR_DAYS = 90;

export type Attribution = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  landing_page?: string;
  referrer?: string;
};

/** First-touch marketing attribution, kept for 90 days. */
export function getAttribution(): Attribution {
  try {
    const raw = JSON.parse(localStorage.getItem(ATTR_KEY) ?? "null");
    if (raw && Date.now() - raw.at < ATTR_DAYS * 864e5) return raw.data;
  } catch {}
  return {};
}

function captureAttribution() {
  try {
    const params = new URLSearchParams(window.location.search);
    const hasUtm = ["utm_source", "utm_medium", "utm_campaign"].some((k) =>
      params.get(k)
    );
    const existing = getAttribution();
    // A new campaign click overrides; otherwise keep the first touch.
    if (!hasUtm && Object.keys(existing).length) return;
    const externalRef =
      document.referrer && !document.referrer.startsWith(window.location.origin)
        ? document.referrer
        : undefined;
    const data: Attribution = {
      utm_source: params.get("utm_source") ?? undefined,
      utm_medium: params.get("utm_medium") ?? undefined,
      utm_campaign: params.get("utm_campaign") ?? undefined,
      landing_page: window.location.pathname,
      referrer: externalRef,
    };
    localStorage.setItem(ATTR_KEY, JSON.stringify({ at: Date.now(), data }));
  } catch {}
}

/** Records a page view for every public route change. */
export default function Tracker() {
  const pathname = usePathname();

  useEffect(() => {
    captureAttribution();
    const t = setTimeout(() => {
      fetch("/api/track", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          path: pathname,
          referrer: document.referrer || null,
        }),
        keepalive: true,
      }).catch(() => {});
    }, 500);
    return () => clearTimeout(t);
  }, [pathname]);

  return null;
}
