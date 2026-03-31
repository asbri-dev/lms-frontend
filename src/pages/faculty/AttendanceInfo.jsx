import { useEffect, useState, useCallback,useRef} from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import { useAuth } from "../../auth/AuthContext";
import {
  getMonthRange,
  transformAttendanceData,
} from "../../utils/attendanceUtils";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";

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
  const calendarRef = useRef(null);
  const [navLock, setNavLock] = useState(false);

  /* =========================================
     Fetch Attendance (Month Based)
  ========================================= */
  const handleMonthChange = (type) => {
  if (navLock || loading) return; // 🚫 block spam

  setNavLock(true);

  const api = calendarRef.current?.getApi();

  if (!api) return;

  if (type === "prev") api.prev();
  if (type === "next") api.next();
  if (type === "today") api.today();

  // ⏱ unlock after small delay
  setTimeout(() => {
    setNavLock(false);
  }, 400); // 🔥 perfect UX delay
};

  const fetchAttendance = useCallback(async () => {

    if (!empId) return;
    if (loading) return;

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
  map[e.start] = e.extendedProps; // 🔥 IMPORTANT FIX
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
  <div className="space-y-6">

    {/* ===== HEADER ===== */}
    <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm">

      {/* Title */}
     <div className="flex flex-col">
  <h2 className="text-lg font-semibold text-gray-800">
    Attendance Calendar
  </h2>

  <span className="text-sm text-indigo-600 font-medium">
    {currentMonth.toLocaleString("default", {
      month: "long",
      year: "numeric",
    })}
  </span>

  <p className="text-xs text-gray-400">
    Track daily attendance
  </p>
</div>

      {/* Controls */}
      <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl shadow-sm border">

  <button
  onClick={() => handleMonthChange("prev")}
  disabled={navLock || loading}
  className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
>
  <ChevronLeft size={18} />
</button>

  <span className="text-sm font-semibold text-gray-700">
    {currentMonth.toLocaleString("default", { month: "long", year: "numeric" })}
  </span>

 <button
  onClick={() => handleMonthChange("next")}
  disabled={navLock || loading}
  className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
>
  <ChevronRight size={18} />
</button>

  <button
  onClick={() => handleMonthChange("today")}
  disabled={navLock || loading}
  className="ml-2 flex items-center gap-2 px-3 py-1.5 rounded-lg 
             bg-[#2b3c6b] text-white text-sm hover:bg-[#3f548f] 
             disabled:opacity-50"
>
  <CalendarDays size={16} />
  Today
</button>

</div>
    </div>


    {/* ===== MAIN GRID ===== */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

      {/* ===== CALENDAR ===== */}
      <div className="lg:col-span-2 bg-white p-4 rounded-2xl shadow-sm">

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
          ref={calendarRef}
          plugins={[dayGridPlugin]}
          initialView="dayGridMonth"
          events={events}
          height="auto"
          headerToolbar={false}

          dayMaxEvents={false}

          datesSet={(arg) => {
            const newMonth = arg.view.currentStart;

            if (
              newMonth.getMonth() !== currentMonth.getMonth() ||
              newMonth.getFullYear() !== currentMonth.getFullYear()
            ) {
              setCurrentMonth(newMonth);
            }
          }}

          eventContent={(arg) => {
            const label = arg.event.extendedProps.label;

            return (
              <div className="w-full h-full flex items-center justify-center text-xs font-semibold text-gray-700">
                {label}
              </div>
            );
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


      {/* ===== RIGHT PANEL ===== */}
      <div className="space-y-4">

        {selectedDetails?.details ? (
          <>

            {/* DATE */}
            <h3 className="text-lg font-semibold text-gray-700">
              {selectedDetails.rawDate}
            </h3>

            {/* STATUS */}
            <div className="bg-white p-4 rounded-xl shadow-sm">
              <h4 className="font-semibold text-gray-700 mb-2">
                Status
              </h4>

              <p className="text-gray-600 text-sm">
                {selectedDetails.details.status}
              </p>

              <p className="text-gray-500 text-xs mt-1">
                Work Hours: {selectedDetails.details.workDuration}
              </p>
            </div>

            {/* SESSION */}
            <div className="bg-white p-4 rounded-xl shadow-sm">
              <h4 className="font-semibold text-gray-700 mb-2">
                Sessions
              </h4>

              <div className="text-sm text-gray-600 space-y-1">
                <p>S1: {selectedDetails.details.sessionOne}</p>
                <p>S2: {selectedDetails.details.sessionTwo}</p>
              </div>
            </div>

            {/* TIME */}
            <div className="bg-white p-4 rounded-xl shadow-sm">
              <h4 className="font-semibold text-gray-700 mb-2">
                Adjustments
              </h4>

              <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                <p>Late In: {selectedDetails.details.lateIn}</p>
                <p>Late Out: {selectedDetails.details.lateOut}</p>
                <p>Early In: {selectedDetails.details.earlyIn}</p>
                <p>Early Out: {selectedDetails.details.earlyOut}</p>
              </div>
            </div>

          </>
        ) : (
          <div className="bg-white p-6 rounded-xl shadow-sm text-center text-gray-500">
            Select a date to view details
          </div>
        )}

        {/* ===== LEGEND ===== */}
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <h4 className="font-semibold text-gray-700 mb-3">
            Legend
          </h4>

          <div className="grid grid-cols-2 gap-2 text-sm">

            {[
              { label: "Present", color: "#D7FDF0", short: "P" },
              { label: "Absent", color: "#FE8985", short: "A" },
              { label: "CL", color: "#79ADDC", short: "CL", },
              { label: "ML", color: "#79ADDC", short: "ML" },
              { label: "Off", color: "#F7F7F7", short: "OFF" },
              { label: "Holiday", color: "#0ea5e9", short: "H" },
              { label: "OD", color: "#1B2A41", short: "OD" },
              { label: "PR", color: "#9333ea", short: "PR" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 bg-gray-50 px-2 py-1 rounded-lg">
                <div
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: item.color,border: item.label === "OFF" ? "5px solid #155ecb" : "none" }}
                />
                <span className="text-gray-700">
                  {item.short}
                </span>
              </div>
            ))}

          </div>
        </div>

      </div>

    </div>
  </div>
);};

export default AttendanceInfo;