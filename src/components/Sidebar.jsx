import { NavLink } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { LogOut, X } from "lucide-react";
import { moduleConfig } from "../utils/moduleConfig";
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  CalendarDays,
  FileText,
  Edit,
  CalendarCheck,
  Upload,
  IndianRupee,
  BarChart3,
} from "lucide-react";

const Sidebar = ({ onClose }) => {
  const { user, logout } = useAuth();
  const currentModule = moduleConfig[user?.role];

  const linkClasses = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-2.5 sm:py-2 rounded-md text-sm font-medium transition ${
      isActive
        ? `${currentModule?.theme?.active} ${currentModule.theme.text} shadow-lg`
        : `${currentModule?.theme?.hover} hover:text-white ${currentModule.theme.Ntext}`
    }`;

  const sectionTitle = `text-xs font-bold ${currentModule?.theme?.Ntext} uppercase tracking-wider mt-6 mb-2 px-2`;

  return (
    <aside
      className={`w-64 h-full border-r border-gray-100 ${currentModule?.theme?.background} ${currentModule.theme.Ntext} flex flex-col p-4 sm:p-6 overflow-y-auto`}
    >

      {/* ── Logo + Close button (close only shows on mobile) ── */}
      <div className="flex items-center justify-between mb-2">
        <div className="min-w-0">
          <h2 className={`flex items-center gap-2 text-xl ${currentModule.theme.Ntext} font-bold tracking-wide border-b border-gray-300 pb-2 w-50`}>
            {currentModule?.icon && (
              <div className={`${currentModule?.background} shrink-0`}>
                <currentModule.icon size={22} color="#ffffff" />
              </div>
            )}
            <span className="truncate">{currentModule?.label}</span>
          </h2>
        </div>

        {/* Close button — mobile only */}
        <button
          onClick={onClose}
          className="lg:hidden shrink-0 p-1.5 rounded-lg text-gray-300 hover:bg-white/10 transition"
          aria-label="Close sidebar"
        >
          <X size={20} />
        </button>
      </div>

      {/* ── Navigation ── */}
      <nav className="space-y-1 flex-1">

        {/* SUPERADMIN */}
        {user?.role === "SUPERADMIN" && (
          <>
            <p className={sectionTitle}>Overview</p>
            <NavLink to="/superadmin/dashboard" className={linkClasses} onClick={() => onClose?.()}>
              <LayoutDashboard size={18} />
              Dashboard
            </NavLink>

            <p className={sectionTitle}>Attendance</p>
            <NavLink to="/superadmin/attendance-muster" className={linkClasses} onClick={() => onClose?.()}>
              <CalendarDays size={18} />
              Attendance Muster
            </NavLink>
            <NavLink to="/superadmin/attendance-modifier" className={linkClasses} onClick={() => onClose?.()}>
              <Edit size={18} />
              Attendance Modifier
            </NavLink>

            <p className={sectionTitle}>Management</p>
            <NavLink to="/superadmin/admin-management" className={linkClasses} onClick={() => onClose?.()}>
              <Users size={18} />
              Admin Management
            </NavLink>
            <NavLink to="/superadmin/excel-uploads" className={linkClasses} onClick={() => onClose?.()}>
              <Upload size={18} />
              Excel Uploads
            </NavLink>
            <NavLink to="/superadmin/report-dashboard" className={linkClasses} onClick={() => onClose?.()}>
              <BarChart3 size={18} />
              Reports
            </NavLink>

            <p className={sectionTitle}>Settings</p>
            <NavLink to="/superadmin/holiday-settings" className={linkClasses} onClick={() => onClose?.()}>
              <CalendarCheck size={18} />
              Holiday Settings
            </NavLink>
          </>
        )}

        {/* HEAD */}
        {user?.role === "HEAD" && (
          <>
            <p className={sectionTitle}>Overview</p>
            <NavLink to="/head/dashboard" className={linkClasses} onClick={() => onClose?.()}>
              <LayoutDashboard size={18} />
              Dashboard
            </NavLink>
            <NavLink to="/head/all-requests" className={linkClasses} onClick={() => onClose?.()}>
              <ClipboardCheck size={18} />
              All Requests
            </NavLink>
            <p className={sectionTitle}>Attendance</p>
            <NavLink to="/head/faculty-attendance" className={linkClasses} onClick={() => onClose?.()}>
              <CalendarDays size={18} />
              Faculty Attendance
            </NavLink>

            <p className={sectionTitle}>Approvals</p>
            <NavLink to="/head/leave-approvals" className={linkClasses} onClick={() => onClose?.()}>
              <ClipboardCheck size={18} />
              Leave Approvals
            </NavLink>
            <NavLink to="/head/od-approvals" className={linkClasses} onClick={() => onClose?.()}>
              <ClipboardCheck size={18} />
              OD Approvals
            </NavLink>
            <NavLink to="/head/permission-approvals" className={linkClasses} onClick={() => onClose?.()}>
              <ClipboardCheck size={18} />
              Permission Approvals
            </NavLink>
          </>
        )}

        {/* ADMIN */}
        {user?.role === "ADMIN" && (
          <>
            <p className={sectionTitle}>Overview</p>
            <NavLink to="/admin/dashboard" className={linkClasses} onClick={() => onClose?.()}>
              <LayoutDashboard size={18} />
              Dashboard
            </NavLink>

            <p className={sectionTitle}>User Management</p>
            <NavLink to="/admin/users" className={linkClasses} onClick={() => onClose?.()}>
              <Users size={18} />
              Faculty Profiles
            </NavLink>
            <p className={sectionTitle}>Attendance</p>
            <NavLink to="/admin/faculty-attendance" className={linkClasses} onClick={() => onClose?.()}>
              <CalendarDays size={18} />
              Faculty Attendance
            </NavLink>

            <p className={sectionTitle}>Approvals</p>
            <NavLink to="/admin/leave-approvals" className={linkClasses} onClick={() => onClose?.()}>
              <ClipboardCheck size={18} />
              Leave Approvals
            </NavLink>
            <NavLink to="/admin/od-approvals" className={linkClasses} onClick={() => onClose?.()}>
              <ClipboardCheck size={18} />
              OD Approvals
            </NavLink>
            <NavLink to="/admin/permission-approvals" className={linkClasses} onClick={() => onClose?.()}>
              <ClipboardCheck size={18} />
              Permission Approvals
            </NavLink>
          </>
        )}

        {/* FACULTY */}
        {user?.role === "FACULTY" && (
          <>
            <p className={sectionTitle}>Overview</p>
            <NavLink to="/faculty/dashboard" className={linkClasses} onClick={() => onClose?.()}>
              <LayoutDashboard size={18} />
              Dashboard
            </NavLink>

            <p className={sectionTitle}>Attendance</p>
            <NavLink to="/faculty/attendance" className={linkClasses} onClick={() => onClose?.()}>
              <CalendarDays size={18} />
              My Attendance
            </NavLink>

            <p className={sectionTitle}>Request Status</p>
            <NavLink to="/faculty/my-leaves" className={linkClasses} onClick={() => onClose?.()}>
              <ClipboardCheck size={18} />
              Pending Request
            </NavLink>

            <p className={sectionTitle}>Requests & Applications</p>
            <NavLink to="/faculty/apply-leave" className={linkClasses} onClick={() => onClose?.()}>
              <FileText size={18} />
              Apply Leave
            </NavLink>
            <NavLink to="/faculty/apply-permission" className={linkClasses} onClick={() => onClose?.()}>
              <ClipboardCheck size={18} />
              Apply Permission
            </NavLink>
            <NavLink to="/faculty/apply-od" className={linkClasses} onClick={() => onClose?.()}>
              <ClipboardCheck size={18} />
              Apply OD
            </NavLink>
          </>
        )}

        {/* FINANCE HEAD ADMIN */}
        {user?.role === "FHADMIN" && (
          <>
            <p className={sectionTitle}>Overview</p>
            <NavLink to="/headadmin/dashboard" className={linkClasses} onClick={() => onClose?.()}>
              <LayoutDashboard size={18} />
              Dashboard
            </NavLink>
          </>
        )}

        {/* FINANCE ADMIN */}
        {user?.role === "FADMIN" && (
          <>
            <p className={sectionTitle}>Overview</p>
            <NavLink to="/fadmin/dashboard" className={linkClasses} onClick={() => onClose?.()}>
              <LayoutDashboard size={18} />
              Dashboard
            </NavLink>
            <NavLink to="/fadmin/fee-structure" className={linkClasses} onClick={() => onClose?.()}>
              <FileText size={18} />
              Fee Structure
            </NavLink>
            <NavLink to="/fadmin/student-management" className={linkClasses} onClick={() => onClose?.()}>
              <Users size={18} />
              Student Management
            </NavLink>
          </>
        )}

        {/* STUDENT */}
        {user?.role === "STUDENT" && (
          <>
            <p className={sectionTitle}>Overview</p>
            <NavLink to="/student/dashboard" className={linkClasses} onClick={() => onClose?.()}>
              <LayoutDashboard size={18} />
              Dashboard
            </NavLink>
            <NavLink to="/student/profile" className={linkClasses} onClick={() => onClose?.()}>
              <Users size={18} />
              Profile
            </NavLink>
            <NavLink to="/student/fees-page" className={linkClasses} onClick={() => onClose?.()}>
              <FileText size={18} />
              Fees Page
            </NavLink>
            <NavLink to="/student/make-payment" className={linkClasses} onClick={() => onClose?.()}>
              <IndianRupee size={18} color="green" />
              Make Payment
            </NavLink>
          </>
        )}

      </nav>

      {/* ── Logout ── */}
      <div className="mt-auto pt-6">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-2.5 sm:py-2 rounded-lg text-red-500 font-bold hover:bg-red-500 hover:text-white transition"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>

      {/* ── Footer ── */}
      <div className="text-xs text-gray-400 mt-6">© 2026</div>

    </aside>
  );
};

export default Sidebar;