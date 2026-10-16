import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { previewEmailHtml } from "@/lib/outreach";

/** Staff-only: render a campaign message exactly as a recipient would see it. */
export async function POST(request: Request) {
  await requireUser();
  const body = (await request.json().catch(() => ({}))) as {
    subject?: unknown;
    body?: unknown;
    template?: unknown;
  };
  const subject = typeof body.subject === "string" ? body.subject.trim() : "";
  const text = typeof body.body === "string" ? body.body.trim() : "";
  if (!subject || !text) {
    return NextResponse.json(
      { error: "Subject and message are required" },
      { status: 400 }
    );
  }
  const origin = (
    process.env.SITE_URL ?? "https://thecontractorbroker.com"
  ).replace(/\/$/, "");
  const html = previewEmailHtml({
    subject,
    body: text,
    template: typeof body.template === "string" ? body.template : undefined,
    origin,
  });
  return NextResponse.json({ html });
}
