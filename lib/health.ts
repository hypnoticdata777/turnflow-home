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
  };
  latencyMs?: number;
};

type HealthEnv = Partial<
  Pick<
    NodeJS.ProcessEnv,
    "VERCEL_ENV" | "NODE_ENV" | "VERCEL_GIT_COMMIT_SHA" | "HEALTHCHECK_SECRET"
  >
>;

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

export function buildDeepHealthPayload(
  options: {
    status: DeepHealthPayload["status"];
    auth: NonNullable<DeepHealthPayload["checks"]["auth"]>;
    database?: NonNullable<DeepHealthPayload["checks"]["database"]>;
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
    },
    ...(typeof options.latencyMs === "number" ? { latencyMs: options.latencyMs } : {}),
  };
}
