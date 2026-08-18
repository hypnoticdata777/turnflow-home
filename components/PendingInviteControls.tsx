"use client";

import { useActionState } from "react";
import { cancelInviteAction, resendInviteAction } from "@/lib/actions/invites";
import { CopyableInviteLink } from "@/components/CopyableInviteLink";

export function PendingInviteControls({ inviteId }: { inviteId: string }) {
  const [cancelState, cancelAction, cancelPending] = useActionState(
    cancelInviteAction,
    undefined
  );
  const [resendState, resendAction, resendPending] = useActionState(
    resendInviteAction,
    undefined
  );
  const pending = cancelPending || resendPending;
  const message = cancelState?.error || cancelState?.success || resendState?.error || resendState?.success;
  const isError = Boolean(cancelState?.error || resendState?.error);
  const inviteLink = resendState?.inviteLink;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <form action={resendAction}>
          <input type="hidden" name="inviteId" value={inviteId} />
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg border border-blue-300 bg-white px-3 py-1 text-xs font-medium text-blue-800 transition-transform duration-150 hover:scale-105 hover:border-blue-400 hover:bg-blue-50 active:scale-95 disabled:opacity-50"
          >
            {resendPending ? "Resending..." : "Resend"}
          </button>
        </form>
        <form action={cancelAction}>
          <input type="hidden" name="inviteId" value={inviteId} />
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg border border-red-200 bg-white px-3 py-1 text-xs font-medium text-red-700 transition-transform duration-150 hover:scale-105 hover:border-red-300 hover:bg-red-50 active:scale-95 disabled:opacity-50"
          >
            {cancelPending ? "Canceling..." : "Cancel"}
          </button>
        </form>
      </div>
      {message && (
        <p className={`text-xs ${isError ? "text-red-600" : "text-green-700"}`}>
          {message}
        </p>
      )}
      {inviteLink && (
        <CopyableInviteLink inviteLink={inviteLink} />
      )}
    </div>
  );
}
