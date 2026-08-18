"use client";

import { Suspense, useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AuthChrome } from "@/components/AuthChrome";
import { loginAction } from "@/lib/actions/auth";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, undefined);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "";

  return (
    <AuthChrome
      eyebrow="Owner workspace"
      title="Welcome back"
      description="Sign in to review repairs, proof, shared access, and property history."
      footer={
        <>
          New to TurnFlow Home?{" "}
          <Link
            href="/signup"
            className="font-medium text-emerald-800 hover:underline"
          >
            Create an owner account
          </Link>
        </>
      }
    >
      <form action={action} className="space-y-4" aria-label="Sign in">
        <input type="hidden" name="callbackUrl" value={callbackUrl} />

        <div>
          <label
            htmlFor="login-email"
            className="block text-sm font-medium text-gray-800"
          >
            Email
          </label>
          <input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-950 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
          />
        </div>

        <div>
          <label
            htmlFor="login-password"
            className="block text-sm font-medium text-gray-800"
          >
            Password
          </label>
          <input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="Your password"
            required
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-950 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
          />
        </div>

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-gray-950 py-2.5 text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Signing in..." : "Sign in"}
        </button>
      </form>

      {state?.error && (
        <p className="mt-3 text-sm text-red-700" role="alert">
          {state.error}
        </p>
      )}
    </AuthChrome>
  );
}
