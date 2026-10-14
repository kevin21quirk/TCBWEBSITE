const items = [
  "IR35 Compliance",
  "Payroll Management",
  "Pension & Benefits",
  "Same-Day Payments",
  "Free Comparison",
  "Expert Support",
  "Umbrella Vetting",
  "24h Onboarding",
];

export default function Ticker() {
  const row = [...items, ...items];
  return (
    <div className="relative overflow-hidden border-y border-white/10 bg-ink py-4">
      <div className="animate-marquee flex w-max items-center gap-10">
        {row.map((item, i) => (
          <span
            key={i}
            className="flex items-center gap-10 whitespace-nowrap text-sm font-medium uppercase tracking-widest text-slate-400"
          >
            {item}
            <span className="text-brand">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}
