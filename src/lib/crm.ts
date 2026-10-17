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
  job_title: string | null;
  linkedin_url: string | null;
  message: string | null;
  source: string;
  status: LeadStatus;
  /** NUMERIC comes back from Postgres as a string. */
  deal_value: string | number | null;
  tags: string[];
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  landing_page: string | null;
  referrer: string | null;
  ip: string | null;
  /** LinkedIn playbook progress: 0-3 (index into LINKEDIN_SCRIPTS done). */
  linkedin_step: number;
  last_contacted_at: string | null;
  assigned_to: number | null;
  assignee_name?: string | null;
  created_at: string;
  updated_at: string;
};

/** Aggregates some list/board queries add alongside the lead row. */
export type LeadStats = {
  activity_count?: number;
  last_activity_at?: string | null;
  engagement_count?: number;
};

export const money = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 0,
});

export const dealValue = (l: Pick<Lead, "deal_value">) =>
  l.deal_value == null ? 0 : Number(l.deal_value);

/* ---------- activity types ---------- */

export const LOGGABLE_ACTIVITIES = [
  { type: "note", label: "Note", verb: "added a note" },
  { type: "call", label: "Call", verb: "logged a call" },
  { type: "email", label: "Email", verb: "logged an email" },
  { type: "meeting", label: "Meeting", verb: "logged a meeting" },
  { type: "linkedin", label: "LinkedIn", verb: "logged LinkedIn outreach" },
] as const;

export const CONTACT_ACTIVITY_TYPES = ["call", "email", "meeting", "linkedin"];

export const ACTIVITY_STYLES: Record<string, { dot: string; verb: string }> = {
  note: { dot: "bg-brand", verb: "added a note" },
  call: { dot: "bg-emerald-500", verb: "logged a call" },
  email: { dot: "bg-violet-500", verb: "emailed the lead" },
  meeting: { dot: "bg-orange-500", verb: "logged a meeting" },
  linkedin: { dot: "bg-[#0a66c2]", verb: "LinkedIn outreach" },
  status: { dot: "bg-amber-500", verb: "" },
  assign: { dot: "bg-sky-500", verb: "" },
  follow_up: { dot: "bg-sky-500", verb: "" },
  open: { dot: "bg-emerald-500", verb: "" },
  click: { dot: "bg-sky-500", verb: "" },
  bounce: { dot: "bg-red-500", verb: "" },
  visit: { dot: "bg-teal-500", verb: "" },
  update: { dot: "bg-slate-400", verb: "updated details" },
};

/* ---------- lead scoring ---------- */

const SOURCE_POINTS: Record<string, number> = {
  "contact form": 20,
  phone: 20,
  referral: 20,
  event: 12,
  linkedin: 10,
  "linkedin import": 6,
  manual: 8,
  newsletter: 4,
};

/**
 * Activities where the lead actually did something — reply-side signals
 * (email opens/clicks, website visits via smart links) and two-way
 * touchpoints (calls, meetings). Sends, notes and system entries don't
 * count towards engagement.
 */
export const ENGAGEMENT_ACTIVITY_TYPES = ["call", "meeting", "open", "click", "visit"];

/** Sources where the lead reached out to us first — inbound counts as engaged. */
const INBOUND_SOURCES = new Set([
  "contact form",
  "phone",
  "referral",
  "event",
  "newsletter",
]);

/**
 * 0–100 score from fit (how complete the record is), intent (source and
 * pipeline stage), engagement and recency. "Hot" additionally requires
 * the lead to have responded in some way — a complete record and fresh
 * enquiry alone only gets to warm.
 */
export function scoreLead(l: Lead & LeadStats): {
  score: number;
  temperature: "hot" | "warm" | "cold";
} {
  if (l.status === "won") return { score: 100, temperature: "hot" };
  if (l.status === "lost") return { score: 0, temperature: "cold" };

  let s = 0;
  if (l.email) s += 8;
  if (l.phone) s += 12;
  if (l.company) s += 6;
  if (l.job_title) s += 4;
  if (l.linkedin_url) s += 8;
  if (dealValue(l) > 0) s += 6;
  s += SOURCE_POINTS[l.source] ?? 8;
  if (l.utm_campaign) s += 4;
  s += l.status === "qualified" ? 25 : l.status === "contacted" ? 12 : 0;
  s += Math.min((l.activity_count ?? 0) * 3, 15);

  const ageDays = (Date.now() - new Date(l.created_at).getTime()) / 864e5;
  if (ageDays <= 3) s += 10;
  const last = l.last_activity_at ?? l.last_contacted_at;
  if (ageDays > 14 && (!last || Date.now() - new Date(last).getTime() > 14 * 864e5)) {
    s -= 12;
  }

  const engaged =
    l.status === "qualified" ||
    INBOUND_SOURCES.has(l.source) ||
    (l.engagement_count ?? 0) > 0;

  const score = Math.max(0, Math.min(100, Math.round(s)));
  return {
    score,
    temperature: score >= 60 && engaged ? "hot" : score >= 35 ? "warm" : "cold",
  };
}

export const TEMPERATURE_STYLES = {
  hot: { label: "Hot", badge: "bg-red-50 text-red-700 ring-red-200" },
  warm: { label: "Warm", badge: "bg-amber-50 text-amber-700 ring-amber-200" },
  cold: { label: "Cold", badge: "bg-sky-50 text-sky-700 ring-sky-200" },
} as const;

/* ---------- LinkedIn research ---------- */

export function linkedinSearches(l: Pick<Lead, "name" | "company" | "job_title" | "email">) {
  const who = [l.name, l.company].filter(Boolean).join(" ");
  const domain =
    l.email && !/@(gmail|googlemail|hotmail|outlook|live|yahoo|icloud|me|aol|btinternet|sky)\./i.test(l.email)
      ? l.email.split("@")[1]
      : null;
  const xray = [`"${l.name}"`, l.company && `"${l.company}"`, l.job_title]
    .filter(Boolean)
    .join(" ");
  return [
    {
      label: "LinkedIn people search",
      href: `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(who)}`,
    },
    {
      label: "Sales Navigator",
      href: `https://www.linkedin.com/sales/search/people?query=(keywords:${encodeURIComponent(who)})`,
    },
    {
      label: "Google X-ray",
      href: `https://www.google.com/search?q=${encodeURIComponent(`site:linkedin.com/in ${xray}`)}`,
    },
    ...(l.company || domain
      ? [
          {
            label: "Company page",
            href: `https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(
              l.company ?? domain!.split(".")[0]
            )}`,
          },
        ]
      : []),
  ];
}

/* ---------- sales email templates ---------- */

export const EMAIL_TEMPLATES = [
  {
    id: "new-lead",
    label: "New lead intro",
    subject: "Finding the right umbrella company for your next contract",
    body: `Hi {firstName},

I'm {senderName} from The Contractor Broker — we help contractors{companyClause} find the right umbrella company for their contracts, quickly and at no cost.

Your choice of umbrella company affects your take-home pay, your compliance and how smoothly you're paid. We do the legwork for you: comparing fully vetted, HMRC-compliant providers and recommending the best fit for your rate, contract length and the benefits that matter to you.

Whether you're about to start a new contract, or you'd simply like to check you're getting the best deal from your current umbrella, I'd be happy to run a free, no-obligation comparison with clear take-home pay figures.

Could I give you a quick call this week? It usually takes around ten minutes — or feel free to reply here and we'll arrange a time that suits you.

Kind regards,
{senderName}`,
  },
  {
    id: "follow-up",
    label: "Follow-up",
    subject: "Following up on your umbrella company enquiry",
    body: `Hi {firstName},

Just following up on your enquiry with The Contractor Broker — I'd still love to help you find the right umbrella company for your contract.

If you've been meaning to get back to us, now's a great time: a quick ten-minute call is all it takes to run a free, no-obligation comparison with clear take-home pay figures.

If now isn't the right time, just reply and let me know and I'll check back in a few weeks.

Kind regards,
{senderName}`,
  },
  {
    id: "intro",
    label: "First contact",
    subject: "Your umbrella company enquiry — The Contractor Broker",
    body: `Hi {firstName},

Thanks for getting in touch with The Contractor Broker. I'll be helping you find the right umbrella company for your contract.

To give you an accurate comparison, it would help to know:
• Your day rate (or hourly rate)
• Your expected contract length and start date
• Whether your contract is inside or outside IR35

When would be a good time for a quick 10-minute call?

Kind regards,
{senderName}`,
  },
  {
    id: "comparison",
    label: "Comparison sent",
    subject: "Your umbrella company comparison",
    body: `Hi {firstName},

As promised, here's a summary of the umbrella companies I'd recommend for you, all fully compliant and vetted by our team.

[Add comparison details here]

Happy to talk through the numbers or answer any questions. Just reply or give me a call.

Kind regards,
{senderName}`,
  },
  {
    id: "chase",
    label: "Gentle chase",
    subject: "Following up on your enquiry",
    body: `Hi {firstName},

I just wanted to follow up on your recent enquiry about umbrella companies. Are you still looking for support?

If now isn't the right time, no problem. Just let me know and I'll check back in later.

Kind regards,
{senderName}`,
  },
  {
    id: "linkedin",
    label: "After LinkedIn connect",
    subject: "Great to connect on LinkedIn",
    body: `Hi {firstName},

Great to connect on LinkedIn. We help contractors{companyClause} find compliant umbrella companies that maximise take-home pay, at no cost to them.

If it would be useful, I'd be happy to run a free comparison for you.

Kind regards,
{senderName}`,
  },
  {
    id: "won",
    label: "Welcome aboard",
    subject: "Welcome — next steps for your setup",
    body: `Hi {firstName},

Great news, and welcome aboard! Here's what happens next:

1. The umbrella company will send your registration pack
2. Complete your details and right-to-work checks
3. Submit your first timesheet and you'll be paid on schedule

If anything's unclear, I'm here to help.

Kind regards,
{senderName}`,
  },
] as const;

export function fillTemplate(
  text: string,
  lead: Pick<Lead, "name" | "company">,
  senderName: string
) {
  return text
    .replace(/\{firstName\}/g, lead.name.split(" ")[0] || "there")
    .replace(/\{companyClause\}/g, lead.company ? ` like those at ${lead.company}` : "")
    .replace(/\{company\}/g, lead.company ?? "your company")
    .replace(/\{senderName\}/g, senderName);
}

/* ---------- LinkedIn outreach playbook ---------- */

/**
 * The app can't send LinkedIn messages, so it writes them: a 3-step manual
 * sequence personalised per lead, tracked via leads.linkedin_step.
 * Step ids index this array — step 0 = connect note, etc.
 */
export const LINKEDIN_SCRIPTS = [
  {
    id: "connect",
    label: "Connect note",
    hint: "Goes with the connection request — keep it under 300 chars.",
    body: `Hi {firstName} — I help contractors{companyClause} keep more of their day rate with a free umbrella company comparison. Thought it'd be worth connecting.`,
  },
  {
    id: "message",
    label: "First message",
    hint: "Send once they've accepted your request.",
    body: `Thanks for connecting, {firstName}! Quick context — I'm {senderName} from The Contractor Broker. We compare vetted, compliant umbrella companies for contractors, completely free.

If the contract work at {company} runs through an umbrella, a 10-minute comparison typically saves people £30–£80 a month. Happy to send over a tailored shortlist — no obligation either way.`,
  },
  {
    id: "chase",
    label: "Follow-up",
    hint: "A week later, if they've gone quiet — then leave it.",
    body: `Hi {firstName} — just floating this back up in case it got buried. The comparison's free and takes about 10 minutes; if umbrella pay isn't a headache right now, no worries at all. If it ever is, I'm at hello@thecontractorbroker.com.`,
  },
] as const;

/** Tracked links that attribute a lead's site visits back to them. */
export function smartLink(leadId: number, path = "/") {
  return `https://thecontractorbroker.com${path}?r=${leadId}`;
}

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
  if (!lead.linkedin_url && lead.status !== "won" && lead.status !== "lost") {
    steps.push("Look them up on LinkedIn and save their profile.");
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
