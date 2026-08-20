// One-off script to generate README screenshots against the local dev
// server. Not part of the app itself; run manually with:
//   npx tsx scripts/screenshot.ts
import { chromium } from "playwright";
import path from "node:path";

const BASE_URL = "http://localhost:3000";
const OUT_DIR = path.resolve(__dirname, "../screenshots");

async function main() {
  const browser = await chromium.launch();
  let context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  let page = await context.newPage();

  async function login(email: string, password: string) {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForLoadState("networkidle");
  }

  async function shot(name: string) {
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(OUT_DIR, `${name}.png`) });
    console.log("Captured:", name);
  }

  // 1. Login page
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState("networkidle");
  await shot("01-login");

  // 2. Owner: dashboard with status filters
  await login("owner@test.com", "password123");
  await shot("02-dashboard");

  // 3. Owner: guided intake with category checklist showing
  await page.goto(`${BASE_URL}/owner/requests/new`);
  await page.waitForLoadState("networkidle");
  await page.selectOption("select[name=category]", "Electrical");
  await page.selectOption("select[name=urgency]", "High");
  await page.fill('input[name="title"]', "Flickering lights in the garage");
  await shot("03-new-request-checklist");

  // 4. Owner: request detail - the HVAC request has real quotes + decision
  // log entries seeded (see scripts/seed-demo.ts), for a richer screenshot
  // than an empty request would give.
  await page.goto(`${BASE_URL}/owner/dashboard`);
  await page.waitForLoadState("networkidle");
  const hvacCard = page.locator("article", {
    has: page.locator("h2", { hasText: "HVAC not cooling upstairs" }),
  });
  const hvacHref = await hvacCard.locator('a:has-text("Open full record")').getAttribute("href");
  if (!hvacHref) {
    throw new Error("Could not find the HVAC request's View link on the dashboard");
  }
  await page.goto(`${BASE_URL}${hvacHref}`);
  await page.waitForLoadState("networkidle");
  await shot("04-request-detail");

  // 5. Owner: properties
  await page.goto(`${BASE_URL}/owner/properties`);
  await page.waitForLoadState("networkidle");
  await shot("05-properties");

  // 6. Owner: property document vault - select "The rental" explicitly,
  // since that's the property scripts/seed-demo.ts adds the demo document
  // to, and the page's default selection is whichever property is newest.
  await page.goto(`${BASE_URL}/owner/vault`);
  await page.waitForLoadState("networkidle");
  await page.click('a:has-text("The rental")');
  await page.waitForLoadState("networkidle");
  await shot("06-vault");

  // 7. Owner: maintenance calendar
  await page.goto(`${BASE_URL}/owner/calendar`);
  await page.waitForLoadState("networkidle");
  await shot("07-calendar");

  // 8. Vendor portal - fresh context so the owner session cookie doesn't linger
  await context.close();
  context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  page = await context.newPage();
  await login("vendor@test.com", "password123");
  await shot("08-vendor-portal");

  await browser.close();
  console.log("Done - screenshots saved to", OUT_DIR);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
