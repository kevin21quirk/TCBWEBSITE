export default function PageHero({
  eyebrow,
  title,
  description,
  image,
  imagePosition = "center",
  centered = false,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  image?: string;
  imagePosition?: string;
  centered?: boolean;
}) {
  return (
    <section className="relative overflow-hidden rounded-b-tcb border-b-4 border-brand bg-ink">
      <div
        className={`absolute inset-0 bg-cover md:bg-fixed ${image ? "" : "opacity-25"}`}
        style={{
          backgroundImage: `url(${image ?? "/images/two-people-in-a-room.webp"})`,
          backgroundPosition: imagePosition,
        }}
        aria-hidden="true"
      />
      {image && (
        <div className="absolute inset-0 bg-ink/55" aria-hidden="true" />
      )}
      <div
        className={`relative mx-auto max-w-site px-6 pb-20 pt-36 md:pb-28 md:pt-44 lg:pt-56 xl:pt-60 ${
          centered ? "text-center" : ""
        }`}
      >
        {eyebrow && (
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-brand-light">
            {eyebrow}
          </p>
        )}
        <h1 className="text-4xl font-bold text-white md:text-5xl">{title}</h1>
        {description && (
          <p
            className={`mt-4 max-w-2xl text-lg text-slate-300 ${
              centered ? "mx-auto" : ""
            }`}
          >
            {description}
          </p>
        )}
      </div>
    </section>
  );
}
