export const LEAD_STATUSES = [
  "new",
  "contacted",
  "qualified",
  "won",
  "lost",
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const STATUS_STYLES: Record<
  LeadStatus,
  { label: string; badge: string; dot: string }
> = {
  new: {
    label: "New",
    badge: "bg-sky-50 text-sky-700 ring-sky-200",
    dot: "bg-sky-500",
  },
  contacted: {
    label: "Contacted",
    badge: "bg-amber-50 text-amber-700 ring-amber-200",
    dot: "bg-amber-500",
  },
  qualified: {
    label: "Qualified",
    badge: "bg-violet-50 text-violet-700 ring-violet-200",
    dot: "bg-violet-500",
  },
  won: {
    label: "Won",
    badge: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    dot: "bg-emerald-500",
  },
  lost: {
    label: "Lost",
    badge: "bg-slate-100 text-slate-600 ring-slate-200",
    dot: "bg-slate-400",
  },
};

export type CrmUser = {
  id: number;
  email: string;
  name: string;
  role: "super_admin" | "staff";
  active: boolean;
};

export type Lead = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  message: string | null;
  source: string;
  status: LeadStatus;
  assigned_to: number | null;
  assignee_name?: string | null;
  created_at: string;
  updated_at: string;
};

export type LeadActivity = {
  id: number;
  lead_id: number;
  user_id: number | null;
  user_name?: string | null;
  type: string;
  body: string | null;
  created_at: string;
};
