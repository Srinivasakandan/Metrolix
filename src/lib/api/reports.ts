"use client";

import type { ReportFilters, ReportSummary } from "@/types";
import { inspectionStore } from "@/lib/mock/store";

function delay<T>(value: T, ms = 300): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function filtered(filters: ReportFilters) {
  return inspectionStore.getAll().filter((i) => {
    if (i.stage === "DRAFT" || i.stage === "UPLOADING") return false;
    if (filters.category && filters.category !== "ALL" && i.category !== filters.category) return false;
    if (filters.status && filters.status !== ("ALL" as ReportFilters["status"]) && i.overallStatus !== filters.status) return false;
    if (filters.inspectorId && filters.inspectorId !== "ALL" && i.inspectorId !== filters.inspectorId) return false;
    if (filters.dateFrom && new Date(i.createdAt) < new Date(filters.dateFrom)) return false;
    if (filters.dateTo && new Date(i.createdAt) > new Date(filters.dateTo)) return false;
    return true;
  });
}

/** GET /api/reports/summary */
export async function getReportSummary(filters: ReportFilters): Promise<ReportSummary> {
  const items = filtered(filters);
  return delay({
    total: items.length,
    passed: items.filter((i) => i.overallStatus === "PASS").length,
    potentialNonCompliance: items.filter((i) => i.overallStatus === "POTENTIAL_NON_COMPLIANCE").length,
    needsReview: items.filter((i) => i.overallStatus === "NEEDS_REVIEW").length,
  });
}

import jsPDF from "jspdf";
import { formatDateTime } from "@/lib/format";

/** POST /api/reports/generate — generates summary PDF report for filtered inspections. */
export async function generatePdfReport(filters: ReportFilters): Promise<{ ok: true; fileName: string }> {
  const items = filtered(filters);
  const scope = filters.category ?? "all-categories";
  const fileName = `legal-metrology-summary-${scope}-${Date.now()}.pdf`;

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  doc.setFillColor(29, 78, 216);
  doc.rect(0, 0, 210, 24, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("THINKSPHERE", 14, 12);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("SUMMARY METROLOGY COMPLIANCE REPORT", 14, 18);
  doc.setFontSize(8);
  doc.text(`Generated: ${formatDateTime(new Date().toISOString())}`, 196, 15, { align: "right" });

  let y = 34;
  doc.setTextColor(23, 26, 31);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(`Total Inspections Included: ${items.length}`, 14, y);
  y += 10;

  doc.setFillColor(29, 78, 216);
  doc.rect(14, y, 182, 7, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("ID", 18, y + 5);
  doc.text("Product", 45, y + 5);
  doc.text("Category", 100, y + 5);
  doc.text("Inspector", 140, y + 5);
  doc.text("Status", 170, y + 5);
  y += 7;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);

  if (items.length === 0) {
    doc.setTextColor(100, 116, 139);
    doc.text("No inspections matched the selected filters.", 18, y + 6);
  } else {
    items.forEach((item, idx) => {
      if (y > 270) {
        doc.addPage();
        y = 15;
      }
      const bg = idx % 2 === 0 ? 255 : 248;
      doc.setFillColor(bg, bg, bg);
      doc.rect(14, y, 182, 7, "F");
      doc.setTextColor(23, 26, 31);
      doc.text(item.id, 18, y + 5);
      doc.text(item.productName || "—", 45, y + 5);
      doc.text(item.category || "—", 100, y + 5);
      doc.text(item.inspectorName || "—", 140, y + 5);

      const color = item.overallStatus === "PASS" ? [22, 163, 74] : item.overallStatus === "POTENTIAL_NON_COMPLIANCE" ? [220, 38, 38] : [217, 119, 6];
      doc.setTextColor(color[0], color[1], color[2]);
      doc.text(item.overallStatus, 170, y + 5);
      y += 7;
    });
  }

  doc.save(fileName);
  return delay({ ok: true, fileName }, 300);
}

/** POST /api/reports/export — generates CSV data export for filtered inspections. */
export async function exportInspectionData(filters: ReportFilters): Promise<{ ok: true; fileName: string; rowCount: number }> {
  const items = filtered(filters);
  const fileName = `legal-metrology-export-${Date.now()}.csv`;

  const headers = ["Inspection ID", "Product Name", "Brand", "Category", "Batch Number", "Inspector", "Status", "Created At"];
  const rows = items.map((i) => [
    i.id,
    `"${i.productName || ""}"`,
    `"${i.brand || ""}"`,
    `"${i.category || ""}"`,
    `"${i.batchNumber || ""}"`,
    `"${i.inspectorName}"`,
    i.overallStatus,
    i.createdAt,
  ]);

  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  return delay({ ok: true, fileName, rowCount: items.length }, 300);
}
