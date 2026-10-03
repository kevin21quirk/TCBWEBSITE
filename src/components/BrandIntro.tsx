"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Brand intro — after the glass blind clears, THE / CONTRACTOR / BROKER
 * fly in from different edges and assemble into the logo lockup. The
 * assembled lockup then FLIP-animates up to the header logo position,
 * crossfading into the real logo image.
 */
export default function BrandIntro() {
  const lockupRef = useRef<HTMLDivElement>(null);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setGone(true);
      return;
    }
    // JS owns the logo reveal: hide it now and swap the CSS-fallback class
    // for inline styles in the same frame (no flash).
    const target = document.getElementById("brand-logo-target");
    if (target) {
      target.style.opacity = "0";
      target.classList.remove("logo-delayed");
      target.style.transition = "opacity 0.35s ease";
    }

    const fly = setTimeout(() => {
      const el = lockupRef.current;
      if (!el) {
        setGone(true);
        return;
      }
      if (target) {
        const a = el.getBoundingClientRect();
        const b = target.getBoundingClientRect();
        if (b.width > 0 && b.height > 0) {
          const scale = b.height / a.height;
          el.style.transform = `translate(${
            b.left + b.width / 2 - (a.left + a.width / 2)
          }px, ${b.top + b.height / 2 - (a.top + a.height / 2)}px) scale(${scale})`;
        }
      }
      el.style.opacity = "0";
    }, 3900);
    const reveal = setTimeout(() => {
      if (target) target.style.opacity = "1";
    }, 3900 + 700);
    const done = setTimeout(() => setGone(true), 5100);
    return () => {
      clearTimeout(fly);
      clearTimeout(reveal);
      clearTimeout(done);
    };
  }, []);

  if (gone) return null;

  return (
    <div
      className="brand-intro-root pointer-events-none fixed inset-0 z-[60] flex items-center justify-center"
      aria-hidden="true"
    >
      <div ref={lockupRef} className="brand-lockup text-center">
        <div className="flex items-baseline justify-center gap-4 text-xl font-extrabold tracking-[0.15em] text-slate-900 md:text-3xl">
          <span className="brand-word-left">THE</span>
          <span className="brand-word-right">CONTRACTOR</span>
        </div>
        <div className="brand-word-up mt-3 text-6xl font-extrabold leading-none tracking-tight text-brand md:text-8xl">
          BROKER
        </div>
      </div>
    </div>
  );
}
