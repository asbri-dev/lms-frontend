import { useEffect, useMemo, useState, useCallback } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  parseISO,
  getDay
} from "date-fns";
import { useAuth } from "../../auth/useAuth";
import toast from "react-hot-toast";
import { API_BASE_URL } from "../../config/api";


const HolidayPage = () => {
  const { user } = useAuth();

  const [month, setMonth] = useState(format(new Date(), "yyyy-MM"));
  const [location, setLocation] = useState("Palakkad");

  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);

  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(""); 

  const [formData, setFormData] = useState({
    fromDate: "",
    toDate: "",
    holidayType: "",
    holidayDescription: ""
  });

  const [formErrors, setFormErrors] = useState({});

  /* ================= DATE RANGE ================= */
  const { fromDate, toDate } = useMemo(() => {
    const d = new Date(month + "-01");

    return {
      fromDate: format(startOfMonth(d), "dd-MMM-yyyy"),
      toDate: format(endOfMonth(d), "dd-MMM-yyyy")
    };
  }, [month]);

 const days = useMemo(() => {
  const start = new Date(month + "-01");
  const end = endOfMonth(start);

  const monthDays = eachDayOfInterval({ start, end });

  const firstDayIndex = getDay(start);

  return [
    ...Array(firstDayIndex).fill(null),
    ...monthDays
  ];
}, [month]);

  /* ================= FETCH HOLIDAYS ================= */
  const fetchHolidays = useCallback(async () => {
    try {
       setError("");
      const res = await fetch(
        `${API_BASE_URL}/getHolidays?fromDate=${fromDate}&toDate=${toDate}&collegeLocation=${location}`
      );

      const data = await res.json();

      const mapped = data.map((item) => ({
        date: format(new Date(item.Date), "yyyy-MM-dd"),
        type: item.dateType,
        description: item.dayDescription
      }));

      setEvents(mapped);
    } catch (e) {
      console.error(e);
    }
  }, [fromDate, toDate, location]);

  useEffect(() => {
    fetchHolidays();
  }, [fromDate, toDate, location, fetchHolidays]);

  /* ================= VALIDATION ================= */
  const validateForm = () => {
    const errors = {};

    if (!formData.fromDate) errors.fromDate = "From date required";
    if (!formData.toDate) errors.toDate = "To date required";

    if (formData.fromDate && formData.toDate) {
      if (new Date(formData.fromDate) > new Date(formData.toDate)) {
        errors.toDate = "Invalid date range";
      }
    }

    if (!formData.holidayType) {
      errors.holidayType = "Holiday type required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /* ================= DUPLICATE CHECK ================= */
  const isDuplicateHoliday = (from, to) => {
    const start = new Date(from);
    const end = new Date(to);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const formatted = format(d, "yyyy-MM-dd");

      if (events.some((e) => e.date === formatted)) {
        return true;
      }
    }

    return false;
  };
const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  /* ================= CALCULATE DAYS ================= */
  const calculateDays = (from, to) => {
    const start = new Date(from);
    const end = new Date(to);

    return Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
  };

  /* ================= CREATE HOLIDAY ================= */
  const handleCreateHoliday = async () => {
    if (loading) return;

    if (!validateForm()) return;

    if (isDuplicateHoliday(formData.fromDate, formData.toDate)) {
      alert("Holiday already exists");
      return;
    }

    try {
      setLoading(true);

      const formattedFrom = format(parseISO(formData.fromDate), "dd-MMM-yyyy");
      const formattedTo = format(parseISO(formData.toDate), "dd-MMM-yyyy");

      const noOfDays = calculateDays(formData.fromDate, formData.toDate);

      const res = await fetch(`${API_BASE_URL}/createHoliday`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          holidayForm: formattedFrom,
          holidayTo: formattedTo,
          noOfDays: String(noOfDays),
          holidayType: formData.holidayType,
          holidayLocation: location,
          holidayDescription: formData.holidayDescription,
          createdBy: user.employeeId,
          updatedBy: user.employeeId
        })
      });

      if (!res.ok) throw new Error();

      setShowModal(false);
      setFormData({
        fromDate: "",
        toDate: "",
        holidayType: "",
        holidayDescription: ""
      });

      fetchHolidays();
    } catch {
      alert("Error creating holiday");
    } finally {
      setLoading(false);
    }
  };

  /* ================= DELETE ================= */
  const handleDelete = async (date) => {
  setError("");
  setSuccess("");
  setLoading(true);

  const confirmDelete = window.confirm("Delete this holiday?");
  if (!confirmDelete) {
    setLoading(false);
    return;
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/deleteHoliday?date=${format(
        new Date(date),
        "dd-MMM-yyyy"
      )}&location=${location}`,
      { method: "DELETE" }
    );

    if (!response.ok) {
      let errorMessage = "Something went wrong";

      try {
        const contentType = response.headers.get("content-type");

        if (contentType && contentType.includes("application/json")) {
          const data = await response.json();
          errorMessage = data.message || JSON.stringify(data);
          toast.error(errorMessage);
        } else {
          errorMessage = await response.text();
          toast.error(errorMessage);
        }
      } catch {
        // fallback if parsing fails
        errorMessage = "Failed to process error response";
      }

      throw new Error(errorMessage);
    }

    setSuccess("Holiday deleted successfully ✅");
    fetchHolidays();

  } catch (err) {
    setError(err.message || "Delete failed");
  } finally {
    setLoading(false);

    setTimeout(() => {
      setError("");
      setSuccess("");
    }, 2000);
  }
};
  /* ================= RENDER ================= */
  return (
    <div className="p-6 space-y-6">
     

      {/* HEADER */}
      <div className="flex gap-4 flex-wrap">

        <select
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="border px-3 py-2 rounded"
        >
          <option>Palakkad</option>
          <option>Chittoor</option>
        </select>

        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="border px-3 py-2 rounded"
        />

        <button
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded"
        >
          + Add Holiday
        </button>

      </div>
      <div className="grid grid-cols-7 gap-3 mb-2">
  {weekDays.map((d) => (
    <div
      key={d}
      className="text-center font-semibold text-gray-600"
    >
      {d}
    </div>
  ))}
</div>

      {/* CALENDAR */}
      <div className="grid grid-cols-7 gap-3 bg-gray-100 p-4 rounded-2xl">
        

       {days.map((day, index) => {
  if (!day) {
    return <div key={index}></div>;
  }

  const dateStr = format(day, "yyyy-MM-dd");

  const event = events.find((e) => e.date === dateStr);

  return (
            <div
              key={dateStr}
              onClick={() => setSelectedDate(event)}
              className="h-24 p-2 rounded-xl bg-white shadow-sm 
             hover:shadow-md hover:bg-gray-50 
             transition cursor-pointer relative flex flex-col justify-between"
              title={event?.description || ""}
            >
               <div className="text-sm font-medium text-gray-700">
    {format(day, "dd")}
  </div>

              {event && (
                <div
                  className={`text-[10px] px-2 py-1 rounded-full text-center font-medium ${
                    event.type === "Off"
            ? "bg-gray-200 text-gray-700"
            : "bg-red-100 text-red-600"
                  }`}
                >
                  {event.type === "Off" ? "O" : "H"}
                </div>
              )}
            </div>
          );
        })}

      </div>
      {error && (
  <p className="text-red-500 text-sm">{error}</p>
)}

{success && (
  <p className="text-green-500 text-sm">{success}</p>
)}

      {/* DETAILS */}
      
     {selectedDate && (
  <div className="bg-white p-5 rounded-2xl shadow-md space-y-3">

    <h4 className="text-lg font-semibold text-gray-800">
      {selectedDate.type}
    </h4>

    <p className="text-sm text-gray-600">
      {selectedDate.description}
    </p>
    

    <button
      onClick={() => handleDelete(selectedDate.date)}
      className="px-4 py-2 rounded-lg bg-red-500 text-white 
                 hover:bg-red-600 transition"
    >
      Delete
    </button>

  </div>
)}

      {/* MODAL */}
      {showModal && (
  <div className="fixed inset-0 bg-black/40 backdrop-blur-sm 
                  flex justify-center items-center z-50">

    <div className="bg-white w-full max-w-md p-6 rounded-2xl shadow-2xl space-y-4">

      <h3 className="text-lg font-semibold text-gray-800">
        Create Holiday
      </h3>

      {/* From */}
      <div>
        <input
          type="date"
          value={formData.fromDate}
          onChange={(e) =>
            setFormData({ ...formData, fromDate: e.target.value })
          }
          className="w-full px-3 py-2 rounded-lg bg-gray-50 shadow-sm 
                     focus:ring-2 focus:ring-[#3f548f] outline-none"
        />
        {formErrors.fromDate && (
          <p className="text-red-500 text-xs mt-1">
            {formErrors.fromDate}
          </p>
        )}
      </div>

      {/* To */}
      <div>
        <input
          type="date"
          value={formData.toDate}
          onChange={(e) =>
            setFormData({ ...formData, toDate: e.target.value })
          }
          className="w-full px-3 py-2 rounded-lg bg-gray-50 shadow-sm 
                     focus:ring-2 focus:ring-[#3f548f]"
        />
        {formErrors.toDate && (
          <p className="text-red-500 text-xs mt-1">
            {formErrors.toDate}
          </p>
        )}
      </div>

      {/* Type */}
      <div>
        <input
          type="text"
          placeholder="Holiday Type"
          value={formData.holidayType}
          onChange={(e) =>
            setFormData({ ...formData, holidayType: e.target.value })
          }
          className="w-full px-3 py-2 rounded-lg bg-gray-50 shadow-sm 
                     focus:ring-2 focus:ring-[#3f548f]"
        />
        {formErrors.holidayType && (
          <p className="text-red-500 text-xs mt-1">
            {formErrors.holidayType}
          </p>
        )}
      </div>

      {/* Description */}
      <textarea
        placeholder="Description"
        value={formData.holidayDescription}
        onChange={(e) =>
          setFormData({
            ...formData,
            holidayDescription: e.target.value,
          })
        }
        className="w-full px-3 py-2 rounded-lg bg-gray-50 shadow-sm 
                   focus:ring-2 focus:ring-[#3f548f]"
      />

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2">

        <button
          onClick={() => setShowModal(false)}
          className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition"
        >
          Cancel
        </button>

        <button
          onClick={handleCreateHoliday}
          disabled={loading}
          className="px-4 py-2 rounded-lg text-white 
                     bg-[#2b3c6b] hover:bg-[#3f548f] transition
                     disabled:opacity-60"
        >
          {loading ? "Creating..." : "Create"}
        </button>

      </div>

    </div>
  </div>
)}

    </div>
  );
};

export default HolidayPage;