import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authorizeDeepHealth, buildDeepHealthPayload } from "@/lib/health";

export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store",
};

export async function GET(request: Request): Promise<NextResponse> {
  const authorization = authorizeDeepHealth(request.headers.get("authorization"));

  if (!authorization.authorized) {
    return NextResponse.json(
      buildDeepHealthPayload({
        status: authorization.auth === "not_configured" ? "not_configured" : "unauthorized",
        auth: authorization.auth,
      }),
      { status: authorization.status, headers: NO_STORE_HEADERS }
    );
  }

  const startedAt = Date.now();

  try {
    await db.select({ ok: sql<number>`1` });

    return NextResponse.json(
      buildDeepHealthPayload({
        status: "ok",
        auth: "ok",
        database: "ok",
        latencyMs: Date.now() - startedAt,
      }),
      { headers: NO_STORE_HEADERS }
    );
  } catch {
    return NextResponse.json(
      buildDeepHealthPayload({
        status: "degraded",
        auth: "ok",
        database: "error",
        latencyMs: Date.now() - startedAt,
      }),
      { status: 503, headers: NO_STORE_HEADERS }
    );
  }
}
