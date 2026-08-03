import { useEffect, useState, useCallback, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import { useAuth } from "../../auth/useAuth";
import { API_BASE_URL } from "../../config/api";
import { SquarePen,NotepadText  } from "lucide-react";
import {
  getMonthRange,
  transformAttendanceData,
} from "../../utils/attendanceUtils";
import { ChevronLeft, ChevronRight, CalendarDays, Clock, AlarmClockCheck } from "lucide-react";

const AttendanceInfo = ({ employeeId }) => {

  const { user } = useAuth();
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

  // 👇 Prevents the FullCalendar FOUC (dark unstyled borders flashing on first paint)
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  /* =========================================
     Fetch Attendance (Month Based)
  ========================================= */
  const handleMonthChange = (type) => {
    if (navLock || loading) return;

    setNavLock(true);

    const api = calendarRef.current?.getApi();
    if (!api) return;

    if (type === "prev") api.prev();
    if (type === "next") api.next();
    if (type === "today") api.today();

    setTimeout(() => {
      setNavLock(false);
    }, 400);
  };

  const fetchAttendance = useCallback(async () => {

    if (!empId) return;
    if (loading) return;

    try {

      setLoading(true);
      setError("");

      const { fromDate, toDate } = getMonthRange(currentMonth);

      const response = await fetch(
        `${API_BASE_URL}/getAttedanceInfo?empId=${empId}&fromDate=${fromDate}&toDate=${toDate}`
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
        map[e.start] = e.extendedProps;
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

  const normalizeStatus = (status)=>{
    switch(status){
      case "cl":
        return "CL";
      
      case "ml":
        return "ML";

      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
  

    } 
  }

return (
  <div className="space-y-4 sm:space-y-6">

    {/* ===== HEADER ===== */}
    <div className="bg-gradient-to-br from-[#2b3c6b] to-[#3f548f] p-4 sm:p-5 rounded-2xl shadow-sm">

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">

        {/* Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 shrink-0 rounded-xl bg-white/15 flex items-center justify-center">
            <CalendarDays size={20} className="text-white" />
          </div>
          <div className="flex flex-col min-w-0">
            <h2 className="text-base sm:text-lg font-semibold text-white leading-tight">
              Attendance Calendar
            </h2>
            <span className="text-xs sm:text-sm text-white/70 truncate">
              {currentMonth.toLocaleString("default", {
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between sm:justify-end gap-1.5 sm:gap-2 bg-white/10 backdrop-blur-sm px-2 py-1.5 rounded-xl">

          <button
            onClick={() => handleMonthChange("prev")}
            disabled={navLock || loading}
            className="p-2 rounded-lg text-white hover:bg-white/15 active:scale-90 transition-all disabled:opacity-40"
          >
            <ChevronLeft size={18} />
          </button>

          <span className="text-xs sm:text-sm font-semibold text-white px-1 whitespace-nowrap">
            {currentMonth.toLocaleString("default", { month: "short", year: "numeric" })}
          </span>

          <button
            onClick={() => handleMonthChange("next")}
            disabled={navLock || loading}
            className="p-2 rounded-lg text-white hover:bg-white/15 active:scale-90 transition-all disabled:opacity-40"
          >
            <ChevronRight size={18} />
          </button>

          <button
            onClick={() => handleMonthChange("today")}
            disabled={navLock || loading}
            className="ml-1 flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg
                       bg-white text-[#2b3c6b] text-xs sm:text-sm font-semibold
                       hover:bg-white/90 active:scale-95 transition-all disabled:opacity-40"
          >
            <CalendarDays size={14} />
            <span>Today</span>
          </button>

        </div>
      </div>
    </div>


    {/* ===== MAIN GRID ===== */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 items-start">

      {/* ===== CALENDAR ===== */}
      <div className="lg:col-span-2 min-w-0 bg-white p-2.5 sm:p-4 rounded-2xl shadow-sm border border-gray-100">

        {loading && (
          <div className="text-center text-gray-500 py-4 text-sm">
            Loading...
          </div>
        )}

        {error && (
          <div className="text-red-500 text-center py-4 text-sm">
            {error}
          </div>
        )}

        <div className="attendance-calendar overflow-x-auto">
          {mounted ? (
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
                const { label, isPresentOverride } = arg.event.extendedProps;

                return (
                  <div className="relative w-full h-full flex items-center justify-center py-0.5">
                    <span className="text-[10px] sm:text-xs font-semibold text-gray-700">
                      {label}
                    </span>

                    {isPresentOverride && (
                      <SquarePen
                        size={11}
                        className="absolute top-0 left-0 text-gray-400 sm:!w-[15px] sm:!h-[15px]"
                      />
                    )}
                  </div>
                );
              }}

              // 👇 Days with no attendance record get a neutral "no data" style
              dayCellClassNames={(arg) => {
                const classes = [];
                if (arg.dateStr === selectedDate) classes.push("selected-day");
                if (!eventMap[arg.dateStr]) classes.push("no-data-day");
                return classes;
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
            />
          ) : (
            <div className="animate-pulse h-[320px] sm:h-[420px] bg-gray-100 rounded-xl" />
          )}
        </div>

     
      </div>


      {/* ===== RIGHT PANEL ===== */}
      <div className="space-y-3 sm:space-y-4">

        {selectedDetails?.details ? (
          <>

            {/* DATE + STATUS */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between gap-3 mb-3">
                <h3 className="text-sm sm:text-base font-semibold text-gray-800 truncate">
                  {selectedDetails.rawDate}
                </h3>
                <span className="shrink-0 text-[11px] sm:text-xs font-semibold px-2.5 py-1 rounded-full bg-[#eef2ff] text-[#2b3c6b]">
                  {normalizeStatus(selectedDetails.details.status)}
                </span>
              </div>

              <div className="flex items-center gap-2 text-gray-500 text-xs sm:text-sm">
                <Clock size={14} className="text-gray-400" />
                Work Hours: <span className="font-medium text-gray-700">{selectedDetails.details.workDuration}</span>
              </div>
              {/* Show only if Override Reason exists */}
              {selectedDetails.details.reason && (
               <div className="flex items-center gap-2 text-gray-500 text-xs sm:text-sm mt-2">
                 <SquarePen size={14} className="text-gray-400" />
                 <span>Reason for Override:</span>
                 <span className="font-medium text-gray-700">
                   {selectedDetails.details.reason}
                 </span>
               </div>
              )}  {/* Show only if Override Reason exists */}
              {selectedDetails.details.leaveReason && (
               <div className="flex items-center gap-2 text-gray-500 text-xs sm:text-sm mt-2">
                 <NotepadText  size={14} className="text-gray-400" />
                 <span>Reason for Leave:</span>
                 <span className="font-medium text-gray-700">
                   {selectedDetails.details.leaveReason}

                 </span>
               </div>
              )} 
            </div>

            {/* SESSION */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
              <h4 className="font-semibold text-gray-700 mb-3 text-sm sm:text-base">Session Details</h4>

              {/* Session 1 */}
              <div className="mb-4 pb-4 border-b border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-gray-400 font-medium">Session 1</p>
                  <p className="text-xs sm:text-sm text-gray-600 font-medium">
                    {empId?.startsWith("AREP") ? "09:30 - 12:30" : "09:30 - 13:00"}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-xl px-3 py-2">
                    <p className="text-[10px] sm:text-xs text-gray-400">First In</p>
                    <p className="text-sm text-gray-700 font-semibold">
                      {selectedDetails.details.punchIn || "--"}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-xl px-3 py-2">
                    <p className="text-[10px] sm:text-xs text-gray-400">Last Out</p>
                    <p className="text-sm text-gray-700 font-semibold">
                      {"--"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Session 2 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-gray-400 font-medium">Session 2</p>
                  <p className="text-xs sm:text-sm text-gray-600 font-medium">
                    {empId.startsWith("AREP") ? "12:31 - 15:30" : "13:01 - 16:30"}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-xl px-3 py-2">
                    <p className="text-[10px] sm:text-xs text-gray-400">First In</p>
                    <p className="text-sm text-gray-700 font-semibold">
                      {selectedDetails.details.PunchIn || "--"}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-xl px-3 py-2">
                    <p className="text-[10px] sm:text-xs text-gray-400">Last Out</p>
                    <p className="text-sm text-gray-700 font-semibold">
                      {selectedDetails.details.punchOut || "--"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ADJUSTMENTS */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-3">
                <AlarmClockCheck size={15} className="text-gray-400" />
                <h4 className="font-semibold text-gray-700 text-sm sm:text-base">Adjustments</h4>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
               <div className="bg-gray-50 rounded-lg px-3 py-2 text-gray-600">Late In: <span className="font-medium text-gray-800">{selectedDetails.details.lateIn}</span></div>
               <div className="bg-gray-50 rounded-lg px-3 py-2 text-gray-600">Late Out: <span className="font-medium text-gray-800">{selectedDetails.details.lateOut}</span></div>
               <div className="bg-gray-50 rounded-lg px-3 py-2 text-gray-600">Early In: <span className="font-medium text-gray-800">{selectedDetails.details.earlyIn}</span></div>
               <div className="bg-gray-50 rounded-lg px-3 py-2 text-gray-600">Early Out: <span className="font-medium text-gray-800">{selectedDetails.details.earlyOut}</span></div>
              </div>
            </div>

          </>
        ) : (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center text-gray-500 text-sm">
            Select a date to view details
          </div>
        )}

        {/* ===== LEGEND ===== */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <h4 className="font-semibold text-gray-700 mb-3 text-sm sm:text-base">
            Legend
          </h4>

          <div className="grid grid-cols-3 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-sm">

            {[
              { label: "Present", color: "#D7FDF0", short: "P" },
              { label: "Absent", color: "#FBA39D", short: "A" },
              { label: "CL", color: "#CEF1FD", short: "CL" },
              { label: "ML", color: "#79ADDC", short: "ML" },
              { label: "Off", color: "#F7F7F7", short: "OFF" },
              { label: "Holiday", color: "#0ea5e9", short: "H" },
              { label: "OD", color: "#E9F0DB", short: "OD" },
              { label: "PR", color: "#9333ea", short: "PR" },
              
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-1.5 px-1.5 py-1 rounded-lg">
                <div
                  className="w-3 h-3 rounded shrink-0 border border-gray-200"
                  style={{ backgroundColor: item.color, border: item.label === "OFF" ? "5px solid #155ecb" : item.label === "No Data" ? "1px solid #e5e7eb" : "none" }}
                />
                <span className="text-gray-700 text-xs sm:text-sm">
                  {item.short}
                </span>
              </div>
            ))}

          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <h5 className="text-xs font-semibold text-gray-500 uppercase mb-2">
            Icons
          </h5>

          <div className="flex items-center gap-2">
            <SquarePen size={14} className="text-gray-600" />
            <span className="text-gray-700 text-xs sm:text-sm">
              Override (O)
            </span>
          </div>
        </div>

      </div>

    </div>
  </div>
);};

export default AttendanceInfo;