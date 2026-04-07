import { useEffect, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { CheckCircle, XCircle, Eye } from "lucide-react";
import AdminDonutChart from "../../components/dashboard/AdminDonutChart";


const AdminDashboard = () => {
  const { user } = useAuth();

  const [dashboardData, setDashboardData] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* ---------- FETCH ---------- */
  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `http://localhost:9090/admin/adminDashBoardDetails?rmEmpId=${user?.employeeId}`
      );
      if (!res.ok) throw new Error("Failed to load dashboard");
      const data = await res.json();
      setDashboardData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.employeeId) fetchDashboard();
  }, [user]);

  /* ---------- ACTIONS ---------- */


  

  /* ---------- LOADING ---------- */
  if (loading) {
    return (
      <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-200 animate-pulse rounded-2xl shadow"></div>
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="text-red-600 text-center font-medium">{error}</div>;
  }

  /* ---------- DATA ---------- */
  const {
    facultyCnt = 0,
    pendingLeaveCnt = 0,
    pendingPermissionCnt = 0,
    pendingOdsCnt = 0,
    pendingLeaves = [],
    pendingPermissions = [],
    pendingOds = [],
    approvedLeaveCnt = 0,
    approvedPermissionCnt = 0,
    approvedOdsCnt = 0,
    rejectedPermissionCnt = 0,
    rejectedLeaveCnt = 0,
    rejectedOdsCnt = 0,
  } = dashboardData || {};

  const allPendingRequests = [
    ...pendingLeaves.map((i) => ({ ...i, type: "Leave" })),
    ...pendingPermissions.map((i) => ({ ...i, type: "Permission" })),
    ...pendingOds.map((i) => ({ ...i, type: "OD" })),
  ];

  const allApprovedRequests = approvedLeaveCnt+approvedPermissionCnt+approvedOdsCnt;
  const allRejectedRequests = rejectedLeaveCnt+rejectedPermissionCnt+rejectedOdsCnt;
  return (
    <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen space-y-6">

      {/* HEADER */}
     <div className="bg-gradient-to-r from-[#2b3c6b] to-[#3f548f] text-white p-6 rounded-2xl shadow-md flex justify-between items-center">
             <h2 className="text-2xl font-bold">
        Welcome, Admin 
        </h2>
        <p className="text-sm mt-1">
          Pending Requests:{" "}
          <span className="font-semibold">
            {allPendingRequests.length}
          </span>
        </p>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-5">
        <StatCard title="Faculty" value={facultyCnt} />
        <StatCard title="All Pending Requests" value={allPendingRequests.length} />
        <StatCard title="All Approved Requests" value={allApprovedRequests} />
        <StatCard title="All Rejected Requests" value={allRejectedRequests} />
      </div>

      {/* CHARTS */}
      <div className="grid md:grid-cols-2 gap-6">
        <AdminDonutChart
          title="Pending Requests"
          leave={pendingLeaveCnt}
          permission={pendingPermissionCnt}
          od={pendingOdsCnt}
          type="pending"
        />

        <AdminDonutChart
          title="Approved Requests"
          leave={approvedLeaveCnt}
          permission={approvedPermissionCnt}
          od={approvedOdsCnt}
          type="approved"
        />
      </div>

      {/* FLEX CARDS (REPLACED TABLE) */}
      <div className="grid md:grid-cols-2 gap-6">

        {/* PENDING LIST */}
        <div className="bg-white rounded-3xl shadow-lg p-5">
          <h3 className="font-semibold text-gray-700 mb-4">
            Pending Requests
          </h3>

          {allPendingRequests.length === 0 ? (
            <p className="text-gray-400 text-center py-6">
              No Pending Requests
            </p>
          ) : (
            <div className="flex flex-col gap-4 max-h-[400px] overflow-y-auto pr-2">
              {allPendingRequests.map((req, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center bg-gray-50 p-4 rounded-xl hover:shadow-md transition"
                >
                  <div>
                    <p className="font-semibold text-gray-800">
                      {req.employeeId} {req.empId}
                    </p>
                    <p className="text-sm text-gray-500">
                      {req.type} • {req.noOfDays} {req.Date} days
                    </p>
                  </div>

                  <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs">
                    Pending
                  </span>

                
                </div>
              ))}
            </div>
          )}
        </div>

        {/* APPROVED SUMMARY */}
        <div className="bg-white rounded-3xl shadow-lg p-5">
          <h3 className="font-semibold text-gray-700 mb-4">
            Approved Summary
          </h3>

          <div className="flex flex-col gap-4">
            <SummaryCard label="Leaves" value={approvedLeaveCnt} color="green" />
            <SummaryCard label="Permission" value={approvedPermissionCnt} color="blue" />
            <SummaryCard label="OD" value={approvedOdsCnt} color="orange" />
          </div>
        </div>

      </div>

      {/* MODAL */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl w-[350px] shadow-xl">
            <h3 className="font-semibold mb-3 text-indigo-600">
              Request Details
            </h3>
            <p><b>Employee:</b> {selectedRequest.employeeId}</p>
            <p><b>Type:</b> {selectedRequest.type}</p>
            <p><b>Days:</b> {selectedRequest.noOfDays}</p>

            <button
              onClick={() => setSelectedRequest(null)}
              className="mt-4 w-full bg-indigo-600 text-white py-2 rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/* ---------- SMALL COMPONENTS ---------- */

const StatCard = ({ title, value }) => (
  <div className="bg-white p-4 rounded-2xl shadow text-center">
    <p className="text-gray-500 text-sm">{title}</p>
    <h3 className="text-xl font-bold text-indigo-600">{value}</h3>
  </div>
);

const SummaryCard = ({ label, value, color }) => {
  const map = {
    green: "bg-green-100 text-green-700",
    blue: "bg-blue-100 text-blue-700",
    orange: "bg-orange-100 text-orange-700",
  };

  return (
    <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl">
      <span className="text-gray-600">{label}</span>
      <span className={`px-3 py-1 rounded-full text-sm ${map[color]}`}>
        {value}
      </span>
    </div>
  );
};

export default AdminDashboard;