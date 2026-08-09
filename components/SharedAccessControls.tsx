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
        className="rounded border border-red-200 bg-white px-3 py-1 text-xs font-medium text-red-700 disabled:opacity-50"
      >
        {pending ? "Removing..." : "Remove access"}
      </button>
      {state?.success && <p className="text-xs text-green-700">{state.success}</p>}
      {state?.error && <p className="text-xs text-red-600">{state.error}</p>}
    </form>
  );
}
