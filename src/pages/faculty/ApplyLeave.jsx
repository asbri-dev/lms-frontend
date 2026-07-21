// ==============================
// ApplyLeave.jsx (Final Clean Version)
// ==============================

import { useState, useEffect, useMemo, useCallback,  } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import { CalendarDays, FileText, User } from "lucide-react";
import DatePicker from "react-datepicker";
import {
  format,
  eachDayOfInterval,
  isSameDay,

} from "date-fns";
import "react-datepicker/dist/react-datepicker.css";
import { API_BASE_URL } from "../../config/api";
import { toast } from "react-hot-toast";
const ApplyLeave = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  /* ================= STATE ================= */

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

  const [leaveBalance, setLeaveBalance] = useState({
    cl: 0,
    ml: 0,
    rmName: "",
    rmId: "",
    casualLeaves: 0,
    medicalLeaves: 0,
  });
   /* ================= CALCULATE DAYS ================= */

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
  /* ================= BALANCE VALIDATION ================= */

const checkLeaveBalance = useCallback(() => {
  if (typeOfLeave === "ml" && leaveBalance.ml <= 0) {
    return "No Medical Leave balance available";
  }
  

  const clBalance = leaveBalance.cl-leaveBalance.casualLeaves || 0;
  const mlBalance = leaveBalance.ml-leaveBalance.medicalLeaves || 0;
  if(noOfDays > clBalance&& typeOfLeave === "cl") {
    return "All available Casual Leaves already applied.";
  }
 if(noOfDays >mlBalance && typeOfLeave === "ml") {
    return "All available Medical Leaves already applied.";
  }
  if (typeOfLeave === "cl" && leaveBalance.cl <= 0) {
    return "No Casual Leave balance available";
  }

  return null;
}, [typeOfLeave, leaveBalance,noOfDays]);

  /* ================= LOAD DASHBOARD ================= */

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/getDashboardDetails?empId=${user.employeeId}`
        );
        const data = await res.json();

        setLeaveBalance({
          cl: data.basicDetails.casualLeaves,
          ml: data.basicDetails.medicalLeaves,
          rmName: data.basicDetails.rmName,
          rmId: data.basicDetails.rmEmployeeId,
          casualLeaves: data.basicDetails.pendingLeaves,
          medicalLeaves: data.basicDetails.pendingMedicalLeaves,
        });
      } catch {
        console.error("Dashboard load failed");
      }
    };

    fetchDashboard();
  }, [user.employeeId]);

 

  /* ================= VALIDATION (NO REASON) ================= */

  const validateEligibility = useCallback(() => {
    if (!leaveFrom || !leaveTo) return "Select dates";
    if (leaveTo < leaveFrom) return "Invalid date range";

    if (
      isSameDay(leaveFrom, leaveTo) &&
      sessionFrom === "2" &&
      sessionTo === "1"
    ) {
      return "Invalid session selections for single day leave";
    }
    

    return null;
  }, [leaveFrom, leaveTo, sessionFrom, sessionTo]);

  /* ================= API CALL ================= */

  const runCheck = useCallback(async () => {
    try {
      setChecking(true);
      setEligible(false);

      const response = await fetch(
        `${API_BASE_URL}/checkLeaveEligibe`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            empId: user.employeeId,
            typeOfLeave,
            adminEmpId: user.adminId,
            noOfDays: String(noOfDays),
            leaveFrom: format(leaveFrom, "dd-MMM-yyyy"),
            leaveTo: format(leaveTo, "dd-MMM-yyyy"),
            leaveApplied: format(new Date(), "dd-MMM-yyyy"),
            sessionFrom,
            sessionTo,
          }),
        }
      );

      let data = null;
      let text = "";
      text = await response.text();

      if (response.status >= 500) {
        setMessage("Something went wrong. Try again later.");
        return;
      }

      if (!response.ok) {
        setMessage(
          data?.message ||
          data?.error ||
          text ||
          "Eligibility failed"
        );
        return;
      }

      setEligible(true);
      toast.success(data?.message || text || "Eligible");
      setMessage(data?.message || text || "Eligible");

    } catch {
      setMessage("Network error");
    } finally {
      setChecking(false);
    }
  }, [user.employeeId, typeOfLeave, user.adminId, noOfDays, leaveFrom, leaveTo, sessionFrom, sessionTo]);

  /* ================= DEBOUNCED CHECK ================= */

  useEffect(() => {
    if (!leaveFrom || !leaveTo) return;
     const balanceError = checkLeaveBalance();
  if (balanceError) {
    setMessage(balanceError);
    setEligible(false);
    return; // 🚫 stops API call
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
 

    const timer = setTimeout(() => {
      runCheck();
    }, 400);

    return () => clearTimeout(timer);

  }, [
    leaveFrom,
    leaveTo,
    sessionFrom,
    sessionTo,
    typeOfLeave,
    noOfDays,
    checkLeaveBalance,
    runCheck,
    validateEligibility,

  ]);

  /* ================= SUBMIT ================= */

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

      const response = await fetch(
        `${API_BASE_URL}/applyLeaves`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            empId: user.employeeId,
            typeOfLeave,
            adminEmpId: user.adminId,
            noOfDays: String(noOfDays),
            leaveFrom: format(leaveFrom, "dd-MMM-yyyy"),
            leaveTo: format(leaveTo, "dd-MMM-yyyy"),
            leaveApplied: format(new Date(), "dd-MMM-yyyy"),
            reasonForLeave,
            sessionFrom,
            sessionTo,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data?.message || "Submit failed");
        return;
      }

      setMessage("Leave applied successfully ✅");
      toast.success(data?.message || "Leave applied successfully ✅");

      setTimeout(() => navigate("/faculty/dashboard"), 1500);

    } catch {
      setMessage("Server error while submitting");
    } finally {
      setLoading(false);
    }
  };

  /* ================= UI ================= */

  

return (
  <div className="max-w-2xl mx-auto px-3 sm:px-4 py-5 sm:py-8">

    {/* Header */}
    <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 sm:mb-5">Apply Leave</h2>

    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-6 space-y-5">

      {/* Leave Balance */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 bg-[#f0f3fb] border border-[#dde3f3] rounded-xl px-3 sm:px-4 py-3">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 min-w-0">
          <User size={15} className="text-[#2b3c6b] shrink-0" />
          <span className="truncate">Reporting To: <span className="font-medium text-gray-800">{leaveBalance.rmName}</span> ({leaveBalance.rmId})</span>
        </div>
        <div className="flex gap-2 sm:gap-3 text-xs sm:text-sm shrink-0">
          <span className="bg-[#2b3c6b] text-white px-2.5 py-0.5 rounded-full font-medium">CL: {leaveBalance.cl}</span>
          <span className="bg-[#3f548f] text-white px-2.5 py-0.5 rounded-full font-medium">ML: {leaveBalance.ml}</span>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`px-3 sm:px-4 py-2.5 rounded-lg text-xs sm:text-sm font-medium ${
          message.toLowerCase().includes("eligible") || message.toLowerCase().includes("success")
            ? "bg-green-50 text-green-700 border border-green-200"
            : "bg-red-50 text-red-600 border border-red-200"
        }`}>
          {message}
        </div>
      )}

      {checking && (
        <p className="text-xs text-gray-400 animate-pulse">Checking eligibility...</p>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Leave Type */}
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Leave Type</label>
          <select
            value={typeOfLeave}
            onChange={(e) => setTypeOfLeave(e.target.value)}
            className="w-full mt-1.5 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#2b3c6b] focus:border-transparent"
          >
            <option value="cl">Casual Leave</option>
            {leaveBalance.ml > 0 && <option value="ml">Medical Leave</option>}
          </select>
        </div>

        {/* Dates Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* From Date */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
              <CalendarDays size={13} /> From Date
            </label>
            <DatePicker
              selected={leaveFrom}
              onChange={setLeaveFrom}
              dateFormat="dd-MMM-yyyy"
              placeholderText="Select date"
              className="w-full mt-1.5 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#2b3c6b] focus:border-transparent"
            />
          </div>

          {/* Session From */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Session From</label>
            <select
              value={sessionFrom}
              onChange={(e) => setSessionFrom(e.target.value)}
              className="w-full mt-1.5 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#2b3c6b] focus:border-transparent"
            >
              {(() => {
                const empId = user?.employeeId || "";
                const sessions = empId.includes("AREP")
                  ? [{ value: "1", label: "Session 1 (9:30 – 12:30)" }, { value: "2", label: "Session 2 (12:31 – 15:30)" }]
                  : [{ value: "1", label: "Session 1 (9:30 – 13:00)" }, { value: "2", label: "Session 2 (13:01 – 16:30)" }];
                return sessions.map((s) => <option key={s.value} value={s.value}>{s.label}</option>);
              })()}
            </select>
          </div>

          {/* To Date */}
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
              className="w-full mt-1.5 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#2b3c6b] focus:border-transparent"
            />
          </div>

          {/* Session To */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Session To</label>
            <select
              value={sessionTo}
              onChange={(e) => setSessionTo(e.target.value)}
              className="w-full mt-1.5 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#2b3c6b] focus:border-transparent"
            >
              {(() => {
                const empId = user?.employeeId || "";
                const sessions = empId.includes("AREP")
                  ? [{ value: "1", label: "Session 1 (9:30 – 12:30)" }, { value: "2", label: "Session 2 (12:31 – 15:30)" }]
                  : [{ value: "1", label: "Session 1 (9:30 – 13:00)" }, { value: "2", label: "Session 2 (13:01 – 16:30)" }];
                return sessions.map((s) => <option key={s.value} value={s.value}>{s.label}</option>);
              })()}
            </select>
          </div>

        </div>

        {/* Total Days */}
        <div className="inline-flex items-center gap-2 bg-[#f0f3fb] border border-[#dde3f3] rounded-lg px-4 py-2 text-sm">
          <span className="text-gray-500">Total Days:</span>
          <span className="font-semibold text-[#2b3c6b] text-base">{noOfDays}</span>
        </div>

        {/* Reason */}
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
            <FileText size={13} /> Reason
          </label>
          <textarea
            value={reasonForLeave}
            onChange={(e) => setReasonForLeave(e.target.value)}
            placeholder="Enter reason for leave..."
            rows={3}
            className="w-full mt-1.5 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-[#2b3c6b] focus:border-transparent"
          />
        </div>

        {/* Buttons */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate("/faculty/dashboard")}
            className="w-full sm:w-auto bg-gray-100 hover:bg-gray-200 active:scale-95 text-gray-600 px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!eligible || loading}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#2b3c6b] hover:bg-[#3f548f] active:scale-95 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {loading ? "Applying..." : "Apply Leave"}
          </button>

          
        </div>

      </form>
    </div>
  </div>
);
};

export default ApplyLeave;