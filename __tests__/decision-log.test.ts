import { describe, expect, it } from "vitest";
import { describeLogAction } from "@/components/DecisionLog";

describe("describeLogAction", () => {
  it("describes vendor access removal", () => {
    expect(
      describeLogAction("shared_access_removed", {
        role: "vendor",
        removedUserEmail: "vendor@test.com",
      })
    ).toBe(
      "Removed vendor access for vendor@test.com from this request."
    );
  });

  it("describes collaborator access removal", () => {
    expect(
      describeLogAction("shared_access_removed", {
        role: "collaborator",
        removedUserEmail: "helper@test.com",
      })
    ).toBe(
      "Removed collaborator access for helper@test.com from this request."
    );
  });

  it("keeps a readable fallback when the removed user's email is unavailable", () => {
    expect(describeLogAction("shared_access_removed", { role: "vendor" })).toBe(
      "Removed vendor access from this request."
    );
  });

  it("describes vendor bid submissions and updates", () => {
    expect(
      describeLogAction("vendor_bid_submitted", {
        vendorName: "Brightside Home Services",
        amount: "325.00",
      })
    ).toBe("Vendor bid submitted by Brightside Home Services ($325.00).");
    expect(
      describeLogAction("vendor_bid_updated", {
        vendorName: "Brightside Home Services",
        amount: "350.00",
      })
    ).toBe("Vendor bid updated by Brightside Home Services ($350.00).");
  });

  it("describes work session events with notes", () => {
    expect(
      describeLogAction("work_session_event", {
        label: "Paused work",
        taskLabel: "Plumbing rough-in",
        notes: "Waiting for access to the shutoff valve",
      })
    ).toBe("Paused work (Plumbing rough-in): Waiting for access to the shutoff valve");
  });

  it("describes project task lifecycle events", () => {
    expect(describeLogAction("request_task_created", { title: "Demo" })).toBe(
      'Added project task "Demo".'
    );
    expect(
      describeLogAction("request_task_status_changed", {
        title: "Demo",
        from: "To do",
        to: "Done",
      })
    ).toBe('Changed project task "Demo" from To do to Done.');
    expect(
      describeLogAction("request_task_cost_updated", {
        title: "Demo",
        estimatedCost: "95.00",
        finalCost: "110.00",
      })
    ).toBe('Updated project task "Demo" costs: estimated $95.00, final $110.00.');
    expect(describeLogAction("request_task_accepted", { title: "Demo" })).toBe(
      'Accepted project task "Demo" for closeout.'
    );
    expect(describeLogAction("closeout_submitted", { finalAmount: "250.00" })).toBe(
      "Vendor submitted closeout for owner review ($250.00)."
    );
    expect(describeLogAction("closeout_approved", { finalAmount: "250.00" })).toBe(
      "Owner approved vendor closeout ($250.00)."
    );
    expect(
      describeLogAction("closeout_changes_requested", {
        reviewNotes: "Please add the receipt photo.",
      })
    ).toBe("Owner requested closeout changes: Please add the receipt photo.");
    expect(
      describeLogAction("billing_record_updated", {
        from: "recorded",
        to: "paid",
        amount: "250.00",
      })
    ).toBe("Updated billing record from recorded to paid ($250.00).");
  });

  it("falls back to the action key for unknown log events", () => {
    expect(describeLogAction("unknown_event", null)).toBe("unknown_event");
  });
});
