"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/** Records a page view for every public route change. */
export default function Tracker() {
  const pathname = usePathname();

  useEffect(() => {
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
