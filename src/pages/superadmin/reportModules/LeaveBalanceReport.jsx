import { useState } from "react";
import { Download } from "lucide-react";
import { toast } from "react-hot-toast";
import { API_BASE_URL } from "../../../config/api"; // change if needed

export default function LeaveBalanceReport() {
  const token = localStorage.getItem("token");

  const currentYear = new Date().getFullYear();

  const [year, setYear] = useState(currentYear);
  const [location, setLocation] = useState("Chittoor");
  const [loading, setLoading] = useState(false);

  const locations = [
    "Chittoor",
    "Palakkad"
   
  ];

  const years = [];

  for (let y = currentYear + 1; y >= 2023; y--) {
    years.push(y);
  }

  const downloadLeaveReport = async () => {
    try {
      setLoading(true);

      const fromDate = `01-Jan-${year}`;
      const toDate = `31-Dec-${year}`;

      const response = await fetch(
        `${API_BASE_URL}/downloadLeaveReportExcel?collegeLocation=${location}&fromDate=${fromDate}&toDate=${toDate}&`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Download failed");
      }

      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `Leave_Report_${location}_${year}.xlsx`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);

      toast.success("Leave Report downloaded successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to download Leave Report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow  p-10">

      <h2 className="text-xl font-semibold mb-6">
        Leave Report
      </h2>

      <div className="grid md:grid-cols-3 gap-5">

        <div>
          <label className="block text-sm font-medium mb-2">
            Select Year
          </label>

          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="w-full shadow rounded-lg p-2"
          >
            {years.map((y) => (
              <option key={y}>{y}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            College Location
          </label>

          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full shadow rounded-lg p-2"
          >
            {locations.map((loc) => (
              <option key={loc}>{loc}</option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <button
            onClick={downloadLeaveReport}
            disabled={loading}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg"
          >
            <Download size={18} />

            {loading ? "Downloading..." : "Download Report"}
          </button>
        </div>

      </div>

    </div>
  );
}