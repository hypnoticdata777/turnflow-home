"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { signIn, signOut } from "@/lib/auth/config";
import { roleHome } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

export type LoginState = { error?: string } | undefined;
export type SignupState =
  | {
      error?: string;
      fieldErrors?: {
        name?: string[];
        email?: string[];
        password?: string[];
      };
    }
  | undefined;

const signupSchema = z.object({
  name: z.string().trim().min(2, "Enter your name."),
  email: z.string().trim().toLowerCase().email("Enter a valid email."),
  password: z
    .string()
    .min(8, "Use at least 8 characters.")
    .regex(/[A-Za-z]/, "Use at least one letter.")
    .regex(/[0-9]/, "Use at least one number."),
});

export async function signupAction(
  _prevState: SignupState,
  formData: FormData
): Promise<SignupState> {
  const parsed = signupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const existing = await db.query.users.findFirst({
    where: (u, { eq }) => eq(u.email, parsed.data.email),
  });
  if (existing) {
    return { error: "An account already exists for that email." };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);

  try {
    await db.insert(users).values({
      email: parsed.data.email,
      passwordHash,
      role: "owner",
      name: parsed.data.name,
    });

    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
  } catch (error) {
    console.error("Signup failed:", error);
    return { error: "Could not create that account. Please try again." };
  }

  redirect("/owner/onboarding");
}

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = formData.get("email");
  const password = formData.get("password");
  const callbackUrl = formData.get("callbackUrl");

  try {
    await signIn("credentials", { email, password, redirect: false });
  } catch (error) {
    console.error("Login failed:", error);
    return { error: "Invalid email or password." };
  }

  // Don't re-read the session cookie here to decide where to send the
  // user — signIn()'s Set-Cookie isn't reliably visible to a same-request
  // auth() call yet (observed: login succeeds, cookie gets set, but an
  // immediate auth() call in the same action still returns no session).
  // We already know signIn() didn't throw, so look the role up directly.
  const emailStr = String(email || "").trim().toLowerCase();
  const user = await db.query.users.findFirst({
    where: (u, { eq }) => eq(u.email, emailStr),
  });
  if (!user) {
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
  redirect(safeCallback || roleHome(user.role));
}

export async function logoutAction() {
  await signOut({ redirect: false });
  redirect("/login");
}
