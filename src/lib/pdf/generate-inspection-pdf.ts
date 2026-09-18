import jsPDF from "jspdf";
import type { Inspection } from "@/types";
import { formatDateTime } from "@/lib/format";

export function generateInspectionPdf(inspection: Inspection): jsPDF {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const primaryColor = [29, 78, 216];
  const darkTextColor = [23, 26, 31];
  const mutedTextColor = [100, 116, 139];
  const lightBgColor = [248, 250, 252];
  const borderColor = [226, 232, 240];

  let y = 15;

  // Header Banner
  doc.setFillColor(29, 78, 216);
  doc.rect(0, 0, 210, 24, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("THINKSPHERE", 14, 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("LEGAL METROLOGY INSPECTION REPORT", 14, 18);

  doc.setFontSize(8);
  doc.text(`Generated: ${formatDateTime(new Date().toISOString())}`, 196, 15, { align: "right" });

  y = 32;

  // Title Box & Status Badge
  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(`Inspection Record: ${inspection.id}`, 14, y);

  // Status Chip
  const statusText =
    inspection.overallStatus === "PASS"
      ? "PASS"
      : inspection.overallStatus === "POTENTIAL_NON_COMPLIANCE"
      ? "POTENTIAL NON-COMPLIANCE"
      : "NEEDS REVIEW";

  const statusColor: [number, number, number] =
    inspection.overallStatus === "PASS"
      ? [22, 163, 74]
      : inspection.overallStatus === "POTENTIAL_NON_COMPLIANCE"
      ? [220, 38, 38]
      : [217, 119, 6];

  doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.roundedRect(140, y - 6, 56, 8, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text(statusText, 168, y - 1, { align: "center" });

  y += 10;

  // Metadata Table Box
  doc.setFillColor(lightBgColor[0], lightBgColor[1], lightBgColor[2]);
  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.roundedRect(14, y, 182, 34, 2, 2, "FD");

  doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");

  doc.text("PRODUCT NAME", 18, y + 7);
  doc.text("BRAND", 78, y + 7);
  doc.text("CATEGORY", 138, y + 7);

  doc.text("BATCH / LOT NO.", 18, y + 21);
  doc.text("INSPECTION LOCATION", 78, y + 21);
  doc.text("INSPECTOR", 138, y + 21);

  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  doc.text(inspection.productName || "—", 18, y + 13);
  doc.text(inspection.brand || "—", 78, y + 13);
  doc.text(inspection.category || "—", 138, y + 13);

  doc.text(inspection.batchNumber || "—", 18, y + 27);
  doc.text(inspection.location || "—", 78, y + 27);
  doc.text(inspection.inspectorName || "—", 138, y + 27);

  y += 42;

  // Section 1: Extracted Mandatory Declarations
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("1. Extracted Package Declarations", 14, y);
  y += 4;

  // Table Headers
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(14, y, 182, 7, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("Declaration Field", 18, y + 5);
  doc.text("Extracted Value", 80, y + 5);
  doc.text("OCR Confidence", 145, y + 5);
  doc.text("Verification", 175, y + 5);

  y += 7;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);

  if (inspection.extractedFields.length === 0) {
    doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
    doc.text("No declaration fields extracted yet.", 18, y + 6);
    y += 10;
  } else {
    inspection.extractedFields.forEach((f, idx) => {
      if (y > 260) {
        doc.addPage();
        y = 15;
      }
      const bg = idx % 2 === 0 ? 255 : 248;
      doc.setFillColor(bg, bg, bg);
      doc.rect(14, y, 182, 7, "F");

      doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
      doc.text(f.label, 18, y + 5);
      doc.text(f.value || "Not detected", 80, y + 5);

      const confColor =
        f.confidence === "HIGH"
          ? [22, 163, 74]
          : f.confidence === "MEDIUM"
          ? [217, 119, 6]
          : [220, 38, 38];
      doc.setTextColor(confColor[0], confColor[1], confColor[2]);
      doc.text(f.confidence, 145, y + 5);

      doc.setTextColor(f.validated ? 22 : 100, f.validated ? 163 : 116, f.validated ? 74 : 139);
      doc.text(f.validated ? "Verified" : "Unverified", 175, y + 5);

      y += 7;
    });
  }

  y += 6;

  // Section 2: Rule Engine Evaluations
  if (y > 230) {
    doc.addPage();
    y = 15;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("2. Legal Metrology Compliance Evaluations", 14, y);
  y += 4;

  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(14, y, 182, 7, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("Rule / Requirement", 18, y + 5);
  doc.text("Detected Value", 110, y + 5);
  doc.text("Outcome", 165, y + 5);

  y += 7;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);

  if (inspection.ruleResults.length === 0) {
    doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
    doc.text("No rules evaluated yet.", 18, y + 6);
    y += 10;
  } else {
    inspection.ruleResults.forEach((r, idx) => {
      if (y > 260) {
        doc.addPage();
        y = 15;
      }
      const bg = idx % 2 === 0 ? 255 : 248;
      doc.setFillColor(bg, bg, bg);
      doc.rect(14, y, 182, 7, "F");

      doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
      doc.text(
        r.requirement.length > 55 ? r.requirement.slice(0, 52) + "..." : r.requirement,
        18,
        y + 5
      );
      doc.text(r.detectedValue || "N/A", 110, y + 5);

      const rStatusColor =
        r.status === "PASS"
          ? [22, 163, 74]
          : r.status === "POTENTIAL_NON_COMPLIANCE"
          ? [220, 38, 38]
          : [217, 119, 6];
      doc.setTextColor(rStatusColor[0], rStatusColor[1], rStatusColor[2]);
      doc.setFont("helvetica", "bold");
      doc.text(
        r.status === "PASS"
          ? "PASS"
          : r.status === "POTENTIAL_NON_COMPLIANCE"
          ? "NON-COMPLIANT"
          : "REVIEW NEEDED",
        165,
        y + 5
      );
      doc.setFont("helvetica", "normal");

      y += 7;
    });
  }

  y += 10;
  if (y > 250) {
    doc.addPage();
    y = 15;
  }

  // Footer / Verification Disclaimer
  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.line(14, y, 196, y);
  y += 5;

  doc.setFontSize(7);
  doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
  doc.text(
    "Official Audit Report produced by ThinkSphere Automated Legal Metrology Inspection Platform.",
    14,
    y
  );
  doc.text(
    `Page 1 of ${doc.getNumberOfPages()} — Verification ID: ${
      inspection.id
    }-${Date.now().toString(36).toUpperCase()}`,
    196,
    y,
    { align: "right" }
  );

  return doc;
}

export function downloadInspectionPdf(inspection: Inspection) {
  const doc = generateInspectionPdf(inspection);
  const cleanName = inspection.productName ? inspection.productName.replace(/\s+/g, "_") : "inspection";
  const fileName = `Inspection_Report_${inspection.id}_${cleanName}.pdf`;
  doc.save(fileName);
}
