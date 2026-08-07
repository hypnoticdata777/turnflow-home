"use client";

import { Suspense, useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
    <div className="min-h-screen grid place-items-center bg-gray-50">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold">TurnFlow Home</h1>
          <p className="text-gray-500">Sign in to continue</p>
        </div>

        <form action={action} className="space-y-4">
          <input type="hidden" name="callbackUrl" value={callbackUrl} />
          <input
            name="email"
            type="email"
            placeholder="Email"
            required
            className="w-full border border-gray-200 rounded-lg px-3 py-2"
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            required
            className="w-full border border-gray-200 rounded-lg px-3 py-2"
          />
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-xl py-2 text-white bg-black disabled:opacity-50"
          >
            {pending ? "Signing in…" : "Sign in"}
          </button>
        </form>

        {state?.error && (
          <p className="text-red-600 text-sm mt-3 text-center">{state.error}</p>
        )}

        <p className="mt-5 text-center text-sm text-gray-600">
          New to TurnFlow Home?{" "}
          <Link href="/signup" className="font-medium text-blue-700 hover:underline">
            Create an owner account
          </Link>
        </p>
      </div>
    </div>
  );
}
