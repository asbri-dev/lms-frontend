// FAdminDashboard.jsx

import {
  IndianRupee,
  Users,
  Receipt,
  CircleDollarSign,
} from "lucide-react";

const stats = [
  {
    title: "Today's Collection",
    value: "₹85,000",
    icon: IndianRupee,
  },
  {
    title: "Pending Students",
    value: "142",
    icon: Users,
  },
  {
    title: "Receipts Generated",
    value: "85",
    icon: Receipt,
  },
  {
    title: "Transactions",
    value: "240",
    icon: CircleDollarSign,
  },
];

export default function FAdminDashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800">
          Finance Admin Dashboard
        </h1>

        <p className="text-gray-500 mt-1">
          Manage student payments and daily collections.
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
                  <p className="text-sm text-gray-500">{item.title}</p>

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

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl border shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-5">
          Quick Actions
        </h2>

        <div className="flex flex-wrap gap-4">
          <button className="px-5 py-3 rounded-xl bg-black text-white">
            Add Payment
          </button>

          <button className="px-5 py-3 rounded-xl border">
            Generate Receipt
          </button>

          <button className="px-5 py-3 rounded-xl border">
            Search Student
          </button>
        </div>
      </div>

      {/* Pending Students */}
      <div className="bg-white rounded-2xl border shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-5">
          Pending Students
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b text-sm text-gray-500">
                <th className="pb-3">Student</th>
                <th className="pb-3">Department</th>
                <th className="pb-3">Pending Amount</th>
                <th className="pb-3">Due Date</th>
              </tr>
            </thead>

            <tbody>
              {[1, 2, 3].map((item) => (
                <tr key={item} className="border-b last:border-none">
                  <td className="py-4">Vignesh</td>
                  <td className="py-4">CSE</td>
                  <td className="py-4">₹12,000</td>
                  <td className="py-4">15 May 2026</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}