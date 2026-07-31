"use client";

import { useState } from "react";
import { getPropertyRequestsForExportAction } from "@/lib/actions/properties";
import { downloadPropertyHistoryPdf } from "@/lib/pdf/propertyHistory";

export function ExportHistoryButton({
  propertyId,
  propertyLabel,
}: {
  propertyId: string;
  propertyLabel: string;
}) {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      const requests = await getPropertyRequestsForExportAction(propertyId);
      downloadPropertyHistoryPdf({ propertyId, propertyLabel, requests });
    } catch (err) {
      console.error("Error exporting property history:", err);
      alert("Failed to export property history. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="bg-blue-500 text-white px-3 py-1 rounded disabled:opacity-50"
    >
      {loading ? "Preparing…" : "Export History"}
    </button>
  );
}
