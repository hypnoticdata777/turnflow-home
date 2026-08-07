"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signupAction } from "@/lib/actions/auth";

export default function SignupPage() {
  const [state, action, pending] = useActionState(signupAction, undefined);

  return (
    <div className="min-h-screen grid place-items-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow">
        <div className="mb-6 text-center">
          <p className="text-sm font-semibold text-blue-700">TurnFlow Home</p>
          <h1 className="text-2xl font-bold">Start your repair record</h1>
          <p className="text-gray-500">
            Create an owner account and set up your first property.
          </p>
        </div>

        <form action={action} className="space-y-4">
          <div>
            <input
              name="name"
              type="text"
              placeholder="Full name"
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2"
            />
            {state?.fieldErrors?.name?.[0] && (
              <p className="mt-1 text-xs text-red-600">{state.fieldErrors.name[0]}</p>
            )}
          </div>

          <div>
            <input
              name="email"
              type="email"
              placeholder="Email"
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2"
            />
            {state?.fieldErrors?.email?.[0] && (
              <p className="mt-1 text-xs text-red-600">{state.fieldErrors.email[0]}</p>
            )}
          </div>

          <div>
            <input
              name="password"
              type="password"
              placeholder="Password"
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2"
            />
            {state?.fieldErrors?.password?.[0] && (
              <p className="mt-1 text-xs text-red-600">
                {state.fieldErrors.password[0]}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-xl py-2 text-white bg-black disabled:opacity-50"
          >
            {pending ? "Creating account..." : "Create owner account"}
          </button>
        </form>

        {state?.error && (
          <p className="text-red-600 text-sm mt-3 text-center">{state.error}</p>
        )}

        <p className="mt-5 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-blue-700 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
