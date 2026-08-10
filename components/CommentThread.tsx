"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCommentAction } from "@/lib/actions/comments";

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
}: {
  requestId: string;
  comments: CommentData[];
  userId: string;
  assignedVendorId?: string | null;
  collaboratorId?: string | null;
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
      <p className="mb-2 text-sm font-medium">Updates</p>
      <div className="mb-3 space-y-2">
        {sorted.length === 0 ? (
          <p className="text-sm text-gray-500">No updates yet.</p>
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
          placeholder="Post an update..."
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
