import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../auth/useAuth";
import { API_BASE_URL } from "../../config/api";
import {
  Building2,
  CalendarDays,
  UserRound
} from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────────
function getInitials(first = "", last = "") {
  return `${first[0] || ""}${last[0] || ""}`.toUpperCase();
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
    });
  } catch { return dateStr; }
}

function getAge(dob) {
  if (!dob) return "—";
  const diff = Date.now() - new Date(dob).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

const DESIGNATION_COLORS = {
  HOD:      "bg-[#2b3c6b]/10 text-[#2b3c6b] border-[#2b3c6b]/20",
  LECTURER: "bg-[#3f548f]/10 text-[#3f548f] border-[#3f548f]/20",
  ADMIN:    "bg-amber-50 text-amber-700 border-amber-200",
  OTHER:    "bg-gray-100 text-gray-600 border-gray-200",
};

const QUAL_COLORS = {
  "PG(Postgraduate)":    "bg-purple-50 text-purple-700 border-purple-200",
  "UG(Undergraduate)":   "bg-blue-50 text-blue-700 border-blue-200",
  "PhD":                 "bg-green-50 text-green-700 border-green-200",
};

function designationStyle(d = "") {
  return DESIGNATION_COLORS[d.toUpperCase()] || DESIGNATION_COLORS.OTHER;
}
function qualStyle(q = "") {
  return QUAL_COLORS[q] || "bg-gray-100 text-gray-600 border-gray-200";
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-11 h-11 rounded-full bg-gray-200" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 bg-gray-200 rounded w-3/4" />
          <div className="h-3 bg-gray-100 rounded w-1/2" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-gray-100 rounded w-full" />
        <div className="h-3 bg-gray-100 rounded w-4/5" />
        <div className="h-3 bg-gray-100 rounded w-2/3" />
      </div>
      <div className="mt-4 flex gap-2">
        <div className="h-5 w-16 bg-gray-200 rounded-full" />
        <div className="h-5 w-14 bg-gray-200 rounded-full" />
      </div>
    </div>
  );
}

// ── Info Row ──────────────────────────────────────────────────────────────────
function InfoRow({ label, value }) {
  return (
    <div className="flex items-start gap-2 py-2 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-400 w-36 flex-shrink-0 mt-0.5">{label}</span>
      <span className="text-xs font-medium text-gray-800 flex-1 break-words">{value || "—"}</span>
    </div>
  );
}

// ── Section Header ────────────────────────────────────────────────────────────
function DrawerSection({ title, children }) {
  return (
    <div className="mb-5">
      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">{title}</div>
      <div className="bg-gray-50 rounded-xl px-4 py-1">{children}</div>
    </div>
  );
}

// ── Detail Drawer ─────────────────────────────────────────────────────────────
function DetailDrawer({ employee, onClose }) {
  const [tab, setTab] = useState("personal");
  if (!employee) return null;

  const { personalDetails: p, educationDetails: e, bankDetails: b,
          addressDetails: a, contactDetails: c } = employee;

  const fullName = `${p.firstName} ${p.middleName || ""} ${p.lastName}`.trim();
  const initials = getInitials(p.firstName, p.lastName);

  const tabs = [
    { id: "personal",   label: "Personal" },
    { id: "education",  label: "Education" },
    { id: "bank",       label: "Bank" },
    { id: "address",    label: "Address" },
    { id: "contact",    label: "Emergency" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100 bg-white">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                style={{ background: "linear-gradient(135deg,#2b3c6b,#3f548f)" }}
              >
                {initials}
              </div>
              <div>
                <div className="text-base font-bold text-gray-900 leading-tight">{fullName}</div>
                <div className="text-xs text-gray-400 font-mono mt-0.5">{p.empId}</div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors text-lg"
            >
              ✕
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${designationStyle(p.designation)}`}>
              {p.designation}
            </span>
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${qualStyle(e?.highestQualification)}`}>
              {qualificationLabel(e?.highestQualification) || "—"} 
            </span>
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
              p.activeStatus === "Active"
                ? "bg-green-50 text-green-700 border-green-200"
                : "bg-red-50 text-red-700 border-red-200"
            }`}>
              {p.activeStatus}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-4 bg-white overflow-x-auto">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`text-xs font-semibold px-3 py-3 border-b-2 whitespace-nowrap transition-colors ${
                tab === t.id
                  ? "border-[#2b3c6b] text-[#2b3c6b]"
                  : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-5">

          {tab === "personal" && (
            <>
              <DrawerSection title="Basic info">
                <InfoRow label="Full Name" value={fullName} />
                <InfoRow label="Employee ID" value={p.empId} />
                <InfoRow label="Gender" value={p.gender} />
                <InfoRow label="Date of Birth" value={`${formatDate(p.dateOfBirth)} (${getAge(p.dateOfBirth)} yrs)`} />
                <InfoRow label="Blood Group" value={p.bloodGroup} />
                <InfoRow label="Marital Status" value={p.martialStatus} />
                {p.martialStatus === "Married" && (
                  <InfoRow label="Marriage Date" value={formatDate(p.marriageDate)} />
                )}
              </DrawerSection>
              <DrawerSection title="Work info">
                <InfoRow label="Department" value={p.facultyDept} />
                <InfoRow label="Designation" value={p.designation} />
                <InfoRow label="Campus" value={p.collegeLocation} />
                <InfoRow label="Date of Joining" value={formatDate(p.dateOfJoining)} />
                <InfoRow label="Reporting Manager" value={p.reportingManager} />
                <InfoRow label="Manager ID" value={p.reportingManagerEmpId} />
              </DrawerSection>
              <DrawerSection title="Leave balance">
                <InfoRow label="Casual Leaves" value={p.casualLeaves} />
                <InfoRow label="Medical Leaves" value={p.medicalLeaves} />
                <InfoRow label="On Duty Requests" value={p.onDutyRequests || "0"} />
              </DrawerSection>
              <DrawerSection title="Contact">
                <InfoRow label="Mobile" value={p.mobileNumber} />
                <InfoRow label="Email" value={p.email} />
                {p.alternateEmail && <InfoRow label="Alt Email" value={p.alternateEmail} />}
              </DrawerSection>
            </>
          )}

          {tab === "education" && e && (
            <>
              <DrawerSection title="Highest qualification">
                <InfoRow label="Level" value={e.highestQualification} />
              </DrawerSection>
              <DrawerSection title="Undergraduate">
                <InfoRow label="Course" value={e.ugCourse} />
                <InfoRow label="Specialization" value={e.ugSpecialization} />
                <InfoRow label="College" value={e.ugCollegeName} />
                <InfoRow label="University" value={e.ugUniversityName} />
                <InfoRow label="Duration" value={`${formatDate(e.ugStartDate)} → ${formatDate(e.ugEndDate)}`} />
                <InfoRow label="Status" value={e.ugStatus} />
              </DrawerSection>
              {e.pgCourse && e.pgCourse !== "N/A" && (
                <DrawerSection title="Postgraduate">
                  <InfoRow label="Course" value={e.pgCourse} />
                  <InfoRow label="Specialization" value={e.pgSpecialization} />
                  <InfoRow label="College" value={e.pgCollegeName} />
                  <InfoRow label="University" value={e.pgUniversityName} />
                  <InfoRow label="Duration" value={`${formatDate(e.pgStartDate)} → ${formatDate(e.pgEndDate)}`} />
                  <InfoRow label="Status" value={e.pgStatus} />
                </DrawerSection>
              )}
              {e.phDStatus && e.phDStatus !== "N/A" && (
                <DrawerSection title="PhD">
                  <InfoRow label="Specialization" value={e.phDSpecialization} />
                  <InfoRow label="College" value={e.phDCollegeName} />
                  <InfoRow label="University" value={e.phDUniversityName} />
                  <InfoRow label="Status" value={e.phDStatus} />
                </DrawerSection>
              )}
            </>
          )}

          {tab === "bank" && b && (
            <>
              <DrawerSection title="Bank account">
                <InfoRow label="Name on Account" value={b.nameAsPerBankRecords} />
                <InfoRow label="Bank" value={b.bankName} />
                <InfoRow label="Branch" value={b.bankBranch} />
                <InfoRow label="Account Number" value={b.accountNumber} />
                <InfoRow label="IFSC Code" value={b.ifscCode} />
                <InfoRow label="Account Type" value={b.typeOfAccount} />
              </DrawerSection>
              <DrawerSection title="PF details">
                <InfoRow label="PF Eligible" value={b.eligibleForPf ? "Yes" : "No"} />
                <InfoRow label="PF Number" value={b.pfNumber} />
                <InfoRow label="PF Scheme" value={b.pfScheme} />
                <InfoRow label="PF Join Date" value={formatDate(b.pfJoiningDate)} />
                <InfoRow label="UAN" value={b.universalAccountNumber || "—"} />
              </DrawerSection>
            </>
          )}

          {tab === "address" && a && (
            <>
              <DrawerSection title="Current address">
                <InfoRow label="Street / H.No" value={a.streetAreaHno} />
                <InfoRow label="City" value={a.currentCity} />
                <InfoRow label="District" value={a.currentDistrict} />
                <InfoRow label="State" value={a.currentState} />
                <InfoRow label="Postal Code" value={String(a.postalCode)} />
                <InfoRow label="Nationality" value={a.nationality} />
              </DrawerSection>
              {!a.isSame && (
                <DrawerSection title="Permanent address">
                  <InfoRow label="Street / H.No" value={a.permanentStreetAreaHno} />
                  <InfoRow label="City" value={a.permanentCity} />
                  <InfoRow label="District" value={a.permanentDistrict} />
                  <InfoRow label="State" value={a.permanentState} />
                  <InfoRow label="Postal Code" value={String(a.permanentPostalCode)} />
                </DrawerSection>
              )}
              {a.isSame && (
                <div className="text-xs text-gray-400 text-center py-2">Same as current address</div>
              )}
            </>
          )}

          {tab === "contact" && c && (
            <>
              <DrawerSection title="Family">
                <InfoRow label="Father" value={c.fatherName} />
                <InfoRow label="Mother" value={c.motherName} />
                {c.spouseName && c.spouseName !== "NA" && (
                  <InfoRow label="Spouse" value={c.spouseName} />
                )}
              </DrawerSection>
              <DrawerSection title="Emergency contact">
                <InfoRow label="Name" value={c.emergencyContactName} />
                <InfoRow label="Relation" value={c.emergencyContactRelation} />
                <InfoRow label="Mobile" value={c.emergencyContactMobileNumber} />
                {c.emergencyContactEmail && (
                  <InfoRow label="Email" value={c.emergencyContactEmail} />
                )}
              </DrawerSection>
              <DrawerSection title="Nearby landmarks">
                <InfoRow label="Railway Station" value={c.nearByRailWayStation} />
                <InfoRow label="Post Office" value={c.nearByPostOffice} />
                <InfoRow label="Pincode" value={c.postOfficePinCode} />
              </DrawerSection>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
const qualificationLabel = (qual) => {
  const map = {
    "UG(Undergraduate)": "UG",
    "PG(Postgraduate)": "PG",
    "PhD(Doctorate)": "PhD",
  };

  return map[qual] || qual;
};

// ── Faculty Card ──────────────────────────────────────────────────────────────
function FacultyCard({ employee, onClick }) {
  const { personalDetails: p, educationDetails: e } = employee;
  const fullName = `${p.firstName} ${p.middleName || ""} ${p.lastName}`.trim();
  const initials = getInitials(p.firstName, p.lastName);

  return (
    <div
      onClick={onClick}
      className="bg-white border border-gray-200 rounded-xl p-5 cursor-pointer hover:shadow-md hover:border-[#3f548f]/40 transition-all duration-200 group"
    >
      <div className="flex items-start gap-3 mb-3">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center text-xs font-bold text-white flex-shrink-0 group-hover:scale-105 transition-transform"
          style={{ background: "linear-gradient(135deg,#2b3c6b,#3f548f)" }}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-gray-900 truncate leading-tight">{fullName}</div>
          <div className="text-xs font-mono text-gray-400 mt-0.5">{p.empId}</div>
        </div>
        <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${p.activeStatus === "Active" ? "bg-green-400" : "bg-red-400"}`} />
      </div>

<div className="space-y-1.5 mb-3">
  <div className="flex items-center gap-1.5 text-xs text-gray-500">
    <Building2 size={14} className="text-blue-500" />
    <span className="truncate">{p.facultyDept}</span>
  </div>

  <div className="flex items-center gap-1.5 text-xs text-gray-500">
    <CalendarDays size={14} className="text-green-500" />
    <span>Joined {formatDate(p.dateOfJoining)}</span>
  </div>

  <div className="flex items-center gap-1.5 text-xs text-gray-500">
    <UserRound size={14} className="text-purple-500" />
    <span className="truncate">{p.reportingManager}</span>
  </div>
</div>

      <div className="flex flex-wrap gap-1.5">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${designationStyle(p.designation)}`}>
          {p.designation}
        </span>
        {e?.highestQualification && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${qualStyle(e.highestQualification)}`}>
            {qualificationLabel(e.highestQualification)}
          </span>
        )}
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-50 text-gray-500 border border-gray-200 ml-auto">
          {p.gender}
        </span>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function UserManagement() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [selected, setSelected]   = useState(null);

  // Filters
  const [search, setSearch]       = useState("");
  const [deptFilter, setDeptFilter]   = useState("All");
  const [desigFilter, setDesigFilter] = useState("All");
  const [genderFilter, setGenderFilter] = useState("All");
  const [qualFilter, setQualFilter]   = useState("All");
  const [view, setView]           = useState("grid"); // grid | table

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${API_BASE_URL}/faculty/getAllRegFacultyDetails?rmEmpId=${user?.employeeId}`
      );
      if (!res.ok) throw new Error(`Server responded with ${res.status}`);
      const json = await res.json();
      setEmployees(Array.isArray(json) ? json : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchData(); }, [user?.employeeId]);

  // Build filter options from data
  const departments = useMemo(() => {
    const all = [...new Set(employees.map(e => e.personalDetails?.facultyDept).filter(Boolean))].sort();
    return ["All", ...all];
  }, [employees]);

  const designations = useMemo(() => {
    const all = [...new Set(employees.map(e => e.personalDetails?.designation).filter(Boolean))].sort();
    return ["All", ...all];
  }, [employees]);

  const qualifications = useMemo(() => {
    const all = [...new Set(employees.map(e => e.educationDetails?.highestQualification).filter(Boolean))].sort();
    return ["All", ...all];
  }, [employees]);

  const filtered = useMemo(() => {
    return employees.filter(emp => {
      const p = emp.personalDetails || {};
      const e = emp.educationDetails || {};
      const s = search.toLowerCase();

      if (search && !(
        (p.firstName + " " + p.lastName).toLowerCase().includes(s) ||
        p.empId?.toLowerCase().includes(s) ||
        p.facultyDept?.toLowerCase().includes(s) ||
        p.mobileNumber?.includes(s)
      )) return false;

      if (deptFilter  !== "All" && p.facultyDept !== deptFilter)             return false;
      if (desigFilter !== "All" && p.designation !== desigFilter)             return false;
      if (genderFilter !== "All" && p.gender !== genderFilter)               return false;
      if (qualFilter  !== "All" && e.highestQualification !== qualFilter)    return false;

      return true;
    });
  }, [employees, search, deptFilter, desigFilter, genderFilter, qualFilter]);

  // Stats
  const stats = useMemo(() => ({
    total:    employees.length,
    active:   employees.filter(e => e.personalDetails?.activeStatus === "Active").length,
    hods:     employees.filter(e => e.personalDetails?.designation === "HOD").length,
    male:     employees.filter(e => e.personalDetails?.gender === "Male").length,
    female:   employees.filter(e => e.personalDetails?.gender === "Female").length,
  }), [employees]);

  const hasFilters = search || deptFilter !== "All" || desigFilter !== "All" || genderFilter !== "All" || qualFilter !== "All";

  // Table columns
  const thCls = "px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap";
  const tdCls = "px-4 py-3 text-sm text-gray-700 align-middle border-b border-gray-50";

  return (
    <div className="bg-[#f9fafb] min-h-screen p-7 font-sans">

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-[#2b3c6b] tracking-tight">User Management</h1>
          <p className="text-sm text-gray-500 mt-1">Faculty directory — registered under your supervision</p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg bg-white border border-gray-200 text-[#2b3c6b] hover:bg-gray-50 transition-colors"
        >
          ↻ Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-5 flex items-center justify-between bg-red-50 border border-red-200 rounded-xl px-5 py-4">
          <div>
            <div className="text-sm font-semibold text-red-800">Failed to load faculty</div>
            <div className="text-xs text-red-600 mt-0.5">{error}</div>
          </div>
          <button onClick={fetchData} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white border border-red-200 text-red-700 hover:bg-red-50">
            Retry
          </button>
        </div>
      )}

      {/* Stat Pills */}
      <div className="flex flex-wrap gap-3 mb-6">
        {[
          { label: "Total", val: stats.total,  color: "bg-[#2b3c6b] text-white" },
          { label: "Active", val: stats.active, color: "bg-green-600 text-white" },
          { label: "HODs",   val: stats.hods,   color: "bg-[#3f548f] text-white" },
          { label: "Male",   val: stats.male,   color: "bg-blue-50 text-blue-700 border border-blue-200" },
          { label: "Female", val: stats.female, color: "bg-pink-50 text-pink-700 border border-pink-200" },
        ].map(s => (
          <div key={s.label} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${s.color}`}>
            <span>{s.val}</span>
            <span className="font-normal opacity-80">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="bg-white border border-gray-200 rounded-xl px-5 py-4 mb-5">
        <div className="flex flex-wrap gap-3 items-center">

          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 text-sm">🔍</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search name, ID, department, phone..."
              className="w-full pl-8 pr-4 py-2 text-sm rounded-lg border border-gray-200 bg-gray-50 text-gray-700 outline-none focus:border-[#3f548f] placeholder-gray-400"
            />
          </div>

          {/* Department */}
          <select
            value={deptFilter}
            onChange={e => setDeptFilter(e.target.value)}
            className="text-xs font-medium px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-700 outline-none focus:border-[#3f548f] cursor-pointer"
          >
            {departments.map(d => <option key={d} value={d}>{d === "All" ? "All Departments" : d}</option>)}
          </select>

          {/* Designation */}
          <select
            value={desigFilter}
            onChange={e => setDesigFilter(e.target.value)}
            className="text-xs font-medium px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-700 outline-none focus:border-[#3f548f] cursor-pointer"
          >
            {designations.map(d => <option key={d} value={d}>{d === "All" ? "All Designations" : d}</option>)}
          </select>

          {/* Gender */}
          <select
            value={genderFilter}
            onChange={e => setGenderFilter(e.target.value)}
            className="text-xs font-medium px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-700 outline-none focus:border-[#3f548f] cursor-pointer"
          >
            {["All", "Male", "Female"].map(g => <option key={g} value={g}>{g === "All" ? "All Genders" : g}</option>)}
          </select>

          {/* Qualification */}
          <select
            value={qualFilter}
            onChange={e => setQualFilter(e.target.value)}
            className="text-xs font-medium px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-700 outline-none focus:border-[#3f548f] cursor-pointer"
          >
            {qualifications.map(q => <option key={q} value={q}>{q === "All" ? "All Qualifications" : q}</option>)}
          </select>

          {/* Clear */}
          {hasFilters && (
            <button
              onClick={() => { setSearch(""); setDeptFilter("All"); setDesigFilter("All"); setGenderFilter("All"); setQualFilter("All"); }}
              className="text-xs font-semibold text-red-500 hover:text-red-700 px-2"
            >
              ✕ Clear
            </button>
          )}

          {/* View toggle */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 ml-auto">
            {[["grid","⊞"],["table","☰"]].map(([v, icon]) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                  view === v ? "bg-white shadow-sm text-[#2b3c6b]" : "text-gray-400"
                }`}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>

        {/* Result count */}
        <div className="mt-3 text-xs text-gray-400">
          {loading ? "Loading..." : `${filtered.length} of ${employees.length} faculty members`}
          {hasFilters && <span className="ml-2 text-[#3f548f] font-medium">· Filters applied</span>}
        </div>
      </div>

      {/* Grid View */}
      {view === "grid" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {loading
            ? Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)
            : filtered.length === 0
              ? (
                <div className="col-span-full py-20 text-center">
                  <div className="text-4xl mb-3">🔍</div>
                  <div className="text-sm font-medium text-gray-500">No faculty found</div>
                  <div className="text-xs text-gray-400 mt-1">Try adjusting your search or filters</div>
                </div>
              )
              : filtered.map(emp => (
                  <FacultyCard
                    key={emp.EmployeeId}
                    employee={emp}
                    onClick={() => setSelected(emp)}
                  />
                ))
          }
        </div>
      )}

      {/* Table View */}
      {view === "table" && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {["Employee", "Department", "Designation", "Qualification", "Joined", "Contact", "Status"].map(h => (
                    <th key={h} className={thCls}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i}>
                        {[1,2,3,4,5,6,7].map(j => (
                          <td key={j} className={tdCls}>
                            <div className="h-3 bg-gray-100 rounded animate-pulse" />
                          </td>
                        ))}
                      </tr>
                    ))
                  : filtered.length === 0
                    ? (
                      <tr>
                        <td colSpan={7} className="py-16 text-center text-sm text-gray-400">
                          No faculty found
                        </td>
                      </tr>
                    )
                    : filtered.map(emp => {
                        const p = emp.personalDetails || {};
                        const e = emp.educationDetails || {};
                        const fullName = `${p.firstName} ${p.lastName}`.trim();
                        return (
                          <tr
                            key={emp.EmployeeId}
                            onClick={() => setSelected(emp)}
                            className="hover:bg-[#f9fafb] cursor-pointer transition-colors"
                          >
                            <td className={tdCls}>
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                                  style={{ background: "linear-gradient(135deg,#2b3c6b,#3f548f)" }}
                                >
                                  {getInitials(p.firstName, p.lastName)}
                                </div>
                                <div>
                                  <div className="font-semibold text-gray-800 text-xs">{fullName}</div>
                                  <div className="text-gray-400 text-xs font-mono">{p.empId}</div>
                                </div>
                              </div>
                            </td>
                            <td className={tdCls}>
                              <span className="text-xs text-gray-600">{p.facultyDept}</span>
                            </td>
                            <td className={tdCls}>
                              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${designationStyle(p.designation)}`}>
                                {p.designation}
                              </span>
                            </td>
                            <td className={tdCls}>
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${qualStyle(e.highestQualification)}`}>
                                {qualificationLabel(e.highestQualification || "—").replace("(Postgraduate)", " PG").replace("(Undergraduate)", " UG")}
                              </span>
                            </td>
                            <td className={tdCls}>
                              <span className="text-xs text-gray-600">{formatDate(p.dateOfJoining)}</span>
                            </td>
                            <td className={tdCls}>
                              <span className="text-xs text-gray-500">{p.mobileNumber}</span>
                            </td>
                            <td className={tdCls}>
                              <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                                p.activeStatus === "Active"
                                  ? "bg-green-50 text-green-700"
                                  : "bg-red-50 text-red-700"
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${p.activeStatus === "Active" ? "bg-green-500" : "bg-red-500"}`} />
                                {p.activeStatus}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                }
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Drawer */}
      {selected && (
        <DetailDrawer employee={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
