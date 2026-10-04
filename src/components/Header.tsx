"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  allServices,
  industries,
  navLinks,
  site,
  slugify,
} from "@/lib/content";

const featuredServices = allServices.slice(0, 6);

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      className={`ml-1 h-3 w-3 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M2 4l4 4 4-4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState<"services" | "industries" | null>(null);
  const [mobileSub, setMobileSub] = useState<"services" | "industries" | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const linkClass = (href: string, active = false) =>
    `group/link relative flex items-center rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 before:absolute before:inset-0 before:rounded-full before:bg-gradient-to-r before:from-brand/10 before:to-orange-400/10 before:opacity-0 before:transition-opacity before:duration-300 after:absolute after:bottom-0.5 after:left-1/2 after:h-0.5 after:-translate-x-1/2 after:rounded-full after:bg-gradient-to-r after:from-brand after:to-orange-400 after:transition-all after:duration-300 ${
      pathname === href || active
        ? "text-brand after:w-2/3"
        : "text-ink/70 after:w-0 hover:before:opacity-100 hover:after:w-2/3"
    }`;

  const rollLabel = (label: string) => (
    <span className="relative inline-flex overflow-hidden leading-snug">
      <span className="transition-transform duration-300 ease-out group-hover/link:-translate-y-[110%]">
        {label}
      </span>
      <span
        className="absolute inset-0 translate-y-[110%] bg-gradient-to-r from-brand to-orange-500 bg-clip-text font-semibold text-transparent transition-transform duration-300 ease-out group-hover/link:translate-y-0"
        aria-hidden="true"
      >
        {label}
      </span>
    </span>
  );

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      {/* utility bar */}
      <div
        className={`overflow-hidden bg-ink transition-all duration-500 ${
          scrolled ? "max-h-0" : "max-h-10"
        }`}
      >
        <div className="mx-auto flex h-10 max-w-site items-center justify-center px-4 text-[11px] text-slate-300 sm:justify-between sm:text-xs">
          <p className="flex items-center gap-2 whitespace-nowrap">
            <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-brand to-orange-400" />
            Free umbrella company comparison — no fees, no obligation
          </p>
          <div className="hidden items-center gap-5 sm:flex">
            <a
              href={site.phoneHref}
              className="font-semibold text-white transition-colors hover:text-brand-light"
            >
              {site.phone}
            </a>
            <a
              href={`mailto:${site.email}`}
              className="transition-colors hover:text-brand-light"
            >
              {site.email}
            </a>
          </div>
        </div>
      </div>
      {/* gradient hairline */}
      <div className="h-[3px] w-full bg-gradient-to-r from-brand via-orange-400 to-brand" />

      <div className="mx-auto max-w-site px-4">
        {/* gradient ring */}
        <div
          className={`mt-3 rounded-full bg-gradient-to-r p-px transition-all duration-300 ${
            scrolled || open
              ? "from-brand/60 via-orange-300/60 to-brand/60 shadow-2xl shadow-brand/15"
              : "from-white/70 via-brand/30 to-white/70"
          }`}
        >
          <div
            className={`relative flex items-center justify-between rounded-full px-5 transition-all duration-500 ${
              scrolled || open
                ? "bg-white/90 py-2.5 backdrop-blur-xl"
                : "bg-white/75 py-2.5 backdrop-blur-md lg:px-10 lg:py-5"
            }`}
          >
            <Link
              href="/"
              aria-label="The Contractor Broker home"
              id="brand-logo-target"
              className={pathname === "/" ? "logo-delayed" : undefined}
            >
              <Image
                src="/images/tcb-logo-2.png"
                alt="The Contractor Broker"
                width={300}
                height={90}
                className={`w-auto transition-all duration-500 hover:scale-105 ${
                  scrolled || open ? "h-9" : "h-9 lg:h-20 xl:h-24"
                }`}
                priority
              />
            </Link>

            <nav className="hidden items-center gap-1 lg:flex">
              {navLinks.slice(0, -1).map((link) => {
                const hasMenu =
                  link.href === "/services" || link.href === "/industries";
                const key =
                  link.href === "/services"
                    ? "services"
                    : link.href === "/industries"
                      ? "industries"
                      : null;
                return (
                  <div
                    key={link.href}
                    className="relative"
                    onMouseEnter={() =>
                      key ? setMenu(key as typeof menu) : setMenu(null)
                    }
                    onMouseLeave={() => setMenu(null)}
                  >
                    <Link
                      href={link.href}
                      className={linkClass(link.href, key !== null && menu === key)}
                    >
                      {rollLabel(link.label)}
                      {hasMenu && <Chevron open={menu === key} />}
                    </Link>

                    {/* mega menu */}
                    {hasMenu && (
                      <div
                        className={`absolute left-1/2 top-full -translate-x-1/2 pt-4 transition-all duration-300 ${
                          menu === key
                            ? "pointer-events-auto translate-y-0 opacity-100"
                            : "pointer-events-none -translate-y-2 opacity-0"
                        }`}
                      >
                        <div className="overflow-hidden rounded-tcb border border-slate-200/80 bg-white/95 shadow-2xl shadow-slate-900/10 backdrop-blur-xl">
                          {key === "services" ? (
                            <div className="w-[600px] p-3">
                              <div className="grid grid-cols-2 gap-1">
                                {featuredServices.map((s) => (
                                  <Link
                                    key={s.title}
                                    href={`/services#${slugify(s.title)}`}
                                    onClick={() => setMenu(null)}
                                    className="group/item rounded-xl p-3 transition-colors duration-200 hover:bg-brand/[0.06]"
                                  >
                                    <p className="text-sm font-semibold text-ink transition-colors group-hover/item:text-brand">
                                      {s.title}
                                    </p>
                                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted">
                                      {s.description}
                                    </p>
                                  </Link>
                                ))}
                              </div>
                              <div className="mt-2 border-t border-slate-100 px-3 pb-1 pt-3">
                                <Link
                                  href="/services"
                                  onClick={() => setMenu(null)}
                                  className="text-xs font-semibold uppercase tracking-widest text-brand transition-colors hover:text-brand-light"
                                >
                                  View all 20 services →
                                </Link>
                              </div>
                            </div>
                          ) : (
                            <div className="w-[680px] p-3">
                              <div className="grid grid-cols-3 gap-2">
                                {industries.map((ind) => (
                                  <Link
                                    key={ind.title}
                                    href={`/industries#${slugify(ind.title)}`}
                                    onClick={() => setMenu(null)}
                                    className="group/item relative overflow-hidden rounded-xl"
                                  >
                                    <Image
                                      src={ind.image}
                                      alt={ind.title}
                                      width={220}
                                      height={140}
                                      className="h-20 w-full object-cover transition-transform duration-500 group-hover/item:scale-110"
                                    />
                                    <span className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-transparent" />
                                    <span className="absolute bottom-2 left-3 right-3 text-xs font-semibold text-white">
                                      {ind.title}
                                    </span>
                                  </Link>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>

            <div className="hidden items-center gap-3 lg:flex">
              <a
                href={site.phoneHref}
                className="group flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-ink transition-all duration-300 hover:border-brand hover:text-brand"
              >
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-brand" />
                </span>
                {site.phone}
              </a>
              <Link
                href="/contact"
                className="group relative overflow-hidden rounded-full bg-gradient-to-r from-brand to-brand-light px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand/30 transition-all duration-300 hover:scale-105 hover:shadow-brand/50"
              >
                <span className="relative z-10">Contact Us</span>
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
              </Link>
            </div>

            <button
              type="button"
              aria-label="Toggle menu"
              aria-expanded={open}
              onClick={() => setOpen(!open)}
              className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 lg:hidden"
            >
              <span
                className={`h-0.5 w-6 bg-brand transition-transform ${open ? "translate-y-2 rotate-45" : ""}`}
              />
              <span className={`h-0.5 w-6 bg-brand ${open ? "opacity-0" : ""}`} />
              <span
                className={`h-0.5 w-6 bg-brand transition-transform ${open ? "-translate-y-2 -rotate-45" : ""}`}
              />
            </button>
          </div>
        </div>

        {open && (
          <nav className="mt-2 max-h-[calc(100dvh-6.5rem)] overflow-y-auto overscroll-contain rounded-tcb border border-slate-200 bg-white/95 shadow-xl backdrop-blur-xl lg:hidden">
            <ul className="px-5 py-3">
              {navLinks.map((link) => {
                const sub =
                  link.href === "/services"
                    ? {
                        key: "services" as const,
                        items: featuredServices.map((s) => ({
                          label: s.title,
                          href: `/services#${slugify(s.title)}`,
                        })),
                        all: { label: "View all 20 services →", href: "/services" },
                      }
                    : link.href === "/industries"
                      ? {
                          key: "industries" as const,
                          items: industries.map((ind) => ({
                            label: ind.title,
                            href: `/industries#${slugify(ind.title)}`,
                          })),
                          all: { label: "View all industries →", href: "/industries" },
                        }
                      : null;
                const expanded = sub !== null && mobileSub === sub.key;
                return (
                  <li key={link.href} className="border-b border-slate-100 last:border-0">
                    <div className="flex items-center justify-between">
                      <Link
                        href={link.href}
                        onClick={() => setOpen(false)}
                        className={`block flex-1 py-3 text-sm font-medium transition-colors ${
                          pathname === link.href ? "text-brand" : "text-ink/70 hover:text-brand"
                        }`}
                      >
                        {link.label}
                      </Link>
                      {sub && (
                        <button
                          type="button"
                          aria-label={`${expanded ? "Hide" : "Show"} ${link.label}`}
                          aria-expanded={expanded}
                          onClick={() => setMobileSub(expanded ? null : sub.key)}
                          className={`-mr-2 flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
                            expanded ? "bg-brand/10 text-brand" : "text-ink/60"
                          }`}
                        >
                          <Chevron open={expanded} />
                        </button>
                      )}
                    </div>
                    {sub && (
                      <div
                        className={`grid transition-all duration-300 ease-out ${
                          expanded ? "grid-rows-[1fr] pb-3" : "grid-rows-[0fr]"
                        }`}
                      >
                        <ul className="space-y-0.5 overflow-hidden border-l-2 border-brand/20 pl-4">
                          {[...sub.items, sub.all].map((item) => (
                            <li key={item.href}>
                              <Link
                                href={item.href}
                                onClick={() => setOpen(false)}
                                tabIndex={expanded ? undefined : -1}
                                className={`block py-1.5 text-[13px] transition-colors hover:text-brand ${
                                  item === sub.all ? "font-semibold text-brand" : "text-ink/60"
                                }`}
                              >
                                {item.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </li>
                );
              })}
              <li className="pt-3">
                <a
                  href={site.phoneHref}
                  className="block pb-3 text-sm font-semibold text-brand"
                >
                  Call {site.phone}
                </a>
              </li>
            </ul>
          </nav>
        )}
      </div>
    </header>
  );
}
