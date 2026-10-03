"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const scenes = [
  {
    num: "01",
    step: "Step 1",
    title: "Fill in the online form",
    description:
      "Two minutes and a few details — that's all we need to start comparing umbrella companies for you.",
    icon: "/images/iconmonstr-clipboard-6-240.png",
    href: "/contact",
    linkLabel: "Online Form",
  },
  {
    num: "02",
    step: "Step 2",
    title: "Await a phone call from one of our experts",
    description:
      "A specialist reviews your situation and matches you with vetted, compliant umbrella companies.",
    icon: "/images/iconmonstr-phone-13-240.png",
  },
  {
    num: "03",
    step: "Step 3",
    title: "Enjoy all the benefits of an umbrella company",
    description:
      "Same-day payments, IR35 compliance and statutory benefits — all handled for you.",
    icon: "/images/iconmonstr-check-mark-circle-lined-240.png",
  },
];

export default function ScrollStory() {
  const sectionRef = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        const scrollable = r.height - window.innerHeight;
        const p = scrollable > 0 ? Math.min(Math.max(-r.top / scrollable, 0), 1) : 0;
        setProgress(p);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const t = progress * (scenes.length - 1);
  const active = Math.round(t);

  return (
    <section ref={sectionRef} className="relative bg-ink" style={{ height: "320vh" }}>
      <div className="relative sticky top-0 flex h-screen items-center overflow-hidden">
        {/* ambient */}
        <div
          className="animate-aurora absolute -left-32 top-0 h-72 w-72 rounded-full bg-brand/20 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="animate-aurora absolute -right-32 bottom-0 h-72 w-72 rounded-full bg-orange-500/15 blur-3xl [animation-delay:-7s]"
          aria-hidden="true"
        />


        {/* heading pinned top */}
        <div className="absolute left-1/2 top-10 -translate-x-1/2 text-center">
          <p className="flex items-center justify-center gap-3 text-sm font-semibold uppercase tracking-widest text-brand-light">
            <span className="h-px w-8 bg-gradient-to-r from-transparent to-brand" />
            How It Works
            <span className="h-px w-8 bg-gradient-to-l from-transparent to-brand" />
          </p>
          <h2 className="mt-3 text-3xl font-bold text-white md:text-4xl">
            What to Do Next
          </h2>
        </div>

        {/* progress rail */}
        <div className="absolute left-6 top-1/2 hidden -translate-y-1/2 md:left-12 lg:block">
          <div className="relative h-56 w-px bg-white/15">
            <div
              className="absolute left-0 top-0 w-px bg-gradient-to-b from-brand to-orange-400 transition-[height] duration-100"
              style={{ height: `${progress * 100}%` }}
            />
            {scenes.map((s, i) => (
              <div
                key={s.step}
                className="absolute -left-[7px] flex items-center gap-4"
                style={{ top: `${(i / (scenes.length - 1)) * 100}%` }}
              >
                <span
                  className={`h-[15px] w-[15px] -translate-y-1/2 rounded-full border-2 transition-all duration-300 ${
                    active === i
                      ? "border-brand-light bg-brand shadow-lg shadow-brand/50 scale-125"
                      : "border-white/30 bg-ink"
                  }`}
                />
                <span
                  className={`absolute left-6 -translate-y-1/2 whitespace-nowrap text-xs font-semibold uppercase tracking-widest transition-colors duration-300 ${
                    active === i ? "text-white" : "text-slate-500"
                  }`}
                >
                  {s.step}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* scenes */}
        {scenes.map((s, i) => {
          const off = i - t;
          const opacity = Math.max(0, 1 - Math.abs(off));
          return (
            <div
              key={s.step}
              className="absolute inset-0 flex items-center justify-center px-6"
              style={{
                transform: `translateY(${off * 105}%)`,
                opacity,
              }}
              aria-hidden={active !== i}
            >
              <div className="relative text-center">
                <span
                  className="text-stroke-light pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 select-none text-[11rem] font-extrabold leading-none md:text-[15rem]"
                  aria-hidden="true"
                >
                  {s.num}
                </span>
                <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-white/20 bg-white/10 backdrop-blur-md">
                  <Image
                    src={s.icon}
                    alt=""
                    width={44}
                    height={44}
                    className="h-11 w-11 invert"
                  />
                </div>
                <p className="mt-6 inline-block rounded-full bg-gradient-to-r from-brand to-brand-light px-4 py-1 text-xs font-bold uppercase tracking-widest text-white shadow-lg shadow-brand/40">
                  {s.step}
                </p>
                <h3 className="mx-auto mt-5 max-w-xl text-2xl font-bold text-white md:text-4xl">
                  {s.title}
                </h3>
                <p className="mx-auto mt-4 max-w-md leading-relaxed text-slate-300">
                  {s.description}
                </p>
                {s.href && (
                  <Link
                    href={s.href}
                    className="mt-6 inline-block rounded-full border border-white/40 bg-white/10 px-8 py-3.5 text-sm font-semibold uppercase tracking-wide text-white backdrop-blur-md transition-all duration-300 hover:border-white hover:bg-white hover:text-ink"
                  >
                    {s.linkLabel}
                  </Link>
                )}
              </div>
            </div>
          );
        })}

        {/* scroll hint */}
        <div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-xs font-semibold uppercase tracking-widest text-slate-500 transition-opacity duration-300"
          style={{ opacity: progress > 0.95 ? 0 : 1 }}
        >
          Scroll
        </div>
      </div>
    </section>
  );
}
