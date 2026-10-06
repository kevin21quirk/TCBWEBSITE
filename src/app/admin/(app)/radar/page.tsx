import Link from "next/link";
import { addProspect } from "@/app/admin/actions";
import { requireUser } from "@/lib/auth";
import {
  SIC_LABELS,
  SIC_PRESETS,
  isConfigured,
  searchCompanies,
  type Prospect,
} from "@/lib/companyhouse";
import { sql } from "@/lib/db";

export const metadata = { title: "Lead Radar" };
export const dynamic = "force-dynamic";

const fmt = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-ink placeholder:text-slate-400 focus:border-brand focus:bg-white focus:outline-none";

export default async function RadarPage({
  searchParams,
}: {
  searchParams: Promise<{
    scan?: string;
    days?: string;
    q?: string;
    loc?: string;
    sic?: string;
  }>;
}) {
  await requireUser();
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const loc = (sp.loc ?? "").trim();
  const days = [7, 30, 90].includes(Number(sp.days)) ? Number(sp.days) : 30;
  const sic = SIC_PRESETS.some((p) => p.id === sp.sic) ? sp.sic! : "agencies";
  const scanning = sp.scan === "1";
  const currentQs = `/admin/radar?${new URLSearchParams({
    scan: "1",
    days: String(days),
    sic,
    q,
    loc,
  })}`;

  const configured = isConfigured();
  const result = scanning && configured
    ? await searchCompanies({
        keywords: q || undefined,
        sicCodes: [...(SIC_PRESETS.find((p) => p.id === sic)?.codes ?? [])],
        location: loc || undefined,
        incorporatedDays: days,
      })
    : null;

  // Companies already in the CRM, so we never double-add.
  const existing = result?.items?.length
    ? new Set(
        (
          await sql`SELECT lower(company) AS c FROM leads WHERE company IS NOT NULL`
        ).map((r) => String(r.c))
      )
    : new Set<string>();

  const presetLink = (d: number) =>
    `/admin/radar?scan=1&days=${d}&sic=${sic}&q=${encodeURIComponent(q)}&loc=${encodeURIComponent(loc)}`;

  const errText: Record<string, string> = {
    "bad-key": "The Companies House API key was rejected — check COMPANIES_HOUSE_API_KEY.",
    "rate-limit": "Companies House rate limit hit — wait a minute and scan again.",
    network: "Couldn't reach Companies House — check the server connection and try again.",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-3 text-2xl font-bold text-ink">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand to-orange-500 text-white">
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
              <path d="M12 2a10 10 0 1 0 9.54 7h-2.06A8 8 0 1 1 12 4V2zm0 4a6 6 0 1 0 5.66 4H12V6zm0 3a1 1 0 1 0 0 2 1 1 0 0 0 0-2z" />
            </svg>
          </span>
          Lead Radar
        </h1>
        <p className="mt-1 max-w-2xl text-xs text-slate-500">
          Scans the official UK company register (Companies House) for active
          recruitment agencies — including brand-new incorporations, before your
          competitors find them. Add any company to the CRM in one click.
        </p>
      </div>

      {!configured ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-6 shadow-sm">
          <h2 className="text-sm font-bold uppercase tracking-widest text-amber-800">
            One free setup step needed
          </h2>
          <ol className="mt-4 space-y-3 text-sm text-slate-700">
            {[
              <>Go to <a href="https://developer.company-information.service.gov.uk" target="_blank" rel="noreferrer" className="font-semibold text-brand underline">developer.company-information.service.gov.uk</a> and sign in (or create a free account).</>,
              <>Create an application and request a <strong>REST API key</strong> — it&rsquo;s free and instant.</>,
              <>Add <code className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-semibold">COMPANIES_HOUSE_API_KEY=your_key</code> to <code className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-semibold">.env.local</code> and to Vercel &rarr; Settings &rarr; Environment Variables.</>,
              <>Redeploy / restart, then come back here and scan.</>,
            ].map((s, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
                  {i + 1}
                </span>
                <span className="leading-snug">{s}</span>
              </li>
            ))}
          </ol>
          <p className="mt-4 text-xs text-slate-500">
            The key allows 600 requests per 5 minutes — plenty for scanning
            thousands of companies.
          </p>
        </div>
      ) : (
        <>
          {/* quick scans */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { d: 7, label: "New this week", hint: "Agencies incorporated in the last 7 days — hottest prospects" },
              { d: 30, label: "New this month", hint: "Last 30 days of new agency registrations" },
              { d: 90, label: "New this quarter", hint: "Wider sweep — 90 days of new incorporations" },
            ].map((p) => (
              <Link
                key={p.d}
                href={presetLink(p.d)}
                className={`group rounded-2xl border bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${
                  scanning && days === p.d ? "border-brand ring-1 ring-brand/30" : "border-slate-200"
                }`}
              >
                <p className="flex items-center gap-2 text-sm font-bold text-ink">
                  <span className="h-2 w-2 rounded-full bg-brand" />
                  {p.label}
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{p.hint}</p>
              </Link>
            ))}
          </div>

          {/* custom scan */}
          <form
            action="/admin/radar"
            className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-[2fr_1fr_1fr_auto]"
          >
            <input type="hidden" name="scan" value="1" />
            <input
              name="q"
              defaultValue={q}
              placeholder="Company name includes… e.g. construction, medical, IT"
              className={inputClass}
            />
            <input
              name="loc"
              defaultValue={loc}
              placeholder="Location… e.g. Manchester"
              className={inputClass}
            />
            <select name="sic" defaultValue={sic} className={inputClass}>
              {SIC_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
            <input type="hidden" name="days" value={days} />
            <button
              type="submit"
              className="rounded-xl bg-gradient-to-r from-brand to-brand-light px-6 py-2.5 text-xs font-semibold uppercase tracking-widest text-white shadow-lg shadow-brand/30 transition-all hover:shadow-brand/50"
            >
              Scan
            </button>
          </form>
          <p className="-mt-2 text-[11px] text-slate-400">
            {SIC_PRESETS.find((p) => p.id === sic)?.hint}. Only active companies
            are returned.
          </p>
        </>
      )}

      {/* results */}
      {result && "error" in result && result.error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50/60 p-6 text-sm text-red-700">
          {errText[result.error] ?? `Companies House returned an error (${result.error}).`}
        </div>
      ) : null}

      {result && !("error" in result) && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-6 py-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-ink">
              {result.total.toLocaleString("en-GB")} prospect{result.total === 1 ? "" : "s"} found
            </h2>
            <p className="text-xs text-slate-400">
              {q && <>matching &ldquo;{q}&rdquo; · </>}
              {loc && <>{loc} · </>}
              incorporated last {days} days{result.items.length < result.total ? ` · showing first ${result.items.length}` : ""}
            </p>
          </div>
          <div className="divide-y divide-slate-100">
            {(result.items as Prospect[]).map((p) => {
              const inCrm = existing.has(p.companyName.toLowerCase());
              const detail = [
                p.incorporated ? `Incorporated ${fmt.format(new Date(p.incorporated))}` : null,
                p.address || null,
                p.sicCodes.length ? `SIC ${p.sicCodes.join(", ")}` : null,
              ]
                .filter(Boolean)
                .join(" · ");
              return (
                <div key={p.companyNumber} className="px-6 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink">{p.companyName}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {p.companyNumber}
                        {p.incorporated && <> · formed {fmt.format(new Date(p.incorporated))}</>}
                      </p>
                      {p.address && (
                        <p className="mt-0.5 truncate text-xs text-slate-400">{p.address}</p>
                      )}
                      {p.sicCodes.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {p.sicCodes.map((s) => (
                            <span
                              key={s}
                              className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500"
                            >
                              {s} {SIC_LABELS[s] ?? ""}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                      {inCrm ? (
                        <span className="rounded-full bg-emerald-50 px-3 py-2 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
                          ✓ In CRM
                        </span>
                      ) : (
                        <form action={addProspect}>
                          <input type="hidden" name="company" value={p.companyName} />
                          <input type="hidden" name="company_number" value={p.companyNumber} />
                          <input type="hidden" name="detail" value={detail} />
                          <input type="hidden" name="return" value={currentQs} />
                          <button
                            type="submit"
                            className="rounded-full bg-gradient-to-r from-brand to-brand-light px-4 py-2 text-[11px] font-semibold uppercase tracking-widest text-white shadow shadow-brand/30 hover:shadow-brand/50"
                          >
                            + Add to CRM
                          </button>
                        </form>
                      )}
                      <a
                        href={`https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(p.companyName)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg border border-slate-200 px-2.5 py-2 text-[11px] font-semibold text-slate-600 hover:border-[#0a66c2] hover:text-[#0a66c2]"
                      >
                        in ↗
                      </a>
                      <a
                        href={`https://www.google.com/search?q=${encodeURIComponent(`${p.companyName} recruitment agency`)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg border border-slate-200 px-2.5 py-2 text-[11px] font-semibold text-slate-600 hover:border-brand hover:text-brand"
                      >
                        Web ↗
                      </a>
                      <a
                        href={`https://find-and-update.company-information.service.gov.uk/company/${p.companyNumber}`}
                        target="_blank"
                        rel="noreferrer"
                        title="Companies House profile (directors, filing history)"
                        className="rounded-lg border border-slate-200 px-2.5 py-2 text-[11px] font-semibold text-slate-600 hover:border-brand hover:text-brand"
                      >
                        CH ↗
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
            {result.items.length === 0 && (
              <p className="px-6 py-14 text-center text-sm text-slate-400">
                No companies matched this scan — try a wider date range or fewer
                keywords.
              </p>
            )}
          </div>
        </div>
      )}

      {configured && !scanning && (
        <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-400">
          Pick a quick scan above, or run a custom scan — results appear here.
          <br />
          <span className="text-xs">
            Tip: agencies registered this week need payroll and umbrella
            partners right now. Being first to call wins the account.
          </span>
        </div>
      )}
    </div>
  );
}
