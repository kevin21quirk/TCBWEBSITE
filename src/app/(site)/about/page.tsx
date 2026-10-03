import Link from "next/link";
import type { Metadata } from "next";
import CtaBand from "@/components/CtaBand";
import PageHero from "@/components/PageHero";
import SectionHeading from "@/components/SectionHeading";
import { audiences } from "@/lib/content";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Empowering contractors and agencies to thrive effortlessly with tailored support and expert umbrella brokerage solutions.",
};

const highlights = [
  { title: "Decades", subtitle: "of Experience" },
  { title: "Friendly", subtitle: "Staff" },
  { title: "Trusted", subtitle: "Partner" },
];

export default function AboutPage() {
  return (
    <>
      <PageHero eyebrow="About Us" title="About Us" />

      {/* Highlights */}
      <section className="mx-auto max-w-site px-6 py-20">
        <div className="grid gap-6 md:grid-cols-3">
          {highlights.map((h) => (
            <div
              key={h.title}
              className="rounded-tcb border-2 border-dashed border-slate-300 bg-white p-10 text-center transition-colors hover:border-brand"
            >
              <p className="text-3xl font-extrabold text-brand">{h.title}</p>
              <p className="mt-1 text-sm font-medium uppercase tracking-wide text-muted">
                {h.subtitle}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* About us */}
      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-site px-6">
          <div className="grid items-start gap-12 lg:grid-cols-2">
            <SectionHeading
              align="left"
              eyebrow="About us"
              title="Empowering contractors and agencies to thrive effortlessly."
              description="Providing tailored support and expert solutions to ensure contractors and individuals excel in their careers with confidence and ease."
            />
            <SectionHeading
              align="left"
              eyebrow="Our Market"
              title="Shaping solutions with a unique approach"
              description="Delivering tailored solutions with innovation and expertise, designed to meet the unique needs of our clients."
            />
          </div>
          <Link
            href="/services"
            className="mt-8 inline-block rounded-full bg-brand px-8 py-3.5 text-sm font-semibold uppercase tracking-wide text-white transition-colors hover:bg-brand-dark"
          >
            Learn More
          </Link>
        </div>
      </section>

      {/* Who we work with */}
      <section className="mx-auto max-w-site px-6 py-20">
        <SectionHeading
          eyebrow="Who We Work With"
          title="Supporting every kind of contractor"
        />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {audiences.map((a) => (
            <div
              key={a}
              className="flex items-center gap-4 rounded-tcb border border-slate-200 bg-white p-6 transition-colors hover:border-brand"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand text-white">
                ✓
              </span>
              <p className="font-semibold text-ink">{a}</p>
            </div>
          ))}
        </div>
      </section>

      <CtaBand />
    </>
  );
}
