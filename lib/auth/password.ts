import bcrypt from "bcryptjs";

// Timing-safe credential check (P0 security, 2026-09-28). When the email is
// unknown we still run one bcrypt compare against a fixed dummy hash, so the
// response takes about as long as a wrong password and cannot be used to
// discover which emails have accounts.
const DUMMY_PASSWORD_HASH = "$2b$10$KafGgSqr8tjfi4bUjj02E.rexbOFMJSEHJm5GR6Q0aXuZiuR1aJ/m";

export async function verifyPasswordTimingSafe(
  password: string,
  passwordHash: string | null | undefined
): Promise<boolean> {
  if (!passwordHash) {
    await bcrypt.compare(password, DUMMY_PASSWORD_HASH);
    return false;
  }
  return bcrypt.compare(password, passwordHash);
}
