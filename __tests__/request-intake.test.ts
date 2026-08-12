import { describe, expect, it } from "vitest";
import {
  requestIntakeHandoffChecks,
  requestIntakeHandoffSummary,
  requestIntakeNextStep,
  requestIntakeProgress,
  requestIntakeSteps,
  requestIntakeSummary,
  type RequestIntakeInput,
} from "@/lib/request-intake";

const emptyInput: RequestIntakeInput = {
  propertyId: "",
  title: "",
  category: "",
  urgency: "",
  location: "",
  contactMethod: "",
  accessInstructions: "",
  notes: "",
  photoCount: 0,
};

describe("requestIntakeSteps", () => {
  it("keeps request intake signals in the homeowner form order", () => {
    const steps = requestIntakeSteps(emptyInput);

    expect(steps.map((step) => step.label)).toEqual([
      "Property",
      "Short title",
      "Category",
      "Urgency",
      "Initial proof",
    ]);
    expect(requestIntakeProgress(steps)).toEqual({
      completedCount: 0,
      totalCount: 5,
      progress: 0,
    });
  });

  it("trims text fields before marking them complete", () => {
    const steps = requestIntakeSteps({
      ...emptyInput,
      propertyId: "property-1",
      title: "   ",
      category: "Plumbing",
      urgency: "High",
      photoCount: 1,
    });

    expect(steps.map((step) => step.complete)).toEqual([true, false, true, true, true]);
    expect(requestIntakeProgress(steps)).toMatchObject({ completedCount: 4, progress: 80 });
  });
});

describe("requestIntakeHandoffSummary", () => {
  it("keeps optional vendor handoff readiness separate from required save fields", () => {
    const checks = requestIntakeHandoffChecks({
      ...emptyInput,
      propertyId: "property-1",
      title: "Kitchen sink leak",
      category: "Plumbing",
      urgency: "High",
    });

    expect(checks.map((check) => check.complete)).toEqual([false, false, false, false]);
    expect(requestIntakeHandoffSummary(checks)).toMatchObject({
      headline: "Vendor handoff is still light.",
      tone: "empty",
    });
  });

  it("summarizes partial homeowner context without blocking draft save", () => {
    const checks = requestIntakeHandoffChecks({
      ...emptyInput,
      location: "Kitchen",
      contactMethod: "Text",
      notes: "Started after the dishwasher cycle.",
    });

    expect(requestIntakeHandoffSummary(checks)).toMatchObject({
      headline: "3 of 4 handoff details are ready.",
      tone: "progress",
    });
  });

  it("marks vendor handoff ready when practical visit context is present", () => {
    const checks = requestIntakeHandoffChecks({
      ...emptyInput,
      location: "Kitchen",
      contactMethod: "Phone",
      accessInstructions: "Use side gate, dog is inside.",
      notes: "Leak is intermittent but worse at night.",
    });

    expect(requestIntakeHandoffSummary(checks)).toMatchObject({
      headline: "Vendor handoff looks ready.",
      tone: "ready",
    });
  });
});

describe("requestIntakeSummary", () => {
  it("points an empty intake to the property field first", () => {
    const steps = requestIntakeSteps(emptyInput);

    expect(requestIntakeNextStep(steps)).toMatchObject({
      label: "Property",
      href: "#request-property",
      cta: "Choose property",
    });
    expect(requestIntakeSummary(steps)).toMatchObject({
      headline: "Start by choosing the home.",
      tone: "empty",
    });
  });

  it("summarizes in-progress intake with the next missing detail", () => {
    const steps = requestIntakeSteps({
      ...emptyInput,
      propertyId: "property-1",
      title: "Kitchen sink leak",
    });

    expect(requestIntakeNextStep(steps)).toMatchObject({
      label: "Category",
      cta: "Choose category",
    });
    expect(requestIntakeSummary(steps)).toMatchObject({
      headline: "2 of 5 request details are ready.",
      detail:
        "Next best action: choose category so this repair record is easier to act on.",
      tone: "progress",
    });
  });

  it("marks a request draft ready when every intake signal is present", () => {
    const steps = requestIntakeSteps({
      ...emptyInput,
      propertyId: "property-1",
      title: "Kitchen sink leak",
      category: "Plumbing",
      urgency: "High",
      photoCount: 2,
    });

    expect(requestIntakeNextStep(steps)).toBeNull();
    expect(requestIntakeSummary(steps)).toMatchObject({
      headline: "This request has enough context to start strong.",
      tone: "ready",
    });
    expect(requestIntakeProgress(steps)).toMatchObject({ completedCount: 5, progress: 100 });
  });
});
