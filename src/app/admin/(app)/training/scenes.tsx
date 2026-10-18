"use client";

import { AreaChart, Bars, RankBars } from "../DashboardCharts";
import { AppFrame, Spot, SpotInline, pTitle } from "./data";

const glass = "glass rounded-2xl";

/* ============================ DASHBOARD ============================ */

export function DashboardScene({ variant }: { variant: string | null }) {
  void variant;
  const stats = [
    { label: "Open pipeline", value: "£18,400", sub: "9 open leads" },
    { label: "Hot leads", value: "3", sub: "1 needs a next step" },
    { label: "Touchpoints · 7d", value: "21", sub: "2 follow-ups due today" },
    { label: "New this week", value: "5", sub: "▲ 25% vs last week" },
  ];
  return (
    <AppFrame nav="/admin">
      <div className="holo-theme space-y-4 p-5 text-white">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              Command <span className="bg-gradient-to-r from-brand-light via-orange-300 to-amber-200 bg-clip-text text-transparent">Deck</span>
            </h1>
            <p className="text-xs text-white/50">9 leads in the system · 1 won · £18.4k in play</p>
          </div>
        </div>
        <Spot id="stats" className="grid grid-cols-4 gap-3">
          {stats.map((s) => (
            <div key={s.label} className={`${glass} p-4`}>
              <p className={pTitle}>{s.label}</p>
              <p className="mt-2 text-2xl font-extrabold">{s.value}</p>
              <p className="mt-1 text-[10px] text-white/50">{s.sub}</p>
            </div>
          ))}
        </Spot>
        <div className="grid grid-cols-5 gap-4">
          <Spot id="chart" className={`${glass} col-span-3 p-4`}>
            <div className="flex items-center justify-between">
              <p className={pTitle}>Lead flow · 12 weeks</p>
              <p className="flex gap-3 text-[10px] text-white/60">
                <span className="flex items-center gap-1"><span className="h-1.5 w-4 rounded bg-brand-light" />New</span>
                <span className="flex items-center gap-1"><span className="h-1.5 w-4 rounded bg-emerald-400" />Won</span>
              </p>
            </div>
            <AreaChart points={[1, 0, 2, 3, 2, 4, 3, 5, 4, 6, 5, 7]} labels={["Jul", "", "Aug", "", "", "Sep", "", "", "", "Oct", "", ""]} height={130} />
          </Spot>
          <Spot id="copilot" className={`${glass} col-span-2 p-4`}>
            <p className={pTitle}>Copilot suggestions</p>
            <ul className="mt-2 space-y-2">
              {[
                ["border-red-400/40 bg-red-500/10", "bg-red-400", "2 follow-ups overdue", "Clear these first."],
                ["border-amber-400/30 bg-amber-400/10", "bg-amber-300", "1 hot lead has no next step", "Book a follow-up."],
                ["border-sky-400/30 bg-sky-400/10", "bg-sky-300", "3 leads without LinkedIn", "Research gives a second channel."],
              ].map(([ring, dot, t, d]) => (
                <li key={t as string} className={`rounded-xl border p-2.5 ${ring}`}>
                  <p className="flex items-center gap-2 text-xs font-semibold"><span className={`h-1.5 w-1.5 rounded-full ${dot}`} />{t}</p>
                  <p className="mt-0.5 text-[10px] text-white/55">{d}</p>
                </li>
              ))}
            </ul>
          </Spot>
        </div>
        <div className="grid grid-cols-5 gap-4">
          <Spot id="focus" className={`${glass} col-span-2 p-4`}>
            <p className={pTitle}>Today&apos;s focus queue</p>
            {["Sarah Jones · fresh enquiry", "Priya Shah · follow-up pending", "Tom Reeves · hot"].map((n, i) => (
              <div key={n} className="mt-2 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-2 text-xs">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/10 text-[10px] font-bold">{i + 1}</span>
                <span className="truncate font-semibold">{n}</span>
              </div>
            ))}
          </Spot>
          <Spot id="hot" className={`${glass} col-span-3 p-4`}>
            <p className={pTitle}>Hottest leads</p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {["Sarah Jones · 91", "Tom Reeves · 84", "Priya Shah · 76"].map((n) => (
                <div key={n} className="rounded-xl border border-red-400/25 bg-red-500/10 p-2.5 text-xs font-semibold">{n}</div>
              ))}
            </div>
          </Spot>
        </div>
        <Spot id="streams" className="grid grid-cols-3 gap-4">
          {["Recent leads", "Activity stream", "Follow-ups · next 7 days"].map((t) => (
            <div key={t} className={`${glass} p-4`}>
              <p className={pTitle}>{t}</p>
              <div className="mt-2 space-y-2">
                <p className="text-xs font-semibold">Sarah Jones <span className="ml-1 rounded bg-sky-400/15 px-1.5 text-[9px] text-sky-300">New</span></p>
                <p className="text-xs font-semibold">Tom Reeves <span className="ml-1 rounded bg-violet-400/15 px-1.5 text-[9px] text-violet-300">Qualified</span></p>
              </div>
            </div>
          ))}
        </Spot>
      </div>
    </AppFrame>
  );
}

/* ============================== LEADS ============================== */

const LEADS = [
  { id: 1, name: "Sarah Jones", co: "Meridian IT Contractors", title: "Director", email: "sarah@meridian-it.co.uk", phone: "07700 900123", status: "New", score: "Hot 91", spam: false, val: "£4,800", owner: "KQ" },
  { id: 2, name: "Tom Reeves", co: "Northgate Utilities", title: "Ops Manager", email: "tom@northgate.co.uk", phone: "07700 900456", status: "Qualified", score: "Hot 84", spam: false, val: "£6,100", owner: "JR" },
  { id: 3, name: "Raymond Abbott", co: "", title: "", email: "ra@jmailservice.com", phone: "07700 900999", status: "New", score: "Cold 22", spam: true, val: "—", owner: "—" },
  { id: 4, name: "Priya Shah", co: "Bright Contracts Ltd", title: "Contractor", email: "priya@bright.co.uk", phone: "", status: "Contacted", score: "Warm 62", spam: false, val: "£2,500", owner: "KQ" },
  { id: 5, name: "David Turner", co: "", title: "", email: "dt@jmailservice.com", phone: "07700 900888", status: "New", score: "Cold 19", spam: true, val: "—", owner: "—" },
];

export function LeadsScene({ variant }: { variant: string | null }) {
  const selected = variant === "spam_selected";
  const deleted = variant === "spam_deleted" || variant === "open_lead";
  if (variant === "open_lead") return <LeadDetailScene />;
  const rows = deleted ? LEADS.filter((l) => !l.spam) : LEADS;
  return (
    <AppFrame nav="/admin/leads">
      <div className="holo-theme space-y-3 p-5 text-white">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Leads <span className="text-sm font-normal text-white/40">({rows.length})</span></h1>
          <div className="flex gap-2">
            <span className="rounded-full border border-white/15 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-white/60">Export CSV</span>
            <span className="rounded-full border border-white/15 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-white/60">Import</span>
            <span className="rounded-full bg-gradient-to-r from-brand to-brand-light px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest">+ Add Lead</span>
          </div>
        </div>
        <Spot id="filters" className={`${glass} space-y-2 p-3`}>
          <div className="flex gap-2">
            <span className="w-64 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white/40">Search name, email, phone or company…</span>
            <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white/60">All sources</span>
            <span className="rounded-full bg-white/15 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest">Filter</span>
          </div>
          <div className="flex items-center gap-2">
            {["All", "New", "Contacted", "Qualified", "Won", "Lost"].map((s) => (
              <span key={s} className={`rounded-full px-3 py-1 text-[10px] font-semibold ring-1 ${s === "All" ? "bg-white/20 ring-white/30" : "ring-white/15 text-white/60"}`}>{s}</span>
            ))}
            <SpotInline id="spamchip" className="ml-auto">
              <span className="flex items-center gap-1.5 rounded-full bg-red-500/15 px-3 py-1 text-[10px] font-semibold text-red-300 ring-1 ring-red-400/40">
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-2.5 w-2.5"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" /></svg>
                Likely spam
              </span>
            </SpotInline>
          </div>
        </Spot>
        <Spot id="toolbar" className="flex gap-2">
          <span className="rounded-full border border-white/15 px-3 py-1 text-[10px] font-semibold text-white/60">Select page</span>
          <span className="rounded-full border border-red-400/30 bg-red-500/10 px-3 py-1 text-[10px] font-semibold text-red-200">Select likely spam ({LEADS.filter((l) => l.spam).length})</span>
        </Spot>
        <Spot id="table" className={`${glass} overflow-hidden`}>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-[9px] uppercase tracking-widest text-white/45">
                <th className="py-2.5 pl-4 w-8" /><th className="px-2">Lead</th><th className="px-3">Score</th><th className="px-3">Contact</th><th className="px-3">Stage</th><th className="px-3">Value</th><th className="px-3">Owner</th><th className="pr-3 text-right w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {rows.map((l) => (
                <tr key={l.id} className={l.spam ? "bg-red-500/[0.07]" : ""}>
                  <td className="pl-4 py-2.5 align-top">
                    <span className={`mt-0.5 inline-block h-3.5 w-3.5 rounded border ${selected && l.spam ? "border-red-400 bg-red-500" : "border-white/30 bg-white/10"}`}>
                      {selected && l.spam && <svg viewBox="0 0 24 24" fill="white" className="h-3.5 w-3.5"><path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>}
                    </span>
                  </td>
                  <td className="px-2 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{l.name}</span>
                      {l.spam && (
                        <span className="rounded-full bg-red-500/15 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-red-300 ring-1 ring-red-400/40">Spam?</span>
                      )}
                    </div>
                    <p className="text-[10px] text-white/40">{[l.title, l.co].filter(Boolean).join(" · ") || "contact form"}</p>
                  </td>
                  <td className="px-3"><span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ring-1 ${l.spam ? "bg-sky-400/15 text-sky-300 ring-sky-400/40" : l.score.startsWith("Hot") ? "bg-red-400/15 text-red-300 ring-red-400/40" : "bg-amber-400/15 text-amber-300 ring-amber-400/40"}`}>{l.score}</span></td>
                  <td className="px-3 text-white/70"><p>{l.email}</p><p className="text-[10px] text-white/40">{l.phone}</p></td>
                  <td className="px-3"><span className="rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-semibold ring-1 ring-white/15">{l.status}</span></td>
                  <td className="px-3 font-semibold">{l.val}</td>
                  <td className="px-3 text-white/60">{l.owner}</td>
                  <td className="pr-3 text-right">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg text-white/35">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="h-3 w-3"><path d="M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" /></svg>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Spot>
        {selected && (
          <div className="flex justify-center pt-1">
            <Spot id="deletebar" className="glass flex items-center gap-4 rounded-full py-1.5 pl-4 pr-1.5">
              <p className="text-xs font-semibold">2 selected</p>
              <span className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-red-600 to-rose-500 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest shadow-[0_0_20px_-4px_rgba(239,68,68,0.9)]">
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-3 w-3"><path d="M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" /></svg>
                Delete
              </span>
            </Spot>
          </div>
        )}
      </div>
    </AppFrame>
  );
}

/* ------------------------- lead detail mini ------------------------ */

function LeadDetailScene() {
  const chip = "rounded-xl border border-white/15 px-3 py-2 text-[10px] font-semibold text-white/70";
  return (
    <AppFrame nav="/admin/leads">
      <div className="holo-theme grid grid-cols-3 gap-4 p-5 text-white">
        <div className="col-span-2 space-y-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-white/40">← Back to leads</p>
          <div className={`${glass} p-4`}>
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-orange-500 text-lg font-bold">S</span>
              <div className="flex-1">
                <p className="text-lg font-bold">Sarah Jones</p>
                <p className="text-xs text-white/50">Director at Meridian IT Contractors</p>
              </div>
              <Spot id="score" className="text-center">
                <p className="rounded-full bg-red-400/15 px-3 py-1 text-xs font-bold text-red-300 ring-1 ring-red-400/40">Hot · 91</p>
              </Spot>
            </div>
            <Spot id="status" className="mt-3 flex gap-2">
              {["New", "Contacted", "Qualified", "Won", "Lost"].map((s) => (
                <span key={s} className={`rounded-full px-3 py-1 text-[10px] font-semibold ring-1 ${s === "New" ? "bg-sky-400/20 text-sky-300 ring-sky-400/40" : "ring-white/15 text-white/50"}`}>{s}</span>
              ))}
            </Spot>
            <Spot id="assign" className="mt-3 flex items-center gap-2">
              <span className={chip}>Owner: Kevin Quirk ▾</span>
              <span className={chip}>+44 7700 900123</span>
              <span className={chip}>sarah@meridian-it.co.uk</span>
              <span className={chip}>linkedin.com/in/sarahjones ↗</span>
            </Spot>
          </div>
          <Spot id="email" className={`${glass} p-4`}>
            <p className={pTitle}>Email Sarah</p>
            <div className="mt-2 flex gap-2">
              {["New lead intro", "Follow-up", "Comparison sent", "Welcome aboard"].map((t, i) => (
                <span key={t} className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ring-1 ${i === 0 ? "bg-brand/20 text-brand-light ring-brand/40" : "ring-white/15 text-white/55"}`}>{t}</span>
              ))}
            </div>
            <div className="mt-2 rounded-xl border border-white/10 bg-white/5 p-3 text-[10px] leading-relaxed text-white/60">
              Hi Sarah, I&apos;m Kevin from The Contractor Broker — we help contractors like those at Meridian IT Contractors find the right umbrella company…
            </div>
          </Spot>
          <Spot id="timeline" className={`${glass} p-4`}>
            <p className={pTitle}>Activity timeline</p>
            <div className="mt-2 flex gap-2">
              <span className="w-24 rounded-lg border border-white/15 bg-white/5 px-2 py-1.5 text-[10px] text-white/60">Call ▾</span>
              <span className="flex-1 rounded-lg border border-white/15 bg-white/5 px-2 py-1.5 text-[10px] text-white/40">Call outcome, meeting notes…</span>
              <span className="rounded-lg bg-white/15 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest">Log</span>
            </div>
            {[
              ["bg-emerald-500", "Kevin logged a call", "Asked about umbrella vs PAYE — wants a comparison", "10 min ago"],
              ["bg-violet-500", "Kevin emailed the lead", "Sent: Finding the right umbrella company…", "1 h ago"],
              ["bg-teal-500", "Sarah visited /compare", "Tracked smart link", "2 h ago"],
            ].map(([dot, a, b, t]) => (
              <div key={a as string} className="mt-3 flex gap-3">
                <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${dot}`} />
                <div>
                  <p className="text-xs"><span className="font-semibold">{a}</span></p>
                  <p className="text-[10px] text-white/50">{b}</p>
                  <p className="text-[9px] text-white/35">{t}</p>
                </div>
              </div>
            ))}
          </Spot>
        </div>
        <div className="space-y-4">
          <Spot id="nextsteps" className="rounded-2xl border border-brand/25 bg-brand/[0.06] p-4">
            <p className={pTitle}>Recommended next steps</p>
            <ol className="mt-3 space-y-2">
              {["Reach out by phone — respond within 24h", "Send the umbrella comparison", "Book a follow-up if they need time"].map((s, i) => (
                <li key={s} className="flex gap-2 text-[11px]">
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-brand text-[9px] font-bold">{i + 1}</span>
                  <span className="leading-snug text-white/80">{s}</span>
                </li>
              ))}
            </ol>
          </Spot>
          <Spot id="sequence" className={`${glass} p-4`}>
            <p className={pTitle}>Automated follow-up</p>
            <p className="mt-1 text-[10px] leading-relaxed text-white/55">3-step email sequence — intro now, then automatic chases until they convert.</p>
            <div className="mt-2 flex items-center gap-1.5">
              {[0, 1, 2].map((i) => (
                <span key={i} className={`h-1.5 flex-1 rounded-full ${i === 0 ? "bg-brand" : "bg-white/15"}`} />
              ))}
            </div>
            <span className="mt-2 inline-block rounded-full bg-gradient-to-r from-brand to-brand-light px-3 py-1.5 text-[9px] font-semibold uppercase tracking-widest">Start sequence</span>
          </Spot>
          <Spot id="followups" className={`${glass} p-4`}>
            <p className={pTitle}>Follow-ups</p>
            <div className="mt-2 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-2 text-xs">
              <span className="flex h-4 w-4 items-center justify-center rounded-full border border-white/30 text-transparent">✓</span>
              <div className="flex-1">
                <p className="font-semibold">Chase comparison decision</p>
                <p className="text-[9px] text-white/45">Due tomorrow, 9:00</p>
              </div>
            </div>
          </Spot>
        </div>
      </div>
    </AppFrame>
  );
}

/* ============================= PIPELINE ============================ */

export function PipelineScene({ variant }: { variant: string | null }) {
  const dragged = variant === "dragged";
  const cols: { label: string; color: string; cards: { n: string; co: string; score: string; overdue?: boolean }[] }[] = [
    { label: "New", color: "#38bdf8", cards: [
      ...(dragged ? [] : [{ n: "Sarah Jones", co: "Meridian IT Contractors", score: "91" }]),
      { n: "Emma Clarke", co: "Bright Contracts", score: "58" },
    ]},
    { label: "Contacted", color: "#fbbf24", cards: [
      ...(dragged ? [{ n: "Sarah Jones", co: "Meridian IT Contractors", score: "91" }] : []),
      { n: "Priya Shah", co: "Bright Contracts", score: "62" },
    ]},
    { label: "Qualified", color: "#a78bfa", cards: [{ n: "Tom Reeves", co: "Northgate Utilities", score: "84", overdue: true }]},
    { label: "Won", color: "#34d399", cards: [{ n: "Mo Khan", co: "CityBuild Ltd", score: "100" }]},
    { label: "Lost", color: "#64748b", cards: []},
  ];
  return (
    <AppFrame nav="/admin/pipeline">
      <div className="holo-theme space-y-4 p-5 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Sales Pipeline</h1>
            <p className="text-[10px] text-white/50">Drag cards between stages. Badge shows the lead score.</p>
          </div>
          <SpotInline id="filter" className="flex gap-1.5">
            <span className="rounded-full bg-white/20 px-3 py-1 text-[10px] font-semibold ring-1 ring-white/30">All leads</span>
            <span className="rounded-full px-3 py-1 text-[10px] font-semibold ring-1 ring-white/15 text-white/60">My leads</span>
          </SpotInline>
        </div>
        <Spot id="stats" className="grid grid-cols-3 gap-3">
          {[["Open pipeline", "£18,400", "8 open deals"], ["Weighted forecast", "£6,900", "Value × stage probability"], ["Won (90 days)", "£4,200", "1 deal"]].map(([l, v, s]) => (
            <div key={l as string} className={`${glass} p-3`}>
              <p className={pTitle}>{l}</p>
              <p className="mt-1 text-xl font-extrabold">{v}</p>
              <p className="text-[9px] text-white/40">{s}</p>
            </div>
          ))}
        </Spot>
        <Spot id="board" className="flex gap-3">
          {cols.map((c) => (
            <div key={c.label} className="flex min-h-[300px] flex-1 flex-col rounded-xl border border-white/10 bg-white/[0.04]">
              <div className="border-b border-white/10 p-2.5">
                <p className="flex items-center justify-between text-xs font-bold">
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: c.color }} />{c.label}</span>
                  <span className="rounded-full bg-white/10 px-1.5 text-[9px] text-white/60">{c.cards.length}</span>
                </p>
              </div>
              <div className="flex-1 space-y-2 p-2">
                {c.cards.map((k) => (
                  <div
                    key={k.n}
                    data-spot={dragged && k.n === "Sarah Jones" ? "dropped" : undefined}
                    className={`rounded-lg border p-2.5 ${dragged && k.n === "Sarah Jones" ? "animate-holo-in border-brand/50 bg-brand/10" : "border-white/10 bg-white/[0.07]"} ${k.overdue ? "border-red-400/40" : ""}`}
                  >
                    <div className="flex items-start justify-between">
                      <p className="text-[11px] font-semibold">{k.n}</p>
                      <span className="rounded-full bg-red-400/15 px-1.5 text-[8px] font-bold text-red-300 ring-1 ring-red-400/40">{k.score}</span>
                    </div>
                    <p className="mt-0.5 text-[9px] text-white/45">{k.co}</p>
                    <p className="mt-1.5 flex justify-between text-[9px]">
                      <span className="font-semibold">£4,800</span>
                      {k.overdue && <span className="font-semibold text-red-300">Overdue</span>}
                    </p>
                  </div>
                ))}
                {!c.cards.length && <p className="py-6 text-center text-[9px] text-white/30">Drop leads here</p>}
              </div>
            </div>
          ))}
        </Spot>
      </div>
    </AppFrame>
  );
}

/* ============================== RADAR ============================== */

export function RadarScene({ variant }: { variant: string | null }) {
  const officers = variant === "officers" || variant === "person_added";
  const added = variant === "person_added";
  const rows = [
    { n: "APEX POWER RECRUITMENT LTD", num: "15822341", formed: "6 Oct 2026", addr: "71 Shelton St, London", sic: [["78200", true], ["82990", false]] },
    { n: "GRANITE PROJECT SERVICES LTD", num: "15822980", formed: "8 Oct 2026", addr: "Manchester M1", sic: [["71122", true], ["78200", true]] },
    { n: "HALO MEDICAL AGENCY LTD", num: "15823402", formed: "12 Oct 2026", addr: "Birmingham B3", sic: [["86900", true]] },
  ];
  return (
    <AppFrame nav="/admin/radar">
      <div className="holo-theme space-y-3 p-5 text-white">
        <div>
          <h1 className="text-xl font-bold">Lead Radar</h1>
          <p className="mt-0.5 text-[10px] text-white/50">Scans Companies House for newly formed companies — new contractors need an umbrella before competitors find them.</p>
        </div>
        <Spot id="presets" className="grid grid-cols-3 gap-3">
          {[["New this week", "Incorporated in the last 7 days — hottest prospects"], ["New this month", "Last 30 days of registrations"], ["New this quarter", "Wider sweep — 90 days"]].map(([l, h]) => (
            <div key={l as string} className={`${glass} p-3`}>
              <p className="flex items-center gap-1.5 text-xs font-bold"><span className="h-1.5 w-1.5 rounded-full bg-brand" />{l}</p>
              <p className="mt-1 text-[9px] text-white/50">{h}</p>
            </div>
          ))}
        </Spot>
        <Spot id="scanform" className={`${glass} flex items-center gap-2 p-3`}>
          <span className="flex-1 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-[10px] text-white/40">Company name includes… e.g. construction, medical, IT</span>
          <span className="w-32 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-[10px] text-white/40">Location…</span>
          <span className="w-36 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-[10px] text-white/60">Recruitment agencies ▾</span>
          <span className="rounded-lg bg-gradient-to-r from-brand to-brand-light px-5 py-1.5 text-[10px] font-semibold uppercase tracking-widest">Scan</span>
        </Spot>
        <div className={`${glass} overflow-hidden`}>
          <p className="border-b border-white/10 px-4 py-2 text-[11px] font-bold uppercase tracking-widest">148 prospects found</p>
          {rows.map((r, i) => (
            <div key={r.n} className="border-b border-white/[0.06] px-4 py-2.5 last:border-0">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold">{r.n}</p>
                  <p className="text-[9px] text-white/45">{r.num} · formed {r.formed}</p>
                  <p className="text-[9px] text-white/35">{r.addr}</p>
                  <div className="mt-1 flex gap-1">
                    {r.sic.map(([s, m]) => (
                      <span key={s as string} className={`rounded-full px-1.5 py-0.5 text-[8px] font-semibold ${m ? "bg-brand/15 text-brand-light ring-1 ring-brand/30" : "bg-white/10 text-white/45"}`}>SIC {s}</span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-1.5">
                  {i === 0 ? (
                    <Spot id="people">
                      <span className={`rounded-lg px-2 py-1 text-[9px] font-semibold ${officers ? "bg-white/20" : "border border-white/15 text-white/60"}`}>People {officers ? "▴" : "▾"}</span>
                    </Spot>
                  ) : (
                    <span className="rounded-lg border border-white/15 px-2 py-1 text-[9px] font-semibold text-white/60">People ▾</span>
                  )}
                  <span className="rounded-full bg-white/10 px-2 py-1 text-[9px] font-semibold text-white/60">+ Add to CRM</span>
                  <span className="rounded-lg border border-white/15 px-2 py-1 text-[9px] font-semibold text-white/60">in ↗</span>
                  <span className="rounded-lg border border-white/15 px-2 py-1 text-[9px] font-semibold text-white/60">CH ↗</span>
                </div>
              </div>
              {i === 0 && officers && (
                <Spot id="officers" className="mt-2 rounded-xl border border-brand/25 bg-brand/[0.05] p-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest">The people behind {r.n}</p>
                  {[["JAMES WHITTAKER", "Director · appointed 6 Oct 2026", added], ["SOPHIE LANG", "Director · appointed 6 Oct 2026", false]].map(([n, r2, a]) => (
                    <div key={n as string} className="mt-2 flex items-center gap-2.5 rounded-lg border border-white/10 bg-white/[0.07] px-2.5 py-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-brand to-orange-500 text-[9px] font-bold">{(n as string)[0]}</span>
                      <div className="flex-1"><p className="text-[11px] font-semibold">{n}</p><p className="text-[9px] text-white/45">{r2}</p></div>
                      <span className={`rounded-full px-2.5 py-1 text-[9px] font-semibold ${a ? "bg-emerald-400/15 text-emerald-300 ring-1 ring-emerald-400/40" : "bg-gradient-to-r from-brand to-brand-light"}`}>
                        {a ? "✓ In CRM" : "+ Add to CRM"}
                      </span>
                    </div>
                  ))}
                </Spot>
              )}
            </div>
          ))}
        </div>
      </div>
    </AppFrame>
  );
}

/* =========================== PROSPECTING =========================== */

export function ProspectingScene({ variant }: { variant: string | null }) {
  const filled = variant === "researched";
  return (
    <AppFrame nav="/admin/prospecting">
      <div className="holo-theme space-y-3 p-5 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold">LinkedIn Prospecting</h1>
            <p className="mt-0.5 text-[10px] text-white/50">Every new lead waits here until their LinkedIn profile is saved — researched leads give you a second outreach channel.</p>
          </div>
          <span className="rounded-full bg-[#0a66c2] px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest">Import Sales Navigator list</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[["Awaiting research", "4"], ["Profiles saved", "12"], ["LinkedIn coverage", "75%"]].map(([l, v]) => (
            <div key={l as string} className={`${glass} p-3`}><p className={pTitle}>{l}</p><p className="mt-1 text-xl font-extrabold">{v}</p></div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Spot id="queue" className={`${glass} col-span-2 overflow-hidden`}>
            <p className="border-b border-white/10 px-4 py-2 text-[11px] font-bold uppercase tracking-widest">Research queue (4)</p>
            <div className="px-4 py-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold">Priya Shah</p>
                  <p className="text-[9px] text-white/45">Contractor · Bright Contracts Ltd · priya@bright.co.uk</p>
                </div>
                <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-[9px] font-bold text-amber-300 ring-1 ring-amber-400/40">62</span>
              </div>
              <Spot id="searches" className="mt-2 flex gap-1.5">
                {["LinkedIn people search ↗", "Sales Navigator ↗", "Google X-ray ↗", "Company page ↗"].map((s) => (
                  <span key={s} className="rounded-lg border border-white/15 px-2 py-1 text-[9px] font-semibold text-white/60">{s}</span>
                ))}
              </Spot>
              <Spot id="saveform" className="mt-2 flex gap-1.5">
                <span className={`flex-1 rounded-lg border px-2 py-1.5 text-[10px] ${filled ? "border-[#0a66c2]/60 text-white/80" : "border-white/15 text-white/35"}`}>
                  {filled ? "linkedin.com/in/priyashah-bright" : "Paste profile URL"}
                </span>
                <span className="w-24 rounded-lg border border-white/15 px-2 py-1.5 text-[10px] text-white/60">Job title</span>
                <span className="w-24 rounded-lg border border-white/15 px-2 py-1.5 text-[10px] text-white/60">Company</span>
                <span className={`rounded-lg px-3 py-1.5 text-[9px] font-semibold uppercase tracking-wider text-white ${filled ? "bg-[#0a66c2] shadow-[0_0_16px_-2px_#0a66c2]" : "bg-[#0a66c2]/70"}`}>Save</span>
              </Spot>
            </div>
            {["Emma Clarke", "Raymond Abbott"].map((n) => (
              <div key={n} className="border-t border-white/[0.06] px-4 py-2.5">
                <p className="text-xs font-semibold">{n}</p>
                <p className="text-[9px] text-white/40">No LinkedIn profile yet</p>
              </div>
            ))}
          </Spot>
          <div className="space-y-3">
            <Spot id="recent" className={`${glass} p-3`}>
              <p className={pTitle}>Recently researched</p>
              {[["Sarah Jones", "Meridian IT"], ["Tom Reeves", "Northgate"]].map(([n, c]) => (
                <div key={n as string} className="mt-2 flex items-center justify-between">
                  <div><p className="text-[11px] font-semibold">{n}</p><p className="text-[9px] text-white/45">{c}</p></div>
                  <span className="rounded bg-[#0a66c2] px-1 py-0.5 text-[9px] font-bold">in</span>
                </div>
              ))}
            </Spot>
            <Spot id="playbook" className="rounded-2xl border border-[#0a66c2]/25 bg-[#0a66c2]/[0.06] p-3">
              <p className={pTitle}>Outreach playbook</p>
              {["Find and save the profile", "Send a personalised connection request", "Log it as LinkedIn activity", "Use the “After LinkedIn connect” email"].map((s, i) => (
                <div key={s} className="mt-1.5 flex gap-2 text-[10px] text-white/70">
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#0a66c2] text-[8px] font-bold">{i + 1}</span>{s}
                </div>
              ))}
            </Spot>
          </div>
        </div>
      </div>
    </AppFrame>
  );
}

/* ============================= OUTREACH ============================ */

export function OutreachScene({ variant }: { variant: string | null }) {
  const composed = variant === "composed";
  return (
    <AppFrame nav="/admin/outreach">
      <div className="holo-theme space-y-3 p-5 text-white">
        <div>
          <h1 className="text-xl font-bold">Outreach</h1>
          <p className="text-[10px] text-white/50">Campaigns, automated follow-up sequences and open tracking — from hello@thecontractorbroker.com.</p>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {[["Emails sent", "312"], ["Open rate", "41%"], ["Opens this week", "9"], ["Sequences running", "3"]].map(([l, v]) => (
            <div key={l as string} className={`${glass} p-3`}><p className="text-lg font-bold">{v}</p><p className={pTitle}>{l}</p></div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 space-y-3">
            <Spot id="composer" className={`${glass} p-4`}>
              <p className={pTitle}>Start a campaign</p>
              <div className="mt-2 flex gap-4">
                <div className="w-40 space-y-1">
                  <p className="text-[9px] font-semibold uppercase tracking-widest text-white/40">Recipients</p>
                  {["Sarah Jones", "Priya Shah", "Emma Clarke"].map((n) => (
                    <p key={n} className="flex items-center gap-1.5 text-[10px] text-white/70">
                      <span className={`h-3 w-3 rounded border ${n !== "Raymond Abbott" ? "border-brand bg-brand" : "border-white/30"}`} />{n}
                    </p>
                  ))}
                </div>
                <div className="flex-1 space-y-1.5">
                  <div className="flex gap-1.5">
                    {["Gentle chase", "New lead intro", "Comparison"].map((t, i) => (
                      <span key={t} className={`rounded-full px-2.5 py-1 text-[9px] font-semibold ring-1 ${i === (composed ? 0 : -1) ? "bg-brand/20 text-brand-light ring-brand/40" : "ring-white/15 text-white/55"}`}>{t}</span>
                    ))}
                  </div>
                  {composed && (
                    <div className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-[9px] leading-relaxed text-white/60">
                      Hi Sarah — just floating this back up in case it got buried. The comparison&apos;s free and takes about 10 minutes…
                    </div>
                  )}
                  <span className={`inline-block rounded-full px-4 py-1.5 text-[9px] font-semibold uppercase tracking-widest ${composed ? "bg-gradient-to-r from-brand to-brand-light shadow-[0_0_18px_-4px_rgba(220,38,38,0.9)]" : "bg-white/10 text-white/50"}`}>
                    Send 3 personalised emails
                  </span>
                </div>
              </div>
            </Spot>
            <Spot id="past" className={`${glass} p-4`}>
              <p className={pTitle}>Past campaigns</p>
              <table className="mt-1 w-full text-[10px]">
                <thead><tr className="text-left text-[8px] uppercase tracking-widest text-white/40"><th className="pb-1">Campaign</th><th className="pb-1">Sent</th><th className="pb-1">Opens</th><th className="pb-1">Date</th></tr></thead>
                <tbody>
                  {[["October contractors", "48", "19", "12 Oct"], ["September chase", "61", "24", "28 Sept"]].map((r) => (
                    <tr key={r[0]} className="border-t border-white/[0.06]">{r.map((c, i) => <td key={i} className="py-1.5">{i === 2 ? <span className="font-semibold text-emerald-300">{c}</span> : c}</td>)}</tr>
                  ))}
                </tbody>
              </table>
            </Spot>
          </div>
          <div className="space-y-3">
            <Spot id="warm" className="rounded-2xl border border-brand/25 bg-brand/[0.06] p-3">
              <p className={pTitle}>Warm right now</p>
              <p className="mt-1 text-[9px] text-white/50">Opened an email in the last 30 days.</p>
              {["Sarah Jones · opened 4×", "Tom Reeves · opened 2×"].map((n) => (
                <div key={n} className="mt-1.5 flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.07] px-2.5 py-1.5 text-[10px] font-semibold">{n}</div>
              ))}
            </Spot>
            <Spot id="browsing" className={`${glass} p-3`}>
              <p className={pTitle}>Browsing the site</p>
              <p className="mt-1 text-[9px] text-white/50">Clicked a tracked ?r= link in the last 14 days.</p>
              {["Priya Shah · /compare · today", "Mo Khan · /rates · yesterday"].map((n) => (
                <div key={n} className="mt-1.5 flex items-center gap-2 rounded-lg border border-white/10 px-2.5 py-1.5 text-[10px] font-semibold">{n}<span className="ml-auto h-1.5 w-1.5 rounded-full bg-teal-400" /></div>
              ))}
            </Spot>
            <Spot id="sequences" className={`${glass} p-3`}>
              <p className={pTitle}>Sequences</p>
              <p className="mt-1 text-[9px] text-white/50">now intro → +3d chase → +7d last call. Auto-chases until they convert or you stop it.</p>
              <div className="mt-2 rounded-lg border border-white/10 px-2.5 py-1.5">
                <p className="text-[10px] font-semibold">Emma Clarke</p>
                <div className="mt-1 flex gap-1">{[0, 1, 2].map((i) => <span key={i} className={`h-1 flex-1 rounded-full ${i < 2 ? "bg-brand" : "bg-white/15"}`} />)}</div>
                <p className="mt-1 text-[8px] text-white/40">Step 2 of 3 · next send tomorrow</p>
              </div>
            </Spot>
          </div>
        </div>
      </div>
    </AppFrame>
  );
}

/* ============================= CALENDAR ============================ */

export function CalendarScene({ variant }: { variant: string | null }) {
  void variant;
  const chips: Record<number, [string, string][]> = {
    14: [["Call Sarah — comparison", "red"]],
    16: [["● Tom Reeves", "green"]],
    19: [["Chase Priya", "brand"], ["● New: Sarah Jones", "green"]],
    21: [["Send Mo paperwork", "sky"]],
    23: [["LinkedIn step 2 · Emma", "sky"], ["Call Tom Reeves", "sky"]],
    27: [["Onboard Mo Khan", "sky"]],
  };
  const today = 18;
  const cells: (number | null)[] = [...Array(4).fill(null), ...Array.from({ length: 31 }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);
  return (
    <AppFrame nav="/admin/calendar">
      <div className="holo-theme space-y-3 p-5 text-white">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Calendar</h1>
          <SpotInline id="nav" className="flex gap-1.5">
            {["← Prev", "Today", "Next →"].map((b) => (
              <span key={b} className="rounded-full border border-white/15 px-3 py-1 text-[10px] font-semibold text-white/60">{b}</span>
            ))}
          </SpotInline>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Spot id="month" className={`${glass} col-span-2 overflow-hidden`}>
            <p className="border-b border-white/10 px-4 py-2 text-[11px] font-bold uppercase tracking-widest">October 2026</p>
            <div className="grid grid-cols-7 border-b border-white/10 text-center text-[8px] font-semibold uppercase tracking-widest text-white/40">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => <p key={d} className="py-1">{d}</p>)}
            </div>
            <div className="grid grid-cols-7">
              {cells.map((d, i) => (
                <div key={i} className={`min-h-[44px] border-b border-r border-white/[0.06] p-1 [&:nth-child(7n)]:border-r-0 ${d === today ? "bg-brand/[0.08]" : ""} ${d ? "" : "bg-white/[0.02]"}`}>
                  {d && (
                    <>
                      <p className={`mb-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-semibold ${d === today ? "bg-brand" : "text-white/45"}`}>{d}</p>
                      <div className="space-y-0.5">
                        {(chips[d] ?? []).slice(0, 2).map(([t, c]) => (
                          <p
                            key={t}
                            data-spot={c === "red" ? "overduechip" : c === "brand" ? "todaychip" : undefined}
                            className={`truncate rounded px-1 py-0.5 text-[7px] font-semibold ${
                              c === "red" ? "bg-red-500/20 text-red-300 ring-1 ring-red-400/40"
                              : c === "brand" ? "bg-brand/15 text-brand-light ring-1 ring-brand/30"
                              : c === "green" ? "bg-emerald-400/15 text-emerald-300 ring-1 ring-emerald-400/40"
                              : "bg-sky-400/15 text-sky-300 ring-1 ring-sky-400/40"
                            }`}
                          >
                            {t}
                          </p>
                        ))}
                        {(chips[d]?.length ?? 0) > 2 && <p className="px-1 text-[7px] text-white/35">+{(chips[d]?.length ?? 0) - 2} more</p>}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </Spot>
          <div className="space-y-3">
            <Spot id="overdue" className="overflow-hidden rounded-2xl border border-red-400/30 bg-red-500/[0.06]">
              <p className="border-b border-red-400/20 bg-red-500/10 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-red-300">Overdue (2)</p>
              {[["Call Sarah — comparison", "Sarah Jones", "2 days ago"], ["Chase LinkedIn reply", "Emma Clarke", "yesterday"]].map(([t, n, d]) => (
                <div key={t} className="flex items-center gap-2 border-b border-white/[0.05] px-3 py-2 last:border-0">
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-white/30 text-transparent hover:text-emerald-400">✓</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[10px] font-semibold">{n}</p>
                    <p className="truncate text-[9px] text-white/45">{t}</p>
                  </div>
                  <p className="text-[8px] text-red-300">{d}</p>
                </div>
              ))}
            </Spot>
            <Spot id="upcoming" className={`${glass} overflow-hidden`}>
              <p className="border-b border-white/10 px-3 py-2 text-[10px] font-bold uppercase tracking-widest">Next 14 days</p>
              {[["Chase Priya", "Priya Shah", "19 Oct"], ["Call Tom Reeves", "Tom Reeves", "23 Oct"], ["Onboard Mo Khan", "Mo Khan", "27 Oct"]].map(([t, n, d]) => (
                <div key={t} className="flex items-center gap-2 border-b border-white/[0.05] px-3 py-2 last:border-0">
                  <span data-spot={t === "Chase Priya" ? "done" : undefined} className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-white/30 text-transparent">✓</span>
                  <div className="min-w-0 flex-1"><p className="truncate text-[10px] font-semibold">{n}</p><p className="truncate text-[9px] text-white/45">{t}</p></div>
                  <p className="text-[8px] text-white/35">{d}</p>
                </div>
              ))}
            </Spot>
          </div>
        </div>
      </div>
    </AppFrame>
  );
}

/* ============================== REPORTS ============================ */

export function ReportsScene({ variant }: { variant: string | null }) {
  void variant;
  return (
    <AppFrame nav="/admin/reports">
      <div className="holo-theme space-y-3 p-5 text-white">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Sales &amp; Marketing Reports</h1>
          <SpotInline id="range" className="flex gap-1.5">
            {["Last 30 days", "Last 90 days", "Last 12 months"].map((r, i) => (
              <span key={r} className={`rounded-full px-3 py-1 text-[10px] font-semibold ring-1 ${i === 1 ? "bg-white/20 ring-white/30" : "ring-white/15 text-white/60"}`}>{r}</span>
            ))}
          </SpotInline>
        </div>
        <Spot id="kpis" className="grid grid-cols-4 gap-3">
          {[["New leads", "27", "▲ 12% vs previous"], ["Win rate", "33%", "3 won · 6 lost"], ["Revenue won", "£14,600", "Open pipeline £18,400"], ["Avg. first response", "9h", "Lead received → first touch"]].map(([l, v, s]) => (
            <div key={l as string} className={`${glass} p-3`}>
              <p className={pTitle}>{l}</p>
              <p className="mt-1 text-xl font-extrabold">{v}</p>
              <p className="text-[9px] font-medium text-emerald-300">{s}</p>
            </div>
          ))}
        </Spot>
        <div className="grid grid-cols-2 gap-4">
          <Spot id="funnel" className={`${glass} p-4`}>
            <p className={pTitle}>Conversion funnel</p>
            {[["Leads", 27, "#64748b"], ["Contacted", 19, "#fbbf24"], ["Qualified", 8, "#a78bfa"], ["Won", 3, "#34d399"]].map(([l, n, c]) => (
              <div key={l as string} className="mt-2">
                <p className="flex justify-between text-[10px]"><span className="font-semibold">{l}</span><span className="text-white/50">{n}</span></p>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full" style={{ width: `${(n as number / 27) * 100}%`, background: c as string }} />
                </div>
              </div>
            ))}
          </Spot>
          <Spot id="weekly" className={`${glass} p-4`}>
            <p className={pTitle}>New leads per week</p>
            <div className="mt-3"><Bars values={[2, 1, 3, 2, 4, 3, 5, 2, 6, 4, 3, 5]} labels={Array(12).fill("")} height={120} /></div>
          </Spot>
          <Spot id="sources" className={`${glass} p-4`}>
            <p className={pTitle}>Lead sources</p>
            <RankBars rows={[{ label: "contact form", value: 12, sub: "4 won" }, { label: "linkedin", value: 7, sub: "2 won" }, { label: "referral", value: 5, sub: "3 won" }, { label: "lead radar", value: 3 }]} />
          </Spot>
          <Spot id="activity" className={`${glass} p-4`}>
            <p className={pTitle}>Sales activity</p>
            <RankBars color="#38bdf8" rows={[{ label: "email", value: 42 }, { label: "call", value: 31 }, { label: "note", value: 26 }, { label: "meeting", value: 9 }, { label: "linkedin", value: 14 }]} />
          </Spot>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Spot id="campaigns" className={`${glass} p-4`}>
            <p className={pTitle}>Campaign performance</p>
            <p className="mt-1 text-[9px] text-white/45">Add ?utm_source=linkedin&amp;utm_campaign=spring-it to links in ads and posts.</p>
            <table className="mt-2 w-full text-[10px]">
              <thead><tr className="text-left text-[8px] uppercase tracking-widest text-white/40"><th className="pb-1">Campaign</th><th className="pb-1">Leads</th><th className="pb-1">Won</th><th className="pb-1">Revenue</th></tr></thead>
              <tbody><tr className="border-t border-white/[0.06]"><td className="py-1.5 font-semibold">spring-it</td><td>6</td><td>2</td><td className="font-semibold">£9,800</td></tr></tbody>
            </table>
          </Spot>
          <Spot id="team" className={`${glass} p-4`}>
            <p className={pTitle}>Team leaderboard</p>
            {[["★ Kevin Quirk", "3", "42", "2", "£9,800"], ["Jo Reeves", "2", "31", "1", "£4,800"]].map((r) => (
              <div key={r[0]} className="mt-2 flex items-center gap-2 rounded-lg border border-white/10 px-2.5 py-1.5 text-[10px]">
                <span className="flex-1 font-semibold">{r[0]}</span>
                <span className="text-white/50">{r[1]} open · {r[2]} acts · {r[3]} won</span>
                <span className="font-bold">{r[4]}</span>
              </div>
            ))}
          </Spot>
        </div>
      </div>
    </AppFrame>
  );
}

/* ========================= VISITORS & TEAM ========================= */

export function AdminScene({ variant }: { variant: string | null }) {
  void variant;
  return (
    <AppFrame nav="/admin/visitors">
      <div className="holo-theme space-y-3 p-5 text-white">
        <div>
          <h1 className="text-xl font-bold">Website Visitors</h1>
          <p className="mt-0.5 text-[10px] text-white/50">IP-based analytics — every visit is recorded even before a form is submitted.</p>
        </div>
        <Spot id="vstats" className="grid grid-cols-4 gap-3">
          {[["Visitors (24h)", "34"], ["Total visitors", "1,207"], ["Page views (24h)", "91"], ["Total page views", "4,882"]].map(([l, v]) => (
            <div key={l as string} className={`${glass} p-3`}><p className={pTitle}>{l}</p><p className="mt-1 text-2xl font-extrabold">{v}</p></div>
          ))}
        </Spot>
        <Spot id="vtable" className={`${glass} overflow-hidden`}>
          <p className="border-b border-white/10 px-4 py-2 text-[11px] font-bold uppercase tracking-widest">Visitors</p>
          <table className="w-full text-[10px]">
            <thead><tr className="text-left text-[8px] uppercase tracking-widest text-white/40"><th className="px-4 py-1.5">IP / Location</th><th className="py-1.5">Device</th><th className="py-1.5">ISP</th><th className="py-1.5">Pages</th><th className="py-1.5">Visits</th><th className="py-1.5">Last seen</th></tr></thead>
            <tbody>
              {[["82.45.116.9", "Leeds, UK", "Desktop · Chrome", "BT Broadband", "6", "3", "10 min ago"], ["92.11.48.201", "London, UK", "iPhone · Safari", "Vodafone UK", "3", "1", "42 min ago"], ["77.101.9.55", "Glasgow, UK", "Desktop · Edge", "Sky Broadband", "12", "7", "2 h ago"]].map((r) => (
                <tr key={r[0]} className="border-t border-white/[0.06]">
                  {r.map((c, i) => <td key={i} className={`px-${i === 0 ? 4 : 0} py-1.5 ${i === 0 ? "font-mono font-semibold" : "text-white/60"}`}>{c}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </Spot>
        <Spot id="feed" className={`${glass} p-3`}>
          <p className={pTitle}>Latest page views</p>
          {[["/compare-umbrella", "82.45.116.9 · Leeds", "just now"], ["/pricing", "92.11.48.201 · London", "4 min ago"]].map(([p, m, t]) => (
            <div key={p as string} className="mt-1.5 flex justify-between text-[10px]"><span className="font-semibold">{p}<span className="ml-2 font-mono font-normal text-white/40">{m}</span></span><span className="text-white/35">{t}</span></div>
          ))}
        </Spot>
        <div className="grid grid-cols-2 gap-4">
          <Spot id="teamtable" className={`${glass} overflow-hidden`}>
            <p className="border-b border-white/10 px-3 py-2 text-[10px] font-bold uppercase tracking-widest">Team · Users (2)</p>
            {[["Kevin Quirk", "Super Admin", "Active", "—"], ["Jo Reeves", "Staff", "Active", "Disable"]].map((r) => (
              <div key={r[0]} className="flex items-center gap-2 border-b border-white/[0.05] px-3 py-2 text-[10px] last:border-0">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-brand to-orange-500 text-[9px] font-bold">{r[0][0]}</span>
                <span className="flex-1 font-semibold">{r[0]}<span className="block text-[8px] font-normal text-white/40">{r[0].toLowerCase().replace(" ", ".")}@tcb.com</span></span>
                <span className={`rounded-full px-2 py-0.5 text-[8px] font-semibold ring-1 ${r[1] === "Super Admin" ? "bg-brand/15 text-brand-light ring-brand/40" : "bg-white/10 text-white/60 ring-white/15"}`}>{r[1]}</span>
                <span className="text-emerald-300">{r[2]}</span>
                <span className="rounded-full px-2 py-0.5 text-[8px] font-semibold ring-1 ring-white/15 text-white/50">{r[3]}</span>
              </div>
            ))}
          </Spot>
          <Spot id="adduser" className={`${glass} p-3`}>
            <p className={pTitle}>Add employee</p>
            {["Full name", "Email", "Temporary password"].map((p) => (
              <span key={p} className="mt-1.5 block rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-[10px] text-white/35">{p}</span>
            ))}
            <span className="mt-2 inline-block rounded-full bg-gradient-to-r from-brand to-brand-light px-4 py-1.5 text-[9px] font-semibold uppercase tracking-widest">Create user</span>
          </Spot>
        </div>
      </div>
    </AppFrame>
  );
}
