import Image from "next/image";
import type { Metadata } from "next";
import CtaBand from "@/components/CtaBand";
import PageHero from "@/components/PageHero";
import SectionHeading from "@/components/SectionHeading";
import Testimonials from "@/components/Testimonials";
import { industries } from "@/lib/content";

export const metadata: Metadata = {
  title: "Industries",
  description:
    "Supporting all industries with expert umbrella services and contracting solutions tailored to your needs.",
};

export default function IndustriesPage() {
  return (
    <>
      <PageHero
        eyebrow="Industries"
        title="Industries We Support"
        description="Supporting all industries with expert umbrella services and contracting solutions tailored to your needs."
      />

      <section className="mx-auto max-w-site px-6 py-20">
        <div className="space-y-20">
          {industries.map((ind, i) => (
            <div
              key={ind.title}
              className={`grid items-center gap-10 lg:grid-cols-2 ${
                i % 2 === 1 ? "lg:[&>*:first-child]:order-2" : ""
              }`}
            >
              <Image
                src={ind.image}
                alt={ind.title}
                width={1080}
                height={1080}
                className="w-full rounded-tcb object-cover"
              />
              <div>
                <h2 className="text-2xl font-bold text-ink md:text-3xl">
                  {ind.title}
                </h2>
                <div className="mt-4 space-y-4 leading-relaxed text-muted">
                  {ind.paragraphs.map((p, j) => (
                    <p key={j}>{p}</p>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-site px-6">
          <SectionHeading title="See What Our Clients Say" />
          <div className="mt-12">
            <Testimonials />
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
