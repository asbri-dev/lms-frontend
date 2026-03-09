import { useEffect, useState, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import { useAuth } from "../../auth/AuthContext";
import {
  getMonthRange,
  transformAttendanceData,
} from "../../utils/attendanceUtils";
import "./AttendanceInfo.css";

const AttendanceInfo = () => {
  const { user } = useAuth();

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
    if (!user?.employeeId) return;

    try {
      setLoading(true);
      setError("");

      const { fromDate, toDate } = getMonthRange(currentMonth);

      const response = await fetch(
        `http://localhost:9090/getAttedanceInfo?empId=${user.employeeId}&fromDate=${fromDate}&toDate=${toDate}`
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

      // Create fast lookup map
      const map = {};
      transformed.forEach((e) => {
        map[e.date] = e.extendedProps;
      });
      setEventMap(map);

      // Auto select first available date
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
  }, [currentMonth, user?.employeeId]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  return (
    <div className="attendance-container">

      {/* LEFT SIDE - CALENDAR */}
      <div className="calendar-section">

        {loading && <div className="spinner">Loading...</div>}
        {error && <div className="error-msg">{error}</div>}

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

          /* 🔥 When month changes */
          datesSet={(arg) => {
            const newMonth = arg.view.currentStart;

            if (
              newMonth.getMonth() !== currentMonth.getMonth() ||
              newMonth.getFullYear() !== currentMonth.getFullYear()
            ) {
              setCurrentMonth(newMonth);
            }
          }}

          /* 🔥 Click empty date */
          dateClick={(info) => {
            setSelectedDate(info.dateStr);
            setSelectedDetails(eventMap[info.dateStr] || null);
          }}

          /* 🔥 Click event (P, A, etc.) */
          eventClick={(info) => {
            const clickedDate = info.event.startStr;
            setSelectedDate(clickedDate);
            setSelectedDetails(eventMap[clickedDate] || null);
          }}

          /* 🔥 Highlight selected day */
          dayCellClassNames={(arg) =>
            arg.dateStr === selectedDate ? ["selected-day"] : []
          }
        />
      </div>

      {/* RIGHT SIDE - DETAILS PANEL */}
      <div className="details-section">
        {selectedDetails?.details ? (
          <>
            <h3>{selectedDetails.rawDate}</h3>

            <div className="card">
              <h4>Status Details</h4>
              <p>
                <strong>Status:</strong>{" "}
                {selectedDetails.details.status}
              </p>
              <p>
                <strong>Total Work Hours:</strong>{" "}
                {selectedDetails.details.workDuration}
              </p>
            </div>

            <div className="card">
              <h4>Session Details</h4>
              <table className="details-table">
                <thead>
                  <tr>
                    <th>Session</th>
                    <th>Status</th>
                    <th>First In</th>
                    <th>Last Out</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Session 1</td>
                    <td>{selectedDetails.details.sessionOne}</td>
                    <td>{selectedDetails.details.punchIn}</td>
                    <td>-</td>
                  </tr>
                  <tr>
                    <td>Session 2</td>
                    <td>{selectedDetails.details.sessionTwo}</td>
                    <td>-</td>
                    <td>{selectedDetails.details.punchOut}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="card">
              <h4>Time Adjustments</h4>
              <p>Late In: {selectedDetails.details.lateIn}</p>
              <p>Late Out: {selectedDetails.details.lateOut}</p>
              <p>Early In: {selectedDetails.details.earlyIn}</p>
              <p>Early Out: {selectedDetails.details.earlyOut}</p>
            </div>
          </>
        ) : (
          <div className="empty-state">
            No attendance data for selected date
          </div>
        )}
      </div>

    </div>
  );
};

export default AttendanceInfo;