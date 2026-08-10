"use client";

import { useState } from "react";
import {
  getBackupDataAction,
  restoreBackupAction,
  type BackupProperty,
  type BackupRequest,
} from "@/lib/actions/backup";
import { costForRequest, costLabelForRequest, toCsvRow } from "@/lib/utils";

function downloadBlob(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function BackupManager() {
  const [backingUp, setBackingUp] = useState(false);
  const [exportingCsv, setExportingCsv] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<{ text: string; isError: boolean } | null>(null);

  async function handleBackup() {
    setBackingUp(true);
    setStatus(null);
    try {
      const { properties, requests } = await getBackupDataAction();
      const exportData = {
        exportedAt: new Date().toISOString(),
        properties,
        requests,
      };
      downloadBlob(
        JSON.stringify(exportData, null, 2),
        `turnflow_home_backup_${new Date().toISOString().slice(0, 10)}.json`,
        "application/json"
      );
      setStatus({
        text: `Exported ${properties.length} propert${
          properties.length === 1 ? "y" : "ies"
        } and ${requests.length} request(s).`,
        isError: false,
      });
    } catch (err) {
      console.error("Backup failed:", err);
      setStatus({
        text: "Backup failed. Check your connection and try again.",
        isError: true,
      });
    } finally {
      setBackingUp(false);
    }
  }

  async function handleCsvExport() {
    setExportingCsv(true);
    setStatus(null);
    try {
      const { properties, requests } = await getBackupDataAction();
      const propertyById = Object.fromEntries(properties.map((p) => [p.id, p]));
      const propertyLabel = (id: string | null | undefined) => {
        const p = id ? propertyById[id] : undefined;
        if (!p) return "";
        return p.nickname ? `${p.nickname} - ${p.address}` : p.address || "";
      };

      const header = toCsvRow([
        "Property",
        "Title",
        "Category",
        "Urgency",
        "Status",
        "Estimated Cost",
        "Quoted Cost",
        "Final Cost",
        "Current Cost",
        "Cost Basis",
        "Created",
      ]);
      const rows = requests.map((r) =>
        toCsvRow([
          propertyLabel(r.propertyId),
          r.title || "",
          r.category || "",
          r.urgency || "",
          r.status || "Draft",
          r.estimatedCost ?? "",
          r.quotedCost ?? "",
          r.finalCost ?? "",
          costForRequest(r).toFixed(2),
          costLabelForRequest(r),
          r.createdAt ? new Date(r.createdAt).toISOString().slice(0, 10) : "",
        ])
      );

      downloadBlob(
        [header, ...rows].join("\r\n"),
        `turnflow_home_history_${new Date().toISOString().slice(0, 10)}.csv`,
        "text/csv"
      );
      setStatus({ text: `Exported ${requests.length} request(s) as CSV.`, isError: false });
    } catch (err) {
      console.error("CSV export failed:", err);
      setStatus({
        text: "CSV export failed. Check your connection and try again.",
        isError: true,
      });
    } finally {
      setExportingCsv(false);
    }
  }

  async function handleRestore() {
    if (!file) {
      setStatus({ text: "Please select a JSON backup file first.", isError: true });
      return;
    }

    setRestoring(true);
    setStatus(null);
    try {
      const text = await file.text();
      let data: { properties?: BackupProperty[]; requests?: BackupRequest[] };
      try {
        data = JSON.parse(text);
      } catch {
        setStatus({ text: "Invalid JSON file.", isError: true });
        return;
      }

      if (!data || !Array.isArray(data.properties) || !Array.isArray(data.requests)) {
        setStatus({
          text: 'Backup file must contain "properties" and "requests" arrays.',
          isError: true,
        });
        return;
      }

      const result = await restoreBackupAction({
        properties: data.properties,
        requests: data.requests,
      });
      setFile(null);
      if (result.errors.length === 0) {
        setStatus({
          text: `Restored ${result.importedProperties} propert${
            result.importedProperties === 1 ? "y" : "ies"
          } and ${result.importedRequests} request(s).`,
          isError: false,
        });
      } else {
        setStatus({
          text: `Restored ${result.importedProperties} propert(ies) and ${
            result.importedRequests
          } request(s). Failed: ${result.errors.join(", ")}`,
          isError: true,
        });
      }
    } catch (err) {
      console.error("Restore failed:", err);
      setStatus({
        text: "Restore failed. Check your connection and try again.",
        isError: true,
      });
    } finally {
      setRestoring(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg rounded-xl bg-white p-6 shadow">
      <h1 className="mb-2 text-2xl font-bold">Backup &amp; restore</h1>
      <p className="mb-6 text-sm text-gray-500">
        Exports and imports your properties and maintenance requests, so
        you&apos;re never locked into this tool.
      </p>

      <button
        onClick={handleBackup}
        disabled={backingUp}
        className="mb-2 w-full rounded bg-blue-500 px-4 py-2 text-white disabled:opacity-50"
      >
        {backingUp ? "Preparing..." : "Download backup (JSON)"}
      </button>
      <button
        onClick={handleCsvExport}
        disabled={exportingCsv}
        className="mb-6 w-full rounded bg-blue-400 px-4 py-2 text-white disabled:opacity-50"
      >
        {exportingCsv ? "Preparing..." : "Download history (CSV)"}
      </button>

      <h2 className="mb-2 text-xl font-semibold">Restore from backup</h2>
      <p className="mb-3 text-sm text-gray-500">
        Importing will <strong>add</strong> the properties and requests from the
        file as new entries, owned by whoever is currently signed in; existing
        records are not overwritten.
      </p>
      <input
        type="file"
        accept=".json"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        className="mb-4 w-full"
      />
      <button
        onClick={handleRestore}
        disabled={restoring}
        className="w-full rounded bg-green-600 px-4 py-2 text-white disabled:opacity-50"
      >
        {restoring ? "Restoring..." : "Restore backup"}
      </button>

      {status && (
        <p className={`mt-4 ${status.isError ? "text-red-500" : "text-gray-700"}`}>
          {status.text}
        </p>
      )}
    </div>
  );
}
