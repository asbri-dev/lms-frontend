import { useEffect, useState, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import { useAuth } from "../../auth/AuthContext";
import {
  getMonthRange,
  transformAttendanceData,
} from "../../utils/attendanceUtils";

const AttendanceInfo = ({ employeeId }) => {

  const { user } = useAuth();

  // 👇 Decide which employeeId to use
  const empId = employeeId || user?.employeeId;

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [eventMap, setEventMap] = useState({});
  const [selectedDetails, setSelectedDetails] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* =========================================
     Fetch Attendance (Month Based)
  ========================================= */

  const fetchAttendance = useCallback(async () => {

    if (!empId) return;

    try {

      setLoading(true);
      setError("");

      const { fromDate, toDate } = getMonthRange(currentMonth);

      const response = await fetch(
        `http://localhost:9090/getAttedanceInfo?empId=${empId}&fromDate=${fromDate}&toDate=${toDate}`
      );

      let data = null;

      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (response.status >= 500) {
        setError("Server error. Please try again later.");
        return;
      }

      if (!response.ok) {
        setError(data?.message || "Failed to load attendance.");
        return;
      }

      const transformed = transformAttendanceData(data);

      setEvents(transformed);

      const map = {};
      transformed.forEach((e) => {
        map[e.date] = e.extendedProps;
      });

      setEventMap(map);

      if (transformed.length > 0) {
        setSelectedDate(transformed[0].date);
        setSelectedDetails(transformed[0].extendedProps);
      } else {
        setSelectedDate(null);
        setSelectedDetails(null);
      }

    } catch {

      setError("Network error. Please check your connection.");

    } finally {

      setLoading(false);

    }

  }, [currentMonth, empId]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);
  return (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

    {/* LEFT SIDE - CALENDAR */}
    <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-md">

      {loading && (
        <div className="text-center text-gray-500 py-4">
          Loading...
        </div>
      )}

      {error && (
        <div className="text-red-500 text-center py-4">
          {error}
        </div>
      )}

      <FullCalendar
        plugins={[dayGridPlugin]}
        initialView="dayGridMonth"
        events={events}
        height="auto"
        eventDisplay="block"

        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: ""
        }}

        datesSet={(arg) => {
          const newMonth = arg.view.currentStart;

          if (
            newMonth.getMonth() !== currentMonth.getMonth() ||
            newMonth.getFullYear() !== currentMonth.getFullYear()
          ) {
            setCurrentMonth(newMonth);
          }
        }}

        dateClick={(info) => {
          setSelectedDate(info.dateStr);
          setSelectedDetails(eventMap[info.dateStr] || null);
        }}

        eventClick={(info) => {
          const clickedDate = info.event.startStr;
          setSelectedDate(clickedDate);
          setSelectedDetails(eventMap[clickedDate] || null);
        }}

        dayCellClassNames={(arg) =>
          arg.dateStr === selectedDate ? ["selected-day"] : []
        }
      />
    </div>


    {/* RIGHT SIDE - DETAILS */}
    <div className="space-y-6">

      {selectedDetails?.details ? (
        <>

          <h3 className="text-lg font-semibold text-gray-700">
            {selectedDetails.rawDate}
          </h3>

          {/* Status Card */}
          <div className="bg-white p-5 rounded-xl shadow-md">
            <h4 className="font-semibold text-gray-700 mb-2">
              Status Details
            </h4>

            <p className="text-gray-600">
              <span className="font-medium">Status:</span>{" "}
              {selectedDetails.details.status}
            </p>

            <p className="text-gray-600">
              <span className="font-medium">Total Work Hours:</span>{" "}
              {selectedDetails.details.workDuration}
            </p>
          </div>


          {/* Session Details */}
          <div className="bg-white p-5 rounded-xl shadow-md">
            <h4 className="font-semibold text-gray-700 mb-3">
              Session Details
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">

                <thead className="border-b">
                  <tr className="text-gray-600">
                    <th className="py-2">Session</th>
                    <th>Status</th>
                    <th>First In</th>
                    <th>Last Out</th>
                  </tr>
                </thead>

                <tbody className="text-gray-700">

                  <tr className="border-b">
                    <td className="py-2">Session 1</td>
                    <td>{selectedDetails.details.sessionOne}</td>
                    <td>{selectedDetails.details.punchIn}</td>
                    <td>-</td>
                  </tr>

                  <tr>
                    <td className="py-2">Session 2</td>
                    <td>{selectedDetails.details.sessionTwo}</td>
                    <td>-</td>
                    <td>{selectedDetails.details.punchOut}</td>
                  </tr>

                </tbody>

              </table>
            </div>
          </div>


          {/* Time Adjustments */}
          <div className="bg-white p-5 rounded-xl shadow-md">
            <h4 className="font-semibold text-gray-700 mb-2">
              Time Adjustments
            </h4>

            <div className="grid grid-cols-2 gap-2 text-gray-600 text-sm">
              <p>Late In: {selectedDetails.details.lateIn}</p>
              <p>Late Out: {selectedDetails.details.lateOut}</p>
              <p>Early In: {selectedDetails.details.earlyIn}</p>
              <p>Early Out: {selectedDetails.details.earlyOut}</p>
            </div>
          </div>

        </>
      ) : (
        <div className="bg-white p-6 rounded-xl shadow-md text-gray-500 text-center">
          No attendance data for selected date
        </div>
      )}
      {/* LEGEND */}
<div className="bg-white p-5 rounded-xl shadow-md">
  <h4 className="font-semibold text-gray-700 mb-3">
    Legend
  </h4>

  <div className="grid grid-cols-2 gap-3 text-sm">

    {[
      { label: "Present", color: "#D7FDF0", short: "P" },
      { label: "Absent", color: "#FE8985", short: "A" },
      { label: "Casual Leave", color: "#79ADDC", short: "CL" },
      { label: "Medical Leave", color: "#79ADDC", short: "ML" },
      { label: "Off Day", color: "#6b7280", short: "OFF" },
      { label: "Holiday", color: "#0ea5e9", short: "H" },
      { label: "On Duty", color: "#1B2A41", short: "OD" },
      { label: "Unknown", color: "#FF934F", short: "?" },
      { label: "Permission", color: "#9333ea", short: "PR" },
    ].map((item, index) => (
      <div key={index} className="flex items-center gap-2">
        
        {/* Color box */}
        <div
          className="w-4 h-4 rounded"
          style={{ backgroundColor: item.color }}
        />

        {/* Text */}
        <span className="text-gray-700">
          {item.short} - {item.label}
        </span>

      </div>
    ))}

  </div>
</div>

    </div>

  </div>
);
};

export default AttendanceInfo;