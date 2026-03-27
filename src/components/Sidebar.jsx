import { NavLink } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { LogOut } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  CalendarDays,
  FileText,
} from "lucide-react";

const Sidebar = () => {
  const { user, logout } = useAuth();

  const linkClasses = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition ${
      isActive
        ? "bg-[#3f548f] text-white shadow-md"
        : "text-gray-300 hover:bg-[#3f548f] hover:text-white"
    }`;

  const sectionTitle =
    "text-xs font-semibold text-gray-400 uppercase tracking-wider mt-6 mb-2";

  return (
    <aside className="h-full bg-[#2b3c6b] text-white p-6">

      {/* Logo / Title */}
      <div className="mb-10">
        <h2 className="text-xl font-bold tracking-wide">
          LMS
        </h2>
        <p className="text-xs text-gray-300 mt-1">
          Leave Management
        </p>
      </div>

      {/* Navigation */}
      <nav className="space-y-1 flex-1">

        {/* SUPERADMIN */}
        {user?.role === "SUPERADMIN" && (
          <>
          <NavLink to="/superadmin/dashboard" className={linkClasses}>
            <LayoutDashboard size={18} />
            Dashboard
          </NavLink>
           <NavLink to="/superadmin/attendance-muster" className={linkClasses}>
            <LayoutDashboard size={18} />
            Attendance Muster
          </NavLink>

            <NavLink to="/superadmin/excel-uploads" className={linkClasses}>
            <LayoutDashboard size={18} />
            Excel Uploads
          </NavLink>

          <NavLink to="/superadmin/holiday-settings" className={linkClasses}>
            <LayoutDashboard size={18} />
            Holiday Settings
          </NavLink>
          </>
        )}

        {/* ADMIN */}
        {user?.role === "ADMIN" && (
          <>
            <p className={sectionTitle}>Overview</p>

            <NavLink to="/admin/dashboard" className={linkClasses}>
              <LayoutDashboard size={18} />
              Dashboard
            </NavLink>

            <p className={sectionTitle}>User Management</p>

            <NavLink to="/admin/users" className={linkClasses}>
              <Users size={18} />
              Faculty Profiles
            </NavLink>
<p className={sectionTitle}>Approvals</p>
            <NavLink to="/admin/leave-approvals" className={linkClasses}>
              <ClipboardCheck size={18} />
              Leave Approvals
            </NavLink>

            <NavLink to="/admin/od-approvals" className={linkClasses}>
              <ClipboardCheck size={18} />
              OD Approvals
            </NavLink>

            <NavLink to="/admin/permission-approvals" className={linkClasses}>
              <ClipboardCheck size={18} />
              Permission Approvals
            </NavLink>
          </>
        )}

        {/* FACULTY */}
        {user?.role === "FACULTY" && (
          <>
            <p className={sectionTitle}>Overview</p>

            <NavLink to="/faculty/dashboard" className={linkClasses}>
              <LayoutDashboard size={18} />
              Dashboard
            </NavLink>
            <p className={sectionTitle}>Attendance</p>
            <NavLink to="/faculty/attendance" className={linkClasses}>
              <CalendarDays size={18} />
              My Attendance
            </NavLink>
            <p className={sectionTitle}>Request Status</p>
            <NavLink to="/faculty/my-leaves" className={linkClasses}>
              <ClipboardCheck size={18} />
              Pending Request
            </NavLink>

            <p className={sectionTitle}>Requests & Applications</p>

            <NavLink to="/faculty/apply-leave" className={linkClasses}>
              <FileText size={18} />
              Apply Leave
            </NavLink>

            <NavLink to="/faculty/apply-permission" className={linkClasses}>
              <ClipboardCheck size={18} />
              Apply Permission
            </NavLink>
            
             <NavLink to="/faculty/apply-od" className={linkClasses}>
              <ClipboardCheck size={18} />
              Apply OD
            </NavLink>

          </>
        )}

      </nav>

      {/* Logout - Common for All */}
      <div className="mt-auto pt-6">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium text-gray-300 hover:bg-red-500 hover:text-white transition"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>

      {/* Footer */}
      <div className="text-xs text-gray-400 mt-6">
        © 2026 LMS
      </div>

    </aside>
  );
};

export default Sidebar;