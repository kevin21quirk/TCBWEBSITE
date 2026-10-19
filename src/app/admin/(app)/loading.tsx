export default function AdminLoading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center text-white">
      <div className="flex flex-col items-center gap-4">
        <span className="relative flex h-12 w-12">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand/40" />
          <span className="relative inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-white/5 backdrop-blur-xl">
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 animate-spin text-brand-light">
              <path d="M12 4a8 8 0 0 1 7.45 5.1l-1.9.7A6 6 0 1 0 18 12h2a8 8 0 1 1-8-8z" />
            </svg>
          </span>
        </span>
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/40">
          Loading…
        </p>
      </div>
    </div>
  );
}
