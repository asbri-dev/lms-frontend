import { Routes, Route } from "react-router-dom";

import Login from "./pages/auth/Login";
import OtpVerify from "./pages/auth/OtpVerify";
import SetPassword from "./pages/auth/SetPassword";
import ForgotPassword from "./pages/auth/ForgotPassword";

import SuperAdminDashboard from "./pages/superadmin/SuperAdminDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import LeaveApprovals from "./pages/admin/LeaveApprovals";

import FacultyDashboard from "./pages/faculty/FacultyDashboard";
import ApplyLeave from "./pages/faculty/ApplyLeave";
import MyLeaves from "./pages/faculty/MyLeaves";


import DashboardLayout from "./layouts/DashboardLayout";
import ProtectedRoute from "./routes/ProtectedRoute";
import Unauthorized from "./pages/Unauthorized";
import OpeningPage from "./pages/OpeningPage";

function App() {
  return (
    <Routes>
      {/* PUBLIC */}
      <Route path="/" element={<OpeningPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/otp" element={<OtpVerify />} />
      <Route path="/set-password" element={<SetPassword />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* SUPERADMIN */}
      <Route
        path="/superadmin"
        element={
          <ProtectedRoute allowedRoles={["SUPERADMIN"]}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<SuperAdminDashboard />} />
      </Route>

      {/* ADMIN */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<AdminDashboard />} />
         <Route path="leave-approvals" element={<LeaveApprovals />} />
      </Route>

      {/* FACULTY */}
     <Route
  path="/faculty"
  element={
    <ProtectedRoute allowedRoles={["FACULTY"]}>
      <DashboardLayout />
    </ProtectedRoute>
  }
>
  <Route path="dashboard" element={<FacultyDashboard />} />
  <Route path="apply-leave" element={<ApplyLeave />} />
  <Route path="my-leaves" element={<MyLeaves />} />
</Route>


      <Route path="/unauthorized" element={<Unauthorized />} />
    </Routes>
  );
}

export default App;
