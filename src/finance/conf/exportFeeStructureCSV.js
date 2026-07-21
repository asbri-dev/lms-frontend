// exportFeeStructureCSV.js
// Exports fee structure data to a CSV file with all fields

const FIELD_LABELS = {
  feeCode: "Fee Code",
  feeStructure: "Fee Structure Name",
  admissionType: "Admission Type",
  entryType: "Entry Type",
  feeApplicableBatch: "Applicable Batch",
  applicableStudentsCodes: "Applicable Student Codes",
  fixedTuitionFeePerYear: "Fixed Tuition Fee / Year (₹)",
  firstYearTuitionFee: "1st Year Tuition Fee (₹)",
  secondYearTuitionFee: "2nd Year Tuition Fee (₹)",
  thirdYearTuitionFee: "3rd Year Tuition Fee (₹)",
  applicationFeeChittoor: "Application Fee - Chittoor (₹)",
  admissionFeePalakkad: "Admission Fee - Palakkad (₹)",
  ratificationFeeScSt: "Ratification Fee SC/ST (₹)",
  ratificationFeeBcOc: "Ratification Fee BC/OC (₹)",
  cautionDeposit: "Caution Deposit (₹)",
  uniformFee: "Uniform Fee (₹)",
  idCardFee: "ID Card Fee (₹)",
  bookFeePerYear: "Book Fee / Year (₹)",
  affiliationFee: "Affiliation Fee (₹)",
  libraryLaboratoryFeePerYear: "Library & Laboratory Fee / Year (₹)",
  industrialTrainingFee: "Industrial & Training Fee (₹)",
  alumniFee: "Alumni Fee (₹)",
  hostelAndMessFee: "Hostel & Mess Fee (₹)",
  transportFeePerYearBangarupalem: "Transport Fee / Year - Bangarupalem (₹)",
  transportFeePerYearThumindapalyam: "Transport Fee / Year - Thumindapalyam (₹)",
};

const FIELD_ORDER = Object.keys(FIELD_LABELS);

function escapeCSVValue(value) {
  if (value === null || value === undefined) return "N/A";
  const str = String(value);
  // Wrap in quotes if contains comma, quote, or newline
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function formatDate() {
  return new Date()
    .toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
    .replace(/\//g, "-");
}

/**
 * Export fee structure data to CSV
 * @param {Array} data - Array of fee structure objects (filtered or full)
 * @param {string} filename - Optional custom filename
 */
export function exportFeeStructureCSV(data, filename) {
  if (!data || data.length === 0) {
    alert("No data available to export.");
    return;
  }

  // Build header row
  const headers = FIELD_ORDER.map((key) => FIELD_LABELS[key]);

  // Build data rows
  const rows = data.map((record) =>
    FIELD_ORDER.map((key) => escapeCSVValue(record[key]))
  );

  // Combine header + rows
  const csvContent = [
    headers.map(escapeCSVValue).join(","),
    ...rows.map((row) => row.join(",")),
  ].join("\n");

  // Add BOM for Excel UTF-8 compatibility
  const blob = new Blob(["\uFEFF" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename || `FeeStructure_${formatDate()}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

