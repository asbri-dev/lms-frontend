import { useEffect, useMemo, useState, useCallback, forwardRef } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  parseISO,
  getDay,
} from "date-fns";
import {
  MapPin,
  Calendar,
  Plus,
  Trash2,
  X,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "../../styles/MonthPicker.css";
import { useAuth } from "../../auth/useAuth";
import toast from "react-hot-toast";
import { API_BASE_URL } from "../../config/api";

const HOLIDAY_TYPES = [
  { value: "Holiday", label: "Holiday", badge: "H", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { value: "Off", label: "Week Off", badge: "OFF", color: "bg-gray-200 text-gray-700 border-gray-300" },
];

const getTypeStyle = (type) =>
  HOLIDAY_TYPES.find((t) => t.value === type) || HOLIDAY_TYPES[0];

const MonthInput = forwardRef(({ value, onClick }, ref) => (
  <button
    type="button"
    onClick={onClick}
    ref={ref}
    className="relative flex items-center pl-9 pr-3 py-2 min-w-[150px]
               rounded-lg bg-gray-50 border border-gray-200 text-sm text-left
               focus:outline-none focus:ring-2 focus:ring-[#2b3c6b]/30 cursor-pointer"
  >
    <Calendar className="absolute left-3 text-gray-400" size={16} />
    <span className="pl-5 text-gray-700">{value}</span>
  </button>
));
MonthInput.displayName = "MonthInput";

const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const HolidayPage = () => {
  const { user } = useAuth();

  const [monthDate, setMonthDate] = useState(new Date());
  const month = useMemo(() => format(monthDate, "yyyy-MM"), [monthDate]);
  const [location, setLocation] = useState("Palakkad");

  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);

  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    fromDate: "",
    toDate: "",
    holidayType: "",
    holidayDescription: "",
  });

  const [formErrors, setFormErrors] = useState({});

  const { fromDate, toDate } = useMemo(() => {
    const d = new Date(`${month}-01`);
    return {
      fromDate: format(startOfMonth(d), "dd-MMM-yyyy"),
      toDate: format(endOfMonth(d), "dd-MMM-yyyy"),
    };
  }, [month]);

  const days = useMemo(() => {
    const start = new Date(`${month}-01`);
    const end = endOfMonth(start);
    const monthDays = eachDayOfInterval({ start, end });
    const firstDayIndex = getDay(start);
    return [...Array(firstDayIndex).fill(null), ...monthDays];
  }, [month]);

  const monthLabel = useMemo(
    () => format(new Date(`${month}-01`), "MMMM yyyy"),
    [month]
  );

  const holidayCount = events.length;

  const fetchHolidays = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `${API_BASE_URL}/getHolidays?fromDate=${fromDate}&toDate=${toDate}&collegeLocation=${location}`
      );
      const data = await res.json();

      const mapped = data.map((item) => ({
        date: format(new Date(item.Date), "yyyy-MM-dd"),
        type: item.dateType,
        description: item.dayDescription,
      }));

      setEvents(mapped);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load holidays");
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate, location]);

  useEffect(() => {
    fetchHolidays();
  }, [fetchHolidays]);

  useEffect(() => {
    setSelectedDate(null);
  }, [month, location]);

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

  const calculateDays = (from, to) => {
    const start = new Date(from);
    const end = new Date(to);
    return Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
  };

  const handleCreateHoliday = async () => {
    if (loading) return;
    if (!validateForm()) return;

    if (isDuplicateHoliday(formData.fromDate, formData.toDate)) {
      toast.error("A holiday already exists for one or more selected dates");
      return;
    }

    try {
      setLoading(true);

      const formattedFrom = format(parseISO(formData.fromDate), "dd-MMM-yyyy");
      const formattedTo = format(parseISO(formData.toDate), "dd-MMM-yyyy");
      const noOfDays = calculateDays(formData.fromDate, formData.toDate);

      const res = await fetch(`${API_BASE_URL}/createHoliday`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          holidayForm: formattedFrom,
          holidayTo: formattedTo,
          noOfDays: String(noOfDays),
          holidayType: formData.holidayType,
          holidayLocation: location,
          holidayDescription: formData.holidayDescription,
          createdBy: user.employeeId,
          updatedBy: user.employeeId,
        }),
      });

      if (!res.ok) throw new Error();

      toast.success("Holiday created successfully");
      setShowModal(false);
      setFormData({
        fromDate: "",
        toDate: "",
        holidayType: "",
        holidayDescription: "",
      });
      setFormErrors({});
      fetchHolidays();
    } catch {
      toast.error("Error creating holiday");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (date) => {
    const confirmDelete = window.confirm("Delete this holiday?");
    if (!confirmDelete) return;

    try {
      setLoading(true);
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
          } else {
            errorMessage = await response.text();
          }
        } catch {
          errorMessage = "Failed to process error response";
        }
        throw new Error(errorMessage);
      }

      toast.success("Holiday deleted successfully");
      setSelectedDate(null);
      fetchHolidays();
    } catch (err) {
      toast.error(err.message || "Delete failed");
    } finally {
      setLoading(false);
    }
  };

  const shiftMonth = (delta) => {
    setMonthDate((prev) => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() + delta);
      return next;
    });
  };

  const openCreateModal = () => {
    setFormErrors({});
    setFormData({
      fromDate: "",
      toDate: "",
      holidayType: "",
      holidayDescription: "",
    });
    setShowModal(true);
  };

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <CalendarCheck size={22} className="text-[#2b3c6b]" />
            Holiday Settings
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage holidays and week-offs by location
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg
                     bg-gradient-to-r from-[#2b3c6b] to-[#3f548f]
                     text-white text-sm font-medium hover:opacity-90 transition shadow-sm"
        >
          <Plus size={16} />
          Add Holiday
        </button>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="relative">
          <MapPin className="absolute left-3 top-2.5 text-gray-400" size={16} />
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="pl-9 pr-6 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm
                       focus:outline-none focus:ring-2 focus:ring-[#2b3c6b]/30
                       appearance-none cursor-pointer min-w-[140px]"
          >
            <option>Palakkad</option>
            <option>Chittoor</option>
          </select>
        </div>

        <div className="relative flex items-center gap-1">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            className="p-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-600
                       hover:bg-gray-100 transition"
            aria-label="Previous month"
          >
            <ChevronLeft size={16} />
          </button>

          <DatePicker
            selected={monthDate}
            onChange={(date) => date && setMonthDate(date)}
            showMonthYearPicker
            showFourColumnMonthYearPicker
            dateFormat="MMMM yyyy"
            customInput={<MonthInput />}
            popperPlacement="bottom-start"
          />

          <button
            type="button"
            onClick={() => shiftMonth(1)}
            className="p-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-600
                       hover:bg-gray-100 transition"
            aria-label="Next month"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="ml-auto flex items-center gap-2 text-sm text-gray-500">
          <span className="px-2.5 py-1 rounded-full bg-gray-100 font-medium text-gray-700">
            {holidayCount} {holidayCount === 1 ? "entry" : "entries"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Calendar */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">{monthLabel}</h2>
            <div className="flex items-center gap-3">
              {HOLIDAY_TYPES.map((type) => (
                <span key={type.value} className="flex items-center gap-1.5 text-xs text-gray-500">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${type.color}`}>
                    {type.badge}
                  </span>
                  {type.label}
                </span>
              ))}
            </div>
          </div>

          <div className="p-4">
            <div className="grid grid-cols-7 gap-2 mb-2">
              {weekDays.map((d) => (
                <div
                  key={d}
                  className="text-center text-xs font-semibold text-gray-400 uppercase tracking-wide py-1"
                >
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {loading
                ? Array.from({ length: 35 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-20 rounded-xl bg-gray-100 animate-pulse"
                    />
                  ))
                : days.map((day, index) => {
                    if (!day) {
                      return <div key={`empty-${index}`} className="h-20" />;
                    }

                    const dateStr = format(day, "yyyy-MM-dd");
                    const event = events.find((e) => e.date === dateStr);
                    const typeStyle = event ? getTypeStyle(event.type) : null;
                    const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                    const isSelected = selectedDate?.date === dateStr;
                    const isToday =
                      format(new Date(), "yyyy-MM-dd") === dateStr;

                    return (
                      <button
                        type="button"
                        key={dateStr}
                        onClick={() => event && setSelectedDate(event)}
                        disabled={!event}
                        title={event?.description || undefined}
                        className={`h-20 p-2 rounded-xl border text-left flex flex-col justify-between
                          transition relative
                          ${event ? "cursor-pointer hover:shadow-md" : "cursor-default"}
                          ${isSelected ? "ring-2 ring-[#2b3c6b] ring-offset-1" : ""}
                          ${isWeekend && !event ? "bg-blue-50/50 border-blue-100" : "bg-gray-50 border-gray-100"}
                          ${event ? "bg-white hover:bg-gray-50" : ""}
                          ${!event ? "opacity-80" : ""}`}
                      >
                        <span
                          className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full
                            ${isToday ? "bg-[#2b3c6b] text-white" : "text-gray-700"}`}
                        >
                          {format(day, "d")}
                        </span>

                        {event && typeStyle && (
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded font-semibold border text-center truncate ${typeStyle.color}`}
                          >
                            {typeStyle.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
            </div>

            {!loading && holidayCount === 0 && (
              <div className="text-center py-10 text-gray-400 text-sm mt-2">
                <CalendarCheck size={32} className="mx-auto mb-2 opacity-40" />
                No holidays set for {monthLabel} in {location}
              </div>
            )}
          </div>
        </div>

        {/* Details panel */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-fit">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">Day Details</h2>
          </div>

          {selectedDate ? (
            <div className="p-5 space-y-4">
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
                  Date
                </p>
                <p className="text-sm font-medium text-gray-800">
                  {format(parseISO(selectedDate.date), "EEEE, dd MMMM yyyy")}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
                  Type
                </p>
                <span
                  className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border ${
                    getTypeStyle(selectedDate.type).color
                  }`}
                >
                  {getTypeStyle(selectedDate.type).label}
                </span>
              </div>

              {selectedDate.description && (
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
                    Description
                  </p>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {selectedDate.description}
                  </p>
                </div>
              )}

              <button
                onClick={() => handleDelete(selectedDate.date)}
                disabled={loading}
                className="flex items-center gap-2 w-full justify-center px-4 py-2.5 rounded-lg
                           bg-red-50 text-red-600 border border-red-200 text-sm font-medium
                           hover:bg-red-100 transition disabled:opacity-50"
              >
                <Trash2 size={16} />
                Delete Holiday
              </button>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-400 text-sm">
              <Calendar size={28} className="mx-auto mb-2 opacity-30" />
              Select a highlighted day to view or delete its holiday
            </div>
          )}
        </div>
      </div>

      {/* Create modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50 p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800">Create Holiday</h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">
                    From Date
                  </label>
                  <input
                    type="date"
                    value={formData.fromDate}
                    onChange={(e) =>
                      setFormData({ ...formData, fromDate: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm
                               focus:outline-none focus:ring-2 focus:ring-[#2b3c6b]/30"
                  />
                  {formErrors.fromDate && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.fromDate}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">
                    To Date
                  </label>
                  <input
                    type="date"
                    value={formData.toDate}
                    onChange={(e) =>
                      setFormData({ ...formData, toDate: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm
                               focus:outline-none focus:ring-2 focus:ring-[#2b3c6b]/30"
                  />
                  {formErrors.toDate && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.toDate}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                  Type
                </label>
                <select
                  value={formData.holidayType}
                  onChange={(e) =>
                    setFormData({ ...formData, holidayType: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm
                             focus:outline-none focus:ring-2 focus:ring-[#2b3c6b]/30 cursor-pointer"
                >
                  <option value="">Select type</option>
                  {HOLIDAY_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                {formErrors.holidayType && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.holidayType}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Independence Day"
                  value={formData.holidayDescription}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      holidayDescription: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm
                             focus:outline-none focus:ring-2 focus:ring-[#2b3c6b]/30 resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-lg bg-white border border-gray-200 text-sm
                           text-gray-600 hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateHoliday}
                disabled={loading}
                className="px-4 py-2 rounded-lg text-white text-sm font-medium
                           bg-gradient-to-r from-[#2b3c6b] to-[#3f548f]
                           hover:opacity-90 transition disabled:opacity-60"
              >
                {loading ? "Creating..." : "Create Holiday"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HolidayPage;