// Companies House public data API — free key from
// https://developer.company-information.service.gov.uk
// Used by the Lead Radar to find UK recruitment agencies to prospect.

const BASE = "https://api.company-information.service.gov.uk";

export type Prospect = {
  companyName: string;
  companyNumber: string;
  status: string;
  type: string;
  incorporated: string | null;
  address: string;
  sicCodes: string[];
};

export const SIC_PRESETS = [
  {
    id: "agencies",
    label: "Recruitment agencies",
    codes: ["78100", "78109", "78200", "78300"],
    hint: "Employment placement, temp agency and HR provision companies",
  },
  {
    id: "payroll",
    label: "Payroll & umbrella",
    codes: ["69202", "82990"],
    hint: "Bookkeeping / business support — where many umbrella companies file",
  },
] as const;

export const SIC_LABELS: Record<string, string> = {
  "78100": "Employment placement agencies",
  "78109": "Other placement agency activities",
  "78200": "Temporary employment agency",
  "78300": "HR provision & management",
  "69202": "Bookkeeping activities",
  "82990": "Other business support",
};

export function isConfigured() {
  return Boolean(process.env.COMPANIES_HOUSE_API_KEY);
}

const ukDate = (d: Date) =>
  `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}/${d.getUTCFullYear()}`;

function formatAddress(a?: {
  address_line_1?: string;
  address_line_2?: string;
  locality?: string;
  region?: string;
  postal_code?: string;
  country?: string;
}) {
  if (!a) return "";
  return [
    a.address_line_1,
    a.address_line_2,
    a.locality,
    a.region,
    a.postal_code,
    a.country,
  ]
    .filter(Boolean)
    .join(", ");
}

export async function searchCompanies(opts: {
  keywords?: string;
  sicCodes?: string[];
  location?: string;
  incorporatedDays?: number | null;
  size?: number;
}): Promise<{ items: Prospect[]; total: number; error?: never } | { items: []; total: 0; error: string }> {
  const key = process.env.COMPANIES_HOUSE_API_KEY;
  if (!key) return { items: [], total: 0, error: "not-configured" };

  const params = new URLSearchParams();
  if (opts.keywords) params.set("company_name_includes", opts.keywords);
  if (opts.location) params.set("location", opts.location);
  if (opts.sicCodes?.length) params.set("sic_codes", opts.sicCodes.join(","));
  params.set("company_status", "active");
  params.set("size", String(Math.min(opts.size ?? 100, 100)));
  if (opts.incorporatedDays) {
    const from = new Date(Date.now() - opts.incorporatedDays * 86400000);
    params.set("incorporated_from", ukDate(from));
    params.set("incorporated_to", ukDate(new Date()));
  }

  let res: Response;
  try {
    res = await fetch(`${BASE}/advanced-search/companies?${params}`, {
      headers: {
        Authorization: `Basic ${Buffer.from(`${key}:`).toString("base64")}`,
      },
      cache: "no-store",
    });
  } catch {
    return { items: [], total: 0, error: "network" };
  }

  if (!res.ok) {
    if (res.status === 401 || res.status === 403)
      return { items: [], total: 0, error: "bad-key" };
    if (res.status === 429) return { items: [], total: 0, error: "rate-limit" };
    return { items: [], total: 0, error: `api-${res.status}` };
  }

  const data = (await res.json()) as {
    hits?: number;
    items?: {
      company_name?: string;
      company_number?: string;
      company_status?: string;
      company_type?: string;
      date_of_creation?: string;
      registered_office_address?: Parameters<typeof formatAddress>[0];
      sic_codes?: string[];
    }[];
  };

  const items: Prospect[] = (data.items ?? []).map((i) => ({
    companyName: i.company_name ?? "",
    companyNumber: i.company_number ?? "",
    status: i.company_status ?? "",
    type: i.company_type ?? "",
    incorporated: i.date_of_creation ?? null,
    address: formatAddress(i.registered_office_address),
    sicCodes: i.sic_codes ?? [],
  }));
  return { items, total: data.hits ?? items.length };
}
