import { redirect } from "next/navigation";

// proxy.ts already redirects every visitor to /login (or their role home,
// if already signed in) before this ever renders — this is just a
// defensive fallback in case proxy is ever bypassed.
export default function RootPage() {
  redirect("/login");
}
