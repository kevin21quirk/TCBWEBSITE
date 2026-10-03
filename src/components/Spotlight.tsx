"use client";

import { useRef } from "react";

export default function Spotlight({
  children,
  className = "",
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  function handleMove(e: React.MouseEvent) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  }

  return (
    <div ref={ref} onMouseMove={handleMove} className={`spotlight ${className}`}>
      {children}
    </div>
  );
}
