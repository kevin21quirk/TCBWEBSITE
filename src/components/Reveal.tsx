"use client";

import { useEffect, useRef, useState } from "react";

export default function Reveal({
  children,
  id,
  className = "",
  delay = 0,
  direction = "up",
}: {
  children: React.ReactNode;
  id?: string;
  className?: string;
  delay?: number;
  direction?: "up" | "left" | "right" | "zoom" | "top";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} id={id} className={className}>
      {/* Inner element carries the transform — the observed outer wrapper
          stays at its true position so off-screen start offsets still trigger. */}
      <div
        data-reveal={direction}
        className={`reveal h-full ${visible ? "is-visible" : ""}`}
        style={{ transitionDelay: `${delay}ms` }}
      >
        {children}
      </div>
    </div>
  );
}
