import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { format } from "date-fns";

const STATUS_MAP = {
  Present: { label: "P" },
  Absent: { label: "A" },
  Holiday: { label: "H" },
  Offday: { label: "OFF" },
  "Casual Leave": { label: "CL" },
  "Medical Leave": { label: "ML" },
  Onduty: { label: "OD" }
};

export const exportAttendanceExcel = (employees, days) => {

  const sheet = [];

  const header = ["Employee Name", "Employee ID", "Department"];

  days.forEach(d => header.push(format(d, "dd")));

  sheet.push(header);

  employees.forEach(emp => {

    const row = [
      emp.employeeName,
      emp.employeeId,
      emp.department
    ];

    days.forEach(day => {

      const dateStr = format(day, "dd-MMM-yyyy");

      const found = emp.attendanceHistory.find(
        (a) => a.date === dateStr
      );

      row.push(found ? STATUS_MAP[found.status]?.label || "" : "");

    });

    sheet.push(row);
  });

  const ws = XLSX.utils.aoa_to_sheet(sheet);
  const wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(wb, ws, "Attendance");

  const buffer = XLSX.write(wb, { type: "array", bookType: "xlsx" });

  saveAs(new Blob([buffer]), "attendance-muster.xlsx");
};