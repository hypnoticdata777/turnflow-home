"use client";

import { useActionState, useRef } from "react";
import { createProperty } from "@/lib/actions/properties";

export function PropertyForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState(
    async (_prev: { error?: string } | undefined, formData: FormData) => {
      const result = await createProperty(_prev, formData);
      if (!result?.error) formRef.current?.reset();
      return result;
    },
    undefined
  );

  return (
    <form ref={formRef} action={action} className="space-y-3">
      <input
        name="address"
        type="text"
        placeholder="Address"
        required
        className="w-full p-2 border rounded"
      />
      <input
        name="unit"
        type="text"
        placeholder="Unit (optional)"
        className="w-full p-2 border rounded"
      />
      <input
        name="nickname"
        type="text"
        placeholder='Nickname (optional, e.g. "The rental")'
        className="w-full p-2 border rounded"
      />
      {state?.error && <p className="text-red-500 text-sm">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {pending ? "Saving…" : "Add Property"}
      </button>
    </form>
  );
}
