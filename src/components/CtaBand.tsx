import Link from "next/link";

export default function CtaBand() {
  return (
    <section className="bg-gradient-to-r from-brand-dark via-brand to-orange-500">
      <div className="mx-auto flex max-w-site flex-col items-center justify-between gap-6 px-6 py-12 text-center md:flex-row md:text-left">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-white/80">
            Find Out More
          </p>
          <h2 className="mt-2 text-2xl font-bold text-white md:text-3xl">
            Got a Question? We Would Be Happy to Help!
          </h2>
          <p className="mt-2 text-white/80">
            Please feel free to ask any questions about our services.
          </p>
        </div>
        <Link
          href="/contact"
          className="shrink-0 rounded-full bg-white px-8 py-3.5 text-sm font-semibold uppercase tracking-wide text-brand transition-colors hover:bg-ink hover:text-white"
        >
          Contact Us
        </Link>
      </div>
    </section>
  );
}
