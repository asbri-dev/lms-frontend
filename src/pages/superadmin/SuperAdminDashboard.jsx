import { useState } from "react";
import EmployeeDirectory from "./modules/EmployeeDirectory";
import TopLeaveTakers from "./modules/TopLeaveTakers";
import PendingRequests from "./modules/PendingRequests";
import EmployeeExitManagement from "./modules/EmployeeExitManagement";
import AuditLogs from "./modules/AuditLogs";
import FacultyAttendanceModule from "./modules/FacultyAttendanceModule";

const MODULES = [
  {
    key: "directory",
    label: "Employee Directory",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    component: <EmployeeDirectory />,
  },

  {
    key: "leavetakers",
    label: "Top Leave Takers",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
    component: <TopLeaveTakers />,
  },
  {
    key: "pending",
    label: "Pending Requests",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l3 3L22 4"/>
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
      </svg>
    ),
    component: <PendingRequests />,
  },
  {
  key: "audit",
  label: "Audit Logs",
  icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>
  ),
  component: <AuditLogs />,
},
  {
    key: "exit",
    label: "Exit Management",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <line x1="17" y1="8" x2="23" y2="8"/>
      </svg>
    ),
    component: <EmployeeExitManagement />,
  },
  {
    key: "faculty-attendance",
    label: "Faculty Attendance",
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <path d="M16 2v4" />
        <path d="M8 2v4" />
        <path d="M3 10h18" />
        <path d="M8 14h.01" />
        <path d="M12 14h.01" />
        <path d="M16 14h.01" />
      </svg>
    ),
    component: <FacultyAttendanceModule />,
  }
];

const SuperAdminDashboard = () => {
  const [active, setActive] = useState("directory");

  const current = MODULES.find((m) => m.key === active);

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ─── Top Header ─── */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-800">Super Admin Dashboard</h1>
          <p className="text-xs text-gray-400 mt-0.5">System-level control panel</p>
          
        </div>
        <span className="text-xs font-medium px-3 py-1 rounded-full bg-indigo-100 text-indigo-700">
          Super Admin
        </span>
      </div>

      {/* ─── Tab Bar ─── */}
      <div className="bg-white border-b border-gray-200 px-6">
        <div className="flex gap-1 overflow-x-auto scrollbar-hide">
          {MODULES.map((m) => (
            <button
              key={m.key}
              onClick={() => setActive(m.key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                active === m.key
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <span className={active === m.key ? "text-indigo-600" : "text-gray-400"}>
                {m.icon}
              </span>
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Active Module ─── */}
      <div className="p-6">
        {current?.component}
      </div>

    </div>
  );
};

export default SuperAdminDashboard;
