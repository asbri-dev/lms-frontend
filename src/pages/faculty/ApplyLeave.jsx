import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import DatePicker from "react-datepicker";
import {
  format,
  eachDayOfInterval,
  isSunday,
} from "date-fns";
import "react-datepicker/dist/react-datepicker.css";
import "./ApplyLeave.css";

const ApplyLeave = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

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

 /* =========================================
   Calculate Leave Days (Exclude Sundays)
========================================= */
const calculateLeaveDays = () => {
  if (!leaveFrom || !leaveTo) return 0;

  const allDays = eachDayOfInterval({
    start: leaveFrom,
    end: leaveTo,
  });

  const workingDays = allDays.filter((day) => !isSunday(day));

  if (workingDays.length === 0) return 0;

  let totalDays = workingDays.length;

  const isSameDay =
    format(leaveFrom, "yyyy-MM-dd") ===
    format(leaveTo, "yyyy-MM-dd");

  // 🟢 SAME DAY LOGIC
  if (isSameDay) {
    if (sessionFrom === "1" && sessionTo === "1") return 0.5;
    if (sessionFrom === "2" && sessionTo === "2") return 0.5;
    return 1; // 1 → 2
  }

  
  if (sessionFrom === "2") {
    totalDays -= 0.5;
  }

  if (sessionTo === "1") {
    totalDays -= 0.5;
  }

  return totalDays;
};

const noOfDays = calculateLeaveDays();

  /* =========================================
     Validation
  ========================================= */
  const validate = () => {
    if (!leaveFrom || !leaveTo) {
      setMessage("Please select both start and end dates.");
      return false;
    }

    if (leaveTo < leaveFrom) {
      setMessage("End date cannot be before start date.");
      return false;
    }

    if (!reasonForLeave || reasonForLeave.length < 10) {
      setMessage("Reason must be at least 10 characters.");
      return false;
    }

    

    return true;
  };

  /* =========================================
     CHECK ELIGIBILITY
  ========================================= */
  const handleCheckEligibility = async () => {
  if (!validate()) return;

  try {
    setChecking(true);
    setEligible(false);
    setMessage("");

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
          reasonForLeave,
          sessionFrom,
          sessionTo,
        }),
      }
    );

    let data = null;

    // 🟢 Try to parse JSON safely
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    // 🔴 If server error (500+)
    if (response.status >= 500) {
      setMessage("Server error. Please try again later.");
      setEligible(false);
      return;
    }

    // 🟡 If bad request (400)
    if (!response.ok) {
      setMessage(
        data?.message || "Leave eligibility check failed."
      );
      setEligible(false);
      return;
    }

    // 🟢 Success
    setMessage(data?.message || "Eligible for leave.");
    setEligible(true);

  } catch {
    setMessage("Network error. Please check your connection.");
    setEligible(false);
  } finally {
    setChecking(false);
  }
};

  /* =========================================
     APPLY LEAVE
  ========================================= */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!eligible) {
      setMessage("Please check eligibility before applying.");
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
        setMessage(data.message || "Failed to apply leave.");
        return;
      }

      alert("Leave applied successfully!");
      navigate("/faculty/dashboard");

    } catch {
      setMessage("Server error while applying leave.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="apply-container">
      <div className="apply-card">
        <h2>Apply Leave</h2>

        {message && (
          <div className={eligible ? "success-msg" : "error-msg"}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          <select
            value={typeOfLeave}
            onChange={(e) => setTypeOfLeave(e.target.value)}
          >
            <option value="cl">Casual Leave</option>
            <option value="ml">Medical Leave</option>
          </select>

          <DatePicker
          placeholderText="From Date"
            selected={leaveFrom}
            onChange={setLeaveFrom}
            dateFormat="dd-MMM-yyyy"
          />

          <select
            value={sessionFrom}
            onChange={(e) => setSessionFrom(e.target.value)}
          >
            <option value="1">Session 1</option>
            <option value="2">Session 2</option>
          </select>

          <DatePicker
          placeholderText="To Date"
            selected={leaveTo}
            onChange={setLeaveTo}
            minDate={leaveFrom}
            dateFormat="dd-MMM-yyyy"
          />

          <select
            value={sessionTo}
            onChange={(e) => setSessionTo(e.target.value)}
          >
            <option value="1">Session 1</option>
            <option value="2">Session 2</option>
          </select>

          <div>Total Leave Days: {noOfDays}</div>

          <textarea
            placeholder="Reason"
            value={reasonForLeave}
            onChange={(e) => setReasonForLeave(e.target.value)}
          />

          

          <button
            type="button"
            onClick={handleCheckEligibility}
            disabled={checking}
          >
            {checking ? "Checking..." : "Check"}
          </button>

          <button
            type="submit"
            disabled={!eligible || loading}
          >
            {loading ? "Applying..." : "Apply Leave"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/faculty/dashboard")}
          >
            Cancel
          </button>

        </form>
      </div>
    </div>
  );
};

export default ApplyLeave;