import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { chromium, type Page } from "playwright";

const BASE_URL = process.env.UX_BASE_URL || process.env.APP_URL || "http://localhost:3000";
const RUN_ID = process.env.UX_FLOW_RUN_ID || new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
const OWNER_EMAIL = process.env.UX_FLOW_EMAIL || `owner-flow-${RUN_ID}@example.com`;
const OWNER_PASSWORD = process.env.UX_FLOW_PASSWORD || "Password123!";
const PROPERTY_ADDRESS = process.env.UX_FLOW_PROPERTY_ADDRESS || `POC test home ${RUN_ID}`;
const PROPERTY_NICKNAME = process.env.UX_FLOW_PROPERTY_NICKNAME || `POC flow home ${RUN_ID}`;
const REQUEST_TITLE = process.env.UX_FLOW_REQUEST_TITLE || `Kitchen sink drip ${RUN_ID}`;
const OUT_DIR = path.resolve(process.cwd(), "screenshots", "ux-owner-flow");

const SAMPLE_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=";

async function writeSamplePhoto() {
  const dir = await mkdtemp(path.join(os.tmpdir(), "turnflow-owner-flow-"));
  const filePath = path.join(dir, "before-proof.png");
  await writeFile(filePath, Buffer.from(SAMPLE_PNG_BASE64, "base64"));
  return filePath;
}

async function expectNoHorizontalOverflow(page: Page, label: string) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  if (overflow > 2) {
    throw new Error(`${label} has ${overflow}px horizontal overflow`);
  }
}

async function signup(page: Page) {
  await page.goto(new URL("/signup", BASE_URL).toString(), { waitUntil: "networkidle" });
  await page.getByLabel("Full name").fill("POC Flow Owner");
  await page.getByLabel("Email").fill(OWNER_EMAIL);
  await page.getByLabel("Password").fill(OWNER_PASSWORD);
  await page.getByRole("button", { name: "Create owner account" }).click();
  await page.waitForURL((url) => url.pathname.startsWith("/owner/onboarding"), {
    timeout: 15000,
  });
  await page.waitForLoadState("networkidle");
  await expectNoHorizontalOverflow(page, "owner onboarding after signup");
}

async function addProperty(page: Page) {
  await page.goto(new URL("/owner/properties", BASE_URL).toString(), { waitUntil: "networkidle" });
  await page.getByLabel("Address").fill(PROPERTY_ADDRESS);
  await page.getByLabel("Nickname").fill(PROPERTY_NICKNAME);
  await page.getByRole("button", { name: "Add property" }).click();
  await page.getByText(PROPERTY_NICKNAME).waitFor({ timeout: 15000 });
  await expectNoHorizontalOverflow(page, "owner properties after property creation");
}

async function createRequest(page: Page, samplePhotoPath: string) {
  const uploadDiagnostics: string[] = [];
  page.on("response", async (response) => {
    const url = response.url();
    const shouldTrace =
      url.includes("/api/blob-upload") ||
      url.includes("vercel-storage.com") ||
      response.status() >= 400;

    if (!shouldTrace) return;

    let body = "";
    try {
      body = await response.text();
    } catch {
      body = "<unavailable>";
    }

    const redactedBody = body.replace(
      /"clientToken":"[^"]+"/g,
      '"clientToken":"<redacted>"'
    );

    uploadDiagnostics.push(
      `${response.status()} ${url}\n${redactedBody.slice(0, 600)}`
    );
  });

  page.on("console", (message) => {
    if (message.type() === "error") {
      uploadDiagnostics.push(`console error: ${message.text()}`);
    }
  });

  await page.goto(new URL("/owner/requests/new", BASE_URL).toString(), { waitUntil: "networkidle" });
  await page.getByLabel("Property").selectOption({ label: `${PROPERTY_NICKNAME} - ${PROPERTY_ADDRESS}` });
  await page.getByLabel("Short title").fill(REQUEST_TITLE);
  await page.getByLabel("Category").selectOption("Plumbing");
  await page.getByLabel("Urgency").selectOption("Medium");
  await page.getByLabel("Room / location").fill("Kitchen sink cabinet");
  await page.getByLabel("Preferred contact method").selectOption("Email");
  await page.getByLabel("Access instructions").fill("Use the side door. No pets on site.");
  await page.getByLabel("Notes").fill("Small steady drip under the sink after using hot water.");
  await page.locator('input[type="file"]').first().setInputFiles(samplePhotoPath);
  await page.getByRole("button", { name: "Save draft request" }).click();
  await page.waitForURL(
    (url) =>
      url.pathname.startsWith("/owner/requests/") &&
      url.pathname !== "/owner/requests/new",
    { timeout: 30000 }
  );
  await page.waitForLoadState("networkidle");

  const bodyText = await page.locator("body").innerText();
  if (bodyText.includes("photos did not upload")) {
    throw new Error(
      [
        "owner request was created, but the queued proof photo did not upload",
        ...uploadDiagnostics,
      ].join("\n\n")
    );
  }
}

async function assertRequestDetail(page: Page) {
  const bodyText = await page.locator("body").innerText();
  for (const expectedText of [
    REQUEST_TITLE,
    PROPERTY_ADDRESS,
    "Repair record",
    "Evidence trail",
    "Record workflow",
    "Start the evidence trail",
    "Vendor",
    "Decision Log",
  ]) {
    if (!bodyText.includes(expectedText)) {
      throw new Error(`created request detail is missing "${expectedText}"`);
    }
  }

  if (!/Before|before proof/i.test(bodyText)) {
    throw new Error("created request detail does not show the uploaded before proof context");
  }

  await expectNoHorizontalOverflow(page, "created request detail");
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const samplePhotoPath = await writeSamplePhoto();
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await signup(page);
    await page.screenshot({ path: path.join(OUT_DIR, "01-onboarding.png"), fullPage: true });
    await addProperty(page);
    await page.screenshot({ path: path.join(OUT_DIR, "02-property-created.png"), fullPage: true });
    await createRequest(page, samplePhotoPath);
    await page.screenshot({ path: path.join(OUT_DIR, "03-request-created.png"), fullPage: true });
    await assertRequestDetail(page);
    console.log(`Created owner flow account: ${OWNER_EMAIL}`);
    console.log(`Created property: ${PROPERTY_NICKNAME}`);
    console.log(`Created request: ${REQUEST_TITLE}`);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
