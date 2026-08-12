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


 import ExcelUploadLeave from "./exceluploadF/ExcelUploadLeave";
 import ExcelUploadFee from "./exceluploadF/ExcelUploadFee";

const MODULES = [
  {
    key: "attendance",
    label: "Leave Management Excel Uploads",
    icon: <CalendarCheck size={16} />,
    component: <ExcelUploadLeave />,
  },
  {
    key: "fee",
    label: "Fee Management Excel Uploads",
    icon: <ClipboardList size={16} />,
    component: <ExcelUploadFee />,
  },





 
];

export default function ExcelUploads() {
  const [active, setActive] = useState("attendance");

  const current = MODULES.find((m) => m.key === active);

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
     <div className="relative bg-white border-shadow px-6 py-4 flex items-center justify-between overflow-hidden">

  <div>
    <h1 className="text-lg font-semibold text-gray-800">
      Excel Uploads
    </h1>

    <p className="text-xs text-gray-500 mt-1">
      Upload and manage Excel files
    </p>
  </div>

  <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
    Excel Uploads
  </span>

  {/* Grey line + moving blue light */}
  <div className="absolute bottom-0 left-0 w-full h-[3px] bg-gray-200 overflow-hidden">
    <div
      className="absolute top-0 left-[-30%] w-[30%] h-full
                 bg-gradient-to-r from-transparent via-green-800 to-transparent
                 blur-[3px]"
      style={{
        animation: "excelLineFlow 3s linear infinite",
      }}
    />
  </div>

  <style>{`
    @keyframes excelLineFlow {
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
                    ? "border-green-600 text-green-600"
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