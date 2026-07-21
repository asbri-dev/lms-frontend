import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../../auth/useAuth";
import { API_BASE_URL } from "../../config/api";
import {
  Leaf,
  RefreshCw,
  AlertCircle,
  Search,
  X,
  Eye,
  ArrowLeft,
  Users,
  GraduationCap,
  Phone,
  Mail,
  BadgeCheck,
  Building2,
  CalendarDays,
  BookOpen,
  IndianRupee,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Wallet,
  ChevronDown,
  MapPin,
  Hash,
  WifiOff,
  Filter,
} from "lucide-react";

// ─── constants ────────────────────────────────────────────────────────────────

const FEE_LABELS = {
  uniformFee: "Uniform Fee",
  applicationFee: "Application Fee",
  idCardFee: "ID Card Fee",
  cautionDeposit: "Caution Deposit",
  ratificationFee: "Ratification Fee",
  alumniFee: "Alumni Fee",
  industrialAndTrainingFee: "Industrial & Training Fee",
  tuitionFee: "Tuition Fee",
  bookFee: "Book Fee",
  affiliationFee: "Affiliation Fee",
  transportationFee: "Transportation Fee",
  libraryAndLaboratoryFee: "Library & Laboratory Fee",
  hostelAndMessFee: "Hostel & Mess Fee",
};

const fmt = (val) => {
  if (val === null || val === undefined || val === "NA" || val === "N/A") return "N/A";
  const num = Number(val);
  if (isNaN(num)) return String(val);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(num);
};

async function fetchWithTimeout(url, options = {}, ms = 10000) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { ...options, signal: ctrl.signal });
    clearTimeout(id);
    return res;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

function isNetworkError(err) {
  return (
    err.name === "AbortError" ||
    err.message?.toLowerCase().includes("failed to fetch") ||
    err.message?.toLowerCase().includes("network") ||
    !window.navigator.onLine
  );
}

// ─── skeleton ─────────────────────────────────────────────────────────────────

function ListSkeleton() {
  return (
    <div className="space-y-2.5 mt-2">
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="h-14 rounded-xl animate-pulse"
          style={{ background: "#E2E8F0", opacity: 1 - i * 0.09 }}
        />
      ))}
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-5">
      <div className="h-48 rounded-2xl animate-pulse" style={{ background: "#E2E8F0" }} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 rounded-2xl animate-pulse" style={{ background: "#E2E8F0" }} />
        ))}
      </div>
      <div className="h-80 rounded-2xl animate-pulse" style={{ background: "#E2E8F0" }} />
    </div>
  );
}

// ─── shared components ────────────────────────────────────────────────────────

function ErrorState({ message, onRetry, network }) {
  return (
    <div className="flex flex-col items-center justify-center py-28 gap-5">
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center"
        style={{ background: network ? "#FFF7ED" : "#FEF2F2" }}
      >
        {network ? (
          <WifiOff size={36} style={{ color: "#ea580c" }} strokeWidth={1.5} />
        ) : (
          <AlertCircle size={36} style={{ color: "#ef4444" }} strokeWidth={1.5} />
        )}
      </div>
      <div className="text-center max-w-xs">
        <p
          className="font-bold text-lg"
          style={{ color: "#0F172A", fontFamily: "'DM Serif Display', serif" }}
        >
          {network ? "Cannot Reach Server" : "Something Went Wrong"}
        </p>
        <p className="text-sm mt-1" style={{ color: "#64748B" }}>
          {message}
        </p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
          style={{ background: "#16a34a" }}
        >
          <RefreshCw size={14} />
          Try Again
        </button>
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  const paid = status?.toLowerCase() === "paid";
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{
        background: paid ? "#f0fdf4" : "#FEF2F2",
        color: paid ? "#16a34a" : "#ef4444",
      }}
    >
      {paid ? (
        <CheckCircle2 size={10} strokeWidth={2.5} />
      ) : (
        <Clock size={10} strokeWidth={2.5} />
      )}
      {status}
    </span>
  );
}

function InfoChip({ icon: Icon, label, value, color, bg }) {
  return (
    <div
      className="flex items-center gap-3 p-3 rounded-xl border"
      style={{ background: "#FAFAFA", borderColor: "#E2E8F0" }}
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: bg }}
      >
       {Icon && <Icon size={15} style={{ color }} strokeWidth={2} />}
      </div>
      <div className="min-w-0">
        <p className="text-xs" style={{ color: "#94A3B8" }}>{label}</p>
        <p className="text-sm font-semibold truncate" style={{ color: "#0F172A" }}>
          {value || "N/A"}
        </p>
      </div>
    </div>
  );
}

// ─── list view ────────────────────────────────────────────────────────────────

function ListView({  students, loading, error, isNetErr, lastSynced, onRefresh, onView }) {
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("");

  const departments = useMemo(
    () => [...new Set(students.map((s) => s.department).filter(Boolean))].sort(),
    [students]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return students.filter((s) => {
      const matchSearch =
        !q ||
        s.admissionNo?.toLowerCase().includes(q) ||
        s.registrationNo?.toLowerCase().includes(q) ||
        s.studentName?.toLowerCase().includes(q) ||
        s.mobileNumber?.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q) ||
        s.department?.toLowerCase().includes(q);
      const matchDept = !filterDept || s.department === filterDept;
      return matchSearch && matchDept;
    });
  }, [students, search, filterDept]);

  const deptColors = [
    { color: "#2563EB", bg: "#E9F3FF" },
    { color: "#7c3aed", bg: "#f5f3ff" },
    { color: "#ea580c", bg: "#fff7ed" },
    { color: "#0891b2", bg: "#e0f2fe" },
  ];

  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-sm"
            style={{ background: "#dcfce7" }}
          >
            <Users size={22} style={{ color: "#16a34a" }} strokeWidth={2} />
          </div>
          <div>
            <h1
              className="text-2xl font-bold tracking-tight"
              style={{ fontFamily: "'DM Serif Display', serif", color: "#0F172A" }}
            >
              Students
            </h1>
            <p className="text-sm" style={{ color: "#64748B" }}>
              View and manage student fee records
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {lastSynced && (
            <span className="text-xs" style={{ color: "#94A3B8" }}>
              Updated {lastSynced.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all hover:shadow-md active:scale-95 disabled:opacity-50"
            style={{ background: "#fff", color: "#16a34a", borderColor: "#dcfce7" }}
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {loading && <ListSkeleton />}

      {!loading && error && (
        <ErrorState message={error} onRetry={onRefresh} network={isNetErr} />
      )}

      {!loading && !error && (
        <>
          {/* Stats strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div
              className="rounded-2xl border p-4 flex items-center gap-3"
              style={{ background: "#fff", borderColor: "#E2E8F0" }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: "#dcfce7" }}
              >
                <Users size={18} style={{ color: "#16a34a" }} strokeWidth={2} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#94A3B8" }}>
                  Total
                </p>
                <p className="text-xl font-extrabold" style={{ color: "#0F172A" }}>
                  {students.length}
                </p>
              </div>
            </div>
            {departments.slice(0, 3).map((dept, i) => {
              const c = deptColors[i % deptColors.length];
              return (
                <div
                  key={dept}
                  className="rounded-2xl border p-4 flex items-center gap-3"
                  style={{ background: "#fff", borderColor: "#E2E8F0" }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: c.bg }}
                  >
                    <GraduationCap size={18} style={{ color: c.color }} strokeWidth={2} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#94A3B8" }}>
                      {dept}
                    </p>
                    <p className="text-xl font-extrabold" style={{ color: "#0F172A" }}>
                      {students.filter((s) => s.department === dept).length}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Search + Filter */}
          <div
            className="rounded-2xl border p-4 mb-5 flex flex-wrap gap-3 items-center"
            style={{ background: "#fff", borderColor: "#E2E8F0" }}
          >
            <div className="relative flex-1 min-w-52">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: "#94A3B8" }}
              />
              <input
                type="text"
                placeholder="Search name, admission no, mobile, email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-9 py-2 rounded-xl text-sm border focus:outline-none transition-all"
                style={{ borderColor: "#E2E8F0", color: "#0F172A" }}
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X size={13} style={{ color: "#94A3B8" }} />
                </button>
              )}
            </div>

            <div className="relative">
              <select
                value={filterDept}
                onChange={(e) => setFilterDept(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 rounded-xl text-sm font-medium border focus:outline-none transition-all"
                style={{
                  background: filterDept ? "#dcfce7" : "#fff",
                  color: filterDept ? "#15803d" : "#64748B",
                  borderColor: filterDept ? "#16a34a" : "#E2E8F0",
                  minWidth: "160px",
                }}
              >
                <option value="">All Departments</option>
                {departments.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <ChevronDown
                size={13}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: "#94A3B8" }}
              />
            </div>

            {(search || filterDept) && (
              <button
                onClick={() => { setSearch(""); setFilterDept(""); }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all"
                style={{ color: "#ef4444", border: "1px solid #fecaca" }}
              >
                <X size={13} /> Reset
              </button>
            )}
          </div>

          {/* Table / Empty */}
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="rounded-2xl p-4" style={{ background: "#f0fdf4" }}>
                <Search size={36} style={{ color: "#bbf7d0" }} strokeWidth={1.5} />
              </div>
              <div className="text-center">
                <p className="font-semibold" style={{ color: "#0F172A" }}>No students found</p>
                <p className="text-sm mt-1" style={{ color: "#94A3B8" }}>
                  Try adjusting your search or filter
                </p>
              </div>
              <button
                onClick={() => { setSearch(""); setFilterDept(""); }}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
                style={{ background: "#16a34a" }}
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div
              className="rounded-2xl border overflow-hidden"
              style={{ borderColor: "#E2E8F0" }}
            >
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: "#f0fdf4" }}>
                      {["#", "Admission No", "Reg No", "Student Name", "Mobile", "Email", "Department", "Action"].map((h) => (
                        <th
                          key={h}
                          className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wider whitespace-nowrap"
                          style={{ color: "#16a34a" }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((student, idx) => (
                      <tr
                        key={student.admissionNo}
                        className="border-t transition-colors hover:bg-green-50/50"
                        style={{ borderColor: "#F1F5F9" }}
                      >
                        <td className="px-5 py-3.5 text-xs" style={{ color: "#94A3B8" }}>
                          {idx + 1}
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className="font-bold text-xs px-2.5 py-1 rounded-lg"
                            style={{ background: "#dcfce7", color: "#15803d" }}
                          >
                            {student.admissionNo}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-xs font-mono" style={{ color: "#64748B" }}>
                          {student.registrationNo}
                        </td>
                        <td className="px-5 py-3.5 font-semibold" style={{ color: "#0F172A" }}>
                          {student.studentName}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5 text-xs" style={{ color: "#64748B" }}>
                            <Phone size={11} strokeWidth={2} style={{ color: "#94A3B8" }} />
                            {student.mobileNumber}
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div
                            className="flex items-center gap-1.5 text-xs max-w-48 truncate"
                            style={{ color: "#64748B" }}
                            title={student.email}
                          >
                            <Mail size={11} strokeWidth={2} style={{ color: "#94A3B8" }} />
                            {student.email}
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                            style={{ background: "#E9F3FF", color: "#2563EB" }}
                          >
                            <BookOpen size={10} strokeWidth={2.5} />
                            {student.department}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <button
                            onClick={() => onView(student)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all hover:shadow-sm active:scale-95"
                            style={{ background: "#f0fdf4", color: "#16a34a", borderColor: "#dcfce7" }}
                          >
                            <Eye size={13} strokeWidth={2} />
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div
                className="px-5 py-3 border-t flex items-center justify-between"
                style={{ background: "#f8fafc", borderColor: "#E2E8F0" }}
              >
                <p className="text-xs" style={{ color: "#94A3B8" }}>
                  Showing{" "}
                  <span className="font-bold" style={{ color: "#16a34a" }}>
                    {filtered.length}
                  </span>{" "}
                  of {students.length} students
                </p>
                <p className="text-xs" style={{ color: "#94A3B8" }}>
                  Click View to see fee details
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}

// ─── detail view ──────────────────────────────────────────────────────────────

function DetailView({ student, onBack }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isNetErr, setIsNetErr] = useState(false);

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    setError(null);
    setIsNetErr(false);
    try {
      const res = await fetchWithTimeout(
        `${API_BASE_URL}/myDashboard?admissionNo=${student.admissionNo}`,
        { method: "GET", headers: { "Content-Type": "application/json" } }
      );
      if (!res.ok) throw new Error(`Server returned ${res.status}. Please try again.`);
      const json = await res.json();
      setDetail(json);
    } catch (err) {
      if (isNetworkError(err)) {
        setIsNetErr(true);
        setError("Cannot reach server. Please check your connection or if the backend is running.");
      } else {
        setError(err.message || "Failed to load student details.");
      }
    } finally {
      setLoading(false);
    }
  }, [student.admissionNo]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const studInfo = detail?.studInfo ?? {};
  const fees = detail?.fees ?? [];
  const totals = detail?.totals ?? {};

  const infoChips = [
    { icon: GraduationCap, label: "Full Name", value: studInfo.studentFullName, color: "#16a34a", bg: "#dcfce7" },
    { icon: Hash, label: "Admission No", value: studInfo.studentAdmissionNumber, color: "#2563EB", bg: "#E9F3FF" },
    { icon: BookOpen, label: "Department", value: studInfo.studentDepartment, color: "#7c3aed", bg: "#f5f3ff" },
    { icon: MapPin, label: "Campus", value: studInfo.studentCampus, color: "#ea580c", bg: "#fff7ed" },
    { icon: CalendarDays, label: "Academic Year", value: studInfo.currentAcademicYear, color: "#16a34a", bg: "#dcfce7" },
    { icon: Filter, label: "Semester", value: studInfo.currentSemester ? `Semester ${studInfo.currentSemester}` : null, color: "#2563EB", bg: "#E9F3FF" },
    { icon: BadgeCheck, label: "Fee Code", value: studInfo.applicableFeeCode, color: "#7c3aed", bg: "#f5f3ff" },
    { icon: Users, label: "Caste Category", value: studInfo.casteCategory, color: "#ea580c", bg: "#fff7ed" },
    { icon: Building2, label: "Student Type", value: studInfo.studentType, color: "#16a34a", bg: "#dcfce7" },
    { icon: IndianRupee, label: "Fee Type", value: studInfo.feeType, color: "#2563EB", bg: "#E9F3FF" },
  ];

  const totalCards = [
    { label: "Total Amount", value: fmt(totals.totalAmount), color: "#16a34a", bg: "#dcfce7", icon: IndianRupee },
    { label: "Amount Paid", value: fmt(totals.amountPaid), color: "#2563EB", bg: "#E9F3FF", icon: CheckCircle2 },
    {
      label: "Balance Due",
      value: fmt(totals.balanceExcludingFine),
      color: "#ef4444",
      bg: "#FEF2F2",
      icon: Wallet,
      sub: `Incl. fine: ${fmt(totals.balanceIncludingFine)}`,
    },
    {
      label: "Total Fine",
      value: fmt(totals.totalFine),
      color: Number(totals.totalFine) > 0 ? "#f59e0b" : "#CBD5E1",
      bg: Number(totals.totalFine) > 0 ? "#fffbeb" : "#F8FAFC",
      icon: AlertTriangle,
    },
  ];

  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-xl flex items-center justify-center border transition-all hover:shadow-sm active:scale-95 flex-shrink-0"
            style={{ background: "#fff", borderColor: "#E2E8F0", color: "#64748B" }}
          >
            <ArrowLeft size={18} />
          </button>
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: "#dcfce7" }}
          >
            <GraduationCap size={22} style={{ color: "#16a34a" }} strokeWidth={2} />
          </div>
          <div>
            <h1
              className="text-2xl font-bold tracking-tight"
              style={{ fontFamily: "'DM Serif Display', serif", color: "#0F172A" }}
            >
              {studInfo.studentFullName || student.studentName}
            </h1>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span
                className="text-xs font-bold px-2.5 py-0.5 rounded-lg"
                style={{ background: "#dcfce7", color: "#15803d" }}
              >
                {student.admissionNo}
              </span>
              <span className="text-xs" style={{ color: "#94A3B8" }}>
                Fee Dashboard
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={fetchDetail}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all hover:shadow-md active:scale-95 disabled:opacity-50 self-start sm:self-auto"
          style={{ background: "#fff", color: "#16a34a", borderColor: "#dcfce7" }}
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {loading && <DetailSkeleton />}

      {!loading && error && (
        <ErrorState message={error} onRetry={fetchDetail} network={isNetErr} />
      )}

      {!loading && !error && detail && (
        <>
          {/* Student Info Card */}
          <div
            className="rounded-2xl border p-6 mb-6"
            style={{ background: "#fff", borderColor: "#E2E8F0" }}
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-5 rounded-full" style={{ background: "#16a34a" }} />
              <h2
                className="text-xs font-bold uppercase tracking-widest"
                style={{ color: "#16a34a" }}
              >
                Student Information
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {infoChips.map(({ icon, label, value, color, bg }) => (
                <InfoChip key={label} icon={icon} label={label} value={value} color={color} bg={bg} />
              ))}
            </div>
          </div>

          {/* Totals Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {totalCards.map(({ label, value, color, bg, icon: Icon, sub }) => (
              <div
                key={label}
                className="rounded-2xl border p-5 flex flex-col gap-2"
                style={{ background: "#fff", borderColor: "#E2E8F0" }}
              >
                <div className="flex items-center justify-between">
                  <span
                    className="text-xs font-semibold uppercase tracking-wider"
                    style={{ color: "#94A3B8" }}
                  >
                    {label}
                  </span>
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: bg }}
                  >
                   {Icon && <Icon size={16} style={{ color }} strokeWidth={2} />}
                  </div>
                </div>
                <p className="text-xl font-extrabold" style={{ color: "#0F172A" }}>
                  {value}
                </p>
                {sub && (
                  <p className="text-xs" style={{ color: "#94A3B8" }}>{sub}</p>
                )}
              </div>
            ))}
          </div>

          {/* Fee Table */}
          <div
            className="rounded-2xl border overflow-hidden"
            style={{ borderColor: "#E2E8F0" }}
          >
            {/* Table header */}
            <div
              className="px-5 py-4 border-b flex items-center gap-2"
              style={{ background: "#f0fdf4", borderColor: "#dcfce7" }}
            >
              <div className="w-1 h-5 rounded-full" style={{ background: "#16a34a" }} />
              <h2
                className="text-xs font-bold uppercase tracking-widest"
                style={{ color: "#16a34a" }}
              >
                Fee Breakdown
              </h2>
              <span
                className="ml-auto px-2.5 py-1 rounded-full text-xs font-bold"
                style={{ background: "#dcfce7", color: "#15803d" }}
              >
                {fees.length} items
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "#F8FAFC" }}>
                    {["Fee Type", "Amount", "Paid", "Fine", "Balance", "Due Date", "Status"].map((h) => (
                      <th
                        key={h}
                        className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider whitespace-nowrap"
                        style={{ color: "#64748B" }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {fees.map((fee, idx) => {
                    const isNA = fee.amountToBePaid === "NA" || fee.amountToBePaid === null || fee.amountToBePaid === undefined;
                    const paid = Number(fee.amountPaid) || 0;
                    const total = isNA ? null : Number(fee.amountToBePaid);
                    const balance = isNA ? null : (total - paid);
                    const hasFine = Number(fee.fineAmount) > 0;
                    const isTBA = fee.dueDate === "To be Announced";

                    return (
                      <tr
                        key={idx}
                        className="border-t transition-colors hover:bg-green-50/30"
                        style={{ borderColor: "#F1F5F9" }}
                      >
                        {/* Fee Type */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            {hasFine && (
                              <AlertTriangle
                                size={13}
                                style={{ color: "#f59e0b" }}
                                strokeWidth={2}
                              />
                            )}
                            <span className="font-medium" style={{ color: "#0F172A" }}>
                              {FEE_LABELS[fee.typeOfFee] || fee.typeOfFee}
                            </span>
                          </div>
                        </td>

                        {/* Amount */}
                        <td
                          className="px-5 py-4 font-semibold"
                          style={{ color: isNA ? "#CBD5E1" : "#0F172A" }}
                        >
                          {isNA ? "N/A" : fmt(fee.amountToBePaid)}
                        </td>

                        {/* Paid */}
                        <td className="px-5 py-4" style={{ color: "#16a34a" }}>
                          {fmt(fee.amountPaid)}
                        </td>

                        {/* Fine */}
                        <td className="px-5 py-4">
                          {hasFine ? (
                            <span className="font-semibold" style={{ color: "#f59e0b" }}>
                              {fmt(fee.fineAmount)}
                            </span>
                          ) : (
                            <span style={{ color: "#CBD5E1" }}>—</span>
                          )}
                        </td>

                        {/* Balance */}
                        <td
                          className="px-5 py-4 font-semibold"
                          style={{
                            color: isNA
                              ? "#CBD5E1"
                              : balance > 0
                              ? "#ef4444"
                              : "#16a34a",
                          }}
                        >
                          {isNA ? "N/A" : fmt(balance)}
                        </td>

                        {/* Due Date */}
                        <td className="px-5 py-4">
                          {isTBA ? (
                            <span
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                              style={{ background: "#F1F5F9", color: "#94A3B8" }}
                            >
                              <CalendarDays size={10} /> TBA
                            </span>
                          ) : (
                            <span
                              className="inline-flex items-center gap-1.5 text-xs font-medium"
                              style={{ color: "#64748B" }}
                            >
                              <CalendarDays size={12} style={{ color: "#16a34a" }} />
                              {fee.dueDate}
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-5 py-4">
                          <StatusBadge status={fee.feeStatus} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

                {/* Footer totals row */}
                <tfoot>
                  <tr
                    style={{
                      background: "#f0fdf4",
                      borderTop: "2px solid #dcfce7",
                    }}
                  >
                    <td
                      className="px-5 py-3.5 font-bold text-xs uppercase tracking-wider"
                      style={{ color: "#16a34a" }}
                    >
                      Grand Total
                    </td>
                    <td className="px-5 py-3.5 font-bold" style={{ color: "#0F172A" }}>
                      {fmt(totals.totalAmount)}
                    </td>
                    <td className="px-5 py-3.5 font-bold" style={{ color: "#16a34a" }}>
                      {fmt(totals.amountPaid)}
                    </td>
                    <td className="px-5 py-3.5 font-bold" style={{ color: "#f59e0b" }}>
                      {fmt(totals.totalFine)}
                    </td>
                    <td className="px-5 py-3.5 font-bold" style={{ color: "#ef4444" }}>
                      {fmt(totals.balanceExcludingFine)}
                    </td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Fine notice */}
          {fees.some((f) => Number(f.fineAmount) > 0) && (
            <div
              className="mt-5 rounded-2xl p-4 flex items-start gap-3 border"
              style={{ background: "#fffbeb", borderColor: "#fde68a" }}
            >
              <AlertTriangle
                size={17}
                style={{ color: "#f59e0b" }}
                className="flex-shrink-0 mt-0.5"
                strokeWidth={2}
              />
              <p className="text-sm" style={{ color: "#92400e" }}>
                Some fees have additional fines. Please advise the student to clear dues at the earliest to avoid further charges.
              </p>
            </div>
          )}
        </>
      )}
    </>
  );
}

// ─── main export ──────────────────────────────────────────────────────────────

export default function AdminStudentPage() {
  const { user } = useAuth();
  const empId = user?.employeeId;

  // list state lifted to parent so it persists when switching to detail and back
  const [students, setStudents] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState(null);
  const [listNetErr, setListNetErr] = useState(false);
  const [lastSynced, setLastSynced] = useState(null);

  // view state
  const [selectedStudent, setSelectedStudent] = useState(null);

  const fetchStudents = useCallback(async () => {
    if (!empId) return;
    setListLoading(true);
    setListError(null);
    setListNetErr(false);
    try {
      const res = await fetchWithTimeout(
        `${API_BASE_URL}/admin/getAllStudents?empId=${empId}`,
        { method: "GET", headers: { "Content-Type": "application/json" } }
      );
      if (!res.ok) throw new Error(`Server returned ${res.status}. Please try again.`);
      const json = await res.json();
      setStudents(Array.isArray(json) ? json : []);
      setLastSynced(new Date());
    } catch (err) {
      if (isNetworkError(err)) {
        setListNetErr(true);
        setListError("Cannot reach server. Please check your connection or if the backend is running.");
      } else {
        setListError(err.message || "Failed to load students.");
      }
    } finally {
      setListLoading(false);
    }
  }, [empId]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  return (
    <div
      className="min-h-screen p-6 md:p-8"
      style={{ background: "#F8FAFC", fontFamily: "'DM Sans', sans-serif" }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Serif+Display&display=swap');`}</style>

      {selectedStudent ? (
        <DetailView
          student={selectedStudent}
          onBack={() => setSelectedStudent(null)}
        />
      ) : (
        <ListView
          empId={empId}
          students={students}
          loading={listLoading}
          error={listError}
          isNetErr={listNetErr}
          lastSynced={lastSynced}
          onRefresh={fetchStudents}
          onView={setSelectedStudent}
        />
      )}
    </div>
  );
}
