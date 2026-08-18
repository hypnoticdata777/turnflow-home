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
      <div>
        <label htmlFor="property-address" className="mb-1 block text-sm font-medium">
          Address
        </label>
        <input
          id="property-address"
          name="address"
          type="text"
          placeholder="123 Main St"
          required
          className="w-full rounded border p-2"
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="property-unit" className="mb-1 block text-sm font-medium">
            Unit
          </label>
          <input
            id="property-unit"
            name="unit"
            type="text"
            placeholder="Optional"
            className="w-full rounded border p-2"
          />
        </div>
        <div>
          <label htmlFor="property-nickname" className="mb-1 block text-sm font-medium">
            Nickname
          </label>
          <input
            id="property-nickname"
            name="nickname"
            type="text"
            placeholder="e.g. The rental"
            className="w-full rounded border p-2"
          />
        </div>
      </div>
      {state?.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-green-600 px-4 py-2 text-white transition-transform duration-150 hover:scale-105 hover:bg-green-800 active:scale-95 disabled:opacity-50"
      >
        {pending ? "Saving..." : "Add property"}
      </button>
    </form>
  );
}
