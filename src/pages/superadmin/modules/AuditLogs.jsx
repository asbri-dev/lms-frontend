import { useState } from "react";
import toast from "react-hot-toast";
import { format, subDays } from "date-fns";
import { API_BASE_URL } from "../../../config/api";

const AuditLogs = () => {
  const today     = format(new Date(), "yyyy-MM-dd");
  const monthAgo  = format(subDays(new Date(), 29), "yyyy-MM-dd");

  const [fromDate, setFromDate] = useState(monthAgo);
  const [toDate,   setToDate]   = useState(today);
  const [loading,  setLoading]  = useState(false);

  const token = sessionStorage.getItem("authToken");

  const handleDownload = async () => {
    if (!fromDate || !toDate) {
      toast.error("Please select both from and to dates");
      return;
    }
    if (fromDate > toDate) {
      toast.error("From date cannot be after to date");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(
        `${API_BASE_URL}/download-audit-logs?fromDate=${fromDate}&toDate=${toDate}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!res.ok) throw new Error(`Server error: ${res.status}`);

      // ✅ Auto-download the excel file
      const blob     = await res.blob();
      const url      = URL.createObjectURL(blob);
      const a        = document.createElement("a");
      a.href         = url;
      a.download     = `audit-logs-${fromDate}-to-${toDate}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Audit logs Excel downloaded successfully");
    } catch (e) {
      toast.error(e.message || "Failed to download audit logs");
    } finally {
      setLoading(false);
    }
  };

  // Quick range presets
  const applyPreset = (days) => {
    setFromDate(format(subDays(new Date(), days - 1), "yyyy-MM-dd"));
    setToDate(today);
  };

  const PRESETS = [
    { label: "Last 7 days",  days: 7   },
    { label: "Last 30 days", days: 30  },
    { label: "Last 90 days", days: 90  },
  ];

  return (
    <div className="max-w-xl space-y-6">

      {/* ─── Header ─── */}
      <div>
        <h2 className="text-base font-semibold text-gray-800">Audit logs</h2>
        <p className="text-sm text-gray-400 mt-1">
          Download a full Excel report of system activity for any date range.
        </p>
      </div>

      {/* ─── Card ─── */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-6">

        {/* Quick presets */}
        <div>
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
            Quick range
          </div>
          <div className="flex gap-2 flex-wrap">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => applyPreset(p.days)}
                className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500
                           hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50
                           transition-colors"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-gray-100" />

        {/* Date pickers */}
        <div>
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
            Custom range
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1.5">
                From date
              </label>
              <input
                type="date"
                value={fromDate}
                max={toDate || today}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full border border-gray-200 px-3 py-2.5 rounded-xl text-sm
                           text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300
                           focus:border-indigo-400 transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1.5">
                To date
              </label>
              <input
                type="date"
                value={toDate}
                min={fromDate}
                max={today}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full border border-gray-200 px-3 py-2.5 rounded-xl text-sm
                           text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300
                           focus:border-indigo-400 transition-colors"
              />
            </div>
          </div>

          {/* Selected range summary */}
          {fromDate && toDate && fromDate <= toDate && (
            <div className="mt-3 flex items-center gap-2 text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
              </svg>
              Downloading logs from{" "}
              <span className="font-medium text-gray-600">{fromDate}</span>
              {" "}to{" "}
              <span className="font-medium text-gray-600">{toDate}</span>
            </div>
          )}

          {fromDate && toDate && fromDate > toDate && (
            <div className="mt-3 flex items-center gap-2 text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">
              <span>⚠</span> From date cannot be after to date
            </div>
          )}
        </div>

        {/* Download button */}
        <button
          onClick={handleDownload}
          disabled={loading || !fromDate || !toDate || fromDate > toDate}
          className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl
                     bg-indigo-600 text-white text-sm font-medium
                     hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed
                     transition-colors shadow-sm"
        >
          {loading ? (
            <>
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
              </svg>
              Downloading...
            </>
          ) : (
            <>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Download audit logs (.xlsx)
            </>
          )}
        </button>
      </div>

      {/* ─── Info note ─── */}
      <div className="flex gap-3 text-xs text-gray-400 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5 text-gray-300">
          <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
        </svg>
        Audit logs include all system activity — logins, approvals, rejections, and admin actions — for the selected date range.
      </div>

    </div>
  );
};

export default AuditLogs;
