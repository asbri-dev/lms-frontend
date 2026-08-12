import { useState, useCallback, useEffect, useMemo } from "react";
import { API_BASE_URL } from "../../../config/api";
import { useAuth } from "../../../auth/useAuth";
import { toast } from "react-hot-toast";
import { Search, MapPin, Users, CheckCircle2, X } from "lucide-react";

const getLocation = (employeeId) => {
  if (!employeeId) return "Unknown";
  if (employeeId.startsWith("AREP")) return "Palakkad";
  if (employeeId.startsWith("AREC")) return "Chittoor";
  return "Unknown";
};

const EXIT_TYPES = [
  "Resignation",
  "Retirement",
  "Contract end",
  "Termination",
  "Absconded",
];

const fullName = (f) =>
  [f.firstName, f.middleName, f.lastName].filter(Boolean).join(" ").trim();

// yyyy-MM-dd (native <input type="date">) -> dd-MM-yyyy (backend format)
const toBackendDate = (isoDate) => {
  if (!isoDate) return "";
  const [y, m, d] = isoDate.split("-");
  return `${d}-${m}-${y}`;
};

const InitialsAvatar = ({ name, size = 40 }) => {
  const initials = (name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  return (
    <div
      style={{ width: size, height: size }}
      className="flex items-center justify-center rounded-full bg-gradient-to-br from-red-200 to-red-600 text-white text-sm font-semibold shrink-0"
    >
      {initials || "?"}
    </div>
  );
};

/* ─── Confirm Modal ─── */
const ConfirmModal = ({ emp, exitType, lastWorkingDay, reasonForExit, onConfirm, onCancel, submitting }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
    <div className="bg-white rounded-xl p-6 max-w-sm w-full space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>
        <div>
          <div className="text-sm font-semibold text-gray-800">Confirm exit process</div>
          <div className="text-xs text-gray-400">This action cannot be undone</div>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg px-4 py-3 text-sm text-gray-600 space-y-1.5">
        <div>
          You are about to initiate the exit process for{" "}
          <span className="font-semibold text-gray-800">{fullName(emp)}</span> ({emp.empId}).
        </div>
        <div className="text-xs text-gray-500 pt-1 space-y-0.5">
          <div><span className="text-gray-400">Exit type:</span> {exitType}</div>
          <div><span className="text-gray-400">Last working day:</span> {lastWorkingDay}</div>
          {reasonForExit && <div><span className="text-gray-400">Reason:</span> {reasonForExit}</div>}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onCancel}
          disabled={submitting}
          className="flex-1 text-sm py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={submitting}
          className="flex-1 text-sm py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors font-medium flex items-center justify-center gap-2"
        >
          {submitting && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
          {submitting ? "Submitting..." : "Confirm exit"}
        </button>
      </div>
    </div>
  </div>
);

/* ─── Exit Form ─── */
const ExitForm = ({ employee, exitInitiatedBy, onSubmitted, onCancel }) => {
  const [lastWorkingDay, setLastWorkingDay] = useState("");
  const [exitType, setExitType] = useState(EXIT_TYPES[0]);
  const [reasonForExit, setReasonForExit] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setLastWorkingDay("");
    setExitType(EXIT_TYPES[0]);
    setReasonForExit("");
  };

  const handleConfirm = async () => {
    try {
      setSubmitting(true);

      const res = await fetch(`${API_BASE_URL}/initiateExit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          empId: employee.empId,
          status: "Inactive",
          exitType,
          lastWorkingDay: toBackendDate(lastWorkingDay),
          reasonForExit,
          exitInitiatedBy,
        }),
      });

      const text = await res.text();
      let data = null;
      try {
        data = JSON.parse(text);
      } catch {
        /* non-JSON body */
      }

      if (!res.ok) {
        toast.error(data?.message || text || "Failed to initiate exit");
        return;
      }

      toast.success(data?.message || `Exit initiated for ${fullName(employee)} ✅`);
      resetForm();
      setShowConfirm(false);
      onSubmitted();
    } catch {
      toast.error("Network error while initiating exit");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
        <InitialsAvatar name={fullName(employee)} size={40} />
        <div>
          <div className="text-sm font-medium text-gray-800">{fullName(employee)}</div>
          <div className="text-xs text-gray-400">{employee.empId} · {getLocation(employee.empId)}</div>
        </div>
        <button onClick={onCancel} className="ml-auto text-gray-400 hover:text-gray-600">
          <X size={16} />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1.5">Last working day</label>
          <input
            type="date"
            value={lastWorkingDay}
            onChange={(e) => setLastWorkingDay(e.target.value)}
            min={new Date().toISOString().split("T")[0]}
            className="w-full border border-gray-200 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1.5">Exit type</label>
          <select
            value={exitType}
            onChange={(e) => setExitType(e.target.value)}
            className="w-full border border-gray-200 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
          >
            {EXIT_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1.5">Reason for exit</label>
          <textarea
            value={reasonForExit}
            onChange={(e) => setReasonForExit(e.target.value)}
            rows={3}
            placeholder="Describe the reason for this exit..."
            className="w-full border border-gray-200 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-200 resize-none"
          />
        </div>
      </div>

      <div className="flex gap-3 pt-1">
        <button
          onClick={onCancel}
          
          className="flex-1 text-sm py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={() => setShowConfirm(true)}
          disabled={!lastWorkingDay || !reasonForExit.trim()}
          className="flex-1 text-sm py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          Initiate exit
        </button>
      </div>

      {showConfirm && (
        <ConfirmModal
          emp={employee}
          exitType={exitType}
          lastWorkingDay={toBackendDate(lastWorkingDay)}
          reasonForExit={reasonForExit}
          submitting={submitting}
          onConfirm={handleConfirm}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </div>
  );
};

/* ─── Main Component ─── */
const EmployeeExitManagement = () => {
  const [activeTab, setActiveTab] = useState("initiate"); // "initiate" | "history"
  const { user } = useAuth();

  const [faculty, setFaculty] = useState([]);
  const [loadingFaculty, setLoadingFaculty] = useState(true);
  const [facultyError, setFacultyError] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("ALL");

  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const employeeId = user?.employeeId;

  const fetchFaculty = useCallback(async () => {
    try {
      setLoadingFaculty(true);
      setFacultyError(null);
      const res = await fetch(`${API_BASE_URL}/getFacultyAndAdmin?rmEmpId=${employeeId}`, {
        headers: { Authorization: `Bearer ${sessionStorage.getItem("authToken")}` },
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const json = await res.json();
      setFaculty(json.FacultyDetails || []);
    } catch (e) {
      setFacultyError(e.message || "Failed to load faculty");
    } finally {
      setLoadingFaculty(false);
    }
  }, [employeeId]);

  useEffect(() => {
    fetchFaculty();
  }, [fetchFaculty]);

  const filteredFaculty = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return faculty.filter((f) => {
      const matchesLocation = locationFilter === "ALL" || f.collegeLocation === locationFilter;
      if (!matchesLocation) return false;
      if (!term) return true;
      return fullName(f).toLowerCase().includes(term) || (f.empId || "").toLowerCase().includes(term);
    });
  }, [faculty, searchTerm, locationFilter]);

  const handleSelectEmployee = (emp) => setSelectedEmployee(emp);

  const handleSubmitted = () => {
    // Employee has exited — drop them from the pickable list and clear selection.
    setFaculty((prev) => prev.filter((f) => f.empId !== selectedEmployee?.empId));
    setSelectedEmployee(null);
  };

  return (
    <div className="space-y-5">
      {/* ─── Tabs ─── */}
      <div className="flex gap-1 border-b border-gray-200">
        {[
          { key: "initiate", label: "Initiate exit" },
          { key: "history", label: "Exit history" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === t.key
                ? "border-red-500 text-red-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ─── Initiate Exit ─── */}
      {activeTab === "initiate" && (
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-5 sm:py-8">
          <div className="mb-5">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-red-600 font-semibold mb-1">
              <Users size={14} /> SuperAdmin
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">Initiate Employee Exit</h2>
            <p className="text-sm text-gray-500 mt-1">
              Pick an employee from the directory to initiate the exit process. Search by name or employee ID, and filter by location.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-5 items-start">
            {/* LEFT: full employee directory */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col lg:sticky lg:top-5 lg:max-h-[calc(100vh-3rem)]">
              <div className="p-4 space-y-3 border-b border-gray-100">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search name or employee ID..."
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0f766e] focus:border-transparent"
                  />
                </div>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <select
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#0f766e] focus:border-transparent appearance-none"
                  >
                    <option value="ALL">All Locations</option>
                    <option value="CHITTOOR">Chittoor</option>
                    <option value="PALAKKAD">Palakkad</option>
                  </select>
                </div>
                <p className="text-xs text-gray-400">
                  {loadingFaculty ? "Loading..." : `${filteredFaculty.length} of ${faculty.length} employees`}
                </p>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-gray-100 lg:min-h-[400px]">
                {loadingFaculty && (
                  <div className="p-4 text-sm text-gray-400 animate-pulse">Loading employees...</div>
                )}

                {!loadingFaculty && facultyError && (
                  <div className="p-4 text-sm text-red-600 flex items-center justify-between">
                    <span>{facultyError}</span>
                    <button onClick={fetchFaculty} className="text-xs font-medium text-[#0f766e] hover:underline">
                      Retry
                    </button>
                  </div>
                )}

                {!loadingFaculty && !facultyError && filteredFaculty.length === 0 && (
                  <div className="p-4 text-sm text-gray-400">No employees match your search.</div>
                )}

                {!loadingFaculty &&
                  !facultyError &&
                  filteredFaculty.map((f) => {
                    const isSelected = selectedEmployee?.empId === f.empId;
                    return (
                      <button
                        key={f.empId}
                        type="button"
                        onClick={() => handleSelectEmployee(f)}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition border-l-4 ${
                          isSelected ? "bg-red-100 border-l-red-500" : "border-l-transparent hover:bg-gray-50"
                        }`}
                      >
                        <InitialsAvatar name={fullName(f)} size={34} />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-800 truncate">{fullName(f)}</p>
                          <p className="text-xs text-gray-500 truncate">
                            {f.empId} · {f.facultyDept}
                          </p>
                        </div>
                        <span className="text-[10px] font-semibold uppercase text-red-600 bg-red-50 px-1.5 py-0.5 rounded shrink-0">
                          {f.collegeLocation === "CHITTOOR" ? "CTR" : f.collegeLocation === "PALAKKAD" ? "PKD" : "—"}
                        </span>
                        {isSelected && <CheckCircle2 size={20} className="text-green-800 shrink-0" />}
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* RIGHT: exit form */}
            <div className="space-y-5">
              {selectedEmployee ? (
                <ExitForm
                  key={selectedEmployee.empId}
                  employee={selectedEmployee}
                  exitInitiatedBy={user?.employeeId}
                  onSubmitted={handleSubmitted}
                  onCancel={() => setSelectedEmployee(null)}
                />
              ) : (
                <div className="bg-white border border-gray-200 rounded-xl p-10 text-center text-gray-500 lg:min-h-[400px] flex flex-col items-center justify-center">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-3">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  <p className="text-sm">Select an employee from the directory to initiate the exit process.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── Exit History (placeholder — to be built later) ─── */}
      {activeTab === "history" && (
        <div className="flex items-center justify-center px-4 py-16">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-10 text-center max-w-md w-full">
            <div className="text-5xl mb-4">🚧</div>
            <h1 className="text-xl font-semibold text-gray-800 mb-2">Coming Soon</h1>
            <p className="text-sm text-gray-500">Exit history will be added here.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeExitManagement;
