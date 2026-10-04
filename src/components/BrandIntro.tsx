"use client";

import Image from "next/image";
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
    // Skip entirely on compact/mobile layouts and reduced-motion devices —
    // CSS shows the hero text and header logo instantly there.
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      window.matchMedia("(max-width: 1023px)").matches
    ) {
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
      <div
        ref={lockupRef}
        className="brand-lockup relative aspect-[10/3] w-[min(80vw,24rem)]"
      >
        <Image
          src="/images/tcb-logo-2.png"
          alt=""
          fill
          sizes="(min-width: 768px) 384px, 80vw"
          priority
          className="brand-word-left"
          style={{ clipPath: "inset(0% 78% 66% 0%)" }}
        />
        <Image
          src="/images/tcb-logo-2.png"
          alt=""
          fill
          sizes="(min-width: 768px) 384px, 80vw"
          priority
          className="brand-word-right"
          style={{ clipPath: "inset(0% 0% 66% 22%)" }}
        />
        <Image
          src="/images/tcb-logo-2.png"
          alt=""
          fill
          sizes="(min-width: 768px) 384px, 80vw"
          priority
          className="brand-word-up"
          style={{ clipPath: "inset(35% 0% 0% 0%)" }}
        />
      </div>
    </div>
  );
}
