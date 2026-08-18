"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/lib/actions/auth";

const NAV_ITEMS = [
  {
    href: "/owner/onboarding",
    label: "Setup",
    description: "First repair path",
  },
  {
    href: "/owner/dashboard",
    label: "Requests",
    description: "Repair records",
  },
  {
    href: "/owner/requests/new",
    label: "New request",
    description: "Start a repair",
  },
  {
    href: "/owner/properties",
    label: "Properties",
    description: "Homes and rentals",
  },
  {
    href: "/owner/vault",
    label: "Vault",
    description: "Receipts and documents",
  },
  {
    href: "/owner/calendar",
    label: "Calendar",
    description: "Maintenance reminders",
  },
  {
    href: "/owner/account",
    label: "Account",
    description: "Profile and sharing",
  },
  {
    href: "/owner/notifications",
    label: "Notifications",
    description: "Email delivery history",
  },
  {
    href: "/owner/backup",
    label: "Backup",
    description: "Export and restore",
  },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/owner/dashboard") {
    return pathname === href || pathname.startsWith("/owner/requests/");
  }
  return pathname === href;
}

export function OwnerSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full border-b border-gray-200 bg-white shadow-sm md:sticky md:top-0 md:min-h-screen md:w-64 md:border-b-0 md:border-r">
      <div className="flex items-center justify-between gap-4 border-b border-gray-100 p-4 md:block">
        <div>
          <Link href="/owner/dashboard" className="text-lg font-bold tracking-tight">
            TurnFlow Home
          </Link>
          <p className="hidden text-xs text-gray-500 md:block">
            Owner repair workspace
          </p>
        </div>
        <form action={logoutAction} className="md:hidden">
          <button className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors duration-150 hover:border-gray-400 hover:bg-gray-100">
            Logout
          </button>
        </form>
      </div>

      <nav
        aria-label="Owner navigation"
        className="flex gap-1 overflow-x-auto px-3 py-3 md:flex-col md:overflow-visible md:p-4"
      >
        {NAV_ITEMS.map((item) => {
          const active = isActivePath(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`min-w-max rounded-lg border px-3 py-2 text-sm font-medium transition-colors duration-150 md:min-w-0 ${
                active
                  ? "border-emerald-200 bg-emerald-50 text-emerald-950"
                  : "border-transparent text-gray-700 hover:border-gray-300 hover:bg-gray-100"
              }`}
            >
              <span className="block">{item.label}</span>
              <span
                className={`hidden text-xs md:block ${
                  active ? "text-emerald-800" : "text-gray-500"
                }`}
              >
                {item.description}
              </span>
            </Link>
          );
        })}
      </nav>

      <form action={logoutAction} className="mt-auto hidden p-4 md:block">
        <button className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors duration-150 hover:border-gray-400 hover:bg-gray-100">
          Logout
        </button>
      </form>

      <p className="hidden px-4 pb-4 text-center text-xs text-gray-400 md:block">
        © 2026 TurnFlow Home. All rights reserved.
      </p>
    </aside>
  );
}
