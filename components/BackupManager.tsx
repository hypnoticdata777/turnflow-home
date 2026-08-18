"use client";

import { useState } from "react";
import {
  getBackupDataAction,
  restoreBackupAction,
  type BackupBillingRecord,
  type BackupProperty,
  type BackupRequest,
} from "@/lib/actions/backup";
import { backupPreview, backupScopeItems, type BackupPreview } from "@/lib/backup-guidance";
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
  const [preview, setPreview] = useState<BackupPreview | null>(null);
  const [status, setStatus] = useState<{ text: string; isError: boolean } | null>(null);
  const scopeItems = backupScopeItems(preview);

  async function handleBackup() {
    setBackingUp(true);
    setStatus(null);
    try {
      const { properties, requests, billingRecords } = await getBackupDataAction();
      const exportData = {
        exportedAt: new Date().toISOString(),
        properties,
        requests,
        billingRecords,
      };
      downloadBlob(
        JSON.stringify(exportData, null, 2),
        `turnflow_home_backup_${new Date().toISOString().slice(0, 10)}.json`,
        "application/json"
      );
      setStatus({
        text: `Exported ${properties.length} propert${
          properties.length === 1 ? "y" : "ies"
        }, ${requests.length} request(s), and ${billingRecords.length} billing record(s).`,
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
      const { properties, requests, billingRecords } = await getBackupDataAction();
      const propertyById = Object.fromEntries(properties.map((p) => [p.id, p]));
      const billingByRequestId = new Map(
        billingRecords.map((record) => [record.requestId, record])
      );
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
        "Billing Amount",
        "Billing Status",
        "Invoice Reference",
        "Paid Date",
        "Created",
      ]);
      const rows = requests.map((r) => {
        const billingRecord = billingByRequestId.get(r.id);
        return toCsvRow([
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
          billingRecord?.amount ?? "",
          billingRecord?.status ?? "",
          billingRecord?.invoiceReference ?? "",
          billingRecord?.paidAt
            ? new Date(billingRecord.paidAt).toISOString().slice(0, 10)
            : "",
          r.createdAt ? new Date(r.createdAt).toISOString().slice(0, 10) : "",
        ]);
      });

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
      let data: {
        properties?: BackupProperty[];
        requests?: BackupRequest[];
        billingRecords?: BackupBillingRecord[];
      };
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

      const checked = backupPreview(data);
      if (!checked.valid) {
        setPreview(checked);
        setStatus({ text: checked.errors.join(" "), isError: true });
        return;
      }

      const result = await restoreBackupAction({
        properties: data.properties,
        requests: data.requests,
        billingRecords: data.billingRecords,
      });
      setFile(null);
      setPreview(null);
      if (result.errors.length === 0) {
        setStatus({
          text: `Restored ${result.importedProperties} propert${
            result.importedProperties === 1 ? "y" : "ies"
          }, ${result.importedRequests} request(s), and ${
            result.importedBillingRecords
          } billing record(s).`,
          isError: false,
        });
      } else {
        setStatus({
          text: `Restored ${result.importedProperties} propert(ies) and ${
            result.importedRequests
          } request(s), plus ${
            result.importedBillingRecords
          } billing record(s). Failed: ${result.errors.join(", ")}`,
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

  async function handleFileSelect(nextFile: File | undefined) {
    setFile(nextFile ?? null);
    setPreview(null);
    setStatus(null);
    if (!nextFile) return;

    try {
      const text = await nextFile.text();
      const data = JSON.parse(text);
      setPreview(backupPreview(data));
    } catch {
      setPreview({
        valid: false,
        propertyCount: 0,
        requestCount: 0,
        billingRecordCount: 0,
        errors: ["Invalid JSON file."],
        warnings: [],
      });
    }
  }

  return (
    <div className="mx-auto max-w-3xl rounded-xl bg-white p-6 shadow">
      <section className="mb-6">
        <p className="text-sm font-semibold text-blue-700">Owner data portability</p>
        <h1 className="mt-1 text-2xl font-bold">Backup &amp; restore</h1>
        <p className="mt-2 text-sm leading-6 text-gray-600">
          Export your homeowner record whenever you need it. JSON backups are
          meant for restoring into TurnFlow; CSV history is meant for review in
          a spreadsheet.
        </p>
      </section>

      <section className="mb-6 grid gap-3 md:grid-cols-3">
        {scopeItems.map((item) => (
          <article key={item.label} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
            <p className="text-sm font-semibold text-gray-900">{item.label}</p>
            <p className="mt-1 text-2xl font-bold text-gray-950">{item.value}</p>
            <p className="mt-1 text-sm leading-6 text-gray-600">{item.detail}</p>
          </article>
        ))}
      </section>

      <section className="mb-6 rounded-lg border border-gray-200 p-4">
        <div className="mb-4">
          <h2 className="text-xl font-semibold">Export owner record</h2>
          <p className="mt-1 text-sm leading-6 text-gray-600">
            JSON includes properties, requests, cost fields, and billing
            records for restore. CSV gives you a readable maintenance-history
            table for review outside the app.
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <button
            onClick={handleBackup}
            disabled={backingUp}
            className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 transition-transform duration-150 hover:scale-105 active:scale-95 disabled:opacity-50"
          >
            {backingUp ? "Preparing..." : "Download JSON backup"}
          </button>
          <button
            onClick={handleCsvExport}
            disabled={exportingCsv}
            className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-800 hover:border-blue-300 hover:bg-blue-100 transition-transform duration-150 hover:scale-105 active:scale-95 disabled:opacity-50"
          >
            {exportingCsv ? "Preparing..." : "Download CSV history"}
          </button>
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 p-4">
        <h2 className="text-xl font-semibold">Restore from backup</h2>
        <p className="mt-1 text-sm leading-6 text-gray-600">
          Restore adds new copies owned by the currently signed-in homeowner.
          Existing records are not overwritten or deleted.
        </p>
        <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-950">
          Restore is best for recovering or moving data. If you restore the same
          file twice, TurnFlow will create duplicate properties, requests, and
          billing records.
        </p>

        <label className="mt-4 block text-sm font-medium">
          JSON backup file
          <input
            type="file"
            accept=".json,application/json"
            onChange={(e) => handleFileSelect(e.target.files?.[0])}
            className="mt-1 w-full rounded border border-gray-300 p-2 text-sm"
          />
        </label>

        {preview && (
          <div
            className={`mt-4 rounded-lg border p-3 ${
              preview.valid
                ? "border-emerald-200 bg-emerald-50 text-emerald-950"
                : "border-rose-200 bg-rose-50 text-rose-950"
            }`}
          >
            <p className="text-sm font-semibold">
              {preview.valid ? "Backup file looks restorable" : "Backup file needs attention"}
            </p>
            <p className="mt-1 text-sm leading-6">
              {preview.propertyCount} properties, {preview.requestCount} requests, and{" "}
              {preview.billingRecordCount} billing records found.
            </p>
            {preview.errors.length > 0 && (
              <p className="mt-2 text-sm font-medium">{preview.errors.join(" ")}</p>
            )}
            {preview.warnings.length > 0 && (
              <p className="mt-2 text-sm leading-6">{preview.warnings.join(" ")}</p>
            )}
          </div>
        )}

        <button
          onClick={handleRestore}
          disabled={restoring || !file || preview?.valid === false}
          className="mt-4 w-full rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 transition-transform duration-150 hover:scale-105 active:scale-95 disabled:opacity-50"
        >
          {restoring ? "Restoring..." : "Restore as new records"}
        </button>
      </section>

      {status && (
        <p
          className={`mt-4 rounded-lg border p-3 text-sm font-medium ${
            status.isError
              ? "border-rose-200 bg-rose-50 text-rose-800"
              : "border-emerald-200 bg-emerald-50 text-emerald-800"
          }`}
          role="status"
        >
          {status.text}
        </p>
      )}
    </div>
  );
}
