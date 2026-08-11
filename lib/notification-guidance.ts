export type NotificationLogInput = {
  type: string;
  status: string;
  recipientEmail?: string | null;
  subject?: string | null;
  error?: string | null;
  createdAt?: string | Date | null;
};

export type NotificationMetric = {
  label: string;
  value: string;
  detail: string;
  tone: "attention" | "progress" | "ready" | "empty";
};

export type NotificationEntryGuidance = {
  label: string;
  detail: string;
  nextStep: string;
  tone: "attention" | "ready";
};

const TYPE_LABELS: Record<string, string> = {
  status_change: "Status change",
  vendor_invite: "Vendor invite",
  collaborator_invite: "Collaborator invite",
  vendor_invite_resend: "Vendor invite resend",
  collaborator_invite_resend: "Collaborator invite resend",
  vendor_bid_submitted: "Vendor bid submitted",
  vendor_bid_updated: "Vendor bid updated",
  vendor_bid_approved: "Vendor bid approved",
  vendor_bid_declined: "Vendor bid declined",
  reminder_due: "Maintenance reminder",
};

export function notificationTypeLabel(type: string) {
  return TYPE_LABELS[type] || type;
}

function isResendConfigError(error: string | null | undefined) {
  return Boolean(error?.includes("RESEND_API_KEY"));
}

function isMissingRecipient(error: string | null | undefined) {
  return Boolean(error?.toLowerCase().includes("no email"));
}

export function notificationDeliveryMetrics(
  entries: NotificationLogInput[]
): NotificationMetric[] {
  const sentCount = entries.filter((entry) => entry.status === "sent").length;
  const failedCount = entries.filter((entry) => entry.status === "failed").length;
  const configFailureCount = entries.filter((entry) => isResendConfigError(entry.error)).length;
  const missingRecipientCount = entries.filter((entry) => isMissingRecipient(entry.error)).length;

  return [
    {
      label: "Logged attempts",
      value: String(entries.length),
      detail:
        entries.length > 0
          ? "Every invite, status, vendor bid update, bid decision, and reminder email attempt is preserved here."
          : "Notification attempts will appear here after invites, status changes, vendor bids, bid decisions, or reminder digests.",
      tone: entries.length > 0 ? "ready" : "empty",
    },
    {
      label: "Delivered",
      value: String(sentCount),
      detail:
        sentCount > 0
          ? `${sentCount} email ${sentCount === 1 ? "attempt has" : "attempts have"} been sent successfully.`
          : entries.length > 0
            ? "No email attempts have been delivered yet."
            : "Delivered email counts will appear once outbound email is configured and used.",
      tone: sentCount > 0 ? "ready" : entries.length > 0 ? "attention" : "empty",
    },
    {
      label: "Needs attention",
      value: String(failedCount),
      detail:
        failedCount > 0
          ? `${failedCount} email ${failedCount === 1 ? "attempt needs" : "attempts need"} owner review or environment setup.`
          : entries.length > 0
            ? "No failed delivery attempts are currently logged."
            : "Failures will be explained here if email delivery cannot complete.",
      tone: failedCount > 0 ? "attention" : entries.length > 0 ? "ready" : "empty",
    },
    {
      label: "Setup clues",
      value: String(configFailureCount + missingRecipientCount),
      detail:
        configFailureCount > 0
          ? "Email service configuration is blocking delivery; copy invite links until Resend is configured."
          : missingRecipientCount > 0
            ? "Some attempts are missing recipient email addresses."
            : entries.length > 0
              ? "No configuration or missing-recipient clues are currently logged."
              : "Setup issues will be called out when the first notification attempt is logged.",
      tone:
        configFailureCount + missingRecipientCount > 0
          ? "attention"
          : entries.length > 0
            ? "ready"
            : "empty",
    },
  ];
}

export function notificationEntryGuidance(
  entry: NotificationLogInput
): NotificationEntryGuidance {
  if (entry.status === "sent") {
    return {
      label: "Delivered",
      detail: "This email attempt was sent successfully.",
      nextStep: "No action needed unless the recipient says they did not receive it.",
      tone: "ready",
    };
  }

  if (isResendConfigError(entry.error)) {
    return {
      label: "Email not configured",
      detail: "The app recorded the attempt, but outbound email is not configured in this environment.",
      nextStep: "Use copyable invite links for now, then configure RESEND_API_KEY before a hosted POC.",
      tone: "attention",
    };
  }

  if (isMissingRecipient(entry.error)) {
    return {
      label: "Missing recipient",
      detail: "The app could not send because the recipient email was not available.",
      nextStep: "Confirm the owner or invite recipient email before relying on email delivery.",
      tone: "attention",
    };
  }

  return {
    label: "Delivery failed",
    detail: entry.error || "The app recorded a failed delivery attempt.",
    nextStep: "Review the recipient, sender configuration, and provider status before retrying.",
    tone: "attention",
  };
}
