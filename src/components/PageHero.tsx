export default function PageHero({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <section className="relative overflow-hidden rounded-b-tcb border-b-4 border-brand bg-ink">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-25"
        style={{
          backgroundImage: "url(/images/two-people-in-a-room.webp)",
        }}
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-site px-6 pb-20 pt-36 md:pb-28 md:pt-44">
        {eyebrow && (
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-brand-light">
            {eyebrow}
          </p>
        )}
        <h1 className="text-4xl font-bold text-white md:text-5xl">{title}</h1>
        {description && (
          <p className="mt-4 max-w-2xl text-lg text-slate-300">{description}</p>
        )}
      </div>
    </section>
  );
}
