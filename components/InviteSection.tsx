"use client";

import { useId, useState } from "react";
import type { CreateInviteResult } from "@/lib/actions/invites";
import { CopyableInviteLink } from "@/components/CopyableInviteLink";

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
  const emailId = useId();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [hasPendingInvite, setHasPendingInvite] = useState(!!pendingInviteId);

  async function handleInvite() {
    if (!email.trim()) {
      setStatus(`Enter the ${label.toLowerCase()}'s email first.`);
      return;
    }
    setSending(true);
    setStatus(null);
    setInviteLink(null);
    try {
      const result = await createInvite(requestId, email);
      if ("error" in result) {
        setStatus(result.error);
        return;
      }
      let copied = false;
      try {
        await navigator.clipboard.writeText(result.inviteLink);
        copied = true;
      } catch {
        // Clipboard access can be denied; the link is still shown below.
      }
      setInviteLink(result.inviteLink);
      setStatus(
        result.emailSent
          ? `Invite created${copied ? " and copied to clipboard" : ""}.`
          : "Invite created. Email is not configured, so copy this link instead."
      );
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
    <section className="mb-4 rounded-lg border border-gray-200 p-4">
      <h2 className="mb-2 text-xl font-semibold">{label}</h2>
      {assigneeId ? (
        <p className="text-sm text-gray-700">
          A {label.toLowerCase()} is assigned to this request.
        </p>
      ) : (
        <div>
          <p className="mb-3 text-sm text-gray-500">
            Invite a {label.toLowerCase()} by email. They can claim this request
            after signing in with a matching account.
          </p>
          <div className="flex flex-col gap-2 md:flex-row md:items-end">
            <div className="flex-1">
              <label htmlFor={emailId} className="mb-1 block text-sm font-medium">
                {label} email
              </label>
              <input
                id={emailId}
                type="email"
                placeholder={`${label.toLowerCase()}@example.com`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded border p-2 text-sm"
              />
            </div>
            <button
              type="button"
              onClick={handleInvite}
              disabled={sending}
              className="rounded-lg bg-purple-600 px-4 py-2 text-sm text-white whitespace-nowrap transition-transform duration-150 hover:scale-105 hover:bg-purple-800 active:scale-95 disabled:opacity-50"
            >
              {sending ? "Creating..." : "Send invite"}
            </button>
          </div>
          {hasPendingInvite && !status && (
            <p className="mt-2 text-xs text-gray-500">
              An invite is pending for this request.
            </p>
          )}
          {status && <p className="mt-2 break-all text-xs text-gray-600">{status}</p>}
          {inviteLink && (
            <div className="mt-2">
              <CopyableInviteLink inviteLink={inviteLink} />
            </div>
          )}
        </div>
      )}
    </section>
  );
}
