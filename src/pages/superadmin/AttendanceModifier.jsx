import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../../auth/useAuth";
import toast from "react-hot-toast";
import { API_BASE_URL } from "../../config/api";
import { Download } from "lucide-react";


// ─── Status config ───────────────────────────────────────────────────────────
const STATUS_OPTIONS = [
  "Present", "Absent", "CL", "ML", "OD", "Holiday", "Off", "Unknown","PR"
];

const STATUS_STYLE = {
  Present:   { bg: "#dcfce7", color: "#15803d", dot: "#16a34a" },
  Absent:    { bg: "#fee2e2", color: "#b91c1c", dot: "#dc2626" },
  CL:        { bg: "#dbeafe", color: "#1d4ed8", dot: "#2563eb" },
  ML:        { bg: "#ede9fe", color: "#6d28d9", dot: "#7c3aed" },
  OD:        { bg: "#fef3c7", color: "#92400e", dot: "#d97706" },
  Holiday:   { bg: "#f1f5f9", color: "#475569", dot: "#64748b" },
  Off:       { bg: "#f8fafc", color: "#94a3b8", dot: "#cbd5e1" },
  Unknown:   { bg: "#fdf4ff", color: "#86198f", dot: "#a21caf" },
  default:   { bg: "#f1f5f9", color: "#475569", dot: "#64748b" },
};

const backendStatusMap = (status) => {
  if (!status) return "Present";
  if (status === "CL" || status === "cl") return "CL";
  if (status === "ML" || status === "ml") return "ML";
  if (status === "OD" || status === "Onduty") return "OD";
  if (status === "Absent:Present") return "A/P";
  if (status === "Present:Absent") return "P/A";
  if (status === "Absent:Present-PR") return "Pr";

  return status;
};


  const normalizeStatus = (status) => {
    if (!status) return null;
    if (status === "cl" || status === "CL") return "CL";
    if(status==="Absent:Present" || status==="Present:Absent") return "Unknown";
    if (status === "ml" || status === "ML") return "ML";
    if (status === "Onduty" || status === "OD") return "OD";
    if (status === "holiday" || status === "Holiday") return "Holiday";
    return status;
  };


const getStatusStyle = (status) => {
  if (!status) return STATUS_STYLE.default;
  const key = Object.keys(STATUS_STYLE).find(
    (k) => k.toLowerCase() === status.toLowerCase()
  );
  return STATUS_STYLE[key] || STATUS_STYLE.default;
};

const LOCKED_STATUSES = [ "holiday"];
const isLocked = (status) =>
  LOCKED_STATUSES.includes((status || "").toLowerCase());

// ─── Helpers ─────────────────────────────────────────────────────────────────
const formatDateForApi = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  }).replace(/ /g, "-");
};

const getDefaultFromDate = () => {
  const d = new Date();
  d.setDate(1);
  return d.toISOString().split("T")[0];
};

const getDefaultToDate = () => {
  const d = new Date();
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return last.toISOString().split("T")[0];
};

const getDayName = (dateStr) => {
  const parts = dateStr.split("-");
  const months = { Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11 };
  const d = new Date(parts[2], months[parts[1]], parseInt(parts[0]));
  return d.toLocaleDateString("en-US", { weekday: "short" });
};

// ─── ReasonModal ─────────────────────────────────────────────────────────────
function ReasonModal({ date, empName, onConfirm, onCancel }) {
  const [reason, setReason] = useState("");
  const trimmed = reason.trim();

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onCancel(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    /* Backdrop */
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(15,23,42,0.45)",
        display: "flex", alignItems: "center", justifyContent: "center",
        backdropFilter: "blur(2px)",
      }}
    >
      {/* Card */}
      <div style={{
        width: 420, background: "white", borderRadius: 16,
        boxShadow: "0 24px 60px rgba(0,0,0,0.18)",
        overflow: "hidden",
        animation: "modalIn 0.18s ease",
      }}>
        {/* Header */}
        <div style={{
          padding: "18px 22px 14px",
          borderBottom: "1px solid #f1f5f9",
          display: "flex", alignItems: "flex-start", gap: 12,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: "linear-gradient(135deg,#fef3c7,#fde68a)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {/* Pencil icon */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="#d97706" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#1e293b" }}>
              Reason for Override
            </div>
            <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
              {empName} &mdash; {date}
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "18px 22px" }}>
          <label style={{
            display: "block", fontSize: 11, fontWeight: 700,
            color: "#64748b", textTransform: "uppercase",
            letterSpacing: 0.6, marginBottom: 8,
          }}>
            Reason <span style={{ color: "#ef4444" }}>*</span>
          </label>
          <textarea
            autoFocus
            placeholder="e.g. Biometric failure, duty reassignment, manual correction after verification…"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={300}
            rows={4}
            style={{
              width: "100%", padding: "10px 12px",
              borderRadius: 10, resize: "vertical",
              border: "1.5px solid #e2e8f0",
              fontSize: 13, color: "#334155",
              fontFamily: "'DM Sans','Segoe UI',sans-serif",
              outline: "none", lineHeight: 1.5,
              transition: "border-color 0.15s",
              boxSizing: "border-box",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
            onBlur={(e)  => (e.target.style.borderColor = "#e2e8f0")}
          />
          <div style={{
            fontSize: 11, color: "#cbd5e1", textAlign: "right", marginTop: 4,
          }}>
            {reason.length}/300
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: "0 22px 18px",
          display: "flex", gap: 10, justifyContent: "flex-end",
        }}>
          <button
            onClick={onCancel}
            style={{
              padding: "8px 20px", borderRadius: 8,
              border: "1.5px solid #e2e8f0",
              background: "white", color: "#64748b",
              fontSize: 13, fontWeight: 600, cursor: "pointer",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => (e.target.style.background = "#f8fafc")}
            onMouseLeave={(e) => (e.target.style.background = "white")}
          >
            Cancel
          </button>
          <button
            onClick={() => trimmed && onConfirm(trimmed)}
            disabled={!trimmed}
            style={{
              padding: "8px 22px", borderRadius: 8, border: "none",
              background: trimmed ? "#6366f1" : "#e2e8f0",
              color: trimmed ? "white" : "#94a3b8",
              fontSize: 13, fontWeight: 600,
              cursor: trimmed ? "pointer" : "not-allowed",
              transition: "all 0.15s",
            }}
          >
            Confirm Override
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function EmployeeCard({ emp, isAdmin, isSelected, onClick }) {
  const initials = `${(emp.firstName || emp.adminName || "?")[0]}${
    (emp.lastName || "")[0] || ""
  }`.toUpperCase();

  const name = emp.adminName
    ? emp.adminName
    : `${emp.firstName || ""} ${emp.lastName || ""}`.trim();
  const empId = emp.empId || emp.userName;
  const location = emp.collegeLocation || emp.collageLocation || "";
  const dept = emp.facultyDept || emp.designation || "";

  return (
    <button
      onClick={() => onClick(emp)}
      style={{
        width: "100%",
        textAlign: "left",
        padding: "12px 14px",
        borderRadius: "10px",
        border: isSelected ? "1.5px solid #6366f1" : "1.5px solid transparent",
        background: isSelected
          ? "linear-gradient(135deg,#eef2ff 0%,#e0e7ff 100%)"
          : "white",
        cursor: "pointer",
        transition: "all 0.18s ease",
        boxShadow: isSelected
          ? "0 2px 12px rgba(99,102,241,0.15)"
          : "0 1px 3px rgba(0,0,0,0.06)",
        marginBottom: "6px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
      }}
    >
      {/* Avatar */}
      <div style={{
        width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
        background: isAdmin
          ? "linear-gradient(135deg,#f59e0b,#d97706)"
          : "linear-gradient(135deg,#6366f1,#818cf8)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 13, fontWeight: 700, color: "white", letterSpacing: 0.5,
      }}>
        {initials}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13, fontWeight: 600, color: "#1e293b",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {name}
        </div>
        <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
          {empId}
        </div>
        {dept && (
          <div style={{
            fontSize: 10, color: "#94a3b8", marginTop: 1,
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>
            {dept}
          </div>
        )}
      </div>

      {/* Badges */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
        {isAdmin && (
          <span style={{
            fontSize: 9, fontWeight: 700, padding: "2px 6px",
            borderRadius: 4, background: "#fef3c7", color: "#92400e",
            letterSpacing: 0.5, textTransform: "uppercase",
          }}>
            Admin
          </span>
        )}
        {location && (
          <span style={{
            fontSize: 9, fontWeight: 600, padding: "2px 6px",
            borderRadius: 4,
            background: location.toLowerCase().includes("palakkad") ? "#dbeafe" : "#dcfce7",
            color: location.toLowerCase().includes("palakkad") ? "#1d4ed8" : "#15803d",
          }}>
            {location}
          </span>
        )}
      </div>
    </button>
  );
}


function StatusBadge({ status }) {
  const style = getStatusStyle(status);
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 10px", borderRadius: 20,
      background: style.bg, color: style.color,
      fontSize: 11, fontWeight: 600, whiteSpace: "nowrap",
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: "50%",
        background: style.dot, flexShrink: 0,
      }} />
      {status || "—"}
    </span>
  );
}


function ToggleSwitch({ value, onChange, disabled }) {
  return (
    <button
      onClick={() => !disabled && onChange(!value)}
      disabled={disabled}
      style={{
        width: 44, height: 24, borderRadius: 12, border: "none",
        background: disabled ? "#e2e8f0" : value ? "#6366f1" : "#cbd5e1",
        cursor: disabled ? "not-allowed" : "pointer",
        position: "relative", transition: "background 0.2s",
        flexShrink: 0,
      }}
    >
      <span style={{
        position: "absolute", top: 3,
        left: value ? 23 : 3,
        width: 18, height: 18, borderRadius: "50%", background: "white",
        transition: "left 0.2s",
        boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
      }} />
    </button>
  );
}

// ─── AttendanceRow ────────────────────────────────────────────────────────────
function AttendanceRow({ record, empName, empId, onSave, isSaving }) {
  const { user } = useAuth();
  const locked = isLocked(record.AttendanceDetails?.status);
  const originalStatus = record.AttendanceDetails?.status || "";
  const originalS1 = record.AttendanceDetails?.sessionOne;
  const originalS2 = record.AttendanceDetails?.sessionTwo;

  const toBoolean = (val) => {  //
    if (typeof val === "boolean") return val;
    const s = (val || "").toLowerCase();
    return s === "present" || s === "pr-present" || s === "true"|| s==="Present(O)".toLowerCase();
  };

  const [s1, setS1] = useState(toBoolean(originalS1));
  const [s2, setS2] = useState(toBoolean(originalS2));
 const displayStatus = (status) => {
  const map = {
    "cl(o)": "CL",
    "ml(o)": "ML",
    "od(o)": "OD",
    "PR-Present:Present": "Present"
    
  };

  return map[status?.toLowerCase()] || status;
};

const [status, setStatus] = useState(
  displayStatus(originalStatus)
);
  const [s1Changed, setS1Changed] = useState(false);
  const [s2Changed, setS2Changed] = useState(false);

  // ── NEW: reason modal state ───────────────────────────────────────────────
  const [showReasonModal, setShowReasonModal] = useState(false);

const isDirty =
  s1 !== toBoolean(originalS1) ||
  s2 !== toBoolean(originalS2) ||
  displayStatus(status) !== displayStatus(originalStatus);

  // Called when user clicks "Save" → open modal
  const handleSaveClick = () => {
    if (!isDirty || isSaving) return;
    setShowReasonModal(true);
  };

  // Called when modal is confirmed with a reason
  const handleReasonConfirm = async (reason) => {
    setShowReasonModal(false);
    await onSave({
      superAdminEmpId: user.employeeId,
      empId,
      date: record.Date,
      sessionOne: s1Changed ? s1 : false,
      sessionTwo: s2Changed ? s2 : false,
      status: status || "Present",
      reason,
    });
  };

  const handleReset = () => {
    setS1(toBoolean(originalS1));
    setS2(toBoolean(originalS2));
    setStatus(originalStatus);
  };



  const dayName = getDayName(record.Date);
  const isWeekend = dayName === "Sat" || dayName === "Sun";

  return (
    <>
      {/* Reason modal — rendered at row level, portals above everything */}
      {showReasonModal && (
        <tr style={{ display: "contents" }}>
          <td style={{ display: "contents" }}>
            <ReasonModal
              date={record.Date}
              empName={empName}
              onConfirm={handleReasonConfirm}
              onCancel={() => setShowReasonModal(false)}
            />
          </td>
        </tr>
      )}

      <tr
        style={{
          background: isDirty
            ? "linear-gradient(90deg,#fffbeb 0%,#fefce8 100%)"
            : locked
              ? "#f8fafc"
              : "white",
          transition: "background 0.2s",
          borderBottom: "1px solid #f1f5f9",
        }}
      >
        {/* Date */}
        <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{record.Date}</div>
          <div
            style={{
              fontSize: 11,
              color: isWeekend ? "#f59e0b" : "#94a3b8",
              fontWeight: isWeekend ? 600 : 400,
            }}
          >
            {dayName}
          </div>
        </td>

        {/* Name */}
        <td style={{ padding: "10px 14px" }}>
          <StatusBadge status={normalizeStatus(backendStatusMap(record.AttendanceDetails?.status))} />
        </td>

        {/* Punch In / Out */}
        <td style={{ padding: "10px 14px" }}>
          <div style={{ display: "flex", gap: "10px", fontSize: 12, color: "#475569" }}>
            <span>{record.AttendanceDetails?.punchIn || "—"}</span>
            <p>/</p>
            <span>{record.AttendanceDetails?.punchOut || "—"}</span>
          </div>
        </td>

        {/* Work Duration */}
        <td style={{ padding: "10px 14px" }}>
          <span
            style={{
              fontSize: 12,
              color: "#475569",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {record.AttendanceDetails?.workDuration || "—"}
          </span>
        </td>

        {/* Session 1 */}
        <td style={{ padding: "10px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <ToggleSwitch
              value={s1}
              onChange={(v) => {
                setS1(v);
                setS1Changed(true);
              }}
              disabled={locked}
            />
            <span style={{ fontSize: 11, color: s1 ? "#16a34a" : "#94a3b8", fontWeight: 600 }}>
              {s1 ? "Present" : "Absent"}
            </span>
          </div>
        </td>

        {/* Session 2 */}
        <td style={{ padding: "10px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <ToggleSwitch
              value={s2}
              onChange={(v) => {
                setS2(v);
                setS2Changed(true);
              }}
              disabled={locked}
            />
            <span style={{ fontSize: 11, color: s2 ? "#16a34a" : "#94a3b8", fontWeight: 600 }}>
              {s2 ? "Present" : "Absent"}
            </span>
          </div>
        </td>

        {/* Status */}
        <td style={{ padding: "10px 14px" }}>
          {locked ? (
            <StatusBadge status={normalizeStatus(status)} />
          ) : (
            <select
              value={STATUS_OPTIONS.find((opt) => opt === normalizeStatus(status))}
              onChange={(e) => setStatus(e.target.value)}
              style={{
                padding: "5px 10px",
                borderRadius: 8,
                border: "1.5px solid #e2e8f0",
                fontSize: 12,
                fontWeight: 600,
                background: getStatusStyle(normalizeStatus(status)).bg,
                color: getStatusStyle(normalizeStatus(status)).color,
                cursor: "pointer",
                outline: "none",
                transition: "border-color 0.15s",
              }}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          )}
        </td>

        {/* Actions */}
        <td style={{ padding: "10px 14px" }}>
          {locked ? (
            <span style={{ fontSize: 11, color: "#cbd5e1" }}>Locked</span>
          ) : (
            <div style={{ display: "flex", gap: 6 }}>
              <button
                onClick={handleSaveClick}
                disabled={!isDirty || isSaving}
                style={{
                  padding: "5px 14px",
                  borderRadius: 7,
                  border: "none",
                  background: isDirty ? "#6366f1" : "#e2e8f0",
                  color: isDirty ? "white" : "#94a3b8",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: isDirty && !isSaving ? "pointer" : "not-allowed",
                  transition: "all 0.15s",
                }}
              >
                {isSaving ? "Saving…" : "Save"}
              </button>
              {isDirty && (
                <button
                  onClick={handleReset}
                  style={{
                    padding: "5px 10px",
                    borderRadius: 7,
                    border: "1.5px solid #e2e8f0",
                    background: "white",
                    color: "#64748b",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          )}
        </td>
      </tr>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AttendanceModifier() {
  const { user } = useAuth();

  // Employee list state
  const [allEmployees, setAllEmployees] = useState([]);
  const [loadingEmps, setLoadingEmps] = useState(true);
  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState("All");

  // Selected employee
  const [selectedEmp, setSelectedEmp] = useState(null);

  // Date range
  const [fromDate, setFromDate] = useState(getDefaultFromDate());
  const [toDate, setToDate] = useState(getDefaultToDate());
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
  });

  // Attendance records
  const [records, setRecords] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [savingRow, setSavingRow] = useState(null);

  // ── Load employees on mount ──────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/getFacultyAndAdmin?rmEmpId=${user.employeeId}`
        );
        const data = await res.json();
        const faculty = (data.FacultyDetails || []).map((f) => ({ ...f, _isAdmin: false }));
        const admins  = (data.AdminDetails  || []).map((a) => ({ ...a, _isAdmin: true  }));
        setAllEmployees([...admins, ...faculty]);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load employees");
      } finally {
        setLoadingEmps(false);
      }
    };
    load();
  }, [user.employeeId]);

  // ── Filter employees ─────────────────────────────────────────────────────
  const filteredEmployees = useMemo(() => {
    return allEmployees.filter((emp) => {
      const name = (emp.adminName || `${emp.firstName || ""} ${emp.lastName || ""}`).toLowerCase();
      const id   = (emp.empId || emp.userName || "").toLowerCase();
      const loc  = (emp.collegeLocation || emp.collageLocation || "").toLowerCase();
      const q    = search.toLowerCase();

      const matchSearch = !q || name.includes(q) || id.includes(q);
      const matchLoc    = locationFilter === "All" ||
        loc.includes(locationFilter.toLowerCase());

      return matchSearch && matchLoc;
    });
  }, [allEmployees, search, locationFilter]);

  // ── Load attendance ──────────────────────────────────────────────────────
  const loadAttendance = useCallback(async (emp, from, to) => {
    if (!emp) return;
    const empId = emp.empId || emp.userName;
    setLoadingRecords(true);
    setRecords([]);
    try {
      const fmtFrom = formatDateForApi(from);
      const fmtTo   = formatDateForApi(to);
      const res = await fetch(
        `${API_BASE_URL}/getAttedanceInfo?empId=${empId}&fromDate=${fmtFrom}&toDate=${fmtTo}`
      );
      const data = await res.json();
      setRecords(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load attendance");
    } finally {
      setLoadingRecords(false);
    }
  }, []);

  // ── On employee click ────────────────────────────────────────────────────
  const handleSelectEmployee = (emp) => {
    setSelectedEmp(emp);
    loadAttendance(emp, fromDate, toDate);
  };

  // ── Manual load (date change) ────────────────────────────────────────────
  const handleLoad = () => {
    if (!fromDate || !toDate) {
      toast.error("Please select both dates");
      return;
    }
    if (new Date(fromDate) > new Date(toDate)) {
      toast.error("From date cannot be after To date");
      return;
    }
    loadAttendance(selectedEmp, fromDate, toDate);
  };

  // ── Month quick-picker ───────────────────────────────────────────────────
  const handleMonthChange = (monthVal) => {
    setSelectedMonth(monthVal);
    if (!monthVal) return;
    const [year, month] = monthVal.split("-").map(Number);
    const first = `${year}-${String(month).padStart(2, "0")}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const last = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
    setFromDate(first);
    setToDate(last);
    if (selectedEmp) loadAttendance(selectedEmp, first, last);
  };

  // ── Download excel Api ───────────────────────────────────────────────────


  const [exporting, setExporting] = useState(false);

  const exportAttendanceExcel = async (fromdate, todate, location) => {
  try {
    setExporting(true);

    const formattedFrom = new Date(fromdate).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).replace(/ /g, "-");

    const formattedTo = new Date(todate).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).replace(/ /g, "-");

    const response = await fetch(
      `${API_BASE_URL}/downloadOverrideExcel?fromDate=${formattedFrom}&toDate=${formattedTo}&adminEmpId=${user.employeeId}&collegeLocation=${location}`,
    );

    if (!response.ok) {
      throw new Error("Failed to download Excel");
    }

    const blob = await response.blob();

    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "Attendance_Override_Info.xlsx";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    window.URL.revokeObjectURL(url);

    setExporting(false);
    toast.success("Attendance Modifier Excel downloaded successfully");

  } catch (error) {
    console.error(error);
    toast.error("Failed to download Attendance Modifier Excel");
  }finally {
    setExporting(false);
  }
  
};


  // ── Save override (now receives reason in payload) ───────────────────────
  const handleSave = async (payload) => {
    setSavingRow(payload.date);
    try {
      const res = await fetch(`${API_BASE_URL}/attendanceManualOverride`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.status === 400) {
        try {
          const text = await res.text();
          toast.error(text);
        } catch (err) {
          console.error(err);
          toast.error("Failed to update");
        }
        return;
      }

      if (!res.ok) {
        let msg = "Failed to update";
        try { const d = await res.json(); msg = d.message || msg; } catch {
          toast.error(msg);
        }
        return;
      }

      toast.success(`Updated ${payload.date} successfully`);
      await loadAttendance(selectedEmp, fromDate, toDate);
    } catch (err) {
      console.error(err);
      toast.error("Network error. Please try again.");
    } finally {
      setSavingRow(null);
    }
  };

  // ── Locations for filter ─────────────────────────────────────────────────
  const locations = useMemo(() => {
    const locs = new Set(
      allEmployees.map((e) => e.collegeLocation || e.collageLocation || "").filter(Boolean)
    );
    return ["All", ...locs];
  }, [allEmployees]);

  const empName = selectedEmp
    ? (selectedEmp.adminName || `${selectedEmp.firstName || ""} ${selectedEmp.lastName || ""}`).trim()
    : "";
  const empId = selectedEmp ? (selectedEmp.empId || selectedEmp.userName) : "";

  // ── Stats ────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const counts = { Present: 0, Absent: 0, CL: 0, ML: 0, OD: 0, Holiday: 0, Off: 0 };
    records.forEach((r) => {
      const s = r.AttendanceDetails?.status || "";
      const key = Object.keys(counts).find((k) => k.toLowerCase() === s.toLowerCase());
      if (key) counts[key]++;
    });
    return counts;
  }, [records]);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{
      display: "flex", height: "100vh", overflow: "hidden",
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
      background: "#f8fafc",
    }}>

      {/* ── LEFT PANEL ─────────────────────────────────────────────────── */}
      <div style={{
        width: 300, minWidth: 300, height: "100vh",
        display: "flex", flexDirection: "column",
        background: "white",
        borderRight: "1px solid #e2e8f0",
        boxShadow: "2px 0 12px rgba(0,0,0,0.04)",
      }}>
        {/* Header */}
        <div style={{
          padding: "20px 16px 14px",
          borderBottom: "1px solid #f1f5f9",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: "linear-gradient(135deg,#6366f1,#818cf8)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>
                Employees
              </div>
              <div style={{ fontSize: 11, color: "#94a3b8" }}>
                {loadingEmps ? "Loading…" : `${filteredEmployees.length} of ${allEmployees.length}`}
              </div>
            </div>
          </div>

          {/* Search */}
          <div style={{ position: "relative", marginBottom: 10 }}>
            <svg style={{
              position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
              color: "#94a3b8",
            }} width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
            <input
              placeholder="Search name or ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%", padding: "8px 10px 8px 30px",
                borderRadius: 8, border: "1.5px solid #e2e8f0",
                fontSize: 12, color: "#334155", outline: "none",
                boxSizing: "border-box",
                transition: "border-color 0.15s",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
              onBlur={(e)  => (e.target.style.borderColor = "#e2e8f0")}
            />
          </div>

          {/* Location filter */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {locations.map((loc) => (
              <button
                key={loc}
                onClick={() => setLocationFilter(loc)}
                style={{
                  padding: "4px 12px", borderRadius: 20, border: "none",
                  fontSize: 11, fontWeight: 600, cursor: "pointer",
                  background: locationFilter === loc ? "#6366f1" : "#f1f5f9",
                  color: locationFilter === loc ? "white" : "#64748b",
                  transition: "all 0.15s",
                }}
              >
                {loc}
              </button>
            ))}
          </div>
        </div>

        {/* Employee list */}
        <div style={{ flex: 1, overflowY: "auto", padding: "10px 10px" }}>
          {loadingEmps ? (
            <div style={{ textAlign: "center", padding: 40, color: "#94a3b8", fontSize: 13 }}>
              Loading employees…
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: "#94a3b8", fontSize: 13 }}>
              No employees found
            </div>
          ) : (
            filteredEmployees.map((emp) => (
              <EmployeeCard
                key={emp.id}
                emp={emp}
                isAdmin={emp._isAdmin}
                isSelected={selectedEmp?.id === emp.id}
                onClick={handleSelectEmployee}
              />
            ))
          )}
        </div>
      </div>

      {/* ── RIGHT PANEL ────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Top bar */}
        <div style={{
          padding: "16px 24px",
          background: "white",
          borderBottom: "1px solid #e2e8f0",
          display: "flex", alignItems: "center",
          flexWrap: "wrap", gap: 16,
          boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
        }}>
          {/* Title */}
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#1e293b" }}>
              Attendance Modifier
            </div>
            {selectedEmp ? (
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                Editing: <strong style={{ color: "#6366f1" }}>{empName}</strong>
                <span style={{ marginLeft: 6, color: "#94a3b8" }}>({empId})</span>
              </div>
            ) : (
              <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
                Select an employee to begin
              </div>
            )}

          </div>
                  

          {/* Date pickers + Load */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>

            {/* Month quick-picker */}
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <label style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
                Month
              </label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => handleMonthChange(e.target.value)}
                style={{
                  padding: "7px 10px", borderRadius: 8,
                  border: "1.5px solid #6366f1",
                  fontSize: 12, color: "#6366f1", outline: "none",
                  cursor: "pointer", fontWeight: 600,
                  background: "#eef2ff",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#4f46e5")}
                onBlur={(e)  => (e.target.style.borderColor = "#6366f1")}
              />
            </div>

            {/* Divider */}
            <div style={{
              width: 1, height: 36, background: "#e2e8f0",
              alignSelf: "flex-end", marginBottom: 2,
            }} />

            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <label style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
                From
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                style={{
                  padding: "7px 10px", borderRadius: 8,
                  border: "1.5px solid #e2e8f0",
                  fontSize: 12, color: "#334155", outline: "none",
                  cursor: "pointer",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
                onBlur={(e)  => (e.target.style.borderColor = "#e2e8f0")}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <label style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
                To
              </label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                style={{
                  padding: "7px 10px", borderRadius: 8,
                  border: "1.5px solid #e2e8f0",
                  fontSize: 12, color: "#334155", outline: "none",
                  cursor: "pointer",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
                onBlur={(e)  => (e.target.style.borderColor = "#e2e8f0")}
              />
            </div>

            <button
              onClick={handleLoad}
              disabled={!selectedEmp || loadingRecords}
              style={{
                padding: "8px 20px", borderRadius: 8, border: "none",
                background: selectedEmp && !loadingRecords ? "#6366f1" : "#e2e8f0",
                color: selectedEmp && !loadingRecords ? "white" : "#94a3b8",
                fontSize: 13, fontWeight: 600,
                cursor: selectedEmp && !loadingRecords ? "pointer" : "not-allowed",
                transition: "all 0.15s", marginTop: 14,
                display: "flex", alignItems: "center", gap: 6,
              }}
            >
              {loadingRecords ? (
                <>
                  <span style={{
                    width: 12, height: 12, border: "2px solid rgba(255,255,255,0.3)",
                    borderTopColor: "white", borderRadius: "50%",
                    display: "inline-block", animation: "spin 0.7s linear infinite",
                  }} />
                  Loading…
                </>
              ) : "Load"}
            </button>

            <button
              onClick={() => exportAttendanceExcel(fromDate, toDate, locationFilter)}
              disabled={!selectedEmp || loadingRecords}
              style={{
                padding: "8px 14px", borderRadius: 8, border: "1.5px solid #e2e8f0",
                background: selectedEmp && !loadingRecords ? "white" : "#f8fafc",
                color: selectedEmp && !loadingRecords ? "#334155" : "#94a3b8",
                fontSize: 13, fontWeight: 600,
                cursor: selectedEmp && !loadingRecords ? "pointer" : "not-allowed",
                transition: "all 0.15s", marginTop: 14,
                display: "flex", alignItems: "center", gap: 6,
              }}
            >
              <Download size={16} />
              {exporting ? "Exporting..." : `Export${locationFilter !== "All" ? ` (${locationFilter})` : ""}`}
            </button>
          </div>
        </div>

        {/* Stats bar */}
        {records.length > 0 && (
          <div style={{
            padding: "10px 24px",
            background: "#f8fafc",
            borderBottom: "1px solid #e2e8f0",
            display: "flex", gap: 16, flexWrap: "wrap",
          }}>
            {Object.entries(stats).filter(([, v]) => v > 0).map(([k, v]) => {
              const s = getStatusStyle(k);
              return (
                <div key={k} style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "4px 12px", borderRadius: 20,
                  background: s.bg,
                }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: s.dot }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: s.color }}>{k}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: s.color }}>{v}</span>
                </div>
              );
            })}
            <div style={{ marginLeft: "auto", fontSize: 11, color: "#94a3b8", alignSelf: "center" }}>
              {records.length} records
            </div>
          </div>
        )}

        {/* Table */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0" }}>
          {!selectedEmp ? (
            <div style={{
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              height: "100%", gap: 16, color: "#94a3b8",
            }}>
              <div style={{
                width: 64, height: 64, borderRadius: 16,
                background: "#f1f5f9",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                  stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#64748b" }}>
                  No employee selected
                </div>
                <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>
                  Select an employee from the left panel to view attendance
                </div>
              </div>
            </div>
          ) : loadingRecords ? (
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              height: "100%", gap: 12, color: "#94a3b8", fontSize: 14,
            }}>
              <span style={{
                width: 20, height: 20, border: "2.5px solid #e2e8f0",
                borderTopColor: "#6366f1", borderRadius: "50%",
                display: "inline-block", animation: "spin 0.7s linear infinite",
              }} />
              Loading attendance records…
            </div>
          ) : records.length === 0 ? (
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              height: "100%", color: "#94a3b8", fontSize: 14,
            }}>
              No records found for this date range
            </div>
          ) : (
            <table style={{
              width: "100%", borderCollapse: "collapse",
              fontSize: 13,
            }}>
              <thead>
                <tr style={{
                  background: "#f8fafc",
                  position: "sticky", top: 0, zIndex: 10,
                  borderBottom: "2px solid #e2e8f0",
                }}>
                  {["Date", "Status", "Punch In / Out", "Work Duration",
                    "Session 1", "Session 2", "Override To", "Actions"].map((h) => (
                    <th key={h} style={{
                      padding: "11px 14px", textAlign: "left",
                      fontSize: 11, fontWeight: 700, color: "#64748b",
                      textTransform: "uppercase", letterSpacing: 0.5,
                      whiteSpace: "nowrap",
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <AttendanceRow
                    key={record.Date}
                    record={record}
                    empName={empName}
                    empId={empId}
                    onSave={handleSave}
                    isSaving={savingRow === record.Date}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes modalIn {
          from { opacity: 0; transform: translateY(-10px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
        select { appearance: auto; }
      `}</style>
    </div>
  );
}
