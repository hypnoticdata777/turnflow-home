import { describe, expect, it } from "vitest";
import {
  vendorLifecycleStages,
  vendorLifecycleSummary,
  vendorNextAction,
  vendorWorkQueueMetrics,
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

describe("vendorNextAction", () => {
  it("starts needs-quote jobs at bid submission", () => {
    expect(
      vendorNextAction({
        id: "request-1",
        status: "Needs Quote",
        vendorBid: null,
        location: "Kitchen",
        accessInstructions: "Side gate",
        contactMethod: "Text",
        photos: [],
      })
    ).toMatchObject({
      label: "Bid requested",
      cta: "Submit bid",
      href: "#vendor-bid-request-1",
      tone: "attention",
    });
  });

  it("waits when the vendor bid is pending owner approval", () => {
    expect(
      vendorNextAction({
        id: "request-1",
        status: "Waiting",
        vendorBid: { status: "pending", amount: "450" },
        location: "Kitchen",
        accessInstructions: "Side gate",
        contactMethod: "Text",
        photos: [],
      })
    ).toMatchObject({
      label: "Waiting on owner approval",
      cta: "Review bid",
      tone: "progress",
    });
  });

  it("points scheduled jobs to start work with proof", () => {
    expect(
      vendorNextAction({
        id: "request-1",
        status: "Scheduled",
        vendorBid: { status: "approved", amount: "450" },
        location: "Kitchen",
        accessInstructions: "Side gate",
        contactMethod: "Text",
        photos: [],
        workSessions: [],
      })
    ).toMatchObject({
      label: "Start with proof",
      cta: "Start work",
      href: "#vendor-work-request-1",
      tone: "attention",
    });
  });

  it("moves active sessions toward stop proof", () => {
    expect(
      vendorNextAction({
        id: "request-1",
        status: "In Progress",
        location: "Kitchen",
        accessInstructions: "Side gate",
        contactMethod: "Text",
        photos: [{ type: "before" }],
        workSessions: [{ event: "started", createdAt: "2026-08-12T10:00:00.000Z" }],
      })
    ).toMatchObject({
      label: "Stop with completion proof",
      cta: "Stop work",
      href: "#vendor-work-request-1",
      tone: "progress",
    });
  });

  it("asks for closeout revision when owner requested changes", () => {
    expect(
      vendorNextAction({
        id: "request-1",
        status: "Needs Review",
        location: "Kitchen",
        accessInstructions: "Side gate",
        contactMethod: "Text",
        finalCost: "450",
        photos: [{ type: "after" }],
        closeoutSubmissions: [
          { status: "changes_requested", submittedAt: "2026-08-12T10:00:00.000Z" },
        ],
      })
    ).toMatchObject({
      label: "Closeout changes requested",
      cta: "Revise closeout",
      href: "#vendor-closeout-request-1",
      tone: "attention",
    });
  });

  it("marks paid approved closeouts as settled", () => {
    expect(
      vendorNextAction({
        id: "request-1",
        status: "Complete",
        location: "Kitchen",
        accessInstructions: "Side gate",
        contactMethod: "Text",
        finalCost: "450",
        photos: [{ type: "after" }],
        closeoutSubmissions: [
          { status: "approved", submittedAt: "2026-08-12T10:00:00.000Z" },
        ],
        billingRecords: [
          { status: "paid", recordedAt: "2026-08-12T11:00:00.000Z" },
        ],
      })
    ).toMatchObject({
      label: "Job record settled",
      cta: "Review record",
      href: "#vendor-billing-request-1",
      tone: "ready",
    });
  });
});

describe("vendorWorkQueueMetrics", () => {
  it("keeps an empty vendor queue calm and scoped", () => {
    expect(vendorWorkQueueMetrics([])).toEqual([
      {
        label: "Bid queue",
        value: 0,
        detail: "Assigned jobs that need a bid will appear here.",
        tone: "empty",
      },
      {
        label: "Work starts/stops",
        value: 0,
        detail: "Scheduled and active work will appear here.",
        tone: "empty",
      },
      {
        label: "Closeout handoffs",
        value: 0,
        detail: "Jobs ready for closeout will appear here.",
        tone: "empty",
      },
      {
        label: "Owner waits",
        value: 0,
        detail: "Owner review states will appear here once work is assigned.",
        tone: "empty",
      },
    ]);
  });

  it("summarizes bid, work, closeout, and owner-wait states across assigned jobs", () => {
    const metrics = vendorWorkQueueMetrics([
      {
        id: "request-1",
        status: "Needs Quote",
        vendorBid: null,
        location: "Kitchen",
        accessInstructions: "Side gate",
        contactMethod: "Text",
        photos: [],
      },
      {
        id: "request-2",
        status: "Scheduled",
        vendorBid: { status: "approved", amount: "450" },
        location: "Kitchen",
        accessInstructions: "Side gate",
        contactMethod: "Text",
        photos: [],
        workSessions: [],
      },
      {
        id: "request-3",
        status: "In Progress",
        location: "Hall bath",
        accessInstructions: "Lockbox",
        contactMethod: "Phone",
        finalCost: "600",
        photos: [{ type: "after" }],
        workSessions: [{ event: "stopped", createdAt: "2026-08-12T12:00:00.000Z" }],
      },
      {
        id: "request-4",
        status: "Waiting",
        vendorBid: { status: "pending", amount: "250" },
        location: "Laundry",
        accessInstructions: "Front desk",
        contactMethod: "Email",
        photos: [],
      },
    ]);

    expect(metrics).toMatchObject([
      {
        label: "Bid queue",
        value: 1,
        tone: "attention",
      },
      {
        label: "Work starts/stops",
        value: 1,
        tone: "attention",
      },
      {
        label: "Closeout handoffs",
        value: 1,
        tone: "attention",
      },
      {
        label: "Owner waits",
        value: 1,
        tone: "progress",
      },
    ]);
  });

  it("marks a fully settled assigned queue as ready", () => {
    const metrics = vendorWorkQueueMetrics([
      {
        id: "request-1",
        status: "Complete",
        location: "Kitchen",
        accessInstructions: "Side gate",
        contactMethod: "Text",
        finalCost: "450",
        photos: [{ type: "after" }],
        closeoutSubmissions: [
          { status: "approved", submittedAt: "2026-08-12T10:00:00.000Z" },
        ],
        billingRecords: [
          { status: "recorded", recordedAt: "2026-08-12T11:00:00.000Z" },
        ],
      },
    ]);

    expect(metrics.every((metric) => metric.tone === "ready")).toBe(true);
    expect(metrics.map((metric) => metric.value)).toEqual([0, 0, 0, 0]);
  });
});
