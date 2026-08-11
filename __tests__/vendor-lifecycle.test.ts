import { describe, expect, it } from "vitest";
import {
  vendorLifecycleStages,
  vendorLifecycleSummary,
} from "@/lib/vendor-lifecycle";

describe("vendorLifecycleStages", () => {
  it("starts a needs-quote request at the vendor bid stage", () => {
    const stages = vendorLifecycleStages({
      status: "Needs Quote",
      quotedCost: null,
      finalCost: null,
      photos: [],
      comments: [],
    });

    expect(stages.map((stage) => [stage.key, stage.status])).toEqual([
      ["opportunity", "done"],
      ["bid", "current"],
      ["approval", "upcoming"],
      ["scheduled", "upcoming"],
      ["work", "upcoming"],
      ["closeout", "upcoming"],
      ["billing", "upcoming"],
    ]);
  });

  it("blocks scheduled work when the vendor is missing job context", () => {
    const stages = vendorLifecycleStages({
      status: "Scheduled",
      quotedCost: "450",
      finalCost: null,
      location: "Hall bath",
      accessInstructions: "",
      contactMethod: "Text",
      photos: [],
      comments: [],
    });

    expect(stages.find((stage) => stage.key === "scheduled")).toMatchObject({
      status: "blocked",
      detail: "Confirm location, access, and preferred contact before work starts.",
    });
  });

  it("shows closeout and billing as current when active work needs proof", () => {
    const stages = vendorLifecycleStages({
      status: "In Progress",
      quotedCost: "450",
      finalCost: null,
      location: "Hall bath",
      accessInstructions: "Lockbox",
      contactMethod: "Text",
      photos: [{ type: "before" }],
      comments: [{}],
    });

    expect(stages.find((stage) => stage.key === "work")).toMatchObject({
      status: "current",
    });
    expect(stages.find((stage) => stage.key === "closeout")).toMatchObject({
      status: "current",
    });
    expect(stages.find((stage) => stage.key === "billing")).toMatchObject({
      status: "upcoming",
    });
  });

  it("marks the full lifecycle complete when proof and final cost are present", () => {
    const stages = vendorLifecycleStages({
      status: "Complete",
      quotedCost: "450",
      finalCost: "475",
      location: "Hall bath",
      accessInstructions: "Lockbox",
      contactMethod: "Text",
      photos: [{ type: "after" }, { type: "receipt" }],
      comments: [{}],
    });

    expect(stages.every((stage) => stage.status === "done")).toBe(true);
  });
});

describe("vendorLifecycleSummary", () => {
  it("prioritizes blocked lifecycle steps as the vendor next action", () => {
    expect(
      vendorLifecycleSummary({
        status: "Complete",
        quotedCost: "450",
        finalCost: null,
        location: "Hall bath",
        accessInstructions: "Lockbox",
        contactMethod: "Text",
        photos: [{ type: "before" }],
      })
    ).toMatchObject({
      label: "Lifecycle blocked",
      nextAction: "Add closeout proof",
      tone: "attention",
    });
  });

  it("returns a ready summary after all lifecycle steps are done", () => {
    expect(
      vendorLifecycleSummary({
        status: "Complete",
        quotedCost: "450",
        finalCost: "475",
        location: "Hall bath",
        accessInstructions: "Lockbox",
        contactMethod: "Text",
        photos: [{ type: "after" }],
      })
    ).toMatchObject({
      label: "Lifecycle ready",
      nextAction: "Review record",
      tone: "ready",
      completedCount: 7,
      totalCount: 7,
    });
  });
});
