"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  {
    href: "/admin",
    label: "Dashboard",
    icon: (
      <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
    ),
  },
  {
    href: "/admin/leads",
    label: "Leads",
    icon: (
      <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
    ),
  },
  {
    href: "/admin/pipeline",
    label: "Pipeline",
    icon: (
      <path d="M3 3h5v18H3V3zm6.5 0h5v12h-5V3zM16 3h5v8h-5V3z" />
    ),
  },
  {
    href: "/admin/radar",
    label: "Lead Radar",
    icon: (
      <path d="M12 2a10 10 0 1 0 9.54 7h-2.06A8 8 0 1 1 12 4V2zm0 4a6 6 0 1 0 5.66 4H12V6zm0 3a1 1 0 1 0 0 2 1 1 0 0 0 0-2z" />
    ),
  },
  {
    href: "/admin/prospecting",
    label: "LinkedIn Prospecting",
    icon: (
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14zM8.34 17.34V10H5.9v7.34h2.44zM7.12 8.98a1.42 1.42 0 1 0 0-2.84 1.42 1.42 0 0 0 0 2.84zm11.22 8.36v-4.03c0-2.16-1.15-3.17-2.7-3.17-1.24 0-1.8.68-2.11 1.16V10h-2.44c.03.69 0 7.34 0 7.34h2.44v-4.1c0-.22.02-.44.08-.6.18-.44.58-.9 1.26-.9.89 0 1.25.68 1.25 1.67v3.93h2.22z" />
    ),
  },
  {
    href: "/admin/calendar",
    label: "Calendar",
    icon: (
      <path d="M19 3h-1V1h-2v2H8V1H6v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm0 16H5V9h14v10zM5 7V5h14v2H5zm2 4h5v5H7v-5z" />
    ),
  },
  {
    href: "/admin/reports",
    label: "Reports",
    icon: (
      <path d="M5 9.2h3V19H5V9.2zM10.6 5h2.8v14h-2.8V5zm5.6 8H19v6h-2.8v-6z" />
    ),
  },
  {
    href: "/admin/leads/new",
    label: "Add Lead",
    icon: (
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" />
    ),
  },
];

const adminItems = [
  {
    href: "/admin/visitors",
    label: "Visitors",
    icon: (
      <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />
    ),
  },
  {
    href: "/admin/users",
    label: "Team",
    icon: (
      <path d="M12 12.75c1.63 0 3.07.39 4.24.9 1.08.48 1.76 1.56 1.76 2.73V18H6v-1.61c0-1.18.68-2.26 1.76-2.73 1.17-.52 2.61-.91 4.24-.91zM4 13c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm1.13 1.1c-.37-.06-.74-.1-1.13-.1-.99 0-1.93.21-2.78.58C.48 14.9 0 15.62 0 16.43V18h4.5v-1.61c0-.83.23-1.61.63-2.29zM20 13c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm4 3.43c0-.81-.48-1.53-1.22-1.85-.85-.37-1.79-.58-2.78-.58-.39 0-.76.04-1.13.1.4.68.63 1.46.63 2.29V18H24v-1.57zM12 6c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3z" />
    ),
  },
];

export default function AdminNav({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  const pathname = usePathname();
  const links = isSuperAdmin ? [...items, ...adminItems] : items;

  return (
    <nav className="flex flex-col gap-1 px-3 py-4">
      {links.map((item) => {
        const active =
          item.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(item.href) &&
              (item.href !== "/admin/leads" ||
                pathname !== "/admin/leads/new");
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
              active
                ? "bg-gradient-to-r from-brand to-brand-light text-white shadow-lg shadow-brand/30"
                : "text-slate-400 hover:bg-white/10 hover:text-white"
            }`}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
              {item.icon}
            </svg>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
