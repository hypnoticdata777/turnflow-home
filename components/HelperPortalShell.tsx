import type { ReactNode } from "react";
import { logoutAction } from "@/lib/actions/auth";

export function HelperPortalShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  const navItems = [
    ["Overview", "#helper-workspace"],
    ["Scope", "#helper-scope"],
    ["Work", "#helper-requests"],
  ];

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 bg-slate-950 p-5 text-white sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-cyan-200">{eyebrow}</p>
              <h1 className="mt-1 text-3xl font-bold text-white">{title}</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
                {description}
              </p>
            </div>
            <form action={logoutAction}>
              <button className="inline-flex min-h-10 items-center justify-center rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm font-semibold text-white transition duration-150 hover:-translate-y-0.5 hover:bg-white/15 active:translate-y-0 active:scale-[0.99]">
                Logout
              </button>
            </form>
          </div>
          <nav
            aria-label="Helper workspace sections"
            className="grid grid-cols-3 gap-px border-t border-slate-200 bg-slate-200"
          >
            {navItems.map(([label, href]) => (
              <a
                key={href}
                href={href}
                className="flex min-h-12 items-center justify-center bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition duration-150 hover:bg-slate-950 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-slate-900 active:bg-slate-800"
              >
                {label}
              </a>
            ))}
          </nav>
        </header>

        {children}
      </div>
    </main>
  );
}
