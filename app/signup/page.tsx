"use client";

import Link from "next/link";
import { useActionState } from "react";
import { AuthChrome } from "@/components/AuthChrome";
import { signupAction } from "@/lib/actions/auth";

export default function SignupPage() {
  const [state, action, pending] = useActionState(signupAction, undefined);

  return (
    <AuthChrome
      eyebrow="Homeowner account"
      title="Start your repair record"
      description="Create your owner workspace, then add the first property you want to keep organized."
      footer={
        <>
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-emerald-800 hover:underline"
          >
            Sign in
          </Link>
        </>
      }
    >
      <form
        action={action}
        className="space-y-4"
        aria-label="Create owner account"
      >
        <div>
          <label
            htmlFor="signup-name"
            className="block text-sm font-medium text-gray-800"
          >
            Full name
          </label>
          <input
            id="signup-name"
            name="name"
            type="text"
            autoComplete="name"
            placeholder="Alex Homeowner"
            defaultValue={state?.values?.name}
            aria-invalid={!!state?.fieldErrors?.name?.[0]}
            aria-describedby={
              state?.fieldErrors?.name?.[0] ? "signup-name-error" : undefined
            }
            required
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-950 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
          />
          {state?.fieldErrors?.name?.[0] && (
            <p id="signup-name-error" className="mt-1 text-xs text-red-700">
              {state.fieldErrors.name[0]}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="signup-email"
            className="block text-sm font-medium text-gray-800"
          >
            Email
          </label>
          <input
            id="signup-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            defaultValue={state?.values?.email}
            aria-invalid={!!state?.fieldErrors?.email?.[0]}
            aria-describedby={
              state?.fieldErrors?.email?.[0] ? "signup-email-error" : undefined
            }
            required
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-950 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
          />
          {state?.fieldErrors?.email?.[0] && (
            <p id="signup-email-error" className="mt-1 text-xs text-red-700">
              {state.fieldErrors.email[0]}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="signup-password"
            className="block text-sm font-medium text-gray-800"
          >
            Password
          </label>
          <input
            id="signup-password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            minLength={8}
            aria-invalid={!!state?.fieldErrors?.password?.[0]}
            aria-describedby={
              state?.fieldErrors?.password?.[0]
                ? "signup-password-error"
                : "signup-password-help"
            }
            required
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-950 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
          />
          <p id="signup-password-help" className="mt-1 text-xs text-gray-500">
            Use at least 8 characters with one letter and one number.
          </p>
          {state?.fieldErrors?.password?.[0] && (
            <p id="signup-password-error" className="mt-1 text-xs text-red-700">
              {state.fieldErrors.password[0]}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-gray-950 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Creating account..." : "Create owner account"}
        </button>
      </form>

      {state?.error && (
        <p className="mt-3 text-sm text-red-700" role="alert">
          {state.error}
        </p>
      )}

      <p className="mt-4 rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-xs leading-5 text-emerald-950">
        Owner accounts are for managing your own home or rental records. Vendors
        and helpers join through request-specific invites so sharing stays
        scoped.
      </p>
    </AuthChrome>
  );
}
