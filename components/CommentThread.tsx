"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCommentAction } from "@/lib/actions/comments";
import type { CommentThreadGuidance } from "@/lib/comment-guidance";

export type CommentData = {
  id: string;
  authorId: string;
  text: string;
  createdAt: string | Date;
};

export function CommentThread({
  requestId,
  comments,
  userId,
  assignedVendorId,
  collaboratorId,
  guidance,
}: {
  requestId: string;
  comments: CommentData[];
  userId: string;
  assignedVendorId?: string | null;
  collaboratorId?: string | null;
  guidance?: CommentThreadGuidance;
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function authorLabel(authorId: string) {
    if (authorId === userId) return "You";
    if (assignedVendorId && authorId === assignedVendorId) return "Assigned vendor";
    if (collaboratorId && authorId === collaboratorId) return "Collaborator";
    return `User (${authorId.slice(0, 6)}...)`;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      await createCommentAction(requestId, text.trim());
      setText("");
      router.refresh();
    } catch (err) {
      console.error("Error posting comment:", err);
      alert("Failed to post update. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const sorted = [...comments].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  return (
    <div>
      {guidance && (
        <div className="mb-3 rounded-lg border border-blue-200 bg-blue-50 p-3 text-blue-950">
          <p className="text-xs font-semibold uppercase">{guidance.eyebrow}</p>
          <p className="mt-1 text-sm font-semibold">{guidance.title}</p>
          <p className="mt-1 text-sm leading-6">{guidance.detail}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {guidance.suggestions.map((suggestion, index) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => setText(suggestion)}
                className="max-w-full rounded border border-blue-200 bg-white px-3 py-2 text-left text-xs font-medium leading-5 text-blue-900 hover:bg-blue-100"
              >
                Draft {index + 1}: {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      <p className="mb-2 text-sm font-medium">Updates</p>
      <div className="mb-3 space-y-2">
        {sorted.length === 0 ? (
          <p className="text-sm text-gray-500">
            {guidance?.emptyState ?? "No updates yet."}
          </p>
        ) : (
          sorted.map((c) => (
            <article key={c.id} className="rounded border border-gray-100 bg-gray-50 p-2">
              <p className="text-xs text-gray-500">
                {authorLabel(c.authorId)} - {new Date(c.createdAt).toLocaleString()}
              </p>
              <p className="text-sm text-gray-800">{c.text}</p>
            </article>
          ))
        )}
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={guidance?.placeholder ?? "Post an update..."}
          className="flex-1 rounded border p-2 text-sm"
        />
        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-blue-600 px-3 py-2 text-sm text-white disabled:opacity-50"
        >
          {submitting ? "Posting..." : "Post"}
        </button>
      </form>
    </div>
  );
}
