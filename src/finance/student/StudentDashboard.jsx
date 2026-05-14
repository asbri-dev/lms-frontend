// StudentDashboard.jsx

import {
  IndianRupee,
  Wallet,
  Bell,
  FileText,
} from "lucide-react";
import { useAuth } from "../../auth/useAuth";

const stats = [
  {
    title: "Total Fees",
    value: "₹85,000",
    icon: IndianRupee,
  },
  {
    title: "Paid Amount",
    value: "₹60,000",
    icon: Wallet,
  },
  {
    title: "Pending Amount",
    value: "₹25,000",
    icon: FileText,
  },
  {
    title: "Notifications",
    value: "4",
    icon: Bell,
  },
];


export default function StudentDashboard() {
  const { user } = useAuth();
  return (
    <div className="space-y-6">
      {/* Welcome */}

      <div className="bg-gradient-to-r from-black to-gray-800 rounded-3xl p-8 text-white">
        <h1 className="text-3xl font-bold">
          Welcome Back {user.admissionNumber} 👋 
        </h1>

        <p className="mt-2 text-gray-300">
          Here is your latest fee and payment summary.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {stats.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className="bg-white rounded-2xl border shadow-sm p-5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">
                    {item.title}
                  </p>

                  <h2 className="text-2xl font-bold text-gray-800 mt-2">
                    {item.value}
                  </h2>
                </div>

                <div className="bg-gray-100 p-3 rounded-xl">
                  <Icon className="w-6 h-6 text-gray-700" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Payment Progress */}
      <div className="bg-white rounded-2xl border shadow-sm p-6 h-80">
        <h2 className="text-lg font-semibold text-gray-800 mb-5">
          Payment Progress
        </h2>

        <div className="h-full flex items-center justify-center text-gray-400">
          Donut Chart Here
        </div>
      </div>

      {/* Payment History */}
      <div className="bg-white rounded-2xl border shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-5">
          Payment History
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b text-sm text-gray-500">
                <th className="pb-3">Receipt</th>
                <th className="pb-3">Amount</th>
                <th className="pb-3">Date</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>

            <tbody>
              {[1, 2, 3].map((item) => (
                <tr key={item} className="border-b last:border-none">
                  <td className="py-4">RCPT-2026-00{item}</td>
                  <td className="py-4">₹15,000</td>
                  <td className="py-4">06 May 2026</td>
                  <td className="py-4">
                    <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm">
                      Paid
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}