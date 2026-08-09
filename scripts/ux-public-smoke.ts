import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium, type Page } from "playwright";

const BASE_URL = process.env.UX_BASE_URL || process.env.APP_URL || "http://localhost:3000";
const OUT_DIR = path.resolve(process.cwd(), "screenshots", "ux-public");

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
] as const;

const ROUTES = [
  {
    name: "login",
    path: "/login",
    heading: "Welcome back",
    labels: ["Email", "Password"],
    button: "Sign in",
  },
  {
    name: "signup",
    path: "/signup",
    heading: "Start your repair record",
    labels: ["Full name", "Email", "Password"],
    button: "Create owner account",
  },
] as const;

async function assertRoute(page: Page, route: (typeof ROUTES)[number]) {
  const url = new URL(route.path, BASE_URL).toString();
  await page.goto(url, { waitUntil: "networkidle" });

  const headingCount = await page.getByRole("heading", { name: route.heading }).count();
  if (headingCount === 0) {
    throw new Error(`${route.path} is missing heading "${route.heading}"`);
  }

  for (const label of route.labels) {
    const count = await page.getByLabel(label).count();
    if (count === 0) {
      throw new Error(`${route.path} is missing accessible field label "${label}"`);
    }
  }

  const buttonCount = await page.getByRole("button", { name: route.button }).count();
  if (buttonCount === 0) {
    throw new Error(`${route.path} is missing button "${route.button}"`);
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
