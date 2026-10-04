"use client";

import { useEffect } from "react";

/**
 * Flashes a highlight on the element matching the URL hash — on page load
 * and on same-page hash link clicks (Next.js client navigation doesn't
 * update CSS :target, so this is done in JS).
 */
export default function HashHighlight() {
  useEffect(() => {
    let timer = 0;
    const highlight = (hash: string) => {
      const el = hash.length > 1 && document.getElementById(decodeURIComponent(hash.slice(1)));
      if (!el) return;
      document
        .querySelectorAll(".hash-highlight")
        .forEach((n) => n.classList.remove("hash-highlight"));
      void el.offsetWidth;
      el.classList.add("hash-highlight");
      clearTimeout(timer);
      timer = window.setTimeout(() => el.classList.remove("hash-highlight"), 3000);
    };

    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest("a");
      if (!a || !a.hash) return;
      const url = new URL(a.href);
      if (url.pathname === window.location.pathname) highlight(url.hash);
    };

    highlight(window.location.hash);
    const onHash = () => highlight(window.location.hash);
    window.addEventListener("hashchange", onHash);
    document.addEventListener("click", onClick);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("hashchange", onHash);
      document.removeEventListener("click", onClick);
    };
  }, []);

  return null;
}
