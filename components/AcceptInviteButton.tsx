"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { acceptInviteAction } from "@/lib/actions/invites";

export function AcceptInviteButton({ inviteId, redirectTo }: { inviteId: string; redirectTo: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <button
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            const result = await acceptInviteAction(inviteId);
            if ("error" in result) {
              setError(result.error);
              return;
            }
            router.push(redirectTo);
          })
        }
        className="w-full bg-black text-white rounded-xl py-2 disabled:opacity-50"
      >
        {isPending ? "Accepting…" : "Accept Invite"}
      </button>
      {error && <p className="text-red-600 text-sm mt-2 text-center">{error}</p>}
    </div>
  );
}
