export type PocReadinessStatus = "ready" | "warning" | "blocked";

export type PocReadinessEnv = Partial<
  Pick<
    NodeJS.ProcessEnv,
    | "DATABASE_URL"
    | "AUTH_SECRET"
    | "APP_URL"
    | "BLOB_READ_WRITE_TOKEN"
    | "HEALTHCHECK_SECRET"
    | "CRON_SECRET"
    | "RESEND_API_KEY"
    | "NOTIFICATIONS_FROM_EMAIL"
  >
>;

export type PocReadinessItem = {
  key: keyof PocReadinessEnv;
  label: string;
  status: PocReadinessStatus;
  detail: string;
  nextStep?: string;
};

export type PocReadinessReport = {
  status: PocReadinessStatus;
  blockedCount: number;
  warningCount: number;
  items: PocReadinessItem[];
};

function hasValue(value: string | undefined) {
  return Boolean(value?.trim());
}

function validUrl(value: string | undefined) {
  if (!hasValue(value)) return false;
  try {
    const url = new URL(value!);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function validDatabaseUrl(value: string | undefined) {
  if (!hasValue(value)) return false;
  return /^(postgres|postgresql):\/\//.test(value!.trim());
}

function validEmail(value: string | undefined) {
  if (!hasValue(value)) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value!.trim());
}

function secretStrength(value: string | undefined) {
  if (!hasValue(value)) return "missing";
  if (value!.trim().length < 32) return "short";
  return "ready";
}

export function evaluatePocReadiness(env: PocReadinessEnv): PocReadinessReport {
  const authSecretStrength = secretStrength(env.AUTH_SECRET);
  const healthSecretStrength = secretStrength(env.HEALTHCHECK_SECRET);
  const cronSecretStrength = secretStrength(env.CRON_SECRET);
  const hasResend = hasValue(env.RESEND_API_KEY);
  const hasFromEmail = hasValue(env.NOTIFICATIONS_FROM_EMAIL);

  const items: PocReadinessItem[] = [
    validDatabaseUrl(env.DATABASE_URL)
      ? {
          key: "DATABASE_URL",
          label: "Database",
          status: "ready",
          detail: "Postgres connection string is configured.",
        }
      : {
          key: "DATABASE_URL",
          label: "Database",
          status: "blocked",
          detail: "DATABASE_URL is missing or is not a Postgres URL.",
          nextStep: "Set the Neon pooled connection string before seeding or running authenticated smoke tests.",
        },
    authSecretStrength === "ready"
      ? {
          key: "AUTH_SECRET",
          label: "Auth secret",
          status: "ready",
          detail: "Auth.js has a long secret for signed sessions.",
        }
      : {
          key: "AUTH_SECRET",
          label: "Auth secret",
          status: "blocked",
          detail:
            authSecretStrength === "missing"
              ? "AUTH_SECRET is missing."
              : "AUTH_SECRET is shorter than 32 characters.",
          nextStep: "Set a long random AUTH_SECRET before testing login or deploying.",
        },
    validUrl(env.APP_URL)
      ? {
          key: "APP_URL",
          label: "App URL",
          status: "ready",
          detail: "Absolute app URL is configured for invite links and smoke tests.",
        }
      : {
          key: "APP_URL",
          label: "App URL",
          status: "blocked",
          detail: "APP_URL is missing or is not an absolute http(s) URL.",
          nextStep: "Set APP_URL to the local, preview, or production base URL.",
        },
    hasValue(env.BLOB_READ_WRITE_TOKEN)
      ? {
          key: "BLOB_READ_WRITE_TOKEN",
          label: "Blob storage",
          status: "ready",
          detail: "Vercel Blob token is configured for proof and vault uploads.",
        }
      : {
          key: "BLOB_READ_WRITE_TOKEN",
          label: "Blob storage",
          status: "blocked",
          detail: "BLOB_READ_WRITE_TOKEN is missing.",
          nextStep: "Set the Vercel Blob read/write token before real users upload files.",
        },
    healthSecretStrength === "ready"
      ? {
          key: "HEALTHCHECK_SECRET",
          label: "Deep health",
          status: "ready",
          detail: "Deep health endpoint can be protected for monitoring.",
        }
      : {
          key: "HEALTHCHECK_SECRET",
          label: "Deep health",
          status: "blocked",
          detail:
            healthSecretStrength === "missing"
              ? "HEALTHCHECK_SECRET is missing."
              : "HEALTHCHECK_SECRET is shorter than 32 characters.",
          nextStep: "Set a long separate secret for /api/health/deep.",
        },
    cronSecretStrength === "ready"
      ? {
          key: "CRON_SECRET",
          label: "Reminder cron",
          status: "ready",
          detail: "Reminder digest cron route can be protected.",
        }
      : {
          key: "CRON_SECRET",
          label: "Reminder cron",
          status: "warning",
          detail:
            cronSecretStrength === "missing"
              ? "CRON_SECRET is missing; local cron remains open when unset."
              : "CRON_SECRET is shorter than 32 characters.",
          nextStep: "Set CRON_SECRET before enabling hosted reminder automation.",
        },
    hasResend && (!hasFromEmail || !validEmail(env.NOTIFICATIONS_FROM_EMAIL))
      ? {
          key: "NOTIFICATIONS_FROM_EMAIL",
          label: "Notification sender",
          status: "blocked",
          detail: "RESEND_API_KEY is set, but NOTIFICATIONS_FROM_EMAIL is missing or invalid.",
          nextStep: "Set a verified sender email for Resend.",
        }
      : hasResend
        ? {
            key: "RESEND_API_KEY",
            label: "Email delivery",
            status: "ready",
            detail: "Resend is configured with a sender address.",
          }
        : {
            key: "RESEND_API_KEY",
            label: "Email delivery",
            status: "warning",
            detail: "RESEND_API_KEY is missing; invite and reminder attempts will log without sending email.",
            nextStep: "Set RESEND_API_KEY and a verified NOTIFICATIONS_FROM_EMAIL before real outbound email.",
          },
  ];

  const blockedCount = items.filter((item) => item.status === "blocked").length;
  const warningCount = items.filter((item) => item.status === "warning").length;
  return {
    status: blockedCount > 0 ? "blocked" : warningCount > 0 ? "warning" : "ready",
    blockedCount,
    warningCount,
    items,
  };
}
