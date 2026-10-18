"use client";

import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
  type ReactNode,
} from "react";

/* ------------------------------------------------------------------ */
/*  Scene: aurora blobs + grid floor that parallax against the pointer  */
/* ------------------------------------------------------------------ */

export function HoloBackdrop() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fine = window.matchMedia("(pointer: fine)").matches;
    if (!fine) return;
    let raf = 0;
    const onMove = (e: MouseEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const x = e.clientX / window.innerWidth - 0.5;
        const y = e.clientY / window.innerHeight - 0.5;
        el.style.setProperty("--px", `${x * 40}px`);
        el.style.setProperty("--py", `${y * 40}px`);
      });
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ "--px": "0px", "--py": "0px" } as CSSProperties}
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#111a33_0%,_#070b16_55%,_#04060d_100%)]" />
      <div
        className="absolute inset-0 transition-transform duration-700 ease-out"
        style={{ transform: "translate3d(var(--px), var(--py), 0)" }}
      >
        <div className="animate-holo-drift absolute -left-40 -top-40 h-[34rem] w-[34rem] rounded-full bg-brand/25 blur-[120px]" />
        <div
          className="animate-holo-drift absolute right-[-10%] top-1/4 h-[30rem] w-[30rem] rounded-full bg-violet-600/20 blur-[130px]"
          style={{ animationDelay: "-6s" }}
        />
        <div
          className="animate-holo-drift absolute bottom-[-20%] left-1/3 h-[28rem] w-[28rem] rounded-full bg-sky-500/15 blur-[130px]"
          style={{ animationDelay: "-12s" }}
        />
      </div>
      <div
        className="absolute inset-x-[-30%] bottom-0 h-[70vh] transition-transform duration-700 ease-out"
        style={{
          transform: "translate3d(calc(var(--px) * -0.5), calc(var(--py) * -0.3), 0)",
        }}
      >
        <div className="holo-grid absolute inset-0" />
      </div>
      <div className="animate-holo-scan absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_40%,_rgba(4,6,13,0.6)_100%)]" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  HoloCard: frosted pane that tilts toward the cursor with a glare     */
/* ------------------------------------------------------------------ */

type HoloCardProps = {
  children: ReactNode;
  className?: string;
  href?: string;
  /** Entrance stagger in ms. */
  delay?: number;
  /** Max tilt in degrees. */
  tilt?: number;
  /** translateZ lift on hover in px. */
  lift?: number;
};

export function HoloCard({
  children,
  className = "",
  href,
  delay = 0,
  tilt = 7,
  lift = 24,
}: HoloCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [tracking, setTracking] = useState(false);

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || e.pointerType !== "mouse") return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    el.style.setProperty("--mx", `${x * 100}%`);
    el.style.setProperty("--my", `${y * 100}%`);
    el.style.setProperty("--ry", `${(x - 0.5) * tilt * 2}deg`);
    el.style.setProperty("--rx", `${(0.5 - y) * tilt * 2}deg`);
    el.style.setProperty("--tz", `${lift}px`);
    if (!tracking) setTracking(true);
  };

  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
    el.style.setProperty("--tz", "0px");
    setTracking(false);
  };

  const inner = href ? (
    <Link href={href} className="block h-full [transform-style:preserve-3d] focus:outline-none">
      {children}
    </Link>
  ) : (
    children
  );

  return (
    <div
      className={`animate-holo-in ${className}`}
      style={{ "--delay": `${delay}ms` } as CSSProperties}
    >
      <div
        ref={ref}
        className={`glass holo-card rounded-3xl ${tracking ? "is-tracking" : ""}`}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
      >
        {inner}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  CountUp: numbers roll up when they first appear                     */
/* ------------------------------------------------------------------ */

export function CountUp({
  value,
  prefix = "",
  suffix = "",
  duration = 1400,
  className = "",
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
}) {
  const [n, setN] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setN(value);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 4);
      setN(Math.round(value * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return (
    <span className={`tabular-nums ${className}`}>
      {prefix}
      {n.toLocaleString("en-GB")}
      {suffix}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Clock: live local time for the command-deck header                  */
/* ------------------------------------------------------------------ */

export function LiveClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  if (!now) return <span className="inline-block w-[5ch]" />;
  return (
    <span className="tabular-nums">
      {now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
    </span>
  );
}
