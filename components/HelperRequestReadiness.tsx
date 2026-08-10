"use client";

import type { HelperRequestCardState } from "@/lib/helper-workspace";

const toneClasses: Record<HelperRequestCardState["tone"], string> = {
  attention: "border-blue-200 bg-blue-50 text-blue-950",
  progress: "border-amber-200 bg-amber-50 text-amber-950",
  ready: "border-emerald-200 bg-emerald-50 text-emerald-950",
};

const actionClasses: Record<HelperRequestCardState["tone"], string> = {
  attention: "bg-blue-800 hover:bg-blue-900",
  progress: "bg-amber-800 hover:bg-amber-900",
  ready: "bg-emerald-800 hover:bg-emerald-900",
};

export function HelperRequestReadiness({
  state,
  onAction,
}: {
  state: HelperRequestCardState;
  onAction?: () => void;
}) {
  const actionClassesValue = `mt-3 inline-flex items-center justify-center rounded px-3 py-2 text-sm font-medium text-white sm:mt-0 ${actionClasses[state.tone]}`;

  return (
    <div
      className={`mt-4 rounded-lg border p-3 sm:flex sm:items-center sm:justify-between sm:gap-4 ${toneClasses[state.tone]}`}
    >
      <div>
        <p className="text-sm font-semibold">{state.label}</p>
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
