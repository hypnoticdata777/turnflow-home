export type PocReadinessStatus = "ready" | "warning" | "blocked";

export type PocReadinessEnv = Partial<
  Pick<
    NodeJS.ProcessEnv,
    | "DATABASE_URL"
    | "AUTH_SECRET"
    | "NEXTAUTH_SECRET"
    | "AUTH_URL"
    | "NEXTAUTH_URL"
    | "APP_URL"
    | "BLOB_READ_WRITE_TOKEN"
    | "BLOB_ACCESS"
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

// A real Vercel Blob read/write token looks like
// `vercel_blob_rw_<storeId>_<secret>` and runs well past 30 characters. A
// short or wrong-prefixed value is a stale/placeholder token that passes a
// bare presence check but fails the moment a client upload is attempted, so
// treat it as a hard blocker rather than a green check.
function blobTokenState(value: string | undefined) {
  if (!hasValue(value)) return "missing";
  const token = value!.trim();
  if (!token.startsWith("vercel_blob_rw_") || token.length < 30) {
    return "malformed";
  }
  return "ready";
}

function secretStrength(value: string | undefined) {
  if (!hasValue(value)) return "missing";
  if (value!.trim().length < 32) return "short";
  return "ready";
}

export function evaluatePocReadiness(env: PocReadinessEnv): PocReadinessReport {
  const authSecretStrength = secretStrength(env.AUTH_SECRET);
  const nextAuthSecretStrength = secretStrength(env.NEXTAUTH_SECRET);
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
    nextAuthSecretStrength === "ready" && env.NEXTAUTH_SECRET === env.AUTH_SECRET
      ? {
          key: "NEXTAUTH_SECRET",
          label: "NextAuth compatibility secret",
          status: "ready",
          detail: "NEXTAUTH_SECRET matches AUTH_SECRET for hosted Auth.js credentials callbacks.",
        }
      : {
          key: "NEXTAUTH_SECRET",
          label: "NextAuth compatibility secret",
          status: "blocked",
          detail:
            nextAuthSecretStrength === "missing"
              ? "NEXTAUTH_SECRET is missing."
              : env.NEXTAUTH_SECRET !== env.AUTH_SECRET
                ? "NEXTAUTH_SECRET does not match AUTH_SECRET."
                : "NEXTAUTH_SECRET is shorter than 32 characters.",
          nextStep:
            "Set NEXTAUTH_SECRET to the exact same long value as AUTH_SECRET, then redeploy.",
        },
    validUrl(env.AUTH_URL) && env.AUTH_URL === env.APP_URL
      ? {
          key: "AUTH_URL",
          label: "Auth URL",
          status: "ready",
          detail: "AUTH_URL matches APP_URL for same-host Auth.js redirects.",
        }
      : {
          key: "AUTH_URL",
          label: "Auth URL",
          status: "blocked",
          detail: !validUrl(env.AUTH_URL)
            ? "AUTH_URL is missing or is not an absolute http(s) URL."
            : "AUTH_URL does not match APP_URL.",
          nextStep:
            "Set AUTH_URL to the same base URL as APP_URL for the target environment.",
        },
    validUrl(env.NEXTAUTH_URL) && env.NEXTAUTH_URL === env.APP_URL
      ? {
          key: "NEXTAUTH_URL",
          label: "NextAuth URL",
          status: "ready",
          detail: "NEXTAUTH_URL matches APP_URL for hosted NextAuth compatibility.",
        }
      : {
          key: "NEXTAUTH_URL",
          label: "NextAuth URL",
          status: "blocked",
          detail: !validUrl(env.NEXTAUTH_URL)
            ? "NEXTAUTH_URL is missing or is not an absolute http(s) URL."
            : "NEXTAUTH_URL does not match APP_URL.",
          nextStep:
            "Set NEXTAUTH_URL to the same base URL as APP_URL for the target environment.",
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
    blobTokenState(env.BLOB_READ_WRITE_TOKEN) === "ready"
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
          detail:
            blobTokenState(env.BLOB_READ_WRITE_TOKEN) === "missing"
              ? "BLOB_READ_WRITE_TOKEN is missing."
              : "BLOB_READ_WRITE_TOKEN is set but is not a valid Vercel Blob read/write token (expected a long value starting with vercel_blob_rw_).",
          nextStep:
            "Copy a fresh read/write token from the Vercel Blob store and set it for Production and local .env.local before real users upload files.",
        },
    // P0 (2026-09-28): public stores expose receipts and home photos to
    // anyone holding a URL. Uploads still work in public mode so an existing
    // store keeps running, but the report flags it until BLOB_ACCESS=private.
    env.BLOB_ACCESS?.trim().toLowerCase() === "private"
      ? {
          key: "BLOB_ACCESS",
          label: "File privacy",
          status: "ready",
          detail: "Uploads are stored privately and served only through the authorized /api/files route.",
        }
      : {
          key: "BLOB_ACCESS",
          label: "File privacy",
          status: "warning",
          detail:
            "BLOB_ACCESS is not \"private\"; uploaded photos and documents are readable by anyone with the raw Blob URL.",
          nextStep:
            "Create a Private Vercel Blob store, set its BLOB_READ_WRITE_TOKEN, set BLOB_ACCESS=private, and redeploy.",
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
              ? "CRON_SECRET is missing; cron routes stay open locally but refuse to run in production."
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
