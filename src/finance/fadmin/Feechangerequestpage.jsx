import { createElement, useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../../auth/useAuth";
import { API_BASE_URL } from "../../config/api";
import toast, { Toaster } from "react-hot-toast";
import {
  Leaf, RefreshCw, AlertCircle, Search, X, Users,
  GraduationCap, Bus, Home, ChevronDown, ChevronRight,
  MapPin, Check, SendHorizonal, Globe, SortAsc, ArrowLeft,
  BadgeCheck, BookOpen,
} from "lucide-react";

// ─── helpers ─────────────────────────────────────────────────────────────────

async function safeFetch(url, options = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 300000);
  try {
    const res = await fetch(url, { ...options, signal: ctrl.signal });
    clearTimeout(timer);
    return res;
  } catch (err) {
    clearTimeout(timer);
    if (err.name === "AbortError") throw new Error("Request timed out. Please check the server.");
    if (!window.navigator.onLine) throw new Error("No internet connection.");
    throw new Error("Cannot reach server. Please check if the backend is running.");
  }
}

// ─── sidebar ─────────────────────────────────────────────────────────────────

function Sidebar({ students, loading, error, selectedStudent, onSelect, onRefresh }) {
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const [filterSem, setFilterSem] = useState("");
  const [sortAsc, setSortAsc] = useState(true);

  const departments = useMemo(
    () => [...new Set(students.map((s) => s.department).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b)),
    [students]
  );

  const semesters = useMemo(
    () => [...new Set(students.map((s) => s.currentSemester).filter(Boolean))]
      .sort((a, b) => Number(a) - Number(b)),
    [students]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let list = students.filter((s) => {
      const matchSearch =
        !q ||
        s.studentName?.toLowerCase().includes(q) ||
        s.admissionNo?.toLowerCase().includes(q) ||
        s.registrationNo?.toLowerCase().includes(q);
      const matchDept =
        !filterDept || s.department?.toLowerCase() === filterDept.toLowerCase();
      const matchSem = !filterSem || String(s.currentSemester) === filterSem;
      return matchSearch && matchDept && matchSem;
    });
    return [...list].sort((a, b) => {
      const na = a.studentName?.toLowerCase() ?? "";
      const nb = b.studentName?.toLowerCase() ?? "";
      return sortAsc ? na.localeCompare(nb) : nb.localeCompare(na);
    });
  }, [students, search, filterDept, filterSem, sortAsc]);

  const hasFilters = search || filterDept || filterSem;

  return (
    <aside
      className="flex flex-col border-r flex-shrink-0"
      style={{ width: "300px", background: "#fff", borderColor: "#E2E8F0" }}
    >
      {/* Header */}
      <div className="p-3 border-b flex-shrink-0" style={{ borderColor: "#E2E8F0" }}>
        <div className="flex items-center gap-2 mb-3">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: "#dcfce7" }}
          >
            <Users size={15} style={{ color: "#16a34a" }} strokeWidth={2} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold" style={{ color: "#0F172A" }}>Students</p>
            <p className="text-xs" style={{ color: "#94A3B8" }}>
              {filtered.length} of {students.length}
            </p>
          </div>
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-1.5 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw
              size={13}
              style={{ color: "#94A3B8" }}
              className={loading ? "animate-spin" : ""}
            />
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-2">
          <Search
            size={12}
            className="absolute left-2.5 top-1/2 -translate-y-1/2"
            style={{ color: "#94A3B8" }}
          />
          <input
            type="text"
            placeholder="Name, admission no, reg no…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-7 pr-7 py-2 rounded-xl text-xs border focus:outline-none"
            style={{ borderColor: "#E2E8F0", color: "#0F172A" }}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2"
            >
              <X size={10} style={{ color: "#94A3B8" }} />
            </button>
          )}
        </div>

        {/* Filter row */}
        <div className="flex gap-1.5">
          {/* Department */}
          <div className="relative flex-1">
            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              className="appearance-none w-full pl-2 pr-5 py-1.5 rounded-lg text-xs border focus:outline-none"
              style={{
                borderColor: filterDept ? "#16a34a" : "#E2E8F0",
                color: filterDept ? "#15803d" : "#64748B",
                background: filterDept ? "#dcfce7" : "#fff",
              }}
            >
              <option value="">All Dept</option>
              {departments.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <ChevronDown
              size={9}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: "#94A3B8" }}
            />
          </div>

          {/* Semester */}
          <div className="relative flex-1">
            <select
              value={filterSem}
              onChange={(e) => setFilterSem(e.target.value)}
              className="appearance-none w-full pl-2 pr-5 py-1.5 rounded-lg text-xs border focus:outline-none"
              style={{
                borderColor: filterSem ? "#16a34a" : "#E2E8F0",
                color: filterSem ? "#15803d" : "#64748B",
                background: filterSem ? "#dcfce7" : "#fff",
              }}
            >
              <option value="">All Sem</option>
              {semesters.map((s) => (
                <option key={s} value={String(s)}>Sem {s}</option>
              ))}
            </select>
            <ChevronDown
              size={9}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: "#94A3B8" }}
            />
          </div>

          {/* Sort toggle */}
          <button
            onClick={() => setSortAsc((p) => !p)}
            className="px-2 py-1.5 rounded-lg border text-xs transition-colors hover:bg-gray-50"
            style={{ borderColor: "#E2E8F0", color: "#64748B" }}
            title={sortAsc ? "Sort Z→A" : "Sort A→Z"}
          >
            <SortAsc
              size={12}
              style={{
                transform: sortAsc ? "none" : "scaleY(-1)",
                transition: "transform 0.2s",
              }}
            />
          </button>
        </div>

        {/* Clear filters */}
        {hasFilters && (
          <button
            onClick={() => { setSearch(""); setFilterDept(""); setFilterSem(""); }}
            className="mt-2 w-full text-xs py-1 rounded-lg font-medium"
            style={{ color: "#ef4444", background: "#FEF2F2" }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-2">
        {loading && (
          <div className="space-y-2 p-1">
            {[...Array(7)].map((_, i) => (
              <div
                key={i}
                className="h-16 rounded-xl animate-pulse"
                style={{ background: "#F1F5F9", opacity: 1 - i * 0.1 }}
              />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-12 gap-3 px-3 text-center">
            <AlertCircle size={26} style={{ color: "#ef4444" }} strokeWidth={1.5} />
            <p className="text-xs" style={{ color: "#64748B" }}>{error}</p>
            <button
              onClick={onRefresh}
              className="text-xs px-3 py-1.5 rounded-lg text-white"
              style={{ background: "#16a34a" }}
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <Search size={22} style={{ color: "#CBD5E1" }} strokeWidth={1.5} />
            <p className="text-xs" style={{ color: "#94A3B8" }}>No students found</p>
          </div>
        )}

        {!loading && !error && filtered.map((student) => {
         
          const isSelected = selectedStudent?.admissionNo === student.admissionNo;

          return (
            <button
              key={student.admissionNo}
              onClick={() => onSelect(student)}
              className="w-full text-left p-3 rounded-xl mb-1.5 transition-all"
              style={{
                background: isSelected ? "#f0fdf4" : "#fff",
                border: `1.5px solid ${isSelected ? "#16a34a" : "#E2E8F0"}`,
                boxShadow: isSelected ? "0 2px 8px rgba(22,163,74,0.12)" : "none",
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p
                    className="text-xs font-bold truncate"
                    style={{ color: "#0F172A" }}
                  >
                    {student.studentName}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>
                    {student.admissionNo}
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                    <span
                      className="text-xs px-1.5 py-0.5 rounded-md font-medium"
                      style={{ background: "#E9F3FF", color: "#2563EB" }}
                    >
                      {student.department}
                    </span>
                    <span
                      className="text-xs px-1.5 py-0.5 rounded-md font-medium"
                      style={{ background: "#f5f3ff", color: "#7c3aed" }}
                    >
                      Sem {student.currentSemester}
                    </span>
                   <span
                        className="text-xs px-2 py-1 rounded-md font-medium"
                       style={{ background: "#FFF7ED",color: "#EA580C",}}
                   >
                     {student.isDayScholar ? "Day Scholar" : "Hosteller"}
                   </span>
                   
                  </div>
                </div>
                {isSelected && (
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: "#16a34a" }}
                  >
                    <Check size={10} className="text-white" strokeWidth={3} />
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}

// ─── option card ──────────────────────────────────────────────────────────────

function OptionCard({ icon, label, description, selected, disabled, disabledReason, color, bg, onClick }) {
  return (
    <button
      onClick={!disabled ? onClick : undefined}
      disabled={disabled}
      className="rounded-2xl p-5 text-left border-2 transition-all w-full"
      style={{
        background: disabled ? "#F8FAFC" : selected ? bg : "#fff",
        borderColor: disabled ? "#E2E8F0" : selected ? color : "#E2E8F0",
        opacity: disabled ? 0.55 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
        boxShadow: selected ? `0 4px 16px ${color}26` : "none",
      }}
    >
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
        style={{ background: disabled ? "#F1F5F9" : bg }}
      >
        {createElement(icon, {
          size: 22,
          style: { color: disabled ? "#CBD5E1" : color },
          strokeWidth: 2,
        })}
      </div>
      <p className="font-bold text-sm" style={{ color: disabled ? "#94A3B8" : "#0F172A" }}>
        {label}
      </p>
      <p className="text-xs mt-1" style={{ color: "#94A3B8" }}>
        {disabled ? disabledReason : description}
      </p>
      {selected && (
        <div
          className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
          style={{ background: color + "20", color }}
        >
          <Check size={11} strokeWidth={2.5} /> Selected
        </div>
      )}
    </button>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────

export default function FeeChangeRequestPage() {
  const { user } = useAuth();
  const empId = user?.employeeId;

  // ── student list state ──
  const [students, setStudents] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState(null);

  // ── selection state ──
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null); // 'hosteller' | 'bus' | 'public'

  // ── bus state ──
  const [busRoutes, setBusRoutes] = useState([]);
  const [busLoading, setBusLoading] = useState(false);
  const [busError, setBusError] = useState(null);
  const [openRoute, setOpenRoute] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [selectedStop, setSelectedStop] = useState(null);

  // ── submit ──
  const [submitting, setSubmitting] = useState(false);

  // ── fetch students ──
  const fetchStudents = useCallback(async () => {
    if (!empId) return;
    setListLoading(true);
    setListError(null);
    try {
      const res = await safeFetch(
        `${API_BASE_URL}/admin/getAllStudents?empId=${empId}`,
        { method: "GET", headers: { "Content-Type": "application/json" } }
      );
      
      if (!res.ok) throw new Error(`Server returned ${res.status}.`);
      const json = await res.json();
      setStudents(Array.isArray(json) ? json : []);
    } catch (err) {
      setListError(err.message);
    } finally {
      setListLoading(false);
    }
  }, [empId]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  // ── fetch bus routes ──
  const fetchBusRoutes = useCallback(async () => {
    setBusLoading(true);
    setBusError(null);
    try {
      const res = await safeFetch(
        `${API_BASE_URL}/busStopsInfo?empId=${empId}`,
        { method: "GET", headers: { "Content-Type": "application/json" } }
      );
      if (!res.ok) throw new Error(`Server returned ${res.status}.`);
      const json = await res.json();
      setBusRoutes(Array.isArray(json) ? json : []);
    } catch (err) {
      setBusError(err.message);
    } finally {
      setBusLoading(false);
    }
  }, [empId]);

  // ── handlers ──
  const handleSelectStudent = (student) => {
    setSelectedStudent(student);
    setSelectedOption(null);
    setOpenRoute(null);
    setSelectedStop(null);
    setSelectedRoute(null);
  };

  const handleOptionSelect = (option) => {
    setSelectedOption(option);
    setOpenRoute(null);
    setSelectedStop(null);
    setSelectedRoute(null);
    if (option === "bus" && busRoutes.length === 0) fetchBusRoutes();
  };

  const handleRouteToggle = (route) => {
    setOpenRoute((prev) => (prev === route.routeName ? null : route.routeName));
    setSelectedStop(null);
    setSelectedRoute(null);
  };

  const handleStopSelect = (route, stop) => {
    setSelectedStop(stop);
    setSelectedRoute(route);
  };

  // ── submit ──
  const handleSubmit = async () => {
    if (!selectedStudent || !selectedOption) return;
    setSubmitting(true);

    const payload = {
      admissionNos: [selectedStudent.admissionNo],
      semesterApplicable: selectedStudent.currentSemester,
      transferAs: selectedOption === "hosteller" ? "HS" : "DS",
      initiateBy: empId,
      initiateAt: new Date().toISOString().slice(0, 19),
      busStop:
        selectedOption === "hosteller"
          ? null
          : selectedOption === "public"
          ? "Public"
          : selectedStop,
      busRoute:
        selectedOption === "hosteller"
          ? null
          : selectedOption === "public"
          ? "Public"
          : selectedRoute?.routeName,
    };

    try {
      const res = await safeFetch(`${API_BASE_URL}/feeTransferReq`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const text = await res.text();
      if (!res.ok) throw new Error(text);

      toast.success(
        `Request submitted for ${selectedStudent.studentName}`,
        {
          duration: 4000,
          style: {
            background: "#f0fdf4",
            color: "#15803d",
            border: "1px solid #dcfce7",
            fontWeight: "600",
          },
          iconTheme: { primary: "#16a34a", secondary: "#fff" },
        }
      );

      // reset full form
      setSelectedStudent(null);
      setSelectedOption(null);
      setOpenRoute(null);
      setSelectedStop(null);
      setSelectedRoute(null);

      // refresh list
      fetchStudents();
    } catch (err) {
      toast.error(err.message || "Failed to submit request.", {
        duration: 5000,
        style: {
          background: "#FEF2F2",
          color: "#ef4444",
          border: "1px solid #fecaca",
        },
      });
    } finally {
      setSubmitting(false);
    }
  };

  // ── can submit? ──
  const canSubmit =
    selectedStudent &&
    selectedOption &&
    (selectedOption === "hosteller" ||
      selectedOption === "public" ||
      (selectedOption === "bus" && selectedStop && selectedRoute));

  const stepNum = selectedOption === "bus" ? "3" : "2";

  // ─── render ──────────────────────────────────────────────────────────────

  return (
    <div
      className="flex overflow-hidden"
      style={{ height: "100vh", fontFamily: "'DM Sans', sans-serif" }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Serif+Display&display=swap');`}</style>
      <Toaster position="top-right" />

      {/* ── Sidebar ── */}
      <Sidebar
        students={students}
        loading={listLoading}
        error={listError}
        selectedStudent={selectedStudent}
        onSelect={handleSelectStudent}
        onRefresh={fetchStudents}
      />

      {/* ── Main Panel ── */}
      <main
        className="flex-1 overflow-y-auto p-6 md:p-8"
        style={{ background: "#F8FAFC" }}
      >
        {/* Page title */}
        <div className="flex items-center gap-3 mb-8">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-sm"
            style={{ background: "#dcfce7" }}
          >
            <Leaf size={22} style={{ color: "#16a34a" }} strokeWidth={2} />
          </div>
          <div>
            <h1
              className="text-2xl font-bold tracking-tight"
              style={{
                fontFamily: "'DM Serif Display', serif",
                color: "#0F172A",
              }}
            >
              Fee Change Requests
            </h1>
            <p className="text-sm" style={{ color: "#64748B" }}>
              Select a student and initiate a fee type transfer
            </p>
          </div>
        </div>

        {/* ── Empty state ── */}
        {!selectedStudent && (
          <div className="flex flex-col items-center justify-center py-36 gap-5">
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center"
              style={{ background: "#f0fdf4" }}
            >
              <Users size={40} style={{ color: "#bbf7d0" }} strokeWidth={1.5} />
            </div>
            <div className="text-center">
              <p
                className="text-2xl font-bold"
                style={{
                  color: "#0F172A",
                  fontFamily: "'DM Serif Display', serif",
                }}
              >
                Select a Student
              </p>
              <p className="text-sm mt-2" style={{ color: "#64748B" }}>
                Choose a student from the sidebar to begin a fee change request
              </p>
            </div>
            <div
              className="flex items-center gap-2 text-xs px-4 py-2 rounded-full"
              style={{ background: "#f0fdf4", color: "#16a34a" }}
            >
              <ArrowLeft size={13} strokeWidth={2} />
              Students listed on the left panel
            </div>
          </div>
        )}

        {/* ── Student selected ── */}
        {selectedStudent && (
          <>
            {/* Selected student banner */}
            <div
              className="rounded-2xl border p-5 mb-8 flex items-center justify-between gap-4"
              style={{
                background: "#fff",
                borderColor: "#E2E8F0",
                boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "#dcfce7" }}
                >
                  <GraduationCap
                    size={22}
                    style={{ color: "#16a34a" }}
                    strokeWidth={2}
                  />
                </div>
                <div>
                  <p className="font-bold text-base" style={{ color: "#0F172A" }}>
                    {selectedStudent.studentName}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span
                      className="text-xs font-bold px-2.5 py-0.5 rounded-lg"
                      style={{ background: "#dcfce7", color: "#15803d" }}
                    >
                      {selectedStudent.admissionNo}
                    </span>
                    <span className="text-xs" style={{ color: "#94A3B8" }}>
                      {selectedStudent.department} • Sem {selectedStudent.currentSemester}
                    </span>
                    {!selectedStudent.isDayScholar && (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-semibold"
                        style={{ background: "#fff7ed", color: "#ea580c" }}
                      >
                        Hosteller
                      </span>
                    )}
                    {selectedStudent.isDayScholar && (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-semibold"
                        style={{ background: "#f0fdf4", color: "#16a34a" }}
                      >
                        Day Scholar
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedStudent(null);
                  setSelectedOption(null);
                  setOpenRoute(null);
                  setSelectedStop(null);
                  setSelectedRoute(null);
                }}
                className="p-2 rounded-xl hover:bg-gray-50 transition-colors flex-shrink-0"
                style={{ color: "#94A3B8" }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Step 1 label */}
            <div className="flex items-center gap-2.5 mb-4">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{ background: "#16a34a" }}
              >
                1
              </div>
              <p className="text-sm font-bold" style={{ color: "#0F172A" }}>
                Choose Fee Transfer Type
              </p>
            </div>

            {/* Option cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <OptionCard
                icon={Home}
                label="Hosteller"
                description="Transfer to hostel accommodation fee"
                disabledReason="Already enrolled as a hosteller"
                selected={selectedOption === "hosteller"}
                disabled={!selectedStudent.isDayScholar}
                color="#ea580c"
                bg="#fff7ed"
                onClick={() => handleOptionSelect("hosteller")}
              />
              <OptionCard
                icon={Bus}
                label="College Bus"
                description="Transfer to college transport route fee"
                selected={selectedOption === "bus"}
                disabled={false}
                color="#2563EB"
                bg="#E9F3FF"
                onClick={() => handleOptionSelect("bus")}
              />
              <OptionCard
                icon={Globe}
                label="Public Transport"
                description="Transfer to public transport / day scholar fee"
                selected={selectedOption === "public"}
                disabled={false}
                color="#7c3aed"
                bg="#f5f3ff"
                onClick={() => handleOptionSelect("public")}
              />
            </div>

            {/* ── College Bus sub-panel ── */}
            {selectedOption === "bus" && (
              <div className="mb-8">
                {/* Step 2 label */}
                <div className="flex items-center gap-2.5 mb-4">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ background: "#2563EB" }}
                  >
                    2
                  </div>
                  <p className="text-sm font-bold" style={{ color: "#0F172A" }}>
                    Select Route & Stop
                  </p>
                </div>

                {/* Bus loading */}
                {busLoading && (
                  <div className="flex items-center justify-center py-14 gap-3">
                    <RefreshCw
                      size={20}
                      style={{ color: "#2563EB" }}
                      className="animate-spin"
                    />
                    <p className="text-sm" style={{ color: "#64748B" }}>
                      Loading bus routes…
                    </p>
                  </div>
                )}

                {/* Bus error */}
                {!busLoading && busError && (
                  <div className="flex flex-col items-center justify-center py-14 gap-4">
                    <AlertCircle
                      size={32}
                      style={{ color: "#ef4444" }}
                      strokeWidth={1.5}
                    />
                    <div className="text-center">
                      <p className="font-semibold text-sm" style={{ color: "#0F172A" }}>
                        Failed to load routes
                      </p>
                      <p className="text-xs mt-1" style={{ color: "#64748B" }}>
                        {busError}
                      </p>
                    </div>
                    <button
                      onClick={fetchBusRoutes}
                      className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl text-white"
                      style={{ background: "#2563EB" }}
                    >
                      <RefreshCw size={13} /> Retry
                    </button>
                  </div>
                )}

                {/* Route accordion */}
                {!busLoading && !busError && busRoutes.length > 0 && (
                  <div className="space-y-3">
                    {busRoutes.map((route) => {
                      const isOpen = openRoute === route.routeName;
                      return (
                        <div
                          key={route.routeName}
                          className="rounded-2xl overflow-hidden border transition-all"
                          style={{
                            borderColor: isOpen ? "#2563EB" : "#E2E8F0",
                            boxShadow: isOpen
                              ? "0 4px 16px rgba(37,99,235,0.1)"
                              : "none",
                          }}
                        >
                          {/* Route header */}
                          <button
                            onClick={() => handleRouteToggle(route)}
                            className="w-full flex items-center justify-between p-4 transition-colors"
                            style={{
                              background: isOpen ? "#E9F3FF" : "#fff",
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center"
                                style={{
                                  background: isOpen ? "#2563EB" : "#F1F5F9",
                                }}
                              >
                                <Bus
                                  size={18}
                                  style={{
                                    color: isOpen ? "#fff" : "#94A3B8",
                                  }}
                                  strokeWidth={2}
                                />
                              </div>
                              <div className="text-left">
                                <p
                                  className="font-bold text-sm"
                                  style={{ color: "#0F172A" }}
                                >
                                  {route.routeName}
                                </p>
                                <p
                                  className="text-xs"
                                  style={{ color: "#94A3B8" }}
                                >
                                  {route.stops.length} stops
                                </p>
                              </div>
                            </div>
                            {isOpen ? (
                              <ChevronDown
                                size={16}
                                style={{ color: "#2563EB" }}
                              />
                            ) : (
                              <ChevronRight
                                size={16}
                                style={{ color: "#94A3B8" }}
                              />
                            )}
                          </button>

                          {/* Stops */}
                          {isOpen && (
                            <div
                              className="p-4 border-t"
                              style={{
                                borderColor: "#DBEAFE",
                                background: "#F8FBFF",
                              }}
                            >
                              <p
                                className="text-xs font-bold uppercase tracking-wider mb-3"
                                style={{ color: "#94A3B8" }}
                              >
                                Select Your Stop
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {route.stops.map((stop) => {
                                  const isStopSel =
                                    selectedStop === stop &&
                                    selectedRoute?.routeName === route.routeName;
                                  return (
                                    <button
                                      key={stop}
                                      onClick={() =>
                                        handleStopSelect(route, stop)
                                      }
                                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95"
                                      style={{
                                        background: isStopSel
                                          ? "#2563EB"
                                          : "#fff",
                                        color: isStopSel ? "#fff" : "#0F172A",
                                        border: `1.5px solid ${
                                          isStopSel ? "#2563EB" : "#E2E8F0"
                                        }`,
                                        boxShadow: isStopSel
                                          ? "0 2px 8px rgba(37,99,235,0.3)"
                                          : "none",
                                      }}
                                    >
                                      <MapPin size={10} strokeWidth={2.5} />
                                      {stop}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── Review & Submit ── */}
            {canSubmit && (
              <div
                className="rounded-2xl border p-6"
                style={{
                  background: "#fff",
                  borderColor: "#E2E8F0",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
                }}
              >
                {/* Step label */}
                <div className="flex items-center gap-2.5 mb-5">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ background: "#16a34a" }}
                  >
                    {stepNum}
                  </div>
                  <p className="text-sm font-bold" style={{ color: "#0F172A" }}>
                    Review & Submit
                  </p>
                </div>

                {/* Summary */}
                <div
                  className="rounded-2xl p-4 mb-5 space-y-2.5"
                  style={{ background: "#F8FAFC" }}
                >
                  {[
                    {
                      label: "Student",
                      value: selectedStudent.studentName,
                    },
                    {
                      label: "Admission No",
                      value: selectedStudent.admissionNo,
                    },
                    {
                      label: "Semester",
                      value: `Semester ${selectedStudent.currentSemester}`,
                    },
                    {
                      label: "Transfer As",
                      value:
                        selectedOption === "hosteller"
                          ? "Hosteller (HS)"
                          : selectedOption === "public"
                          ? "Public Transport (DS)"
                          : "College Bus (DS)",
                    },
                    ...(selectedOption === "bus"
                      ? [
                          {
                            label: "Route",
                            value: selectedRoute?.routeName,
                          },
                          { label: "Stop", value: selectedStop },
                        ]
                      : []),
                  ].map(({ label, value }) => (
                    <div
                      key={label}
                      className="flex items-center justify-between text-sm"
                    >
                      <span style={{ color: "#94A3B8" }}>{label}</span>
                      <span
                        className="font-semibold"
                        style={{ color: "#0F172A" }}
                      >
                        {value}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Submit button */}
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full py-3.5 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-95 disabled:opacity-70"
                  style={{
                    background:
                      "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
                    boxShadow: "0 4px 16px rgba(22,163,74,0.35)",
                  }}
                >
                  {submitting ? (
                    <>
                      <RefreshCw size={15} className="animate-spin" />
                      Submitting Request…
                    </>
                  ) : (
                    <>
                      <SendHorizonal size={15} />
                      Submit Fee Change Request
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}