import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { Outlet } from "react-router-dom";

const DashboardLayout = () => {
 return (
  <div className="flex min-h-screen bg-gray-100 overflow-hidden">

    {/* Sidebar */}
    <div className="w-64 fixed left-0 top-0 h-full z-40">
      <Sidebar />
    </div>

    {/* Main Area */}
    <div className="flex flex-col flex-1 ml-64 min-w-0">

      {/* Header */}
      <div className="sticky top-0 z-30 bg-white">
        <Header />
      </div>

      {/* Page Content */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden p-6">
        <Outlet />
      </main>

    </div>
  </div>
);}

export default DashboardLayout;