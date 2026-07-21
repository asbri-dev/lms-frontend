// FHAdminDashboard.jsx

import {
  IndianRupee,
  Users,
  AlertTriangle,
  CreditCard,
} from "lucide-react";

const stats = [
  {
    title: "Total Revenue",
    value: "₹12,45,000",
    icon: IndianRupee,
  },
  {
    title: "Pending Fees",
    value: "₹2,15,000",
    icon: AlertTriangle,
  },
  {
    title: "Students Paid",
    value: "1,240",
    icon: Users,
  },
  {
    title: "Transactions",
    value: "3,482",
    icon: CreditCard,
  },
];

export default function FHAdminDashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800">
          Finance Head Dashboard
        </h1>
        <p className="text-gray-500 mt-1">
          Overall finance analytics and institution revenue overview.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {stats.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className="bg-white rounded-2xl shadow-sm border p-5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{item.title}</p>
                  <h2 className="text-2xl font-bold mt-2 text-gray-800">
                    {item.value}
                  </h2>
                </div>

                <div className="p-3 rounded-xl bg-gray-100">
                  <Icon className="w-6 h-6 text-gray-700" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Analytics */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border p-6 h-80">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Revenue Analytics
          </h2>

          <div className="h-full flex items-center justify-center text-gray-400">
            Revenue Chart Here
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border p-6 h-80">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Branch Performance
          </h2>

          <div className="h-full flex items-center justify-center text-gray-400">
            Branch Analytics Here
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-5">
          Recent Transactions
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b text-sm text-gray-500">
                <th className="pb-3">Student</th>
                <th className="pb-3">Amount</th>
                <th className="pb-3">Date</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>

            <tbody>
              {[1, 2, 3, 4].map((item) => (
                <tr key={item} className="border-b last:border-none">
                  <td className="py-4">Arun Kumar</td>
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