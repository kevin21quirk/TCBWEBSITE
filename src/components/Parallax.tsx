"use client";

import { useEffect, useRef } from "react";

export default function Parallax({
  children,
  className = "",
  style,
  speed = 0.25,
}: {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  speed?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        const offset =
          (r.top + r.height / 2 - window.innerHeight / 2) * speed;
        el.style.transform = `translateY(${offset}px)`;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [speed]);

  return (
    <div ref={ref} className={className} style={style}>
      {children}
    </div>
  );
}
