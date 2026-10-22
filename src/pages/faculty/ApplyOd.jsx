import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import { API_BASE_URL } from "../../config/api";
import DatePicker from "react-datepicker";
import { format, eachDayOfInterval, isSunday } from "date-fns";
import "react-datepicker/dist/react-datepicker.css";
import {
  CalendarDays,
  FileText,
  Upload,
  Download,
  FileSpreadsheet,
  Image as ImageIcon,
} from "lucide-react";
import toast from "react-hot-toast";

/* ================= FILE RULES ================= */
const EXCEL_EXTENSIONS = ["xlsx", "xls"];
const EXCEL_MAX_MB = 5;

const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp"];
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const IMAGE_MAX_MB = 2;

const REASON_MAX = 100;

const getExt = (name = "") => name.split(".").pop().toLowerCase();

const validateExcel = (file) => {
  if (!file) return "Excel file is required";
  if (!EXCEL_EXTENSIONS.includes(getExt(file.name)))
    return "Only .xlsx or .xls files are allowed";
  if (file.size === 0) return "Excel file is empty";
  if (file.size > EXCEL_MAX_MB * 1024 * 1024)
    return `Excel file must be under ${EXCEL_MAX_MB} MB`;
  return null;
};

const validateImage = (file) => {
  if (!file) return "Image is required";
  if (
    !IMAGE_TYPES.includes(file.type) ||
    !IMAGE_EXTENSIONS.includes(getExt(file.name))
  )
    return "Only JPG, PNG or WEBP images are allowed";
  if (file.size === 0) return "Image is empty";
  if (file.size > IMAGE_MAX_MB * 1024 * 1024)
    return `Image must be under ${IMAGE_MAX_MB} MB`;
  return null;
};

const ApplyOd = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = user?.employeeId?.startsWith("AREP") ? "Palakkad" : "Chittoor";

  /* ================= STATE ================= */
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);

  const [sessionFrom, setSessionFrom] = useState("1");
  const [sessionTo, setSessionTo] = useState("2");

  const [reason, setReason] = useState("");

  const [excelFile, setExcelFile] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [excelError, setExcelError] = useState("");
  const [imageError, setImageError] = useState("");
  const [fileInputKey, setFileInputKey] = useState(0); // forces <input type=file> to clear

  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [eligible, setEligible] = useState(false);
  const [message, setMessage] = useState("");

  /* ================= CALCULATE DAYS ================= */
  const totalDays = useMemo(() => {
    if (!fromDate || !toDate) return 0;

    const days = eachDayOfInterval({ start: fromDate, end: toDate }).filter(
      (d) => !isSunday(d)
    );

    if (days.length === 0) return 0;

    const isSame =
      format(fromDate, "yyyy-MM-dd") === format(toDate, "yyyy-MM-dd");

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
  // Date / session validation (drives the eligibility check)
  const validateDates = () => {
    if (!fromDate || !toDate) return "Select dates";
    if (toDate < fromDate) return "Invalid date range";

    const same =
      format(fromDate, "yyyy-MM-dd") === format(toDate, "yyyy-MM-dd");

    if (same && sessionFrom === "2" && sessionTo === "1") {
      return "Invalid session selection";
    }

    if (totalDays <= 0) return "Selected period has no working days";

    return null;
  };

  // Full-form validation (runs on submit)
  const validateAll = () => {
    if (!user?.employeeId || !user?.adminId)
      return "User details missing. Please log in again";

    const dateError = validateDates();
    if (dateError) return dateError;

    if (reason.length > REASON_MAX)
      return `Reason must be ${REASON_MAX} characters or less`;

    const exErr = validateExcel(excelFile);
    const imgErr = validateImage(imageFile);
    setExcelError(exErr || "");
    setImageError(imgErr || "");
    if (exErr || imgErr) return "Fix the file errors before submitting";

    return null;
  };

  /* ================= FILE HANDLERS ================= */
  const handleExcelChange = (e) => {
    const f = e.target.files?.[0] || null;
    const err = f ? validateExcel(f) : "";
    setExcelError(err || "");
    if (err) {
      e.target.value = ""; // clear invalid selection
      setExcelFile(null);
      return;
    }
    setExcelFile(f);
  };

  const handleImageChange = (e) => {
    const f = e.target.files?.[0] || null;
    const err = f ? validateImage(f) : "";
    setImageError(err || "");
    if (err) {
      e.target.value = "";
      setImageFile(null);
      return;
    }
    setImageFile(f);
  };

  /* ================= RESET ================= */
  const resetForm = () => {
    setFromDate(null);
    setToDate(null);
    setSessionFrom("1");
    setSessionTo("2");
    setReason("");
    setExcelFile(null);
    setImageFile(null);
    setExcelError("");
    setImageError("");
    setFileInputKey((k) => k + 1);
    setEligible(false);
  };

  /* ================= AUTO CHECK ================= */
  useEffect(() => {
    if (!fromDate || !toDate) return;

    let cancelled = false;

    const runCheck = async () => {
      const error = validateDates();

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
            empId: user.employeeId,
            adminEmpId: user.adminId,
            onDutyFrom: format(fromDate, "dd-MMM-yyyy"),
            onDutyTo: format(toDate, "dd-MMM-yyyy"),
            sessionFrom,
            sessionTo,
            appliedOn: format(new Date(), "dd-MMM-yyyy"),
          }),
        });

        const text = await response.text();
        if (cancelled) return;

        let data = null;
        try {
          data = JSON.parse(text);
        } catch {
          console.log("Non-JSON response");
        }

        // Server error
        if (response.status >= 500) {
          setMessage("Server error. Try later");
          return;
        }

        // 400 error
        if (!response.ok) {
          setMessage(data?.message || text || "OD not allowed");
          resetForm();
          return;
        }

        // Success
        setEligible(true);
        setMessage(data?.message || "Eligible");
      } catch {
        if (!cancelled) setMessage("Network error");
      } finally {
        if (!cancelled) setChecking(false);
      }
    };

    runCheck();

    // ignore stale responses when dates/sessions change quickly
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromDate, toDate, sessionFrom, sessionTo, totalDays]);

  /* ================= EXCEL TEMPLATE DOWNLOAD ================= */
  const exportAttendanceExcel = async (location) => {
    try {
      setExporting(true);
      const response = await fetch(`${API_BASE_URL}/download-template/${location}`);

      if (!response.ok) {
        throw new Error("Failed to download Excel");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = "Excel.xlsx";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(url);

      toast.success("OD Excel downloaded successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to download");
    } finally {
      setExporting(false);
    }
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!eligible) {
      setMessage("Fix errors before submitting");
      return;
    }

    const error = validateAll();
    if (error) {
      setEligible(false);
      setMessage(error);
      // keep the form usable: re-enable once the user fixes the problem
      if (!error.startsWith("Fix the file")) return;
      setEligible(true);
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      const onDutyDto = {
    empId: user.employeeId,
    adminEmpId: user.adminId,
    onDutyFrom: format(fromDate, "dd-MMM-yyyy"),
    onDutyTo: format(toDate, "dd-MMM-yyyy"),
    noOfDays: String(totalDays),
    sessionFrom,
    sessionTo,
    appliedOn: format(new Date(), "dd-MMM-yyyy"),
    reason: reason || ""
};


      formData.append("onDutyDto", new Blob([JSON.stringify(onDutyDto)], { type: "application/json" }));
      formData.append("odForm", excelFile);
      formData.append("images", imageFile);
      

      // Do NOT set Content-Type: the browser adds multipart/form-data + boundary
      const response = await fetch(`${API_BASE_URL}/odApply`, {
        method: "POST",
        body: formData,
      });

      const text = await response.text();

      let data = null;
      try {
        data = JSON.parse(text);
      } catch {
        console.log("Non-JSON response");
      }

      if (!response.ok) {
        setEligible(false);
        setMessage(data?.message || text || "Submit failed");
        return;
      }

      setMessage("OD applied successfully ✅");
       toast.success("OD applied successfully ✅");

      setTimeout(() => {
        navigate("/faculty/my-leaves");
      }, 1200);
    } catch {
      setMessage("Server error");
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = eligible && !loading && !checking && !!excelFile && !!imageFile;

  /* ================= UI ================= */
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-[0_6px_18px_rgba(0,0,0,0.08)] p-6 space-y-5">
        {/* TITLE + EXPORT */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">Apply On Duty</h2>

          <button
            type="button"
            onClick={() => exportAttendanceExcel(location)}
            disabled={loading || exporting}
            className="flex items-center gap-2 px-4 py-2 rounded-lg 
                       bg-gradient-to-r from-[#2b3c6b] to-[#3f548f] 
                       text-white text-sm font-medium
                       hover:opacity-90 transition shadow-sm
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={16} />
            {exporting ? "Exporting..." : "Export"}
          </button>
        </div>

        {/* MESSAGE */}
        {message && (
          <div
            className={`p-3 rounded-lg text-sm ${
              eligible
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {message}
          </div>
        )}

        {checking && (
          <p className="text-sm text-gray-500">Checking eligibility...</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* DATES */}
          <div className="grid grid-cols-2 gap-4">
            <div className="relative">
              <CalendarDays
                className="absolute left-3 top-3 text-gray-400"
                size={16}
              />
              <DatePicker
                selected={fromDate}
                onChange={setFromDate}
                dateFormat="dd MMM yyyy"
                placeholderText="From Date"
                className="w-full pl-10 pr-3 py-2 rounded-lg bg-gray-50 shadow-sm 
                           focus:outline-none focus:ring-2 focus:ring-[#3f548f]"
              />
            </div>

            <div className="relative">
              <CalendarDays
                className="absolute left-3 top-3 text-gray-400"
                size={16}
              />
              <DatePicker
                selected={toDate}
                onChange={setToDate}
                minDate={fromDate}
                maxDate={fromDate}
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
          <div>
            <div className="relative">
              <FileText
                className="absolute left-3 top-3 text-gray-400"
                size={16}
              />
              <textarea
                placeholder="Reason (optional)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                maxLength={REASON_MAX}
                className="w-full pl-10 pr-3 py-2 rounded-lg bg-gray-50 shadow-sm 
                           focus:outline-none focus:ring-2 focus:ring-[#3f548f]"
              />
            </div>
            <p className="text-xs text-gray-400 text-right mt-1">
              {reason.length}/{REASON_MAX}
            </p>
          </div>

          {/* EXCEL UPLOAD */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filled OD Excel <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <FileSpreadsheet
                className="absolute left-3 top-3 text-gray-400"
                size={16}
              />
              <input
                key={`excel-${fileInputKey}`}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleExcelChange}
                className="w-full pl-10 pr-3 py-2 rounded-lg bg-gray-50 shadow-sm 
                           cursor-pointer"
              />
            </div>
            {excelError ? (
              <p className="text-xs text-red-600 mt-1">{excelError}</p>
            ) : (
              <p className="text-xs text-gray-400 mt-1">
                .xlsx or .xls, max {EXCEL_MAX_MB} MB
              </p>
            )}
          </div>

          {/* IMAGE UPLOAD */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Supporting image <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <ImageIcon
                className="absolute left-3 top-3 text-gray-400"
                size={16}
              />
              <input
                key={`image-${fileInputKey}`}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageChange}
                className="w-full pl-10 pr-3 py-2 rounded-lg bg-gray-50 shadow-sm 
                           cursor-pointer"
              />
            </div>
            {imageError ? (
              <p className="text-xs text-red-600 mt-1">{imageError}</p>
            ) : (
              <p className="text-xs text-gray-400 mt-1">
                JPG, PNG or WEBP, max {IMAGE_MAX_MB} MB
              </p>
            )}
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
              disabled={!canSubmit}
              className="px-4 py-2 rounded-lg bg-[#2b3c6b] text-white 
                         hover:bg-[#3f548f] transition disabled:opacity-60 
                         disabled:cursor-not-allowed"
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