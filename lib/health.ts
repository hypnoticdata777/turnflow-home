import packageInfo from "@/package.json";

export type HealthPayload = {
  status: "ok";
  service: "turnflow-home";
  timestamp: string;
  version: string;
  environment: string;
  commit: string | null;
};

export type DeepHealthPayload = Omit<HealthPayload, "status"> & {
  status: "ok" | "degraded" | "unauthorized" | "not_configured";
  checks: {
    database?: "ok" | "error";
    auth?: "ok" | "missing" | "invalid" | "not_configured";
    appUrl?: "ok" | "error";
    blobStorage?: "ok" | "error";
    reminderCron?: "ok" | "warning";
    emailDelivery?: "ok" | "warning" | "error";
  };
  latencyMs?: number;
};

type HealthEnv = Partial<
  Pick<
    NodeJS.ProcessEnv,
    "VERCEL_ENV" | "NODE_ENV" | "VERCEL_GIT_COMMIT_SHA" | "HEALTHCHECK_SECRET"
    | "APP_URL"
    | "BLOB_READ_WRITE_TOKEN"
    | "CRON_SECRET"
    | "RESEND_API_KEY"
    | "NOTIFICATIONS_FROM_EMAIL"
  >
>;

export type OperationalHealthChecks = Required<
  Pick<DeepHealthPayload["checks"], "appUrl" | "blobStorage" | "reminderCron" | "emailDelivery">
>;

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

function validEmail(value: string | undefined) {
  if (!hasValue(value)) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value!.trim());
}

function blobTokenReady(value: string | undefined) {
  if (!hasValue(value)) return false;
  const token = value!.trim();
  return token.startsWith("vercel_blob_rw_") && token.length >= 30;
}

function secretReady(value: string | undefined) {
  return Boolean(value && value.trim().length >= 32);
}

export function buildHealthPayload(
  now: Date = new Date(),
  env: HealthEnv = process.env
): HealthPayload {
  return {
    status: "ok",
    service: "turnflow-home",
    timestamp: now.toISOString(),
    version: packageInfo.version,
    environment: env.VERCEL_ENV || env.NODE_ENV || "unknown",
    commit: env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) || null,
  };
}

export function bearerTokenFromHeader(authorizationHeader: string | null) {
  if (!authorizationHeader) return null;

  const [scheme, token] = authorizationHeader.split(" ");
  if (scheme !== "Bearer" || !token) return null;
  return token;
}

export function authorizeDeepHealth(authorizationHeader: string | null, env: HealthEnv = process.env) {
  if (!env.HEALTHCHECK_SECRET) {
    return {
      authorized: false,
      status: 503,
      auth: "not_configured" as const,
    };
  }

  const token = bearerTokenFromHeader(authorizationHeader);
  if (!token) {
    return {
      authorized: false,
      status: 401,
      auth: "missing" as const,
    };
  }

  if (token !== env.HEALTHCHECK_SECRET) {
    return {
      authorized: false,
      status: 401,
      auth: "invalid" as const,
    };
  }

  return {
    authorized: true,
    status: 200,
    auth: "ok" as const,
  };
}

export function buildOperationalHealthChecks(env: HealthEnv = process.env): OperationalHealthChecks {
  const hasResend = hasValue(env.RESEND_API_KEY);

  return {
    appUrl: validUrl(env.APP_URL) ? "ok" : "error",
    blobStorage: blobTokenReady(env.BLOB_READ_WRITE_TOKEN) ? "ok" : "error",
    reminderCron: secretReady(env.CRON_SECRET) ? "ok" : "warning",
    emailDelivery: hasResend
      ? validEmail(env.NOTIFICATIONS_FROM_EMAIL)
        ? "ok"
        : "error"
      : "warning",
  };
}

export function operationalChecksAreDegraded(checks: OperationalHealthChecks) {
  return Object.values(checks).includes("error");
}

export function buildDeepHealthPayload(
  options: {
    status: DeepHealthPayload["status"];
    auth: NonNullable<DeepHealthPayload["checks"]["auth"]>;
    database?: NonNullable<DeepHealthPayload["checks"]["database"]>;
    operational?: OperationalHealthChecks;
    latencyMs?: number;
  },
  now: Date = new Date(),
  env: HealthEnv = process.env
): DeepHealthPayload {
  return {
    ...buildHealthPayload(now, env),
    status: options.status,
    checks: {
      auth: options.auth,
      ...(options.database ? { database: options.database } : {}),
      ...(options.operational ?? {}),
    },
    ...(typeof options.latencyMs === "number" ? { latencyMs: options.latencyMs } : {}),
  };
}
