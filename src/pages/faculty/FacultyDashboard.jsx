import { useEffect, useState } from "react";
import { useAuth } from "../../auth/AuthContext";

const FacultyDashboard = () => {
  const { user } = useAuth();

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.employeeId) return;

    let isMounted = true;

    const fetchDashboardDetails = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `http://localhost:9090/getDashboardDetails?empId=${user.employeeId}`
        );

        let data = null;
        try {
          data = await response.json();
        } catch {
          data = null;
        }

        if (!isMounted) return;

        if (response.status >= 500) {
          setError("Server error. Please try again later.");
          return;
        }

        if (!response.ok) {
          setError(data?.message || "Failed to load dashboard.");
          return;
        }

        setDashboardData(data);

      } catch {
        if (isMounted) {
          setError("Network error. Please check connection.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchDashboardDetails();

    return () => {
      isMounted = false;
    };
  }, [user?.employeeId]);

  /* ------------------ LOADING ------------------ */
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 text-lg">
        Loading dashboard...
      </div>
    );
  }

  /* ------------------ ERROR ------------------ */
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg">
        {error}
      </div>
    );
  }

  /* ------------------ UI ------------------ */
  return (
    <div className="space-y-8">

      {/* Header Section */}
      <div
        className="text-white p-6 rounded-xl shadow-md"
        style={{
          background: "linear-gradient(to right, #2b3c6b, #3f548f)",
        }}
      >
        <h2 className="text-2xl font-semibold">
          Welcome, {user?.name}
        </h2>

        <p className="text-sm mt-1 opacity-90">
          Employee ID: {user?.employeeId}
        </p>

        <p className="text-sm mt-2">
          Reporting To:{" "}
          <span className="font-medium">
            {dashboardData?.rmName}
          </span>{" "}
          ({dashboardData?.rmEmployeeId})
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

        <StatCard
          title="Casual Leave"
          value={dashboardData?.casualLeaves || 0}
          color="text-indigo-700"
        />

        <StatCard
          title="Medical Leave"
          value={dashboardData?.medicalLeaves || 0}
          color="text-indigo-600"
        />

        <StatCard
          title="Permission Requests"
          value={dashboardData?.permissionRequests || 0}
          color="text-indigo-700"
        />

        <StatCard
          title="On Duty Requests"
          value={dashboardData?.OnDutyRequests || 0}
          color="text-indigo-600"
        />

      </div>
    </div>
  );
};

/* ------------------ Reusable Card ------------------ */

const StatCard = ({ title, value, color }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition duration-200">
      <h4 className="text-sm text-gray-500 mb-2">{title}</h4>

      <div className={`text-3xl font-bold ${color}`}>
        {value}
      </div>
    </div>
  );
};

export default FacultyDashboard;