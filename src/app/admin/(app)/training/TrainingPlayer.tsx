"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { SCENE_H, STAGE_W, stepDur, type Lesson } from "./data";

const SPEED = 40; // caption characters per second
const glass = "glass rounded-2xl";

type Rect = { x: number; y: number; w: number; h: number };

export default function TrainingPlayer({ lesson }: { lesson: Lesson }) {
  const { steps } = lesson;
  const Scene = lesson.scene;

  const bounds = useMemo(
    () =>
      steps.reduce<number[]>((a, s) => {
        a.push((a[a.length - 1] ?? 0) + stepDur(s));
        return a;
      }, []),
    [steps]
  );
  const total = bounds[bounds.length - 1] ?? 0;

  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [hot, setHot] = useState<Rect | null>(null);
  const [viewW, setViewW] = useState<number | null>(null);

  const wrapRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const last = useRef<number | null>(null);

  let idx = 0;
  while (idx < steps.length - 1 && t >= bounds[idx]) idx++;
  const start = idx === 0 ? 0 : bounds[idx - 1];
  const dur = bounds[idx] - start;
  const step = steps[idx];
  const tIn = Math.min(Math.max(t - start, 0), dur);
  const clickAt = Math.min(dur * 0.62, Math.max(0, dur - 1600));
  const variant = tIn >= clickAt ? step.set ?? null : null;
  const chars = Math.min(step.caption.length, Math.floor((tIn / 1000) * SPEED));

  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    const tick = (now: number) => {
      if (last.current == null) last.current = now;
      setT((prev) => Math.min(total, prev + now - last.current!));
      last.current = now;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      last.current = null;
    };
  }, [playing, total]);

  useEffect(() => {
    if (playing && t >= total) setPlaying(false);
  }, [t, playing, total]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && ["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName)) return;
      if (e.key === " ") { e.preventDefault(); setPlaying((p) => !p); }
      if (e.key === "ArrowRight") setT(Math.min(total, bounds[idx]));
      if (e.key === "ArrowLeft") setT(idx === 0 ? 0 : bounds[idx - 1]);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [idx, bounds, total]);

  useLayoutEffect(() => {
    const view = viewRef.current;
    const scene = sceneRef.current;
    if (!view || !scene) return;
    setViewW(view.clientWidth);
    const el = step.spot ? scene.querySelector<HTMLElement>(`[data-spot="${step.spot}"]`) : null;
    if (!el) { setHot(null); return; }
    // Measure in scene-local coordinates — the scene's own translateY cancels
    // out of the subtraction, so the rect is stable while the scroll animates.
    const sr = scene.getBoundingClientRect();
    const er = el.getBoundingClientRect();
    const s = sr.width / STAGE_W;
    setHot({
      x: (er.left - sr.left) / s,
      y: (er.top - sr.top) / s,
      w: er.width / s,
      h: er.height / s,
    });
  }, [idx, variant, step.spot]);

  const seek = (v: number) => {
    setT(Math.min(Math.max(v, 0), total));
    if (v >= total) setPlaying(false);
    else if (!playing) setPlaying(true);
  };

  const ready = viewW != null;
  const scale = ready ? viewW / STAGE_W : 0;
  const pad = 10;
  const ty = hot && step.scroll
    ? Math.min(0, Math.max(SCENE_H - 1700, -(hot.y + hot.h / 2 - SCENE_H * 0.42)))
    : 0;
  // Frame coordinates — scene-local rect plus the applied scroll offset.
  const sx = hot ? hot.x - pad : 0;
  const sy = hot ? hot.y + ty - pad : 0;
  const sw = hot ? hot.w + pad * 2 : 0;
  const sh = hot ? hot.h + pad * 2 : 0;
  const cx = sx + sw / 2;
  const cy = sy + sh / 2;
  const clip = ready
    ? hot
      ? `polygon(0% 0%,100% 0%,100% 100%,0% 100%,0% ${sy}px,${sx}px ${sy}px,${sx}px ${sy + sh}px,${sx + sw}px ${sy + sh}px,${sx + sw}px ${sy}px,0% ${sy}px)`
      : "polygon(0% 0%,100% 0%,100% 100%,0% 100%)"
    : undefined;
  const ripple = step.click && tIn >= clickAt && tIn < clickAt + 800;

  const btn = "flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-white/70 transition-colors hover:border-white/40 hover:text-white";

  return (
    <div className={`${glass} overflow-hidden`}>
      {/* title bar */}
      <div className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-2 w-2 shrink-0 items-center justify-center">
            <span className={`h-2 w-2 rounded-full ${playing ? "animate-pulse bg-red-400" : "bg-white/30"}`} />
          </span>
          <p className="truncate text-sm font-bold text-white">{lesson.title}</p>
          <span className="shrink-0 text-[10px] uppercase tracking-widest text-white/35">
            Guided walkthrough · {Math.ceil(total / 1000)}s
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link href="/admin/training" className="rounded-full border border-white/15 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-white/60 hover:border-white/40 hover:text-white">
            ← All lessons
          </Link>
          <Link href={lesson.liveHref} className="rounded-full bg-gradient-to-r from-brand to-brand-light px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-white shadow-lg shadow-brand/30">
            Open live →
          </Link>
        </div>
      </div>

      {/* stage */}
      <div ref={wrapRef} className="relative">
        <div ref={viewRef} style={{ aspectRatio: `${STAGE_W} / 640` }} className="relative overflow-hidden bg-[#070b16]">
          <div
            style={{ transform: `scale(${scale})`, transformOrigin: "0 0", width: STAGE_W, height: SCENE_H, position: "absolute", left: 0, top: 0 }}
          >
            <div className="h-full w-full overflow-hidden">
              <div ref={sceneRef} style={{ transform: `translateY(${ty}px)`, transition: "transform 900ms cubic-bezier(.22,.8,.3,1)" }}>
                <Scene variant={variant} />
              </div>
            </div>

            {ready && clip && (
              <>
                <div className="pointer-events-none absolute inset-0 z-20" style={{ clipPath: clip, background: "rgba(3,6,15,0.78)", transition: "clip-path 600ms ease" }} />
                {hot && (
                  <div
                    className="pointer-events-none absolute z-30 animate-pulse rounded-xl border-2 border-brand-light/90 shadow-[0_0_24px_-2px_rgba(248,113,113,0.8),inset_0_0_24px_-10px_rgba(248,113,113,0.8)]"
                    style={{ left: sx, top: sy, width: sw, height: sh, transition: "all 600ms ease" }}
                  />
                )}
              </>
            )}

            {ready && hot && (
              <svg
                viewBox="0 0 24 24"
                className="pointer-events-none absolute z-40 h-6 w-6"
                style={{
                  left: cx - 2,
                  top: cy - 2,
                  fill: "#fff",
                  filter: "drop-shadow(0 2px 6px rgba(0,0,0,.85))",
                  transition: "left 950ms cubic-bezier(.22,.8,.3,1), top 950ms cubic-bezier(.22,.8,.3,1)",
                }}
              >
                <path d="M4 2l16 11.2-9.2 1.2L7.6 22 4 2z" />
              </svg>
            )}
            {ready && hot && ripple && (
              <span
                className="pointer-events-none absolute z-30 h-16 w-16 animate-ping rounded-full border-2 border-white/80"
                style={{ left: cx - 32, top: cy - 32, animationIterationCount: 2 }}
              />
            )}

            {/* caption */}
            {ready && (
              <div className="absolute inset-x-0 bottom-0 z-40 flex justify-center pb-3">
                <div className="glass mx-4 w-full max-w-3xl rounded-2xl px-5 py-3">
                  <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-brand-light">
                    {idx + 1}/{steps.length} · {step.chapter}
                  </p>
                  <p className="mt-1 min-h-[2.4rem] text-[13px] leading-snug text-white/90">
                    {step.caption.slice(0, chars)}
                    <span className="ml-0.5 inline-block h-3.5 w-[2px] translate-y-[2px] animate-pulse bg-white/70" />
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* segmented progress */}
        <div className="flex h-1.5 bg-white/5">
          {steps.map((s, i) => {
            const w = ((bounds[i] - (i === 0 ? 0 : bounds[i - 1])) / total) * 100;
            const fill = i < idx ? 100 : i > idx ? 0 : (tIn / dur) * 100;
            return (
              <div key={i} className="relative h-full" style={{ width: `${w}%` }}>
                <div className="h-full bg-gradient-to-r from-brand to-brand-light" style={{ width: `${fill}%`, transition: "width 200ms linear" }} />
                {i > 0 && <div className="absolute left-0 top-0 h-full w-px bg-[#070b16]" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* controls */}
      <div className="flex items-center gap-4 border-t border-white/10 px-5 py-3">
        <div className="flex items-center gap-2">
          <button type="button" aria-label="Restart" onClick={() => { setT(0); setPlaying(true); }} className={btn}>
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M12 5V1L7 6l5 5V7a6 6 0 1 1-6 6H4a8 8 0 1 0 8-8z" /></svg>
          </button>
          <button type="button" aria-label="Previous chapter" onClick={() => seek(idx === 0 ? 0 : bounds[idx - 1])} className={btn}>
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M6 6h2v12H6V6zm12 0v12l-8.5-6L18 6z" /></svg>
          </button>
          <button
            type="button"
            aria-label={playing ? "Pause" : "Play"}
            onClick={() => (t >= total ? (setT(0), setPlaying(true)) : setPlaying((p) => !p))}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-brand to-brand-light text-white shadow-lg shadow-brand/40"
          >
            {playing ? (
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M6 5h4v14H6V5zm8 0h4v14h-4V5z" /></svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="currentColor" className="ml-0.5 h-4 w-4"><path d="M8 5v14l11-7L8 5z" /></svg>
            )}
          </button>
          <button type="button" aria-label="Next chapter" onClick={() => seek(bounds[idx])} className={btn}>
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M16 6h2v12h-2V6zM6 18l8.5-6L6 6v12z" /></svg>
          </button>
        </div>

        <div
          className="relative h-5 flex-1 cursor-pointer"
          onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            seek(((e.clientX - r.left) / r.width) * total);
          }}
        >
          <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-gradient-to-r from-brand to-brand-light" style={{ width: `${(t / total) * 100}%` }} />
          </div>
          {bounds.slice(0, -1).map((b, i) => (
            <div key={i} className="absolute top-1/2 h-2 w-px -translate-y-1/2 bg-white/25" style={{ left: `${(b / total) * 100}%` }} />
          ))}
        </div>

        <p className="hidden shrink-0 text-[11px] tabular-nums text-white/45 sm:block">
          {Math.floor(t / 1000)}s / {Math.floor(total / 1000)}s
        </p>
        <div className="hidden shrink-0 items-center gap-1.5 xl:flex">
          {steps.map((s, i) => (
            <button
              key={i}
              type="button"
              title={s.chapter}
              onClick={() => seek(i === 0 ? 0 : bounds[i - 1] + 1)}
              className={`h-1.5 rounded-full transition-all ${i === idx ? "w-5 bg-brand-light" : "w-1.5 bg-white/20 hover:bg-white/40"}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
