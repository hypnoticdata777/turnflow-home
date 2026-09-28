// Curated investor demo seed (manual reset).
//
// Resets only the @turnflow.demo investor accounts, then rebuilds the demo
// story. The story itself lives in lib/demo/investor-seed.ts so the nightly
// cron (app/api/cron/reset-investor-demo/route.ts) runs the same code.
//
// Requires INVESTOR_DEMO_PASSWORD (12+ characters) in .env.local or the
// environment. The password is never printed or committed.
import { config } from "dotenv";
config({ path: ".env.local" });

import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "../lib/db/schema";
import { investorDemoPasswordProblem, resetInvestorDemo } from "../lib/demo/investor-seed";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set - see .env.local.example");
}

const passwordProblem = investorDemoPasswordProblem(process.env.INVESTOR_DEMO_PASSWORD);
if (passwordProblem) {
  throw new Error(`${passwordProblem} Set it in .env.local before seeding the investor demo.`);
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql, { schema });

resetInvestorDemo(db, process.env.INVESTOR_DEMO_PASSWORD!)
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Investor demo seed failed:", err);
    process.exit(1);
  });
