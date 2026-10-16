import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { sql } from "@/lib/db";

// Vercel caps every request body at ~4.5 MB, so the composer uploads files
// in small chunks stored here until sendLeadEmail assembles them for Resend.
const MAX_CHUNK_BYTES = 2 * 1024 * 1024;
const MAX_CHUNKS = 40;

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const upload = searchParams.get("upload") ?? "";
  const name = (searchParams.get("name") ?? "").slice(0, 200);
  const chunk = Number(searchParams.get("chunk"));
  if (!/^[0-9a-f-]{36}$/i.test(upload) || !name || !Number.isInteger(chunk) || chunk < 0 || chunk > MAX_CHUNKS) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const buf = Buffer.from(await request.arrayBuffer());
  if (!buf.length || buf.length > MAX_CHUNK_BYTES) {
    return NextResponse.json({ error: "Chunk too large" }, { status: 413 });
  }

  await sql`
    INSERT INTO attachment_uploads (upload_id, file_name, chunk_index, data_hex, user_id)
    VALUES (${upload}, ${name}, ${chunk}, ${buf.toString("hex")}, ${user.id})
    ON CONFLICT (upload_id, chunk_index) DO NOTHING`;
  if (chunk === 0) {
    await sql`DELETE FROM attachment_uploads WHERE created_at < now() - interval '1 day'`;
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const upload = new URL(request.url).searchParams.get("upload") ?? "";
  if (/^[0-9a-f-]{36}$/i.test(upload)) {
    await sql`DELETE FROM attachment_uploads WHERE upload_id = ${upload} AND user_id = ${user.id}`;
  }
  return NextResponse.json({ ok: true });
}
