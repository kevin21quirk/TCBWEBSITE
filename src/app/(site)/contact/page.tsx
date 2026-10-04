import type { Metadata } from "next";
import ContactForm from "@/components/ContactForm";
import PageHero from "@/components/PageHero";
import SocialIcon from "@/components/SocialIcon";
import { site, socials } from "@/lib/content";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with The Contractor Broker — our team is here to answer your questions and support your contracting needs.",
};

export default function ContactPage() {
  return (
    <>
      <PageHero title="Contact Us" image="/images/download-42.webp" centered />

      <section className="mx-auto max-w-site px-6 py-20">
        <div className="grid gap-12 lg:grid-cols-[360px_1fr]">
          <aside className="space-y-6">
            <div className="rounded-tcb border border-slate-200 bg-white p-8">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-brand">
                Email Address
              </h2>
              <a
                href={`mailto:${site.email}`}
                className="mt-2 block break-all font-semibold text-ink hover:text-brand"
              >
                {site.email}
              </a>
            </div>
            <div className="rounded-tcb border border-slate-200 bg-white p-8">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-brand">
                Phone Number
              </h2>
              <a
                href={site.phoneHref}
                className="mt-2 block font-semibold text-ink hover:text-brand"
              >
                {site.phone}
              </a>
            </div>
            <div className="rounded-tcb border border-slate-200 bg-white p-8">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-brand">
                Follow Us on Social Media
              </h2>
              <div className="mt-4 flex gap-3">
                {socials.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-ink transition-colors hover:bg-brand hover:text-white"
                  >
                    <SocialIcon name={s.icon} className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>
          </aside>

          <div id="contact-details" className="rounded-tcb bg-slate-50 p-8 md:p-10">
            <h2 className="text-2xl font-bold text-ink">Send Us a Message</h2>
            <p className="mt-2 text-sm text-muted">
              Fill in the form below and one of our experts will be in touch —
              usually within 24 hours.
            </p>
            <div className="mt-8">
              <ContactForm />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
