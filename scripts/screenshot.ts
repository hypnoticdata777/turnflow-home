// One-off script to generate README screenshots against a running app.
// Not part of the app itself; run manually with:
//   npx tsx scripts/screenshot.ts
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";
import type { Page } from "playwright";
import path from "node:path";

const BASE_URL = process.env.UX_BASE_URL || process.env.APP_URL || "http://localhost:3000";
const OWNER_EMAIL = process.env.UX_OWNER_EMAIL || "owner@test.com";
const OWNER_PASSWORD = process.env.UX_OWNER_PASSWORD || "password123";
const VENDOR_EMAIL = process.env.UX_VENDOR_EMAIL || "vendor@test.com";
const VENDOR_PASSWORD = process.env.UX_VENDOR_PASSWORD || "password123";
const OUT_DIR = path.resolve(process.cwd(), "screenshots");

async function hideDevOverlays(page: Page) {
  await page.evaluate(() => {
    document
      .querySelectorAll("nextjs-portal, [data-nextjs-toast], [data-nextjs-dialog-overlay]")
      .forEach((element) => element.remove());
  });
}

async function assertNoObviousVisualBreak(page: Page, label: string) {
  const hasEncodingArtifact = await page.locator("body").evaluate((body) => {
    const text = body.textContent || "";
    return text.includes("�") || text.includes("â") || text.includes("ð");
  });
  if (hasEncodingArtifact) {
    throw new Error(`${label} contains visible encoding artifacts`);
  }

  const overflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth - document.documentElement.clientWidth;
  });
  if (overflow > 2) {
    throw new Error(`${label} has ${overflow}px horizontal overflow`);
  }
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const browser = await chromium.launch();
  let context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  let page = await context.newPage();

  async function login(email: string, password: string) {
    await page.goto(new URL("/login", BASE_URL).toString(), { waitUntil: "domcontentloaded" });
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 15000 });
    await page.waitForLoadState("domcontentloaded");
  }

  async function gotoReady(pathName: string, heading: string | RegExp) {
    await page.goto(new URL(pathName, BASE_URL).toString(), { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { name: heading }).first().waitFor({ timeout: 15000 });
    await assertNoObviousVisualBreak(page, pathName);
  }

  async function shot(name: string, options: { fullPage?: boolean } = {}) {
    await page.waitForTimeout(300);
    await hideDevOverlays(page);
    await page.screenshot({
      path: path.join(OUT_DIR, `${name}.png`),
      fullPage: options.fullPage ?? false,
    });
    console.log("Captured:", name);
  }

  // 1. Login page
  await gotoReady("/login", "Welcome back");
  await shot("01-login");

  // 2. Owner: dashboard with status filters
  await login(OWNER_EMAIL, OWNER_PASSWORD);
  await gotoReady("/owner/dashboard", "My maintenance requests");
  await shot("02-dashboard");

  // 3. Owner: guided intake with category checklist showing
  await gotoReady("/owner/requests/new", "New maintenance request");
  await page.selectOption("select[name=category]", "Electrical");
  await page.selectOption("select[name=urgency]", "High");
  await page.fill('input[name="title"]', "Flickering lights in the garage");
  await shot("03-new-request-checklist");

  // 4. Owner: request detail - the HVAC request has real quotes + decision
  // log entries seeded (see scripts/seed-demo.ts), for a richer screenshot
  // than an empty request would give.
  await gotoReady("/owner/dashboard", "My maintenance requests");
  const hvacCard = page.locator("article", {
    has: page.locator("h2", { hasText: "HVAC not cooling upstairs" }),
  });
  const hvacHref = await hvacCard.locator('a:has-text("Open full record")').getAttribute("href");
  if (!hvacHref) {
    throw new Error("Could not find the HVAC request's View link on the dashboard");
  }
  await page.goto(new URL(hvacHref, BASE_URL).toString(), { waitUntil: "domcontentloaded" });
  await page.getByText("Repair command center", { exact: true }).first().waitFor({ timeout: 15000 });
  await page.getByRole("link", { name: "Bids" }).first().waitFor({ timeout: 15000 });
  await assertNoObviousVisualBreak(page, "request detail");
  await shot("04-request-detail");

  // 5. Owner: properties
  await gotoReady("/owner/properties", "Properties");
  await shot("05-properties");

  // 6. Owner: property document vault - select "The rental" explicitly,
  // since that's the property scripts/seed-demo.ts adds the demo document
  // to, and the page's default selection is whichever property is newest.
  await gotoReady("/owner/vault", "Property vault");
  const rentalLink = page.getByRole("link", { name: /The rental/ }).first();
  if (await rentalLink.isVisible().catch(() => false)) {
    await rentalLink.click();
    await page.waitForLoadState("domcontentloaded");
  }
  await shot("06-vault");

  // 7. Owner: maintenance calendar
  await gotoReady("/owner/calendar", "Maintenance calendar");
  await shot("07-calendar");

  // 8. Account & Sharing privacy controls
  await gotoReady("/owner/account", "Trust center");
  await shot("08-account-sharing", { fullPage: true });

  // 9. Vendor portal - fresh context so the owner session cookie doesn't linger
  await context.close();
  context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  page = await context.newPage();
  await login(VENDOR_EMAIL, VENDOR_PASSWORD);
  await gotoReady("/vendor", "Assigned requests");
  await shot("09-vendor-portal");

  await browser.close();
  console.log("Done - screenshots saved to", OUT_DIR);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
