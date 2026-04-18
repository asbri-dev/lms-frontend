import { useEffect, useMemo, useState, useCallback } from "react";
import { AuthProvider } from "../../../auth/AuthProvider";
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
  const { user } = AuthProvider();

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

  return (
    <div className="p-6 bg-gray-50 min-h-screen">

      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Employee Directory</h1>

        <div className="flex gap-2">
          <button onClick={() => toggleSort("name")}>
            Sort Name {sortField === "name" && (sortDir === "asc" ? "↑" : "↓")}
          </button>
          <button onClick={() => toggleSort("id")}>
            Sort ID {sortField === "id" && (sortDir === "asc" ? "↑" : "↓")}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <div className="relative">
          <Search className="absolute left-2 top-2 w-4 h-4 text-gray-400" />
          <input
            className="pl-8 border p-2 rounded w-full"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select onChange={(e) => setDept(e.target.value)} className="border p-2 rounded">
          {departments.map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>

        <select onChange={(e) => setLocation(e.target.value)} className="border p-2 rounded">
          {locations.map((l) => (
            <option key={l}>{l}</option>
          ))}
        </select>
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
        <div className="fixed inset-0 flex justify-center items-center bg-black/50">
          <div className="bg-white p-6 rounded w-96 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setSelectedEmp(null);
                setDetails(null);
              }}
              className="absolute top-2 right-2"
            >
              <X />
            </button>

            {detailsLoading ? (
              <p>Loading...</p>
            ) : details ? (
              <>
                <h2 className="text-xl font-bold">
                  {details.personal?.firstName || details.personal?.employeeName}{" "}
                  {details.personal?.lastName || ""}
                </h2>

                <p><b>Email:</b> {details.personal?.email}</p>
                <p><b>Mobile:</b> {details.personal?.mobileNumber}</p>
                <p><b>Department:</b> {details.personal?.facultyDept}</p>
                <p><b>Designation:</b> {details.personal?.designation}</p>

                <hr className="my-2"/>

                <p><b>City:</b> {details.address?.currentCity}</p>
                <p><b>State:</b> {details.address?.currentState}</p>

                <hr className="my-2"/>

                <p><b>Bank:</b> {details.bank?.bankName}</p>
                <p><b>Account:</b> {details.bank?.accountNumber}</p>

                <hr className="my-2"/>

                <p><b>Emergency Contact:</b> {details.contact?.emergencyContactName}</p>
                <p><b>Mobile:</b> {details.contact?.emergencyContactMobileNumber}</p>

                <hr className="my-2"/>

                <p><b>Qualification:</b> {details.education?.highestQualification}</p>
              </>
            ) : (
              <p>No data found</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeDirectory;