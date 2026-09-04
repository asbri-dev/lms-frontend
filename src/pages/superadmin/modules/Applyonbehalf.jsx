// ==============================
// ApplyOnBehalf.jsx
// SuperAdmin: apply Leave / On Duty / Permission on behalf of any employee
// ==============================

import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "../../../auth/useAuth";
import { API_BASE_URL } from "../../../config/api";
import DatePicker from "react-datepicker";
import { format, eachDayOfInterval, isSameDay, isSunday } from "date-fns";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from "react-hot-toast";
import {
  Search,
  MapPin,
  User,
  Users,
  CalendarDays,
  FileText,
  Clock,
  Upload,
  X,
  CheckCircle2,
} from "lucide-react";

/* ================= SHARED CONFIG ================= */

const TIME_SLOTS = {
  Chittor: {
    lateIn: { from: "09:30:00", to: "10:30:00" },
    earlyOut: { from: "15:30:00", to: "16:30:00" },
  },
  Palakkad: {
    lateIn: { from: "09:30:00", to: "10:30:00" },
    earlyOut: { from: "14:30:00", to: "15:30:00" },
  },
};

const getCampusFromEmpId = (empId) => {
  if (!empId) return null;
  const id = empId.toUpperCase();
  if (id.includes("AREC")) return "Chittor";
  if (id.includes("AREP")) return "Palakkad";
  return null;
};

const getSessionOptions = (empId) => {
  const isPalakkad = (empId || "").toUpperCase().includes("AREP");
  return isPalakkad
    ? [
        { value: "1", label: "Session 1 (9:30 – 12:30)" },
        { value: "2", label: "Session 2 (12:31 – 15:30)" },
      ]
    : [
        { value: "1", label: "Session 1 (9:30 – 13:00)" },
        { value: "2", label: "Session 2 (13:01 – 16:30)" },
      ];
};

const fullName = (f) =>
  [f.firstName, f.middleName, f.lastName].filter(Boolean).join(" ").trim();

const TABS = [
  { key: "leave", label: "Leave" },
  { key: "od", label: "On Duty" },
  { key: "permission", label: "Permission" },
];

/* =========================================================
   EMPLOYEE INITIALS AVATAR
   ========================================================= */
const InitialsAvatar = ({ name, size = 40 }) => {
  const initials = (name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
  return (
    <div
      style={{ width: size, height: size }}
      className="flex items-center justify-center rounded-full bg-gradient-to-br from-[#0f766e] to-[#0d9488] text-white text-sm font-semibold shrink-0"
    >
      {initials || "?"}
    </div>
  );
};

/* =========================================================
   LEAVE FORM
   ========================================================= */
const LeaveOnBehalfForm = ({ employee, dashboardDetails, dashboardLoading, refreshDashboard }) => {
  const [typeOfLeave, setTypeOfLeave] = useState("cl");
  const [leaveFrom, setLeaveFrom] = useState(null);
  const [leaveTo, setLeaveTo] = useState(null);
  const [sessionFrom, setSessionFrom] = useState("1");
  const [sessionTo, setSessionTo] = useState("2");
  const [reasonForLeave, setReasonForLeave] = useState("");

  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [eligible, setEligible] = useState(false);
  const [message, setMessage] = useState("");

  const sessionOptions = useMemo(() => getSessionOptions(employee.empId), [employee.empId]);

  const noOfDays = useMemo(() => {
    if (!leaveFrom || !leaveTo) return 0;
    const days = eachDayOfInterval({ start: leaveFrom, end: leaveTo });
    if (days.length === 0) return 0;

    if (isSameDay(leaveFrom, leaveTo)) {
      if (sessionFrom === "1" && sessionTo === "1") return 0.5;
      if (sessionFrom === "2" && sessionTo === "2") return 0.5;
      return 1;
    }

    let total = days.length;
    if (sessionFrom === "2") total -= 0.5;
    if (sessionTo === "1") total -= 0.5;
    return total;
  }, [leaveFrom, leaveTo, sessionFrom, sessionTo]);

  const checkLeaveBalance = useCallback(() => {
    if (!dashboardDetails) return null;

    if (typeOfLeave === "ml" && dashboardDetails.ml <= 0) {
      return "No Medical Leave balance available";
    }

    const clBalance = dashboardDetails.cl - dashboardDetails.pendingCl || 0;
    const mlBalance = dashboardDetails.ml - dashboardDetails.pendingMl || 0;

    if (noOfDays > clBalance && typeOfLeave === "cl") {
      return "All available Casual Leaves already applied.";
    }
    if (noOfDays > mlBalance && typeOfLeave === "ml") {
      return "All available Medical Leaves already applied.";
    }
    if (typeOfLeave === "cl" && dashboardDetails.cl <= 0) {
      return "No Casual Leave balance available";
    }

    return null;
  }, [typeOfLeave, dashboardDetails, noOfDays]);

  const validateEligibility = useCallback(() => {
    if (!leaveFrom || !leaveTo) return "Select dates";
    if (leaveTo < leaveFrom) return "Invalid date range";
    if (isSameDay(leaveFrom, leaveTo) && sessionFrom === "2" && sessionTo === "1") {
      return "Invalid session selections for single day leave";
    }
    return null;
  }, [leaveFrom, leaveTo, sessionFrom, sessionTo]);

  const runCheck = useCallback(async () => {
    try {
      setChecking(true);
      setEligible(false);

      const response = await fetch(`${API_BASE_URL}/checkLeave`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          empId: employee.empId,
          typeOfLeave,
          adminEmpId: employee.reportingManagerEmpId,
          noOfDays: String(noOfDays),
          leaveFrom: format(leaveFrom, "dd-MMM-yyyy"),
          leaveTo: format(leaveTo, "dd-MMM-yyyy"),
          leaveApplied: format(new Date(), "dd-MMM-yyyy"),
          sessionFrom,
          sessionTo,
        }),
      });

      const text = await response.text();
      let data = null;
      try {
        data = JSON.parse(text);
      } catch {
        /* non-JSON body */
      }

      if (response.status >= 500) {
        setMessage("Something went wrong. Try again later.");
        return;
      }
      if (!response.ok) {
        setMessage(data?.message || data?.error || text || "Eligibility failed");
        return;
      }

      setEligible(true);
      setMessage(data?.message || text || "Eligible");
    } catch {
      setMessage("Network error");
    } finally {
      setChecking(false);
    }
  }, [employee.empId, employee.reportingManagerEmpId, typeOfLeave, noOfDays, leaveFrom, leaveTo, sessionFrom, sessionTo]);

  useEffect(() => {
    if (!leaveFrom || !leaveTo) return;

    const balanceError = checkLeaveBalance();
    if (balanceError) {
      setMessage(balanceError);
      setEligible(false);
      return;
    }

    const errorMsg = validateEligibility();
    if (errorMsg) {
      setMessage(errorMsg);
      setEligible(false);
      return;
    }

    if (noOfDays <= 0) {
      setMessage("Invalid leave duration");
      return;
    }

    const timer = setTimeout(() => runCheck(), 400);
    return () => clearTimeout(timer);
  }, [leaveFrom, leaveTo, sessionFrom, sessionTo, typeOfLeave, noOfDays, checkLeaveBalance, validateEligibility, runCheck]);

  const resetForm = () => {
    setTypeOfLeave("cl");
    setLeaveFrom(null);
    setLeaveTo(null);
    setSessionFrom("1");
    setSessionTo("2");
    setReasonForLeave("");
    setEligible(false);
    setMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!eligible) {
      setMessage("Fix errors before submitting");
      return;
    }
    if (!reasonForLeave || reasonForLeave.length < 10) {
      setMessage("Reason must be at least 10 characters");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_BASE_URL}/applyLeaves`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          empId: employee.empId,
          typeOfLeave,
          adminEmpId: employee.reportingManagerEmpId,
          noOfDays: String(noOfDays),
          leaveFrom: format(leaveFrom, "dd-MMM-yyyy"),
          leaveTo: format(leaveTo, "dd-MMM-yyyy"),
          leaveApplied: format(new Date(), "dd-MMM-yyyy"),
          reasonForLeave,
          sessionFrom,
          sessionTo,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data?.message || "Submit failed");
        return;
      }

      toast.success(data?.message || `Leave applied for ${fullName(employee)} ✅`);
      resetForm();
      refreshDashboard();
    } catch {
      setMessage("Server error while submitting");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 bg-[#f0fdfa] border border-[#ccfbf1] rounded-xl px-3 sm:px-4 py-3">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 min-w-0">
          <User size={15} className="text-[#0f766e] shrink-0" />
          <span className="truncate">
            Reporting To:{" "}
            <span className="font-medium text-gray-800">
              {dashboardLoading ? "…" : dashboardDetails?.rmName || "—"}
            </span>{" "}
            {dashboardDetails?.rmId ? `(${dashboardDetails.rmId})` : ""}
          </span>
        </div>
        <div className="flex gap-2 sm:gap-3 text-xs sm:text-sm shrink-0">
          <span className="bg-[#0f766e] text-white px-2.5 py-0.5 rounded-full font-medium">
            CL: {dashboardLoading ? "…" : dashboardDetails?.cl ?? "—"}
          </span>
          <span className="bg-amber-500 text-white px-2.5 py-0.5 rounded-full font-medium">
            ML: {dashboardLoading ? "…" : dashboardDetails?.ml ?? "—"}
          </span>
        </div>
      </div>

      {message && (
        <div
          className={`px-3 sm:px-4 py-2.5 rounded-lg text-xs sm:text-sm font-medium ${
            message.toLowerCase().includes("eligible") || message.toLowerCase().includes("success")
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-600 border border-red-200"
          }`}
        >
          {message}
        </div>
      )}

      {checking && <p className="text-xs text-gray-400 animate-pulse">Checking eligibility...</p>}

      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Leave Type</label>
        <select
          value={typeOfLeave}
          onChange={(e) => setTypeOfLeave(e.target.value)}
          className="w-full mt-1.5 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#0f766e] focus:border-transparent"
        >
          <option value="cl">Casual Leave</option>
          {(dashboardDetails?.ml ?? 0) > 0 && <option value="ml">Medical Leave</option>}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
            <CalendarDays size={13} /> From Date
          </label>
          <DatePicker
            selected={leaveFrom}
            onChange={setLeaveFrom}
            dateFormat="dd-MMM-yyyy"
            placeholderText="Select date"
            className="w-full mt-1.5 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0f766e] focus:border-transparent"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Session From</label>
          <select
            value={sessionFrom}
            onChange={(e) => setSessionFrom(e.target.value)}
            className="w-full mt-1.5 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#0f766e] focus:border-transparent"
          >
            {sessionOptions.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
            <CalendarDays size={13} /> To Date
          </label>
          <DatePicker
            selected={leaveTo}
            onChange={setLeaveTo}
            minDate={leaveFrom}
            dateFormat="dd-MMM-yyyy"
            placeholderText="Select date"
            className="w-full mt-1.5 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0f766e] focus:border-transparent"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Session To</label>
          <select
            value={sessionTo}
            onChange={(e) => setSessionTo(e.target.value)}
            className="w-full mt-1.5 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#0f766e] focus:border-transparent"
          >
            {sessionOptions.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="inline-flex items-center gap-2 bg-[#f0fdfa] border border-[#ccfbf1] rounded-lg px-4 py-2 text-sm">
        <span className="text-gray-500">Total Days:</span>
        <span className="font-semibold text-[#0f766e] text-base">{noOfDays}</span>
      </div>

      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
          <FileText size={13} /> Reason
        </label>
        <textarea
          value={reasonForLeave}
          onChange={(e) => setReasonForLeave(e.target.value)}
          placeholder="Enter reason for leave..."
          rows={3}
          className="w-full mt-1.5 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-[#0f766e] focus:border-transparent"
        />
      </div>

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={resetForm}
          className="w-full sm:w-auto bg-gray-100 hover:bg-gray-200 active:scale-95 text-gray-600 px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
        >
          Reset
        </button>
        <button
          type="submit"
          disabled={!eligible || loading}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#0f766e] hover:bg-[#0d9488] active:scale-95 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
          {loading ? "Applying..." : "Apply Leave"}
        </button>
      </div>
    </form>
  );
};

/* =========================================================
   ON DUTY FORM
   ========================================================= */
const OdOnBehalfForm = ({ employee, refreshDashboard }) => {
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [sessionFrom, setSessionFrom] = useState("1");
  const [sessionTo, setSessionTo] = useState("2");
  const [reason, setReason] = useState("");
  const [file, setFile] = useState(null);

  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [eligible, setEligible] = useState(false);
  const [message, setMessage] = useState("");

  const totalDays = useMemo(() => {
    if (!fromDate || !toDate) return 0;
    const days = eachDayOfInterval({ start: fromDate, end: toDate }).filter((d) => !isSunday(d));
    if (days.length === 0) return 0;

    const isSame = format(fromDate, "yyyy-MM-dd") === format(toDate, "yyyy-MM-dd");
    if (isSame) {
      if (sessionFrom === "1" && sessionTo === "1") return 0.5;
      if (sessionFrom === "2" && sessionTo === "2") return 0.5;
      if (sessionFrom === "2" && sessionTo === "1") return 0;
      return 1;
    }

    let total = days.length;
    if (sessionFrom === "2") total -= 0.5;
    if (sessionTo === "1") total -= 0.5;
    return total;
  }, [fromDate, toDate, sessionFrom, sessionTo]);

  const validate = () => {
    if (!fromDate || !toDate) return "Select dates";
    if (toDate < fromDate) return "Invalid date range";
    const same = format(fromDate, "yyyy-MM-dd") === format(toDate, "yyyy-MM-dd");
    if (same && sessionFrom === "2" && sessionTo === "1") return "Invalid session selection";
    return null;
  };

  const resetForm = () => {
    setFromDate(null);
    setToDate(null);
    setSessionFrom("1");
    setSessionTo("2");
    setReason("");
    setFile(null);
    setEligible(false);
    setMessage("");
  };

  useEffect(() => {
    const runCheck = async () => {
      const error = validate();
      if (error) {
        setMessage(error);
        setEligible(false);
        return;
      }

      try {
        setChecking(true);
        setEligible(false);
        setMessage("");

        const response = await fetch(`${API_BASE_URL}/checkOdEligible`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            empId: employee.empId,
            adminEmpId: employee.reportingManagerEmpId,
            onDutyFrom: format(fromDate, "dd-MMM-yyyy"),
            onDutyTo: format(toDate, "dd-MMM-yyyy"),
            sessionFrom,
            sessionTo,
            appliedOn: format(new Date(), "dd-MMM-yyyy"),
          }),
        });

        const text = await response.text();
        let data = null;
        try {
          data = JSON.parse(text);
        } catch {
          /* non-JSON body */
        }

        if (response.status >= 500) {
          setMessage("Server error. Try later");
          return;
        }
        if (!response.ok) {
          setMessage(data?.message || text || "OD not allowed");
          resetForm();
          return;
        }

        setEligible(true);
        setMessage(data?.message || "Eligible");
      } catch {
        setMessage("Network error");
      } finally {
        setChecking(false);
      }
    };

    if (fromDate && toDate) runCheck();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromDate, toDate, sessionFrom, sessionTo, totalDays, employee.empId, employee.reportingManagerEmpId]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!eligible) {
      setMessage("Fix errors before submitting");
      return;
    }
    

    try {
      setLoading(true);

      const response = await fetch(`${API_BASE_URL}/applyOd`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          empId: employee.empId,
          adminEmpId: employee.reportingManagerEmpId,
          onDutyFrom: format(fromDate, "dd-MMM-yyyy"),
          onDutyTo: format(toDate, "dd-MMM-yyyy"),
          sessionFrom,
          sessionTo,
          appliedOn: format(new Date(), "dd-MMM-yyyy"),
          reason,
          noOfDays: totalDays,
          fileName: file?.name || null,
        }),
      });

      const text = await response.text();
      let data = null;
      try {
        data = JSON.parse(text);
      } catch {
        /* non-JSON body */
      }

      if (!response.ok) {
        setMessage(data?.message || text || "Submit failed");
        return;
      }

      toast.success(`OD applied for ${fullName(employee)} ✅`);
      resetForm();
      refreshDashboard();
    } catch {
      setMessage("Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {message && (
        <div className={`p-3 rounded-lg text-sm ${eligible ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
          {message}
        </div>
      )}
      {checking && <p className="text-sm text-gray-500">Checking eligibility...</p>}

      <div className="grid grid-cols-2 gap-4">
        <div className="relative">
          <CalendarDays className="absolute left-3 top-3 text-gray-400" size={16} />
          <DatePicker
            selected={fromDate}
            onChange={setFromDate}
            dateFormat="dd MMM yyyy"
            placeholderText="From Date"
            className="w-full pl-10 pr-3 py-2 rounded-lg bg-gray-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0d9488]"
          />
        </div>
        <div className="relative">
          <CalendarDays className="absolute left-3 top-3 text-gray-400" size={16} />
          <DatePicker
            selected={toDate}
            onChange={setToDate}
            minDate={fromDate}
            dateFormat="dd MMM yyyy"
            placeholderText="To Date"
            className="w-full pl-10 pr-3 py-2 rounded-lg bg-gray-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0d9488]"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <select
          value={sessionFrom}
          onChange={(e) => setSessionFrom(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-gray-50 shadow-sm focus:ring-2 focus:ring-[#0d9488]"
        >
          <option value="1">Session 1</option>
          <option value="2">Session 2</option>
        </select>
        <select
          value={sessionTo}
          onChange={(e) => setSessionTo(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-gray-50 shadow-sm focus:ring-2 focus:ring-[#0d9488]"
        >
          <option value="1">Session 1</option>
          <option value="2">Session 2</option>
        </select>
      </div>

      <div className="text-sm font-medium text-gray-700">
        Total Days: <span className="text-[#0f766e]">{totalDays}</span>
      </div>

      <div className="relative">
        <FileText className="absolute left-3 top-3 text-gray-400" size={16} />
        <textarea
          placeholder="Reason (optional)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          className="w-full pl-10 pr-3 py-2 rounded-lg bg-gray-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0d9488]"
        />
      </div>

      <div className="relative">
        <Upload className="absolute left-3 top-3 text-gray-400" size={16} />
        <input
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
          className="w-full pl-10 pr-3 py-2 rounded-lg bg-gray-50 shadow-sm cursor-pointer"
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={resetForm} className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition">
          Reset
        </button>
        <button
          type="submit"
          disabled={!eligible || loading}
          className="px-4 py-2 rounded-lg bg-[#0f766e] text-white hover:bg-[#0d9488] transition disabled:opacity-60"
        >
          {loading ? "Submitting..." : "Apply OD"}
        </button>
      </div>
    </form>
  );
};

/* =========================================================
   PERMISSION FORM
   ========================================================= */
const PermissionOnBehalfForm = ({ employee, refreshDashboard }) => {
  const campus = useMemo(() => getCampusFromEmpId(employee.empId), [employee.empId]);

  const [permissionType, setPermissionType] = useState("lateIn");
  const [permissionDate, setPermissionDate] = useState(null);
  const [permissionFrom, setPermissionFrom] = useState("");
  const [permissionTo, setPermissionTo] = useState("");
  const [reasonForPermission, setReasonForPermission] = useState("");

  const [checking, setChecking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [eligible, setEligible] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const slot = TIME_SLOTS[campus]?.[permissionType];
    if (slot) {
      setPermissionFrom(slot.from);
      setPermissionTo(slot.to);
    }
  }, [campus, permissionType]);

  const isFormValid = () => {
    if (!permissionDate) return "Select permission date";
    if (!permissionFrom || !permissionTo) return "Invalid time slot";
    return null;
  };

  const buildPayload = () => ({
    empId: employee.empId,
    from: permissionFrom,
    to: permissionTo,
    permissionType,
    permissionDate: format(permissionDate, "dd-MMM-yyyy"),
  });

  const resetForm = () => {
    setPermissionType("lateIn");
    setPermissionDate(null);
    setReasonForPermission("");
    setEligible(false);
    setMessage("");
  };

  useEffect(() => {
    if (!permissionDate || !permissionFrom || !permissionTo) {
      setEligible(false);
      return;
    }

    const errorMsg = isFormValid();
    if (errorMsg) {
      setMessage(errorMsg);
      setEligible(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setChecking(true);
        setEligible(false);
        setMessage("");

        const response = await fetch(`${API_BASE_URL}/checkPr`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(buildPayload()),
        });

        const text = await response.text();
        let data = null;
        try {
          data = JSON.parse(text);
        } catch {
          /* non-JSON body */
        }

        if (response.status >= 500) {
          setMessage("Server error. Please try again later.");
          return;
        }
        if (!response.ok) {
          setMessage(data?.message || text || "Permission not allowed");
          return;
        }

        setEligible(true);
        setMessage(data?.message || text || "Eligible");
      } catch {
        setMessage("Network error");
      } finally {
        setChecking(false);
      }
    }, 500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permissionDate, permissionType, permissionFrom, permissionTo]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!eligible) {
      setMessage("Please fix validation errors");
      return;
    }
    if (!reasonForPermission.trim()) {
      setMessage("Enter reason for permission");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_BASE_URL}/applyPermission`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...buildPayload(), reasonForPermission }),
      });

      const text = await response.text();
      let data = null;
      try {
        data = JSON.parse(text);
      } catch {
        /* non-JSON body */
      }

      if (!response.ok) {
        setMessage(data?.message || text || "Submission failed");
        return;
      }

      toast.success(`Permission submitted for ${fullName(employee)} ✅`);
      resetForm();
      refreshDashboard();
    } catch {
      setMessage("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {!campus && (
        <div className="p-3 rounded-lg text-sm bg-amber-50 text-amber-700 border border-amber-200">
          Could not determine campus from employee ID ({employee.empId}) — time slots may be unavailable.
        </div>
      )}

      {message && (
        <div
          className={`p-3 rounded-lg text-sm ${
            message.toLowerCase().includes("eligible") ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          }`}
        >
          {message}
        </div>
      )}
      {checking && <div className="text-sm text-gray-500">Checking availability...</div>}

      <div>
        <label className="text-sm font-medium text-gray-600 block mb-2">Permission Type</label>
        <div className="flex gap-3">
          {["lateIn", "earlyOut"].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setPermissionType(type)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                permissionType === type ? "bg-[#0f766e] text-white shadow" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {type === "lateIn" ? "Late In" : "Early Out"}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-600 mb-2 block">Permission Date</label>
        <div className="relative">
          <CalendarDays className="absolute left-3 top-3 text-gray-400" size={16} />
          <DatePicker
            selected={permissionDate}
            onChange={setPermissionDate}
            dateFormat="dd/MM/yyyy"
            placeholderText="Select date"
            className="w-full pl-10 pr-3 py-2 rounded-lg bg-gray-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0d9488] transition"
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-600 mb-2 block">Time Slot</label>
        <div className="grid grid-cols-2 gap-4">
          <div className="relative">
            <Clock size={16} className="absolute left-3 top-3 text-gray-400" />
            <input
              type="time"
              value={permissionFrom}
              readOnly
              className="w-full pl-10 pr-3 py-2 rounded-lg bg-gray-100 shadow-sm text-gray-600"
            />
          </div>
          <div className="relative">
            <Clock size={16} className="absolute left-3 top-3 text-gray-400" />
            <input
              type="time"
              value={permissionTo}
              readOnly
              className="w-full pl-10 pr-3 py-2 rounded-lg bg-gray-100 shadow-sm text-gray-600"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-600 mb-2 block">Reason</label>
        <div className="relative">
          <FileText className="absolute left-3 top-3 text-gray-400" size={16} />
          <textarea
            value={reasonForPermission}
            onChange={(e) => setReasonForPermission(e.target.value)}
            rows={3}
            placeholder="Enter reason"
            className="w-full pl-10 pr-3 py-2 rounded-lg bg-gray-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0d9488] transition"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={resetForm} className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition">
          Reset
        </button>
        <button
          type="submit"
          disabled={!eligible || loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0f766e] text-white hover:bg-[#0d9488] transition disabled:opacity-60"
        >
          {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
          {loading ? "Submitting..." : "Submit"}
        </button>
      </div>
    </form>
  );
};

/* =========================================================
   MAIN PAGE — sidebar (full list) + main content
   ========================================================= */
const ApplyOnBehalf = () => {
  const { user } = useAuth();

  const [faculty, setFaculty] = useState([]);
  const [loadingFaculty, setLoadingFaculty] = useState(true);
  const [facultyError, setFacultyError] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("ALL");

  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [activeTab, setActiveTab] = useState("leave");

  const [dashboardDetails, setDashboardDetails] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  
  const employeeId = user?.employeeId;

  /* ---------- fetch faculty list ---------- */
  const fetchFaculty = useCallback(async () => {
    try {
      setLoadingFaculty(true);
      setFacultyError(null);
      const res = await fetch(`${API_BASE_URL}/getFacultyAndAdmin?rmEmpId=${user?.employeeId}`, {
        headers: { Authorization: `Bearer ${sessionStorage.getItem("authToken")}` },
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const json = await res.json();
      setFaculty(json.FacultyDetails || []);
    } catch (e) {
      setFacultyError(e.message || "Failed to load faculty");
    } finally {
      setLoadingFaculty(false);
    }
  }, [employeeId]);

  useEffect(() => {
    fetchFaculty();
  }, [fetchFaculty]);

  /* ---------- fetch dashboard details (balance) for selected employee ---------- */
  const fetchDashboard = useCallback(async (empId) => {
    if (!empId) return;
    try {
      setDashboardLoading(true);
      const res = await fetch(`${API_BASE_URL}/getDashboardDetails?empId=${empId}`);
      const data = await res.json();
      setDashboardDetails({
        cl: data.basicDetails.casualLeaves,
        ml: data.basicDetails.medicalLeaves,
        rmName: data.basicDetails.rmName,
        rmId: data.basicDetails.rmEmployeeId,
        pendingCl: data.basicDetails.pendingLeaves,
        pendingMl: data.basicDetails.pendingMedicalLeaves,
      });
    } catch {
      setDashboardDetails(null);
    } finally {
      setDashboardLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedEmployee?.empId) fetchDashboard(selectedEmployee.empId);
  }, [selectedEmployee?.empId, fetchDashboard]);

const empId = selectedEmployee?.empId;

const refreshDashboard = useCallback(() => {
  if (empId) {
    fetchDashboard(empId);
  }
}, [empId, fetchDashboard]);
  /* ---------- filtered list ---------- */
  const filteredFaculty = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return faculty.filter((f) => {
      const matchesLocation = locationFilter === "ALL" || f.collegeLocation === locationFilter;
      if (!matchesLocation) return false;
      if (!term) return true;
      return fullName(f).toLowerCase().includes(term) || (f.empId || "").toLowerCase().includes(term);
    });
  }, [faculty, searchTerm, locationFilter]);

  const handleSelectEmployee = (emp) => {
    setSelectedEmployee(emp);
    setActiveTab("leave");
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-5 sm:py-8">
      {/* Header */}
      <div className="mb-5"> 
        <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-amber-600 font-semibold mb-1"> 
          <Users size={14} /> SuperAdmin
        </div>
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">Apply On Behalf</h2>
        <p className="text-sm text-gray-500 mt-1">
          Pick an employee, then submit Leave, On Duty, or Permission requests for them directly.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-5 items-start">
        {/* ============ LEFT: full employee directory ============ */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col lg:sticky lg:top-5 lg:max-h-[calc(100vh-3rem)]">
          <div className="p-4 space-y-3 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search name or employee ID..."
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0f766e] focus:border-transparent"
              />
            </div>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#0f766e] focus:border-transparent appearance-none"
              >
                <option value="ALL">All Locations</option>
                <option value="CHITTOOR">Chittoor</option>
                <option value="PALAKKAD">Palakkad</option>
              </select>
            </div>
            <p className="text-xs text-gray-400">
              {loadingFaculty ? "Loading..." : `${filteredFaculty.length} of ${faculty.length} employees`}
            </p>
          </div>

          {/* Full scrollable directory — no cramped box, fills the sidebar height */}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100 lg:min-h-[400px]">
            {loadingFaculty && (
              <div className="p-4 text-sm text-gray-400 animate-pulse">Loading employees...</div>
            )}

            {!loadingFaculty && facultyError && (
              <div className="p-4 text-sm text-red-600 flex items-center justify-between">
                <span>{facultyError}</span>
                <button onClick={fetchFaculty} className="text-xs font-medium text-[#0f766e] hover:underline">
                  Retry
                </button>
              </div>
            )}

            {!loadingFaculty && !facultyError && filteredFaculty.length === 0 && (
              <div className="p-4 text-sm text-gray-400">No employees match your search.</div>
            )}

            {!loadingFaculty &&
              !facultyError &&
              filteredFaculty.map((f) => {
                const isSelected = selectedEmployee?.empId === f.empId;
                return (
                  <button
                    key={f.empId}
                    type="button"
                    onClick={() => handleSelectEmployee(f)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition border-l-4 ${
                      isSelected ? "bg-[#f0fdfa] border-l-[#0f766e]" : "border-l-transparent hover:bg-gray-50"
                    }`}
                  >
                    <InitialsAvatar name={fullName(f)} size={34} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-800 truncate">{fullName(f)}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {f.empId} · {f.facultyDept}
                      </p>
                    </div>
                    <span className="text-[10px] font-semibold uppercase text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded shrink-0">
                      {f.collegeLocation === "CHITTOOR" ? "CTR" : f.collegeLocation === "PALAKKAD" ? "PKD" : "—"}
                    </span>
                    {isSelected && <CheckCircle2 size={16} className="text-[#0f766e] shrink-0" />}
                  </button>
                );
              })}
          </div>
        </div>

        {/* ============ RIGHT: acting-on-behalf card + tabs + form ============ */}
        <div className="space-y-5">
          {selectedEmployee ? (
            <>
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-5 flex items-center gap-3">
                <InitialsAvatar name={fullName(selectedEmployee)} size={44} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-800 truncate">
                    Acting on behalf of {fullName(selectedEmployee)}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {selectedEmployee.empId} · {selectedEmployee.designation || "—"} ·{" "}
                    {selectedEmployee.facultyDept} · {selectedEmployee.collegeLocation}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedEmployee(null)}
                  className="text-gray-400 hover:text-gray-600 shrink-0"
                  title="Clear selection"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-6 space-y-5">
                <div className="flex gap-2">
                  {TABS.map((t) => (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setActiveTab(t.key)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                        activeTab === t.key ? "bg-[#0f766e] text-white shadow" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {activeTab === "leave" && (
                  <LeaveOnBehalfForm
                    key={`leave-${selectedEmployee.empId}`}
                    employee={selectedEmployee}
                    dashboardDetails={dashboardDetails}
                    dashboardLoading={dashboardLoading}
                    refreshDashboard={refreshDashboard}
                  />
                )}
                {activeTab === "od" && (
                  <OdOnBehalfForm
                    key={`od-${selectedEmployee.empId}`}
                    employee={selectedEmployee}
                    refreshDashboard={refreshDashboard}
                  />
                )}
                {activeTab === "permission" && (
                  <PermissionOnBehalfForm
                    key={`permission-${selectedEmployee.empId}`}
                    employee={selectedEmployee}
                    refreshDashboard={refreshDashboard}
                  />
                )}
              </div>
            </>
          ) : (
            <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-10 text-center text-sm text-gray-400 lg:min-h-[400px] flex items-center justify-center">
              Select an employee from the list to apply Leave, On Duty, or Permission on their behalf.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApplyOnBehalf;
