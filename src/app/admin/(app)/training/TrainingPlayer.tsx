"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { SCENE_H, STAGE_W, stepDur, type Lesson } from "./data";

const SPEED = 42; // caption characters per second
const glass = "glass rounded-2xl";

type Rect = { x: number; y: number; w: number; h: number };

export default function TrainingPlayer({
  lesson,
  next,
}: {
  lesson: Lesson;
  next?: { href: string; title: string };
}) {
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

  const viewRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const sceneH = useRef(SCENE_H);
  const last = useRef<number | null>(null);

  let idx = 0;
  while (idx < steps.length - 1 && t >= bounds[idx]) idx++;
  const start = idx === 0 ? 0 : bounds[idx - 1];
  const dur = bounds[idx] - start;
  const step = steps[idx];
  const tIn = Math.min(Math.max(t - start, 0), dur);
  const clickAt = Math.min(dur * 0.62, Math.max(0, dur - 1600));
  const sets = step.sets ?? (step.set ? [{ at: 0.62, v: step.set }] : []);
  const frac = tIn / dur;
  const variant = sets.reduce<string | null>((v, s) => (frac >= s.at ? s.v : v), null);
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
    // Measure in scene-local coordinates — zoom/camera/outer-scale all cancel
    // out of the subtraction, so the rect is stable while the camera moves.
    const sr = scene.getBoundingClientRect();
    const s = sr.width / STAGE_W;
    sceneH.current = sr.height / s;
    if (!el) { setHot(null); return; }
    const er = el.getBoundingClientRect();
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

  /* ---------------- cinematic camera ---------------- */
  // Zoom in on the hotspot (clamped), or hold the wide shot when a step has none.
  const pad = 14;
  const camScale = hot
    ? Math.min(
        1.75,
        Math.max(1.12, Math.min((STAGE_W * 0.5) / hot.w, (SCENE_H * 0.78) / hot.h))
      )
    : 1;
  const cxL = hot ? hot.x + hot.w / 2 : STAGE_W / 2;
  const cyL = hot ? hot.y + hot.h / 2 : SCENE_H / 2;
  const camX = Math.min(
    Math.max(cxL - STAGE_W / (2 * camScale), -100),
    STAGE_W - STAGE_W / camScale + 100
  );
  const camY = Math.min(
    Math.max(cyL - SCENE_H / (2 * camScale), -(sceneH.current - SCENE_H / camScale)),
    70
  );

  // Spotlight rect in scene-local coordinates (camera layer draws it).
  const hx = hot ? hot.x - pad : 0;
  const hy = hot ? hot.y - pad : 0;
  const hw = hot ? hot.w + pad * 2 : 0;
  const hh = hot ? hot.h + pad * 2 : 0;
  // The dim layer is oversized (inset -OV) so camera pans never reveal an
  // edge — clip coordinates are relative to its own box, so add OV.
  const OV = 3000;
  const clip = ready
    ? hot
      ? `polygon(0% 0%,100% 0%,100% 100%,0% 100%,0% ${hy + OV}px,${hx + OV}px ${hy + OV}px,${hx + OV}px ${hy + hh + OV}px,${hx + hw + OV}px ${hy + hh + OV}px,${hx + hw + OV}px ${hy + OV}px,0% ${hy + OV}px)`
      : "polygon(0% 0%,100% 0%,100% 100%,0% 100%)"
    : undefined;
  const ripple = step.click && tIn >= clickAt && tIn < clickAt + 800;
  const pressing = ripple;
  const clickCue = step.click && tIn >= clickAt - 1200 && tIn < clickAt + 300;
  const typeChars = step.type
    ? Math.min(step.type.length, Math.max(0, Math.floor((tIn - 900) / 55)))
    : 0;
  const typing =
    step.type && step.spot && !variant
      ? { spot: step.spot, text: step.type, chars: typeChars }
      : null;

  const btn = "flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-white/70 transition-colors hover:border-white/40 hover:text-white";

  return (
    <div className={`${glass} overflow-hidden`}>
      {/* title bar */}
      <div className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className={`h-2 w-2 shrink-0 rounded-full ${playing ? "animate-pulse bg-red-400" : "bg-white/30"}`} />
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
      <div ref={viewRef} style={{ aspectRatio: `${STAGE_W} / 640` }} className="relative overflow-hidden bg-[#070b16]">
        <div style={{ transform: `scale(${scale})`, transformOrigin: "0 0", width: STAGE_W, height: SCENE_H, position: "absolute", left: 0, top: 0, overflow: "hidden" }}>
          {/* camera layer — pans + zooms to the action */}
          <div
            style={{
              transform: `scale(${camScale}) translate(${-camX}px, ${-camY}px)`,
              transformOrigin: "0 0",
              transition: "transform 1.1s cubic-bezier(.3,.7,.25,1)",
              width: STAGE_W,
              height: SCENE_H,
            }}
          >
            <div
              ref={sceneRef}
              // zoom scales layout itself, so everything renders ~20% larger —
              // the wrapper is narrowed to compensate and still fills the stage.
              style={{ zoom: 1.2, width: STAGE_W / 1.2 }}
            >
              <Scene variant={variant} typing={typing} />
            </div>

            {ready && clip && (
              <>
                <div
                  className="pointer-events-none absolute z-20"
                  style={{ inset: -OV, clipPath: clip, background: "rgba(3,6,15,0.45)", transition: "clip-path 1.1s cubic-bezier(.3,.7,.25,1)" }}
                />
                {hot && (
                  <>
                    <div
                      className="pointer-events-none absolute z-30 animate-pulse rounded-xl border border-brand-light/50 shadow-[0_0_28px_-2px_rgba(248,113,113,0.85),inset_0_0_28px_-10px_rgba(248,113,113,0.85)]"
                      style={{ left: hx, top: hy, width: hw, height: hh, transition: "all 1.1s cubic-bezier(.3,.7,.25,1)" }}
                    />
                    {/* ring that draws itself around the target on each step */}
                    <svg
                      key={`ring-${idx}`}
                      className="pointer-events-none absolute z-30 overflow-visible"
                      style={{ left: hx - 4, top: hy - 4, width: hw + 8, height: hh + 8 }}
                      viewBox={`0 0 ${hw + 8} ${hh + 8}`}
                    >
                      <rect
                        x="2" y="2" width={hw + 4} height={hh + 4} rx="12"
                        fill="none" stroke="#fca5a5" strokeWidth="2.5"
                        pathLength={1} className="animate-ring-draw"
                      />
                    </svg>
                    {/* beacon pulses on click targets */}
                    {step.click && tIn < clickAt + 400 && [0, 0.9].map((d) => (
                      <span
                        key={d}
                        className="pointer-events-none absolute z-20 animate-holo-ping rounded-full border-2 border-white/50"
                        style={{ left: cxL - 40, top: cyL - 40, width: 80, height: 80, animationDelay: `${d}s` }}
                      />
                    ))}
                  </>
                )}
              </>
            )}

            {ready && hot && (
              <div
                className="pointer-events-none absolute z-40"
                style={{
                  left: cxL - 2,
                  top: cyL - 2,
                  transition: "left 1s cubic-bezier(.3,.7,.25,1), top 1s cubic-bezier(.3,.7,.25,1)",
                }}
              >
                {/* "Click" cue chip just before the press lands */}
                {clickCue && (
                  <span className="absolute left-5 top-5 rounded-md bg-white px-2 py-0.5 text-[11px] font-bold text-slate-900 shadow-lg">
                    Click
                  </span>
                )}
                <div className="animate-cursor-idle">
                  <svg
                    viewBox="0 0 24 24"
                    className={`h-7 w-7 transition-transform duration-150 ${pressing ? "scale-[0.6]" : ""}`}
                    style={{ fill: "#fff", filter: "drop-shadow(0 2px 6px rgba(0,0,0,.9))" }}
                  >
                    <path d="M4 2l16 11.2-9.2 1.2L7.6 22 4 2z" />
                  </svg>
                </div>
              </div>
            )}
            {ready && hot && ripple && (
              <span
                className="pointer-events-none absolute z-30 h-16 w-16 animate-ping rounded-full border-2 border-white/80"
                style={{ left: cxL - 32, top: cyL - 32, animationIterationCount: 2 }}
              />
            )}
          </div>

          {/* light sweep between chapters */}
          {ready && (
            <div key={`sweep-${idx}`} className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
              <div className="animate-sweep-x absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
            </div>
          )}

        </div>

        {/* end card */}
        {ready && t >= total && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-[#070b16]/85 backdrop-blur-sm">
            <div className="glass max-w-md rounded-3xl p-8 text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300 ring-1 ring-emerald-400/40">
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6"><path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>
              </span>
              <p className="mt-4 text-lg font-bold text-white">Lesson complete</p>
              <p className="mt-1 text-sm text-white/60">
                Now try it for real — the walkthrough matches the live section
                click-for-click.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2.5">
                <button
                  type="button"
                  onClick={() => { setT(0); setPlaying(true); }}
                  className="rounded-full border border-white/20 px-4 py-2 text-[11px] font-semibold uppercase tracking-widest text-white/70 hover:border-white/50 hover:text-white"
                >
                  ↺ Watch again
                </button>
                <Link
                  href={lesson.liveHref}
                  className="rounded-full bg-gradient-to-r from-brand to-brand-light px-4 py-2 text-[11px] font-semibold uppercase tracking-widest text-white shadow-lg shadow-brand/30"
                >
                  Open live →
                </Link>
                {next && (
                  <Link
                    href={next.href}
                    className="rounded-full border border-white/20 px-4 py-2 text-[11px] font-semibold uppercase tracking-widest text-white/70 hover:border-white/50 hover:text-white"
                  >
                    Next: {next.title} →
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}

        {/* segmented progress */}
        <div className="absolute bottom-0 left-0 right-0 z-50 flex h-1.5 bg-white/5">
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

      {/* subtitle strip — below the stage, so it can never cover the demo */}
      <div className="border-t border-white/10 bg-black/60 px-6 py-4">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-brand-light">
          {idx + 1} / {steps.length} · {step.chapter}
        </p>
        <p className="mt-1.5 min-h-[3.4rem] text-xl font-medium leading-snug text-white">
          {t >= total
            ? "Lesson complete — watch again, open the live section, or move on to the next lesson."
            : step.caption.slice(0, chars)}
          {t < total && <span className="ml-1 inline-block h-4 w-[2.5px] translate-y-[3px] animate-pulse bg-white/80" />}
        </p>
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
