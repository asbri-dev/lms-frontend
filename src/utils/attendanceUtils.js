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
  Present: { label: "P", color: "#16a34a", type: "Present" },
  Absent: { label: "A", color: "#dc2626", type: "Absent" },
  Offday: { label: "OFF", color: "#6b7280", type: "Leave" },
  "Casual Leave": { label: "CL", color: "#2563eb", type: "Leave" },
  "Medical Leave": { label: "ML", color: "#9333ea", type: "Leave" },
  Onduty: { label: "OD", color: "#f59e0b", type: "Leave" },
  Holiday: { label: "H", color: "#0ea5e9", type: "Leave" },
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

    return {
      title: statusObj.label,
      date: formattedDate,
      color: statusObj.color,
      extendedProps: {
        rawDate: item.Date,
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