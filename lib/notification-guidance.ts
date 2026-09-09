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

export type NotificationOpsEnv = Partial<
  Pick<NodeJS.ProcessEnv, "RESEND_API_KEY" | "NOTIFICATIONS_FROM_EMAIL" | "CRON_SECRET">
>;

export type NotificationOpsCheck = {
  label: string;
  value: string;
  detail: string;
  tone: "attention" | "progress" | "ready";
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
  work_session_event: "Work session event",
  closeout_submitted: "Closeout submitted",
  closeout_approved: "Closeout approved",
  closeout_changes_requested: "Closeout changes requested",
  reminder_due: "Maintenance reminder",
  delivery_test: "Delivery test",
};

function hasValue(value: string | undefined) {
  return Boolean(value?.trim());
}

function validEmail(value: string | undefined) {
  if (!hasValue(value)) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value!.trim());
}

function secretReady(value: string | undefined) {
  return Boolean(value && value.trim().length >= 32);
}

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
          ? "Every invite, status, vendor bid update, bid decision, work session, closeout review, and reminder email attempt is preserved here."
          : "Notification attempts will appear here after invites, status changes, vendor bids, bid decisions, work sessions, closeout reviews, or reminder digests.",
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

export function notificationOpsChecks(
  env: NotificationOpsEnv,
  entries: NotificationLogInput[],
  now: Date = new Date()
): NotificationOpsCheck[] {
  const latestTest = entries
    .filter((entry) => entry.type === "delivery_test")
    .sort(
      (a, b) =>
        new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
    )[0];
  const latestReminder = entries
    .filter((entry) => entry.type === "reminder_due")
    .sort(
      (a, b) =>
        new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
    )[0];
  const testDelivered = latestTest?.status === "sent";
  const reminderAgeDays = latestReminder?.createdAt
    ? Math.floor(
        (now.getTime() - new Date(latestReminder.createdAt).getTime()) /
          (24 * 60 * 60 * 1000)
      )
    : null;

  return [
    {
      label: "Resend key",
      value: hasValue(env.RESEND_API_KEY) ? "Set" : "Missing",
      detail: hasValue(env.RESEND_API_KEY)
        ? "Outbound email has an API key available in this environment."
        : "Email attempts are logged but cannot leave the app until RESEND_API_KEY is set.",
      tone: hasValue(env.RESEND_API_KEY) ? "ready" : "attention",
    },
    {
      label: "Sender address",
      value: validEmail(env.NOTIFICATIONS_FROM_EMAIL) ? "Valid" : "Needs setup",
      detail: validEmail(env.NOTIFICATIONS_FROM_EMAIL)
        ? "The configured sender is shaped like a deliverable email address."
        : "Set NOTIFICATIONS_FROM_EMAIL to a verified Resend sender before real user testing.",
      tone: validEmail(env.NOTIFICATIONS_FROM_EMAIL) ? "ready" : "attention",
    },
    {
      label: "Test delivery",
      value: latestTest ? (testDelivered ? "Passed" : "Failed") : "Not run",
      detail: latestTest
        ? testDelivered
          ? "The latest owner-triggered delivery test sent successfully."
          : "The latest owner-triggered delivery test failed; inspect the log entry below."
        : "Send a test email after configuring Resend to confirm provider delivery.",
      tone: latestTest ? (testDelivered ? "ready" : "attention") : "progress",
    },
    {
      label: "Reminder cron",
      value: secretReady(env.CRON_SECRET) ? "Protected" : "Needs secret",
      detail: secretReady(env.CRON_SECRET)
        ? latestReminder
          ? `Reminder digest attempts are protected; latest reminder log is ${reminderAgeDays} day${reminderAgeDays === 1 ? "" : "s"} old.`
          : "Reminder digest route is protected; no reminder digest attempts are logged yet."
        : "Set a long CRON_SECRET before relying on hosted reminder automation.",
      tone: secretReady(env.CRON_SECRET) ? "ready" : "attention",
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
