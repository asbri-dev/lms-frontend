import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import { API_BASE_URL } from "../../config/api";
import DatePicker from "react-datepicker";
import { format } from "date-fns";
import "react-datepicker/dist/react-datepicker.css";
import { CalendarDays, Clock, FileText } from "lucide-react";

/* ================= CONFIG ================= */
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

const ApplyPermission = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  /* ================= STATE ================= */
  const [permissionType, setPermissionType] = useState("lateIn");
  const [permissionDate, setPermissionDate] = useState(null);
  const [permissionFrom, setPermissionFrom] = useState("");
  const [permissionTo, setPermissionTo] = useState("");
  const [reasonForPermission, setReasonForPermission] = useState("");

  const [checking, setChecking] = useState(false);
  const [loading, setLoading] = useState(false);

  const [eligible, setEligible] = useState(false);
  const [message, setMessage] = useState("");

  const [toast, setToast] = useState(null);

  /* ================= DERIVED ================= */
  const campus = useMemo(
    () => getCampusFromEmpId(user?.employeeId),
    [user?.employeeId]
  );

  /* ================= AUTO TIME ================= */
  useEffect(() => {
    const slot = TIME_SLOTS[campus]?.[permissionType];
    if (slot) {
      setPermissionFrom(slot.from);
      setPermissionTo(slot.to);
    }
  }, [campus, permissionType]);

  /* ================= VALIDATION ================= */
  const isFormValid = () => {
    if (!permissionDate) return "Select permission date";
    if (!permissionFrom || !permissionTo) return "Invalid time slot";
    return null;
  };

  /* ================= PAYLOAD ================= */
  const buildPayload = () => ({
    empId: user.employeeId,
    from: permissionFrom,
    to: permissionTo,
    permissionType,
    permissionDate: format(permissionDate, "dd-MMM-yyyy"),
  });

  /* ================= AUTO CHECK (DEBOUNCED) ================= */
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

        const response = await fetch(
          `${API_BASE_URL}/permissionRequestCheck`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(buildPayload()),
          }
        );

        const text = await response.text();

        let data = null;
        try {
          data = JSON.parse(text);
        } catch {
          console.log("Response is not JSON:", text);
        }

        // 🔴 Server error
        if (response.status >= 500) {
          setMessage("Server error. Please try again later.");
          return;
        }

        // 🟡 Business error (400)
        if (!response.ok) {
          setMessage(data?.message || text || "Permission not allowed");
          return;
        }

        // 🟢 Success
        setEligible(true);
        setMessage(data?.message || text || "Eligible");

      } catch {
        setMessage("Network error");
      } finally {
        setChecking(false);
      }
    }, 500); // 🔥 debounce

    return () => clearTimeout(timer);

  }, [permissionDate, permissionType, permissionFrom, permissionTo]);

  /* ================= SUBMIT ================= */
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

      const response = await fetch(
        `${API_BASE_URL}/applyPermission`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...buildPayload(),
            reasonForPermission,
          }),
        }
      );

      const text = await response.text();

      let data = null;
      try {
        data = JSON.parse(text);
      } catch { console.log("Response is not JSON:", text);}

      if (!response.ok) {
        setMessage(data?.message || text || "Submission failed");
        return;
      }

      setToast("Permission submitted successfully ✅");

      setTimeout(() => {
        navigate("/faculty/my-leaves");
      }, 1500);

    } catch {
      setMessage("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ================= UI ================= */
  return (
  <div className="p-6 max-w-2xl mx-auto relative">

    {/* 🔥 Toast */}
    {toast && (
      <div className="fixed top-6 right-6 bg-[#2b3c6b] text-white px-4 py-2 rounded-lg shadow-lg animate-slide-in">
        {toast}
      </div>
    )}

    <div className="bg-white rounded-2xl shadow-[0_8px_25px_rgba(0,0,0,0.08)] p-6 space-y-6">

      {/* HEADER */}
      <div>
        <h2 className="text-xl font-semibold text-gray-800">
          Apply for Permission
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Request short permission for late entry or early exit
        </p>
      </div>

      {/* MESSAGE */}
      {message && (
        <div
          className={`p-3 rounded-lg text-sm ${
            message.toLowerCase().includes("eligible")
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {message}
        </div>
      )}

      {/* CHECKING */}
      {checking && (
        <div className="text-sm text-gray-500">
          Checking availability...
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* 🔥 TYPE TOGGLE */}
        <div>
          <label className="text-sm font-medium text-gray-600 block mb-2">
            Permission Type
          </label>

          <div className="flex gap-3">
            {["lateIn", "earlyOut"].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setPermissionType(type)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition 
                  ${
                    permissionType === type
                      ? "bg-[#2b3c6b] text-white shadow"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
              >
                {type === "lateIn" ? "Late In" : "Early Out"}
              </button>
            ))}
          </div>
        </div>

        {/* 🔥 DATE */}
        <div>
          <label className="text-sm font-medium text-gray-600 mb-2 block">
            Permission Date
          </label>

          <div className="relative">
            <CalendarDays className="absolute left-3 top-3 text-gray-400" size={16} />
            <DatePicker
              selected={permissionDate}
              onChange={setPermissionDate}
              dateFormat="dd/MM/yyyy"
              placeholderText="Select date"
              className="w-full pl-10 pr-3 py-2 rounded-lg bg-gray-50 shadow-sm 
                         focus:outline-none focus:ring-2 focus:ring-[#3f548f] transition"
            />
          </div>
        </div>

        {/* 🔥 TIME */}
        <div>
          <label className="text-sm font-medium text-gray-600 mb-2 block">
            Time Slot
          </label>

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

        {/* 🔥 REASON */}
        <div>
          <label className="text-sm font-medium text-gray-600 mb-2 block">
            Reason
          </label>

          <div className="relative">
            <FileText className="absolute left-3 top-3 text-gray-400" size={16} />
            <textarea
              value={reasonForPermission}
              onChange={(e) => setReasonForPermission(e.target.value)}
              rows={3}
              placeholder="Enter reason"
              className="w-full pl-10 pr-3 py-2 rounded-lg bg-gray-50 shadow-sm 
                         focus:outline-none focus:ring-2 focus:ring-[#3f548f] transition"
            />
          </div>
        </div>

        {/* 🔥 ACTIONS */}
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
            className="flex items-center gap-2 px-4 py-2 rounded-lg 
                       bg-[#2b3c6b] text-white hover:bg-[#3f548f] transition
                       disabled:opacity-60"
          >
            {loading && (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            )}
            {loading ? "Submitting..." : "Submit"}
          </button>

        </div>

      </form>
    </div>
  </div>
);}

export default ApplyPermission;