// utils/attendanceUtils.js

import { format, startOfMonth, endOfMonth, parse } from "date-fns";

/* ============================
   Month Range (DD-MMM-yyyy)
============================ */
export const getMonthRange = (date) => ({
  fromDate: format(startOfMonth(date), "dd-MMM-yyyy"),
  toDate: format(endOfMonth(date), "dd-MMM-yyyy"),
});

/* ============================
   Status Mapping
============================ */
export const STATUS_MAP = {
  Present: { label: "P", color: "#D7FDF0", type: "Present",textColor: "#6b7280" },
  Absent: { label: "A", color: "#FE8985", type: "Absent" },
  Off: { label: "OFF", color: "#F7F7F7", type: "Leave" },
  cl: { label: "Casual Leave", color: "#79ADDC", type: "Leave" },
  ml: { label: "Medical Leave", color: "#79ADDC", type: "Leave" },
  Onduty: { label: "OD", color: "#1B2A41", type: "Leave" },
  Holiday: { label: "H", color: "#0ea5e9", type: "Leave" },
  "Present:Absent": { label: "P/A", color: "#FE8985", type: "Present/Absent" },
  "Absent:Present": { label: "A/P", color: "#FE8985", type: "Absent/Present" },
  "Present:cl": { label: "P/CL", color: "#D7FDF0", type: "Present/Casual Leave" },
  "cl:Present": { label: "CL/P", color: "#D7FDF0", type: "Casual Leave/Present" },
  "Present:ml": { label: "P/ML", color: "#D7FDF0", type: "Present/Medical Leave" },
  "ml:Present": { label: "ML/P", color: "#D7FDF0", type: "Medical Leave/Present" },
  "Absent:cl": { label: "A/CL", color: "#FE8985", type: "Absent/Casual Leave" },
  "cl:Absent": { label: "CL/A", color: "#FE8985", type: "Casual Leave/Absent" },
  "Absent:ml": { label: "A/ML", color: "#FE8985", type: "Absent/Medical Leave" },
  "ml:Absent": { label: "ML/A", color: "#FE8985", type: "Medical Leave/Absent" },
  "PR-Present:Present": { label: "PR-P", color: "#D7FDF0", type: "Present" },
  "Present:Present-PR": { label: "P-PR", color: "#D7FDF0", type: "Present" },
  "PR-Present:Absent": { label: "PR-A", color: "#FE8985", type: "Absent" },
  "Absent:Present-PR": { label: "A-PR", color: "#FE8985", type: "Absent" },
  Unknown: { label: "?", color: "#FFD199", type: "Unknown" },
};

/* ============================
   Transform Backend Data
============================ */
export const transformAttendanceData = (data = []) => {
  if (!Array.isArray(data)) return [];

  const uniqueMap = new Map();

  data.forEach((item) => {
    if (item?.Date && !uniqueMap.has(item.Date)) {
      uniqueMap.set(item.Date, item);
    }
  });

  return Array.from(uniqueMap.values()).map((item) => {
  const parsedDate = parse(item.Date, "dd-MMM-yyyy", new Date());
  const formattedDate = format(parsedDate, "yyyy-MM-dd");

  const details = item?.AttendanceDetails || {};
  const statusObj = STATUS_MAP[details.status] || {
    label: "",
    color: "#9ca3af",
    type: "Leave",
  };

  // 🔥 IMPORTANT: add +1 day for background event
  const endDate = new Date(parsedDate);
  endDate.setDate(endDate.getDate() + 1);

  return {
    start: formattedDate,
    end: format(endDate, "yyyy-MM-dd"),

    display: "background", // ✅ FULL CELL COLOR

    backgroundColor: statusObj.color,

    // 👇 keep data for click
    extendedProps: {
      rawDate: item.Date,
      label: statusObj.label,
      details: {
        status: details.status || "Unknown",
        sessionOne: details.sessionOne || "-",
        sessionTwo: details.sessionTwo || "-",
        punchIn: details.punchIn || "-",
        punchOut: details.punchOut || "-",
        workDuration: details.workDuration || "-",
        lateIn: details.lateIn || "-",
        lateOut: details.lateOut || "-",
        earlyIn: details.earlyIn || "-",
        earlyOut: details.earlyOut || "-",
      },
    },
  };
});
};