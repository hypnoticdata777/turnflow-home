"use client";

import { useTransition } from "react";
import { deletePropertyAction } from "@/lib/actions/properties";

export function DeletePropertyButton({ propertyId }: { propertyId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      className="rounded-lg bg-red-600 px-3 py-1 text-sm text-white transition-colors duration-150 hover:bg-red-800 disabled:opacity-50"
      disabled={isPending}
      onClick={() => {
        if (
          !confirm(
            "Delete this property? This also permanently deletes every request and photo tied to it. This cannot be undone."
          )
        ) {
          return;
        }
        startTransition(() => deletePropertyAction(propertyId));
      }}
    >
      {isPending ? "Deleting..." : "Delete"}
    </button>
  );
}
