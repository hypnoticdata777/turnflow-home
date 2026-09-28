// Nightly investor demo reset (P0 security, 2026-09-28). The hosted demo
// accounts are shared, so anything a visitor uploads, edits, or deletes is
// wiped every night by rebuilding the curated story. Opt-in: it only runs
// when INVESTOR_DEMO_RESET_ENABLED=true and INVESTOR_DEMO_PASSWORD is set,
// so it can never touch a database that is not meant to host the demo.
// Schedule: vercel.json. See docs/04-algorithms/09-investor-demo-reset.md.
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authorizeCronRequest } from "@/lib/cron-auth";
import { investorDemoPasswordProblem, resetInvestorDemo } from "@/lib/demo/investor-seed";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const authorization = authorizeCronRequest(request.headers.get("authorization"));
  if (!authorization.ok) {
    return NextResponse.json({ error: authorization.error }, { status: authorization.status });
  }

  if (process.env.INVESTOR_DEMO_RESET_ENABLED !== "true") {
    return NextResponse.json({ skipped: true, reason: "INVESTOR_DEMO_RESET_ENABLED is not true" });
  }

  const passwordProblem = investorDemoPasswordProblem(process.env.INVESTOR_DEMO_PASSWORD);
  if (passwordProblem) {
    return NextResponse.json({ skipped: true, reason: passwordProblem }, { status: 503 });
  }

  try {
    await resetInvestorDemo(db, process.env.INVESTOR_DEMO_PASSWORD!);
    return NextResponse.json({ reset: true });
  } catch (error) {
    console.error("[cron] investor demo reset failed", error);
    return NextResponse.json({ error: "Investor demo reset failed" }, { status: 500 });
  }
}
