import { useEffect, useState, useCallback, useMemo } from "react";
import { useAuth } from "../../auth/useAuth";
import { API_BASE_URL } from "../../config/api";
import AttendanceInfo from "../faculty/AttendanceInfo";
import { ChevronLeft, ChevronRight, Search, X } from "lucide-react";

/* ─── Helpers ─── */
const getLocation = (id = "", location = "") => {
  const loc = (location || "").toLowerCase();
  if (loc.includes("pal")) return "Palakkad";
  if (loc.includes("chi")) return "Chittoor";
  if (id.startsWith("AREP")) return "Palakkad";
  if (id.startsWith("AREC")) return "Chittoor";
  return "Unknown";
};

const getInitials = (first = "", last = "") =>
  `${first[0] || ""}${last[0] || ""}`.toUpperCase();

const normalizeFacultyResponse = (emp) => {
  const rawName = emp?.empName || emp?.name || "";
  const nameParts = rawName.trim().split(/\s+/).filter(Boolean);
  const firstName = emp?.firstName || nameParts[0] || "";
  const lastName = emp?.lastName || nameParts.slice(1).join(" ") || "";

  return {
    ...emp,
    firstName,
    lastName,
    empId: emp?.empId || emp?.employeeId || emp?.userName || "",
    activeStatus: emp?.activeStatus || emp?.isActive || "Active",
    location: emp?.location || emp?.collegeLocation || emp?.collageLocation || "",
    facultyDept: emp?.facultyDept || emp?.designation || "",
  };
};

const LOC_STYLE = {
  Palakkad: "bg-green-100 text-green-700",
  Chittoor: "bg-orange-100 text-orange-700",
  Unknown:  "bg-gray-100 text-gray-500",
};

const AVATAR_COLORS = [
  "bg-indigo-100 text-indigo-700",
  "bg-purple-100 text-purple-700",
  "bg-pink-100 text-pink-700",
  "bg-teal-100 text-teal-700",
  "bg-amber-100 text-amber-700",
  "bg-blue-100 text-blue-700",
];

const avatarColor = (id = "") =>
  AVATAR_COLORS[id.charCodeAt(id.length - 1) % AVATAR_COLORS.length];

const FacultyAttendance = () => {
  const { user } = useAuth();

  const [faculty,       setFaculty]       = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState(null);
  const [selectedEmp,   setSelectedEmp]   = useState(null);
  const [collapsed,     setCollapsed]     = useState(false);
  const [search,        setSearch]        = useState("");
  const [locFilter]     = useState("All");
  const [showInactive,  setShowInactive]  = useState(false);

  /* ─── Fetch faculty list ─── */
  const fetchFaculty = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(
        `${API_BASE_URL}/admin/facultyDetails?rmEmpId=${user?.employeeId}`,
        { headers: { Authorization: `Bearer ${sessionStorage.getItem("authToken")}` } }
      );
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const json = await res.json();
      const rawFaculty = Array.isArray(json)
        ? json
        : json?.FacultyDetails || json?.facultyDetails || json?.data || [];
      setFaculty((rawFaculty || []).map(normalizeFacultyResponse));
    } catch (e) {
      setError(e.message || "Failed to load faculty");
    } finally {
      setLoading(false);
    }
  }, [user?.employeeId]);

  useEffect(() => {
    fetchFaculty();
  }, [fetchFaculty]);

  /* ─── Filter list ─── */
  const filtered = useMemo(() => {
    return faculty.filter((emp) => {
      const fullName = `${emp.firstName || ""} ${emp.lastName || ""}`.toLowerCase();
      const matchSearch =
        !search ||
        fullName.includes(search.toLowerCase()) ||
        emp.empId?.toLowerCase().includes(search.toLowerCase());
      const matchLoc =
        locFilter === "All" || getLocation(emp.empId, emp.location) === locFilter;
      const matchActive =
        showInactive ? true : emp.activeStatus === "Active";
      return matchSearch && matchLoc && matchActive;
    });
  }, [faculty, search, locFilter, showInactive]);

  const inactiveCount = useMemo(
    () => faculty.filter((e) => e.activeStatus !== "Active").length,
    [faculty]
  );

  return (
    <div className="flex h-[calc(100vh-130px)] gap-0 overflow-hidden rounded-xl border border-gray-200 bg-white">

      {/* ══════════════════════════════
          SIDEBAR — Faculty List
      ══════════════════════════════ */}
      <div
        className={`flex flex-col border-r border-gray-200 transition-all duration-300 flex-shrink-0 ${
          collapsed ? "w-14" : "w-72"
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between px-3 py-3 border-b border-gray-100 flex-shrink-0">
          {!collapsed && (
            <span className="text-sm font-semibold text-gray-700 truncate">
              Faculty
              <span className="ml-2 text-xs font-normal text-gray-400">
                {filtered.length}/{faculty.length}
              </span>
            </span>
          )}
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors ml-auto flex-shrink-0"
            title={collapsed ? "Expand" : "Collapse"}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Search + Filters — hidden when collapsed */}
        {!collapsed && (
          <div className="px-3 py-2 space-y-2 border-b border-gray-100 flex-shrink-0">

            {/* Search */}
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search name or ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-7 py-1.5 text-xs border border-gray-200 rounded-lg
                           focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"
                >
                  <X size={12} />
                </button>
              )}
            </div>


            {/* Inactive toggle */}
            {inactiveCount > 0 && (
              <button
                onClick={() => setShowInactive((v) => !v)}
                className={`w-full flex items-center justify-between text-[10px] font-medium px-2.5 py-1.5 rounded-lg border transition-colors ${
                  showInactive
                    ? "bg-amber-50 border-amber-200 text-amber-700"
                    : "border-gray-200 text-gray-400 hover:bg-gray-50"
                }`}
              >
                <span>Show inactive</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[9px] ${
                  showInactive ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-500"
                }`}>
                  {inactiveCount}
                </span>
              </button>
            )}
          </div>
        )}

        {/* Faculty List */}
        <div className="flex-1 overflow-y-auto">

          {/* Loading */}
          {loading && (
            <div className="space-y-2 p-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2 animate-pulse">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0" />
                  {!collapsed && (
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 bg-gray-200 rounded w-3/4" />
                      <div className="h-2.5 bg-gray-100 rounded w-1/2" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="p-3 text-xs text-red-500 text-center">
              {error}
              <button onClick={fetchFaculty} className="block mx-auto mt-1 underline">
                Retry
              </button>
            </div>
          )}

          {/* Empty */}
          {!loading && !error && filtered.length === 0 && (
            <div className="p-4 text-center text-xs text-gray-400">
              {search ? "No results found" : "No faculty found"}
            </div>
          )}

          {/* Rows */}
          {!loading && filtered.map((emp) => {
            const loc      = getLocation(emp.empId, emp.location);
            const initials = getInitials(emp.firstName, emp.lastName);
            const isActive = emp.activeStatus === "Active";
            const isSelected = selectedEmp?.empId === emp.empId;
            const fullName = `${emp.firstName || ""} ${emp.lastName || ""}`.trim();

            return (
              <button
                key={emp.empId}
                onClick={() => setSelectedEmp(emp)}
                title={collapsed ? `${fullName} · ${emp.empId}` : undefined}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 transition-colors text-left border-b border-gray-50
                  ${isSelected
                    ? "bg-indigo-50 border-l-2 border-l-indigo-500"
                    : "hover:bg-gray-50 border-l-2 border-l-transparent"
                  }`}
              >
                {/* Avatar */}
                <div className={`relative w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${
                  isSelected ? "bg-indigo-200 text-indigo-800" : avatarColor(emp.empId)
                }`}>
                  {initials}
                  {!isActive && (
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-amber-400 border border-white" />
                  )}
                </div>

                {/* Info — hidden when collapsed */}
                {!collapsed && (
                  <div className="flex-1 min-w-0">
                    <div className={`text-xs font-medium truncate ${
                      isSelected ? "text-indigo-700" : "text-gray-800"
                    }`}>
                      {fullName}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] text-gray-400 truncate">{emp.empId}</span>
                      <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0 ${LOC_STYLE[loc]}`}>
                        {loc === "Palakkad" ? "PKD" : loc === "Chittoor" ? "CTR" : "?"}
                      </span>
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ══════════════════════════════
          MAIN — Attendance View
      ══════════════════════════════ */}
      <div className="flex-1 overflow-y-auto min-w-0">
        {selectedEmp ? (
          <div className="p-4">
            {/* Selected employee banner */}
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${avatarColor(selectedEmp.empId)}`}>
                {getInitials(selectedEmp.firstName, selectedEmp.lastName)}
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-800">
                  {selectedEmp.firstName || ""} {selectedEmp.lastName || ""}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-gray-400">{selectedEmp.empId}</span>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${LOC_STYLE[getLocation(selectedEmp.empId, selectedEmp.location)]}`}>
                    {getLocation(selectedEmp.empId, selectedEmp.location)}
                  </span>
                  <span className="text-xs text-gray-400">{selectedEmp.facultyDept}</span>
                </div>
              </div>
            </div>

            {/* Attendance calendar for selected employee */}
            <AttendanceInfo employeeId={selectedEmp.empId} />
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 p-10">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2"/>
                <path d="M16 2v4M8 2v4M3 10h18"/>
              </svg>
            </div>
            <div className="text-sm font-medium text-gray-500 mb-1">
              No faculty selected
            </div>
            <div className="text-xs text-gray-400">
              Select a faculty member from the list to view their attendance
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default FacultyAttendance;
