import { useId, type CSSProperties } from "react";

/* Dependency-free SVG charts for the admin dashboard. All are pure
   functions of their props so they render on the server. */

/** useId output contains characters that aren't valid inside url(#…). */
const useSafeId = () => `g${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

/* ---------- Area / line chart ---------- */

export function AreaChart({
  points,
  labels,
  color = "#ef4444",
  height = 160,
}: {
  points: number[];
  labels: string[];
  color?: string;
  height?: number;
}) {
  const w = 600;
  const h = height;
  const padX = 8;
  const padTop = 14;
  const padBottom = 26;
  const max = Math.max(1, ...points);
  const n = points.length;
  const x = (i: number) => padX + (i / Math.max(1, n - 1)) * (w - padX * 2);
  const y = (v: number) => padTop + (1 - v / max) * (h - padTop - padBottom);

  // Catmull-Rom → cubic bezier for a smooth line
  const d = points
    .map((v, i) => {
      if (i === 0) return `M ${x(0)} ${y(v)}`;
      const p0 = points[i - 2] ?? points[i - 1];
      const p1 = points[i - 1];
      const p2 = v;
      const p3 = points[i + 1] ?? v;
      const c1x = x(i - 1) + (x(i) - x(i - 2 < 0 ? 0 : i - 2)) / 6;
      const c1y = y(p1) + (y(p2) - y(p0)) / 6;
      const c2x = x(i) - (x(i + 1 > n - 1 ? n - 1 : i + 1) - x(i - 1)) / 6;
      const c2y = y(p2) - (y(p3) - y(p1)) / 6;
      return `C ${c1x} ${c1y}, ${c2x} ${c2y}, ${x(i)} ${y(v)}`;
    })
    .join(" ");
  const area = `${d} L ${x(n - 1)} ${h - padBottom} L ${x(0)} ${h - padBottom} Z`;
  const gid = useSafeId();
  const last = points[n - 1] ?? 0;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-auto w-full overflow-visible" role="img">
      <defs>
        <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.45" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
        <filter id={`${gid}-glow`} x="-20%" y="-50%" width="140%" height="200%">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {[0.25, 0.5, 0.75].map((f) => (
        <line
          key={f}
          x1={padX}
          x2={w - padX}
          y1={y(max * f)}
          y2={y(max * f)}
          stroke="rgba(255,255,255,0.07)"
          strokeDasharray="3 6"
        />
      ))}
      <path d={area} fill={`url(#${gid})`} />
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        pathLength={1}
        filter={`url(#${gid}-glow)`}
        className="animate-draw"
      />
      {points.map((v, i) => (
        <circle key={i} cx={x(i)} cy={y(v)} r="2.5" fill="#0b1020" stroke={color} strokeWidth="1.5">
          <title>{`${labels[i]}: ${v}`}</title>
        </circle>
      ))}
      <circle cx={x(n - 1)} cy={y(last)} r="5" fill={color} className="animate-holo-ping" opacity="0.6" />
      <circle cx={x(n - 1)} cy={y(last)} r="4" fill={color} />
      {labels.map((l, i) =>
        i % Math.ceil(n / 6) === 0 || i === n - 1 ? (
          <text
            key={i}
            x={x(i)}
            y={h - 6}
            textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"}
            fontSize="11"
            fill="rgba(255,255,255,0.45)"
          >
            {l}
          </text>
        ) : null
      )}
    </svg>
  );
}

/* ---------- Donut ---------- */

export function Donut({
  segments,
  size = 168,
  thickness = 16,
  children,
}: {
  segments: { value: number; color: string; label: string }[];
  size?: number;
  thickness?: number;
  children?: React.ReactNode;
}) {
  const total = Math.max(1, segments.reduce((s, x) => s + x.value, 0));
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={thickness} />
        {segments.map((s, i) => {
          const len = (s.value / total) * c;
          const el = (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={thickness}
              strokeLinecap="butt"
              strokeDasharray={`${Math.max(0, len - 2)} ${c}`}
              strokeDashoffset={-offset}
              style={{ filter: `drop-shadow(0 0 6px ${s.color}88)` }}
            >
              <title>{`${s.label}: ${s.value}`}</title>
            </circle>
          );
          offset += len;
          return el;
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  );
}

/* ---------- Vertical bars ---------- */

export function Bars({
  values,
  labels,
  color = "#38bdf8",
  height = 120,
}: {
  values: number[];
  labels: string[];
  color?: string;
  height?: number;
}) {
  const max = Math.max(1, ...values);
  return (
    <div className="flex items-end gap-1.5" style={{ height }}>
      {values.map((v, i) => (
        <div key={i} className="group relative flex h-full flex-1 flex-col justify-end" title={`${labels[i]}: ${v}`}>
          <div
            className="animate-grow-y w-full rounded-t-md"
            style={
              {
                height: `${Math.max(4, (v / max) * 100)}%`,
                background: `linear-gradient(to top, ${color}33, ${color})`,
                boxShadow: `0 0 14px ${color}55`,
                "--delay": `${300 + i * 40}ms`,
              } as CSSProperties
            }
          />
          <span className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold text-white opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
            {v}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ---------- Radial gauge (0–100) ---------- */

export function Gauge({
  value,
  size = 150,
  color = "#10b981",
  label,
}: {
  value: number;
  size?: number;
  color?: string;
  label: string;
}) {
  const v = Math.max(0, Math.min(100, value));
  const thickness = 12;
  const r = (size - thickness) / 2;
  const c = Math.PI * r; // half circle
  const gid = useSafeId();
  return (
    <div className="relative shrink-0" style={{ width: size, height: size / 2 + 18 }}>
      <svg viewBox={`0 0 ${size} ${size / 2 + 4}`} className="h-auto w-full overflow-visible">
        <defs>
          <linearGradient id={gid} x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} />
          </linearGradient>
        </defs>
        <path
          d={`M ${thickness / 2} ${size / 2} A ${r} ${r} 0 0 1 ${size - thickness / 2} ${size / 2}`}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={thickness}
          strokeLinecap="round"
        />
        <path
          d={`M ${thickness / 2} ${size / 2} A ${r} ${r} 0 0 1 ${size - thickness / 2} ${size / 2}`}
          fill="none"
          stroke={`url(#${gid})`}
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={`${(v / 100) * c} ${c}`}
          style={{ filter: `drop-shadow(0 0 8px ${color}99)` }}
        />
      </svg>
      <div className="absolute inset-x-0 bottom-0 text-center">
        <p className="text-3xl font-extrabold leading-none text-white">{Math.round(v)}%</p>
        <p className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-white/50">{label}</p>
      </div>
    </div>
  );
}

/* ---------- Horizontal ranked bars ---------- */

export function RankBars({
  rows,
  color = "#a78bfa",
}: {
  rows: { label: string; value: number; sub?: string }[];
  color?: string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="space-y-3">
      {rows.map((r, i) => (
        <li key={r.label}>
          <div className="flex items-baseline justify-between gap-3 text-xs">
            <span className="truncate font-semibold capitalize text-white/85">{r.label}</span>
            <span className="shrink-0 tabular-nums text-white/60">
              {r.value}
              {r.sub ? <span className="ml-1.5 text-white/35">{r.sub}</span> : null}
            </span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
            <div
              className="h-full rounded-full"
              style={{
                width: `${(r.value / max) * 100}%`,
                background: `linear-gradient(90deg, ${color}66, ${color})`,
                boxShadow: `0 0 10px ${color}66`,
                transition: `width 1.2s cubic-bezier(0.22,1,0.36,1) ${200 + i * 80}ms`,
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
