import Image from "next/image";
import type { Metadata } from "next";
import CtaBand from "@/components/CtaBand";
import FaqAccordion from "@/components/FaqAccordion";
import PageHero from "@/components/PageHero";
import SectionHeading from "@/components/SectionHeading";
import { agencyFaqs, contractorFaqs, generalFaqs } from "@/lib/content";

export const metadata: Metadata = {
  title: "FAQs",
  description:
    "Answers to common questions about umbrella companies, IR35, payroll and how The Contractor Broker works.",
};

export default function FaqsPage() {
  return (
    <>
      <PageHero title="FAQs" image="/images/download-43.webp" centered />

      <section className="mx-auto max-w-site px-6 py-20">
        <div className="grid items-start gap-12 lg:grid-cols-[1fr_360px]">
          <div className="space-y-14">
            <div>
              <SectionHeading
                align="left"
                eyebrow="Contractors"
                title="Questions from contractors"
              />
              <div className="mt-8">
                <FaqAccordion items={contractorFaqs} />
              </div>
            </div>
            <div>
              <SectionHeading
                align="left"
                eyebrow="Agencies"
                title="Questions from agencies"
              />
              <div className="mt-8">
                <FaqAccordion items={agencyFaqs} />
              </div>
            </div>
            <div>
              <SectionHeading
                align="left"
                eyebrow="General Questions"
                title="Frequently asked questions"
              />
              <div className="mt-8">
                <FaqAccordion items={generalFaqs} />
              </div>
            </div>
          </div>

          <aside className="sticky top-24 hidden lg:block">
            <Image
              src="/images/download-44.webp"
              alt="Contractor getting answers about umbrella companies"
              width={1080}
              height={1080}
              className="w-full rounded-tcb object-cover"
            />
            <blockquote className="mt-6 rounded-tcb bg-ink p-6 text-sm leading-relaxed text-slate-200">
              “Knowing the answers isn’t enough; understanding the questions is
              what truly drives success.”
            </blockquote>
          </aside>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
