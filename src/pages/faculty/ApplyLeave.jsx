// ==============================
// ApplyLeave.jsx (Final Clean Version)
// ==============================

import { useState, useEffect, useMemo, useCallback,  } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { CalendarDays, FileText, User } from "lucide-react";
import DatePicker from "react-datepicker";
import {
  format,
  eachDayOfInterval,
  isSunday,
  isSameDay,
} from "date-fns";
import "react-datepicker/dist/react-datepicker.css";

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
  });
  /* ================= BALANCE VALIDATION ================= */

const checkLeaveBalance = useCallback(() => {
  if (typeOfLeave === "ml" && leaveBalance.ml <= 0) {
    return "No Medical Leave balance available";
  }

  if (typeOfLeave === "cl" && leaveBalance.cl <= 0) {
    return "No Casual Leave balance available";
  }

  return null;
}, [typeOfLeave, leaveBalance]);

  /* ================= LOAD DASHBOARD ================= */

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await fetch(
          `http://localhost:9090/getDashboardDetails?empId=${user.employeeId}`
        );
        const data = await res.json();

        setLeaveBalance({
          cl: data.basicDetails.casualLeaves,
          ml: data.basicDetails.medicalLeaves,
          rmName: data.basicDetails.rmName,
          rmId: data.basicDetails.rmEmployeeId,
        });
      } catch {
        console.error("Dashboard load failed");
      }
    };

    fetchDashboard();
  }, [user.employeeId]);

  /* ================= CALCULATE DAYS ================= */

  const noOfDays = useMemo(() => {
    
    if (!leaveFrom || !leaveTo) return 0;

    const days = eachDayOfInterval({ start: leaveFrom, end: leaveTo })
      .filter((d) => !isSunday(d));

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

  /* ================= VALIDATION (NO REASON) ================= */

  const validateEligibility = useCallback(() => {
    if (!leaveFrom || !leaveTo) return "Select dates";
    if (leaveTo < leaveFrom) return "Invalid date range";

    if (
      isSameDay(leaveFrom, leaveTo) &&
      sessionFrom === "2" &&
      sessionTo === "1"
    ) {
      return "Invalid session selection";
    }

    return null;
  }, [leaveFrom, leaveTo, sessionFrom, sessionTo]);

  /* ================= API CALL ================= */

  const runCheck = useCallback(async () => {
    try {
      setChecking(true);
      setEligible(false);

      const response = await fetch(
        "http://localhost:9090/checkLeaveEligibe",
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
        "http://localhost:9090/applyLeaves",
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

      setTimeout(() => navigate("/faculty/dashboard"), 1500);

    } catch {
      setMessage("Server error while submitting");
    } finally {
      setLoading(false);
    }
  };

  /* ================= UI ================= */

  

return (
  <div className="max-w-4xl mx-auto p-6">

    {/* Header */}
    <h2 className="text-2xl font-semibold text-gray-800 mb-6">
      Apply Leave
    </h2>

    <div className="bg-white p-6 rounded-2xl shadow-md space-y-6">

      {/* Leave Balance */}
      <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg text-sm text-gray-600">
        <p className="flex items-center gap-2">
          <User size={16} /> 
          Reporting To: {leaveBalance.rmName} ({leaveBalance.rmId})
        </p>
        <p className="mt-1">
          CL: <span className="font-medium">{leaveBalance.cl}</span> | ML:{" "}
          <span className="font-medium">{leaveBalance.ml}</span>
        </p>
      </div>

      {/* Message */}
      {message && (
  <div
    className={`p-3 rounded-lg text-sm ${
      message.toLowerCase().includes("eligible") || message.toLowerCase().includes("success")
        ? "bg-green-100 text-green-700"
        : "bg-red-100 text-red-700"
    }`}
  >
    {message}
  </div>
)}
      

      {checking && (
        <div className="text-sm text-gray-500">
          Checking eligibility...
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Leave Type */}
        <div>
          <label className="text-sm font-medium text-gray-600">
            Leave Type
          </label>
          <select
            value={typeOfLeave}
            onChange={(e) => setTypeOfLeave(e.target.value)}
            className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#3f548f]"
          >
            <option value="cl">Casual Leave</option>
            {leaveBalance.ml > 0 && (
              <option value="ml">Medical Leave</option>
            )}
          </select>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* From Date */}
          <div>
            <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
              <CalendarDays size={16} /> From Date
            </label>
            <DatePicker
              selected={leaveFrom}
              onChange={setLeaveFrom}
              dateFormat="dd-MMM-yyyy"
              placeholderText="Select date"
              className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#3f548f]"
            />
          </div>

          {/* Session From */}
<div>
  <label className="text-sm font-medium text-gray-600">
    Session From
  </label>

  <select
    value={sessionFrom}
    onChange={(e) => setSessionFrom(e.target.value)}
    className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#3f548f]"
  >
    {(() => {
      const empId = user?.employeeId || "";
       let sessions = [];

      if (empId.includes("AREP")) {
        sessions = [
          { value: "1", label: "Session 1 (9:30 to 12:30)" },
          { value: "2", label: "Session 2 (12:30 to 15:30)" },
        ];
      } else  {
        sessions = [
          { value: "1", label: "Session 1 (9:30 to 13:00)" },
          { value: "2", label: "Session 2 (13:00 to 16:30)" },
        ];
      } 

      return sessions.map((s) => (
        <option key={s.value} value={s.value}>
          {s.label}
        </option>
      ));
    })()}
  </select>
</div>

          {/* To Date */}
          <div>
            <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
              <CalendarDays size={16} /> To Date
            </label>
            <DatePicker
              selected={leaveTo}
              onChange={setLeaveTo}
              minDate={leaveFrom}
              dateFormat="dd-MMM-YYYY"
        
              placeholderText="Select date"
              className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#3f548f]"
            />
          </div>

          {/* Session To */}
<div>
  <label className="text-sm font-medium text-gray-600">
    Session To
  </label>

  <select
    value={sessionTo}
    onChange={(e) => setSessionTo(e.target.value)}
    className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#3f548f]"
  >
    {(() => {
      const empId = user?.employeeId || "";

      let sessions = [];

      if (empId.includes("AREP")) {
        sessions = [
          { value: "1", label: "Session 1 (9:30 to 12:30)" },
          { value: "2", label: "Session 2 (12:30 to 15:30)" },
        ];
      } else  {
        sessions = [
          { value: "1", label: "Session 1 (9:30 to 13:00)" },
          { value: "2", label: "Session 2 (13:00 to 16:30)" },
        ];
      } 

      return sessions.map((s) => (
        <option key={s.value} value={s.value}>
          {s.label}
        </option>
      ));
    })()}
  </select>
</div>

        </div>

        {/* Total Days */}
        <div className="text-sm font-medium text-gray-700">
          Total Days: <span className="text-[#2b3c6b]">{noOfDays}</span>
        </div>

        {/* Reason */}
        <div>
          <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
            <FileText size={16} /> Reason
          </label>
          <textarea
            value={reasonForLeave}
            onChange={(e) => setReasonForLeave(e.target.value)}
            placeholder="Enter reason for leave"
            rows={3}
            className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#3f548f]"
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-2">

          <button
            type="submit"
            disabled={!eligible || loading}
            className="flex items-center justify-center gap-2 
                       bg-[#2b3c6b] hover:bg-[#3f548f] 
                       text-white px-5 py-2 rounded-lg font-medium 
                       transition duration-200 
                       disabled:opacity-60"
          >
            {loading && (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            )}
            {loading ? "Applying..." : "Apply Leave"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/faculty/dashboard")}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-5 py-2 rounded-lg transition"
          >
            Cancel
          </button>

        </div>

      </form>
    </div>
  </div>
);
};

export default ApplyLeave;