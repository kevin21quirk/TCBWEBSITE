import Link from "next/link";
import Reveal from "@/components/Reveal";

const regions = [
  {
    code: "UK",
    name: "United Kingdom",
    intro:
      "Compliant umbrella solutions for contractors working on UK contracts, wherever you're based.",
    points: [
      "IR35 compliance support",
      "HMRC-compliant umbrella companies",
      "PAYE, tax & National Insurance handled",
    ],
  },
  {
    code: "IoM",
    name: "Isle of Man",
    intro:
      "A dedicated Isle of Man office supporting contractors on Island contracts.",
    points: [
      "Isle of Man contracts supported",
      "Local knowledge of Manx tax & NI rules",
      "On-Island team you can speak to",
    ],
  },
];

/** Multi-jurisdiction coverage band: UK and Isle of Man. */
export default function Jurisdictions() {
  return (
    <section className="relative overflow-hidden bg-ink py-24">
      <div
        className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-brand/20 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-orange-500/10 blur-3xl"
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-site px-6">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="flex items-center justify-center gap-3 text-sm font-semibold uppercase tracking-widest text-brand-light">
              <span className="h-px w-8 bg-gradient-to-r from-transparent to-brand" />
              Multi-Jurisdiction
              <span className="h-px w-8 bg-gradient-to-l from-transparent to-brand" />
            </p>
            <h2 className="mt-3 text-3xl font-bold text-white md:text-4xl">
              Covering the UK &amp; Isle of Man
            </h2>
            <p className="mt-4 leading-relaxed text-slate-300">
              With offices in both the UK and the Isle of Man, we support contractors
              across both jurisdictions. Each has its own tax and National Insurance
              rules, and we know them both.
            </p>
          </div>
        </Reveal>

        <div className="mx-auto mt-14 grid max-w-4xl gap-6 md:grid-cols-2">
          {regions.map((r, i) => (
            <Reveal key={r.code} direction={i === 0 ? "left" : "right"} delay={i * 120}>
              <div className="group h-full rounded-tcb border border-white/15 bg-white/5 p-8 text-center backdrop-blur-md transition-colors hover:border-brand-light md:text-left">
                <div className="flex flex-col items-center gap-4 md:flex-row">
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand to-orange-500 text-sm font-extrabold text-white shadow-lg shadow-brand/30">
                    {r.code}
                  </span>
                  <h3 className="text-xl font-bold text-white">{r.name}</h3>
                </div>
                <p className="mt-5 text-sm leading-relaxed text-slate-300">{r.intro}</p>
                <ul className="mx-auto mt-5 w-fit space-y-2.5 text-left md:mx-0">
                  {r.points.map((p) => (
                    <li
                      key={p}
                      className="flex items-start gap-3 text-sm font-medium text-white"
                    >
                      <span className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand text-[10px] font-bold">
                        ✓
                      </span>
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/contact"
            className="inline-block rounded-full bg-brand px-8 py-3.5 text-sm font-semibold uppercase tracking-wide text-white transition-colors hover:bg-brand-dark"
          >
            Talk to us about your contract
          </Link>
        </div>
      </div>
    </section>
  );
}
