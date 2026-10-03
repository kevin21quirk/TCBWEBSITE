import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import { site } from "@/lib/content";

export const metadata: Metadata = {
  title: "Terms and Conditions",
};

const sections = [
  {
    title: "1. Acceptance of Terms",
    body: "By using the Services, you confirm that you have read, understood, and agree to these Terms and Conditions. If you do not agree, you must not use the Services.",
  },
  {
    title: "2. Changes to Terms",
    body: "We reserve the right to update or modify these Terms at any time without prior notice. It is your responsibility to review the Terms periodically for changes. Your continued use of the Services constitutes acceptance of the updated Terms.",
  },
  {
    title: "3. Eligibility",
    body: "To use our Services, you must be at least 18 years old and provide accurate and complete information during registration or when using the Services.",
  },
  {
    title: "4. Services Offered",
    body: "The Contractor Broker provides umbrella brokerage services, connecting contractors with umbrella companies that suit their specific needs. All services are subject to availability and may be modified or discontinued without prior notice.",
  },
  {
    title: "5. User Obligations",
    body: "When using our Services, you agree to use the Services lawfully and ethically, not engage in activities that may harm our reputation, infrastructure, or other users, and provide accurate and truthful information when requested.",
  },
  {
    title: "6. Fees and Payments",
    body: "If applicable, all payments for our Services must be made in accordance with the pricing and payment terms outlined on our website or agreed upon in writing. Late payments may incur penalties or result in the suspension of Services.",
  },
  {
    title: "7. Intellectual Property",
    body: "All content on our website, including text, graphics, logos, and software, is owned by or licensed to us and is protected by intellectual property laws. You may not reproduce, distribute, or otherwise use this content without our written permission.",
  },
  {
    title: "8. Disclaimer of Warranties",
    body: "Our Services are provided on an “as is” and “as available” basis. We do not guarantee that the Services will be uninterrupted, error-free, or suitable for your specific needs.",
  },
  {
    title: "9. Limitation of Liability",
    body: "To the maximum extent permitted by law, The Contractor Broker shall not be liable for any direct, indirect, incidental, consequential, or punitive damages arising out of your use of the Services.",
  },
  {
    title: "10. Termination",
    body: "We may suspend or terminate your access to the Services at any time if you breach these Terms.",
  },
  {
    title: "11. Privacy",
    body: "Your use of the Services is also governed by our Privacy Policy, which explains how we collect, use, and protect your personal information.",
  },
  {
    title: "12. Governing Law",
    body: "These Terms are governed by and construed in accordance with the laws of the United Kingdom. Any disputes shall be subject to the exclusive jurisdiction of the courts in the UK.",
  },
];

export default function TermsPage() {
  return (
    <>
      <PageHero eyebrow="Legal" title="Terms and Conditions" />
      <section className="mx-auto max-w-3xl px-6 py-16">
        <p className="leading-relaxed text-muted">
          Welcome to{" "}
          <strong className="text-ink">The Contractor Broker</strong> (“we,”
          “our,” “us”). These Terms and Conditions govern your use of our
          website, services, and any associated content (collectively referred
          to as the “Services”). By accessing or using the Services, you agree
          to comply with these terms.
        </p>
        <div className="mt-10 space-y-10">
          {sections.map((s) => (
            <div key={s.title}>
              <h2 className="text-xl font-bold text-ink">{s.title}</h2>
              <p className="mt-3 leading-relaxed text-muted">{s.body}</p>
            </div>
          ))}
          <div>
            <h2 className="text-xl font-bold text-ink">13. Contact Us</h2>
            <p className="mt-3 leading-relaxed text-muted">
              If you have any questions about these Terms and Conditions, please
              contact us at:
              <br />
              <strong>Email:</strong>{" "}
              <a
                href={`mailto:${site.email}`}
                className="text-brand hover:underline"
              >
                {site.email}
              </a>
              <br />
              <strong>Phone:</strong>{" "}
              <a href={site.phoneHref} className="text-brand hover:underline">
                {site.phone}
              </a>
            </p>
          </div>
        </div>
        <p className="mt-10 leading-relaxed text-muted">
          By using our Services, you confirm your acceptance of these Terms and
          Conditions. Thank you for choosing{" "}
          <strong className="text-ink">The Contractor Broker</strong>.
        </p>
      </section>
    </>
  );
}
