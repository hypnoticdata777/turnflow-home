"use client";

import { useTransition } from "react";
import { deletePropertyAction } from "@/lib/actions/properties";

export function DeletePropertyButton({ propertyId }: { propertyId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      className="bg-red-500 text-white px-3 py-1 rounded disabled:opacity-50"
      disabled={isPending}
      onClick={() => {
        if (
          !confirm(
            "Delete this property? This also permanently deletes every request (and their photos) tied to it. This cannot be undone."
          )
        )
          return;
        startTransition(() => deletePropertyAction(propertyId));
      }}
    >
      {isPending ? "Deleting…" : "Delete"}
    </button>
  );
}
