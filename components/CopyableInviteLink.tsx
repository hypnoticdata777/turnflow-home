"use client";

import { useState } from "react";

export function CopyableInviteLink({ inviteLink }: { inviteLink: string }) {
  const [copyStatus, setCopyStatus] = useState("");

  async function copyInviteLink() {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopyStatus("Copied.");
    } catch {
      setCopyStatus("Copy failed. Select the link manually.");
    }
  }

  return (
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
  );
}
