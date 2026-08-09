import type { ReactNode } from "react";

type AuthChromeProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
};

const TRUST_POINTS = [
  {
    title: "Repair records stay organized",
    body: "Keep requests, quotes, photos, receipts, and decisions together by property.",
  },
  {
    title: "Sharing is scoped",
    body: "Invite vendors or helpers to the specific request they need, then remove access when the work is done.",
  },
  {
    title: "Proof survives the job",
    body: "Build a calmer home maintenance history instead of searching old texts later.",
  },
];

export function AuthChrome({
  eyebrow,
  title,
  description,
  children,
  footer,
}: AuthChromeProps) {
  return (
    <main className="min-h-screen bg-[#f6f7f4] px-4 py-8 text-gray-950 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center gap-8 lg:grid-cols-[1fr_28rem]">
        <section className="order-2 max-w-2xl lg:order-1">
          <p className="text-sm font-semibold uppercase text-emerald-800">
            TurnFlow Home
          </p>
          <h2 className="mt-4 text-3xl font-bold leading-tight sm:text-5xl">
            Home repair records without the property management company.
          </h2>
          <p className="mt-5 max-w-xl text-base leading-7 text-gray-700">
            Built for homeowners, small landlords, and family helpers who need a
            trustworthy place to track maintenance from first report to final
            proof.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            {TRUST_POINTS.map((point) => (
              <div
                key={point.title}
                className="border-l-4 border-emerald-700 bg-white/60 py-2 pl-4"
              >
                <h3 className="text-sm font-semibold text-gray-950">
                  {point.title}
                </h3>
                <p className="mt-1 text-sm leading-6 text-gray-600">
                  {point.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="order-1 w-full rounded-lg border border-gray-200 bg-white p-6 shadow-sm sm:p-8 lg:order-2">
          <div className="mb-6">
            <p className="text-sm font-semibold text-emerald-800">{eyebrow}</p>
            <h1 className="mt-2 text-2xl font-bold text-gray-950">{title}</h1>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              {description}
            </p>
          </div>

          {children}

          <div className="mt-6 border-t border-gray-100 pt-5 text-center text-sm text-gray-600">
            {footer}
          </div>
        </section>
      </div>
    </main>
  );
}
