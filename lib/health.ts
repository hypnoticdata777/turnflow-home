import packageInfo from "@/package.json";

export type HealthPayload = {
  status: "ok";
  service: "turnflow-home";
  timestamp: string;
  version: string;
  environment: string;
  commit: string | null;
};

type HealthEnv = Partial<
  Pick<NodeJS.ProcessEnv, "VERCEL_ENV" | "NODE_ENV" | "VERCEL_GIT_COMMIT_SHA">
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
