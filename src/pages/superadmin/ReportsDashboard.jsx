import { useState } from "react";

import {
  ClipboardList,
  CalendarCheck,
  WalletCards,
  Building2,
  CalendarDays,
  UserRound,
  Clock3,
  LogOut,
  ShieldCheck,
  PieChart,
  Trophy,
} from "lucide-react";

// import AttendanceReport from "./reportModules";
// import LeaveReport from "./modules/LeaveReport";
// import LeaveBalanceReport from "./modules/LeaveBalanceReport";
// import DepartmentReport from "./modules/DepartmentReport";
// import MonthlyReport from "./modules/MonthlyReport";
// import EmployeeReport from "./modules/EmployeeReport";
// import LateInReport from "./modules/LateInReport";
// import EarlyOutReport from "./modules/EarlyOutReport";
// import OverrideReport from "./modules/OverrideReport";
// import LeaveStatistics from "./modules/LeaveStatistics";
// import TopLeaveTakers from "./modules/TopLeaveTakers";

const MODULES = [
  {
    key: "attendance",
    label: "Attendance",
    icon: <CalendarCheck size={16} />,
    //component: <AttendanceReport />,
  },
  {
    key: "leave",
    label: "Leave Report",
    icon: <ClipboardList size={16} />,
    //component: <LeaveReport />,
  },
  {
    key: "balance",
    label: "Leave Balance",
    icon: <WalletCards size={16} />,
    //component: <LeaveBalanceReport />,
  },
  {
    key: "department",
    label: "Department",
    icon: <Building2 size={16} />,
   // component: <DepartmentReport />,
  },
  {
    key: "monthly",
    label: "Monthly",
    icon: <CalendarDays size={16} />,
    //component: <MonthlyReport />,
  },
  {
    key: "employee",
    label: "Employee",
    icon: <UserRound size={16} />,
   // component: <EmployeeReport />,
  },
  {
    key: "latein",
    label: "Late In",
    icon: <Clock3 size={16} />,
   // component: <LateInReport />,
  },
  {
    key: "earlyout",
    label: "Early Out",
    icon: <LogOut size={16} />,
  //  component: <EarlyOutReport />,
  },
  {
    key: "override",
    label: "Override Logs",
    icon: <ShieldCheck size={16} />,
  //  component: <OverrideReport />,
  },
  {
    key: "statistics",
    label: "Leave Statistics",
    icon: <PieChart size={16} />,
   // component: <LeaveStatistics />,
  },
 
];

export default function ReportsDashboard() {
  const [active, setActive] = useState("attendance");

  const current = MODULES.find((m) => m.key === active);

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">

        <div>
          <h1 className="text-lg font-semibold text-gray-800">
            Reports Dashboard
          </h1>

          <p className="text-xs text-gray-500 mt-1">
            Attendance and Leave Analytics
          </p>
        </div>

        <span className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-medium">
          Reports
        </span>

      </div>

      {/* Tabs */}

      <div className="bg-white border-b border-gray-200 px-6">

        <div className="flex gap-1 overflow-x-auto scrollbar-hide">

          {MODULES.map((m) => (

            <button
              key={m.key}
              onClick={() => setActive(m.key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap
                ${
                  active === m.key
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
            >
              {m.icon}
              {m.label}
            </button>

          ))}

        </div>

      </div>

      {/* Active Module */}

      <div className="p-6">
        {current?.component}
      </div>

    </div>
  );
}