"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { vendorProfiles } from "@/lib/db/schema";
import { requireRole } from "@/lib/auth/dal";
import { normalizeVendorProfile } from "@/lib/vendor-profile";

export type UpdateVendorProfileResult =
  | { ok: true }
  | { error: string };

export async function updateVendorProfileAction(
  formData: FormData
): Promise<UpdateVendorProfileResult> {
  const session = await requireRole("vendor");
  const profile = normalizeVendorProfile({
    businessName: String(formData.get("businessName") ?? ""),
    trades: formData.getAll("trades").map(String),
    serviceArea: String(formData.get("serviceArea") ?? ""),
    availability: String(formData.get("availability") ?? ""),
    notificationPreference: String(formData.get("notificationPreference") ?? ""),
    licenseInsuranceNotes: String(formData.get("licenseInsuranceNotes") ?? ""),
  });

  if (profile.trades.length === 0) {
    return { error: "Select at least one trade category." };
  }

  await db
    .insert(vendorProfiles)
    .values({
      userId: session.user.id,
      ...profile,
    })
    .onConflictDoUpdate({
      target: vendorProfiles.userId,
      set: {
        ...profile,
        updatedAt: new Date(),
      },
    });

  revalidatePath("/vendor");
  return { ok: true };
}
