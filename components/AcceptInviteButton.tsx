"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { acceptInviteAction } from "@/lib/actions/invites";

export function AcceptInviteButton({
  inviteId,
  redirectTo,
}: {
  inviteId: string;
  redirectTo: string;
}) {
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
        className="w-full rounded-lg bg-gray-950 py-2.5 text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Accepting..." : "Accept invite"}
      </button>
      {error && (
        <p className="mt-2 text-center text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
