import Link from "next/link";
import { logoutAction } from "@/lib/actions/auth";

const NAV_ITEMS = [
  { href: "/owner/onboarding", label: "Setup" },
  { href: "/owner/account", label: "Account" },
  { href: "/owner/dashboard", label: "🏠 Requests" },
  { href: "/owner/requests/new", label: "🆕 New Request" },
  { href: "/owner/properties", label: "🏘️ Properties" },
  { href: "/owner/vault", label: "🗄️ Vault" },
  { href: "/owner/calendar", label: "📅 Calendar" },
  { href: "/owner/notifications", label: "🔔 Notifications" },
  { href: "/owner/backup", label: "💾 Backup" },
  // Contacts, Stats land in later phases.
];

export function OwnerSidebar() {
  return (
    <aside className="w-full md:w-56 md:min-h-screen bg-white border-b md:border-b-0 md:border-r shadow-sm flex flex-col p-4">
      <div className="mb-2 md:mb-8 flex justify-between items-center md:block">
        <span className="text-lg font-bold tracking-tight">TurnFlow Home</span>
        <form action={logoutAction} className="md:hidden">
          <button className="text-xs px-2 py-1 border rounded">Logout</button>
        </form>
      </div>
      <nav className="flex flex-row md:flex-col gap-1 flex-1 overflow-x-auto md:overflow-visible">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors whitespace-nowrap"
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <form action={logoutAction} className="hidden md:block mt-4">
        <button className="w-full px-3 py-2 border rounded text-sm">Logout</button>
      </form>
    </aside>
  );
}
