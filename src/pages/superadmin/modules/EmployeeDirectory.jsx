import { useEffect, useMemo, useState, useCallback } from "react";

const getLocation = (employeeId) => {
  if (!employeeId) return "Unknown";
  if (employeeId.startsWith("AREP")) return "Palakkad";
  if (employeeId.startsWith("AREC")) return "Chittoor";
  return "Unknown";
};

const getInitials = (name = "") =>
  name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

const AVATAR_COLORS = [
  "bg-indigo-100 text-indigo-700",
  "bg-green-100 text-green-700",
  "bg-pink-100 text-pink-700",
  "bg-amber-100 text-amber-700",
  "bg-teal-100 text-teal-700",
  "bg-purple-100 text-purple-700",
];

const avatarColor = (id = "") =>
  AVATAR_COLORS[id.charCodeAt(id.length - 1) % AVATAR_COLORS.length];

const EmployeeDirectory = () => {
  const [data, setData]         = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [search, setSearch]     = useState("");
  const [department, setDept]   = useState("All");
  const [location, setLocation] = useState("All");
  const [sortField, setSort]    = useState("name");
  const [sortDir, setSortDir]   = useState("asc");

  const token = sessionStorage.getItem("authToken");

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("http://localhost:9090/getAllEmployees", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const json = await res.json();
      setData(json.employees || []);
    } catch (e) {
      setError(e.message || "Failed to load employees");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const departments = useMemo(() => {
    const set = new Set(data.map((e) => e.department).filter(Boolean));
    return ["All", ...Array.from(set).sort()];
  }, [data]);

  const filtered = useMemo(() => {
    let result = data.filter((emp) => {
      const s = search.toLowerCase();
      const matchSearch =
        !search ||
        emp.employeeName?.toLowerCase().includes(s) ||
        emp.employeeId?.toLowerCase().includes(s);
      const matchDept = department === "All" || emp.department === department;
      const matchLoc  = location === "All" || getLocation(emp.employeeId) === location;
      return matchSearch && matchDept && matchLoc;
    });

    result = [...result].sort((a, b) => {
      const aVal = sortField === "name" ? a.employeeName : a.employeeId;
      const bVal = sortField === "name" ? b.employeeName : b.employeeId;
      const cmp  = (aVal || "").localeCompare(bVal || "");
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [data, search, department, location, sortField, sortDir]);

  const toggleSort = (field) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSort(field); setSortDir("asc"); }
  };

  return (
    <div className="space-y-5">

      {/* ─── Controls ─── */}
      <div className="flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder="Search name or ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border px-3 py-2 rounded-md text-sm w-56 focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
        <select
          value={department}
          onChange={(e) => setDept(e.target.value)}
          className="border px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
        >
          {departments.map((d) => <option key={d}>{d}</option>)}
        </select>
        <select
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="border px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
        >
          {["All", "Palakkad", "Chittoor"].map((l) => <option key={l}>{l}</option>)}
        </select>
        <div className="flex gap-2 ml-auto items-center">
          <span className="text-xs text-gray-400">Sort:</span>
          <button
            onClick={() => toggleSort("name")}
            className={`text-xs px-3 py-1.5 rounded-md border transition-colors ${
              sortField === "name"
                ? "bg-indigo-600 text-white border-indigo-600"
                : "border-gray-200 text-gray-500 hover:bg-gray-50"
            }`}
          >
            Name {sortField === "name" ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
          </button>
          <button
            onClick={() => toggleSort("id")}
            className={`text-xs px-3 py-1.5 rounded-md border transition-colors ${
              sortField === "id"
                ? "bg-indigo-600 text-white border-indigo-600"
                : "border-gray-200 text-gray-500 hover:bg-gray-50"
            }`}
          >
            ID {sortField === "id" ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
          </button>
        </div>
        {(search || department !== "All" || location !== "All") && (
          <span className="text-xs text-gray-400">
            {filtered.length} of {data.length} employees
          </span>
        )}
      </div>

      {/* ─── Error ─── */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
          <span>⚠</span> {error}
          <button onClick={fetchEmployees} className="ml-auto underline text-xs">Retry</button>
        </div>
      )}

      {/* ─── Skeleton ─── */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="border rounded-xl p-4 animate-pulse space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
              <div className="h-3 bg-gray-100 rounded w-full" />
              <div className="h-3 bg-gray-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      )}

      {/* ─── Empty ─── */}
      {!loading && !error && filtered.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <div className="text-4xl mb-3">👥</div>
          <div className="text-sm">
            {search || department !== "All" || location !== "All"
              ? "No employees match your filters"
              : "No employees found"}
          </div>
        </div>
      )}

      {/* ─── Cards ─── */}
      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((emp) => {
            const loc = getLocation(emp.employeeId);
            return (
              <div
                key={emp.employeeId}
                className="bg-white border border-gray-200 rounded-xl p-4 hover:border-indigo-200 hover:shadow-sm transition-all space-y-3"
              >
                {/* Avatar + Name */}
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${avatarColor(emp.employeeId)}`}>
                    {getInitials(emp.employeeName)}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-800 truncate">
                      {emp.employeeName}
                    </div>
                    <div className="text-xs text-gray-400">{emp.employeeId}</div>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-1 text-xs text-gray-500">
                  {emp.designation && (
                    <div className="truncate">{emp.designation}</div>
                  )}
                  {emp.department && (
                    <div className="truncate text-gray-400">{emp.department}</div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    loc === "Palakkad"
                      ? "bg-green-100 text-green-700"
                      : loc === "Chittoor"
                      ? "bg-orange-100 text-orange-700"
                      : "bg-gray-100 text-gray-500"
                  }`}>
                    {loc}
                  </span>
                  {emp.email && (
                    <span className="text-xs text-gray-400 truncate max-w-[120px]">
                      {emp.email}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EmployeeDirectory;
