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
  return (
    <main className="min-h-screen bg-gray-100 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-6 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-emerald-800">{eyebrow}</p>
              <h1 className="mt-1 text-3xl font-bold text-gray-950">{title}</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
                {description}
              </p>
            </div>
            <form action={logoutAction}>
              <button className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors duration-150 hover:border-gray-400 hover:bg-gray-100">
                Logout
              </button>
            </form>
          </div>
        </header>

        {children}
      </div>
    </main>
  );
}
