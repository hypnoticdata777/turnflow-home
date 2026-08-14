"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { signIn, signOut } from "@/lib/auth/config";
import { requireRole, roleHome } from "@/lib/auth/dal";
import {
  parseOwnerProfileFields,
  parseSignupFields,
  signupValuesFromFormData,
  type ProfileFieldErrors,
  type SignupFieldErrors,
  type SignupFields,
} from "@/lib/auth/forms";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

export type LoginState = { error?: string } | undefined;
export type SignupState =
  | {
      error?: string;
      fieldErrors?: SignupFieldErrors;
      values?: SignupFields;
    }
  | undefined;
export type ProfileState =
  | {
      error?: string;
      success?: string;
      fieldErrors?: ProfileFieldErrors;
    }
  | undefined;

export async function signupAction(
  _prevState: SignupState,
  formData: FormData
): Promise<SignupState> {
  const values = signupValuesFromFormData(formData);
  const parsed = parseSignupFields({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors, values };
  }

  const existing = await db.query.users.findFirst({
    where: (u, { eq }) => eq(u.email, parsed.data.email),
  });
  if (existing) {
    return { error: "An account already exists for that email.", values };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);

  try {
    await db.insert(users).values({
      email: parsed.data.email,
      passwordHash,
      role: "owner",
      name: parsed.data.name,
    });
  } catch (error) {
    console.error("Signup failed:", error);
    return { error: "Could not create that account. Please try again.", values };
  }

  await signIn("credentials", {
    email: parsed.data.email,
    password: parsed.data.password,
    redirectTo: "/owner/onboarding",
  });
}

export async function updateOwnerProfileAction(
  _prevState: ProfileState,
  formData: FormData
): Promise<ProfileState> {
  const session = await requireRole("owner");
  const parsed = parseOwnerProfileFields({ name: formData.get("name") });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    await db
      .update(users)
      .set({ name: parsed.data.name })
      .where(eq(users.id, session.user.id));
  } catch (error) {
    console.error("Profile update failed:", error);
    return { error: "Could not update your profile. Please try again." };
  }

  revalidatePath("/owner/account");
  return { success: "Profile updated." };
}

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = formData.get("email");
  const password = formData.get("password");
  const callbackUrl = formData.get("callbackUrl");

  const emailStr = String(email || "").trim().toLowerCase();
  const passwordStr = String(password || "");
  const user = await db.query.users.findFirst({
    where: (u, { eq }) => eq(u.email, emailStr),
  });
  if (!user) {
    return { error: "Invalid email or password." };
  }

  const passwordMatches = await bcrypt.compare(passwordStr, user.passwordHash);
  if (!passwordMatches) {
    return { error: "Invalid email or password." };
  }

  // Only trust a callbackUrl that's a same-site relative path (never an
  // absolute/protocol-relative URL — that's an open-redirect vector) — see
  // proxy.ts, which sets this when it bounces an unauthenticated visitor
  // off a protected page like /accept-invite.
  const safeCallback =
    typeof callbackUrl === "string" && callbackUrl.startsWith("/") && !callbackUrl.startsWith("//")
      ? callbackUrl
      : null;

  await signIn("credentials", {
    email: emailStr,
    password: passwordStr,
    redirectTo: safeCallback || roleHome(user.role),
  });
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}
