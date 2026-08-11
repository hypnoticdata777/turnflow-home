import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium, type Page } from "playwright";

const BASE_URL = process.env.UX_BASE_URL || process.env.APP_URL || "http://localhost:3000";
const OWNER_EMAIL = process.env.UX_OWNER_EMAIL || "owner@test.com";
const OWNER_PASSWORD = process.env.UX_OWNER_PASSWORD || "password123";
const OUT_DIR = path.resolve(process.cwd(), "screenshots", "ux-owner");

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
] as const;

const ROUTES = [
  { name: "setup", path: "/owner/onboarding", heading: "Build your first repair record", nav: "Setup" },
  { name: "requests", path: "/owner/dashboard", heading: "My maintenance requests", nav: "Requests" },
  { name: "new-request", path: "/owner/requests/new", heading: "New maintenance request", nav: "Requests" },
  { name: "properties", path: "/owner/properties", heading: "Properties", nav: "Properties" },
  { name: "vault", path: "/owner/vault", heading: "Property vault", nav: "Vault" },
  { name: "calendar", path: "/owner/calendar", heading: "Maintenance calendar", nav: "Calendar" },
  { name: "account", path: "/owner/account", heading: "Trust center", nav: "Account" },
  { name: "notifications", path: "/owner/notifications", heading: "Notifications", nav: "Notifications" },
  { name: "backup", path: "/owner/backup", heading: "Backup & restore", nav: "Backup" },
] as const;

const ROUTE_TEXT_CHECKS: Partial<Record<(typeof ROUTES)[number]["path"], string[]>> = {
  "/owner/dashboard": ["Homeowner value", "What TurnFlow is protecting for this home"],
  "/owner/notifications": ["Notification health", "Can owners trust outbound alerts?"],
};

async function login(page: Page) {
  await page.goto(new URL("/login", BASE_URL).toString(), { waitUntil: "networkidle" });
  await page.getByLabel("Email").fill(OWNER_EMAIL);
  await page.getByLabel("Password").fill(OWNER_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();

  try {
    await page.waitForURL((url) => !url.pathname.startsWith("/login"), {
      timeout: 15000,
    });
  } catch {
    const alertText = await page.getByRole("alert").textContent().catch(() => null);
    throw new Error(
      [
        "Owner smoke could not sign in.",
        `Attempted account: ${OWNER_EMAIL}`,
        alertText ? `Login page message: ${alertText}` : "No login error was rendered.",
        "Confirm AUTH_SECRET and DATABASE_URL are configured, run npm run db:seed, and rerun npm run ux:owner.",
      ].join(" ")
    );
  }

  await page.waitForLoadState("networkidle");
}

async function assertRoute(page: Page, route: (typeof ROUTES)[number]) {
  await page.goto(new URL(route.path, BASE_URL).toString(), { waitUntil: "networkidle" });

  if (page.url().includes("/login")) {
    throw new Error(`Owner smoke was redirected to login while opening ${route.path}`);
  }

  const headingCount = await page.getByRole("heading", { name: route.heading }).count();
  if (headingCount === 0) {
    throw new Error(`${route.path} is missing heading "${route.heading}"`);
  }

  const nav = page.getByRole("navigation", { name: "Owner navigation" });
  if ((await nav.count()) === 0) {
    throw new Error(`${route.path} is missing owner navigation`);
  }

  const activeNav = nav.getByRole("link", { name: new RegExp(`^${route.nav}`) });
  const ariaCurrent = await activeNav.first().getAttribute("aria-current");
  if (ariaCurrent !== "page") {
    throw new Error(`${route.path} does not mark "${route.nav}" as the active nav item`);
  }

  const hasEncodingArtifact = await page.locator("body").evaluate((body) => {
    const text = body.textContent || "";
    return text.includes("�") || text.includes("â") || text.includes("ð");
  });
  if (hasEncodingArtifact) {
    throw new Error(`${route.path} contains visible encoding artifacts`);
  }

  const overflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth - document.documentElement.clientWidth;
  });
  if (overflow > 2) {
    throw new Error(`${route.path} has ${overflow}px horizontal overflow`);
  }

  for (const expectedText of ROUTE_TEXT_CHECKS[route.path] ?? []) {
    if ((await page.getByText(expectedText, { exact: true }).count()) === 0) {
      throw new Error(`${route.path} is missing route quality text "${expectedText}"`);
    }
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
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
      });
      const page = await context.newPage();
      await login(page);

      for (const route of ROUTES) {
        await assertRoute(page, route);
        await hideDevOverlays(page);
        const screenshotPath = path.join(OUT_DIR, `${route.name}-${viewport.name}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });
        console.log(`Checked ${route.path} at ${viewport.name}: ${screenshotPath}`);
      }

      await context.close();
    }
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
