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

  it("summarizes completion, active, blocked, and proof-planned tasks", () => {
    expect(
      requestTaskMetrics([
        { title: "Demo", status: "done", requiredPhotoTypes: ["before", "after"] },
        { title: "Install", status: "in_progress" },
        { title: "Paint", status: "blocked" },
      ])
    ).toMatchObject([
      { label: "Project tasks", value: "1/3", tone: "progress" },
      { label: "In motion", value: "1", tone: "progress" },
      { label: "Blocked", value: "1", tone: "attention" },
      { label: "Proof planned", value: "1/3", tone: "ready" },
    ]);
  });
});
