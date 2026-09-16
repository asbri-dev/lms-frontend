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


 import LeaveBalanceReport from "./reportModules/LeaveBalanceReport";
 import HeadAdminFeeDashboard from "./fee module/HeadAdminDashboard";


const MODULES = [
  {
    key: "dashboard",
    label: "Dashboard",
    icon: <WalletCards size={16} />,
    component: <HeadAdminFeeDashboard />,
  },

 
];

export default function FeeDashboard() {
  const [active, setActive] = useState("dashboard");

  const current = MODULES.find((m) => m.key === active);

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
<div className="relative bg-white border-b border-gray-200 border-shadow px-6 py-4 flex items-center justify-between overflow-hidden">

  <div>
    <h1 className="text-lg font-semibold text-gray-800">
      Fee Dashboard
    </h1>

    <p className="text-xs text-gray-500 mt-1">
      Attendance and Leave Analytics
    </p>
  </div>

  <span className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-medium">
    Reports
  </span>

  {/* Moving blue light */}
  <div className="absolute bottom-0 left-0 w-full h-[2px] overflow-hidden">
    <div
      className="absolute top-0 left-[-30%] w-[30%] h-full
                 bg-gradient-to-r from-transparent via-indigo-500 to-transparent
                 blur-[2px]"
      style={{
        animation: "reportsLineFlow 3s linear infinite",
      }}
    />
  </div>

  <style>{`
    @keyframes reportsLineFlow {
      0% {
        left: -30%;
      }
      100% {
        left: 100%;
      }
    }
  `}</style>

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