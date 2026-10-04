import Image from "next/image";
import Link from "next/link";
import { navLinks, site, socials } from "@/lib/content";
import NewsletterForm from "@/components/NewsletterForm";
import SocialIcon from "@/components/SocialIcon";

const footerServices = [
  "Tax Compliance",
  "Payroll Management",
  "Pension and Benefits",
  "Support and Advice",
];

export default function Footer() {
  return (
    <footer className="bg-ink text-white">
      <div className="mx-auto grid max-w-site gap-12 px-6 py-16 text-center md:grid-cols-2 md:text-left lg:grid-cols-4">
        <div>
          <h3 className="mb-4 text-lg font-semibold">About Us</h3>
          <p className="text-sm leading-relaxed text-slate-300">
            At The Contractor Broker, we simplify contractor payments and ensure
            full compliance with expert support and reliable services.
          </p>
          <div className="mt-5 flex justify-center gap-3 md:justify-start">
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-brand"
              >
                <SocialIcon name={s.icon} className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-4 text-lg font-semibold">Quick Links</h3>
          <ul className="space-y-2 text-sm text-slate-300">
            {navLinks
              .filter((l) => l.href !== "/")
              .map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="transition-colors hover:text-brand-light">
                    {l.label}
                  </Link>
                </li>
              ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-lg font-semibold">Services</h3>
          <ul className="space-y-2 text-sm text-slate-300">
            {footerServices.map((s) => (
              <li key={s}>
                <Link href="/services" className="transition-colors hover:text-brand-light">
                  {s}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-lg font-semibold">Stay in Touch</h3>
          <NewsletterForm />
          <p className="mt-3 text-xs text-slate-400">
            Please send us an email to ask for further information or advice
            about our services.
          </p>
          <p className="mt-4 text-sm text-slate-300">
            <a href={`mailto:${site.email}`} className="hover:text-brand-light">
              {site.email}
            </a>
            <br />
            <a href={site.phoneHref} className="hover:text-brand-light">
              {site.phone}
            </a>
          </p>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-site flex-col items-center justify-between gap-3 px-6 py-5 text-center text-xs text-slate-400 sm:flex-row sm:text-left">
          <p>
            Copyright © {new Date().getFullYear()} {site.name}. All rights
            reserved.
          </p>
          <div className="flex gap-6">
            <Link href="/privacy-policy" className="hover:text-brand-light">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-brand-light">
              Terms and Conditions
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
