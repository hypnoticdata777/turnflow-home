"use client";

import { useActionState, useState } from "react";
import { cancelInviteAction, resendInviteAction } from "@/lib/actions/invites";

export function PendingInviteControls({ inviteId }: { inviteId: string }) {
  const [copyStatus, setCopyStatus] = useState("");
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

  async function copyInviteLink() {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopyStatus("Copied.");
    } catch {
      setCopyStatus("Copy failed. Select the link manually.");
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <form action={resendAction}>
          <input type="hidden" name="inviteId" value={inviteId} />
          <button
            type="submit"
            disabled={pending}
            className="rounded border border-blue-300 bg-white px-3 py-1 text-xs font-medium text-blue-800 disabled:opacity-50"
          >
            {resendPending ? "Resending..." : "Resend"}
          </button>
        </form>
        <form action={cancelAction}>
          <input type="hidden" name="inviteId" value={inviteId} />
          <button
            type="submit"
            disabled={pending}
            className="rounded border border-red-200 bg-white px-3 py-1 text-xs font-medium text-red-700 disabled:opacity-50"
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
        <div className="max-w-xs rounded border border-gray-200 bg-gray-50 p-2">
          <label className="block text-xs font-medium text-gray-600">Invite link</label>
          <input
            readOnly
            value={inviteLink}
            className="mt-1 w-full rounded border border-gray-200 bg-white px-2 py-1 text-xs"
            onFocus={(event) => event.currentTarget.select()}
          />
          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={copyInviteLink}
              className="rounded border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-700"
            >
              Copy link
            </button>
            {copyStatus && <p className="text-xs text-gray-600">{copyStatus}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
