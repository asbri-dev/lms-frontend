// Centralized fee labels for student finance pages
export const FEE_LABELS = {
  admissionFee:"Admission Fee",
  uniformFee: "Uniform Fee",
  applicationFee: "Application Fee",
  idCardFee: "ID Card Fee",
  cautionDeposit: "Caution Deposit",
  ratificationFee: "Ratification Fee",
  alumniFee: "Alumni Fee",
  industrialAndTrainingFee: "Industrial & Training Fee",
  tuitionFee: "Tuition Fee",
  bookFee: "Book Fee",
  affiliationFee: "Affiliation Fee",
  transportationFee: "Transportation Fee",
  libraryAndLaboratoryFee: "Library & Laboratory Fee",
  hostelAndMessFee: "Hostel & Mess Fee",
  twoOneHMFee: "Yr 2 Sem 1 — Hostel & Mess",
  oneOneHMFee: "Yr 1 Sem 1 — Hostel & Mess",
  oneTwoHMFee: "Yr 1 Sem 2 — Hostel & Mess",
  twoOneBusFee: "Yr 2 Sem 1 — Bus Fee",
  oneOneBusFee: "Yr 1 Sem 1 — Bus Fee",
  oneTwoBusFee: "Yr 1 Sem 2 — Bus Fee",
  twoTwoBusFee: "Yr 2 Sem 2 — Bus Fee",
  oneOneTuitionFee: "Tuition Fee (SEM I)",
  oneTwoTuitionFee: "Tuition Fee (SEM II)",
  twoOneTuitionFee: "Yr 2 Sem 1 — Tuition Fee",
  twoTwoTuitionFee: "Yr 2 Sem 2 — Tuition Fee",
  uniformAndDrawingFee: "Uniform & Drawing Fee",
  firstYearBookFee: "Yr 1 - Book Fee",
  secondYearBookFee: "Yr 2 - Book Fee",
};

// Helper function for getting fee labels (handles year-prefixed fees)
export const getFeeLabel = (name) => {
  if (!name) return "—";
  const suffixMatch = name.match(/^(?:first|second|third|fourth)Year(.+)$/i);
  if (suffixMatch) {
    const base =
      suffixMatch[1].charAt(0).toLowerCase() + suffixMatch[1].slice(1);
    const prefix = name.match(/^(\w+?)Year/i)[1];
    const yearMap = { first: "1st", second: "2nd", third: "3rd", fourth: "4th" };
    const yr = yearMap[prefix.toLowerCase()] ?? prefix;
    return `${FEE_LABELS[base] ?? base} (${yr} Year)`;
  }
  return FEE_LABELS[name] ?? name;
};
