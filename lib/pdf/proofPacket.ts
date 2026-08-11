"use client";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { costForRequest, costLabelForRequest, type CostFields } from "@/lib/utils";
import type { LogEntryData } from "@/components/DecisionLog";

const LOG_ACTION_TEXT: Record<string, (d: Record<string, unknown>) => string> = {
  status_changed: (d) => `Status changed${d.from ? ` from ${d.from}` : ""} to ${d.to}.`,
  completion_waived: (d) => `Marked Complete without full proof on record — waived: "${d.reason}"`,
  quote_approved: (d) => `Approved quote from ${d.vendorName || "a vendor"} ($${Number(d.amount || 0).toFixed(2)}).`,
  quote_declined: (d) => `Declined quote from ${d.vendorName || "a vendor"} ($${Number(d.amount || 0).toFixed(2)}).`,
  vendor_bid_submitted: (d) => `Vendor bid submitted by ${d.vendorName || "assigned vendor"} ($${Number(d.amount || 0).toFixed(2)}).`,
  vendor_bid_updated: (d) => `Vendor bid updated by ${d.vendorName || "assigned vendor"} ($${Number(d.amount || 0).toFixed(2)}).`,
};

function lastAutoTableFinalY(doc: jsPDF): number {
  return (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
}

export type ProofPacketRequest = CostFields & {
  id: string;
  title: string;
  category: string;
  urgency: string;
  status: string;
  location: string | null;
  notes: string | null;
};

export function downloadProofPacketPdf({
  request,
  propertyLabel,
  quotes,
  photos,
  log,
  actorLabel,
}: {
  request: ProofPacketRequest;
  propertyLabel: string;
  quotes: { vendorName: string; amount: string; status: string; notes: string | null; availabilityWindow?: string | null }[];
  photos: { type: string }[];
  log: LogEntryData[];
  actorLabel: (actorId: string) => string;
}) {
  const doc = new jsPDF();
  let y = 16;

  doc.setFontSize(16);
  doc.text("TurnFlow Home — Proof Packet", 14, y);
  y += 6;
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(`Generated ${new Date().toLocaleString()}`, 14, y);
  doc.setTextColor(0);
  y += 6;

  autoTable(doc, {
    startY: y,
    theme: "plain",
    styles: { fontSize: 10, cellPadding: 1 },
    body: [
      ["Title", request.title || ""],
      ["Property", propertyLabel || "—"],
      ["Category", request.category || "—"],
      ["Urgency", request.urgency || "—"],
      ["Status", request.status || "Draft"],
      ["Location", request.location || "—"],
      ["Notes", request.notes || "—"],
    ],
  });
  y = lastAutoTableFinalY(doc) + 6;

  doc.setFontSize(12);
  doc.text("Cost", 14, y);
  y += 2;
  autoTable(doc, {
    startY: y,
    head: [["Estimated", "Quoted", "Final", `Current (${costLabelForRequest(request)})`]],
    body: [
      [
        request.estimatedCost != null ? `$${Number(request.estimatedCost).toFixed(2)}` : "—",
        request.quotedCost != null ? `$${Number(request.quotedCost).toFixed(2)}` : "—",
        request.finalCost != null ? `$${Number(request.finalCost).toFixed(2)}` : "—",
        `$${costForRequest(request).toFixed(2)}`,
      ],
    ],
  });
  y = lastAutoTableFinalY(doc) + 6;

  if (quotes.length > 0) {
    doc.setFontSize(12);
    doc.text("Quotes", 14, y);
    y += 2;
    autoTable(doc, {
      startY: y,
      head: [["Vendor", "Amount", "Status", "Availability", "Notes"]],
      body: quotes.map((q) => [
        q.vendorName || "",
        `$${Number(q.amount || 0).toFixed(2)}`,
        q.status || "pending",
        q.availabilityWindow || "",
        q.notes || "",
      ]),
    });
    y = lastAutoTableFinalY(doc) + 6;
  }

  doc.setFontSize(12);
  doc.text("Photo Evidence", 14, y);
  y += 6;
  doc.setFontSize(10);
  const photoCounts = ["before", "after", "receipt", "other"]
    .map((t) => `${t}: ${photos.filter((p) => p.type === t).length}`)
    .join("    ");
  doc.text(photoCounts || "No photos recorded.", 14, y);
  y += 8;

  if (log.length > 0) {
    doc.setFontSize(12);
    doc.text("Decision Log", 14, y);
    y += 2;
    autoTable(doc, {
      startY: y,
      head: [["When", "Who", "What"]],
      body: log.map((entry) => [
        new Date(entry.createdAt).toLocaleString(),
        actorLabel(entry.actorId),
        LOG_ACTION_TEXT[entry.action] ? LOG_ACTION_TEXT[entry.action](entry.details || {}) : entry.action,
      ]),
    });
  }

  doc.save(`turnflow-proof-packet-${request.id}.pdf`);
}
