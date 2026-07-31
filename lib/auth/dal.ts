// Data Access Layer — the direct replacement for the old Firebase build's
// requireRole()/requireAnyRole()/roleHome() in auth.js. Every owner-only
// page/Server Action calls requireRole("owner") (etc.) at the top; proxy.ts
// (optimistic, cookie-only) is the first line of defense, this is the real one.
import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "./config";

export type Role = "owner" | "vendor" | "collaborator";

export function roleHome(role: Role): string {
  switch (role) {
    case "owner":
      return "/owner/dashboard";
    case "vendor":
      return "/vendor";
    case "collaborator":
      return "/collaborator";
  }
}

export const getSession = cache(async () => auth());

export async function requireRole(role: Role) {
  const session = await getSession();
  if (!session?.user) redirect("/login");
  if (session.user.role !== role) redirect(roleHome(session.user.role));
  return session;
}

export async function requireAnyRole(roles: Role[]) {
  const session = await getSession();
  if (!session?.user) redirect("/login");
  if (!roles.includes(session.user.role)) redirect(roleHome(session.user.role));
  return session;
}
