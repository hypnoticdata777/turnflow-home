"use server";

import { redirect } from "next/navigation";
import { signIn, signOut } from "@/lib/auth/config";
import { roleHome } from "@/lib/auth/dal";
import { db } from "@/lib/db";

export type LoginState = { error?: string } | undefined;

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
