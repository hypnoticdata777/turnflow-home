"use client";

import { useActionState } from "react";
import { removeSharedAccessAction } from "@/lib/actions/invites";

export function SharedAccessControls({
  requestId,
  role,
}: {
  requestId: string;
  role: "vendor" | "collaborator";
}) {
  const [state, action, pending] = useActionState(removeSharedAccessAction, undefined);

  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="requestId" value={requestId} />
      <input type="hidden" name="role" value={role} />
      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-10 items-center justify-center rounded-lg border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-700 shadow-sm transition duration-150 hover:-translate-y-0.5 hover:border-rose-300 hover:bg-rose-50 hover:shadow-md active:translate-y-0 disabled:opacity-50"
      >
        {pending ? "Removing..." : "Remove access"}
      </button>
      {state?.success && <p className="text-xs font-medium text-emerald-700">{state.success}</p>}
      {state?.error && (
        <p className="text-xs font-medium text-rose-600" role="alert">
          {state.error}
        </p>
      )}
    </form>
  );
}
