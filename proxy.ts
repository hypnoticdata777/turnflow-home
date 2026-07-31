// Optimistic, cookie-only auth check — the direct replacement for the old
// Firebase build's guard-owner.js/vendor.guard.js/collaborator.guard.js.
// This is a fast-path redirect only; every real authorization check still
// happens in the DAL (lib/auth/dal.ts) and inside each Server Action, per
// Next.js's own guidance (a proxy matcher exclusion can silently skip
// Server Function calls too — see node_modules/next/dist/docs/.../proxy.md).
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { roleHome, type Role } from "@/lib/auth/dal";

export default auth((req) => {
  const { nextUrl } = req;
  const session = req.auth;
  const isLoggedIn = !!session?.user;
  const role = session?.user?.role;

  const isPublicRoute =
    nextUrl.pathname === "/login" || nextUrl.pathname.startsWith("/accept-invite");

  if (!isLoggedIn && !isPublicRoute) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname + nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  if (isLoggedIn && role) {
    if (nextUrl.pathname === "/login") {
      return NextResponse.redirect(new URL(roleHome(role), nextUrl));
    }

    const roleForPath: Role | null = nextUrl.pathname.startsWith("/owner")
      ? "owner"
      : nextUrl.pathname.startsWith("/vendor")
        ? "vendor"
        : nextUrl.pathname.startsWith("/collaborator")
          ? "collaborator"
          : null;

    if (roleForPath && roleForPath !== role) {
      return NextResponse.redirect(new URL(roleHome(role), nextUrl));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
