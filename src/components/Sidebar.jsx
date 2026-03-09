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
    <aside className="w-64 bg-[#2b3c6b] text-white min-h-screen p-6 flex flex-col">

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

            <p className={sectionTitle}>Management</p>

            <NavLink to="/admin/users" className={linkClasses}>
              <Users size={18} />
              Users
            </NavLink>

            <NavLink to="/admin/leave-approvals" className={linkClasses}>
              <ClipboardCheck size={18} />
              Leave Approvals
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

            <NavLink to="/faculty/attendance" className={linkClasses}>
              <CalendarDays size={18} />
              Attendance
            </NavLink>

            <p className={sectionTitle}>Leave Management</p>

            <NavLink to="/faculty/apply-leave" className={linkClasses}>
              <FileText size={18} />
              Apply Leave
            </NavLink>

            <NavLink to="/faculty/my-leaves" className={linkClasses}>
              <ClipboardCheck size={18} />
              My Leaves
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