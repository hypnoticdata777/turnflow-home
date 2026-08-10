import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium, type Page } from "playwright";

const BASE_URL = process.env.UX_BASE_URL || process.env.APP_URL || "http://localhost:3000";
const VENDOR_EMAIL = process.env.UX_VENDOR_EMAIL || "vendor@test.com";
const VENDOR_PASSWORD = process.env.UX_VENDOR_PASSWORD || "password123";
const COLLABORATOR_EMAIL = process.env.UX_COLLABORATOR_EMAIL || "collaborator@test.com";
const COLLABORATOR_PASSWORD = process.env.UX_COLLABORATOR_PASSWORD || "password123";
const OUT_DIR = path.resolve(process.cwd(), "screenshots", "ux-helper");

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
] as const;

async function login(page: Page, email: string, password: string) {
  await page.goto(new URL("/login", BASE_URL).toString(), { waitUntil: "networkidle" });
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();

  try {
    await page.waitForURL((url) => !url.pathname.startsWith("/login"), {
      timeout: 15000,
    });
  } catch {
    const alertText = await page.getByRole("alert").textContent().catch(() => null);
    throw new Error(
      [
        "Helper smoke could not sign in.",
        `Attempted account: ${email}`,
        alertText ? `Login page message: ${alertText}` : "No login error was rendered.",
        "Confirm AUTH_SECRET and DATABASE_URL are configured, run npm run db:seed, and rerun npm run ux:helper.",
      ].join(" ")
    );
  }

  await page.waitForLoadState("networkidle");
}

async function assertRoute(page: Page, pathName: string, heading: string) {
  await page.goto(new URL(pathName, BASE_URL).toString(), { waitUntil: "networkidle" });

  if (page.url().includes("/login")) {
    throw new Error(`Helper smoke was redirected to login while opening ${pathName}`);
  }

  const headingCount = await page.getByRole("heading", { name: heading }).count();
  if (headingCount === 0) {
    throw new Error(`${pathName} is missing heading "${heading}"`);
  }

  const hasEncodingArtifact = await page.locator("body").evaluate((body) => {
    const text = body.textContent || "";
    return text.includes("�") || text.includes("â") || text.includes("ð");
  });
  if (hasEncodingArtifact) {
    throw new Error(`${pathName} contains visible encoding artifacts`);
  }

  const overflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth - document.documentElement.clientWidth;
  });
  if (overflow > 2) {
    throw new Error(`${pathName} has ${overflow}px horizontal overflow`);
  }
}

async function hideDevOverlays(page: Page) {
  await page.evaluate(() => {
    document
      .querySelectorAll("nextjs-portal, [data-nextjs-toast], [data-nextjs-dialog-overlay]")
      .forEach((element) => element.remove());
  });
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const browser = await chromium.launch();
  try {
    for (const viewport of VIEWPORTS) {
      const vendorContext = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
      });
      const vendorPage = await vendorContext.newPage();
      await login(vendorPage, VENDOR_EMAIL, VENDOR_PASSWORD);
      await assertRoute(vendorPage, "/vendor", "Assigned requests");
      await hideDevOverlays(vendorPage);
      await vendorPage.screenshot({
        path: path.join(OUT_DIR, `vendor-${viewport.name}.png`),
        fullPage: true,
      });
      console.log(`Checked /vendor at ${viewport.name}`);
      await vendorContext.close();

      const collaboratorContext = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
      });
      const collaboratorPage = await collaboratorContext.newPage();
      await login(collaboratorPage, COLLABORATOR_EMAIL, COLLABORATOR_PASSWORD);
      await assertRoute(collaboratorPage, "/collaborator", "Shared requests");
      await hideDevOverlays(collaboratorPage);
      await collaboratorPage.screenshot({
        path: path.join(OUT_DIR, `collaborator-${viewport.name}.png`),
        fullPage: true,
      });
      console.log(`Checked /collaborator at ${viewport.name}`);
      await collaboratorContext.close();
    }
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
