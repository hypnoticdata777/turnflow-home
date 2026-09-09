"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { acceptInviteAction } from "@/lib/actions/invites";

export function AcceptInviteButton({
  inviteId,
  redirectTo,
  autoAccept = false,
}: {
  inviteId: string;
  redirectTo: string;
  autoAccept?: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const hasStarted = useRef(false);

  const acceptInvite = useCallback(() => {
    setError(null);
    startTransition(async () => {
      const result = await acceptInviteAction(inviteId);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      router.replace(redirectTo);
    });
  }, [inviteId, redirectTo, router]);

  useEffect(() => {
    if (!autoAccept || hasStarted.current) return;
    hasStarted.current = true;
    acceptInvite();
  }, [acceptInvite, autoAccept]);

  return (
    <div>
      <button
        disabled={isPending}
        onClick={() => {
          hasStarted.current = true;
          acceptInvite();
        }}
        className="min-h-12 w-full rounded-lg bg-gray-950 py-2.5 text-sm font-semibold text-white shadow-sm transition duration-150 hover:-translate-y-0.5 hover:bg-black hover:shadow-md active:translate-y-0 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Opening workspace..." : error ? "Try again" : "Accept invite"}
      </button>
      {error && (
        <p className="mt-2 text-center text-sm text-rose-700" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
