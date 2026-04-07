import { useEffect, useMemo, useState, useCallback } from "react";
import { format } from "date-fns";

const getLocation = (employeeId) => {
  if (!employeeId) return "Unknown";
  if (employeeId.startsWith("AREP")) return "Palakkad";
  if (employeeId.startsWith("AREC")) return "Chittoor";
  return "Unknown";
};

const LEAVE_TYPES = ["All", "CL", "ML", "OD"];
const LOCATIONS   = ["All", "Palakkad", "Chittoor"];
const QUOTA       = 12; // highlight if exceeded

const TopLeaveTakers = () => {
  const [data, setData]         = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [month, setMonth]       = useState(format(new Date(), "yyyy-MM"));
  const [leaveType, setType]    = useState("All");
  const [location, setLocation] = useState("All");

  const token = sessionStorage.getItem("authToken");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({ month });
      if (leaveType !== "All") params.append("leaveType", leaveType);
      if (location  !== "All") params.append("location",  location);

      const res = await fetch(
        `http://localhost:9090/getTopLeaveTakers?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const json = await res.json();
      setData(json.topLeaveTakers || []);
    } catch (e) {
      setError(e.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [month, leaveType, location, token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const sorted = useMemo(
    () => [...data].sort((a, b) => b.leaveCount - a.leaveCount),
    [data]
  );

  const maxCount = useMemo(
    () => Math.max(...sorted.map((e) => e.leaveCount), 1),
    [sorted]
  );

  return (
    <div className="space-y-5">

      {/* ─── Controls ─── */}
      <div className="flex flex-wrap gap-3 items-center">
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="border px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
        <select
          value={leaveType}
          onChange={(e) => setType(e.target.value)}
          className="border px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
        >
          {LEAVE_TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>
        <select
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="border px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
        >
          {LOCATIONS.map((l) => <option key={l}>{l}</option>)}
        </select>

        {/* Summary badges */}
        {!loading && sorted.length > 0 && (
          <div className="ml-auto flex gap-3">
            <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full">
              {sorted.length} employees
            </span>
            <span className="text-xs bg-red-100 text-red-700 px-3 py-1.5 rounded-full">
              {sorted.filter((e) => e.leaveCount > QUOTA).length} exceeded quota
            </span>
          </div>
        )}
      </div>

      {/* ─── Error ─── */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
          <span>⚠</span> {error}
          <button onClick={fetchData} className="ml-auto underline text-xs">Retry</button>
        </div>
      )}

      {/* ─── Skeleton ─── */}
      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 border rounded-xl animate-pulse">
              <div className="w-8 h-4 bg-gray-200 rounded" />
              <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 bg-gray-200 rounded w-1/3" />
                <div className="h-3 bg-gray-100 rounded w-1/4" />
              </div>
              <div className="w-24 h-4 bg-gray-200 rounded" />
              <div className="w-8 h-6 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* ─── Empty ─── */}
      {!loading && !error && sorted.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <div className="text-4xl mb-3">📊</div>
          <div className="text-sm">No leave data for this period</div>
        </div>
      )}

      {/* ─── Ranked List ─── */}
      {!loading && sorted.length > 0 && (
        <div className="space-y-3">
          {sorted.map((emp, i) => {
            const loc      = getLocation(emp.empId);
            const exceeded = emp.leaveCount > QUOTA;
            const barWidth = Math.round((emp.leaveCount / maxCount) * 100);

            return (
              <div
                key={emp.empId}
                className={`flex items-center gap-4 p-4 border rounded-xl transition-colors ${
                  exceeded
                    ? "border-red-200 bg-red-50"
                    : "border-gray-200 bg-white hover:border-indigo-200"
                }`}
              >
                {/* Rank */}
                <div className={`text-sm font-semibold w-6 text-center flex-shrink-0 ${
                  i === 0 ? "text-amber-500" :
                  i === 1 ? "text-gray-500"  :
                  i === 2 ? "text-orange-400": "text-gray-300"
                }`}>
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                </div>

                {/* Avatar */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${
                  exceeded ? "bg-red-100 text-red-700" : "bg-indigo-100 text-indigo-700"
                }`}>
                  {(emp.empName || "?").split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-gray-800 truncate">
                      {emp.empName}
                    </span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      loc === "Palakkad"
                        ? "bg-green-100 text-green-700"
                        : loc === "Chittoor"
                        ? "bg-orange-100 text-orange-700"
                        : "bg-gray-100 text-gray-500"
                    }`}>
                      {loc}
                    </span>
                    {exceeded && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                        Quota exceeded
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">{emp.empId}</div>

                  {/* Bar */}
                  <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden w-full max-w-xs">
                    <div
                      className={`h-full rounded-full transition-all ${
                        exceeded ? "bg-red-400" : "bg-indigo-400"
                      }`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>

                {/* Count */}
                <div className={`text-xl font-bold flex-shrink-0 ${
                  exceeded ? "text-red-600" : "text-indigo-600"
                }`}>
                  {emp.leaveCount}
                  <span className="text-xs font-normal text-gray-400 ml-1">days</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TopLeaveTakers;
