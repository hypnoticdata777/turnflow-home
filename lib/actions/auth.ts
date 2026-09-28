"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { verifyPasswordTimingSafe } from "@/lib/auth/password";
import { isRateLimited, recordAttempt } from "@/lib/auth/rate-limit";
import {
  LOGIN_EMAIL_RULE,
  LOGIN_IP_RULE,
  RATE_LIMITED_MESSAGE,
  SIGNUP_IP_RULE,
  clientIpFromHeaders,
} from "@/lib/auth/rate-limit-policy";
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
import { ensureDefaultWorkspaceForOwner } from "@/lib/workspace";

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

  // P0 (2026-09-28): cap account creation per IP so signup cannot be
  // scripted. Every validated attempt counts, successful or not.
  const ip = clientIpFromHeaders(await headers());
  if (await isRateLimited(SIGNUP_IP_RULE, ip)) {
    return { error: RATE_LIMITED_MESSAGE, values };
  }
  await recordAttempt(SIGNUP_IP_RULE, ip);

  const existing = await db.query.users.findFirst({
    where: (u, { eq }) => eq(u.email, parsed.data.email),
  });
  if (existing) {
    return { error: "An account already exists for that email.", values };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);

  try {
    const [created] = await db
      .insert(users)
      .values({
        email: parsed.data.email,
        passwordHash,
        role: "owner",
        name: parsed.data.name,
      })
      .returning({ id: users.id });
    await ensureDefaultWorkspaceForOwner(created.id);
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

  // P0 (2026-09-28): same limits as the Auth.js authorize() gate, checked
  // here first so the form can show a friendly message.
  const ip = clientIpFromHeaders(await headers());
  if (
    (await isRateLimited(LOGIN_EMAIL_RULE, emailStr)) ||
    (await isRateLimited(LOGIN_IP_RULE, ip))
  ) {
    return { error: RATE_LIMITED_MESSAGE };
  }

  const user = await db.query.users.findFirst({
    where: (u, { eq }) => eq(u.email, emailStr),
  });
  // Always runs one bcrypt compare, so an unknown email takes as long as a
  // wrong password and account existence cannot be timed.
  const passwordMatches = await verifyPasswordTimingSafe(passwordStr, user?.passwordHash);
  if (!user || !passwordMatches) {
    await recordAttempt(LOGIN_EMAIL_RULE, emailStr);
    await recordAttempt(LOGIN_IP_RULE, ip);
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
