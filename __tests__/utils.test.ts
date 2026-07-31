import { describe, it, expect } from "vitest";
import {
  REQUEST_STATUSES,
  requestStatusBadgeClasses,
  REQUEST_CATEGORIES,
  CATEGORY_CHECKLISTS,
  checklistForCategory,
  costForRequest,
  costLabelForRequest,
  meetsCompletionRequirements,
  csvEscape,
  toCsvRow,
  reminderStatus,
  reminderStatusBadgeClasses,
  buildRemindersICS,
} from "@/lib/utils";

describe("REQUEST_STATUSES", () => {
  it("lists the 8-state lifecycle in forward order", () => {
    expect(REQUEST_STATUSES).toEqual([
      "Draft",
      "Needs Quote",
      "Waiting",
      "Scheduled",
      "In Progress",
      "Needs Review",
      "Complete",
      "Archived",
    ]);
  });
});

describe("requestStatusBadgeClasses", () => {
  it("returns a distinct class set for each known status", () => {
    const classes = REQUEST_STATUSES.map(requestStatusBadgeClasses);
    expect(new Set(classes).size).toBe(REQUEST_STATUSES.length);
  });

  it("falls back to the Draft styling for unknown/missing status", () => {
    expect(requestStatusBadgeClasses("Draft")).toBe(requestStatusBadgeClasses(undefined));
    expect(requestStatusBadgeClasses("Draft")).toBe(requestStatusBadgeClasses("bogus"));
  });
});

describe("CATEGORY_CHECKLISTS / checklistForCategory", () => {
  it("has a non-empty checklist for every request category", () => {
    for (const category of REQUEST_CATEGORIES) {
      expect(Array.isArray(CATEGORY_CHECKLISTS[category])).toBe(true);
      expect(CATEGORY_CHECKLISTS[category].length).toBeGreaterThan(0);
    }
  });

  it("returns the matching checklist for a known category", () => {
    expect(checklistForCategory("Plumbing")).toBe(CATEGORY_CHECKLISTS.Plumbing);
  });

  it("returns an empty array for an unknown or missing category", () => {
    expect(checklistForCategory("Bogus")).toEqual([]);
    expect(checklistForCategory(undefined)).toEqual([]);
    expect(checklistForCategory(null)).toEqual([]);
  });
});

describe("costForRequest / costLabelForRequest (BRL3)", () => {
  it("reports no cost recorded when nothing is set", () => {
    expect(costForRequest({})).toBe(0);
    expect(costLabelForRequest({})).toBe("No cost recorded");
  });

  it("prefers estimatedCost when only it is set", () => {
    expect(costForRequest({ estimatedCost: "100" })).toBe(100);
    expect(costLabelForRequest({ estimatedCost: "100" })).toBe("Estimated");
  });

  it("prefers quotedCost over estimatedCost", () => {
    expect(costForRequest({ estimatedCost: "100", quotedCost: "150" })).toBe(150);
    expect(costLabelForRequest({ estimatedCost: "100", quotedCost: "150" })).toBe("Quoted");
  });

  it("prefers finalCost over quotedCost and estimatedCost", () => {
    const reqData = { estimatedCost: "100", quotedCost: "150", finalCost: "175" };
    expect(costForRequest(reqData)).toBe(175);
    expect(costLabelForRequest(reqData)).toBe("Final");
  });

  it("treats null/empty-string cost fields as not set", () => {
    expect(costForRequest({ estimatedCost: "100", finalCost: null })).toBe(100);
    expect(costForRequest({ estimatedCost: "100", finalCost: "" })).toBe(100);
  });

  it("handles Postgres numeric-as-string fields", () => {
    expect(costForRequest({ estimatedCost: "42.50" })).toBe(42.5);
  });

  it("falls back to 0 for a non-numeric cost value", () => {
    expect(costForRequest({ estimatedCost: "abc" })).toBe(0);
  });
});

describe("meetsCompletionRequirements (BRL2)", () => {
  const complete = { finalCost: "200", assignedVendorId: "vendor-1" };
  const afterPhoto = [{ type: "before" }, { type: "after" }];

  it("is true when finalCost, an after photo, and a vendor are all present", () => {
    expect(meetsCompletionRequirements(complete, afterPhoto)).toBe(true);
  });

  it("is false when finalCost is missing", () => {
    expect(meetsCompletionRequirements({ assignedVendorId: "vendor-1" }, afterPhoto)).toBe(false);
  });

  it("is false when there is no after photo", () => {
    expect(meetsCompletionRequirements(complete, [{ type: "before" }])).toBe(false);
    expect(meetsCompletionRequirements(complete, [])).toBe(false);
  });

  it("is false when no vendor is assigned", () => {
    expect(meetsCompletionRequirements({ finalCost: "200" }, afterPhoto)).toBe(false);
  });

  it("handles missing reqData/photos gracefully", () => {
    expect(meetsCompletionRequirements({})).toBe(false);
  });
});

describe("csvEscape / toCsvRow", () => {
  it("leaves plain values unquoted", () => {
    expect(csvEscape("Plumbing")).toBe("Plumbing");
    expect(csvEscape(42)).toBe("42");
  });

  it("quotes and escapes values containing a comma", () => {
    expect(csvEscape("Kitchen, 2nd floor")).toBe('"Kitchen, 2nd floor"');
  });

  it("doubles inner quotes", () => {
    expect(csvEscape('The "leaky" faucet')).toBe('"The ""leaky"" faucet"');
  });

  it("quotes values containing a newline", () => {
    expect(csvEscape("line1\nline2")).toBe('"line1\nline2"');
  });

  it("treats null/undefined as an empty field", () => {
    expect(csvEscape(null)).toBe("");
    expect(csvEscape(undefined)).toBe("");
  });

  it("joins a row of escaped values with commas", () => {
    expect(toCsvRow(["a", "b, c", 'd"e'])).toBe('a,"b, c","d""e"');
  });
});

describe("reminderStatus / reminderStatusBadgeClasses", () => {
  const now = Date.parse("2026-06-01T00:00:00Z");
  const days = (n: number) => n * 86_400_000;

  it("is overdue when nextDueAt is in the past", () => {
    expect(reminderStatus(now - days(1), now)).toBe("overdue");
  });

  it("is upcoming when nextDueAt is within 14 days", () => {
    expect(reminderStatus(now + days(14), now)).toBe("upcoming");
    expect(reminderStatus(now, now)).toBe("upcoming");
  });

  it("is ok when nextDueAt is more than 14 days out", () => {
    expect(reminderStatus(now + days(15), now)).toBe("ok");
  });

  it("is ok when there is no nextDueAt", () => {
    expect(reminderStatus(0, now)).toBe("ok");
  });

  it("gives each status a distinct badge class", () => {
    const classes = (["overdue", "upcoming", "ok"] as const).map(reminderStatusBadgeClasses);
    expect(new Set(classes).size).toBe(3);
  });
});

describe("buildRemindersICS", () => {
  it("produces a valid VCALENDAR wrapper", () => {
    const ics = buildRemindersICS([]);
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("END:VCALENDAR");
  });

  it("includes one VEVENT per reminder with a due date, in YYYYMMDD form", () => {
    const ics = buildRemindersICS([
      { id: "r1", title: "Replace HVAC filter", nextDueAt: new Date(Date.UTC(2026, 5, 15)) },
    ]);
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("DTSTART;VALUE=DATE:20260615");
    expect(ics).toContain("SUMMARY:Replace HVAC filter");
  });

  it("skips reminders with no nextDueAt", () => {
    // @ts-expect-error — exercising the runtime guard for a missing date
    const ics = buildRemindersICS([{ id: "r1", title: "No date" }]);
    expect(ics).not.toContain("BEGIN:VEVENT");
  });

  it("escapes commas, semicolons, and newlines in text fields", () => {
    const ics = buildRemindersICS([
      {
        id: "r1",
        title: "Gutter, downspout; check",
        nextDueAt: new Date(Date.UTC(2026, 0, 1)),
        notes: "line1\nline2",
      },
    ]);
    expect(ics).toContain("SUMMARY:Gutter\\, downspout\\; check");
    expect(ics).toContain("DESCRIPTION:line1\\nline2");
  });
});
