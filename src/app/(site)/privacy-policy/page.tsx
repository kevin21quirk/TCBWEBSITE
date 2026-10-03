import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import { site } from "@/lib/content";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

const sections = [
  {
    title: "1. Information We Collect",
    body: (
      <>
        <h4 className="mt-4 font-semibold text-ink">a. Personal Information</h4>
        <ul className="mt-2 list-disc space-y-1 pl-6">
          <li>Name, email address, phone number, postal address.</li>
          <li>Employment details (e.g., job title, industry).</li>
          <li>Payment and billing information (if applicable).</li>
        </ul>
        <h4 className="mt-4 font-semibold text-ink">
          b. Non-Personal Information
        </h4>
        <ul className="mt-2 list-disc space-y-1 pl-6">
          <li>Browser type, operating system, and device information.</li>
          <li>IP address and location data.</li>
          <li>Usage data (e.g., pages viewed, time spent on the website).</li>
        </ul>
      </>
    ),
  },
  {
    title: "2. How We Use Your Information",
    body: (
      <ul className="list-disc space-y-1 pl-6">
        <li>Provide and improve our services.</li>
        <li>Respond to your enquiries and support requests.</li>
        <li>Process payments and manage accounts.</li>
        <li>
          Send you updates, offers, or promotional material (with your consent).
        </li>
        <li>Comply with legal obligations.</li>
      </ul>
    ),
  },
  {
    title: "3. Sharing Your Information",
    body: (
      <>
        <p>
          We will never sell your personal information. However, we may share
          your data with:
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-6">
          <li>
            <strong>Service providers:</strong> Third-party companies that
            assist with payment processing, IT support, or marketing.
          </li>
          <li>
            <strong>Legal authorities:</strong> When required by law or to
            protect our rights and interests.
          </li>
          <li>
            <strong>Umbrella companies:</strong> To match you with appropriate
            services, with your consent.
          </li>
        </ul>
      </>
    ),
  },
  {
    title: "4. Data Retention",
    body: (
      <p>
        We retain your information only for as long as necessary to provide our
        services or comply with legal requirements. When no longer needed, your
        data will be securely deleted.
      </p>
    ),
  },
  {
    title: "5. Your Rights",
    body: (
      <>
        <p>You have the right to:</p>
        <ul className="mt-2 list-disc space-y-1 pl-6">
          <li>Access the personal data we hold about you.</li>
          <li>Request corrections or updates to your information.</li>
          <li>
            Request the deletion of your data, subject to legal or contractual
            obligations.
          </li>
          <li>Opt out of marketing communications at any time.</li>
        </ul>
        <p className="mt-2">
          To exercise your rights, contact us at{" "}
          <a href={`mailto:${site.email}`} className="text-brand hover:underline">
            {site.email}
          </a>
          .
        </p>
      </>
    ),
  },
  {
    title: "6. Cookies and Tracking Technologies",
    body: (
      <>
        <p>
          We use cookies to enhance your browsing experience. These small files
          are stored on your device and help us:
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-6">
          <li>Analyse website usage to improve functionality.</li>
          <li>Remember your preferences for future visits.</li>
        </ul>
        <p className="mt-2">
          You can manage cookie preferences through your browser settings.
        </p>
      </>
    ),
  },
  {
    title: "7. Data Security",
    body: (
      <p>
        We take appropriate technical and organisational measures to protect
        your personal data from unauthorised access, loss, or misuse. However,
        no system is completely secure, and we cannot guarantee absolute
        security.
      </p>
    ),
  },
  {
    title: "8. Third-Party Links",
    body: (
      <p>
        Our website may contain links to external websites. We are not
        responsible for the privacy practices or content of third-party sites.
        Please review their privacy policies before providing any personal
        information.
      </p>
    ),
  },
  {
    title: "9. Children’s Privacy",
    body: (
      <p>
        Our services are not intended for individuals under the age of 18. We do
        not knowingly collect data from minors.
      </p>
    ),
  },
  {
    title: "10. Changes to This Policy",
    body: (
      <p>
        We may update this Privacy Policy from time to time. Any changes will be
        posted on this page, and significant updates may be communicated via
        email or a website notice.
      </p>
    ),
  },
  {
    title: "11. Contact Us",
    body: (
      <p>
        If you have any questions or concerns about this Privacy Policy, please
        contact us:
        <br />
        <strong>Email:</strong>{" "}
        <a href={`mailto:${site.email}`} className="text-brand hover:underline">
          {site.email}
        </a>
        <br />
        <strong>Phone:</strong>{" "}
        <a href={site.phoneHref} className="text-brand hover:underline">
          {site.phone}
        </a>
      </p>
    ),
  },
];

export default function PrivacyPolicyPage() {
  return (
    <>
      <PageHero eyebrow="Legal" title="Privacy Policy" />
      <section className="mx-auto max-w-3xl px-6 py-16">
        <p className="leading-relaxed text-muted">
          <strong className="text-ink">The Contractor Broker</strong> (“we,”
          “our,” “us”) is committed to protecting your privacy. This Privacy
          Policy explains how we collect, use, and safeguard your personal
          information when you use our website, services, or interact with us.
          By using our services, you consent to the practices described in this
          policy.
        </p>
        <div className="mt-10 space-y-10">
          {sections.map((s) => (
            <div key={s.title}>
              <h2 className="text-xl font-bold text-ink">{s.title}</h2>
              <div className="mt-3 leading-relaxed text-muted">{s.body}</div>
            </div>
          ))}
        </div>
        <p className="mt-10 leading-relaxed text-muted">
          By using our services, you agree to the collection and use of
          information as outlined in this Privacy Policy. Thank you for trusting{" "}
          <strong className="text-ink">The Contractor Broker</strong>.
        </p>
      </section>
    </>
  );
}
