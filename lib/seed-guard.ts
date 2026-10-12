import { isLocalUrl } from "./local-host";

// Safety rail for `npm run db:seed` (Phase 0, 2026-10-08). The seed script
// creates owner/vendor/collaborator accounts with a shared password. A known
// default password is fine on a database on this machine and a standing
// backdoor on a hosted one, so a hosted DATABASE_URL (Neon is always hosted)
// now requires an explicit, non-default SEED_PASSWORD.

export const DEFAULT_LOCAL_SEED_PASSWORD = "password123";
export const MIN_HOSTED_SEED_PASSWORD_LENGTH = 12;

/** Returns an error message when seeding with this configuration is unsafe. */
export function seedPasswordProblem(env: {
  DATABASE_URL?: string;
  SEED_PASSWORD?: string;
}): string | null {
  if (isLocalUrl(env.DATABASE_URL)) return null;

  const password = env.SEED_PASSWORD?.trim();
  if (!password) {
    return "DATABASE_URL is not a local database, so SEED_PASSWORD must be set (a hosted database never gets the default demo password).";
  }
  if (password === DEFAULT_LOCAL_SEED_PASSWORD) {
    return "SEED_PASSWORD is the well-known local default; choose a different value before seeding a hosted database.";
  }
  if (password.length < MIN_HOSTED_SEED_PASSWORD_LENGTH) {
    return `SEED_PASSWORD must be at least ${MIN_HOSTED_SEED_PASSWORD_LENGTH} characters when seeding a hosted database.`;
  }
  return null;
}

/** The password the seed script applies: the explicit one, else the local default. */
export function resolveSeedPassword(env: { SEED_PASSWORD?: string }): string {
  return env.SEED_PASSWORD?.trim() || DEFAULT_LOCAL_SEED_PASSWORD;
}
