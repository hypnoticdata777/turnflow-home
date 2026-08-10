import { config } from "dotenv";
import { evaluatePocReadiness, type PocReadinessEnv } from "@/lib/poc-readiness";

config({ path: ".env.local" });

const env: PocReadinessEnv = {
  DATABASE_URL: process.env.DATABASE_URL,
  AUTH_SECRET: process.env.AUTH_SECRET,
  APP_URL: process.env.APP_URL,
  BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN,
  HEALTHCHECK_SECRET: process.env.HEALTHCHECK_SECRET,
  CRON_SECRET: process.env.CRON_SECRET,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  NOTIFICATIONS_FROM_EMAIL: process.env.NOTIFICATIONS_FROM_EMAIL,
};

const report = evaluatePocReadiness(env);

console.log("TurnFlow Home POC readiness");
console.log(`Status: ${report.status.toUpperCase()}`);
console.log(`Blocked: ${report.blockedCount}`);
console.log(`Warnings: ${report.warningCount}`);
console.log("");

for (const item of report.items) {
  const marker =
    item.status === "ready" ? "PASS" : item.status === "warning" ? "WARN" : "BLOCK";
  console.log(`[${marker}] ${item.label}`);
  console.log(`  ${item.detail}`);
  if (item.nextStep) console.log(`  Next: ${item.nextStep}`);
}

if (report.status === "blocked") {
  console.log("");
  console.log("Resolve blocked items before running db:seed, ux:owner, ux:helper, or hosting a user-facing POC.");
  process.exit(1);
}

if (report.status === "warning") {
  console.log("");
  console.log("No hard blockers found, but warnings should be resolved before inviting real users.");
}
