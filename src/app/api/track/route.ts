import { NextRequest, NextResponse } from "next/server";
import { lookupGeo } from "@/lib/analytics";
import { sql } from "@/lib/db";

export const runtime = "nodejs";

const BOT = /bot|crawl|spider|slurp|facebookexternal|preview|pingdom|uptime|curl|wget|python|headless|lighthouse/i;

export async function POST(req: NextRequest) {
  try {
    const ua = req.headers.get("user-agent") ?? "";
    const body = (await req.json().catch(() => ({}))) as {
      path?: string;
      referrer?: string;
    };
    const path = typeof body.path === "string" ? body.path.slice(0, 300) : "";

    if (
      !path.startsWith("/") ||
      path.startsWith("/admin") ||
      path.startsWith("/api") ||
      !ua ||
      BOT.test(ua)
    ) {
      return NextResponse.json({ ok: true });
    }

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip")?.trim() ||
      "unknown";
    const referrer =
      typeof body.referrer === "string" && body.referrer
        ? body.referrer.slice(0, 500)
        : null;

    const rows = await sql`
      INSERT INTO visitors (ip, user_agent, visit_count)
      VALUES (${ip}, ${ua.slice(0, 500)}, 1)
      ON CONFLICT (ip) DO UPDATE SET
        last_seen = now(),
        visit_count = visitors.visit_count + 1,
        user_agent = EXCLUDED.user_agent
      RETURNING id, geo_checked`;
    const visitor = rows[0] as { id: number; geo_checked: boolean };

    if (!visitor.geo_checked) {
      const geo = await lookupGeo(ip);
      await sql`
        UPDATE visitors SET country = ${geo.country}, region = ${geo.region},
          city = ${geo.city}, isp = ${geo.isp}, geo_checked = true
        WHERE id = ${visitor.id}`;
    }

    await sql`
      INSERT INTO page_views (visitor_id, path, referrer)
      VALUES (${visitor.id}, ${path}, ${referrer})`;

    return NextResponse.json({ ok: true });
  } catch {
    // Analytics must never break the site — swallow DB/env failures.
    return NextResponse.json({ ok: true });
  }
}
