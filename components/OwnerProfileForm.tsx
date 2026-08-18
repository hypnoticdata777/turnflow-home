"use client";

import { useActionState } from "react";
import { updateOwnerProfileAction } from "@/lib/actions/auth";

export function OwnerProfileForm({ initialName }: { initialName: string }) {
  const [state, action, pending] = useActionState(updateOwnerProfileAction, undefined);

  return (
    <form action={action} className="mt-4 space-y-3">
      <div>
        <label htmlFor="owner-name" className="block text-sm font-medium text-gray-700">
          Display name
        </label>
        <input
          id="owner-name"
          name="name"
          type="text"
          defaultValue={initialName}
          required
          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
        />
        {state?.fieldErrors?.name?.[0] && (
          <p className="mt-1 text-xs text-red-600">{state.fieldErrors.name[0]}</p>
        )}
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-transform duration-150 hover:scale-105 hover:bg-blue-800 active:scale-95 disabled:opacity-50"
        >
          {pending ? "Saving..." : "Save profile"}
        </button>
        {state?.success && <p className="text-sm text-green-700">{state.success}</p>}
        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      </div>
    </form>
  );
}
