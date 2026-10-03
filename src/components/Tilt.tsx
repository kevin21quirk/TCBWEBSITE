"use client";

import { useRef } from "react";

export default function Tilt({
  children,
  className = "",
  max = 10,
  scale = 1.02,
}: {
  children: React.ReactNode;
  className?: string;
  max?: number;
  scale?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  function handleMove(e: React.MouseEvent) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.transition = "transform 0.12s ease-out";
    el.style.transform = `perspective(900px) rotateY(${px * max}deg) rotateX(${
      -py * max
    }deg) scale(${scale})`;
  }

  function handleLeave() {
    const el = ref.current;
    if (!el) return;
    el.style.transition = "transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)";
    el.style.transform = "perspective(900px) rotateY(0deg) rotateX(0deg)";
  }

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className={`tilt ${className}`}
    >
      {children}
    </div>
  );
}
