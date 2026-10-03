import Image from "next/image";
import Link from "next/link";
import Counter from "@/components/Counter";
import CtaBand from "@/components/CtaBand";
import BrandIntro from "@/components/BrandIntro";
import HeroShutter from "@/components/HeroShutter";
import Magnetic from "@/components/Magnetic";
import Parallax from "@/components/Parallax";
import Reveal from "@/components/Reveal";
import RotatingWord from "@/components/RotatingWord";
import ScrollStory from "@/components/ScrollStory";
import SectionHeading from "@/components/SectionHeading";
import Spotlight from "@/components/Spotlight";
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
        <Parallax
          speed={0.25}
          className="absolute -inset-y-[40%] inset-x-0 bg-cover bg-center"
          style={{
            backgroundImage: "url(/images/two-people-in-a-room.webp)",
          }}
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

        <div className="relative mx-auto grid max-w-site items-center gap-12 px-6 pb-20 pt-40 md:pb-28 md:pt-48 lg:grid-cols-2">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-white backdrop-blur-md">
              <span className="animate-pulse-dot h-2 w-2 rounded-full bg-brand-light" />
              UK Umbrella Company Broker
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
                className="animate-rise mt-5 block max-w-md leading-relaxed text-slate-300"
                style={{ animationDelay: "4650ms" }}
              >
                We compare the market, handle the paperwork and keep you fully
                compliant — so you can get on with the work you love.
              </span>
            </span>
            <div className="mt-8 flex flex-wrap gap-4">
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

            <div className="mt-10 flex divide-x divide-white/15">
              {heroStats.map((s) => (
                <div key={s.label} className="pr-8 pl-8 first:pl-0 last:pr-0">
                  <p className="text-2xl font-extrabold text-white md:text-3xl">
                    <Counter value={s.value} suffix={s.suffix} />
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-widest text-slate-400">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="max-w-md overflow-hidden text-2xl font-bold text-white md:text-3xl">
              <span
                className="animate-rise"
                style={{ animationDelay: "4750ms" }}
              >
                Quickly connect with the ideal umbrella company.
              </span>
            </h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              {heroCards.map((card, i) => (
                <div key={card.label} className="overflow-hidden rounded-tcb">
                  <div
                    className="animate-rise h-full"
                    style={{ animationDelay: `${4950 + i * 150}ms` }}
                  >
                    <div className="shine group relative flex h-full flex-col items-center gap-3 rounded-tcb border border-white/40 bg-white/5 px-6 py-7 backdrop-blur-md transition-all duration-300 hover:-translate-y-1.5 hover:border-brand-light hover:bg-white/15 hover:shadow-xl hover:shadow-brand/20">
                      <Image
                        src={card.icon}
                        alt=""
                        width={36}
                        height={36}
                        className="h-9 w-9 invert transition-transform duration-300 group-hover:scale-110"
                      />
                      <span className="text-sm font-semibold uppercase tracking-wide text-white">
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
            <blockquote className="mt-6 border-l-4 border-brand pl-4 font-medium italic text-ink">
              “Success is not the key to happiness. Happiness is the key to
              success. If you love what you do, you will succeed.”
              <span className="mt-1 block text-sm not-italic text-muted">
                – Albert Schweitzer
              </span>
            </blockquote>
            <div className="mt-8 flex flex-wrap items-center gap-8">
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

      {/* Services — bento */}
      <section className="relative mx-auto max-w-site overflow-visible px-6 py-24">
        <span
          className="text-stroke pointer-events-none absolute -top-4 left-0 select-none text-[8rem] font-extrabold uppercase leading-none tracking-tight opacity-60 md:text-[10rem]"
          aria-hidden="true"
        >
          Expert
        </span>
        <Reveal>
          <SectionHeading
            eyebrow="Our Services"
            title="Tailored solutions to meet your needs."
            description="Here are just a few of the expert services we offer, tailored to meet your unique needs and requirements."
          />
        </Reveal>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {homeServices.map((s, i) => (
            <Reveal
              key={s.title}
              delay={i * 100}
              direction={i % 2 === 0 ? "left" : "right"}
              className={`h-full ${
                i === 0
                  ? "sm:col-span-2 lg:col-span-2 lg:row-span-2"
                  : i === homeServices.length - 1
                    ? "sm:col-span-2 lg:col-span-2"
                    : ""
              }`}
            >
              <Tilt max={6} className="h-full">
                <Spotlight
                  className={`group relative h-full overflow-hidden rounded-tcb border border-slate-200 bg-white p-8 transition-all duration-300 hover:-translate-y-2 hover:border-transparent hover:shadow-2xl hover:shadow-brand/15 ${
                    i === 0 ? "bg-gradient-to-br from-white to-red-50" : ""
                  }`}
                >
                  <div
                    className="absolute inset-x-0 top-0 z-[2] h-1 origin-left scale-x-0 bg-gradient-to-r from-brand to-orange-400 transition-transform duration-300 group-hover:scale-x-100"
                    aria-hidden="true"
                  />
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/10 transition-colors duration-300 group-hover:bg-brand">
                    <Image
                      src={s.icon}
                      alt=""
                      width={40}
                      height={40}
                      className="h-9 w-9 transition duration-300 group-hover:invert"
                    />
                  </div>
                  <h3
                    className={`mt-5 font-semibold text-ink transition-colors duration-300 group-hover:text-brand ${
                      i === 0 ? "text-2xl" : "text-lg"
                    }`}
                  >
                    {s.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted">
                    {s.description}
                  </p>
                  <div className="grid grid-rows-[0fr] transition-all duration-500 ease-out group-hover:grid-rows-[1fr]">
                    <div className="overflow-hidden">
                      <Link
                        href="/services"
                        className="mt-4 inline-flex translate-y-2 items-center gap-2 text-sm font-semibold text-brand opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100"
                      >
                        Explore this service
                        <span aria-hidden="true">→</span>
                      </Link>
                    </div>
                  </div>
                </Spotlight>
              </Tilt>
            </Reveal>
          ))}
        </div>
        <div className="mt-12 text-center">
          <Magnetic>
            <Link
              href="/services"
              className="group relative inline-block overflow-hidden rounded-full bg-gradient-to-r from-brand to-brand-light px-8 py-3.5 text-sm font-semibold uppercase tracking-wide text-white shadow-lg shadow-brand/30"
            >
              <span className="relative z-10">More Services</span>
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
            </Link>
          </Magnetic>
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
