import { describe, expect, it } from "vitest";
import {
  notificationDeliveryMetrics,
  notificationEntryGuidance,
  notificationTypeLabel,
} from "@/lib/notification-guidance";

describe("notificationTypeLabel", () => {
  it("labels known invite, status, bid, and reminder notification types", () => {
    expect(notificationTypeLabel("status_change")).toBe("Status change");
    expect(notificationTypeLabel("vendor_invite_resend")).toBe("Vendor invite resend");
    expect(notificationTypeLabel("collaborator_invite")).toBe("Collaborator invite");
    expect(notificationTypeLabel("vendor_bid_submitted")).toBe("Vendor bid submitted");
    expect(notificationTypeLabel("vendor_bid_updated")).toBe("Vendor bid updated");
    expect(notificationTypeLabel("vendor_bid_approved")).toBe("Vendor bid approved");
    expect(notificationTypeLabel("vendor_bid_declined")).toBe("Vendor bid declined");
    expect(notificationTypeLabel("unknown_type")).toBe("unknown_type");
  });
});

describe("notificationDeliveryMetrics", () => {
  it("keeps an empty notification log understandable", () => {
    expect(notificationDeliveryMetrics([])).toEqual([
      {
        label: "Logged attempts",
        value: "0",
        detail:
          "Notification attempts will appear here after invites, status changes, vendor bids, bid decisions, or reminder digests.",
        tone: "empty",
      },
      {
        label: "Delivered",
        value: "0",
        detail: "Delivered email counts will appear once outbound email is configured and used.",
        tone: "empty",
      },
      {
        label: "Needs attention",
        value: "0",
        detail: "Failures will be explained here if email delivery cannot complete.",
        tone: "empty",
      },
      {
        label: "Setup clues",
        value: "0",
        detail: "Setup issues will be called out when the first notification attempt is logged.",
        tone: "empty",
      },
    ]);
  });

  it("summarizes sent, failed, and setup-related attempts", () => {
    expect(
      notificationDeliveryMetrics([
        { type: "status_change", status: "sent" },
        {
          type: "vendor_invite",
          status: "failed",
          error: "RESEND_API_KEY is not set",
        },
        {
          type: "reminder_due",
          status: "failed",
          error: "No email on record for recipient",
        },
      ])
    ).toMatchObject([
      {
        label: "Logged attempts",
        value: "3",
        detail:
          "Every invite, status, vendor bid update, bid decision, and reminder email attempt is preserved here.",
        tone: "ready",
      },
      {
        label: "Delivered",
        value: "1",
        tone: "ready",
      },
      {
        label: "Needs attention",
        value: "2",
        detail: "2 email attempts need owner review or environment setup.",
        tone: "attention",
      },
      {
        label: "Setup clues",
        value: "2",
        detail:
          "Email service configuration is blocking delivery; copy invite links until Resend is configured.",
        tone: "attention",
      },
    ]);
  });
});

describe("notificationEntryGuidance", () => {
  it("marks sent notifications as ready", () => {
    expect(
      notificationEntryGuidance({
        type: "status_change",
        status: "sent",
      })
    ).toEqual({
      label: "Delivered",
      detail: "This email attempt was sent successfully.",
      nextStep: "No action needed unless the recipient says they did not receive it.",
      tone: "ready",
    });
  });

  it("turns missing Resend configuration into an actionable POC next step", () => {
    expect(
      notificationEntryGuidance({
        type: "vendor_invite",
        status: "failed",
        error: "RESEND_API_KEY is not set",
      })
    ).toEqual({
      label: "Email not configured",
      detail:
        "The app recorded the attempt, but outbound email is not configured in this environment.",
      nextStep:
        "Use copyable invite links for now, then configure RESEND_API_KEY before a hosted POC.",
      tone: "attention",
    });
  });

  it("explains missing-recipient failures", () => {
    expect(
      notificationEntryGuidance({
        type: "reminder_due",
        status: "failed",
        error: "No email on record for recipient",
      })
    ).toMatchObject({
      label: "Missing recipient",
      nextStep: "Confirm the owner or invite recipient email before relying on email delivery.",
      tone: "attention",
    });
  });
});
