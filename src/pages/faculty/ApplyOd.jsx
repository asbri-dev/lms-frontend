import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import DatePicker from "react-datepicker";
import { format, eachDayOfInterval, isSunday } from "date-fns";
import "react-datepicker/dist/react-datepicker.css";
import { CalendarDays, FileText, Upload } from "lucide-react";

const ApplyOd = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  /* ================= STATE ================= */
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

  /* ================= CALCULATE DAYS ================= */
  const totalDays = useMemo(() => {
    if (!fromDate || !toDate) return 0;

    const days = eachDayOfInterval({ start: fromDate, end: toDate })
      .filter((d) => !isSunday(d));

    if (days.length === 0) return 0;

    const isSame =
      format(fromDate, "yyyy-MM-dd") ===
      format(toDate, "yyyy-MM-dd");

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

  /* ================= VALIDATION ================= */
  const validate = () => {
    if (!fromDate || !toDate) return "Select dates";
    if (toDate < fromDate) return "Invalid date range";

    const same =
      format(fromDate, "yyyy-MM-dd") ===
      format(toDate, "yyyy-MM-dd");

    if (same && sessionFrom === "2" && sessionTo === "1") {
      return "Invalid session selection";
    }

    return null;
  };

  /* ================= AUTO CHECK ================= */
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

        const response = await fetch(
          "http://localhost:9090/checkOdEligible", // 🔥 if backend exists (optional)
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              empId: user.employeeId,
              adminEmpId: user.adminId,
              onDutyFrom: format(fromDate, "dd-MMM-yyyy"),
              onDutyTo: format(toDate, "dd-MMM-yyyy"),
              sessionFrom,
              sessionTo,
              appliedOn: format(new Date(), "dd-MMM-yyyy"),
            }),
          }
        );

        const text = await response.text();

        let data = null;
        try {
          data = JSON.parse(text);
        } catch {
          console.log("Non-JSON response");
        }

        // 🔴 Server error
        if (response.status >= 500) {
          setMessage("Server error. Try later");
          return;
        }

        // 🟡 400 error
        if (!response.ok) {
          setMessage(data?.message || text || "OD not allowed");
          resetForm(); // 🔥 reset on error
          return;
        }

        // 🟢 Success
        setEligible(true);
        setMessage(data?.message || "Eligible");

      } catch {
        setMessage("Network error");
      } finally {
        setChecking(false);
      }
    };

    if (fromDate && toDate) {
      runCheck();
    }
  }, [fromDate, toDate, sessionFrom, sessionTo, totalDays]);

  /* ================= RESET ================= */
  const resetForm = () => {
    setFromDate(null);
    setToDate(null);
    setSessionFrom("1");
    setSessionTo("2");
    setReason("");
    setFile(null);
    setEligible(false);
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!eligible) {
      setMessage("Fix errors before submitting");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();

      formData.append("empId", user.employeeId);
      formData.append("adminEmpId", user.adminId);
      formData.append("onDutyFrom", format(fromDate, "dd-MMM-yyyy"));
      formData.append("onDutyTo", format(toDate, "dd-MMM-yyyy"));
      formData.append("sessionFrom", sessionFrom);
      formData.append("sessionTo", sessionTo);
      formData.append("appliedOn", format(new Date(), "dd-MMM-yyyy"));

      if (reason) formData.append("reason", reason);
      if (file) formData.append("file", file);

      const response = await fetch("http://localhost:9090/applyOd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          empId: user.employeeId,
          adminEmpId: user.adminId,
          onDutyFrom: format(fromDate, "dd-MMM-yyyy"),
          onDutyTo: format(toDate, "dd-MMM-yyyy"),
          sessionFrom,
          sessionTo,
          appliedOn: format(new Date(), "dd-MMM-yyyy"),
          reason,
          noOfDays: totalDays,
        }) // 🔥 adjust if backend expects differently
      });

      const text = await response.text();

      let data = null;
      try {
        data = JSON.parse(text);
      } catch { console.log("Non-JSON response");}

      if (!response.ok) {
        setMessage(data?.message || text || "Submit failed");
        return;
      }

      setMessage("OD applied successfully ✅");

      setTimeout(() => {
        navigate("/faculty/my-leaves");
      }, 1200);

    } catch {
      setMessage("Server error");
    } finally {
      setLoading(false);
    }
  };

  /* ================= UI ================= */
  return (
  <div className="p-6 max-w-2xl mx-auto">

    <div className="bg-white rounded-2xl shadow-[0_6px_18px_rgba(0,0,0,0.08)] p-6 space-y-5">

      {/* TITLE */}
      <h2 className="text-xl font-semibold text-gray-800">
        Apply On Duty
      </h2>

      {/* MESSAGE */}
      {message && (
        <div className={`p-3 rounded-lg text-sm ${
          eligible
            ? "bg-green-100 text-green-700"
            : "bg-red-100 text-red-700"
        }`}>
          {message}
        </div>
      )}

      {checking && (
        <p className="text-sm text-gray-500">
          Checking eligibility...
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* DATES */}
        <div className="grid grid-cols-2 gap-4">

          {/* FROM DATE */}
          <div className="relative">
            <CalendarDays className="absolute left-3 top-3 text-gray-400" size={16} />
            <DatePicker
              selected={fromDate}
              onChange={setFromDate}
              dateFormat="dd MMM yyyy"
              placeholderText="From Date"
              className="w-full pl-10 pr-3 py-2 rounded-lg bg-gray-50 shadow-sm 
                         focus:outline-none focus:ring-2 focus:ring-[#3f548f]"
            />
          </div>

          {/* TO DATE */}
          <div className="relative">
            <CalendarDays className="absolute left-3 top-3 text-gray-400" size={16} />
            <DatePicker
              selected={toDate}
              onChange={setToDate}
              minDate={fromDate}
              dateFormat="dd MMM yyyy"
              placeholderText="To Date"
              className="w-full pl-10 pr-3 py-2 rounded-lg bg-gray-50 shadow-sm 
                         focus:outline-none focus:ring-2 focus:ring-[#3f548f]"
            />
          </div>

        </div>

        {/* SESSIONS */}
        <div className="grid grid-cols-2 gap-4">

          <select
            value={sessionFrom}
            onChange={(e) => setSessionFrom(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-gray-50 shadow-sm 
                       focus:ring-2 focus:ring-[#3f548f]"
          >
            <option value="1">Session 1</option>
            <option value="2">Session 2</option>
          </select>

          <select
            value={sessionTo}
            onChange={(e) => setSessionTo(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-gray-50 shadow-sm 
                       focus:ring-2 focus:ring-[#3f548f]"
          >
            <option value="1">Session 1</option>
            <option value="2">Session 2</option>
          </select>

        </div>

        {/* TOTAL DAYS */}
        <div className="text-sm font-medium text-gray-700">
          Total Days: <span className="text-[#2b3c6b]">{totalDays}</span>
        </div>

        {/* REASON */}
        <div className="relative">
          <FileText className="absolute left-3 top-3 text-gray-400" size={16} />
          <textarea
            placeholder="Reason (optional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="w-full pl-10 pr-3 py-2 rounded-lg bg-gray-50 shadow-sm 
                       focus:outline-none focus:ring-2 focus:ring-[#3f548f]"
          />
        </div>

        {/* FILE UPLOAD */}
        <div className="relative">
          <Upload className="absolute left-3 top-3 text-gray-400" size={16} />
          <input
            type="file"
            onChange={(e) => setFile(e.target.files[0])}
            className="w-full pl-10 pr-3 py-2 rounded-lg bg-gray-50 shadow-sm 
                       cursor-pointer"
          />
        </div>

        {/* BUTTONS */}
        <div className="flex justify-end gap-3 pt-2">

          <button
            type="button"
            onClick={() => navigate("/faculty/dashboard")}
            className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={!eligible || loading}
            className="px-4 py-2 rounded-lg bg-[#2b3c6b] text-white 
                       hover:bg-[#3f548f] transition disabled:opacity-60"
          >
            {loading ? "Submitting..." : "Apply OD"}
          </button>

        </div>

      </form>
    </div>
  </div>
);
};

export default ApplyOd;