"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import { VAULT_DOCUMENT_CATEGORIES } from "@/lib/utils";
import { createVaultDocumentAction, deleteVaultDocumentAction } from "@/lib/actions/vault";
import { vaultDocumentPath } from "@/lib/blob-paths";

export type VaultDocumentData = {
  id: string;
  name: string;
  category: string;
  url: string;
};

export function VaultManager({
  propertyId,
  documents,
  userId,
}: {
  propertyId: string;
  documents: VaultDocumentData[];
  userId: string;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [category, setCategory] = useState<(typeof VAULT_DOCUMENT_CATEGORIES)[number]>(
    VAULT_DOCUMENT_CATEGORIES[0]
  );
  const [file, setFile] = useState<File | null>(null);
  const [formStatus, setFormStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !file) {
      setFormStatus("Name and a file are required.");
      return;
    }

    setSubmitting(true);
    setFormStatus("Uploading…");
    try {
      const pathname = vaultDocumentPath(propertyId, userId, file.name);
      const blob = await upload(pathname, file, {
        access: "public",
        handleUploadUrl: "/api/blob-upload",
      });

      const formData = new FormData();
      formData.set("name", name.trim());
      formData.set("category", category);
      formData.set("url", blob.url);
      formData.set("blobPath", blob.pathname);

      setFormStatus("Saving…");
      const result = await createVaultDocumentAction(propertyId, formData);
      if ("error" in result) {
        setFormStatus(result.error);
        return;
      }

      setName("");
      setCategory(VAULT_DOCUMENT_CATEGORIES[0]);
      setFile(null);
      setFormStatus("Document added ✓");
      router.refresh();
    } catch (err) {
      console.error("Failed to upload vault document:", err);
      setFormStatus("Failed to upload document. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(documentId: string) {
    if (!confirm("Delete this document? This cannot be undone.")) return;
    setDeletingId(documentId);
    try {
      await deleteVaultDocumentAction(propertyId, documentId);
      router.refresh();
    } catch (err) {
      console.error("Failed to delete vault document:", err);
      alert("Failed to delete document. Please try again.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <div className="bg-white p-4 rounded-xl shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">Add a Document</h2>
        <form onSubmit={handleSubmit} className="grid md:grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-xs font-medium mb-1">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Water heater warranty"
              className="w-full p-2 border rounded text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as (typeof VAULT_DOCUMENT_CATEGORIES)[number])}
              className="w-full p-2 border rounded bg-white text-sm"
            >
              {VAULT_DOCUMENT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">File</label>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm disabled:opacity-50"
          >
            {submitting ? "Uploading…" : "Add Document"}
          </button>
        </form>
        {formStatus && <p className="text-sm text-gray-600 mt-2">{formStatus}</p>}
      </div>

      <div className="bg-white p-4 rounded-xl shadow">
        <h2 className="text-xl font-semibold mb-4">Documents</h2>
        {documents.length === 0 ? (
          <p className="text-gray-500">No documents yet.</p>
        ) : (
          <div className="space-y-2">
            {documents.map((d) => (
              <div key={d.id} className="p-3 border rounded flex justify-between items-center">
                <div>
                  <p>
                    <strong>{d.name}</strong>{" "}
                    <span className="text-xs text-gray-500">({d.category})</span>
                  </p>
                  <p className="text-sm">
                    <a href={d.url} target="_blank" rel="noopener" className="text-blue-600 underline">
                      View / download
                    </a>
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(d.id)}
                  disabled={deletingId === d.id}
                  className="bg-red-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
