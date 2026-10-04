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
  linkedin_url: string | null;
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

export type FollowUp = {
  id: number;
  lead_id: number;
  assigned_to: number | null;
  assignee_name?: string | null;
  lead_name?: string;
  title: string;
  due_at: string;
  done: boolean;
  done_at: string | null;
  auto: boolean;
  created_at: string;
};

/** Rules-based "what should we do next" for a lead, shown on its page. */
export function nextSteps(
  lead: Lead,
  opts: { overdue: boolean; hasNotes: boolean }
): string[] {
  const steps: string[] = [];
  if (opts.overdue) {
    steps.push("A follow-up is overdue — contact this lead today.");
  }
  if (!lead.assigned_to) {
    steps.push("Assign the lead to a member of staff.");
  }
  switch (lead.status) {
    case "new":
      steps.push(
        `Reach out by ${lead.phone ? "phone" : "email"} — aim to respond within 24 hours of the enquiry.`
      );
      steps.push("Log the outcome as a note, then move the lead to Contacted.");
      break;
    case "contacted":
      steps.push("Send the umbrella company comparison / recommended options.");
      if (!opts.hasNotes) {
        steps.push("Add a note with the call outcome and their requirements.");
      }
      steps.push("Book a follow-up if they need time to decide.");
      break;
    case "qualified":
      steps.push("Confirm their choice of umbrella company and agree a start date.");
      steps.push("Send onboarding details and any paperwork.");
      break;
    case "won":
      steps.push("Complete onboarding and confirm their first payment went through.");
      break;
    case "lost":
      steps.push("Record why it was lost; schedule a check-in in a few months if appropriate.");
      break;
  }
  return steps.slice(0, 4);
}
