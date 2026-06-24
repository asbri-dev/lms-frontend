import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const AdminDonutChart = ({
  title,
  leave = 0,
  permission = 0,
  od = 0,
  type,
}) => {
  const total = leave + permission + od;

  const data =
    total === 0
      ? [{ name: "No Data", value: 1 }]
      : [
          { name: "Leaves", value: leave },
          { name: "Permission", value: permission },
          { name: "OD", value: od },
        ];

  const colors =
    type === "approved"
      ? ["#22c55e", "#3b82f6", "#f97316"]
      : ["#22c55e", "#3b82f6", "#f97316"];

  const getPercent = (value) => {
    return total === 0 ? 0 : ((value / total) * 100).toFixed(0);
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100">

      {/* TITLE */}
      <h3 className="text-sm font-semibold text-gray-600 mb-4 text-left">
        {title}
      </h3>

      {/* CHART */}
      <div className="relative flex justify-center items-center">
        <ResponsiveContainer width={240} height={240}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              innerRadius={70}
              outerRadius={95}
           
            
              animationDuration={9000}
            >
              {data.map((entry, i) => (
                <Cell
                  key={i}
                  fill={
                    entry.name === "No Data"
                      ? "#e5e7eb"
                      : colors[i]
                  }
                />
              ))}
            </Pie>

            {/* TOOLTIP */}
            <Tooltip
              contentStyle={{
                borderRadius: "10px",
                border: "none",
                boxShadow: "0 4px 14px rgba(0,0,0,0.1)",
              }}
              formatter={(value) =>
                total === 0
                  ? "No Data"
                  : `${value} (${getPercent(value)}%)`
              }
            />
          </PieChart>
        </ResponsiveContainer>

        {/* CENTER TEXT */}
        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-gray-800">
            {total === 0 ? "0" : total}
          </span>
          <span className="text-xs text-gray-400 tracking-wide">
            Total
          </span>
        </div>
      </div>

      {/* LEGEND */}
      {total !== 0 && (
        <div className="flex justify-center gap-6 mt-6 text-sm flex-wrap">
          {data.map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-lg"
            >
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: colors[i] }}
              ></span>

              <span className="text-gray-600">
                {item.name}
              </span>

              <span className="font-semibold text-gray-800">
                {item.value}
              </span>

              <span className="text-xs text-gray-400">
                ({getPercent(item.value)}%)
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminDonutChart;