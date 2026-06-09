import { PieChart, Pie, Cell, Tooltip } from "recharts";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";

const COLORS = {
  Present: "#D7FDF0",
  Absent: "#FE8985",
  CL: "#3b82f6",
  ML: "#8b5cf6",
  Holiday: "#0ea5e9",
  OFF: "#6b7280",
  OD: "#E9F0DB",
};

const AttendanceDonutChart = ({ summary, selectedMonth, onPrev, onNext }) => {
  if (!summary) return null;

  const chartData = [
    { name: "Present", value: Number(summary.present) },
    { name: "Absent", value: Number(summary.Absent) },
    { name: "CL", value: Number(summary.CasualLeave) },
    { name: "ML", value: Number(summary.MedicalLeave) },
    { name: "Holiday", value: Number(summary.Holidays) },
    { name: "OFF", value: Number(summary.RestDays) },
    { name: "OD", value: Number(summary.onDuty) },
  ].filter((item) => item.value > 0);

  return (
    
    <div className="bg-white p-5 rounded-2xl shadow-md">

      <h3 className="text-sm font-semibold text-gray-700 mb-4">
        Attendance Summary
      </h3>
      <div className="flex justify-between items-center mb-4">

  <button
    onClick={onPrev}
    className="p-1 hover:bg-gray-100 rounded"
  >
    <ChevronLeft size={18} />
  </button>

  <h3 className="text-sm font-semibold text-gray-700">
    {format(selectedMonth, "MMM yyyy")}
  </h3>

  <button
    onClick={onNext}
    className="p-1 hover:bg-gray-100 rounded"
  >
    <ChevronRight size={18} />
  </button>

</div>

      <div className="flex justify-center">
        <PieChart width={220} height={220}>
          <Pie
            data={chartData}
            dataKey="value"
            innerRadius={60}
            outerRadius={90}
           
          >
            {chartData.map((entry, index) => (
              <Cell
                key={index}
                fill={COLORS[entry.name] || "#ccc"}
              />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </div>

      {/* CENTER INFO */}
      <p className="text-center font-semibold text-xs text-black mt-2">
        {summary.summaryFor} 
      </p>
      <p className="text-center font-bold text-xs text-black mt-2">  
      Avg Hours :{" "} {summary.averageWorkingHrs}
        </p>

      {/* LEGEND */}
      <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
        {chartData.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: COLORS[item.name] }}
            />
            {item.name} ({item.value})
          </div>
        ))}
      </div>

    </div>
  );
};

export default AttendanceDonutChart;