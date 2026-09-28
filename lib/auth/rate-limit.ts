import "server-only";

import { and, count, eq, gte, lt } from "drizzle-orm";
import { db } from "@/lib/db";
import { authAttempts } from "@/lib/db/schema";
import {
  isOverLimit,
  rateLimitKey,
  windowStart,
  type RateLimitRule,
} from "@/lib/auth/rate-limit-policy";

// Database-backed attempt counter (P0 security, 2026-09-28). Works on
// serverless without extra infrastructure because every instance shares the
// same Postgres table. It FAILS OPEN: if the table is missing (migration not
// run yet) or the database hiccups, sign-in keeps working and the error is
// logged, because locking every user out is worse than a short gap in rate
// limiting. See docs/04-algorithms/01-auth-and-rate-limiting.md.

const PRUNE_AFTER_MS = 24 * 60 * 60 * 1000;

export async function isRateLimited(rule: RateLimitRule, subject: string): Promise<boolean> {
  try {
    const [row] = await db
      .select({ attempts: count() })
      .from(authAttempts)
      .where(
        and(
          eq(authAttempts.key, rateLimitKey(rule, subject)),
          gte(authAttempts.createdAt, windowStart(rule))
        )
      );
    return isOverLimit(Number(row?.attempts ?? 0), rule);
  } catch (error) {
    console.error("[rate-limit] check failed; allowing request", error);
    return false;
  }
}

export async function recordAttempt(rule: RateLimitRule, subject: string): Promise<void> {
  try {
    await db.insert(authAttempts).values({ key: rateLimitKey(rule, subject) });
    // Cheap housekeeping: about 1 in 50 writes prunes day-old rows.
    if (Math.random() < 0.02) {
      await db
        .delete(authAttempts)
        .where(lt(authAttempts.createdAt, new Date(Date.now() - PRUNE_AFTER_MS)));
    }
  } catch (error) {
    console.error("[rate-limit] record failed", error);
  }
}

/** Clears a counter after a successful sign-in so earlier typos do not linger. */
export async function clearAttempts(rule: RateLimitRule, subject: string): Promise<void> {
  try {
    await db.delete(authAttempts).where(eq(authAttempts.key, rateLimitKey(rule, subject)));
  } catch (error) {
    console.error("[rate-limit] clear failed", error);
  }
}
