"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { uploadFileToBlob } from "@/lib/blob-upload-client";
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
    setFormStatus("Uploading...");
    try {
      const pathname = vaultDocumentPath(propertyId, userId, file.name);
      const blob = await uploadFileToBlob(pathname, file);

      const formData = new FormData();
      formData.set("name", name.trim());
      formData.set("category", category);
      formData.set("blobPath", blob.pathname);

      setFormStatus("Saving...");
      const result = await createVaultDocumentAction(propertyId, formData);
      if ("error" in result) {
        setFormStatus(result.error);
        return;
      }

      setName("");
      setCategory(VAULT_DOCUMENT_CATEGORIES[0]);
      setFile(null);
      setFormStatus("Document added.");
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
    <div className="min-w-0">
      <div className="mb-6 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold">Add a document</h2>
        <form onSubmit={handleSubmit} className="grid gap-3 md:grid-cols-4 md:items-end">
          <div className="min-w-0">
            <label className="mb-1 block text-xs font-medium">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Water heater warranty"
              className="w-full rounded border p-2 text-sm"
            />
          </div>
          <div className="min-w-0">
            <label className="mb-1 block text-xs font-medium">Category</label>
            <select
              value={category}
              onChange={(e) =>
                setCategory(e.target.value as (typeof VAULT_DOCUMENT_CATEGORIES)[number])
              }
              className="w-full rounded border bg-white p-2 text-sm"
            >
              {VAULT_DOCUMENT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-0">
            <label className="mb-1 block text-xs font-medium">File</label>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block w-full min-w-0 text-sm text-gray-700 file:mr-3 file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-gray-800"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition duration-150 hover:-translate-y-0.5 hover:bg-blue-800 hover:shadow-md active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Uploading..." : "Add document"}
          </button>
        </form>
        {formStatus && <p className="mt-2 text-sm text-gray-600">{formStatus}</p>}
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold">Documents</h2>
        {documents.length === 0 ? (
          <p className="rounded border border-dashed border-gray-300 p-4 text-sm text-gray-600">
            No documents yet. Add the warranty, receipt, manual, or inspection
            report you would want to find later.
          </p>
        ) : (
          <div className="space-y-2">
            {documents.map((d) => (
              <div
                key={d.id}
                className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="break-words">
                    <strong>{d.name}</strong>{" "}
                    <span className="text-xs text-gray-500">({d.category})</span>
                  </p>
                  <p className="text-sm">
                    <a
                      href={d.url}
                      target="_blank"
                      rel="noopener"
                      className="text-blue-600 underline"
                    >
                      View / download
                    </a>
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(d.id)}
                  disabled={deletingId === d.id}
                  className="rounded-lg bg-rose-600 px-3 py-1 text-sm font-medium text-white transition-transform duration-150 hover:scale-105 hover:bg-rose-700 active:scale-95 disabled:opacity-50"
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
