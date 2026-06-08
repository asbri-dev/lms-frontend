import { useEffect, useMemo, useState, useCallback } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
//import { exportAttendanceExcel } from "../../utils/excel";
import { Search, MapPin, Building2, Calendar, Download } from "lucide-react";
import toast from "react-hot-toast";
import { API_BASE_URL } from "../../config/api";

/* ─── Status Map ─── */
const STATUS_MAP = {
  Present: { label: "P",   color: "bg-green-100 text-green-800",   display: "Present"       },
  Absent:  { label: "A",   color: "bg-red-100 text-red-800",       display: "Absent"        },
  Holiday: { label: "H",   color: "bg-blue-100 text-blue-800",     display: "Holiday"       },
  Off:     { label: "OFF", color: "bg-gray-200 text-gray-600",     display: "Week Off"      },
  CL:      { label: "CL",  color: "bg-purple-100 text-purple-800", display: "Casual Leave"  },
  ML:      { label: "ML",  color: "bg-pink-100 text-pink-800",     display: "Medical Leave" },
  OD:      { label: "OD",  color: "bg-yellow-100 text-yellow-800", display: "On Duty"       },
  Unknown: { label: "?",   color: "bg-gray-100 text-gray-400",     display: "Unknown"       },
  // lowercase + alternate aliases from API
  cl:      { label: "CL",  color: "bg-purple-100 text-purple-800", display: "Casual Leave"  },
  ml:      { label: "ML",  color: "bg-pink-100 text-pink-800",     display: "Medical Leave" },
  Onduty:  { label: "OD",  color: "bg-yellow-100 text-yellow-800", display: "On Duty"       },
};

const LEGEND_ENTRIES = [
  { key: "Present", ...STATUS_MAP.Present },
  { key: "Absent",  ...STATUS_MAP.Absent  },
  { key: "CL",      ...STATUS_MAP.CL      },
  { key: "ML",      ...STATUS_MAP.ML      },
  { key: "OD",      ...STATUS_MAP.OD      },
  { key: "Off",     ...STATUS_MAP.Off     },
  { key: "Holiday", ...STATUS_MAP.Holiday },
  { key: "Unknown", ...STATUS_MAP.Unknown },
];

const TOTAL_KEYS = ["Present", "Absent", "CL", "ML", "OD", "Off", "Holiday", "Unknown"];

/* ─── Derive location from employeeId prefix ─── */
const getLocation = (employeeId) => {
  if (!employeeId) return "Unknown";
  if (employeeId.startsWith("AREP")) return "Palakkad";
  if (employeeId.startsWith("AREC")) return "Chittoor";
  return "Unknown";
};

/* ─── Normalize status key to canonical form ─── */
const normalizeStatus = (status) => {
  if (!status) return null;
  if (status === "cl" || status === "CL") return "CL";
  if (status === "ml" || status === "ML") return "ML";
  if (status === "Onduty" || status === "OD") return "OD";
  return status;
};

const AttendanceMuster = () => {
  const [month, setMonth]         = useState(format(new Date(), "yyyy-MM"));
  const [data, setData]           = useState([]);
  const [search, setSearch]       = useState("");
  const [department, setDept]     = useState("All");
  const [location, setLocation]   = useState("All");
  const [sortField, setSortField] = useState(null); // "name" | "id"
  const [sortDir, setSortDir]     = useState("asc");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);

  const token = sessionStorage.getItem("authToken");

  /* ─── Month Range ─── */
  const { fromDate, endDate } = useMemo(() => {
    const d = new Date(`${month}-01`);
    return {
      fromDate: format(startOfMonth(d), "dd-MMM-yyyy"),
      endDate:  format(endOfMonth(d),   "dd-MMM-yyyy"),
    };
  }, [month]);

  /* ─── Days in month ─── */
  const days = useMemo(() => {
    const start = new Date(`${month}-01`);
    return eachDayOfInterval({ start, end: endOfMonth(start) });
  }, [month]);

  /* ─── Fetch ─── */
  const fetchAttendance = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(
        `${API_BASE_URL}/getAttendanceMuster?fromDate=${fromDate}&endDate=${endDate}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!res.ok) throw new Error(`Server error: ${res.status}`);

      const json = await res.json();
      setData(json.AttendanceMuster || []);
    } catch (e) {
      setError(e.message || "Failed to load attendance");
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [fromDate, endDate, token]);

useEffect(() => {
  fetchAttendance();
}, [fetchAttendance]);

  /* ─── Departments ─── */
  const departments = useMemo(() => {
    const set = new Set(data.map(e => e.department).filter(Boolean));
    return ["All", ...Array.from(set).sort()];
  }, [data]);

  /* ─── Locations (derived from employeeId) ─── */
  const locations = useMemo(() => {
    const set = new Set(data.map(e => getLocation(e.employeeId)));
    return ["All", ...Array.from(set).sort()];
  }, [data]);

  /* ─── Filter + Sort ─── */
  const filtered = useMemo(() => {
    let result = data.filter(emp => {
      const s = search.toLowerCase();
      const matchSearch =
        !search ||
        emp.employeeName?.toLowerCase().includes(s) ||
        emp.employeeId?.toLowerCase().includes(s);
      const matchDept     = department === "All" || emp.department === department;
      const matchLocation = location  === "All" || getLocation(emp.employeeId) === location;
      return matchSearch && matchDept && matchLocation;
    });

    if (sortField) {
      result = [...result].sort((a, b) => {
        const aVal = sortField === "name" ? a.employeeName : a.employeeId;
        const bVal = sortField === "name" ? b.employeeName : b.employeeId;
        const cmp  = (aVal || "").localeCompare(bVal || "");
        return sortDir === "asc" ? cmp : -cmp;
      });
    }

    return result;
  }, [data, search, department, location, sortField, sortDir]);


 const exportAttendanceExcel = async (fromdate, todate, location) => {
  try {
    const res = await fetch(
      `${API_BASE_URL}/downloadAttendanceMusterExcel?fromDate=${fromdate}&toDate=${todate}&collegeLocation=${location}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (res.status === 200) {
      toast.success("C:/Downloads/Attendance_Muster");
    } else {
      toast.error("Failed to export attendance muster.");
    }
  } catch (error) {
    console.error(error);
    toast.error("Something went wrong!");
  }
};

  /* ─── Summary bar totals ─── */
  const summary = useMemo(() => {
    const totals = { Present: 0, Absent: 0, CL: 0, ML: 0, OD: 0, Off: 0, Holiday: 0, Unknown: 0 };
    filtered.forEach(emp =>
      emp.attendanceHistory?.forEach(a => {
        const key = normalizeStatus(a.status);
        if (key && totals[key] !== undefined) totals[key]++;
      })
    );
    return totals;
  }, [filtered]);

  /* ─── Sort toggle ─── */
  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <span className="text-gray-300 ml-1">↕</span>;
    return <span className="text-indigo-500 ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>;
  };

  return (
    <div className="p-6 space-y-5">

      {/* ─── Controls ─── */}
     
<div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">

  {/* 🔍 Search */}
  <div className="relative">
    <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
    <input
      type="text"
      placeholder="Search name or ID..."
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      className="pl-9 pr-3 py-2 w-56 rounded-lg bg-gray-50 
                 border border-gray-200 text-sm
                 focus:outline-none focus:ring-2 focus:ring-[#2b3c6b]/30
                 focus:bg-white transition"
    />
  </div>

  {/* 🏢 Department */}
  <div className="relative">
    <Building2 className="absolute left-3 top-2.5 text-gray-400" size={16} />
    <select
      value={department}
      onChange={(e) => setDept(e.target.value)}
      className="pl-9 pr-6 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm
                 focus:outline-none focus:ring-2 focus:ring-[#2b3c6b]/30
                 appearance-none cursor-pointer"
    >
      {departments.map((d) => (
        <option key={d}>{d}</option>
      ))}
    </select>
  </div>

  {/* 📍 Location */}
  <div className="relative">
    <MapPin className="absolute left-3 top-2.5 text-gray-400 " size={16} />
    <select
      value={location}
      onChange={(e) => setLocation(e.target.value)}
      className="pl-9 pr-6 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm
                 focus:outline-none focus:ring-2 focus:ring-[#2b3c6b]/30
                 appearance-none cursor-pointer"
    >
      {locations.map((l) => (
        <option key={l}>{l}</option>
      ))}
    </select>
  </div>

  {/* 📅 Month */}
  <div className="relative">
    <Calendar className="absolute left-3 top-2.5 text-gray-400 " size={16} />
    <input
      type="month"
      value={month}
      onChange={(e) => setMonth(e.target.value)}
      className="pl-9 pr-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm
                 focus:outline-none focus:ring-2 focus:ring-[#2b3c6b]/30"
    />
  </div>

  {/* ⬇ Export */}
  <button
    onClick={() => exportAttendanceExcel(fromDate, endDate, location)}
    disabled={filtered.length === 0 || loading}
    className="flex items-center gap-2 px-4 py-2 rounded-lg 
               bg-gradient-to-r from-[#2b3c6b] to-[#3f548f] 
               text-white text-sm font-medium
               hover:opacity-90 transition shadow-sm
               disabled:opacity-50 disabled:cursor-not-allowed"
  >
    <Download size={16} />
    Export
  </button>

  {/* 📊 Result count */}
  {(search || department !== "All" || location !== "All") && (
    <span className="text-sm text-gray-500 ml-auto">
      Showing <b>{filtered.length}</b> of <b>{data.length}</b>
    </span>
  )}

</div>

      {/* ─── Legend ─── */}
      <div className="flex flex-wrap gap-3">
        {LEGEND_ENTRIES.map(e => (
          <div key={e.key} className="flex items-center gap-1.5">
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${e.color}`}>
              {e.label}
            </span>
            <span className="text-xs text-gray-500">{e.display}</span>
          </div>
        ))}
      </div>

      {/* ─── Summary bar ─── */}
      {!loading && filtered.length > 0 && (
        <div className="flex flex-wrap gap-5 bg-gray-50 border rounded-lg px-4 py-2.5 text-sm">
          <span className="text-gray-500 font-medium">Summary:</span>
          <span className="text-green-700 font-medium">P: {summary.Present}</span>
          <span className="text-red-600 font-medium">A: {summary.Absent}</span>
          <span className="text-purple-700">CL: {summary.CL}</span>
          <span className="text-pink-700">ML: {summary.ML}</span>
          <span className="text-yellow-700">OD: {summary.OD}</span>
          <span className="text-gray-500">OFF: {summary.Off}</span>
          <span className="text-blue-600">H: {summary.Holiday}</span>
          <span className="text-gray-400">?: {summary.Unknown}</span>
        </div>
      )}

      {/* ─── Error ─── */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
          <span>⚠</span>
          <span>{error}</span>
          <button
            onClick={fetchAttendance}
            className="ml-auto underline text-red-600 text-xs hover:text-red-800"
          >
            Retry
          </button>
        </div>
      )}

      {/* ─── Table ─── */}
      <div className="overflow-x-auto border rounded-lg">
        <table className="min-w-max text-sm border-collapse">

          <thead className="bg-gray-100 sticky top-0 z-20">
            <tr>

              {/* Employee col — sortable by name & id */}
              <th className="p-3 text-left sticky left-0 bg-gray-100 z-30 min-w-[180px] border-r border-gray-200">
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => toggleSort("name")}
                    className="flex items-center text-left text-xs font-semibold text-gray-600 hover:text-indigo-600 transition-colors hover:text-[#2b3c6b]
             transition cursor-pointer"
                  >
                    Name <SortIcon field="name" />
                  </button>
                </div>
              </th>
              <th className="p-3 text-left sticky left-0 bg-gray-100 z-20 min-w-[120px] border-r border-gray-200">
                <div className="flex flex-col gap-1">
                   <button
                    onClick={() => toggleSort("id")}
                    className="flex items-center text-left text-xs font-normal text-gray-400 hover:text-indigo-500 transition-colors hover:text-[#2b3c6b]
             transition cursor-pointer"
                  >
                    ID <SortIcon field="id" />
                  </button>
                </div>
              </th>

              {/* Date columns */}
              {days.map(day => {
                const isSun = day.getDay() === 0;
                const isSat = day.getDay() === 6;
                return (
                  <th
                    key={day.toISOString()}
                    className={`p-2 text-center min-w-[38px] ${
                      isSun || isSat ? "bg-blue-50 text-blue-600" : ""
                    }`}
                  >
                    <div className="font-medium text-xs">{format(day, "dd")}</div>
                    <div className="text-xs text-gray-400">{format(day, "EEE")}</div>
                  </th>
                );
              })}

              {/* Total columns */}
              {TOTAL_KEYS.map(k => (
                <th key={k} className="px-2 py-3 text-xs font-semibold text-gray-500 min-w-[34px] text-center">
                  {k === "Unknown" ? "?" : k === "Holiday" ? "H" : k}
                </th>
              ))}

            </tr>
          </thead>

          <tbody>

            {/* Skeleton loader */}
            {loading && Array.from({ length: 6 }).map((_, i) => (
              <tr key={i} className="border-t animate-pulse">
                <td className="p-3 sticky left-0 bg-white border-r border-gray-100">
                  <div className="h-4 bg-gray-200 rounded w-32 mb-1.5" />
                  <div className="h-3 bg-gray-100 rounded w-20 mb-1" />
                  <div className="h-3 bg-gray-100 rounded w-24" />
                </td>
                {days.map(d => (
                  <td key={d.toISOString()} className="p-2">
                    <div className="h-5 w-7 bg-gray-100 rounded mx-auto" />
                  </td>
                ))}
                {TOTAL_KEYS.map(k => (
                  <td key={k} className="px-2">
                    <div className="h-4 w-5 bg-gray-100 rounded mx-auto" />
                  </td>
                ))}
              </tr>
            ))}

            {/* Empty state */}
            {!loading && !error && filtered.length === 0 && (
              <tr>
                <td
                  colSpan={days.length + TOTAL_KEYS.length + 1}
                  className="text-center py-16 text-gray-400 text-sm"
                >
                  <div className="text-3xl mb-2">📋</div>
                  <div>
                    {search || department !== "All" || location !== "All"
                      ? "No employees match your filters"
                      : "No attendance data for this month"}
                  </div>
                </td>
              </tr>
            )}

            {/* Data rows */}
            {!loading && filtered.map(emp => {

              const map    = {};
              const totals = { Present: 0, Absent: 0, CL: 0, ML: 0, OD: 0, Off: 0, Holiday: 0, Unknown: 0 };

              emp.attendanceHistory?.forEach(a => {
                map[a.date] = a.status;
                const key = normalizeStatus(a.status);
                if (key && totals[key] !== undefined) totals[key]++;
              });

              // Low attendance highlight: present < 50% of working days
              const workingDays  = days.length - totals.Off - totals.Holiday;
              const lowAttendance = workingDays > 0 && totals.Present / workingDays < 0.5;

              const empLocation = getLocation(emp.employeeId);

              return (
                <tr
                  key={emp.employeeId}
                  className={`border-t hover:bg-gray-50 transition-colors ${
                    lowAttendance ? "bg-red-50 hover:bg-red-50" : ""
                  }`}
                >

                  {/* Employee info */}
                  <td className="p-3 sticky left-0 z-10 bg-white border-r border-gray-100">
                    <div className="font-medium text-gray-800">{emp.employeeName}</div>
                   
                   
                    <span className={`inline-block mt-1 text-xs px-1.5 py-0.5 rounded-full font-medium ${
                      empLocation === "Palakkad"
                        ? "bg-green-100 text-green-700"
                        : empLocation === "Chittoor"
                        ? "bg-orange-100 text-orange-700"
                        : "bg-gray-100 text-gray-500"
                    }`}>
                      {empLocation}
                    </span>
                  </td>
                  <td className="p-3 sticky left-[180px] z-10 bg-white border-r border-gray-100 text-xs text-gray-500">
                    {emp.employeeId}
                  </td>
                  

                  {/* Daily status cells */}
                  {days.map(day => {
                    const dateStr   = format(day, "dd-MMM-yyyy");
                    const rawStatus = map[dateStr];
                    const statusObj = STATUS_MAP[rawStatus];
                    const isSun     = day.getDay() === 0;
                    const isSat     = day.getDay() === 6;

                    return (
                      <td
                        key={dateStr}
                        className={`p-1.5 text-center ${isSun || isSat ? "bg-blue-50/30" : ""}`}
                      >
                        {statusObj ? (
                          <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${statusObj.color}`}>
                            {statusObj.label}
                          </span>
                        ) : (
                          <span className="text-gray-200 text-xs">—</span>
                        )}
                      </td>
                    );
                  })}

                  {/* Totals */}
                  <td className="text-center text-xs font-semibold text-green-700 px-2">{totals.Present}</td>
                  <td className="text-center text-xs font-semibold text-red-600 px-2">{totals.Absent}</td>
                  <td className="text-center text-xs text-purple-700 px-2">{totals.CL}</td>
                  <td className="text-center text-xs text-pink-700 px-2">{totals.ML}</td>
                  <td className="text-center text-xs text-yellow-700 px-2">{totals.OD}</td>
                  <td className="text-center text-xs text-gray-500 px-2">{totals.Off}</td>
                  <td className="text-center text-xs text-blue-600 px-2">{totals.Holiday}</td>
                  <td className="text-center text-xs text-gray-400 px-2">{totals.Unknown}</td>

                </tr>
              );
            })}

          </tbody>
        </table>
      </div>

    </div>
  );
};

export default AttendanceMuster;
