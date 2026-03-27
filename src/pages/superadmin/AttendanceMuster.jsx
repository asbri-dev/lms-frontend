import { useEffect, useMemo, useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { exportAttendanceExcel } from "../../utils/excel";

const STATUS_MAP = {
  Present: { label: "P", color: "bg-green-100 text-green-700" },
  Absent: { label: "A", color: "bg-red-100 text-red-700" },
  Holiday: { label: "H", color: "bg-blue-100 text-blue-700" },
  Off: { label: "OFF", color: "bg-gray-200 text-gray-700" },
  "cl": { label: "CL", color: "bg-purple-100 text-purple-700" },
  "ml": { label: "ML", color: "bg-pink-100 text-pink-700" },
  Onduty: { label: "OD", color: "bg-yellow-100 text-yellow-700" }
};

const AttendanceMuster = () => {
  const [month, setMonth] = useState(format(new Date(), "yyyy-MM"));
  const [data, setData] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  /* ================= Month Range ================= */
  const { fromDate, endDate } = useMemo(() => {
    const d = new Date(`${month}-01`);
    return {
      fromDate: format(startOfMonth(d), "dd-MMM-yyyy"),
      endDate: format(endOfMonth(d), "dd-MMM-yyyy")
    };
  }, [month]);

  /* ================= Month Days ================= */
  const days = useMemo(() => {
    const start = new Date(`${month}-01`);
    const end = endOfMonth(start);
    return eachDayOfInterval({ start, end });
  }, [month]);

  /* ================= Fetch Attendance ================= */
  useEffect(() => {
    let ignore = false;

    const fetchAttendance = async () => {
      try {
        setLoading(true);

        const res = await fetch(
          `http://localhost:9090/getAttendanceMuster?fromDate=${fromDate}&endDate=${endDate}`
        );

        const json = await res.json();

        if (!res.ok) throw new Error("Failed to load attendance");

        if (!ignore) setData(json.AttendanceMuster || []);
      } catch (e) {
        console.error(e);
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    fetchAttendance();

    return () => {
      ignore = true;
    };
  }, [fromDate, endDate]);

  /* ================= Search Filter ================= */
  const filtered = useMemo(() => {
    if (!search) return data;

    const s = search.toLowerCase();

    return data.filter(emp =>
      emp.employeeName?.toLowerCase().includes(s) ||
      emp.employeeId?.toLowerCase().includes(s)
    );
  }, [data, search]);

  return (
    <div className="p-6 space-y-6">

      {/* ================= HEADER ================= */}
      <div className="flex flex-wrap items-center gap-4">

        <input
          type="text"
          placeholder="Search employee name or ID..."
          className="border px-3 py-2 rounded-md"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="border px-3 py-2 rounded-md"
        />

        <button
          onClick={() => exportAttendanceExcel(filtered, days)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
        >
          Export Excel
        </button>

      </div>

      {/* ================= ATTENDANCE LEGEND ================= */}
      <div className="flex flex-wrap gap-4 text-xs">

        {Object.entries(STATUS_MAP).map(([key, val]) => (
          <div key={key} className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded ${val.color}`}>
              {val.label}
            </span>
            <span className="text-gray-600">{key}</span>
          </div>
        ))}

      </div>

      {/* ================= TABLE ================= */}
      <div className="overflow-x-auto border rounded-lg">

        <table className="min-w-max text-sm border-collapse">

          <thead className="bg-gray-100">

            <tr>

              <th className="p-3 text-left sticky left-0 bg-gray-100 z-10">
                Employee
              </th>

              {days.map(day => (
                <th key={day.toISOString()} className="p-2 text-center">

                  <div>{format(day, "dd")}</div>

                  <div className="text-xs text-gray-500">
                    {format(day, "EEE")}
                  </div>

                </th>
              ))}

              {/* TOTAL COLUMNS */}
              <th className="px-3 text-xs">P</th>
              <th className="px-3 text-xs">A</th>
              <th className="px-3 text-xs">CL</th>
              <th className="px-3 text-xs">ML</th>
              <th className="px-3 text-xs">OD</th>
              <th className="px-3 text-xs">OFF</th>
              <th className="px-3 text-xs">H</th>

            </tr>

          </thead>

          <tbody>

            {loading && (
              <tr>
                <td colSpan={days.length + 8} className="text-center p-6">
                  Loading attendance...
                </td>
              </tr>
            )}

            {!loading && filtered.map(emp => {

              const map = {};

              const totals = {
                Present: 0,
                Absent: 0,
                "cl": 0,
                "ml": 0,
                Onduty: 0,
                Off: 0,
                Holiday: 0
              };

              emp.attendanceHistory?.forEach(a => {
                map[a.date] = a.status;

                if (totals[a.status] !== undefined) {
                  totals[a.status]++;
                }
              });

              return (

                <tr key={emp.employeeId} className="border-t">

                  {/* EMPLOYEE */}
                  <td className="p-3 sticky left-0 bg-white z-10">

                    <div className="font-medium">
                      {emp.employeeName}
                    </div>

                    <div className="text-xs text-gray-500">
                      {emp.employeeId}
                    </div>

                    <div className="text-xs text-gray-400">
                      {emp.department}
                    </div>

                  </td>

                  {/* DAILY STATUS */}
                  {days.map(day => {

                    const dateStr = format(day, "dd-MMM-yyyy");

                    const status = map[dateStr];

                    const statusObj = STATUS_MAP[status];

                    return (
                      <td key={dateStr} className="p-2 text-center">

                        {statusObj && (
                          <span className={`px-2 py-1 rounded text-xs ${statusObj.color}`}>
                            {statusObj.label}
                          </span>
                        )}

                      </td>
                    );

                  })}

                  {/* TOTALS */}
                  <td className="text-center font-semibold text-green-700">
                    {totals.Present}
                  </td>

                  <td className="text-center font-semibold text-red-600">
                    {totals.Absent}
                  </td>

                  <td className="text-center">{totals["cl"]}</td>

                  <td className="text-center">{totals["ml"]}</td>

                  <td className="text-center">{totals.Onduty}</td>

                  <td className="text-center">{totals.Off}</td>

                  <td className="text-center">{totals.Holiday}</td>

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