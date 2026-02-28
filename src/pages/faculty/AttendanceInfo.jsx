// pages/AttendanceInfo.jsx

import { useEffect, useState, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import { format, addMonths, subMonths } from "date-fns";
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

  /* ===============================
     Fetch Attendance
  =============================== */
  const fetchAttendance = useCallback(async () => {
    if (!user?.employeeId) return;

    try {
      setLoading(true);

      const { fromDate, toDate } = getMonthRange(currentMonth);

      const response = await fetch(
        `http://localhost:9090/getAttedanceInfo?empId=${user.employeeId}&fromDate=${fromDate}&toDate=${toDate}`
      );

      if (!response.ok) throw new Error("Failed to fetch");

      const data = await response.json();
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

    } catch (err) {
      console.error(err);
      setSelectedDetails(null);
    } finally {
      setLoading(false);
    }
  }, [currentMonth, user]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  return (
    <div className="attendance-container">

      {/* LEFT - CALENDAR */}
      <div className="calendar-section">

        <div className="attendance-header">
          <button onClick={() => setCurrentMonth(prev => subMonths(prev, 1))}>
            ←
          </button>
          <h3>{format(currentMonth, "MMMM yyyy")}</h3>
          <button onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}>
            →
          </button>
        </div>

        {loading && <div className="spinner">Loading...</div>}

        <FullCalendar
  plugins={[dayGridPlugin]}
  initialView="dayGridMonth"
  events={events}
  height="auto"
  eventDisplay="block"

  // 🔹 Clicking empty cell
  dateClick={(info) => {
    setSelectedDate(info.dateStr);
    setSelectedDetails(eventMap[info.dateStr] || null);
  }}

  // 🔹 Clicking event (P, A, CL etc.)
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

      {/* RIGHT - DETAILS */}
      <div className="details-section">
        {selectedDetails?.details ? (
          <>
            <h3>{selectedDetails.rawDate}</h3>

            <div className="card">
              <h4>Status Details</h4>
              <p><strong>Status:</strong> {selectedDetails.details.status}</p>
              <p><strong>Total Work Hours:</strong> {selectedDetails.details.workDuration}</p>
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