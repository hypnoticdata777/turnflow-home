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
    title: "Request",
    body: "Intake",
    tone: "border-cyan-200 bg-cyan-50 text-cyan-950",
  },
  {
    title: "Share",
    body: "Scoped",
    tone: "border-emerald-200 bg-emerald-50 text-emerald-950",
  },
  {
    title: "Proof",
    body: "Saved",
    tone: "border-blue-200 bg-blue-50 text-blue-950",
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
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center gap-8 lg:grid-cols-[1fr_28rem]">
        <section className="order-2 max-w-2xl lg:order-1">
          <p className="text-sm font-semibold uppercase text-emerald-800">TurnFlow Home</p>
          <h2 className="mt-4 text-3xl font-bold leading-tight sm:text-5xl">
            Home repair records without the property management company.
          </h2>
          <p className="mt-5 max-w-xl text-base leading-7 text-slate-700">
            Built for homeowners, small landlords, and family helpers who need a
            trustworthy place to track maintenance from first report to final
            proof.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {TRUST_POINTS.map((point, index) => (
              <div key={point.title} className={`rounded-lg border p-4 shadow-sm ${point.tone}`}>
                <div className="flex h-8 w-8 items-center justify-center rounded-full border border-current/25 bg-white/80 text-sm font-bold">
                  {index + 1}
                </div>
                <h3 className="mt-4 text-lg font-bold text-slate-950">
                  {point.title}
                </h3>
                <p className="mt-1 text-sm font-semibold">
                  {point.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="order-1 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm lg:order-2">
          <div className="grid grid-cols-3 gap-px bg-slate-200">
            {["Owner", "Vendor", "Helper"].map((label) => (
              <div
                key={label}
                className="min-h-12 bg-slate-950 px-3 py-2 text-center text-xs font-semibold text-white"
              >
                {label}
              </div>
            ))}
          </div>
          <div className="p-6 sm:p-8">
          <div className="mb-6">
            <p className="text-sm font-semibold text-emerald-800">{eyebrow}</p>
            <h1 className="mt-2 text-2xl font-bold text-gray-950">{title}</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {description}
            </p>
          </div>

          {children}

          <div className="mt-6 border-t border-slate-100 pt-5 text-center text-sm text-slate-600">
            {footer}
          </div>
          </div>
        </section>
      </div>
    </main>
  );
}
