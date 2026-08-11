import { describe, expect, it } from "vitest";
import {
  describeWorkSessionEvent,
  isWorkSessionEvent,
  workSessionCounts,
  workSessionGuidance,
} from "@/lib/work-sessions";

describe("isWorkSessionEvent", () => {
  it("accepts known work session event keys", () => {
    expect(isWorkSessionEvent("started")).toBe(true);
    expect(isWorkSessionEvent("paused")).toBe(true);
    expect(isWorkSessionEvent("unknown")).toBe(false);
  });
});

describe("describeWorkSessionEvent", () => {
  it("keeps notes attached to the readable event", () => {
    expect(describeWorkSessionEvent("paused", "Waiting on shutoff access")).toBe(
      "Paused work: Waiting on shutoff access"
    );
  });

  it("uses a concise sentence when no notes are supplied", () => {
    expect(describeWorkSessionEvent("stopped")).toBe("Stopped work.");
  });
});

describe("workSessionGuidance", () => {
  it("starts with a start-work CTA", () => {
    expect(workSessionGuidance([], "Scheduled")).toMatchObject({
      label: "Work not started",
      primaryEvent: "started",
      primaryAction: "Start work",
      tone: "attention",
    });
  });

  it("asks paused work to resume", () => {
    expect(
      workSessionGuidance(
        [{ event: "paused", createdAt: "2026-08-11T12:00:00Z" }],
        "In Progress"
      )
    ).toMatchObject({
      label: "Work paused",
      primaryEvent: "resumed",
      tone: "progress",
    });
  });

  it("treats started or resumed work as in progress", () => {
    expect(
      workSessionGuidance(
        [{ event: "resumed", createdAt: "2026-08-11T12:00:00Z" }],
        "In Progress"
      )
    ).toMatchObject({
      label: "Work in progress",
      primaryEvent: "stopped",
    });
  });
});

describe("workSessionCounts", () => {
  it("counts each event type for the owner timeline summary", () => {
    expect(
      workSessionCounts([
        { event: "started" },
        { event: "paused" },
        { event: "resumed" },
        { event: "stopped" },
        { event: "stopped" },
      ])
    ).toMatchObject([
      { event: "started", count: 1 },
      { event: "paused", count: 1 },
      { event: "resumed", count: 1 },
      { event: "stopped", count: 2 },
    ]);
  });
});
