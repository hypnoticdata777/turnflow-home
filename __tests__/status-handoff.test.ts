import { describe, expect, it } from "vitest";
import { statusHandoffGuidance } from "@/lib/status-handoff";

describe("statusHandoffGuidance", () => {
  it("explains owner Draft as a context-building state", () => {
    expect(
      statusHandoffGuidance("owner", {
        status: "Draft",
        photos: [],
        finalCost: null,
        assignedVendorId: null,
      })
    ).toMatchObject({
      eyebrow: "Owner status",
      title: "Draft is for capturing the issue before sharing it.",
      tone: "progress",
      reminders: [
        "Every status change is saved to the decision log.",
        "The owner record should explain why the status changed.",
        "Missing for clean completion: final cost, after photo, assigned vendor.",
      ],
    });
  });

  it("guides vendors to treat Scheduled as a context confirmation state", () => {
    expect(
      statusHandoffGuidance("vendor", {
        status: "Scheduled",
        photos: [{ type: "before" }],
        finalCost: null,
        assignedVendorId: "vendor-1",
      })
    ).toMatchObject({
      eyebrow: "Vendor status",
      title: "Scheduled means confirm the job details before arrival.",
      detail:
        "Check location, access instructions, urgency, and preferred contact before moving to In Progress.",
      tone: "progress",
      reminders: expect.arrayContaining([
        "The owner is notified when status changes.",
        "Missing for clean completion: final cost, after photo.",
      ]),
    });
  });

  it("marks Needs Review as ready when clean completion proof exists", () => {
    expect(
      statusHandoffGuidance("owner", {
        status: "Needs Review",
        photos: [{ type: "after" }],
        finalCost: "275",
        assignedVendorId: "vendor-1",
      })
    ).toMatchObject({
      title: "Needs Review is your closeout checkpoint.",
      tone: "ready",
      reminders: expect.arrayContaining(["Clean completion proof is present."]),
    });
  });

  it("flags Complete when the proof packet still has gaps", () => {
    expect(
      statusHandoffGuidance("vendor", {
        status: "Complete",
        photos: [{ type: "before" }],
        finalCost: null,
        assignedVendorId: "vendor-1",
      })
    ).toMatchObject({
      title: "Complete is a durable closeout state.",
      tone: "attention",
      reminders: expect.arrayContaining([
        "Missing for clean completion: final cost, after photo.",
      ]),
    });
  });
});
