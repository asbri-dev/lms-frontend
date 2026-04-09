import { useEffect, useMemo, useState, useCallback } from "react";
import toast from "react-hot-toast";

const QUOTA = 12;

const TopLeaveTakers = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const token = sessionStorage.getItem("authToken");

  // 🔥 FETCH DATA
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("http://localhost:9090/getAllRequest", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // ✅ Proper error handling
      if (!res.ok) {
        let errorText = "Failed to load data";

        try {
          const errData = await res.json();
          errorText = errData.message || errorText;
        } catch {
          errorText = await res.text();
        }

        throw new Error(errorText);
      }

      const json = await res.json();

      // 🔥 Normalize data (IMPORTANT)
      const normalized = (json.topLeaveTakers || []).map((e) => ({
        ...e,
        leaveCount: e.count,
      }));

      setData(normalized);
    } catch (e) {
      setError(e.message);
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 🔥 SORT
  const sorted = useMemo(
    () => [...data].sort((a, b) => b.leaveCount - a.leaveCount),
    [data]
  );

  // 🔥 MAX FOR BAR
  const maxCount = useMemo(
    () => Math.max(...sorted.map((e) => e.leaveCount), 1),
    [sorted]
  );

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">

      {/* 🔷 HEADER */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-800">
          Top Leave Takers
        </h1>

        <button
          onClick={fetchData}
          className="text-sm px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Refresh
        </button>
      </div>

      {/* 🔴 ERROR */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
          <span>⚠</span>
          {error}
        </div>
      )}

      {/* ⏳ LOADING */}
      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="p-4 border rounded-xl animate-pulse bg-gray-50"
            >
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-1/4" />
            </div>
          ))}
        </div>
      )}

      {/* 📭 EMPTY */}
      {!loading && sorted.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <div className="text-4xl mb-3">📊</div>
          <div>No data available</div>
        </div>
      )}

      {/* 📊 LIST */}
      {!loading && sorted.length > 0 && (
        <div className="space-y-3">
          {sorted.map((emp, i) => {
            const exceeded = emp.leaveCount > QUOTA;
            const barWidth = Math.round(
              (emp.leaveCount / maxCount) * 100
            );

            return (
              <div
                key={emp.empId}
                className={`flex items-center gap-4 p-4 border rounded-xl ${
                  exceeded
                    ? "bg-red-50 border-red-200"
                    : "bg-white border-gray-200 hover:border-indigo-200"
                }`}
              >
                {/* 🏆 RANK */}
                <div className="w-6 text-center font-semibold">
                  {i === 0
                    ? "🥇"
                    : i === 1
                    ? "🥈"
                    : i === 2
                    ? "🥉"
                    : `#${i + 1}`}
                </div>

                {/* 👤 AVATAR */}
                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold">
                  {emp.empName
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()}
                </div>

                {/* 📄 INFO */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-800">
                      {emp.empName}
                    </span>

                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                      {emp.location}
                    </span>

                    {exceeded && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600">
                        Exceeded
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-gray-400">
                    {emp.empId}
                  </div>

                  {/* 📊 BAR */}
                  <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        exceeded ? "bg-red-400" : "bg-indigo-400"
                      }`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>

                {/* 🔢 COUNT */}
                <div
                  className={`text-xl font-bold ${
                    exceeded ? "text-red-600" : "text-indigo-600"
                  }`}
                >
                  {emp.leaveCount}
                  <span className="text-xs ml-1 text-gray-400">
                    days
                  </span>
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