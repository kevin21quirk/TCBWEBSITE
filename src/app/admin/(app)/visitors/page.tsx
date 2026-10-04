import { describeUA } from "@/lib/analytics";
import { requireSuperAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";

export const metadata = { title: "Visitors" };
export const dynamic = "force-dynamic";

const fmt = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

type VisitorRow = {
  id: number;
  ip: string;
  user_agent: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  isp: string | null;
  visit_count: number;
  first_seen: string;
  last_seen: string;
  pages: number;
  last_path: string | null;
};

type ViewRow = {
  id: number;
  path: string;
  referrer: string | null;
  created_at: string;
  ip: string;
  city: string | null;
  country: string | null;
};

function location(v: { city: string | null; region: string | null; country: string | null }) {
  return [v.city, v.region, v.country].filter(Boolean).join(", ") || "Unknown";
}

export default async function VisitorsPage() {
  await requireSuperAdmin();

  const [statsRows, visitors, views] = await Promise.all([
    sql`SELECT
      (SELECT count(*) FROM visitors)::int AS total_visitors,
      (SELECT count(*) FROM visitors WHERE last_seen >= now() - interval '1 day')::int AS visitors_24h,
      (SELECT count(*) FROM page_views)::int AS total_views,
      (SELECT count(*) FROM page_views WHERE created_at >= now() - interval '1 day')::int AS views_24h`,
    sql`SELECT v.*,
        (SELECT count(*) FROM page_views pv WHERE pv.visitor_id = v.id)::int AS pages,
        (SELECT path FROM page_views pv WHERE pv.visitor_id = v.id ORDER BY created_at DESC LIMIT 1) AS last_path
      FROM visitors v ORDER BY v.last_seen DESC LIMIT 200`,
    sql`SELECT pv.id, pv.path, pv.referrer, pv.created_at, v.ip, v.city, v.country
      FROM page_views pv JOIN visitors v ON v.id = pv.visitor_id
      ORDER BY pv.created_at DESC LIMIT 50`,
  ]);
  const stats = statsRows[0] as {
    total_visitors: number;
    visitors_24h: number;
    total_views: number;
    views_24h: number;
  };

  const cards = [
    { label: "Visitors (24h)", value: stats.visitors_24h },
    { label: "Total Visitors", value: stats.total_visitors },
    { label: "Page Views (24h)", value: stats.views_24h },
    { label: "Total Page Views", value: stats.total_views },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Website Visitors</h1>
        <p className="mt-1 text-xs text-slate-500">
          IP-based analytics. IPs are personal data under GDPR — keep access
          restricted and mention this tracking in the privacy policy.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              {c.label}
            </p>
            <p className="mt-3 text-4xl font-extrabold text-ink">{c.value}</p>
          </div>
        ))}
      </div>

      {/* visitors table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-ink">
            Visitors
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-xs font-semibold uppercase tracking-widest text-slate-500">
                <th className="px-6 py-4">IP / Location</th>
                <th className="px-6 py-4">Device</th>
                <th className="px-6 py-4">ISP</th>
                <th className="px-6 py-4">Pages</th>
                <th className="px-6 py-4">Visits</th>
                <th className="px-6 py-4">Last Seen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(visitors as VisitorRow[]).map((v) => {
                const ua = describeUA(v.user_agent);
                return (
                  <tr key={v.id} className="transition-colors hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <p className="font-mono text-xs font-semibold text-ink">
                        {v.ip}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {location(v)}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs font-semibold text-ink">
                        {ua.device} · {ua.browser}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">{ua.os}</p>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {v.isp ?? "—"}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-ink">{v.pages}</p>
                      {v.last_path && (
                        <p className="mt-0.5 max-w-[160px] truncate text-xs text-slate-400">
                          {v.last_path}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-ink">
                      {v.visit_count}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {fmt.format(new Date(v.last_seen))}
                    </td>
                  </tr>
                );
              })}
              {visitors.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-10 text-center text-sm text-slate-400"
                  >
                    No visitors recorded yet — data appears as people browse the
                    site.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* live page-view feed */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-ink">
            Latest Page Views
          </h2>
        </div>
        <div className="divide-y divide-slate-100">
          {(views as ViewRow[]).map((v) => (
            <div
              key={v.id}
              className="flex flex-wrap items-center justify-between gap-2 px-6 py-3.5"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink">
                  {v.path}
                </p>
                <p className="truncate text-xs text-slate-500">
                  <span className="font-mono">{v.ip}</span>
                  {" · "}
                  {[v.city, v.country].filter(Boolean).join(", ") || "Unknown"}
                  {v.referrer &&
                    ` · from ${(() => {
                      try {
                        return new URL(v.referrer).hostname;
                      } catch {
                        return v.referrer;
                      }
                    })()}`}
                </p>
              </div>
              <p className="shrink-0 text-xs text-slate-400">
                {fmt.format(new Date(v.created_at))}
              </p>
            </div>
          ))}
          {views.length === 0 && (
            <p className="px-6 py-10 text-center text-sm text-slate-400">
              No page views yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
