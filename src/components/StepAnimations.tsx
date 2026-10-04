/**
 * Looping illustrations for the "How It Works" scroll story. Pure CSS
 * keyframes (see `sa-*` in globals.css). Base styles show the finished
 * state so reduced-motion users still get a meaningful still frame.
 */

/*
 * Step 1 mirrors the real ContactForm. Each line is typed between `from`
 * and `to` (% of the loop); `endX` is where the typed text ends, so the pen
 * tracks the writing. Keyframes are generated from this table.
 */
type FormLine = { text: string; from: number; to: number; endX: number };
type FormField = {
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  lines: FormLine[];
};

const FORM_LOOP = 12;
const FORM_RESET = 96;
const PAD = 14;
const LINE_H = 16;

const formFields: FormField[] = [
  { label: "First Name", x: 20, y: 78, w: 174, h: 34, lines: [{ text: "Brian", from: 4, to: 9, endX: 66 }] },
  { label: "Last Name", x: 206, y: 78, w: 174, h: 34, lines: [{ text: "Shimmin", from: 11, to: 17, endX: 258 }] },
  { label: "Email", x: 20, y: 122, w: 174, h: 34, lines: [{ text: "brian.shimmin@gmail.com", from: 19, to: 31, endX: 172 }] },
  { label: "Phone No.", x: 206, y: 122, w: 174, h: 34, lines: [{ text: "07700 900123", from: 33, to: 40, endX: 297 }] },
  { label: "Subject", x: 20, y: 166, w: 360, h: 34, lines: [{ text: "Umbrella company comparison", from: 42, to: 53, endX: 207 }] },
  {
    label: "Message",
    x: 20,
    y: 210,
    w: 360,
    h: 80,
    lines: [
      { text: "Hi, I'm an IT contractor on £450/day.", from: 55, to: 66, endX: 235 },
      { text: "Which umbrella would suit me best?", from: 67, to: 78, endX: 236 },
    ],
  },
];

const isMultiline = (f: FormField) => f.lines.length > 1;
/** Vertical centre of a line of typed text, in card coordinates. */
const lineCenterY = (f: FormField, li: number) =>
  isMultiline(f) ? f.y + 10 + LINE_H / 2 + li * LINE_H : f.y + f.h / 2;

function formCss() {
  const loop = `${FORM_LOOP}s linear infinite`;
  let css = `.saf-body{animation:saf-body ${loop}}@keyframes saf-body{0%,93%{opacity:1}96%,99%{opacity:0}100%{opacity:1}}`;
  const penStops: string[] = [`0%{transform:translate(380px,10px);opacity:0}`];

  formFields.forEach((f, fi) => {
    const start = f.lines[0].from;
    const end = f.lines[f.lines.length - 1].to;
    css += `.saf-focus-${fi}{animation:saf-focus-${fi} ${loop}}@keyframes saf-focus-${fi}{0%,${start - 1}%,${end + 1}%,100%{border-color:#e2e8f0;background-color:#f8fafc}${start}%,${end}%{border-color:#dc2626;background-color:#fff}}`;
    css += `.saf-ph-${fi}{animation:saf-ph-${fi} ${loop}}@keyframes saf-ph-${fi}{0%,${start}%{opacity:1}${start + 0.5}%,${FORM_RESET}%{opacity:0}${FORM_RESET + 1}%,100%{opacity:1}}`;
    f.lines.forEach((l, li) => {
      css += `.saf-type-${fi}-${li}{animation:saf-type-${fi}-${li} ${loop}}@keyframes saf-type-${fi}-${li}{0%,${l.from}%{clip-path:inset(0 100% 0 0)}${l.to}%,${FORM_RESET}%{clip-path:inset(0 0 0 0)}${FORM_RESET + 1}%,100%{clip-path:inset(0 100% 0 0)}}`;
      const ty = lineCenterY(f, li) + 5 - 40;
      penStops.push(
        `${l.from}%{transform:translate(${f.x + PAD}px,${ty}px);opacity:1}`,
        `${l.to}%{transform:translate(${l.endX}px,${ty}px)}`
      );
    });
  });

  penStops.push(
    `81%,84%{transform:translate(90px,282px);opacity:1}`,
    `90%,100%{transform:translate(380px,340px);opacity:0}`
  );
  css += `.saf-pen{animation:saf-pen ${loop}}@keyframes saf-pen{${penStops.join("")}}`;
  css += `.saf-btn{animation:saf-btn ${loop}}@keyframes saf-btn{0%,81%,84%,100%{transform:scale(1)}82.5%{transform:scale(0.93)}}`;
  css += `.saf-sent{animation:saf-sent ${loop}}@keyframes saf-sent{0%,83%{opacity:0;transform:translateX(-6px)}85%,${FORM_RESET}%{opacity:1;transform:none}${FORM_RESET + 1}%,100%{opacity:0}}`;
  return css;
}

const FORM_CSS = formCss();

export function FormAnim() {
  return (
    <div className="sa-anim relative h-[356px] w-[400px] rounded-3xl bg-slate-50 text-ink shadow-2xl shadow-black/40">
      <style>{FORM_CSS}</style>
      <div className="saf-body absolute inset-0">
        <p className="absolute left-5 top-[18px] text-lg font-bold">
          Send Us a Message
        </p>
        <p className="absolute left-5 top-[48px] text-[10px] text-slate-500">
          Fill in the form below and one of our experts will be in touch.
        </p>

        {formFields.map((f, fi) => (
          <div
            key={f.label}
            className={`saf-focus-${fi} absolute rounded-2xl border border-slate-200 bg-slate-50`}
            style={{ left: f.x, top: f.y, width: f.w, height: f.h }}
          >
            <span
              className={`saf-ph-${fi} absolute text-[11px] text-slate-400 opacity-0`}
              style={{ left: PAD, top: isMultiline(f) ? 10 : "50%", transform: isMultiline(f) ? undefined : "translateY(-50%)" }}
            >
              {f.label}
            </span>
            {f.lines.map((l, li) => (
              <span
                key={li}
                className={`saf-type-${fi}-${li} absolute whitespace-nowrap text-[11px] leading-4`}
                style={{ left: PAD, top: lineCenterY(f, li) - f.y - LINE_H / 2 }}
              >
                {l.text}
              </span>
            ))}
          </div>
        ))}

        <div className="saf-btn absolute left-5 top-[304px] flex h-9 w-[140px] items-center justify-center rounded-full bg-brand text-[11px] font-semibold uppercase tracking-wide text-white">
          Send Message
        </div>
        <p className="saf-sent absolute left-[172px] top-[306px] max-w-[200px] text-[10px] leading-snug text-green-600 opacity-0">
          ✓ Thanks for getting in touch — one of our experts will be in contact
          shortly.
        </p>
      </div>

      {/* pen — tip sits at the svg's bottom-left corner */}
      <div className="saf-pen pointer-events-none absolute left-0 top-0 h-10 w-10 opacity-0">
        <svg viewBox="0 0 40 40" className="sa-wiggle h-10 w-10 drop-shadow-lg">
          <path
            d="M2 38 6 27 29 4c2-2 5-2 7 0s2 5 0 7L13 34Z"
            fill="#111827"
          />
          <path d="M2 38 6 27l7 7Z" fill="#f59e0b" />
          <path d="m25 8 7 7" stroke="#dc2626" strokeWidth="3" />
        </svg>
      </div>
    </div>
  );
}

function PhoneIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1Z" />
    </svg>
  );
}

const waveBars = [0.5, 0.8, 0.4, 1, 0.7, 0.9, 0.45, 0.75, 0.55];

export function CallAnim() {
  return (
    <div className="sa-anim relative h-[372px] w-[380px]">
      <div className="sa-shake absolute left-1/2 top-2 -ml-[95px] h-[356px] w-[190px] overflow-hidden rounded-[34px] border-[6px] border-slate-700 bg-gradient-to-b from-slate-800 to-ink shadow-2xl shadow-black/50">
        <div className="absolute left-1/2 top-2 -ml-8 h-1.5 w-16 rounded-full bg-slate-600" />

        {/* ringing */}
        <div className="sa-ring-layer absolute inset-0 flex flex-col items-center pt-14 text-white">
          <div className="relative h-20 w-20">
            <span className="sa-ripple absolute inset-0 rounded-full border-2 border-brand-light" />
            <span className="sa-ripple absolute inset-0 rounded-full border-2 border-brand-light [animation-delay:0.8s]" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-brand to-orange-400 text-lg font-extrabold">
              TCB
            </div>
          </div>
          <p className="mt-6 text-[10px] uppercase tracking-widest text-slate-400">
            Incoming call
          </p>
          <p className="mt-1 font-semibold">TCB Expert</p>
          <p className="text-xs text-slate-400">Umbrella specialist</p>
          <div className="absolute bottom-8 flex gap-12">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-red-500">
              <PhoneIcon className="h-5 w-5 rotate-[135deg]" />
            </span>
            <span className="sa-pulse flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500">
              <PhoneIcon className="h-5 w-5" />
            </span>
          </div>
        </div>

        {/* connected */}
        <div className="sa-connected-layer absolute inset-0 flex flex-col items-center pt-12 text-white">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-brand to-orange-400 font-extrabold">
            TCB
          </div>
          <p className="mt-3 font-semibold">TCB Expert</p>
          <p className="text-xs text-emerald-400">● Connected</p>
          <div className="mt-10 flex h-14 items-center gap-1.5">
            {waveBars.map((h, i) => (
              <span
                key={i}
                className="sa-wave w-1.5 rounded-full bg-gradient-to-t from-brand to-orange-300"
                style={{ height: `${h * 100}%`, animationDelay: `${i * 0.11}s` }}
              />
            ))}
          </div>
          <span className="absolute bottom-8 flex h-11 w-11 items-center justify-center rounded-full bg-red-500">
            <PhoneIcon className="h-5 w-5 rotate-[135deg]" />
          </span>
        </div>
      </div>

      {/* conversation */}
      <p className="sa-bubble-1 absolute left-0 top-[70px] z-10 max-w-[150px] rounded-2xl rounded-bl-sm bg-white px-3 py-2 text-[11px] leading-snug text-ink shadow-xl">
        Hi Brian — let&apos;s find your perfect umbrella.
      </p>
      <p className="sa-bubble-2 absolute right-0 top-[150px] z-10 max-w-[150px] rounded-2xl rounded-br-sm bg-brand px-3 py-2 text-[11px] leading-snug text-white shadow-xl">
        Great! I&apos;m a day-rate contractor.
      </p>
      <p className="sa-bubble-3 absolute left-0 top-[236px] z-10 max-w-[150px] rounded-2xl rounded-bl-sm bg-white px-3 py-2 text-[11px] leading-snug text-ink shadow-xl">
        I&apos;ve found 3 compliant matches for you ✓
      </p>
    </div>
  );
}

const bars = [35, 50, 42, 65, 80, 100];
const benefits = [
  { title: "Same-day payment received", sub: "Paid to your account" },
  { title: "IR35 compliant", sub: "Fully HMRC approved" },
  { title: "Pension & holiday pay", sub: "Statutory benefits sorted" },
];
const coins = [
  { left: "12%", delay: "0s" },
  { left: "38%", delay: "0.9s" },
  { left: "64%", delay: "1.7s" },
  { left: "86%", delay: "2.4s" },
];

export function BenefitsAnim() {
  return (
    <div className="sa-anim relative h-[372px] w-[380px] overflow-hidden rounded-3xl bg-white p-6 text-ink shadow-2xl shadow-black/40">
      {coins.map((c, i) => (
        <span
          key={i}
          className="sa-coin absolute bottom-0 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-amber-500 text-xs font-bold text-amber-900 shadow"
          style={{ left: c.left, animationDelay: c.delay }}
        >
          £
        </span>
      ))}

      <div className="relative">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
          Contractor dashboard
        </p>
        <div className="mt-2 flex items-end justify-between">
          <div className="sa-amount">
            <p className="text-3xl font-extrabold">£1,245.60</p>
            <p className="text-xs font-semibold text-emerald-600">● Paid today</p>
          </div>
          <div className="flex h-16 items-end gap-1.5">
            {bars.map((h, i) => (
              <span
                key={i}
                className="sa-bar w-3 rounded-t bg-gradient-to-t from-brand to-orange-400"
                style={{ height: `${h}%`, animationDelay: `${i * 0.12}s` }}
              />
            ))}
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {benefits.map((b, i) => (
            <div
              key={b.title}
              className={`sa-toast-${i + 1} flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/95 px-4 py-3`}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-sm font-bold text-white">
                ✓
              </span>
              <div>
                <p className="text-sm font-semibold">{b.title}</p>
                <p className="text-xs text-slate-500">{b.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
