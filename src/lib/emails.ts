import { site, socials } from "@/lib/content";

/*
 * Transactional email templates. Table layout + inline styles because
 * that is what Gmail, Outlook and Apple Mail render consistently.
 */

const BRAND = "#dc2626";
const INK = "#111827";
const MUTED = "#64748b";
const LINE = "#e5e7eb";
const SOFT = "#f8fafc";
const FONT = "'Segoe UI', Helvetica, Arial, sans-serif";

export type Enquiry = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
};

const esc = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const multiline = (s: string) => esc(s).replace(/\r?\n/g, "<br />");

const fullName = (e: Enquiry) => `${e.firstName} ${e.lastName}`.trim();

function button(href: string, label: string, primary = true) {
  return `<a href="${esc(href)}" style="display:inline-block;padding:13px 26px;border-radius:999px;font-family:${FONT};font-size:14px;font-weight:600;text-decoration:none;${
    primary
      ? `background:${BRAND};color:#ffffff;`
      : `background:#ffffff;color:${INK};border:1px solid ${LINE};`
  }">${esc(label)}</a>`;
}

/** Shared outer frame: preheader, logo header, card body, footer. */
function layout(opts: {
  origin: string;
  preheader: string;
  body: string;
  footerNote: string;
}) {
  const socialLinks = socials
    .map(
      (s) =>
        `<a href="${esc(s.href)}" style="color:${MUTED};text-decoration:none;margin:0 8px;">${esc(s.label)}</a>`
    )
    .join("&middot;");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="color-scheme" content="light" />
<title>${esc(site.name)}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(opts.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;">
<tr><td align="center" style="padding:32px 16px;">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;">
    <tr><td style="height:4px;background:${BRAND};border-radius:12px 12px 0 0;font-size:0;line-height:0;">&nbsp;</td></tr>
    <tr><td align="center" style="background:#ffffff;padding:28px 32px 20px;border-bottom:1px solid ${LINE};">
      <a href="${esc(opts.origin)}" style="text-decoration:none;">
        <img src="${esc(opts.origin)}/images/tcb-logo-2.png" width="200" height="60" alt="${esc(site.name)}" style="display:block;border:0;width:200px;height:60px;" />
      </a>
    </td></tr>
    <tr><td style="background:#ffffff;padding:36px 40px 40px;font-family:${FONT};color:${INK};border-radius:0 0 12px 12px;">
      ${opts.body}
    </td></tr>
    <tr><td align="center" style="padding:28px 24px 8px;font-family:${FONT};font-size:13px;line-height:20px;color:${MUTED};">
      <strong style="color:${INK};">${esc(site.name)}</strong><br />
      <a href="${esc(site.phoneHref)}" style="color:${MUTED};text-decoration:none;">${esc(site.phone)}</a>
      &nbsp;&middot;&nbsp;
      <a href="mailto:${esc(site.email)}" style="color:${MUTED};text-decoration:none;">${esc(site.email)}</a>
      <br /><span style="display:inline-block;margin-top:10px;">${socialLinks}</span>
    </td></tr>
    <tr><td align="center" style="padding:8px 24px 24px;font-family:${FONT};font-size:11px;line-height:17px;color:#94a3b8;">
      ${opts.footerNote}
    </td></tr>
  </table>
</td></tr>
</table>
</body>
</html>`;
}

/* ---------- confirmation to the person who filled in the form ---------- */

const steps = [
  {
    title: "We review your enquiry",
    body: "A specialist reads your details, usually within one working day.",
  },
  {
    title: "A quick call from an expert",
    body: "We'll call to understand your contract, day rate and what matters most to you. It takes about 10 minutes.",
  },
  {
    title: "Your tailored recommendation",
    body: "We compare vetted, fully compliant umbrella companies and recommend the best fit, with clear take-home pay figures.",
  },
  {
    title: "You choose, we handle the rest",
    body: "Once you decide, we help you get set up so you're paid on time from day one.",
  },
];

export function confirmationEmail(e: Enquiry, origin: string) {
  const first = e.firstName || "there";

  const stepRows = steps
    .map(
      (s, i) => `<tr>
  <td width="44" valign="top" style="padding:0 0 18px;">
    <div style="width:30px;height:30px;line-height:30px;border-radius:50%;background:${BRAND};color:#ffffff;font-family:${FONT};font-size:13px;font-weight:700;text-align:center;">${i + 1}</div>
  </td>
  <td valign="top" style="padding:3px 0 18px;font-family:${FONT};">
    <p style="margin:0;font-size:15px;font-weight:600;color:${INK};">${esc(s.title)}</p>
    <p style="margin:4px 0 0;font-size:14px;line-height:21px;color:${MUTED};">${esc(s.body)}</p>
  </td>
</tr>`
    )
    .join("");

  const summaryRows = [
    ["Name", fullName(e)],
    ["Email", e.email],
    ["Phone", e.phone || "Not provided"],
    ["Subject", e.subject || "General enquiry"],
  ]
    .map(
      ([k, v]) => `<tr>
  <td style="padding:6px 0;font-size:13px;color:${MUTED};width:90px;" valign="top">${k}</td>
  <td style="padding:6px 0;font-size:13px;color:${INK};font-weight:600;">${esc(v)}</td>
</tr>`
    )
    .join("");

  const body = `
<p style="margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${BRAND};">Enquiry received</p>
<h1 style="margin:0 0 16px;font-size:26px;line-height:34px;font-weight:800;color:${INK};">Thanks for getting in touch, ${esc(first)}.</h1>
<p style="margin:0 0 28px;font-size:15px;line-height:24px;color:#334155;">
  We've received your enquiry and one of our umbrella company specialists will be in touch shortly.
  Our service is <strong>completely free</strong>, with no obligation.
</p>

<h2 style="margin:0 0 18px;font-size:17px;font-weight:700;color:${INK};">What happens next</h2>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${stepRows}</table>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:10px 0 28px;background:${SOFT};border:1px solid ${LINE};border-radius:12px;">
<tr><td style="padding:20px 22px;font-family:${FONT};">
  <p style="margin:0 0 10px;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:${MUTED};">Your enquiry</p>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-family:${FONT};">${summaryRows}</table>
  ${
    e.message
      ? `<p style="margin:14px 0 0;padding-top:14px;border-top:1px solid ${LINE};font-size:14px;line-height:22px;color:#334155;">${multiline(e.message)}</p>`
      : ""
  }
</td></tr>
</table>

<p style="margin:0 0 18px;font-size:15px;line-height:24px;color:#334155;">
  Want to talk sooner? Call us on <a href="${esc(site.phoneHref)}" style="color:${BRAND};font-weight:600;text-decoration:none;">${esc(site.phone)}</a>
  or simply reply to this email.
</p>
<table role="presentation" cellpadding="0" cellspacing="0"><tr>
  <td style="padding:0 10px 10px 0;">${button(site.phoneHref, `Call ${site.phone}`)}</td>
  <td style="padding:0 0 10px;">${button(`${origin}/services`, "Explore our services", false)}</td>
</tr></table>

<p style="margin:28px 0 0;font-size:15px;line-height:24px;color:#334155;">
  Kind regards,<br />
  <strong style="color:${INK};">The team at ${esc(site.name)}</strong>
</p>`;

  return {
    subject: `Thanks for your enquiry, ${first} — here's what happens next`,
    html: layout({
      origin,
      preheader:
        "We've received your enquiry. Here's what happens next, and how to reach us sooner.",
      body,
      footerNote: `You're receiving this email because you submitted an enquiry on our website. If this wasn't you, please ignore this email or let us know at ${esc(site.email)}.`,
    }),
    text: [
      `Thanks for getting in touch, ${first}.`,
      "",
      "We've received your enquiry and one of our umbrella company specialists will be in touch shortly. Our service is completely free, with no obligation.",
      "",
      "WHAT HAPPENS NEXT",
      ...steps.map((s, i) => `${i + 1}. ${s.title}: ${s.body}`),
      "",
      "YOUR ENQUIRY",
      `Name: ${fullName(e)}`,
      `Email: ${e.email}`,
      `Phone: ${e.phone || "Not provided"}`,
      `Subject: ${e.subject || "General enquiry"}`,
      e.message ? `\n${e.message}` : "",
      "",
      `Want to talk sooner? Call ${site.phone} or reply to this email.`,
      "",
      "Kind regards,",
      `The team at ${site.name}`,
    ].join("\n"),
  };
}

/* ---------- internal notification to the TCB inbox ---------- */

const dateFmt = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/London",
});
const shortDate = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: "Europe/London",
});

export function notificationEmail(
  e: Enquiry,
  origin: string,
  leadId: number | null
) {
  const name = fullName(e) || e.email;
  const received = new Date();
  const chaseDate = new Date(received.getTime() + 7 * 24 * 60 * 60 * 1000);
  const telHref = e.phone ? `tel:${e.phone.replace(/[^\d+]/g, "")}` : "";
  const crmHref = leadId ? `${origin}/admin/leads/${leadId}` : `${origin}/admin/leads`;
  const replyHref = `mailto:${e.email}?subject=${encodeURIComponent(
    `Re: your enquiry to ${site.name}`
  )}`;

  const detailRows = [
    ["Name", esc(name)],
    [
      "Email",
      `<a href="mailto:${esc(e.email)}" style="color:${BRAND};text-decoration:none;">${esc(e.email)}</a>`,
    ],
    [
      "Phone",
      e.phone
        ? `<a href="${esc(telHref)}" style="color:${BRAND};text-decoration:none;">${esc(e.phone)}</a>`
        : `<span style="color:${MUTED};">Not provided</span>`,
    ],
    ["Subject", esc(e.subject || "General enquiry")],
    ["Received", esc(dateFmt.format(received))],
  ]
    .map(
      ([k, v], i) => `<tr>
  <td style="padding:12px 16px;font-size:13px;color:${MUTED};width:110px;${i ? `border-top:1px solid ${LINE};` : ""}" valign="top">${k}</td>
  <td style="padding:12px 16px;font-size:14px;color:${INK};font-weight:600;${i ? `border-top:1px solid ${LINE};` : ""}">${v}</td>
</tr>`
    )
    .join("");

  const buttons = [
    button(replyHref, `Reply to ${e.firstName || "lead"}`),
    e.phone ? button(telHref, "Call now", false) : "",
    button(crmHref, "Open in CRM", false),
  ]
    .filter(Boolean)
    .map((b) => `<td style="padding:0 10px 10px 0;">${b}</td>`)
    .join("");

  const body = `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
  <td>
    <p style="margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${BRAND};">New website enquiry</p>
    <h1 style="margin:0;font-size:24px;line-height:32px;font-weight:800;color:${INK};">${esc(name)}</h1>
  </td>
  <td align="right" valign="top">
    <span style="display:inline-block;padding:6px 12px;border-radius:999px;background:#eff6ff;color:#1d4ed8;font-size:12px;font-weight:700;">New lead</span>
  </td>
</tr></table>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;border:1px solid ${LINE};border-radius:12px;font-family:${FONT};">
${detailRows}
</table>

<p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:${MUTED};">Message</p>
<div style="margin:0 0 26px;padding:18px 20px;background:${SOFT};border-left:4px solid ${BRAND};border-radius:0 10px 10px 0;font-size:15px;line-height:24px;color:#334155;">
  ${e.message ? multiline(e.message) : `<span style="color:${MUTED};">No message provided.</span>`}
</div>

<table role="presentation" cellpadding="0" cellspacing="0"><tr>${buttons}</tr></table>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:22px;background:#fffbeb;border:1px solid #fde68a;border-radius:10px;">
<tr><td style="padding:14px 18px;font-family:${FONT};font-size:13px;line-height:20px;color:#92400e;">
  <strong>Next steps:</strong> aim to respond within 24 hours, then assign the lead and log the outcome in the CRM.
  An automatic chase-up is booked for <strong>${esc(shortDate.format(chaseDate))}</strong> if the lead is still marked New.
  The customer has been sent a confirmation email.
</td></tr>
</table>`;

  return {
    subject: `New enquiry: ${name}${e.subject ? ` — ${e.subject}` : ""}`,
    html: layout({
      origin,
      preheader: `${name}${e.phone ? ` · ${e.phone}` : ""} · ${e.message.slice(0, 90)}`,
      body,
      footerNote:
        "Internal notification from the website contact form. Replying to this email goes directly to the customer.",
    }),
    text: [
      "NEW WEBSITE ENQUIRY",
      "",
      `Name: ${name}`,
      `Email: ${e.email}`,
      `Phone: ${e.phone || "Not provided"}`,
      `Subject: ${e.subject || "General enquiry"}`,
      `Received: ${dateFmt.format(received)}`,
      "",
      "MESSAGE",
      e.message || "No message provided.",
      "",
      `Open in CRM: ${crmHref}`,
      `Automatic chase-up booked for ${shortDate.format(chaseDate)}.`,
    ].join("\n"),
  };
}

/* ---------- one-to-one sales email sent from the CRM ---------- */

export function salesEmail(opts: {
  body: string;
  origin: string;
  senderName: string;
  senderEmail: string;
}) {
  const paragraphs = opts.body
    .trim()
    .split(/\n{2,}/)
    .map(
      (p) =>
        `<p style="margin:0 0 16px;font-size:15px;line-height:24px;color:#334155;">${multiline(p)}</p>`
    )
    .join("");

  const body = `${paragraphs}
<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:12px;border-top:1px solid ${LINE};">
<tr><td style="padding-top:16px;font-family:${FONT};font-size:13px;line-height:20px;color:${MUTED};">
  <strong style="color:${INK};">${esc(opts.senderName)}</strong><br />
  ${esc(site.name)}<br />
  <a href="mailto:${esc(opts.senderEmail)}" style="color:${BRAND};text-decoration:none;">${esc(opts.senderEmail)}</a>
  &nbsp;&middot;&nbsp;
  <a href="${esc(site.phoneHref)}" style="color:${BRAND};text-decoration:none;">${esc(site.phone)}</a>
</td></tr>
</table>`;

  return {
    html: layout({
      origin: opts.origin,
      preheader: opts.body.replace(/\s+/g, " ").slice(0, 110),
      body,
      footerNote: `Sent by ${esc(opts.senderName)} at ${esc(site.name)}. Simply reply to this email to get in touch.`,
    }),
    text: `${opts.body.trim()}\n\n--\n${opts.senderName}\n${site.name}\n${opts.senderEmail} · ${site.phone}`,
  };
}

/* ---------- newsletter signup (internal) ---------- */

export function newsletterNotification(email: string, origin: string) {
  const body = `
<p style="margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${BRAND};">Newsletter signup</p>
<h1 style="margin:0 0 16px;font-size:24px;line-height:32px;font-weight:800;color:${INK};">${esc(email)}</h1>
<p style="margin:0 0 24px;font-size:15px;line-height:24px;color:#334155;">
  A new subscriber joined the mailing list on ${esc(dateFmt.format(new Date()))}.
</p>
${button(`${origin}/admin/leads`, "View in CRM")}`;

  return {
    subject: `Newsletter signup: ${email}`,
    html: layout({
      origin,
      preheader: `${email} subscribed to the newsletter`,
      body,
      footerNote: "Internal notification from the website newsletter form.",
    }),
    text: `New newsletter signup\n\nEmail: ${email}\n\nView in CRM: ${origin}/admin/leads`,
  };
}
