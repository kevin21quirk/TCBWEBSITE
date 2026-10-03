"use client";

import { useEffect, useRef, useState } from "react";

export default function WordsReveal({
  text,
  className = "",
  stagger = 55,
}: {
  text: string;
  className?: string;
  stagger?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
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
      { threshold: 0.2 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <span ref={ref} className={className} aria-label={text} role="text">
      {text.split(" ").map((word, i) => (
        <span
          key={i}
          className="inline-block overflow-hidden align-bottom"
          aria-hidden="true"
        >
          <span
            className={`inline-block transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              visible ? "translate-y-0" : "translate-y-[110%]"
            }`}
            style={{ transitionDelay: `${i * stagger}ms` }}
          >
            {word}
            {i < text.split(" ").length - 1 ? "\u00A0" : ""}
          </span>
        </span>
      ))}
    </span>
  );
}
