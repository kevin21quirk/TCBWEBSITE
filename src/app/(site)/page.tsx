import Image from "next/image";
import Link from "next/link";
import Counter from "@/components/Counter";
import CtaBand from "@/components/CtaBand";
import BrandIntro from "@/components/BrandIntro";
import HeroShutter from "@/components/HeroShutter";
import Jurisdictions from "@/components/Jurisdictions";
import Magnetic from "@/components/Magnetic";
import Parallax from "@/components/Parallax";
import Reveal from "@/components/Reveal";
import RotatingWord from "@/components/RotatingWord";
import ScrollStory from "@/components/ScrollStory";
import SectionHeading from "@/components/SectionHeading";
import Testimonials from "@/components/Testimonials";
import Ticker from "@/components/Ticker";
import Tilt from "@/components/Tilt";
import { heroCards, homeServices, site } from "@/lib/content";

const heroStats = [
  { value: 25, suffix: "+", label: "Years Experience" },
  { value: 100, suffix: "%", label: "Free Service" },
  { value: 24, suffix: "h", label: "Fast Onboarding" },
];

const marqueeWords = [
  "The Contractor Broker",
  "Umbrella Solutions",
  "IR35 Experts",
  "Payroll Made Simple",
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden rounded-b-[32px] border-b-4 border-brand">
        <HeroShutter />
        <BrandIntro />
        <div
          className="absolute inset-0 bg-cover bg-center md:bg-fixed"
          style={{
            backgroundImage: "url(/images/two-people-in-a-room.webp)",
          }}
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 bg-gradient-to-b from-ink/60 via-slate-900/30 to-ink/70"
          aria-hidden="true"
        />
        {/* aurora orbs */}
        <div
          className="animate-aurora absolute -left-24 top-1/4 h-80 w-80 rounded-full bg-brand/30 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="animate-aurora absolute -right-20 bottom-10 h-96 w-96 rounded-full bg-orange-500/20 blur-3xl [animation-delay:-6s]"
          aria-hidden="true"
        />
        <div
          className="animate-aurora absolute left-1/3 top-0 h-64 w-64 rounded-full bg-red-500/15 blur-3xl [animation-delay:-10s]"
          aria-hidden="true"
        />

        <div className="relative mx-auto grid max-w-site items-center gap-12 px-6 pb-20 pt-40 md:pb-28 md:pt-48 lg:grid-cols-2 lg:pt-60 xl:pt-64">
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-white backdrop-blur-md">
              <span className="animate-pulse-dot h-2 w-2 rounded-full bg-brand-light" />
              UK &amp; Isle of Man Umbrella Broker
            </div>
            <h1 className="mt-6 text-4xl font-extrabold leading-tight text-white sm:text-5xl lg:text-6xl">
              <span className="inline-block overflow-hidden align-bottom">
                <span
                  className="animate-rise"
                  style={{ animationDelay: "3900ms" }}
                >
                  Switch To The&nbsp;
                </span>
              </span>
              <span className="inline-block overflow-hidden align-bottom">
                <span
                  className="animate-rise"
                  style={{ animationDelay: "4150ms" }}
                >
                  <RotatingWord />
                </span>
              </span>{" "}
              <span className="inline-block overflow-hidden align-bottom">
                <span
                  className="animate-rise"
                  style={{ animationDelay: "4400ms" }}
                >
                  Umbrella Solution Today.
                </span>
              </span>
            </h1>
            <span className="block overflow-hidden">
              <span
                className="animate-rise mx-auto mt-5 block max-w-md leading-relaxed text-slate-300 lg:mx-0"
                style={{ animationDelay: "4650ms" }}
              >
                We compare the market, handle the paperwork and keep you fully
                compliant — so you can get on with the work you love.
              </span>
            </span>
            <div className="mt-8 flex flex-wrap justify-center gap-4 lg:justify-start">
              <Magnetic>
                <Link
                  href="/contact"
                  className="group relative block overflow-hidden rounded-full bg-gradient-to-r from-brand to-brand-light px-8 py-4 text-sm font-semibold uppercase tracking-wide text-white shadow-lg shadow-brand/40 transition-all duration-300 hover:shadow-brand/60"
                >
                  <span className="relative z-10">Get In Touch</span>
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
                </Link>
              </Magnetic>
              <Magnetic>
                <Link
                  href="/services"
                  className="block rounded-full border border-white/40 bg-white/10 px-8 py-4 text-sm font-semibold uppercase tracking-wide text-white backdrop-blur-md transition-all duration-300 hover:border-white hover:bg-white hover:text-ink"
                >
                  Find Out More
                </Link>
              </Magnetic>
            </div>

            <div className="mt-10 flex justify-center divide-x divide-white/15 lg:justify-start">
              {heroStats.map((s) => (
                <div key={s.label} className="px-3 first:pl-0 last:pr-0 sm:px-8">
                  <p className="text-2xl font-extrabold text-white md:text-3xl">
                    <Counter value={s.value} suffix={s.suffix} />
                  </p>
                  <p className="mt-1 text-[10px] uppercase tracking-wider text-slate-400 sm:text-xs sm:tracking-widest">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="mx-auto max-w-md overflow-hidden text-center text-2xl font-bold text-white md:text-3xl lg:mx-0 lg:text-left">
              <span
                className="animate-rise"
                style={{ animationDelay: "5150ms" }}
              >
                Quickly connect with the ideal umbrella company.
              </span>
            </h2>
            <div className="mx-auto mt-8 grid max-w-xl grid-cols-3 gap-3 sm:gap-4 lg:mx-0 lg:max-w-none lg:grid-cols-1 xl:grid-cols-3">
              {heroCards.map((card, i) => (
                <div key={card.label} className="overflow-hidden rounded-tcb">
                  <div
                    className="animate-rise h-full w-full"
                    style={{ animationDelay: `${5350 + i * 150}ms` }}
                  >
                    <div className="shine group relative flex h-full flex-col items-center gap-3 rounded-tcb border border-white/40 bg-white/5 px-2 py-5 backdrop-blur-md transition-all duration-300 hover:-translate-y-1.5 hover:border-brand-light hover:bg-white/15 hover:shadow-xl hover:shadow-brand/20 sm:px-6 sm:py-7">
                      <Image
                        src={card.icon}
                        alt=""
                        width={36}
                        height={36}
                        className="h-8 w-8 invert transition-transform duration-300 group-hover:scale-110 sm:h-9 sm:w-9"
                      />
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-white sm:text-sm">
                        {card.label}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Ticker />

      {/* Committed to supporting your needs */}
      <section className="mx-auto max-w-site px-6 py-24">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <Reveal direction="left">
            <SectionHeading
              align="left"
              eyebrow="More About Us"
              title="Committed to Supporting Your Needs"
              description="Discover how we simplify contractor payments, ensure full compliance with IR35, and provide expert payroll support. With a commitment to transparency and efficiency, we help contractors and businesses focus on success while we handle the rest."
            />
            <blockquote className="mx-auto mt-6 max-w-2xl text-center font-medium italic text-ink lg:mx-0 lg:border-l-4 lg:border-brand lg:pl-4 lg:text-left">
              “Success is not the key to happiness. Happiness is the key to
              success. If you love what you do, you will succeed.”
              <span className="mt-1 block text-sm not-italic text-muted">
                – Albert Schweitzer
              </span>
            </blockquote>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-8 text-center lg:justify-start lg:text-left">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted">
                  Need help
                </p>
                <a
                  href={site.phoneHref}
                  className="text-xl font-bold text-brand"
                >
                  {site.phone}
                </a>
              </div>
              <Magnetic>
                <Link
                  href="/about"
                  className="group relative block overflow-hidden rounded-full bg-gradient-to-r from-brand to-brand-light px-8 py-3.5 text-sm font-semibold uppercase tracking-wide text-white shadow-lg shadow-brand/30"
                >
                  <span className="relative z-10">Learn More About Us</span>
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
                </Link>
              </Magnetic>
            </div>
          </Reveal>

          <Reveal direction="right" delay={150}>
            <div className="relative">
              <div
                className="animate-float absolute -right-6 -top-6 h-40 w-40 rounded-full border-[10px] border-brand/15"
                aria-hidden="true"
              />
              <div className="relative grid grid-cols-2 gap-4">
                <Parallax speed={-0.05} className="h-full">
                  <Tilt max={6} className="h-full">
                    <div className="shine relative h-full rounded-tcb">
                      <Image
                        src="/images/download-30-e1737989914123.webp"
                        alt="Two professional men in an office discussing payroll brokerage documents. Ideal solutions for contractors and agencies looking for umbrella company services."
                        width={952}
                        height={1692}
                        className="h-full w-full rounded-tcb object-cover shadow-xl"
                      />
                    </div>
                  </Tilt>
                </Parallax>
                <Parallax speed={-0.11} className="flex flex-col gap-4">
                  <Tilt max={6} className="flex-1">
                    <div className="shine relative h-full rounded-tcb">
                      <Image
                        src="/images/download-32.webp"
                        alt="Two women in an office using laptops, with AI-powered security and financial technology symbols floating around, representing safe and efficient payroll brokerage solutions."
                        width={1080}
                        height={1080}
                        className="h-full w-full rounded-tcb object-cover shadow-xl"
                      />
                    </div>
                  </Tilt>
                  <div className="shine relative rounded-tcb bg-gradient-to-br from-brand to-brand-dark px-6 py-5 text-white shadow-lg shadow-brand/30">
                    <p className="text-3xl font-extrabold">decades</p>
                    <p className="text-sm font-medium uppercase tracking-wide">
                      Of Experience
                    </p>
                  </div>
                </Parallax>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* What to do next — pinned scroll story */}
      <ScrollStory />

      {/* Services */}
      <section className="relative overflow-hidden">
        {/* grey band with arch + circle */}
        <div
          className="absolute inset-x-0 top-0 h-[78%] overflow-hidden bg-[#c5ccd3]"
          aria-hidden="true"
        >
          <div className="absolute left-1/2 top-[18%] h-[160%] w-[70%] rounded-t-full bg-[#f1f2f4]" />
          <div className="absolute left-[27%] top-[22%] h-24 w-24 rounded-full bg-[#f1f2f4] md:h-28 md:w-28" />
        </div>

        <div className="relative mx-auto max-w-site px-6 pb-24 pt-16">
          <div className="grid items-start gap-8 lg:grid-cols-2">
            <Reveal direction="left" className="text-center lg:text-left">
              <p className="flex items-center justify-center gap-3 text-sm font-medium uppercase tracking-wide text-brand lg:justify-start">
                Our Services
                <span className="h-px w-8 bg-brand" />
              </p>
              <h2 className="mx-auto mt-2 max-w-lg text-3xl font-bold capitalize leading-tight text-slate-600 md:text-4xl lg:mx-0">
                Tailored solutions to meet your needs.
              </h2>
              <svg
                className="mx-auto mt-3 h-3 w-16 text-brand lg:mx-0"
                viewBox="0 0 64 12"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M1 6c3.5-5 7-5 10.5 0s7 5 10.5 0 7-5 10.5 0 7 5 10.5 0 7-5 10.5 0 7 5 10.5 0"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </Reveal>
            <Reveal direction="right" delay={150} className="text-center lg:pl-16 lg:pt-4 lg:text-left">
              <p className="mx-auto max-w-sm text-sm leading-relaxed text-slate-600 lg:mx-0">
                Here are just a few of the expert services we offer, tailored
                to meet your unique needs and requirements.
              </p>
              <Magnetic>
                <Link
                  href="/services"
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-semibold uppercase text-white transition-colors duration-300 hover:bg-brand-dark"
                >
                  More Services
                  <span aria-hidden="true">→</span>
                </Link>
              </Magnetic>
            </Reveal>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {homeServices.map((s, i) => (
              <Reveal key={s.title} delay={i * 100} className="h-full">
                <Link
                  href="/services"
                  className="group block h-full rounded-tcb border border-dashed border-slate-300 bg-white px-7 py-9 text-center transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-slate-900/10 sm:text-left"
                >
                  <Image
                    src={s.icon}
                    alt=""
                    width={48}
                    height={48}
                    className="mx-auto h-12 w-12 transition-transform duration-300 group-hover:scale-110 sm:mx-0"
                  />
                  <h3 className="mt-5 text-lg font-semibold capitalize leading-snug text-brand">
                    {s.title}
                  </h3>
                  <p className="mt-5 text-sm leading-relaxed text-slate-500">
                    {s.description}
                  </p>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Giant outlined marquee */}
      <div className="overflow-hidden py-6" aria-hidden="true">
        <div className="animate-marquee flex w-max items-center gap-16">
          {[...marqueeWords, ...marqueeWords].map((w, i) => (
            <span
              key={i}
              className={`whitespace-nowrap text-7xl font-extrabold uppercase tracking-tight md:text-8xl ${
                i % 2 === 0 ? "text-stroke" : "text-ink/90"
              }`}
            >
              {w}
              <span className="ml-16 text-brand">✦</span>
            </span>
          ))}
        </div>
      </div>

      {/* UK & Isle of Man coverage */}
      <Jurisdictions />

      {/* Testimonials */}
      <section className="relative overflow-hidden bg-slate-50 py-24">
        <div
          className="animate-aurora absolute -left-24 top-10 h-72 w-72 rounded-full bg-brand/10 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-site px-6">
          <Reveal direction="zoom">
            <SectionHeading
              eyebrow="Testimonials"
              title="See What Our Clients Say"
            />
          </Reveal>
          <div className="mt-14">
            <Testimonials />
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
