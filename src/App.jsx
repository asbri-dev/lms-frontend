import { Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";



import Login from "./pages/auth/Login";
import OtpVerify from "./pages/auth/OtpVerify";
import SetPassword from "./pages/auth/SetPassword";
import ForgotPassword from "./pages/auth/ForgotPassword";

import SuperAdminDashboard from "./pages/superadmin/SuperAdminDashboard";
import AttendanceMuster from "./pages/superadmin/AttendanceMuster";
import HolidaySettings from "./pages/superadmin/HolidaySettings";
import ExcelUploads from "./pages/superadmin/ExcelUploads";
import AdminManagement from "./pages/superadmin/AdminManagement";
import AttendanceModifier from "./pages/superadmin/AttendanceModifier";


import HeadDashboard from "./pages/head/HeadDashboard";
import AllRequestsPage from "./pages/head/AllRequestsPage";


import OdApprovals from "./pages/admin/OdApprovals";
import PermissionApprovals from "./pages/admin/PermissionApproval"; 
import AdminDashboard from "./pages/admin/AdminDashboard";
import LeaveApprovals from "./pages/admin/LeaveApprovals";
import { UserManagement } from "./pages/admin/UserManagement";


import FacultyDashboard from "./pages/faculty/FacultyDashboard";
import ApplyLeave from "./pages/faculty/ApplyLeave";
import MyLeaves from "./pages/faculty/MyLeaves";
import AttendanceInfo from "./pages/faculty/AttendanceInfo";
import ApplyPermission from "./pages/faculty/ApplyPermission";
import ApplyOd from "./pages/faculty/ApplyOd";



import DashboardLayout from "./layouts/DashboardLayout";
import ProtectedRoute from "./routes/ProtectedRoute";
import Unauthorized from "./pages/Unauthorized";
import OpeningPage from "./pages/OpeningPage";

function App() {
  return (
    <>
      {/* 🔥 GLOBAL TOASTER */}
     <Toaster
  position="top-center"
  reverseOrder={false}
  gutter={8}
  containerStyle={{
    top: 20,
  }}
  toastOptions={{
    duration: 3000,
    style: {
      fontSize: "14px",
      borderRadius: "8px",
      padding: "10px 14px",
    },
  }}
/>
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
        <Route path="attendance-muster" element={<AttendanceMuster />} />
        <Route path="holiday-settings" element={<HolidaySettings />} /> 
        <Route path="excel-uploads" element={<ExcelUploads />} />
        <Route path="admin-management" element={<AdminManagement />} />
        <Route path="attendance-modifier" element={<AttendanceModifier />} />
      </Route>
      
      {/* HEAD */}
      <Route
  path="/head"
  element={
    <ProtectedRoute allowedRoles={["HEAD"]}>
      <DashboardLayout />
    </ProtectedRoute>
  }
>
  {/* ✅ Custom HEAD dashboard */}
  <Route path="dashboard" element={<HeadDashboard />} />
  <Route path="all-requests" element={<AllRequestsPage />} />

  {/* ✅ Reusing ADMIN pages */}
  <Route path="leave-approvals" element={<LeaveApprovals />} />
  <Route path="od-approvals" element={<OdApprovals />} />
  <Route path="permission-approvals" element={<PermissionApprovals />} />
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
         <Route path="od-approvals" element={<OdApprovals />} />
         <Route path="permission-approvals" element={<PermissionApprovals />} />
         <Route path="users" element={<UserManagement />} />
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
  <Route path="/faculty/attendance" element={<AttendanceInfo />} />
  <Route path="/faculty/apply-permission" element={<ApplyPermission />} />
  <Route path="/faculty/apply-od" element={<ApplyOd />} />
</Route>


      <Route path="/unauthorized" element={<Unauthorized />} />
    </Routes>
    </>
  );
}


export default App;
