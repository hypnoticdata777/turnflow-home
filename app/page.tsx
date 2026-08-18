import Link from "next/link";

const PROOF_POINTS = [
  {
    title: "One repair record",
    body: "Keep request notes, access context, photos, quotes, task scope, closeout, billing history, and decisions together.",
  },
  {
    title: "Scoped vendor help",
    body: "Invite a vendor into only the job they need, then let next-action guidance move them from bid to proof to closeout.",
  },
  {
    title: "Owner-owned history",
    body: "Export proof packets, property histories, CSV records, and JSON backups so the home record stays portable.",
  },
];

const WORKFLOW = [
  "Log the issue",
  "Invite help",
  "Compare cost",
  "Track proof",
  "Approve closeout",
  "Keep history",
];

const READINESS = [
  {
    label: "For homeowners",
    detail: "A calmer way to self-manage repairs without adopting a full property management command center.",
  },
  {
    label: "For vendors",
    detail: "A scoped workspace that shows the current job, the next action, and the proof needed before owner review.",
  },
  {
    label: "For future you",
    detail: "A maintenance record that survives after the text thread, receipt, or invoice gets buried.",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#f7f7f2] text-gray-950">
      <section className="relative min-h-[78vh] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/turnflow-dashboard.png"
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-left-top opacity-30 sm:opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/85 to-white/45" />
        <figure className="absolute bottom-12 right-[-10rem] hidden w-[52rem] overflow-hidden rounded-lg border border-gray-200 bg-white shadow-2xl lg:block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/turnflow-dashboard.png"
            alt="TurnFlow Home owner dashboard showing maintenance requests by status"
            className="h-auto w-full"
          />
        </figure>
        <div className="relative mx-auto flex min-h-[78vh] max-w-6xl flex-col justify-between px-4 py-5 sm:px-6 lg:px-8">
          <nav className="flex items-center justify-between gap-4">
            <Link href="/" className="text-sm font-bold tracking-normal text-gray-950">
              TurnFlow Home
            </Link>
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="rounded-lg border border-gray-300 bg-white/80 px-3 py-2 text-sm font-medium text-gray-800 transition-colors duration-150 hover:border-gray-400 hover:bg-white"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="rounded-lg bg-gray-950 px-3 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-black"
              >
                Create account
              </Link>
            </div>
          </nav>

          <div className="max-w-2xl pb-10 pt-16 sm:pt-24">
            <p className="text-sm font-semibold uppercase tracking-normal text-emerald-800">
              Homeowner maintenance workspace
            </p>
            <h1 className="mt-4 text-4xl font-bold leading-tight text-gray-950 sm:text-6xl">
              TurnFlow Home
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-gray-700">
              A repair record for homeowners who want cost clarity, vendor
              handoffs, photo proof, billing history, and portable maintenance
              records without handing the whole house to a PMC.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-lg bg-emerald-800 px-5 py-3 text-sm font-semibold text-white transition-colors duration-150 hover:bg-emerald-900"
              >
                Start owner workspace
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white/85 px-5 py-3 text-sm font-semibold text-gray-800 transition-colors duration-150 hover:border-gray-400 hover:bg-white"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-gray-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-3 px-4 py-5 sm:grid-cols-3 sm:px-6 lg:px-8">
          {READINESS.map((item) => (
            <article key={item.label} className="rounded-lg border border-gray-200 p-4">
              <h2 className="text-sm font-semibold text-gray-950">{item.label}</h2>
              <p className="mt-2 text-sm leading-6 text-gray-600">{item.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-normal text-blue-800">
              Built around the owner record
            </p>
            <h2 className="mt-3 text-3xl font-bold text-gray-950">
              Every repair gets a path from issue to proof.
            </h2>
            <p className="mt-4 text-base leading-7 text-gray-700">
              TurnFlow Home keeps the work small enough for homeowners to use,
              but serious enough for vendors to bid, start work with proof,
              submit closeout, and leave a final record the owner can trust.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {PROOF_POINTS.map((point) => (
              <article key={point.title} className="rounded-lg border border-gray-200 bg-white p-4">
                <h3 className="text-base font-semibold text-gray-950">{point.title}</h3>
                <p className="mt-2 text-sm leading-6 text-gray-600">{point.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gray-950 text-white">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-normal text-emerald-300">
                Workflow
              </p>
              <h2 className="mt-2 text-2xl font-bold">Slow is smooth, smooth is fast.</h2>
            </div>
            <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
              {WORKFLOW.map((step, index) => (
                <li key={step} className="rounded-lg border border-white/15 bg-white/10 p-3">
                  <p className="text-xs font-semibold text-emerald-200">
                    Step {index + 1}
                  </p>
                  <p className="mt-1 text-sm font-semibold">{step}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>
    </main>
  );
}
