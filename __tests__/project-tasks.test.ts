import { describe, expect, it } from "vitest";
import {
  isRequestTaskStatus,
  normalizeRequestTaskTitle,
  requestTaskMetrics,
} from "@/lib/project-tasks";

describe("isRequestTaskStatus", () => {
  it("accepts known task statuses", () => {
    expect(isRequestTaskStatus("todo")).toBe(true);
    expect(isRequestTaskStatus("done")).toBe(true);
    expect(isRequestTaskStatus("waiting")).toBe(false);
  });
});

describe("normalizeRequestTaskTitle", () => {
  it("trims and limits task titles", () => {
    expect(normalizeRequestTaskTitle("  Replace shutoff valve  ")).toBe(
      "Replace shutoff valve"
    );
    expect(normalizeRequestTaskTitle("x".repeat(140))).toHaveLength(120);
  });
});

describe("requestTaskMetrics", () => {
  it("explains an empty task list", () => {
    expect(requestTaskMetrics([])).toEqual([
      {
        label: "Project tasks",
        value: "0",
        detail:
          "Add tasks for multi-step jobs so vendors can track each phase with time and proof.",
        tone: "attention",
      },
    ]);
  });

  it("summarizes completion, owner acceptance, blocked tasks, and task costs", () => {
    expect(
      requestTaskMetrics([
        {
          title: "Demo",
          status: "done",
          estimatedCost: "100.00",
          finalCost: "125.00",
          requiredPhotoTypes: ["before", "after"],
        },
        { title: "Install", status: "in_progress", estimatedCost: "200.00" },
        { title: "Paint", status: "blocked" },
      ])
    ).toMatchObject([
      { label: "Project tasks", value: "1/3", tone: "attention" },
      { label: "Accepted", value: "0/3", tone: "attention" },
      { label: "Blocked", value: "1", tone: "attention" },
      { label: "Task costs", value: "$125.00", tone: "ready" },
    ]);
  });

  it("marks task metrics ready when every task is owner-accepted", () => {
    expect(
      requestTaskMetrics([
        {
          title: "Demo",
          status: "done",
          estimatedCost: "95.00",
          finalCost: "95.00",
          acceptedAt: "2026-08-11T10:00:00.000Z",
        },
      ])
    ).toMatchObject([
      { label: "Project tasks", value: "1/1", tone: "ready" },
      { label: "Accepted", value: "1/1", tone: "ready" },
      { label: "Blocked", value: "0", tone: "ready" },
      { label: "Task costs", value: "$95.00", tone: "ready" },
    ]);
  });
});
