import { NextResponse } from "next/server";
import { buildHealthPayload } from "@/lib/health";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  return NextResponse.json(buildHealthPayload(), {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
