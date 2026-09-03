"use client";

import type { HelperRequestCardState } from "@/lib/helper-workspace";

const toneClasses: Record<HelperRequestCardState["tone"], string> = {
  attention: "border-blue-200 bg-blue-50 text-blue-950",
  progress: "border-sky-200 bg-sky-50 text-sky-950",
  ready: "border-emerald-200 bg-emerald-50 text-emerald-950",
};

const actionClasses: Record<HelperRequestCardState["tone"], string> = {
  attention: "bg-blue-800 hover:bg-blue-900",
  progress: "bg-sky-800 hover:bg-sky-900",
  ready: "bg-emerald-800 hover:bg-emerald-900",
};

export function HelperRequestReadiness({
  state,
  onAction,
}: {
  state: HelperRequestCardState;
  onAction?: () => void;
}) {
  const actionClassesValue = `mt-3 inline-flex min-h-11 items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition duration-150 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-[0.99] sm:mt-0 ${actionClasses[state.tone]}`;

  return (
    <div
      className={`mt-4 rounded-lg border p-3 transition duration-150 hover:shadow-sm sm:flex sm:items-center sm:justify-between sm:gap-4 ${toneClasses[state.tone]}`}
    >
      <div>
        <p className="text-sm font-bold">{state.label}</p>
        <p className="mt-1 text-sm leading-6">{state.detail}</p>
      </div>
      {onAction ? (
        <button type="button" onClick={onAction} className={actionClassesValue}>
          {state.actionCta}
        </button>
      ) : (
        <a href={state.actionHref} className={actionClassesValue}>
          {state.actionCta}
        </a>
      )}
    </div>
  );
}
