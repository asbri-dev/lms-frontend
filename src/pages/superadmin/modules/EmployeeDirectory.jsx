import { useEffect, useMemo, useState, useCallback } from "react";
import { useAuth } from "../../../auth/useAuth";
import { Search, X } from "lucide-react";
import { API_BASE_URL } from "../../../config/api";

// ✅ Helpers
const getInitials = (name = "") =>
  name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

const AVATAR_COLORS = [
  "bg-indigo-100 text-indigo-700 ring-indigo-200",
  "bg-emerald-100 text-emerald-700 ring-emerald-200",
  "bg-rose-100 text-rose-700 ring-rose-200",
  "bg-amber-100 text-amber-700 ring-amber-200",
  "bg-cyan-100 text-cyan-700 ring-cyan-200",
  "bg-purple-100 text-purple-700 ring-purple-200",
];

const avatarColor = (id = "") =>
  id
    ? AVATAR_COLORS[
        id.charCodeAt(id.length - 1) % AVATAR_COLORS.length
      ]
    : AVATAR_COLORS[0];

const EmployeeDirectory = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [department, setDept] = useState("All");
  const [location, setLocation] = useState("All");

  const [sortField, setSort] = useState("name");
  const [sortDir, setSortDir] = useState("asc");

  const [selectedEmp, setSelectedEmp] = useState(null);
  const [details, setDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const token = sessionStorage.getItem("authToken");
  const { user } = useAuth();

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSort(field);
      setSortDir("asc");
    }
  };

  // ✅ Fetch Employees
  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(
        `${API_BASE_URL}/getFacultyAndAdmin?rmEmpId=${user.employeeId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) throw new Error(`Server error: ${res.status}`);

      const json = await res.json();

      const admins = (json.AdminDetails || []).map((a) => ({
        employeeId: a.userName,
        employeeName: a.adminName,
        department: "Admin",
        designation: "Administrator",
        email: a.email,
        location: a.collageLocation || "Unknown",
        isAdmin: true,
      }));

      const faculty = (json.FacultyDetails || []).map((f) => ({
        employeeId: f.empId,
        employeeName: `${f.firstName || ""} ${f.lastName || ""}`.trim(),
        department: f.facultyDept || "Unknown",
        designation: f.designation,
        email: f.email,
        location: f.collegeLocation || "Unknown",
        isAdmin: false,
      }));

      setData([...admins, ...faculty]);
    } catch (e) {
      setError(e.message || "Failed to load employees");
    } finally {
      setLoading(false);
    }
  }, [token, user.employeeId]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // ✅ FIXED: Fetch FULL Employee Details
  const fetchEmployeeDetails = async (empId) => {
    try {
      setSelectedEmp(empId);
      setDetails(null);
      setDetailsLoading(true);

      const res = await fetch(
        `${API_BASE_URL}/faculty/getAllFacultyDetails?empId=${empId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const json = await res.json();

      let merged = {
        personal: {},
        address: {},
        bank: {},
        contact: {},
        education: {},
      };

      if (Array.isArray(json)) {
        json.forEach((item) => {
          if (item.personalDetails) merged.personal = item.personalDetails;
          if (item.addressDetails) merged.address = item.addressDetails;
          if (item.bankDetails) merged.bank = item.bankDetails;
          if (item.contactDetails) merged.contact = item.contactDetails;
          if (item.educationDetails) merged.education = item.educationDetails;
        });
      }

      setDetails(merged);
    } catch (err) {
      console.error(err);
    } finally {
      setDetailsLoading(false);
    }
  };

  const departments = useMemo(
    () => ["All", ...new Set(data.map((e) => e.department))],
    [data]
  );

  const locations = useMemo(
    () => ["All", ...new Set(data.map((e) => e.location))],
    [data]
  );

  const filtered = useMemo(() => {
    let result = data.filter((emp) => {
      const s = search.toLowerCase();
      return (
        (!search ||
          emp.employeeName?.toLowerCase().includes(s) ||
          emp.employeeId?.toLowerCase().includes(s)) &&
        (department === "All" || emp.department === department) &&
        (location === "All" || emp.location === location)
      );
    });

    return result.sort((a, b) => {
      const aVal = sortField === "name" ? a.employeeName : a.employeeId;
      const bVal = sortField === "name" ? b.employeeName : b.employeeId;

      return sortDir === "asc"
        ? (aVal || "").localeCompare(bVal || "")
        : (bVal || "").localeCompare(aVal || "");
    });
  }, [data, search, department, location, sortField, sortDir]);

function Section({ title, children }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
        {title}
      </p>
      <div className="bg-slate-50 rounded-xl px-4 py-3 space-y-2.5">
        {children}
      </div>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div className="flex justify-between items-start gap-4 text-sm">
      <span className="text-slate-500 shrink-0">{label}</span>
      <span className="text-slate-800 font-medium text-right break-all">
        {value || "—"}
      </span>
    </div>
  );
}

// For boolean fields like isPhysicallyChallenged
function BoolField({ label, value }) {
  return (
    <div className="flex justify-between items-center gap-4 text-sm">
      <span className="text-slate-500 shrink-0">{label}</span>
      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
        value
          ? "bg-blue-100 text-blue-700"
          : "bg-slate-200 text-slate-500"
      }`}>
        {value ? "Yes" : "No"}
      </span>
    </div>
  );
}
 function EduBlock({ label, course, spec, college, university, start, end, status }) {
  return (
    <div className="pt-1">
      <p className="text-xs text-[#3D7DFC] font-semibold uppercase tracking-wide mb-1.5">
        {label}
      </p>
      <div className="space-y-2 pl-2 border-l-2 border-slate-200">
        {course     && <Field label="Course"         value={course} />}
        {spec       && <Field label="Specialization" value={spec} />}
        {college    && <Field label="College"        value={college} />}
        {university && <Field label="University"     value={university} />}
        {start      && <Field label="Duration"       value={`${start} → ${end ?? "Present"}`} />}
        {status     && <Field label="Status"         value={status} />}
      </div>
    </div>
  );
}

  return (
    <div className="p-6 bg-gray-50 min-h-screen">

      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Employee Directory</h1>

       <div className="flex flex-wrap gap-3">

  <button
    onClick={() => toggleSort("name")}
    className={`
      flex items-center gap-2
      px-4 py-2
      rounded-xl
      border
      text-sm font-semibold
      transition-all duration-200
      shadow-sm
      hover:shadow-md
      hover:-translate-y-0.5

      ${
        sortField === "name"
          ? "bg-blue-600 text-white border-green-600"
          : "bg-white text-gray-700 border-gray-200 hover:bg-green-50"
      }
    `}
  >
    <span>Sort Name</span>

    {sortField === "name" && (
      <span className="text-base">
        {sortDir === "asc" ? "↑" : "↓"}
      </span>
    )}
  </button>

  <button
    onClick={() => toggleSort("id")}
    className={`
      flex items-center gap-2
      px-4 py-2
      rounded-xl
      border
      text-sm font-semibold
      transition-all duration-200
      shadow-sm
      hover:shadow-md
      hover:-translate-y-0.5

      ${
        sortField === "id"
          ? "bg-red-500 text-white border-red-300"
          : "bg-white text-gray-700 border-gray-200 hover:bg-blue-50"
      }
    `}
  >
    <span>Sort ID</span>

    {sortField === "id" && (
      <span className="text-base">
        {sortDir === "asc" ? "↑" : "↓"}
      </span>
    )}
  </button>

</div>
      </div>

      {/* Filters */}
   <div className="grid grid-cols-4 gap-3 mb-6">

  {/* Search */}
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      Search
    </label>

    <div className="relative">
      <Search className="absolute left-2 top-2.5 w-4 h-4 text-gray-400" />

      <input
        className="pl-8 shadow-sm p-2 rounded w-full"
        placeholder="Search..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
    </div>
  </div>

  {/* Department */}
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      Department
    </label>

    <select
      onChange={(e) => setDept(e.target.value)}
      className="shadow-sm p-2 rounded w-full"
    >
      {departments.map((d) => (
        <option key={d}>{d}</option>
      ))}
    </select>
  </div>

  {/* Location */}
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      Location
    </label>

    <select
      onChange={(e) => setLocation(e.target.value)}
      className="shadow-sm p-2 rounded w-full"
    >
      {locations.map((l) => (
        <option key={l}>{l}</option>
      ))}
    </select>
  </div>

</div>

      {/* Loading & Error */}
      {loading && <p className="text-center">Loading...</p>}
      {error && <p className="text-red-500 text-center">{error}</p>}

      {/* Cards */}
      <div className="grid grid-cols-3 gap-4">
        {filtered.map((emp) => (
          <div
            key={emp.employeeId}
            onClick={() => {
              if (!emp.isAdmin) {
                fetchEmployeeDetails(emp.employeeId);
              } else {
                setSelectedEmp(emp.employeeId);
                setDetails({ personal: emp });
              }
            }}
            className="bg-white p-4 rounded shadow cursor-pointer"
          >
            <div className="flex gap-3 items-center">
              <div className={`w-10 h-10 flex items-center justify-center rounded-xl ${avatarColor(emp.employeeId)}`}>
                {getInitials(emp.employeeName)}
              </div>

              <div>
                <h3 className="font-bold">{emp.employeeName}</h3>
                <p className="text-sm text-gray-500">{emp.employeeId}</p>
              </div>
            </div>

            <div className="mt-2 text-sm text-gray-600">
              {emp.department} - {emp.designation}
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
{selectedEmp && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
    <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">

      {/* ── Header ── */}
      <div className="bg-[#1E293B] px-6 pt-6 pb-5 relative">
        <button
          onClick={() => { setSelectedEmp(null); setDetails(null); }}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <X size={18} />
        </button>

        {detailsLoading ? (
          <div className="flex items-center gap-4 animate-pulse">
            <div className="w-14 h-14 rounded-full bg-slate-600" />
            <div className="space-y-2">
              <div className="h-4 w-36 bg-slate-600 rounded" />
              <div className="h-3 w-24 bg-slate-700 rounded" />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#3D7DFC] flex items-center justify-center text-white text-xl font-bold shrink-0">
              {(details?.personal?.firstName?.[0] ?? "?")}
              {(details?.personal?.lastName?.[0] ?? "")}
            </div>
            <div className="min-w-0">
              <h2 className="text-white text-lg font-semibold leading-tight">
                {[
                  details?.personal?.firstName,
                  details?.personal?.middleName,
                  details?.personal?.lastName,
                ].filter(Boolean).join(" ") || selectedEmp}
              </h2>
              <p className="text-slate-400 text-sm mt-0.5">
                {details?.personal?.designation || "—"}
              </p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full font-mono">
                  {details?.personal?.empId || selectedEmp}
                </span>
                {details?.personal?.activeStatus && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    details.personal.activeStatus === "Active"
                      ? "bg-green-900/60 text-green-400"
                      : "bg-red-900/60 text-red-400"
                  }`}>
                    ● {details.personal.activeStatus}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Body ── */}
      <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
        {detailsLoading ? (
          <div className="space-y-3 animate-pulse">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-4 bg-slate-100 rounded" style={{ width: `${70 + (i % 3) * 10}%` }} />
            ))}
          </div>
        ) : (
          <>
                      {/* ── Leave Summary ── */}
            <Section title="Leave Summary">
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: "Casual",     value: details?.personal?.casualLeaves      ?? "0" },
                  { label: "Medical",    value: details?.personal?.medicalLeaves     ?? "0" },
                  { label: "Permission", value: details?.personal?.permissionRequests ?? "0" },
                  { label: "On Duty",    value: details?.personal?.onDutyRequests    ?? "0" },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-white border border-slate-200 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-[#3D7DFC]">{value}</p>
                    <p className="text-xs text-slate-500 mt-0.5 leading-tight">{label}</p>
                  </div>
                ))}
              </div>
            </Section>
            {/* ── Contact ── */}
            <Section title="Contact">
              <Field label="Email"           value={details?.personal?.email} />
              <Field label="Alternate Email" value={details?.personal?.alternateEmail} />
              <Field label="Mobile"          value={details?.personal?.mobileNumber} />
            </Section>

            {/* ── Work ── */}
            <Section title="Work">
              <Field label="Department"        value={details?.personal?.facultyDept} />
              <Field label="College"           value={details?.personal?.collegeLocation} />
              <Field
                label="Reporting Manager"
                value={
                  details?.personal?.reportingManager
                    ? `${details.personal.reportingManager}${details.personal.reportingManagerEmpId ? ` (${details.personal.reportingManagerEmpId})` : ""}`
                    : null
                }
              />
              <Field label="Date of Joining"  value={details?.personal?.dateOfJoining} />
              <Field label="Salary Mode"      value={details?.personal?.salaryPaymentMode} />
              <Field label="Last Working Day" value={details?.personal?.lastWorkingDay} />
            </Section>

            {/* ── Personal ── */}
            <Section title="Personal">
              <Field label="Gender"         value={details?.personal?.gender} />
              <Field label="Date of Birth"  value={details?.personal?.dateOfBirth} />
              <Field label="Blood Group"    value={details?.personal?.bloodGroup} />
              <Field label="Marital Status" value={details?.personal?.martialStatus} />
              <Field label="Marriage Date"  value={details?.personal?.marriageDate} />
            </Section>

            {/* ── Employment ── */}
            <Section title="Employment">
              <Field label="Employee Status"   value={details?.personal?.employeeStatus} />
              <Field label="Confirmation Date" value={details?.personal?.confirmationDate} />
              <Field label="Probation Period"  value={details?.personal?.probationPeriod} />
              <Field label="Notice Period"     value={details?.personal?.noticePeriod} />
              <Field label="BGV Completed On"  value={details?.personal?.bgvCompletedOn} />
              <Field label="BGV Remarks"       value={details?.personal?.bgCheckRemarks} />
              <BoolField label="Physically Challenged"  value={details?.personal?.isPhysicallyChallenged} />
              <BoolField label="International Employee" value={details?.personal?.isInternationalEmployee} />
            </Section>

            {/* ── Address ── */}
            <Section title="Address" empty={!details?.address?.currentCity}>
              <Field label="Nationality" value={details?.address?.nationality} />
              <Field
                label="Current Address"
                value={
                  details?.address?.streetAreaHno
                    ? `${details.address.streetAreaHno}, ${details.address.currentCity}, ${details.address.currentDistrict}, ${details.address.currentState} – ${details.address.postalCode}`
                    : null
                }
              />
              <Field
                label="Permanent Address"
                value={
                  details?.address?.isSame
                    ? "Same as current"
                    : details?.address?.permanentStreetAreaHno
                    ? `${details.address.permanentStreetAreaHno}, ${details.address.permanentCity}, ${details.address.permanentDistrict}, ${details.address.permanentState} – ${details.address.permanentPostalCode}`
                    : null
                }
              />
            </Section>

            {/* ── Bank ── */}
            <Section title="Bank" empty={!details?.bank?.bankName}>
              <Field label="Name on Account" value={details?.bank?.nameAsPerBankRecords} />
              <Field
                label="Bank & Branch"
                value={
                  details?.bank?.bankName
                    ? `${details.bank.bankName}, ${details.bank.bankBranch}`
                    : null
                }
              />
              <Field label="Account Number" value={details?.bank?.accountNumber} />
              <Field label="IFSC Code"      value={details?.bank?.ifscCode} />
              <Field label="Account Type"   value={details?.bank?.typeOfAccount} />
              <BoolField label="PF Eligible" value={details?.bank?.eligibleForPf} />
              {details?.bank?.eligibleForPf && (
                <>
                  <Field label="PF Number"   value={details.bank.pfNumber} />
                  <Field label="PF Scheme"   value={details.bank.pfScheme} />
                  <Field label="PF Join Date" value={details.bank.pfJoiningDate} />
                  <Field label="UAN"         value={details.bank.universalAccountNumber} />
                </>
              )}
            </Section>

            {/* ── Education ── */}
            <Section title="Education" empty={!details?.education?.highestQualification}>
              <Field label="Highest Qualification" value={details?.education?.highestQualification} />

              {details?.education?.ugCourse && (
                <EduBlock
                  label="Undergraduate"
                  course={details.education.ugCourse}
                  spec={details.education.ugSpecialization}
                  college={details.education.ugCollegeName}
                  university={details.education.ugUniversityName}
                  start={details.education.ugStartDate}
                  end={details.education.ugEndDate}
                  status={details.education.ugStatus}
                />
              )}

              {details?.education?.pgCourse && (
                <EduBlock
                  label="Postgraduate"
                  course={details.education.pgCourse}
                  spec={details.education.pgSpecialization}
                  college={details.education.pgCollegeName}
                  university={details.education.pgUniversityName}
                  start={details.education.pgStartDate}
                  end={details.education.pgEndDate}
                  status={details.education.pgStatus}
                />
              )}

              {details?.education?.phDStatus && details.education.phDStatus !== "N/A" && (
                <EduBlock
                  label="PhD"
                  spec={details.education.phDSpecialization}
                  college={details.education.phDCollegeName}
                  university={details.education.phDUniversityName}
                  start={details.education.phDStartDate}
                  end={details.education.phDEndDate}
                  status={details.education.phDStatus}
                />
              )}
            </Section>

            {/* ── Emergency Contact ── */}
            <Section title="Emergency Contact" empty={!details?.contact?.emergencyContactName}>
              <Field label="Name"     value={details?.contact?.emergencyContactName} />
              <Field label="Relation" value={details?.contact?.emergencyContactRelation} />
              <Field label="Mobile"   value={details?.contact?.emergencyContactMobileNumber} />
              <Field label="Email"    value={details?.contact?.emergencyContactEmail} />
              <Field label="Father"   value={details?.contact?.fatherName} />
              <Field label="Mother"   value={details?.contact?.motherName} />
              <Field label="Spouse"   value={details?.contact?.spouseName} />
            </Section>

            {/* ── Leave Summary ── */}
            <Section title="Leave Summary">
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: "Casual",     value: details?.personal?.casualLeaves      ?? "0" },
                  { label: "Medical",    value: details?.personal?.medicalLeaves     ?? "0" },
                  { label: "Permission", value: details?.personal?.permissionRequests ?? "0" },
                  { label: "On Duty",    value: details?.personal?.onDutyRequests    ?? "0" },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-white border border-slate-200 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-[#3D7DFC]">{value}</p>
                    <p className="text-xs text-slate-500 mt-0.5 leading-tight">{label}</p>
                  </div>
                ))}
              </div>
            </Section>
          </>
        )}
      </div>

    </div>
  </div>
)}
    </div>
  );
};

export default EmployeeDirectory;