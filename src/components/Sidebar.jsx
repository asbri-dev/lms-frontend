import { NavLink } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import "./Sidebar.css";

const Sidebar = () => {
  const { user } = useAuth();

  return (
    <aside className="sidebar">
      {user?.role === "SUPERADMIN" && (
        <NavLink to="/superadmin/dashboard">Dashboard</NavLink>
      )}

      {user?.role === "ADMIN" && (
        <>
          <NavLink to="/admin/dashboard">Dashboard</NavLink>
          <NavLink to="/admin/users">Users</NavLink>
          <NavLink to="/admin/leave-approvals">Leave Approvals</NavLink>
          
        </>
      )}

      {user?.role === "FACULTY" && (
        <>
          <NavLink to="/faculty/dashboard">Dashboard</NavLink>
          <NavLink to="/faculty/apply-leave">Apply Leave</NavLink>
          <NavLink to="/faculty/my-leaves">My Leaves</NavLink>
        </>
      )}
    </aside>
  );
};

export default Sidebar;
