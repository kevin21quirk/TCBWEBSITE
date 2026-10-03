import Image from "next/image";
import type { Metadata } from "next";
import CtaBand from "@/components/CtaBand";
import PageHero from "@/components/PageHero";
import SectionHeading from "@/components/SectionHeading";
import Testimonials from "@/components/Testimonials";
import { allServices } from "@/lib/content";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Explore our comprehensive range of umbrella brokerage services — payroll solutions, IR35 compliance, onboarding, pension management and more.",
};

const whyChooseUs = [
  {
    title: "25+ Years Combined Experience",
    description:
      "Our team's combined industry knowledge means we've seen it all — and we know exactly which umbrella solution fits your situation.",
  },
  {
    title: "100% Free Service",
    description:
      "Our comparison and brokerage service costs you nothing. We don't take any fees from your pay — ever.",
  },
  {
    title: "Compliance First",
    description:
      "Every umbrella company we recommend is vetted for HMRC compliance, so you can contract with complete peace of mind.",
  },
];

const stats = [
  { value: "25+", label: "Years Combined Experience" },
  { value: "20+", label: "Expert Services" },
  { value: "24h", label: "Fast Onboarding" },
  { value: "100%", label: "Free Service" },
];

export default function ServicesPage() {
  return (
    <>
      <PageHero
        eyebrow="Services"
        title="Our Services"
        description="Explore how our tailored solutions can simplify your work, ensure compliance, and bring peace of mind to your life."
      />

      {/* Intro + image */}
      <section className="mx-auto max-w-site px-6 py-20">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <SectionHeading
              align="left"
              eyebrow="Our Services"
              title="We Simplify Contractor Payments and Ensure Compliance with Expert Support"
              description="Take a moment to explore our comprehensive range of services designed to simplify your contractor management, ensure tax compliance, and provide expert payroll solutions. Find the support that works best for you."
            />
          </div>
          <Image
            src="/images/download-48.webp"
            alt="Contractor reviewing umbrella company service options"
            width={1856}
            height={2304}
            className="w-full rounded-tcb object-cover"
          />
        </div>
      </section>

      {/* All services */}
      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-site px-6">
          <SectionHeading
            eyebrow="What We Offer"
            title="Expert services tailored to you"
          />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {allServices.map((s, i) => (
              <div
                key={s.title}
                className="rounded-tcb border border-slate-200 bg-white p-7 transition-colors hover:border-brand"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
                  {i + 1}
                </span>
                <h3 className="mt-4 font-semibold text-ink">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {s.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why choose us */}
      <section className="mx-auto max-w-site px-6 py-20">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <Image
            src="/images/download-47.webp"
            alt="The Contractor Broker team supporting contractors and agencies"
            width={1856}
            height={2304}
            className="w-full rounded-tcb object-cover"
          />
          <div>
            <SectionHeading
              align="left"
              eyebrow="Why Choose Us?"
              title="Commitment to Superior Quality and Results"
            />
            <div className="mt-8 space-y-6">
              {whyChooseUs.map((f) => (
                <div key={f.title} className="flex gap-4">
                  <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-white">
                    ✓
                  </span>
                  <div>
                    <h3 className="font-semibold text-ink">{f.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted">
                      {f.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-2 gap-6 rounded-tcb bg-ink px-8 py-10 text-center lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="text-3xl font-extrabold text-brand-light md:text-4xl">
                {s.value}
              </p>
              <p className="mt-1 text-sm text-slate-300">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-site px-6">
          <SectionHeading eyebrow="Testimonials" title="What Clients Say About Us" />
          <div className="mt-12">
            <Testimonials />
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
