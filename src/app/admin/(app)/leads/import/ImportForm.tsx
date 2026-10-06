"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { importLeads } from "@/app/admin/actions";

type Row = {
  name: string;
  email: string;
  phone: string;
  company: string;
  job_title: string;
  linkedin_url: string;
};

/** Minimal RFC 4180 CSV parser (quoted fields, escaped quotes, CRLF). */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      if (row.some((c) => c.trim())) rows.push(row);
      row = [];
      field = "";
    } else field += ch;
  }
  row.push(field);
  if (row.some((c) => c.trim())) rows.push(row);
  return rows;
}

// Header aliases covering Sales Navigator, LinkedIn connections and generic CRMs.
const ALIASES: Record<keyof Row | "first" | "last", string[]> = {
  name: ["name", "full name", "fullname", "contact name"],
  first: ["first name", "firstname", "first"],
  last: ["last name", "lastname", "surname", "last"],
  email: ["email", "email address", "e-mail", "work email"],
  phone: ["phone", "phone number", "mobile", "telephone", "tel"],
  company: ["company", "company name", "account name", "organisation", "organization", "current company"],
  job_title: ["title", "job title", "position", "current title", "role", "headline"],
  linkedin_url: ["linkedin", "linkedin url", "profile url", "linkedin profile", "url", "person linkedin url", "sales navigator url"],
};

function mapRows(table: string[][]): { rows: Row[]; matched: string[] } {
  const [header, ...body] = table;
  const norm = header.map((h) => h.replace(/^\uFEFF/, "").trim().toLowerCase());
  const col = (key: keyof typeof ALIASES) =>
    norm.findIndex((h) => ALIASES[key].includes(h));
  const idx = Object.fromEntries(
    (Object.keys(ALIASES) as (keyof typeof ALIASES)[]).map((k) => [k, col(k)])
  ) as Record<keyof typeof ALIASES, number>;
  const get = (r: string[], i: number) => (i >= 0 ? (r[i] ?? "").trim() : "");

  const rows = body
    .map((r) => ({
      name:
        get(r, idx.name) ||
        [get(r, idx.first), get(r, idx.last)].filter(Boolean).join(" "),
      email: get(r, idx.email),
      phone: get(r, idx.phone),
      company: get(r, idx.company),
      job_title: get(r, idx.job_title),
      linkedin_url: get(r, idx.linkedin_url),
    }))
    .filter((r) => r.name);
  const matched = (Object.keys(idx) as (keyof typeof idx)[])
    .filter((k) => idx[k] >= 0)
    .map((k) => header[idx[k]]);
  return { rows, matched };
}

export default function ImportForm() {
  const [rows, setRows] = useState<Row[]>([]);
  const [matched, setMatched] = useState<string[]>([]);
  const [fileName, setFileName] = useState("");
  const [tag, setTag] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null);
  const [pending, startTransition] = useTransition();

  const onFile = async (file: File | undefined) => {
    setError("");
    setResult(null);
    if (!file) return;
    setFileName(file.name);
    const table = parseCsv(await file.text());
    if (table.length < 2) {
      setError("That file doesn't contain any rows.");
      setRows([]);
      return;
    }
    const mapped = mapRows(table);
    if (!mapped.rows.length) {
      setError("Couldn't find a name column. Include “Name” or “First Name” / “Last Name”.");
    }
    setRows(mapped.rows);
    setMatched(mapped.matched);
  };

  return (
    <div className="space-y-5">
      <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center transition-colors hover:border-brand hover:bg-brand/[0.03]">
        <span className="text-3xl">⇪</span>
        <span className="mt-2 text-sm font-semibold text-ink">
          {fileName || "Choose a CSV file"}
        </span>
        <span className="mt-1 text-xs text-slate-500">
          Sales Navigator lead list, LinkedIn connections export or any CSV
        </span>
        <input
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => onFile(e.target.files?.[0])}
        />
      </label>

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </p>
      )}

      {rows.length > 0 && !result && (
        <>
          <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <strong className="text-ink">{rows.length}</strong> leads found. Matched
            columns: {matched.join(", ")}
          </div>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[10px] uppercase tracking-widest text-slate-500">
                <tr>
                  {["Name", "Title", "Company", "Email", "LinkedIn"].map((h) => (
                    <th key={h} className="px-3 py-2">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.slice(0, 8).map((r, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2 font-semibold text-ink">{r.name}</td>
                    <td className="px-3 py-2 text-slate-600">{r.job_title || "—"}</td>
                    <td className="px-3 py-2 text-slate-600">{r.company || "—"}</td>
                    <td className="px-3 py-2 text-slate-600">{r.email || "—"}</td>
                    <td className="px-3 py-2 text-slate-600">{r.linkedin_url ? "✓" : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > 8 && (
              <p className="border-t border-slate-100 px-3 py-2 text-xs text-slate-400">
                …and {rows.length - 8} more
              </p>
            )}
          </div>
          <input
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            placeholder="Tag these leads (optional, e.g. sales-nav-it-contractors)"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-brand focus:bg-white focus:outline-none"
          />
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(async () => setResult(await importLeads(rows, tag)))
            }
            className="w-full rounded-xl bg-gradient-to-r from-brand to-brand-light py-3.5 text-sm font-semibold uppercase tracking-wide text-white shadow-lg shadow-brand/30 disabled:opacity-60"
          >
            {pending ? "Importing…" : `Import ${rows.length} leads`}
          </button>
        </>
      )}

      {result && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
          <p className="font-semibold">
            ✓ Imported {result.imported} lead{result.imported === 1 ? "" : "s"}.
          </p>
          {result.skipped > 0 && (
            <p className="mt-1">
              Skipped {result.skipped} duplicate{result.skipped === 1 ? "" : "s"} (matching
              email or LinkedIn URL).
            </p>
          )}
          <p className="mt-1">
            Each imported lead is assigned to you with a “First outreach” follow-up for tomorrow.
          </p>
          <div className="mt-3 flex gap-3">
            <Link href="/admin/leads?source=linkedin+import" className="font-semibold underline">
              View imported leads
            </Link>
            <Link href="/admin/prospecting" className="font-semibold underline">
              Prospecting queue
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
