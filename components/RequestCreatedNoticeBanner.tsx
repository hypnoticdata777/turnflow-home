"use client";

import { useEffect, useState } from "react";
import {
  requestDetailPathWithoutCreateParams,
  type RequestCreatedNotice,
} from "@/lib/request-submit";

export function RequestCreatedNoticeBanner({
  notice,
}: {
  notice: RequestCreatedNotice;
}) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const cleanPath = requestDetailPathWithoutCreateParams(
      window.location.pathname,
      window.location.search,
      window.location.hash
    );
    window.history.replaceState(window.history.state, "", cleanPath);
  }, []);

  if (!visible) return null;

  return (
    <section
      className={`mb-5 rounded-lg border p-4 ${
        notice.tone === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-950"
          : "border-amber-200 bg-amber-50 text-amber-950"
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">{notice.headline}</h2>
          <p className="mt-1 text-sm leading-6">{notice.detail}</p>
        </div>
        <button
          type="button"
          onClick={() => setVisible(false)}
          className="inline-flex items-center justify-center rounded-lg border border-current bg-white/75 px-3 py-1.5 text-sm font-medium transition-transform duration-150 hover:scale-105 hover:bg-white active:scale-95"
        >
          Dismiss
        </button>
      </div>
    </section>
  );
}
