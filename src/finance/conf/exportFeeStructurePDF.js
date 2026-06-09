// exportFeeStructurePDF.js
// Exports fee structure data to PDF — individual receipt per fee code OR full report
// Requires: jspdf, jspdf-autotable (npm install jspdf jspdf-autotable)

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ─── constants ───────────────────────────────────────────────────────────────

const GREEN = [22, 163, 74];       // #16a34a
const GREEN_LIGHT = [240, 253, 244]; // #f0fdf4
const GREEN_MID = [220, 252, 231];  // #dcfce7
const DARK = [15, 23, 42];         // #0F172A
const MUTED = [100, 116, 139];     // #64748B
const WHITE = [255, 255, 255];
const BORDER = [226, 232, 240];    // #E2E8F0

const COLLEGE_NAME = "Fee Management System";
const COLLEGE_SUB = "Fee Structure Report";

function formatDate() {
  return new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime() {
  return new Date().toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtVal(val) {
  if (val === null || val === undefined) return "N/A";
  if (val === "NA") return "N/A (Lateral)";
  return val;
}

function fmtRupee(val) {
  if (val === null || val === undefined) return "N/A";
  if (val === "NA") return "N/A";
  const num = Number(val);
  if (isNaN(num)) return val;
  return `₹ ${num.toLocaleString("en-IN")}`;
}

// ─── shared header ────────────────────────────────────────────────────────────

function drawPageHeader(doc, title, subtitle) {
  const pageW = doc.internal.pageSize.getWidth();

  // Green header bar
  doc.setFillColor(...GREEN);
  doc.rect(0, 0, pageW, 28, "F");

  // College name
  doc.setTextColor(...WHITE);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(COLLEGE_NAME, 14, 11);

  // Subtitle
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(title || COLLEGE_SUB, 14, 19);

  // Date top right
  doc.setFontSize(8);
  doc.text(`Generated: ${formatDateTime()}`, pageW - 14, 19, { align: "right" });

  if (subtitle) {
    doc.setFillColor(...GREEN_MID);
    doc.rect(0, 28, pageW, 10, "F");
    doc.setTextColor(...DARK);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(subtitle, 14, 34.5);
  }

  return subtitle ? 42 : 32;
}

// ─── shared footer ────────────────────────────────────────────────────────────

function drawPageFooter(doc) {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const totalPages = doc.internal.getNumberOfPages();

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(...BORDER);
    doc.setLineWidth(0.3);
    doc.line(14, pageH - 14, pageW - 14, pageH - 14);
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.setFont("helvetica", "normal");
    doc.text(`Page ${i} of ${totalPages}`, pageW / 2, pageH - 8, { align: "center" });
    doc.text("Confidential — For Internal Use Only", 14, pageH - 8);
    doc.text(formatDate(), pageW - 14, pageH - 8, { align: "right" });
  }
}

// ─── individual receipt ───────────────────────────────────────────────────────

/**
 * Export individual receipt PDFs — one page per fee code
 * @param {Array} data - Array of fee structure objects
 */
export function exportFeeStructureIndividualPDF(data) {
  if (!data || data.length === 0) {
    alert("No data available to export.");
    return;
  }

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();

  data.forEach((record, index) => {
    if (index > 0) doc.addPage();

    const startY = drawPageHeader(
      doc,
      "Fee Structure — Individual Receipt",
      `${record.feeCode}  •  ${record.feeStructure}`
    );

    let y = startY + 4;

    // ── Info badges row ──
    const badges = [
      { label: "Admission Type", value: record.admissionType },
      { label: "Entry Type", value: record.entryType },
      { label: "Batch", value: record.feeApplicableBatch || "N/A" },
    ];

    const badgeW = (pageW - 28 - (badges.length - 1) * 4) / badges.length;
    badges.forEach((b, i) => {
      const bx = 14 + i * (badgeW + 4);
      doc.setFillColor(...GREEN_LIGHT);
      doc.setDrawColor(...GREEN);
      doc.setLineWidth(0.3);
      doc.roundedRect(bx, y, badgeW, 12, 2, 2, "FD");
      doc.setFontSize(7);
      doc.setTextColor(...MUTED);
      doc.setFont("helvetica", "normal");
      doc.text(b.label.toUpperCase(), bx + badgeW / 2, y + 4.5, { align: "center" });
      doc.setFontSize(8.5);
      doc.setTextColor(...DARK);
      doc.setFont("helvetica", "bold");
      doc.text(b.value, bx + badgeW / 2, y + 9.5, { align: "center" });
    });

    y += 18;

    // ── Applicable Student Codes ──
    doc.setFillColor(...GREEN_MID);
    doc.rect(14, y, pageW - 28, 9, "F");
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.setFont("helvetica", "normal");
    doc.text("APPLICABLE STUDENT CODES", 17, y + 3.5);
    doc.setFontSize(8);
    doc.setTextColor(...DARK);
    doc.setFont("helvetica", "bold");
    doc.text(record.applicableStudentsCodes || "N/A", 17, y + 7.5);
    y += 14;

    // ── Section: Tuition Fees ──
    const sections = [
      {
        title: "TUITION FEES",
        rows: [
          ["Fixed Tuition Fee / Year", fmtRupee(record.fixedTuitionFeePerYear)],
          ["1st Year Tuition Fee", fmtRupee(record.firstYearTuitionFee)],
          ["2nd Year Tuition Fee", fmtRupee(record.secondYearTuitionFee)],
          ["3rd Year Tuition Fee", fmtRupee(record.thirdYearTuitionFee)],
        ],
      },
      {
        title: "ONE-TIME FEES",
        rows: [
          ["Application Fee (Chittoor)", fmtRupee(record.applicationFeeChittoor)],
          ["Admission Fee (Palakkad)", fmtRupee(record.admissionFeePalakkad)],
          ["Ratification Fee (SC/ST)", fmtRupee(record.ratificationFeeScSt)],
          ["Ratification Fee (BC/OC)", fmtRupee(record.ratificationFeeBcOc)],
          ["Caution Deposit", fmtRupee(record.cautionDeposit)],
          ["Uniform Fee", fmtRupee(record.uniformFee)],
          ["ID Card Fee", fmtRupee(record.idCardFee)],
          ["Alumni Fee", fmtRupee(record.alumniFee)],
          ["Industrial & Training Fee", fmtRupee(record.industrialTrainingFee)],
          ["Affiliation Fee", fmtRupee(record.affiliationFee)],
        ],
      },
      {
        title: "ANNUAL FEES",
        rows: [
          ["Book Fee / Year", fmtRupee(record.bookFeePerYear)],
          ["Library & Laboratory Fee / Year", fmtRupee(record.libraryLaboratoryFeePerYear)],
        ],
      },
      {
        title: "TRANSPORT & HOSTEL",
        rows: [
          ["Transport Fee / Year (Bangarupalem)", fmtRupee(record.transportFeePerYearBangarupalem)],
          ["Transport Fee / Year (Thumindapalyam)", fmtRupee(record.transportFeePerYearThumindapalyam)],
          ["Hostel & Mess Fee", fmtRupee(record.hostelAndMessFee)],
        ],
      },
    ];

    sections.forEach((section) => {
      // Section title bar
      doc.setFillColor(...GREEN);
      doc.rect(14, y, pageW - 28, 7, "F");
      doc.setFontSize(8);
      doc.setTextColor(...WHITE);
      doc.setFont("helvetica", "bold");
      doc.text(section.title, 17, y + 5);
      y += 7;

      autoTable(doc, {
        startY: y,
        margin: { left: 14, right: 14 },
        head: [],
        body: section.rows,
        styles: {
          fontSize: 8.5,
          cellPadding: { top: 2.5, bottom: 2.5, left: 4, right: 4 },
          textColor: DARK,
          lineColor: BORDER,
          lineWidth: 0.2,
        },
        columnStyles: {
          0: { fontStyle: "normal", textColor: MUTED, cellWidth: 100 },
          1: { fontStyle: "bold", textColor: DARK, halign: "right" },
        },
        alternateRowStyles: { fillColor: GREEN_LIGHT },
        didDrawPage: () => {},
      });

      y = doc.lastAutoTable.finalY + 5;
    });
  });

  drawPageFooter(doc);
  doc.save(`FeeStructure_Individual_${formatDate().replace(/ /g, "_")}.pdf`);
}

// ─── full report ──────────────────────────────────────────────────────────────

/**
 * Export full report PDF — all records in one comprehensive table
 * @param {Array} data - Array of fee structure objects (filtered or full)
 */
export function exportFeeStructureFullReportPDF(data) {
  if (!data || data.length === 0) {
    alert("No data available to export.");
    return;
  }

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  //const pageW = doc.internal.pageSize.getWidth();

  const startY = drawPageHeader(doc, "Fee Structure — Full Report", `Total Records: ${data.length}`);

  // Summary stats
  let y = startY + 4;
  const admTypes = [...new Set(data.map((d) => d.admissionType))].join(", ");
  const batches = [...new Set(data.map((d) => d.feeApplicableBatch))].join(", ");

  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.setFont("helvetica", "normal");
  doc.text(`Admission Types: ${admTypes}   |   Batches: ${batches}   |   Export Date: ${formatDateTime()}`, 14, y);
  y += 8;

  // Main summary table
  const summaryHead = [
    [
      "Fee Code",
      "Fee Structure Name",
      "Adm. Type",
      "Entry",
      "Batch",
      "Fixed Tuition/Yr",
      "1st Yr",
      "2nd Yr",
      "3rd Yr",
      "Application",
      "Ratification\nSC/ST",
      "Ratification\nBC/OC",
      "Caution\nDeposit",
      "Uniform",
      "ID Card",
      "Book/Yr",
      "Affiliation",
      "Lib & Lab/Yr",
      "Industrial",
      "Alumni",
      "Transport\nBangarupalem",
      "Transport\nThumindapalyam",
      "Hostel &\nMess",
    ],
  ];

  const summaryBody = data.map((r) => [
    r.feeCode,
    r.feeStructure,
    r.admissionType,
    r.entryType,
    r.feeApplicableBatch || "N/A",
    fmtRupee(r.fixedTuitionFeePerYear),
    fmtVal(r.firstYearTuitionFee) === "N/A (Lateral)" ? "—" : fmtRupee(r.firstYearTuitionFee),
    fmtRupee(r.secondYearTuitionFee),
    fmtRupee(r.thirdYearTuitionFee),
    fmtRupee(r.applicationFeeChittoor),
    fmtRupee(r.ratificationFeeScSt),
    fmtRupee(r.ratificationFeeBcOc),
    fmtRupee(r.cautionDeposit),
    fmtRupee(r.uniformFee),
    fmtRupee(r.idCardFee),
    fmtRupee(r.bookFeePerYear),
    fmtRupee(r.affiliationFee),
    fmtRupee(r.libraryLaboratoryFeePerYear),
    fmtRupee(r.industrialTrainingFee),
    fmtRupee(r.alumniFee),
    fmtRupee(r.transportFeePerYearBangarupalem),
    fmtRupee(r.transportFeePerYearThumindapalyam),
    fmtRupee(r.hostelAndMessFee),
  ]);

  autoTable(doc, {
    startY: y,
    margin: { left: 10, right: 10 },
    head: summaryHead,
    body: summaryBody,
    styles: {
      fontSize: 6.5,
      cellPadding: { top: 2, bottom: 2, left: 2, right: 2 },
      overflow: "linebreak",
      lineColor: BORDER,
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: GREEN,
      textColor: WHITE,
      fontStyle: "bold",
      fontSize: 6.5,
      halign: "center",
      valign: "middle",
    },
    alternateRowStyles: { fillColor: GREEN_LIGHT },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 22 },
      1: { cellWidth: 38 },
      2: { cellWidth: 18, halign: "center" },
      3: { cellWidth: 14, halign: "center" },
      4: { cellWidth: 18, halign: "center" },
    },
    didDrawPage: (hookData) => {
      if (hookData.pageNumber > 1) {
        drawPageHeader(doc, "Fee Structure — Full Report (contd.)");
      }
    },
  });

  drawPageFooter(doc);
  doc.save(`FeeStructure_FullReport_${formatDate().replace(/ /g, "_")}.pdf`);
}
