import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../auth/useAuth";
import { Filter } from "lucide-react";
import { API_BASE_URL } from "../../config/api";



const MyLeaves = () => {
  const { user } = useAuth();

  const [data, setData] = useState(null);
  const [activeStatus, setActiveStatus] = useState("PENDING");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(null);
  const [message, setMessage] = useState("");
const [messageType, setMessageType] = useState(""); // success | error

  /* ================= FETCH DASHBOARD ================= */
  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(
        `${API_BASE_URL}/getDashboardDetails?empId=${user.employeeId}`
      );

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json || "Failed to load data");
      }

      setData(json);
    } catch (err) {
      setError(err.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.employeeId) {
      fetchDashboard();
    }
  }, [user?.employeeId]);

  /* ================= NORMALIZE ================= */
  const normalize = (list, type) =>
    list.map((item) => {
      if (type === "LEAVE") {
        return {
          type,
          status: item.status.toUpperCase(),
          fromDate: item.leaveFrom,
          toDate: item.leaveTo,
          reason: item.reasonForLeave || "-",
          meta: item
        };
      }

      if (type === "PERMISSION") {
        return {
          type,
          status: item.status.toUpperCase(),
          fromDate: item.Date,
          toDate: item.Date,
          reason: item.reasonForPermission || "-",
          meta: item
        };
      }

      if (type === "OD") {
        return {
          type,
          status: item.status.toUpperCase(),
          fromDate: item.onDutyFrom,
          toDate: item.onDutyTo,
          reason: item.reason || "-",
          meta: item
        };
      }

      return item;
    });

  /* ================= COMBINE ALL ================= */
  const allRequests = useMemo(() => {
    if (!data) return [];

    return [
      ...normalize(data.pendingLeaveList || [], "LEAVE"),
      ...normalize(data.approvedLeaveList || [], "LEAVE"),
      ...normalize(data.rejectedLeaveList || [], "LEAVE"),
      ...normalize(data.withdrawnLeaveList || [], "LEAVE"),

      ...normalize(data.pendingPermissionList || [], "PERMISSION"),
      ...normalize(data.approvedPermissionList || [], "PERMISSION"),
      ...normalize(data.rejectedPermissionList || [], "PERMISSION"),
      ...normalize(data.withdrawnPermissionList || [], "PERMISSION"),

      ...normalize(data.pendingOdsList || [], "OD"),
      ...normalize(data.approvedOdsList || [], "OD"),
      ...normalize(data.rejectedOdsList || [], "OD"),
      ...normalize(data.withdrawnOdsList || [], "OD"),
    ];
  }, [data]);

  /* ================= FILTER ================= */
  const filteredList = useMemo(() => {
    return allRequests.filter((item) => {
      const matchStatus = item.status === activeStatus;
      const matchType =
        typeFilter === "ALL" || item.type === typeFilter;
      return matchStatus && matchType;
    });
  }, [allRequests, activeStatus, typeFilter]);

  /* ================= COUNTS ================= */
  const basic = data?.basicDetails || {};

  const counts = {
    PENDING:
      Number(basic.pendingLeaves || 0) +
      Number(basic.pendingPrs || 0) +
      Number(basic.pendingOds || 0),

    APPROVED:
      Number(basic.approvedLeaves || 0) +
      Number(basic.approvedPrs || 0) +
      Number(basic.approvedOds || 0),

    REJECTED:
      Number(basic.rejectedLeaves || 0) +
      Number(basic.rejectedPrs || 0) +
      Number(basic.rejectedOds || 0),

    WITHDRAWN:
      Number(basic.withdrawnLeaves || 0) +
      Number(basic.withdrawnPrs || 0) +
      Number(basic.withdrawnOds || 0),
  };

  /* ================= WITHDRAW ================= */
  const handleWithdraw = async (item) => {
    if (actionLoading) return;

    if (!window.confirm("Withdraw this request?")) return;

    try {
      setActionLoading(item);

      let url = "";
      let payload = {};

      if (item.type === "LEAVE") {
        url = `${API_BASE_URL}/withDrawnLeave`;
        payload = {
          empId: item.meta.employeeId,
          typeOfLeave: item.meta.typeOfLeave,
          adminEmpId: item.meta.adminEmpId,
          noOfDays: item.meta.noOfDays,
          leaveFrom: item.meta.leaveFrom,
          leaveTo: item.meta.leaveTo,
          leaveApplied: item.meta.leaveppliedOn,
          reasonForLeave: item.meta.reasonForLeave,
          sessionFrom: item.meta.sessionFrom,
          sessionTo: item.meta.sessionTo,
          status: "Withdrawn"
        };
      }

      if (item.type === "PERMISSION") {
        url = `${API_BASE_URL}/withdrawnPermission`;
        payload = {
          empId: user.employeeId,
          permissionType: item.meta.permissionType,
          permissionDate: item.meta.Date,
          reasonForPermission: item.meta.reasonForPermission,
          permissionStatus: "Pending"
          };
      }

      if (item.type === "OD") {
        url = `${API_BASE_URL}/withdrawnOd`;
        payload = {
          adminEmpId: item.meta.adminEmpId,
          empId: item.meta.empId,
          onDutyFrom: item.meta.onDutyFrom,
          onDutyTo: item.meta.onDutyTo,
          sessionFrom: item.meta.sessionFrom,
          sessionTo: item.meta.sessionTo,
          appliedOn: item.meta.appliedOn,
          reaseon: item.meta.reason,
          status: "Withdrawn"
          
        };
      }

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json || "Withdraw failed");
      }
      
      fetchDashboard();
      setMessage("Request withdrawn successfully");
      setMessageType("success");
      setTimeout(() => {
        setMessage(null);
        setMessageType(null);
      }, 2000);

    } catch (err) {
  setMessage(err.message || "Something went wrong");
  setMessageType("error");

  // ✅ Refresh after 2 seconds
  setTimeout(() => {
    fetchDashboard();
    setMessage(null);
    setMessageType(null);
  }, 2000);

} finally {
      setActionLoading(null);
      // Clear message after action
    
    }
  };

  /* ================= UI ================= */

  if (loading) {
    return <div className="text-center py-10">Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center py-10">{error}</div>;
  }

  return (
    <div className="space-y-6">

      {/* ===== HEADER CARDS ===== */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {["PENDING", "APPROVED", "REJECTED", "WITHDRAWN"].map((status) => (
          <div
            key={status}
            onClick={() => setActiveStatus(status)}
            className={`p-4 rounded-xl cursor-pointer bg-white shadow-md ${
              activeStatus === status ? "ring-2 ring-indigo-500" : ""
            }`}
          >
            <h4 className="text-sm text-gray-500">{status}</h4>
            <p className="text-xl font-bold">{counts[status]}</p>
          </div>
        ))}
      </div>

      {/* ===== FILTER ===== */}
      <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl shadow-sm">

  {/* Icon */}
  <div className="flex items-center gap-2 text-gray-600 text-sm font-medium">
    <Filter size={16} />
    <span>Filter</span>
  </div>

  {/* Dropdown */}
  <select
    value={typeFilter}
    onChange={(e) => setTypeFilter(e.target.value)}
    className="px-3 py-2 rounded-lg bg-gray-50 shadow-sm 
               focus:outline-none focus:ring-2 focus:ring-[#3f548f] 
               text-sm cursor-pointer"
  >
    <option value="ALL">All Requests</option>
    <option value="LEAVE">Leave</option>
    <option value="PERMISSION">Permission</option>
    <option value="OD">On Duty</option>
  </select>

</div>


      {message && (
  <div
    className={`p-3 rounded-md text-sm font-medium ${
      messageType === "success"
        ? "bg-green-100 text-green-700"
        : "bg-red-100 text-red-700"
    }`}
  >
    {message}
  </div>
)}

      {/* ===== LIST ===== */}
      <div className="space-y-4">
        {filteredList.length === 0 && (
          <div className="text-gray-500 text-center">
            No records found
          </div>
        )}

        {filteredList.map((item, i) => (
          <div
            key={i}
            className="bg-white p-5 rounded-xl shadow-md flex justify-between"
          >
            <div>
              <h4 className="font-semibold">{item.type}</h4>
              <p className="text-sm text-gray-600">
                {item.fromDate} → {item.toDate}
              </p>
              <p className="text-sm text-gray-500">
                Reason: {item.reason}
              </p>
              
            </div>

            <div className="text-right gap-2 flex flex-col items-end">
              <span className="text-xs font-semibold px-2 py-1 gap-3 mt-2 rounded bg-gray-200">
                {item.status}
              </span>

              {item.status === "PENDING" && (
               <button
  onClick={() => handleWithdraw(item)}
  disabled={loading}
  className="
    mt-2 inline-flex items-center gap-3
    px-3 py-1.5
    bg-red-50 text-red-600
    border border-red-200
    rounded-lg
    text-sm font-medium
    cursor-pointer
    hover:bg-red-600 hover:text-white hover:border-red-600
    transition-all duration-200
    disabled:opacity-50
    disabled:cursor-not-allowed
    disabled:hover:bg-red-50
    disabled:hover:text-red-600
  "
>
  Withdraw
</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyLeaves;