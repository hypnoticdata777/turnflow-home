"use client";

import { useState } from "react";
import type { CreateInviteResult } from "@/lib/actions/invites";

export function InviteSection({
  requestId,
  label,
  assigneeId,
  pendingInviteId,
  createInvite,
}: {
  requestId: string;
  label: string;
  assigneeId: string | null;
  pendingInviteId: string | null;
  createInvite: (requestId: string, email: string) => Promise<CreateInviteResult>;
}) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [hasPendingInvite, setHasPendingInvite] = useState(!!pendingInviteId);

  async function handleInvite() {
    if (!email.trim()) {
      setStatus(`Enter the ${label.toLowerCase()}'s email first.`);
      return;
    }
    setSending(true);
    setStatus(null);
    try {
      const result = await createInvite(requestId, email);
      if ("error" in result) {
        setStatus(result.error);
        return;
      }
      const link = `${window.location.origin}/accept-invite?invite=${result.inviteId}`;
      let copied = false;
      try {
        await navigator.clipboard.writeText(link);
        copied = true;
      } catch {
        // clipboard access can be denied — the link is still shown below
      }
      setStatus(`Invite link${copied ? " (copied to clipboard)" : ""}: ${link} — send it yourself if the email doesn't land.`);
      setHasPendingInvite(true);
      setEmail("");
    } catch (err) {
      console.error(`Failed to create ${label.toLowerCase()} invite:`, err);
      setStatus("Failed to create invite. Please try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mb-4">
      <h2 className="text-xl font-semibold mb-3">{label}</h2>
      {assigneeId ? (
        <p className="text-sm text-gray-700">{`✅ A ${label.toLowerCase()} is assigned to this request.`}</p>
      ) : (
        <div>
          <p className="text-sm text-gray-500 mb-2">
            {`Invite a ${label.toLowerCase()} by email — they'll claim this request themselves once signed in with a matching account.`}
          </p>
          <div className="flex flex-col md:flex-row gap-2">
            <input
              type="email"
              placeholder={`${label.toLowerCase()}@example.com`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 p-2 border rounded text-sm"
            />
            <button
              onClick={handleInvite}
              disabled={sending}
              className="bg-purple-600 text-white px-4 py-2 rounded text-sm whitespace-nowrap disabled:opacity-50"
            >
              {sending ? "Creating…" : "Send Invite"}
            </button>
          </div>
          {hasPendingInvite && !status && (
            <p className="text-xs text-gray-500 mt-1">An invite is pending for this request.</p>
          )}
          {status && <p className="text-xs text-gray-600 mt-1 break-all">{status}</p>}
        </div>
      )}
    </div>
  );
}
