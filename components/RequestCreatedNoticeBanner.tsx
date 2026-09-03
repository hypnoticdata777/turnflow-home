"use client";

import { useEffect, useState } from "react";
import {
  requestDetailPathWithoutCreateParams,
  type RequestCreatedNotice,
} from "@/lib/request-submit";

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="h-4 w-4 shrink-0">
      <path
        fillRule="evenodd"
        d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.8 7.8a1 1 0 0 1-1.4 0l-3.8-3.8a1 1 0 1 1 1.4-1.4l3.1 3.09 7.1-7.09a1 1 0 0 1 1.4 0Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

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

  const isSuccess = notice.tone === "success";

  return (
    <section
      className={`mb-5 rounded-lg border p-4 ${
        isSuccess
          ? "border-emerald-200 bg-emerald-50 text-emerald-950"
          : "border-blue-200 bg-blue-50 text-blue-950"
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-2">
          {isSuccess ? (
            <span className="mt-0.5 text-emerald-600">
              <CheckIcon />
            </span>
          ) : null}
          <div>
            <h2 className="text-lg font-bold">{notice.headline}</h2>
            <p className="mt-1 text-sm leading-6">{notice.detail}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setVisible(false)}
          className="inline-flex min-h-10 items-center justify-center rounded-lg border border-current bg-white/75 px-3 py-1.5 text-sm font-semibold transition-transform duration-150 hover:scale-105 hover:bg-white active:scale-95"
        >
          Dismiss
        </button>
      </div>
    </section>
  );
}
