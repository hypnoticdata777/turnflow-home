"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signupFromInviteAction } from "@/lib/actions/invites";

// F4: account creation for an invited vendor or helper. The email is shown
// read-only and is NOT submitted; the server reads it (and the role) from
// the invite itself.
export function InviteSignupForm({
  inviteId,
  email,
  roleLabel,
  loginHref,
}: {
  inviteId: string;
  email: string;
  roleLabel: string;
  loginHref: string;
}) {
  const [state, action, pending] = useActionState(
    signupFromInviteAction.bind(null, inviteId),
    undefined
  );
  const inputClass =
    "mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-950 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100";

  return (
    <div className="mt-5">
      <form action={action} className="space-y-4" noValidate>
        <div>
          <span className="block text-sm font-medium text-gray-800">Email</span>
          <p
            className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-gray-700"
            aria-label="Invited email address"
          >
            {email}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            This is the address the owner invited, so it can&apos;t be changed here.
          </p>
        </div>

        <div>
          <label htmlFor="invite-signup-name" className="block text-sm font-medium text-gray-800">
            Your name or business name
          </label>
          <input
            id="invite-signup-name"
            name="name"
            type="text"
            autoComplete="name"
            defaultValue={state?.name}
            required
            aria-invalid={!!state?.fieldErrors?.name?.[0]}
            aria-describedby={state?.fieldErrors?.name?.[0] ? "invite-signup-name-error" : undefined}
            className={inputClass}
          />
          {state?.fieldErrors?.name?.[0] && (
            <p id="invite-signup-name-error" className="mt-1 text-xs text-red-700">
              {state.fieldErrors.name[0]}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="invite-signup-password" className="block text-sm font-medium text-gray-800">
            Create a password
          </label>
          <input
            id="invite-signup-password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            minLength={8}
            required
            aria-invalid={!!state?.fieldErrors?.password?.[0]}
            aria-describedby={
              state?.fieldErrors?.password?.[0]
                ? "invite-signup-password-error"
                : "invite-signup-password-help"
            }
            className={inputClass}
          />
          <p id="invite-signup-password-help" className="mt-1 text-xs text-gray-500">
            Use at least 8 characters with one letter and one number.
          </p>
          {state?.fieldErrors?.password?.[0] && (
            <p id="invite-signup-password-error" className="mt-1 text-xs text-red-700">
              {state.fieldErrors.password[0]}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={pending}
          className="min-h-12 w-full rounded-lg bg-gray-950 py-2.5 text-sm font-semibold text-white shadow-sm transition duration-150 hover:-translate-y-0.5 hover:bg-black hover:shadow-md active:translate-y-0 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Creating account..." : `Create ${roleLabel} account and accept`}
        </button>
      </form>

      {state?.error && (
        <p className="mt-3 text-sm text-red-700" role="alert">
          {state.error}
        </p>
      )}

      <p className="mt-4 text-center text-sm text-gray-600">
        Already have an account?{" "}
        <Link href={loginHref} className="font-semibold text-emerald-800 hover:underline">
          Log in instead
        </Link>
      </p>

      <p className="mt-4 rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-xs leading-5 text-emerald-950">
        Your account only sees the requests owners share with you, never their whole
        home record.
      </p>
    </div>
  );
}
