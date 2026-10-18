import type { Lesson } from "./data";
import {
  AdminScene,
  CalendarScene,
  DashboardScene,
  LeadsScene,
  OutreachScene,
  PipelineScene,
  ProspectingScene,
  RadarScene,
  ReportsScene,
} from "./scenes";

export const LESSONS: Lesson[] = [
  {
    id: "dashboard",
    nav: "/admin",
    title: "Dashboard — the Command Deck",
    blurb: "The at-a-glance health of your whole sales operation: KPIs, charts, AI-style suggestions and today's priorities.",
    liveHref: "/admin",
    scene: DashboardScene,
    steps: [
      {
        chapter: "Stats band",
        caption: "This is the Command Deck — your whole sales operation at a glance. These four glass panels show open pipeline value, hot leads, touchpoints this week and new leads, all updating live.",
        spot: "stats",
      },
      {
        chapter: "Lead flow chart",
        caption: "The chart tracks new leads arriving week by week, with a green overlay showing which weeks converted into won deals — watch for dips before they become dry months.",
        spot: "chart",
      },
      {
        chapter: "Copilot",
        caption: "Copilot watches for overdue follow-ups, hot leads with no next step, and research gaps, then links you straight to the fix. Spam arriving through the website form is flagged here too.",
        spot: "copilot",
      },
      {
        chapter: "Focus queue",
        caption: "On the left, the focus queue is today's shortlist — the highest-scoring open leads and exactly why each one matters. On the right, your hottest leads ranked by score.",
        spot: "focus",
      },
      {
        chapter: "Streams",
        caption: "The bottom stream shows new leads landing, every touchpoint the team logs, and what's due next. Every name is a link straight into that lead's profile.",
        spot: "streams",
      },
    ],
  },
  {
    id: "leads",
    nav: "/admin/leads",
    title: "Leads — filtering & removing spam",
    blurb: "The master list of every enquiry. Search, filter, spot the score, bulk-select and clear out spam in seconds.",
    liveHref: "/admin/leads",
    scene: LeadsScene,
    steps: [
      {
        chapter: "Filters & search",
        caption: "The leads table lists every enquiry: contact form, referrals, LinkedIn — all of it. Filter by stage, by source, or search any name, email, phone or company.",
        spot: "search",
        type: "sarah jones",
      },
      {
        chapter: "Table",
        caption: "Every row shows the lead score — hot, warm or cold — plus contact details, stage, deal value and owner, so you can triage a whole page in seconds.",
        spot: "table",
      },
      {
        chapter: "Likely spam filter",
        caption: "Website spam is auto-flagged. Click Likely spam and only the suspicious rows stay — each with a red Spam? badge explaining exactly why it was caught.",
        spot: "spamchip",
        click: true,
        set: "spam_filtered",
      },
      {
        chapter: "Bulk select",
        caption: "Selection makes clean-up fast: Select page ticks everything visible, and Select likely spam ticks just the flagged rows in one click.",
        spot: "toolbar",
        click: true,
        set: "spam_selected",
      },
      {
        chapter: "Delete bar",
        caption: "With rows ticked, the delete bar appears at the bottom. One click asks for confirmation and removes them for good — super-admin only, so it's safe.",
        spot: "deletebar",
        click: true,
        set: "spam_deleted",
      },
      {
        chapter: "Done",
        caption: "Gone — the pipeline counts update instantly, and the Copilot spam warning on the dashboard clears itself. Genuine leads are never touched by the bulk tools.",
        dur: 6000,
      },
    ],
  },
  {
    id: "lead-detail",
    nav: "/admin/leads",
    title: "Working a lead — the lead profile",
    blurb: "One lead, everything you need: score, next steps, emails, sequences, timeline and follow-ups on a single page.",
    liveHref: "/admin/leads",
    scene: LeadsScene,
    steps: [
      {
        chapter: "Opening a lead",
        caption: "Now let's open a lead profile — the page where the actual selling happens. Everything about this person lives here.",
        sets: [{ at: 0.25, v: "open_lead" }],
      },
      {
        chapter: "Score & next steps",
        caption: "The score badge combines engagement, freshness and deal value. Beside it, recommended next steps tell you what to do next — tailored to this exact lead.",
        spot: "nextsteps",
        scroll: true,
      },
      {
        chapter: "Stage & owner",
        caption: "The stage pills move the lead along the pipeline and the owner dropdown assigns it to a teammate — every change is stamped on the timeline automatically.",
        spot: "status",
      },
      {
        chapter: "Log an activity",
        caption: "Log every touchpoint — calls, emails, meetings, LinkedIn. This builds the timeline, feeds the lead score and keeps the rest of the team in the loop.",
        spot: "loginput",
        type: "Called — sending the umbrella comparison",
        scroll: true,
      },
      {
        chapter: "Save to timeline",
        caption: "Hit Log and the touchpoint stamps itself at the top of the timeline — the score recalculates and the whole team sees it instantly.",
        spot: "logbtn",
        click: true,
        set: "logged",
        scroll: true,
      },
      {
        chapter: "Follow-ups",
        caption: "Schedule a follow-up and it lands on the calendar and the dashboard focus queue — overdue items turn red everywhere until you tick them done.",
        spot: "followups",
      },
      {
        chapter: "Email sequence",
        caption: "The automated sequence sends a branded intro now and chases for you on a schedule — and you can see opens and link clicks the moment they happen.",
        spot: "sequence",
      },
      {
        chapter: "Email composer",
        caption: "Rather write it yourself? The composer sends personalised one-to-one emails from hello@thecontractorbroker.com, and tracked smart links show you when they browse the site.",
        spot: "email",
      },
    ],
  },
  {
    id: "pipeline",
    nav: "/admin/pipeline",
    title: "Pipeline — the drag & drop board",
    blurb: "Kanban-style board of every open deal. Drag between stages, read the forecast, spot overdue cards.",
    liveHref: "/admin/pipeline",
    scene: PipelineScene,
    steps: [
      {
        chapter: "The board",
        caption: "Every open deal lives on this board as a card. The badge is the lead score — work the high numbers first, because they're the ones most likely to close.",
        spot: "board",
      },
      {
        chapter: "Forecast",
        caption: "Above the board: open pipeline value, a weighted forecast that discounts early-stage deals by probability, and what you've actually won in the last 90 days.",
        spot: "stats",
      },
      {
        chapter: "My leads",
        caption: "Use All leads and My leads to switch between the whole team's board and just the deals assigned to you — handy during a busy week.",
        spot: "filter",
      },
      {
        chapter: "Drag a card",
        caption: "To update a deal, drag its card into the next column — or use the dropdown on mobile. The status, the forecast and the timeline all update instantly.",
        spot: "board",
        click: true,
        sets: [{ at: 0.15, v: "dragging" }, { at: 0.62, v: "dragged" }],
      },
      {
        chapter: "Overdue flags",
        caption: "Sarah Jones is now Contacted. Red borders mark cards with overdue follow-ups, and every card links straight into the lead profile.",
        spot: "dropped",
      },
    ],
  },
  {
    id: "radar",
    nav: "/admin/radar",
    title: "Lead Radar — Companies House scanner",
    blurb: "Scans the UK company register for newly incorporated agencies and contractors, and hands you the named directors.",
    liveHref: "/admin/radar",
    scene: RadarScene,
    steps: [
      {
        chapter: "What it does",
        caption: "Lead Radar scans the official UK company register for newly formed businesses — new agencies and contractors need partners before your competitors find them.",
      },
      {
        chapter: "Quick scans",
        caption: "The three preset cards run a scan instantly — this week, this month or this quarter of brand-new incorporations. One click, no setup each time.",
        spot: "presets",
      },
      {
        chapter: "Industry preset",
        caption: "This dropdown chooses who to hunt — New contractors, Recruitment agencies or Payroll & umbrella. Each preset scans the SIC codes those businesses register under.",
        spot: "sic",
        click: true,
        set: "sic_open",
      },
      {
        chapter: "Custom scan",
        caption: "Or build your own — a keyword the company name must contain, and an optional location to narrow it down.",
        spot: "q",
        type: "construction",
        sets: [{ at: 0, v: null }],
      },
      {
        chapter: "Run the scan",
        caption: "Hit Scan and the register answers live — 148 brand-new companies match, listed with their number, formation date, address and SIC codes.",
        spot: "scanbtn",
        click: true,
        sets: [{ at: 0, v: "typed" }, { at: 0.62, v: "scanned" }],
      },
      {
        chapter: "Scan results",
        caption: "Every result is a real registered company — number, formation date, address and SIC codes. The glowing codes are the ones that matched your scan.",
        spot: "results",
        scroll: true,
      },
      {
        chapter: "People",
        caption: "Companies are anonymous — People pulls the actual registered directors from the official register, so you know exactly who to call.",
        spot: "people",
        click: true,
        set: "officers",
        scroll: true,
      },
      {
        chapter: "Add a director",
        caption: "+ Add as lead turns a named director into a fully-linked CRM lead in one click — and in ↗ jumps straight to their LinkedIn search.",
        spot: "addlead",
        scroll: true,
        click: true,
        set: "person_added",
      },
      {
        chapter: "No duplicates",
        caption: "Done — and once anyone is in the CRM they show the green In CRM badge, so the whole team never adds the same prospect twice.",
        spot: "officers",
        scroll: true,
      },
    ],
  },
  {
    id: "prospecting",
    nav: "/admin/prospecting",
    title: "LinkedIn Prospecting — research queue",
    blurb: "Work through new leads, find their LinkedIn profiles with pre-built searches, and save them for outreach.",
    liveHref: "/admin/prospecting",
    scene: ProspectingScene,
    steps: [
      {
        chapter: "Research queue",
        caption: "Every new lead without a LinkedIn profile queues up here. Researched leads unlock LinkedIn outreach, warmer calls and a higher score.",
        spot: "queue",
      },
      {
        chapter: "Smart searches",
        caption: "The search buttons are pre-built for this exact person — people search, Sales Navigator and a Google X-ray that searches LinkedIn without an account.",
        spot: "searches",
        click: true,
      },
      {
        chapter: "Save the profile",
        caption: "Found them? Paste the profile URL, confirm the job title and company while you're looking, then Save — the lead is enriched and leaves the queue.",
        spot: "url",
        type: "linkedin.com/in/priyashah-bright",
        click: true,
        set: "researched",
      },
      {
        chapter: "Coverage",
        caption: "Recently researched shows the team's progress, and the coverage percentage at the top tracks how much of your pipeline is LinkedIn-ready.",
        spot: "recent",
      },
      {
        chapter: "Playbook",
        caption: "The playbook gives you the full sequence: save the profile, send a personalised connect, log it, then use the ready-written follow-up template.",
        spot: "playbook",
      },
    ],
  },
  {
    id: "outreach",
    nav: "/admin/outreach",
    title: "Outreach — campaigns, sequences & tracking",
    blurb: "Send personalised campaigns, let sequences auto-chase leads, and see who's reading and browsing.",
    liveHref: "/admin/outreach",
    scene: OutreachScene,
    steps: [
      {
        chapter: "What it does",
        caption: "Outreach is your email engine — every campaign, automated sequence, open and click runs from hello@thecontractorbroker.com.",
      },
      {
        chapter: "Composer",
        caption: "Start a campaign: pick recipients, choose a template, and every lead gets their own personalised email — never a bulk mail-merge blast.",
        spot: "composer",
        click: true,
        set: "composed",
      },
      {
        chapter: "Personalisation",
        caption: "The preview shows exactly what each person receives — their name, their company, written by the template. Hit send and it's tracked automatically.",
        spot: "composer",
      },
      {
        chapter: "Results",
        caption: "Past campaigns keep score — sent, failed, and how many opens each campaign generated, so you learn what works.",
        spot: "past",
      },
      {
        chapter: "Warm list",
        caption: "Warm right now is gold: leads who opened an email in the last 30 days. Strike while they're reading — a call now converts far better.",
        spot: "warm",
      },
      {
        chapter: "Browsing",
        caption: "Browsing the site catches leads who clicked a tracked link — if someone's on the pricing page right now, that's the moment to pick up the phone.",
        spot: "browsing",
      },
      {
        chapter: "Sequences",
        caption: "Sequences auto-chase a lead until they convert — intro now, chase on day 3, last call on day 7. Start one from any lead profile and stop it any time.",
        spot: "sequences",
      },
    ],
  },
  {
    id: "calendar",
    nav: "/admin/calendar",
    title: "Calendar — follow-ups & workload",
    blurb: "Every follow-up and new lead on a month view, plus overdue and next-14-days lists so nothing slips.",
    liveHref: "/admin/calendar",
    scene: CalendarScene,
    steps: [
      {
        chapter: "What it does",
        caption: "The calendar is where follow-ups live once they're booked — nothing slips through the cracks, even when the diary fills up.",
      },
      {
        chapter: "The month",
        caption: "The month grid shows every follow-up and every new lead on the day it lands — plan your week at a glance and spot overloaded days early.",
        spot: "month",
      },
      {
        chapter: "Colour code",
        caption: "Red chips are overdue, the ringed one is due today, blue is upcoming, and green dots are new leads arriving. Hover any chip to see the lead.",
        spot: "overduechip",
        scroll: true,
      },
      {
        chapter: "Overdue list",
        caption: "The overdue panel on the right is the priority list — clear it daily so no lead ever goes cold while it waits on you.",
        spot: "overdue",
      },
      {
        chapter: "Mark done",
        caption: "Click the circle on any item to mark it done the moment you finish the call — it ticks green and the dashboard and calendar update instantly everywhere.",
        spot: "done",
        click: true,
        set: "done_tick",
      },
      {
        chapter: "Coming up",
        caption: "Next 14 days previews what's ahead, and the month arrows let you jump backwards or forwards to review or plan.",
        spot: "nav",
      },
    ],
  },
  {
    id: "reports",
    nav: "/admin/reports",
    title: "Reports — sales & marketing analytics",
    blurb: "KPIs, conversion funnel, source performance, campaign attribution and the team leaderboard.",
    liveHref: "/admin/reports",
    scene: ReportsScene,
    steps: [
      {
        chapter: "What it does",
        caption: "Reports turns all that activity into answers — what's working, what's not, and where the next deal is coming from.",
      },
      {
        chapter: "Time range",
        caption: "Pick a period — last 30 days, 90 days or a full year. Every number on the page recalculates for that window.",
        spot: "range",
      },
      {
        chapter: "KPIs",
        caption: "The four KPIs: new leads versus the previous period, win rate, revenue won, and how fast the team makes first contact — green means on target.",
        spot: "kpis",
      },
      {
        chapter: "Funnel",
        caption: "The conversion funnel shows where deals stall — if plenty get contacted but few qualify, that's where to coach.",
        spot: "funnel",
      },
      {
        chapter: "Weekly trend",
        caption: "Weekly bars reveal lead-flow trends over the whole period — spot a dip early and fix it before it becomes a quiet month.",
        spot: "weekly",
      },
      {
        chapter: "Sources",
        caption: "Sources rank where leads actually come from — with won-deal counts on each, so you invest in what converts, not just what fills the top.",
        spot: "sources",
      },
      {
        chapter: "Activity",
        caption: "The activity mix shows how the team spends its time — calls, emails, meetings and LinkedIn, all counted over the period.",
        spot: "activity",
      },
      {
        chapter: "Attribution",
        caption: "Campaign performance tracks UTM-tagged links — add ?utm_campaign= to any ad or post and the leads it generates appear here automatically.",
        spot: "campaigns",
      },
      {
        chapter: "Leaderboard",
        caption: "And the team leaderboard keeps it friendly — open deals, activities logged, wins and revenue per person.",
        spot: "team",
      },
    ],
  },
  {
    id: "admin",
    nav: "/admin/visitors",
    title: "Team & Visitors — super admin tools",
    blurb: "Super-admin only: manage user accounts and see who's actually browsing the website.",
    liveHref: "/admin/visitors",
    scene: AdminScene,
    steps: [
      {
        chapter: "Super admin",
        caption: "These two sections are super-admin only. Visitors shows real people on the website; Team manages who can access the CRM at all.",
        spot: "vstats",
      },
      {
        chapter: "Visitors table",
        caption: "Every visit is recorded — IP, location, device, ISP and pages viewed. Repeat visitors with lots of page views are warm prospects before they ever fill in a form.",
        spot: "vtable",
      },
      {
        chapter: "Live feed",
        caption: "The live feed shows the latest page views as they happen — pair it with the Browsing list in Outreach to call someone while they're on the site.",
        spot: "feed",
      },
      {
        chapter: "Team list",
        caption: "The team table lists every CRM user with their role and status — disable a leaver's account instantly without deleting their activity history.",
        spot: "teamtable",
      },
      {
        chapter: "Add employee",
        caption: "Add employee creates a login in seconds — they can sign in at /admin immediately and start working leads under their own name.",
        spot: "adduser",
      },
    ],
  },
];

export function getLesson(id: string | undefined) {
  return LESSONS.find((l) => l.id === id);
}
