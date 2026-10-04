import Image from "next/image";
import type { Metadata } from "next";
import CtaBand from "@/components/CtaBand";
import HashHighlight from "@/components/HashHighlight";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import SectionHeading from "@/components/SectionHeading";
import Testimonials from "@/components/Testimonials";
import { allServices, slugify } from "@/lib/content";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Explore our comprehensive range of umbrella brokerage services — payroll solutions, IR35 compliance, onboarding, pension management and more.",
};

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-3 text-sm text-brand">
      {children}
      <svg
        className="h-3 w-20"
        viewBox="0 0 80 12"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M1 6c2.5-4 5-4 7.5 0s5 4 7.5 0 5-4 7.5 0 5 4 7.5 0 5-4 7.5 0 5 4 7.5 0 5-4 7.5 0 5 4 7.5 0 5-4 7.5 0 5 4 7.5 0"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
      </svg>
    </p>
  );
}

export default function ServicesPage() {
  return (
    <>
      <HashHighlight />
      <PageHero
        title="Services"
        image="/images/download-45.webp"
        centered
      />

      {/* Unlock the benefits */}
      <section className="mx-auto max-w-site px-6 py-16">
        <div className="relative grid items-center lg:grid-cols-[1fr_1fr]">
          <Image
            src="/images/download-46.webp"
            alt="Contractor and adviser reviewing umbrella company paperwork together"
            width={1080}
            height={1080}
            className="aspect-[5/4] w-full object-cover"
          />
          <div className="relative bg-white px-2 py-8 lg:-ml-6 lg:px-6 lg:py-10">
            <Reveal direction="top">
              <Eyebrow>Our Services</Eyebrow>
            </Reveal>
            <Reveal direction="top" delay={150}>
              <h2 className="mt-5 max-w-md text-3xl font-bold leading-tight text-brand md:text-4xl">
                Unlock the Benefits of Our Services
              </h2>
            </Reveal>
            <Reveal direction="top" delay={300}>
              <p className="mt-6 max-w-md text-sm leading-relaxed text-slate-500">
                Explore how our tailored solutions can simplify your work,
                ensure compliance, and bring peace of mind to your life.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* We simplify + all services */}
      <section className="mx-auto max-w-site px-6 py-16">
        <div className="grid gap-12 lg:grid-cols-[2fr_3fr] lg:gap-20">
          <div className="flex flex-col">
            <Eyebrow>Our Services</Eyebrow>
            <h2 className="mt-6 text-4xl font-bold leading-tight text-brand md:text-5xl">
              We Simplify Contractor Payments and Ensure Compliance with
              Expert Support
            </h2>
            <p className="mt-8 text-sm leading-relaxed text-slate-500">
              Take a moment to explore our comprehensive range of services
              designed to simplify your contractor management, ensure tax
              compliance, and provide expert payroll solutions. Find the
              support that works best for you.
            </p>
            <div className="mt-10 space-y-4">
              <Image
                src="/images/download-48.webp"
                alt="Contractors from construction, office and healthcare roles standing together"
                width={1856}
                height={2304}
                className="w-full object-cover"
              />
              <Image
                src="/images/download-47.webp"
                alt="Icons representing payroll, compliance and contractor services"
                width={1856}
                height={2304}
                className="w-full object-cover"
              />
            </div>
            <Image
              src="/images/tcb-logo-2-1.png"
              alt="The Contractor Broker"
              width={300}
              height={90}
              className="mt-auto w-full px-4 pt-10"
            />
          </div>

          <div className="grid content-between gap-x-8 gap-y-12 sm:grid-cols-2">
            {allServices.map((s, i) => (
              <Reveal
                key={s.title}
                id={slugify(s.title)}
                direction="top"
                delay={(i % 2) * 150}
                className="scroll-mt-36"
              >
                <h3 className="text-xl font-bold leading-snug text-brand">
                  {i + 1}. {s.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-500">
                  {s.description}
                </p>
              </Reveal>
            ))}
          </div>
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
