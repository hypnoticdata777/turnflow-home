"use client";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { costForRequest, costLabelForRequest, type CostFields } from "@/lib/utils";

export type HistoryRequest = CostFields & {
  title: string;
  category: string;
  status: string;
  createdAt: string | Date;
};

export function downloadPropertyHistoryPdf({
  propertyId,
  propertyLabel,
  requests,
}: {
  propertyId: string;
  propertyLabel: string;
  requests: HistoryRequest[];
}) {
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text("TurnFlow Home — Property History", 14, 16);
  doc.setFontSize(11);
  doc.text(propertyLabel, 14, 24);
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(`Generated ${new Date().toLocaleString()} — ${requests.length} request(s)`, 14, 30);
  doc.setTextColor(0);

  autoTable(doc, {
    startY: 36,
    head: [["Title", "Category", "Status", "Cost", "Created"]],
    body: requests
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((r) => [
        r.title || "(untitled)",
        r.category || "—",
        r.status || "Draft",
        `$${costForRequest(r).toFixed(2)} (${costLabelForRequest(r)})`,
        new Date(r.createdAt).toLocaleDateString(),
      ]),
  });

  doc.save(`turnflow-property-history-${propertyId}.pdf`);
}
