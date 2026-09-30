import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { Presentation, PresentationFile } from "@oai/artifact-tool";

const workspaceDir = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(?:[A-Za-z]:)/, (m) => m.slice(1))), "..");
const SKILL_DIR = process.env.SKILL_DIR;
const TMP_DIR = process.env.TMP_DIR;
const FINAL_PPTX = process.env.FINAL_PPTX;
const RUNTIME_PYTHON = process.env.RUNTIME_PYTHON;

if (!SKILL_DIR || !TMP_DIR || !FINAL_PPTX || !RUNTIME_PYTHON) {
  throw new Error("Set SKILL_DIR, TMP_DIR, FINAL_PPTX, and RUNTIME_PYTHON");
}

const { finalizePresentation } = await import(
  pathToFileURL(path.join(SKILL_DIR, "container_tools/artifact_tool_utils.mjs")).href
);

const W = 1280;
const H = 720;
const C = {
  bg: "#0E0F1A",
  panel: "#1B1D2E",
  panel2: "#262A42",
  line: "#3A3F5E",
  text: "#F1F2F8",
  muted: "#A7ACC2",
  dim: "#737A99",
  violet: "#8B7CFF",
  mint: "#2DD4A7",
  amber: "#F5B84B",
  coral: "#FF6B8A",
  sky: "#5EC8F2",
  white: "#FFFFFF",
  ink: "#10121E",
};
const FONT = "Arial";
const BODY = "Calibri";
const CODE = "Courier New";

const presentation = Presentation.create({ slideSize: { width: W, height: H } });
presentation.theme.colorScheme = {
  name: "TurnFlow Dark",
  themeColors: {
    accent1: C.violet, accent2: C.mint, accent3: C.amber, accent4: C.coral,
    accent5: C.sky, accent6: C.dim, bg1: C.bg, bg2: C.panel,
    tx1: C.text, tx2: C.muted, dk1: "#000000", dk2: C.ink,
    lt1: C.white, lt2: "#E7E9F2", hlink: C.sky, folHlink: C.violet,
  },
};

function addText(slide, text, x, y, w, h, options = {}) {
  const shape = slide.shapes.add({
    geometry: "textbox",
    position: { left: x, top: y, width: w, height: h },
    fill: "none",
    line: { style: "solid", fill: "none", width: 0 },
  });
  shape.text = text;
  shape.text.style = {
    typeface: options.typeface || BODY,
    fontSize: options.fontSize || 22,
    bold: options.bold || false,
    italic: options.italic || false,
    color: options.color || C.text,
    alignment: options.align || "left",
    verticalAlignment: options.valign || "top",
    autoFit: options.autoFit || "shrinkText",
    insets: options.insets || { top: 0, right: 0, bottom: 0, left: 0 },
  };
  return shape;
}

function rect(slide, x, y, w, h, options = {}) {
  const geometry = options.geometry || "roundRect";
  return slide.shapes.add({
    geometry,
    position: { left: x, top: y, width: w, height: h },
    fill: options.fill || C.panel,
    line: { style: options.dash || "solid", fill: options.line || options.fill || C.panel, width: options.width || 1 },
    ...(["rect", "textbox", "roundRect"].includes(geometry)
      ? { borderRadius: options.radius ?? 14 }
      : {}),
  });
}

function label(slide, text, x, y, w, color) {
  rect(slide, x, y, w, 28, { fill: `${color}20`, line: color, radius: 14 });
  addText(slide, text.toUpperCase(), x, y + 1, w, 26, { fontSize: 13, bold: true, color, align: "center", valign: "middle", typeface: FONT });
}

function title(slide, chapter, chapterColor, heading, subheading) {
  slide.background.fill = C.bg;
  if (chapter) label(slide, chapter, 64, 34, Math.max(150, chapter.length * 8.5), chapterColor);
  addText(slide, heading, 64, 82, 1152, 58, { fontSize: 42, bold: true, typeface: FONT });
  if (subheading) addText(slide, subheading, 64, 143, 1120, 42, { fontSize: 20, color: C.muted, italic: true });
}

function footer(slide, n) {
  addText(slide, `TURNFLOW HOME  •  SYSTEM GUIDE`, 64, 680, 460, 18, { fontSize: 11, color: C.dim, typeface: FONT });
  addText(slide, String(n).padStart(2, "0"), 1170, 678, 46, 20, { fontSize: 12, color: C.dim, align: "right", typeface: CODE });
}

function note(slide, text) {
  slide.speakerNotes.textFrame.setText(text);
}

function card(slide, x, y, w, h, heading, body, color = C.violet, options = {}) {
  const box = rect(slide, x, y, w, h, { fill: options.fill || C.panel, line: options.line || C.line, radius: 16, width: options.width || 1 });
  addText(slide, heading, x + 18, y + 15, w - 36, 32, { fontSize: options.headingSize || 22, bold: true, color, typeface: FONT });
  if (body) addText(slide, body, x + 18, y + 54, w - 36, h - 66, { fontSize: options.bodySize || 18, color: options.bodyColor || C.muted, valign: options.valign || "top" });
  return box;
}

function node(slide, x, y, w, h, heading, body, color) {
  const s = rect(slide, x, y, w, h, { fill: C.panel, line: color, width: 2, radius: 12 });
  addText(slide, heading, x + 12, y + 10, w - 24, 28, { fontSize: 19, bold: true, color, align: "center", typeface: FONT });
  if (body) addText(slide, body, x + 12, y + 42, w - 24, h - 50, { fontSize: 15, color: C.muted, align: "center", valign: "middle" });
  return s;
}

function connect(slide, from, to, options = {}) {
  return slide.shapes.connect(from, to, {
    kind: options.kind || "elbow",
    fromSide: options.fromSide,
    toSide: options.toSide,
    line: { style: options.dash || "solid", fill: options.color || C.dim, width: options.width || 2 },
    ...(options.noHead ? {} : { tail: { type: "arrow", width: "sm", length: "sm" } }),
  });
}

async function addImage(slide, relativePath, x, y, w, h, options = {}) {
  const full = path.join(workspaceDir, relativePath);
  const bytes = await fs.readFile(full);
  rect(slide, x - 6, y - 6, w + 12, h + 12, { fill: C.panel2, line: options.color || C.line, radius: 16, width: 1.5 });
  slide.images.add({
    blob: bytes,
    contentType: "image/png",
    alt: options.alt || path.basename(relativePath),
    fit: options.fit || "contain",
    position: { left: x, top: y, width: w, height: h },
    geometry: "roundRect",
    borderRadius: "rounded-xl",
    ...(options.crop ? { crop: options.crop } : {}),
  });
}

function bullets(slide, items, x, y, w, options = {}) {
  const gap = options.gap || 46;
  items.forEach((item, i) => {
    const c = options.colors?.[i] || options.color || C.mint;
    const dot = rect(slide, x, y + i * gap + 5, 18, 18, { geometry: "ellipse", fill: c, line: c, radius: 9 });
    dot.text = "";
    addText(slide, item, x + 32, y + i * gap, w - 32, gap - 4, { fontSize: options.fontSize || 20, color: options.textColor || C.text, valign: "middle" });
  });
}

let slideNo = 0;
function newSlide(chapter, color, heading, subheading) {
  slideNo += 1;
  const s = presentation.slides.add();
  title(s, chapter, color, heading, subheading);
  footer(s, slideNo);
  return s;
}

// 1. Cover
{
  slideNo += 1;
  const s = presentation.slides.add();
  s.background.fill = C.bg;
  addText(s, "TURNFLOW HOME", 72, 78, 500, 30, { fontSize: 18, color: C.mint, bold: true, typeface: CODE });
  addText(s, "How the System Works", 72, 132, 850, 86, { fontSize: 62, bold: true, typeface: FONT });
  addText(s, "A visual guide to the product, user journeys, architecture, data, security, delivery, and the safest places to extend the code.", 72, 232, 810, 92, { fontSize: 25, color: C.muted });
  const chain = [
    ["Home", C.violet], ["Request", C.mint], ["Shared work", C.amber], ["Proof history", C.coral],
  ];
  const boxes = chain.map(([t, c], i) => node(s, 72 + i * 275, 410, 220, 84, t, "", c));
  for (let i = 0; i < boxes.length - 1; i++) connect(s, boxes[i], boxes[i + 1], { fromSide: "right", toSide: "left" });
  addText(s, "Repository state: 30 September 2026", 72, 602, 430, 28, { fontSize: 15, color: C.dim });
  addText(s, "Carlos Sanchez Gonzalez", 72, 634, 430, 24, { fontSize: 14, color: C.dim });
  footer(s, slideNo);
  note(s, "Purpose: orient a mixed audience to TurnFlow Home. Sources: README.md, package.json, repository inspection. Visual language adapted from the supplied h777 reference deck.");
}

// 2. Reading map
{
  const s = newSlide("ORIENTATION", C.violet, "Six lenses on one product", "Each section answers a different question about TurnFlow Home");
  const items = [
    ["1", "Product", "Why it exists and where it stops", C.violet],
    ["2", "Experience", "What each role sees and does", C.mint],
    ["3", "Architecture", "How requests and data move", C.sky],
    ["4", "Code", "Where responsibilities live", C.amber],
    ["5", "Trust", "How access and evidence stay scoped", C.coral],
    ["6", "Delivery", "How to verify, deploy, and extend", C.violet],
  ];
  items.forEach(([n, h, b, c], i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = 70 + col * 400;
    const y = 215 + row * 185;
    rect(s, x, y, 350, 145, { fill: C.panel, line: C.line, radius: 18 });
    rect(s, x + 18, y + 20, 48, 48, { geometry: "ellipse", fill: c, line: c, radius: 24 });
    addText(s, n, x + 18, y + 20, 48, 48, { fontSize: 22, bold: true, color: C.bg, align: "center", valign: "middle", typeface: FONT });
    addText(s, h, x + 82, y + 20, 245, 34, { fontSize: 24, bold: true, color: c, typeface: FONT });
    addText(s, b, x + 82, y + 62, 240, 56, { fontSize: 18, color: C.muted });
  });
  note(s, "Source: deliverable structure requested by the user, adapted to the repository evidence.");
}

// 3. Summary
{
  const s = newSlide("ORIENTATION", C.violet, "TurnFlow Home in one picture", "A homeowner-owned repair record with request-scoped help");
  const owner = node(s, 80, 300, 190, 100, "Homeowner", "Owns the durable record", C.violet);
  const request = node(s, 405, 260, 280, 180, "Maintenance request", "Scope, costs, proof, tasks, updates, decisions, closeout", C.mint);
  const vendor = node(s, 835, 210, 250, 100, "Vendor", "Assigned work and closeout", C.amber);
  const helper = node(s, 835, 390, 250, 100, "Collaborator", "Shared context and updates", C.sky);
  connect(s, owner, request, { fromSide: "right", toSide: "left", color: C.violet });
  connect(s, request, vendor, { fromSide: "right", toSide: "left", color: C.amber });
  connect(s, request, helper, { fromSide: "right", toSide: "left", color: C.sky });
  addText(s, "The owner shares one repair, not the whole account", 365, 505, 420, 38, { fontSize: 21, bold: true, color: C.coral, align: "center" });
  label(s, "CURRENT MATURITY", 488, 570, 220, C.mint);
  addText(s, "Launch-oriented SaaS proof of concept", 390, 614, 420, 30, { fontSize: 22, color: C.text, align: "center" });
  note(s, "Sources: README.md product direction and current POC readiness; docs/ENDPOINT_EXPERIENCE_MAP.md.");
}

// 4. Problem and boundary
{
  const s = newSlide("ORIENTATION", C.violet, "The product boundary", "TurnFlow keeps the home record coherent without becoming a property-management platform");
  addText(s, "Today", 95, 214, 220, 34, { fontSize: 25, bold: true, color: C.coral, typeface: FONT });
  bullets(s, ["Photos live in text threads", "Quotes and receipts separate from the repair", "The next owner decision is easy to miss", "Recurring care starts over from memory"], 95, 270, 450, { color: C.coral, gap: 64, fontSize: 21 });
  rect(s, 564, 244, 154, 240, { fill: C.mint, line: C.mint, radius: 77 });
  addText(s, "ONE\nHOME\nRECORD", 577, 276, 128, 164, { fontSize: 27, bold: true, color: C.bg, align: "center", valign: "middle", typeface: FONT });
  addText(s, "TurnFlow", 825, 214, 280, 34, { fontSize: 25, bold: true, color: C.mint, typeface: FONT });
  bullets(s, ["One request ties decisions to evidence", "Only invited helpers see shared work", "Closeout preserves proof and final cost", "Reminders extend the record into prevention"], 825, 270, 390, { color: C.mint, gap: 64, fontSize: 21 });
  addText(s, "Not in scope: dispatch operations, payroll, open vendor marketplace, or payment processing", 155, 610, 970, 36, { fontSize: 19, color: C.amber, align: "center", bold: true });
  note(s, "Sources: README.md Product Direction, Core Features, and Remaining Product Gaps.");
}

// 5. Roles
{
  const s = newSlide("EXPERIENCE", C.mint, "Roles and data reach", "The owner controls the record. Vendor and collaborator access stays request-scoped");
  const roles = [
    ["OWNER", "Properties, all owned requests, vault, reminders, sharing, backups, notifications", C.violet, 70],
    ["VENDOR", "Assigned request, bid, tasks, proof, work sessions, closeout, read-only billing context", C.amber, 455],
    ["COLLABORATOR", "Shared request context and updates. No unrelated owner records", C.sky, 840],
  ];
  roles.forEach(([h, b, c, x]) => {
    rect(s, x, 225, 340, 330, { fill: C.panel, line: c, width: 2, radius: 24 });
    rect(s, x + 112, 258, 116, 116, { geometry: "ellipse", fill: `${c}30`, line: c, width: 2, radius: 58 });
    addText(s, h[0], x + 112, 258, 116, 116, { fontSize: 42, bold: true, color: c, align: "center", valign: "middle", typeface: FONT });
    addText(s, h, x + 30, 402, 280, 32, { fontSize: 23, bold: true, color: c, align: "center", typeface: FONT });
    addText(s, b, x + 30, 454, 280, 76, { fontSize: 18, color: C.muted, align: "center", valign: "middle" });
  });
  note(s, "Sources: lib/auth/dal.ts, app/vendor/page.tsx, app/collaborator/page.tsx, docs/ENDPOINT_EXPERIENCE_MAP.md.");
}

// 6. Owner journey
{
  const s = newSlide("EXPERIENCE", C.mint, "Owner journey", "Setup turns an empty account into a repair record that can survive the next handoff");
  await addImage(s, "screenshots/ux-owner/setup-desktop.png", 70, 215, 480, 385, { alt: "TurnFlow owner setup screen", color: C.mint });
  const steps = [
    ["1", "Add the home", C.violet], ["2", "Capture the issue", C.mint], ["3", "Attach proof", C.sky],
    ["4", "Share one request", C.amber], ["5", "Close and preserve", C.coral],
  ];
  steps.forEach(([n, t, c], i) => {
    const y = 220 + i * 78;
    rect(s, 650, y, 470, 58, { fill: C.panel, line: c, radius: 14 });
    rect(s, 665, y + 9, 40, 40, { geometry: "ellipse", fill: c, line: c, radius: 20 });
    addText(s, n, 665, y + 9, 40, 40, { fontSize: 18, bold: true, color: C.bg, align: "center", valign: "middle" });
    addText(s, t, 725, y + 12, 360, 34, { fontSize: 22, bold: true, color: C.text, valign: "middle" });
  });
  note(s, "Sources: app/owner/onboarding/page.tsx, lib/owner-readiness.ts, screenshot screenshots/ux-owner/setup-desktop.png.");
}

// 7. Owner screens
{
  const s = newSlide("EXPERIENCE", C.mint, "The owner workspace", "Each screen answers one maintenance question");
  await addImage(s, "screenshots/ux-owner/properties-desktop.png", 60, 220, 340, 250, { alt: "Properties screen", color: C.violet });
  await addImage(s, "screenshots/ux-owner/new-request-desktop.png", 470, 220, 340, 250, { alt: "New request screen", color: C.mint });
  await addImage(s, "screenshots/04-request-detail.png", 880, 220, 340, 250, { alt: "Request detail screen", color: C.coral });
  addText(s, "PROPERTIES", 60, 500, 340, 28, { fontSize: 18, bold: true, color: C.violet, align: "center", typeface: FONT });
  addText(s, "What does each home need?", 60, 538, 340, 42, { fontSize: 19, color: C.muted, align: "center" });
  addText(s, "REQUEST INTAKE", 470, 500, 340, 28, { fontSize: 18, bold: true, color: C.mint, align: "center", typeface: FONT });
  addText(s, "What happened and what context matters?", 470, 538, 340, 50, { fontSize: 19, color: C.muted, align: "center" });
  addText(s, "REQUEST DETAIL", 880, 500, 340, 28, { fontSize: 18, bold: true, color: C.coral, align: "center", typeface: FONT });
  addText(s, "What must happen next?", 880, 538, 340, 42, { fontSize: 19, color: C.muted, align: "center" });
  note(s, "Sources: screenshots/ux-owner/properties-desktop.png, screenshots/ux-owner/new-request-desktop.png, screenshots/04-request-detail.png.");
}

// 8. Request lifecycle
{
  const s = newSlide("EXPERIENCE", C.mint, "The request lifecycle", "Statuses communicate progress while evidence and decisions preserve the real history");
  const stages = [
    ["Draft", C.violet], ["Needs Quote", C.amber], ["Waiting", C.sky], ["Scheduled", C.violet],
    ["In Progress", C.mint], ["Needs Review", C.coral], ["Complete", C.mint], ["Archived", C.dim],
  ];
  const nodes = stages.map(([t, c], i) => node(s, 44 + i * 150, 270, 125, 76, t, "", c));
  for (let i = 0; i < nodes.length - 1; i++) connect(s, nodes[i], nodes[i + 1], { fromSide: "right", toSide: "left", color: C.dim });
  const evidence = [
    ["Photos", C.sky], ["Quotes", C.amber], ["Tasks", C.violet], ["Work events", C.mint], ["Closeout", C.coral], ["Billing record", C.amber], ["Decision log", C.violet],
  ];
  evidence.forEach(([t, c], i) => label(s, t, 80 + i * 160, 440, 138, c));
  addText(s, "Status is a summary. The durable record is the evidence and decisions attached to the request.", 170, 530, 940, 56, { fontSize: 23, color: C.text, align: "center", bold: true });
  note(s, "Sources: lib/db/schema.ts request_status enum, lib/request-workflow.ts, lib/actions/requests.ts.");
}

// 9. Vendor journey
{
  const s = newSlide("EXPERIENCE", C.mint, "Vendor work lane", "The portal selects the next useful action from bid, proof, work, closeout, and owner review state");
  await addImage(s, "screenshots/09-vendor-portal.png", 70, 250, 470, 330, { alt: "Vendor portal", color: C.amber, fit: "contain" });
  const steps = [
    ["Assigned", "Owner invite or assignment", C.violet],
    ["Bid", "Private price and availability", C.amber],
    ["Work", "Before proof, then start/pause/resume/stop", C.mint],
    ["Closeout", "After proof, completed tasks, final amount, notes", C.coral],
    ["Owner review", "Approve or request a documented revision", C.sky],
  ];
  steps.forEach(([h, b, c], i) => card(s, 590, 206 + i * 84, 570, 70, h, b, c, { headingSize: 20, bodySize: 16 }));
  note(s, "Sources: components/VendorPortal.tsx, lib/vendor-lifecycle.ts, lib/closeout-submissions.ts, screenshot screenshots/ux-helper/vendor-desktop.png.");
}

// 10. Collaborator and owner privacy
{
  const s = newSlide("EXPERIENCE", C.mint, "Scoped collaboration", "A collaborator can help with one shared request while the owner keeps account-wide control");
  await addImage(s, "screenshots/ux-helper/collaborator-desktop.png", 70, 220, 470, 380, { alt: "Collaborator portal", color: C.sky, fit: "cover", crop: { left: 0, top: 0, right: 0, bottom: 0.6 } });
  const request = node(s, 690, 255, 220, 120, "Shared request", "Context, readiness, updates", C.sky);
  const visible = node(s, 1020, 210, 170, 110, "Visible", "One request", C.mint);
  const hidden = node(s, 1020, 420, 170, 110, "Not visible", "Other homes, vault, billing controls", C.coral);
  connect(s, request, visible, { fromSide: "right", toSide: "left", color: C.mint });
  connect(s, request, hidden, { fromSide: "right", toSide: "left", color: C.coral, dash: "dashed", noHead: true });
  addText(s, "Owner can remove accepted access and the decision log records the change", 655, 575, 560, 52, { fontSize: 20, color: C.amber, align: "center", bold: true });
  note(s, "Sources: app/collaborator/page.tsx, lib/actions/invites.ts, screenshot screenshots/ux-helper/collaborator-desktop.png.");
}

// 11. Architecture
{
  const s = newSlide("ARCHITECTURE", C.sky, "System architecture", "The browser talks to one Next.js application that owns the server boundary");
  const browser = node(s, 60, 300, 190, 110, "Browser", "Server-rendered pages and interactive components", C.sky);
  const next = node(s, 360, 250, 260, 210, "Next.js 16", "App Router\nServer Components\nServer Actions\nRoute Handlers", C.violet);
  const auth = node(s, 745, 120, 200, 100, "Auth.js", "Credentials and JWT session", C.coral);
  const db = node(s, 745, 290, 200, 100, "Neon Postgres", "Drizzle schema and queries", C.mint);
  const blob = node(s, 745, 460, 200, 100, "Vercel Blob", "Private proof and vault files", C.sky);
  const email = node(s, 1040, 290, 170, 100, "Resend", "Optional delivery plus log", C.amber);
  connect(s, browser, next, { fromSide: "right", toSide: "left" });
  connect(s, next, auth, { fromSide: "right", toSide: "left", color: C.coral });
  connect(s, next, db, { fromSide: "right", toSide: "left", color: C.mint });
  connect(s, next, blob, { fromSide: "right", toSide: "left", color: C.sky });
  connect(s, next, email, { fromSide: "right", toSide: "left", color: C.amber });
  addText(s, "Vercel hosts the app and invokes the daily reminder cron", 402, 590, 470, 34, { fontSize: 20, color: C.muted, align: "center" });
  note(s, "Sources: package.json, lib/db/index.ts, lib/auth/config.ts, app/api/blob-upload/route.ts, lib/email.ts, vercel.json.");
}

// 12. Request sequence
{
  const s = newSlide("ARCHITECTURE", C.sky, "One mutation from click to durable history", "Every important write repeats identity, record authorization, validation, and audit work");
  const actors = [
    ["Component", C.sky], ["Server Action", C.violet], ["DAL and policy", C.coral], ["Drizzle", C.mint], ["Postgres", C.mint], ["Side effects", C.amber],
  ];
  const xs = [50, 250, 470, 690, 895, 1080];
  const tops = actors.map(([t, c], i) => node(s, xs[i], 220, 150, 68, t, "", c));
  const events = [
    [0, 1, "submit"], [1, 2, "session + role"], [2, 3, "authorized input"], [3, 4, "database write"], [4, 5, "log, email, revalidate"],
  ];
  events.forEach(([a, b, text], i) => {
    connect(s, tops[a], tops[b], { fromSide: "right", toSide: "left", color: actors[b][1] });
    addText(s, text, (xs[a] + xs[b]) / 2 - 30, 315 + (i % 2) * 50, 150, 28, { fontSize: 15, color: C.muted, align: "center" });
  });
  addText(s, "The page-level role check improves UX. The action-level ownership check protects the data.", 170, 480, 940, 58, { fontSize: 26, bold: true, color: C.text, align: "center" });
  label(s, "NEXT.JS SECURITY RULE", 484, 570, 310, C.coral);
  note(s, "Sources: installed Next.js 16 authentication/data-security guides, lib/auth/dal.ts, representative actions under lib/actions/.");
}

// 13. Repository map
{
  const s = newSlide("CODE", C.amber, "Repository map", "The code is organized by delivery boundary, then by workflow helpers");
  const root = node(s, 515, 220, 250, 86, "turnflow-home-main", "Next.js application", C.amber);
  const folders = [
    [90, 400, "app/", "Routes, pages, APIs", C.violet], [320, 400, "components/", "Interactive workflow UI", C.sky],
    [550, 400, "lib/actions/", "Authorized mutations", C.coral], [780, 400, "lib/", "Policy and guidance", C.mint],
    [1010, 400, "drizzle/", "Schema migrations", C.amber],
  ];
  folders.forEach(([x, y, h, b, c]) => {
    const n = node(s, x, y, 180, 112, h, b, c);
    connect(s, root, n, { fromSide: "bottom", toSide: "top", color: c });
  });
  addText(s, "Tests mirror the pure policy helpers. Scripts exercise real browser and deployment flows.", 210, 575, 860, 45, { fontSize: 22, color: C.muted, align: "center" });
  note(s, "Sources: repository file inventory, app/, components/, lib/, drizzle/, __tests__/, scripts/.");
}

// 14. Frontend-to-backend map
{
  const s = newSlide("CODE", C.amber, "Frontend to backend mapping", "Routes compose workflow components. Components call narrowly scoped actions");
  const rows = [
    ["/owner/requests/new", "NewRequestForm", "createRequestAction + blob upload", C.mint],
    ["/owner/requests/[id]", "RequestDetailView", "requests, quotes, tasks, invites, closeout, billing", C.coral],
    ["/vendor", "VendorPortal", "bids, work sessions, task status, closeout", C.amber],
    ["/collaborator", "Helper portal components", "comments on shared requests", C.sky],
    ["/owner/account", "sharing and profile controls", "invite lifecycle + access removal", C.violet],
  ];
  rows.forEach(([route, comp, action, c], i) => {
    const y = 210 + i * 84;
    const a = node(s, 60, y, 285, 58, route, "", c);
    const b = node(s, 470, y, 300, 58, comp, "", C.text);
    const d = node(s, 900, y, 310, 58, action, "", c);
    connect(s, a, b, { fromSide: "right", toSide: "left", color: C.dim });
    connect(s, b, d, { fromSide: "right", toSide: "left", color: c });
  });
  note(s, "Sources: app route pages and imported components/actions found by repository inspection.");
}

// 15. Business rules
{
  const s = newSlide("CODE", C.amber, "Business rules live in two layers", "Pure helpers explain the state. Server entry points enforce it");
  const explain = node(s, 120, 265, 350, 170, "Guidance helpers", "requestGuidance\nrequestWorkflowSteps\nvendorNextAction\ncloseoutReadiness", C.mint);
  const enforce = node(s, 810, 265, 350, 170, "Server enforcement", "requireRole\nownership check\nvalidation\ndatabase write", C.coral);
  const shared = node(s, 535, 305, 210, 90, "Shared policy", "statuses, proof rules, normalized inputs", C.amber);
  connect(s, shared, explain, { fromSide: "left", toSide: "right", color: C.mint });
  connect(s, shared, enforce, { fromSide: "right", toSide: "left", color: C.coral });
  addText(s, "UI copy helps the user act. The action remains safe when the UI is bypassed.", 185, 510, 910, 58, { fontSize: 25, bold: true, align: "center" });
  addText(s, "318 unit tests cover deterministic rules for status, files, auth limits, cron, and guidance", 225, 592, 830, 32, { fontSize: 19, color: C.muted, align: "center" });
  note(s, "Sources: lib/* guidance helpers, lib/actions/*, __tests__/*.test.ts. Test count verified with npm test on 2026-09-30.");
}

// 16. Data model
{
  const s = newSlide("DATA", C.violet, "The request-centered data model", "Nineteen primary tables support ownership, repair coordination, history, and future workspace billing");
  const request = node(s, 510, 290, 260, 120, "requests", "property, owner, workspace, status, costs, access", C.mint);
  const groups = [
    [70, 205, "Ownership", "users\nworkspaces\nmemberships\nbilling_accounts", C.violet],
    [70, 445, "Property memory", "properties\nvault_documents\nreminders\ncontacts", C.sky],
    [940, 175, "Repair work", "photos\nquotes\ntasks\nwork_sessions", C.amber],
    [940, 430, "History and closeout", "comments\ndecision_log\ncloseout_submissions\nbilling_records\nnotification_log", C.coral],
  ];
  groups.forEach(([x, y, h, b, c]) => {
    const n = node(s, x, y, 270, 150, h, b, c);
    connect(s, request, n, { fromSide: x < 500 ? "left" : "right", toSide: x < 500 ? "right" : "left", color: c });
  });
  label(s, "VENDOR PROFILE", 514, 485, 250, C.amber);
  addText(s, "Foreign keys preserve structure. Owner/request IDs remain the active authorization anchors.", 260, 590, 760, 40, { fontSize: 20, color: C.muted, align: "center" });
  note(s, "Source: lib/db/schema.ts. Primary tables counted from exported pgTable declarations.");
}

// 17. Security
{
  const s = newSlide("TRUST", C.coral, "Authentication and authorization", "Defense in depth keeps navigation friendly and mutations authoritative");
  const layers = [
    ["1", "Credentials", "Zod parses input. Rate limits and bcrypt protect login.", C.violet],
    ["2", "Session", "Auth.js stores user ID and role in a JWT session.", C.sky],
    ["3", "Routing", "proxy.ts redirects signed-out and cross-role page visits.", C.amber],
    ["4", "Server policy", "DAL and actions re-check role plus resource ownership.", C.coral],
    ["5", "Data boundary", "Foreign keys and scoped queries limit related records.", C.mint],
  ];
  layers.forEach(([n, h, b, c], i) => {
    const x = 80 + i * 235;
    rect(s, x, 230, 200, 330, { fill: C.panel, line: c, width: 2, radius: 18 });
    rect(s, x + 70, 260, 60, 60, { geometry: "ellipse", fill: c, line: c, radius: 30 });
    addText(s, n, x + 70, 260, 60, 60, { fontSize: 24, bold: true, color: C.bg, align: "center", valign: "middle" });
    addText(s, h, x + 18, 355, 164, 34, { fontSize: 21, bold: true, color: c, align: "center", typeface: FONT });
    addText(s, b, x + 18, 410, 164, 110, { fontSize: 17, color: C.muted, align: "center", valign: "middle" });
  });
  note(s, "Sources: lib/auth/config.ts, lib/auth/dal.ts, proxy.ts, representative Server Actions, lib/db/schema.ts.");
}

// 18. Permissions matrix
{
  const s = newSlide("TRUST", C.coral, "Permission matrix", "Capabilities follow the durable owner record and request assignment");
  const cols = ["Capability", "Owner", "Assigned vendor", "Collaborator"];
  const rows = [
    ["View owned property records", "Yes", "No", "No"],
    ["View one shared request", "Yes", "Yes", "Yes"],
    ["Change request status", "Yes", "Working states", "No"],
    ["Add request evidence", "Yes", "Yes", "No"],
    ["Manage quotes and final cost", "Yes", "Vendor bid only", "No"],
    ["Submit closeout", "Review", "Yes", "No"],
    ["Manage vault, backup, reminders", "Yes", "No", "No"],
    ["Remove shared access", "Yes", "No", "No"],
  ];
  const x0 = 70, y0 = 215;
  const widths = [430, 210, 260, 230];
  let x = x0;
  cols.forEach((c, i) => {
    rect(s, x, y0, widths[i], 48, { fill: i === 0 ? C.panel2 : C.violet, line: C.line, radius: 0 });
    addText(s, c, x + 10, y0, widths[i] - 20, 48, { fontSize: 18, bold: true, color: i === 0 ? C.text : C.bg, align: "center", valign: "middle" });
    x += widths[i];
  });
  rows.forEach((r, ri) => {
    x = x0;
    r.forEach((value, ci) => {
      const color = value === "Yes" ? C.mint : value === "No" ? C.dim : C.amber;
      rect(s, x, y0 + 48 + ri * 48, widths[ci], 48, { fill: ri % 2 ? C.panel2 : C.panel, line: C.line, radius: 0 });
      addText(s, value, x + 10, y0 + 48 + ri * 48, widths[ci] - 20, 48, { fontSize: 17, color: ci === 0 ? C.text : color, bold: ci > 0, align: ci === 0 ? "left" : "center", valign: "middle" });
      x += widths[ci];
    });
  });
  note(s, "Sources: action authorization checks, app/vendor/page.tsx, app/collaborator/page.tsx. Matrix summarizes current code, not a generalized future organization policy.");
}

// 19. Upload flow
{
  const s = newSlide("TRUST", C.coral, "Evidence upload boundary", "The server authorizes both the user and the destination path before storing a file");
  const steps = [
    ["Browser", "Compresses large images and posts multipart data", C.sky],
    ["Upload route", "Checks token, type, size, session, and path syntax", C.violet],
    ["Record check", "Owner or assigned vendor for request; owner for property", C.coral],
    ["Private Blob", "Stores an authorized path with a random suffix", C.mint],
    ["File route", "Re-checks record access before streaming bytes", C.amber],
  ];
  const ns = steps.map(([h, b, c], i) => node(s, 40 + i * 245, 275, 200, 150, h, b, c));
  for (let i = 0; i < ns.length - 1; i++) connect(s, ns[i], ns[i + 1], { fromSide: "right", toSide: "left", color: steps[i + 1][2] });
  addText(s, "Allowed types: JPEG, PNG, WebP, HEIC, PDF. Server limit: about 4 MB.", 270, 495, 740, 36, { fontSize: 20, color: C.text, align: "center" });
  addText(s, "New uploads return /api/files URLs. Revoking request access also revokes the ability to read private evidence.", 195, 555, 890, 52, { fontSize: 19, color: C.amber, align: "center" });
  note(s, "Sources: app/api/blob-upload/route.ts, app/api/files/route.ts, lib/blob-upload-client.ts, lib/blob-paths.ts, lib/file-access.ts.");
}

// 20. Operations
{
  const s = newSlide("DELIVERY", C.violet, "Runtime operations", "Health, reminders, notifications, and backups make the POC operable without hiding failures");
  const items = [
    ["PUBLIC HEALTH", "/api/health returns monitor-safe status with no caching", C.mint],
    ["DEEP HEALTH", "Bearer-protected database and configuration checks", C.sky],
    ["DAILY CRON", "13:00 UTC reminder digest protected by CRON_SECRET", C.amber],
    ["EMAIL", "Resend when configured. Every attempt enters notification_log", C.coral],
    ["PORTABILITY", "JSON backup/restore, CSV history, PDF proof packets, ICS reminders", C.violet],
  ];
  items.forEach(([h, b, c], i) => {
    const y = 190 + i * 84;
    rect(s, 85, y, 1110, 66, { fill: C.panel, line: C.line, radius: 16 });
    addText(s, h, 103, y + 18, 210, 30, { fontSize: 18, bold: true, color: c, typeface: FONT, valign: "middle" });
    addText(s, b, 330, y + 16, 835, 34, { fontSize: 17, color: C.muted, valign: "middle" });
  });
  note(s, "Sources: app/api/health, app/api/cron/reminder-digest, lib/email.ts, vercel.json, backup and PDF utilities.");
}

// 21. Testing
{
  const s = newSlide("DELIVERY", C.violet, "Quality map", "Fast policy tests protect business rules. Browser scripts prove the role handoffs");
  const unit = node(s, 110, 235, 300, 250, "318 unit tests", "34 files\nGuidance and state rules\nAuth, file, cron policy\nForms, headers, and health", C.mint);
  const smoke = node(s, 490, 235, 300, 250, "Browser smoke scripts", "Public routes\nOwner routes and first flow\nInvite acceptance\nHelper portals\nFull bid-to-closeout loop", C.sky);
  const verify = node(s, 870, 235, 300, 250, "npm run verify", "Lint\nTypeScript\nUnit tests\nProduction audit\nSchema drift\nProduction build", C.violet);
  connect(s, unit, smoke, { fromSide: "right", toSide: "left", color: C.sky });
  connect(s, smoke, verify, { fromSide: "right", toSide: "left", color: C.violet });
  addText(s, "Verified here: all 318 tests, lint, TypeScript, and the production build passed", 205, 555, 870, 46, { fontSize: 21, bold: true, color: C.mint, align: "center" });
  note(s, "Sources: package.json scripts, __tests__/, scripts/ux-*.ts. Local verification run on 2026-09-30.");
}

// 22. Deployment
{
  const s = newSlide("DELIVERY", C.violet, "Deployment topology", "The application is designed around managed Vercel services and explicit environment checks");
  const git = node(s, 55, 280, 180, 100, "GitHub", "main branch and CI", C.violet);
  const vercel = node(s, 335, 235, 250, 190, "Vercel", "Next.js runtime\nserverless routes\ncron\nsecurity headers", C.sky);
  const neon = node(s, 700, 160, 220, 100, "Neon", "Postgres", C.mint);
  const blob = node(s, 700, 320, 220, 100, "Vercel Blob", "Private objects via /api/files", C.sky);
  const resend = node(s, 700, 480, 220, 100, "Resend", "Optional email", C.amber);
  const monitor = node(s, 1020, 235, 200, 190, "External monitor", "Public health\nProtected deep health\nFuture alerting", C.coral);
  connect(s, git, vercel, { fromSide: "right", toSide: "left" });
  connect(s, vercel, neon, { fromSide: "right", toSide: "left", color: C.mint });
  connect(s, vercel, blob, { fromSide: "right", toSide: "left", color: C.sky });
  connect(s, vercel, resend, { fromSide: "right", toSide: "left", color: C.amber });
  connect(s, monitor, vercel, { fromSide: "left", toSide: "right", color: C.coral });
  addText(s, "poc:ready checks database, auth, URLs, Blob, cron, health, and email posture before user testing", 210, 610, 860, 38, { fontSize: 19, color: C.muted, align: "center" });
  note(s, "Sources: docs/DEPLOYMENT.md, .env.local.example, package.json, vercel.json, next.config.ts.");
}

// 23. Maturity
{
  const s = newSlide("READINESS", C.coral, "Implemented, partial, and missing", "The POC covers the coordination loop but does not claim a full commercial platform");
  const cols = [
    [70, "IMPLEMENTED", C.mint, ["Owner, vendor, collaborator lanes", "Request, proof, quotes, tasks, closeout", "Workspace and billing record foundation", "Tests, health, deployment runbook"]],
    [465, "PARTIAL OR ENVIRONMENT-DEPENDENT", C.amber, ["Email delivery and cron verification", "Workspace policy beyond the owner foundation", "Production monitoring outside health endpoints", "Hosted POC environment confirmation"]],
    [860, "PLANNED OR MISSING", C.coral, ["Invite-time vendor/helper signup", "Transactional multi-row writes", "Durable audit retention + quote uniqueness", "Moderated homeowner testing"]],
  ];
  cols.forEach(([x, h, c, items]) => {
    rect(s, x, 210, 350, 405, { fill: C.panel, line: c, width: 2, radius: 20 });
    addText(s, h, x + 22, 235, 306, 52, { fontSize: 19, bold: true, color: c, align: "center", typeface: FONT });
    bullets(s, items, x + 28, 315, 294, { color: c, gap: 68, fontSize: 18, textColor: C.muted });
  });
  note(s, "Sources: README.md Current POC Readiness and Remaining Product Gaps, docs/DEPLOYMENT.md, docs/USER_TESTING.md.");
}

// 24. Risks
{
  const s = newSlide("READINESS", C.coral, "Risk and readiness priorities", "Most risk sits at the boundary between a strong demo and a real external-user launch");
  const risks = [
    ["1", "Human validation", "Moderated homeowner and vendor sessions remain the documented launch gate.", C.coral],
    ["2", "Access onboarding", "Invited vendors and helpers cannot yet create the required account from the invite.", C.amber],
    ["3", "Data integrity", "Multi-row mutations need transactions; quote approval uniqueness needs enforcement.", C.sky],
    ["4", "Audit durability", "Decision history currently follows request deletion instead of surviving it.", C.violet],
    ["5", "Operations", "Private-Blob migration, demo reset, email, cron, and alerting need environment proof.", C.coral],
  ];
  risks.forEach(([n, h, b, c], i) => {
    const y = 205 + i * 88;
    rect(s, 80, y, 1120, 72, { fill: C.panel, line: C.line, radius: 14 });
    rect(s, 98, y + 12, 48, 48, { geometry: "ellipse", fill: c, line: c, radius: 24 });
    addText(s, n, 98, y + 12, 48, 48, { fontSize: 19, bold: true, color: C.bg, align: "center", valign: "middle" });
    addText(s, h, 170, y + 12, 250, 48, { fontSize: 21, bold: true, color: c, valign: "middle", typeface: FONT });
    addText(s, b, 435, y + 12, 730, 48, { fontSize: 18, color: C.muted, valign: "middle" });
  });
  note(s, "Sources: README.md gaps, docs/DEPLOYMENT.md, docs/UI_UX_REVIEW.md, __tests__/security-headers.test.ts.");
}

// 25. Change guide
{
  const s = newSlide("LEARNING", C.amber, "Where to make common changes", "Start at the business rule, then move outward to data, server entry points, UI, and verification");
  const steps = [
    ["Policy", "lib/*.ts", C.amber], ["Schema", "lib/db/schema.ts + migration", C.mint], ["Mutation", "lib/actions/*.ts", C.coral],
    ["Experience", "app/ + components/", C.sky], ["Verification", "__tests__/ + smoke script", C.violet],
  ];
  const ns = steps.map(([h, b, c], i) => node(s, 55 + i * 245, 270, 205, 130, h, b, c));
  for (let i = 0; i < ns.length - 1; i++) connect(s, ns[i], ns[i + 1], { fromSide: "right", toSide: "left", color: steps[i + 1][2] });
  addText(s, "Example: a new request field touches schema, migration, intake action, forms, backup/export, guidance, and tests.", 180, 505, 920, 60, { fontSize: 23, color: C.text, align: "center", bold: true });
  note(s, "Sources: repository organization and recurring change pattern visible in schema, actions, components, tests, and build log.");
}

// 26. Explain it
{
  const s = newSlide("LEARNING", C.amber, "A two-minute explanation", "Use four beats and name the product boundary before the stack");
  const beats = [
    ["1", "Problem", "Repair evidence and decisions fragment across messages, files, and memory.", C.coral],
    ["2", "Product", "The owner keeps one property record and shares only the request that needs help.", C.mint],
    ["3", "System", "Next.js owns the server boundary. Postgres stores history. Blob stores files.", C.sky],
    ["4", "Maturity", "The full POC loop works. Payments, broader org policy, and user validation remain.", C.amber],
  ];
  beats.forEach(([n, h, b, c], i) => {
    const x = 75 + i * 300;
    rect(s, x, 235, 250, 315, { fill: C.panel, line: c, width: 2, radius: 22 });
    rect(s, x + 92, 265, 66, 66, { geometry: "ellipse", fill: c, line: c, radius: 33 });
    addText(s, n, x + 92, 265, 66, 66, { fontSize: 25, bold: true, color: C.bg, align: "center", valign: "middle" });
    addText(s, h, x + 20, 365, 210, 34, { fontSize: 23, bold: true, color: c, align: "center", typeface: FONT });
    addText(s, b, x + 22, 420, 206, 102, { fontSize: 18, color: C.muted, align: "center", valign: "middle" });
  });
  note(s, "Source: explain-the-code-practice-guide.md, based on repository evidence.");
}

// 27. Code reading
{
  const s = newSlide("LEARNING", C.amber, "A guided code-reading path", "Trace one repair from page to policy, mutation, data, and proof");
  const files = [
    ["app/owner/requests/[id]/page.tsx", "Loads the owner-scoped aggregate", C.violet],
    ["components/RequestDetailView.tsx", "Composes the workflow controls", C.sky],
    ["lib/request-workflow.ts", "Explains current state and next action", C.mint],
    ["lib/actions/requests.ts", "Enforces ownership and status changes", C.coral],
    ["lib/db/schema.ts", "Shows the stored relationships", C.amber],
  ];
  files.forEach(([f, b, c], i) => {
    const y = 205 + i * 86;
    const a = rect(s, 80, y, 500, 64, { fill: C.panel, line: c, width: 1.5, radius: 12 });
    addText(s, f, 100, y + 12, 460, 40, { fontSize: 17, bold: true, color: c, valign: "middle", typeface: CODE });
    const d = rect(s, 700, y, 500, 64, { fill: C.panel2, line: C.line, radius: 12 });
    addText(s, b, 720, y + 12, 460, 40, { fontSize: 18, color: C.text, valign: "middle" });
    connect(s, a, d, { fromSide: "right", toSide: "left", color: c });
  });
  note(s, "Source: code-glossary.md and repository imports.");
}

// 28. Next steps
{
  const s = newSlide("READINESS", C.coral, "Recommended next steps", "Strengthen the proof of usefulness before expanding the commercial surface");
  const steps = [
    ["NOW", "Run moderated owner and vendor sessions against the hosted seeded flow", C.coral],
    ["NEXT", "Close invite signup and verify private-Blob migration, demo reset, email, cron, and health", C.amber],
    ["THEN", "Add transactions, durable audit retention, quote uniqueness, and boundary tests", C.sky],
    ["AFTER EVIDENCE", "Choose payments, team policy, or vendor discovery from observed demand", C.mint],
  ];
  const nodes = steps.map(([h, b, c], i) => node(s, 95 + i * 295, 265, 250, 190, h, b, c));
  for (let i = 0; i < nodes.length - 1; i++) connect(s, nodes[i], nodes[i + 1], { fromSide: "right", toSide: "left", color: steps[i + 1][2] });
  addText(s, "The current code proves coordination and recordkeeping. The next release decision should come from real workflow evidence.", 170, 535, 940, 60, { fontSize: 23, color: C.text, align: "center", bold: true });
  note(s, "Sources: README.md, docs/DEPLOYMENT.md, docs/USER_TESTING.md, docs/VENDOR_LIFECYCLE_ROADMAP.md.");
}

// 29. Close
{
  slideNo += 1;
  const s = presentation.slides.add();
  s.background.fill = C.bg;
  addText(s, "The system is one request-centered record", 72, 80, 1040, 70, { fontSize: 45, bold: true, typeface: FONT });
  addText(s, "Trace these four links and you can explain or extend TurnFlow Home with confidence.", 72, 162, 900, 50, { fontSize: 22, color: C.muted });
  const chain = [
    ["Role", "Who may act?", C.violet], ["Request", "Which repair?", C.mint], ["Evidence", "What proves it?", C.amber], ["Decision", "What changed?", C.coral],
  ];
  const ns = chain.map(([h, b, c], i) => node(s, 70 + i * 300, 320, 240, 140, h, b, c));
  for (let i = 0; i < ns.length - 1; i++) connect(s, ns[i], ns[i + 1], { fromSide: "right", toSide: "left", color: chain[i + 1][2] });
  addText(s, "Start page: PROJECT_SYSTEM_GUIDE.md", 72, 590, 600, 30, { fontSize: 18, color: C.sky, typeface: CODE });
  footer(s, slideNo);
  note(s, "Close with the mental model. The central guide links the deck and all companion documents.");
}

await fs.mkdir(TMP_DIR, { recursive: true });
await fs.mkdir(path.dirname(FINAL_PPTX), { recursive: true });

const stagingDir = path.join(workspaceDir, ".codex-finalizer");
await fs.mkdir(stagingDir, { recursive: true });
const candidatePath = path.join(stagingDir, "turnflow-home-system-visual-guide-candidate.pptx");
await (await PresentationFile.exportPptx(presentation)).save(candidatePath);

const result = await finalizePresentation({
  explicitTotalSlideCount: slideNo,
  requiredNativeTableOwnerSlides: [],
  requiredNativeChartOwnerSlides: [],
  workspaceDir,
  candidatePath,
  finalPath: FINAL_PPTX,
  pythonExecutable: RUNTIME_PYTHON,
  integrityValidatorPath: path.join(SKILL_DIR, "container_tools/inspect_presentation_package_integrity.py"),
  layoutValidatorPath: path.join(SKILL_DIR, "container_tools/inspect_presentation_layout_geometry.py"),
  layoutArgs: [
    "--expected-slide-size-emu", "12192000,6858000",
    "--validate-bullet-geometry",
    "--validate-heading-fit",
  ],
  fontPolicy: {
    basis: "reference",
    families: [FONT, BODY, CODE],
    referencePath: "C:/Users/hypno/OneDrive/Desktop/h777-system-visual-guide.pptx",
    referenceSha256: "a7e7292b2ab3ded6b780d1eee6b46536d2b7f811f5f208e454ecdd9b0e723765",
  },
  verifyArtifactToolImport: true,
  receiptPath: path.join(stagingDir, `${path.basename(FINAL_PPTX)}.validation.json`),
});

console.log(JSON.stringify({ slides: slideNo, candidatePath, finalPath: FINAL_PPTX, result }, null, 2));
