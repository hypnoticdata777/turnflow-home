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
    return `User (${authorId.slice(0, 6)}…)`;
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
      <p className="text-sm font-medium mb-1">Updates</p>
      <div className="mb-2">
        {sorted.length === 0 ? (
          <p className="text-sm text-gray-500">No updates yet.</p>
        ) : (
          sorted.map((c) => (
            <p key={c.id} className="text-sm border-b pb-1 mb-1">
              <span className="text-gray-500">
                {authorLabel(c.authorId)} · {new Date(c.createdAt).toLocaleString()}
              </span>{" "}
              — {c.text}
            </p>
          ))
        )}
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2 mt-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Post an update…"
          className="border rounded p-1 flex-1 text-sm"
        />
        <button
          type="submit"
          disabled={submitting}
          className="bg-blue-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
        >
          Post
        </button>
      </form>
    </div>
  );
}
