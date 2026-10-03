# The Contractor Broker — Website

App-based rebuild of thecontractorbroker.com (formerly WordPress) using
**Next.js 16 (App Router) + React 19 + Tailwind CSS**.

## Develop

```bash
npm install
npm run dev        # http://localhost:3000
```

## Build / deploy

```bash
npm run build
npm start          # or deploy to Vercel — zero config needed
```

## Contact & newsletter forms

Both forms POST to `/api/contact`. To send real email:

1. Create a [Resend](https://resend.com) account and verify your domain.
2. Copy `.env.example` to `.env.local` and set `RESEND_API_KEY`,
   `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`.

Without `RESEND_API_KEY`, submissions are logged to the server console instead
(useful for local development). A hidden honeypot field provides basic spam
protection; add Turnstile/reCAPTCHA if spam becomes an issue.

## Structure

```
src/
  app/
    page.tsx              Home
    services/             All 20 services
    industries/           9 industry sections
    about/ faqs/ contact/ privacy-policy/ terms/
    api/contact/route.ts  Form handler (Resend email)
  components/             Header, Footer, PageHero, CtaBand, ContactForm,
                          NewsletterForm, FaqAccordion, Testimonials,
                          ChatButton, SectionHeading, SocialIcon
  lib/content.ts          All copy/data in one place — edit text here
public/images/            Assets migrated from the WordPress media library
```

## Notes

- Brand colour: `#dc2626` (`brand` in `tailwind.config.ts`); font: Poppins.
- The NEC Birmingham 2025 expo popup from the old site was intentionally left
  out (event has passed) — re-add via a small client component if needed.
