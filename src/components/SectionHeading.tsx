import WordsReveal from "@/components/WordsReveal";

export default function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  dark = false,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  dark?: boolean;
}) {
  // "left" headings centre on stacked (mobile/tablet) layouts.
  const alignClass =
    align === "center"
      ? "text-center mx-auto"
      : "text-center mx-auto lg:text-left lg:mx-0";
  return (
    <div className={`max-w-2xl ${alignClass}`}>
      {eyebrow && (
        <p
          className={`mb-3 flex items-center gap-3 text-sm font-semibold uppercase tracking-widest ${
            align === "center" ? "justify-center" : "justify-center lg:justify-start"
          } ${dark ? "text-brand-light" : "text-brand"}`}
        >
          <span className="h-px w-8 bg-gradient-to-r from-transparent to-brand" />
          {eyebrow}
          <span className="h-px w-8 bg-gradient-to-l from-transparent to-brand" />
        </p>
      )}
      <h2
        className={`text-3xl font-bold leading-tight md:text-4xl ${
          dark ? "text-white" : "text-ink"
        }`}
      >
        <WordsReveal text={title} />
      </h2>
      {description && (
        <p
          className={`mt-4 leading-relaxed ${
            dark ? "text-slate-300" : "text-muted"
          }`}
        >
          {description}
        </p>
      )}
    </div>
  );
}
