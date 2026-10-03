"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { testimonials } from "@/lib/content";

const CARD_W = 320;
const GAP = 24;
const SLOT = CARD_W + GAP;

export default function Testimonials() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(
    () => setIndex((i) => (i + 1) % testimonials.length),
    []
  );
  const prev = useCallback(
    () => setIndex((i) => (i - 1 + testimonials.length) % testimonials.length),
    []
  );

  useEffect(() => {
    if (paused) return;
    const t = setInterval(next, 5000);
    return () => clearInterval(t);
  }, [paused, next]);

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* carousel track */}
      <div className="relative overflow-hidden py-6">
        <div
          className="flex transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{
            gap: GAP,
            transform: `translateX(calc(50% - ${CARD_W / 2}px - ${index * SLOT}px))`,
          }}
        >
          {testimonials.map((t, i) => {
            const active = i === index;
            return (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Show testimonial from ${t.name}`}
                aria-current={active}
                className={`relative shrink-0 rounded-tcb border p-6 text-left transition-all duration-700 ease-out ${
                  active
                    ? "scale-100 border-brand/40 bg-white opacity-100 shadow-2xl shadow-brand/15"
                    : "scale-[0.88] border-slate-200 bg-white/70 opacity-50 shadow-sm hover:opacity-80"
                }`}
                style={{ width: CARD_W }}
              >
                <div
                  className={`absolute inset-x-0 top-0 h-1 rounded-t-tcb bg-gradient-to-r from-brand to-orange-400 transition-opacity duration-500 ${
                    active ? "opacity-100" : "opacity-0"
                  }`}
                />
                <Image
                  src={t.avatar}
                  alt={t.name}
                  width={56}
                  height={56}
                  className="h-14 w-14 rounded-full object-cover ring-2 ring-brand/20"
                />
                <div className="mt-3 text-sm tracking-widest text-brand">
                  ★★★★★
                </div>
                <p
                  className={`mt-3 text-sm leading-relaxed text-slate-600 ${
                    active ? "" : "line-clamp-4"
                  }`}
                >
                  {t.quote}
                </p>
                <p className="mt-4 font-semibold text-ink">{t.name}</p>
                <p className="text-xs text-muted">{t.role}</p>
              </button>
            );
          })}
        </div>

        {/* edge fades */}
        <div
          className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-slate-50 to-transparent md:w-32"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-slate-50 to-transparent md:w-32"
          aria-hidden="true"
        />
      </div>

      {/* controls */}
      <div className="flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={prev}
          aria-label="Previous testimonial"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 text-slate-500 transition-colors hover:border-brand hover:text-brand"
        >
          ‹
        </button>
        <div className="flex gap-2">
          {testimonials.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to testimonial ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`h-2 rounded-full transition-all ${
                i === index ? "w-6 bg-brand" : "w-2 bg-slate-300 hover:bg-slate-400"
              }`}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={next}
          aria-label="Next testimonial"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 text-slate-500 transition-colors hover:border-brand hover:text-brand"
        >
          ›
        </button>
      </div>
    </div>
  );
}
