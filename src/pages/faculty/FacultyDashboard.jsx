import { useEffect, useState } from "react";
import { useAuth } from "../../auth/useAuth";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../config/api";
import {
  CalendarDays,
  FileText,
  Clock,
 PlusCircle,
  Activity,

} from "lucide-react";
import AttendanceDonutChart from "../../components/dashboard/AttendanceDonutChart";
import { format} from "date-fns";
import casualImg from "../../assets/cl.jpeg";
import medical from "../../assets/ml.jpeg";
import pend from "../../assets/pending.jpeg";
import permission from "../../assets/permisson.jpeg";





const FacultyDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState("");
const [actionLoading, setActionLoading] = useState(null);
const [attendanceSummary, setAttendanceSummary] = useState(null);
const [selectedMonth, setSelectedMonth] = useState(new Date());
const [error, setError] = useState("");
const [todayLeaves, setTodayLeaves] = useState([]);
const [birthdays, setBirthdays] = useState([]);


  /* ================= FETCH ================= */
 const fetchDashboard = async () => {
  try {
    setLoading(true);
    setError("");
    setActionMessage("");

    const res = await fetch(
      `${API_BASE_URL}/getDashboardDetails?empId=${user.employeeId}`
    );

    if (!res.ok) {
      throw new Error(`Network Error: ${res.status}`);
    }

    const json = await res.json();
    setData(json);

  } catch (err) {
    console.error("Dashboard Fetch Error:", err.message);

    // 🔥 Handle backend OFF separately
    if (err.message === "Failed to fetch") {
      setError("Server is not running. Please try again later.");
    } else {
      setError(err.message);
    }

  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    if (user?.employeeId) fetchDashboard();
  }, [user]);



  /* ================= FETCH ATTENDANCE SUMMARY ================= */
  const handlePrevMonth = () => {
  const prev = new Date(selectedMonth);
  prev.setMonth(prev.getMonth() - 1);
  setSelectedMonth(prev);
};

const handleNextMonth = () => {
  const next = new Date(selectedMonth);
  next.setMonth(next.getMonth() + 1);
  setSelectedMonth(next);
};
  const fetchAttendanceSummary = async () => {
  try {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();

    const from = new Date(year, month, 1);
    const to = new Date(year, month + 1, 0);

    const fromDate = format(from, "dd-MMM-yyyy");
    const toDate = format(to, "dd-MMM-yyyy");

    const res = await fetch(
      `${API_BASE_URL}/attendanceSummary?empId=${user.employeeId}&fromDate=${fromDate}&toDate=${toDate}`
    );

    const data = await res.json();

    setAttendanceSummary(data);

  } catch (err) {
    console.error("Attendance summary failed", err);
  }
};
const fetchExtraData = async () => {
  try {
    // 🔹 Today Leave
    const leaveRes = await fetch(`${API_BASE_URL}/todayLeaves`);
    const leaveData = await leaveRes.json();

    // ⚠️ flatten array
    setTodayLeaves(leaveData?.flat() || []);

    // 🔹 Birthday
    const bdayRes = await fetch(`${API_BASE_URL}/isBirthday`);
    const bdayData = await bdayRes.json();

    setBirthdays(bdayData || []);

  } catch (err) {
    console.error("Extra data fetch failed", err);
  }
};
useEffect(() => {
  if (user?.employeeId) {
    fetchDashboard();
    fetchAttendanceSummary();
    fetchExtraData();
  }
}, [user?.employeeId, selectedMonth]); // 🔥 ADD selectedMonth

  /* ================= WITHDRAW ================= */
 const handleWithdraw = async (leave) => {
  const key = (leave.employeeId || "") + leave.leaveFrom;

  // 🚫 Prevent multiple clicks
  if (actionLoading === key) return;

  try {
    setActionLoading(key);
    setActionMessage("");

    // ⏱️ Timeout controller (5 sec)
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${API_BASE_URL}/withDrawnLeave`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        empId: leave.employeeId,
        typeOfLeave: leave.typeOfLeave,
        adminEmpId: user.adminId,
        noOfDays: String(leave.noOfDays),
        leaveFrom: leave.leaveFrom,
        leaveTo: leave.leaveTo,
        leaveApplied: leave.appliedOn,
        reasonForLeave: leave.reasonForLeave,
        sessionFrom: leave.sessionFrom,
        sessionTo: leave.sessionTo,
        status: "Withdrawn",
      }),
    });

    clearTimeout(timeout);

    // 🔥 Safe response reading
    let message = "";
    const contentType = response.headers.get("content-type");

    try {
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        message = data?.message || JSON.stringify(data);
      } else {
        message = await response.text();
      }
    } catch {
      message = "Invalid server response";
    }

    if (!response.ok) {
      setActionMessage(message || "Withdraw failed");
      return;
    }

    setActionMessage(message || "Leave withdrawn successfully");

    await fetchDashboard();

  } catch (err) {
    console.error("Withdraw Error:", err);

    // 🔥 Handle different errors
    if (err.name === "AbortError") {
      setActionMessage("Request timed out. Try again.");
    } else if (err.message === "Failed to fetch") {
      setActionMessage("Server is not running.");
    } else {
      setActionMessage("Something went wrong.");
    }

  } finally {
    setActionLoading(null);
  }
};
  if (loading) return <div>Loading...</div>;

if (error) {
  return (
    <div className="h-[80vh] flex flex-col justify-center items-center">
      <p className="text-red-500 text-lg font-semibold">{error}</p>
      <button
        onClick={fetchDashboard}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
      >
        Retry
      </button>
    </div>
  );
}

if (!data) {
  return <div>No data available</div>;
}

  const basic = data.basicDetails;
const allpending=Number(basic.pendingLeaves||0)+Number(basic.pendingPrs||0)+Number(basic.pendingOds||0);  
// Add these calculations before your return statement
const clApplied = data.pendingLeaveList?.filter(l => l.typeOfLeave === "cl").length ?? 0;
const mlApplied = data.pendingLeaveList?.filter(l => l.typeOfLeave === "ml").length ?? 0;

const clAvailed = data.approvedLeaveList?.filter(l => l.typeOfLeave === "cl").length ?? 0;
const mlAvailed = data.approvedLeaveList?.filter(l => l.typeOfLeave === "ml").length ?? 0;
  return (
    
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

      {/* ================= LEFT SIDE ================= */}
      <div className="lg:col-span-3 space-y-6">

        {/* HERO */}
          <div className="bg-gradient-to-r from-[#2b3c6b] to-[#3f548f] text-white p-6 rounded-2xl shadow-md flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-semibold">
              Welcome, {basic.employeeName}
            </h2>
            <p className="text-sm opacity-90 mt-1">
              Reporting To: {basic.rmName} ({basic.rmEmployeeId})
            </p>
            
          </div>
          <Activity className="opacity-20" size={60} />
        </div>

        {/* STATS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

          <StatCard
  icon={<CalendarDays size={18} />}
  title="Casual Leave (CL)"
  value={basic.casualLeaves}
  applied={clApplied}
  availed={clAvailed}
  bgImage={casualImg}
  onClick={() => navigate("/faculty/apply-leave")}
/>

<StatCard
  icon={<CalendarDays size={18} />}
  title="Medical Leave (ML)"
  value={basic.medicalLeaves}
  applied={mlApplied}
  availed={mlAvailed}
  bgImage={medical}
  onClick={() => navigate("/faculty/apply-leave")}
/>
          <StatCard
            icon={<FileText size={18} />}
            title="Permissions"
            value={basic.availablePermissions||0}
            applied={basic.pendingPrs||0}
            availed={basic.approvedPrs||0}
            color="text-purple-600"
            bgImage={permission}
            onClick={() => navigate("/faculty/apply-permission")}
          />
          <StatCard
            icon={<Clock size={18} />}
            title="On Duty (OD)"
            value={"onduty"}
            applied={basic.pendingOds||0}
            availed={basic.approvedOds||0}
            color="text-yellow-600"
            bgImage={pend}
            onClick={() => navigate("/faculty/apply-od")}
          />
        <p className="className=bg-white p-5 rounded-2xl shadow-md space-y-4 justify-center items-center text-center text-gray-700">
              Pending Requests: {allpending}
            </p>
  </div>{actionMessage && (
  <div className="text-center p-3 rounded bg-blue-100 text-blue-700">
    {actionMessage}
  </div>
)}
        {/* LEAVE SECTION */}
        <Section title="Leave Requests" icon={<FileText size={18} />}>
          {data?.pendingLeaveList?.length ? (
            data.pendingLeaveList.map((l, i) => (
              <ItemRow
                key={i}
                item={l}
                type="leave"
                onWithdraw={() => handleWithdraw(l)}
                actionLoading={actionLoading}
              />
            ))
          ) : (
            <Empty text="No leave requests" />
          )}
        </Section>

        {/* PERMISSION SECTION */}
        <Section title="Permission Requests" icon={<Clock size={18} />}>
          {data?.pendingPermissionList?.length ? (
            data.pendingPermissionList.map((p, i) => (
              <ItemRow
                key={i}
                item={p}
                type="permission"
              />
            ))
          ) : (
            <Empty text="No permission requests" />
          )}
        </Section>

        {/*OD SECTION */}
        <Section title="On Duty Requests" icon={<Clock size={18} />}>
          {data?.pendingOdsList?.length ? (
            data.pendingOdsList.map((od, i) => (
              <ItemRow
                key={i}
                item={od}
                type="od"
              />
            ))
          ) : (
            <Empty text="No OD requests" />
          )}
        </Section>

      </div>

      {/* ================= RIGHT SIDE ================= */}
    <div className="space-y-6">

  {/* 🔥 ADD THIS */}
  <AttendanceDonutChart
  summary={attendanceSummary}
  selectedMonth={selectedMonth}
  onPrev={handlePrevMonth}
  onNext={handleNextMonth}
/>
<TodayLeaveCard data={todayLeaves} />
<BirthdayCard data={birthdays} />

  {/* Existing */}
  <QuickActions navigate={navigate} />
  

</div>

    </div>
  );
};

export default FacultyDashboard;



/* ================= COMPONENTS ================= */
const StatCard = ({ icon, title, value, applied, availed, onClick, bgImage }) => {
  return (
    <div
      onClick={onClick}
      className="relative rounded-2xl shadow-md cursor-pointer overflow-hidden h-36"
    >
      {bgImage && (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${bgImage})` }}
        />
      )}
      {bgImage && <div className="absolute inset-0 bg-black/55" />}

      <div className="relative z-10 flex flex-col justify-between h-full text-white p-4">

        {/* Top: icon + title */}
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-white/20">{icon}</div>
          <h4 className="text-sm font-medium">{title}</h4>
        </div>

        {/* Balance */}
        {value !== "onduty" && (
          <p className=" text-3xl font-bold leading-none">{value}
            <span className="text-xs font-normal opacity-70 ml-1">balance</span>
          </p>
        )}

        {/* Bottom: Applied | Availed */}
        <div className="flex gap-3 border-t border-white/20 pt-2">
          <div className="flex flex-col">
            <span className="text-[10px] text-white/60 uppercase tracking-wide">Applied</span>
            <span className="text-sm font-semibold">{applied ?? "--"}</span>
          </div>
          <div className="w-px bg-white/20" />
          <div className="flex flex-col">
            <span className="text-[10px] text-white/60 uppercase tracking-wide">Availed</span>
            <span className="text-sm font-semibold">{availed ?? "--"}</span>
          </div>
        </div>

      </div>
    </div>
  );
};



const Section = ({ title, icon, children }) => (
  <div className="bg-white p-5 rounded-2xl shadow-md space-y-4">

    <div className="flex items-center gap-2 border-b pb-2">
      {icon}
      <h3 className="font-semibold text-gray-800">{title}</h3>
    </div>

    <div className="space-y-3">{children}</div>

  </div>
);



const ItemRow = ({ item, type, onWithdraw }) => {
  const isLeave = type === "leave";
  const isPermission = type === "permission";
  const isOd = type === "od";
  const leaveTypeMap = {
  cl: "Casual Leave",
  ml: "Medical Leave",
};

  return (
    <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl hover:shadow-md transition">

      {/* LEFT */}
      <div>
        <h1>{item.employeeId} {}</h1>
        <p className="text-sm font-semibold text-gray-800">
  {isLeave
    ? leaveTypeMap[item.typeOfLeave] || item.typeOfLeave
    : isPermission
    ? item.permissionType
    : item.odType}
</p>

        <p className="text-xs text-gray-500">
          {isLeave
            ? `${item.leaveFrom} → ${item.leaveTo}`
            : item.Date}
        </p>
        <p className="text-xs text-gray-500">
          {isOd
            ? `${item.onDutyTo} → ${item.onDutyFrom}`
            : ""}
        </p>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-3">

        <span className={`text-xs px-3 py-1 rounded-full font-medium
          ${
            item.status === "Approved"
              ? "bg-green-100 text-green-700"
              : item.status === "Rejected"
              ? "bg-red-100 text-red-700"
              : "bg-yellow-100 text-yellow-700"
          }
        `}>
          {item.status}
        </span>

        {item.status === "Pending" && onWithdraw && (
          <button
            onClick={onWithdraw}
            className="text-xs text-red-500 hover:underline"
          >
            Withdraw
          </button>
        )}

      </div>
    </div>
  );
};



const Empty = ({ text }) => (
  <div className="text-center text-gray-400 text-sm py-4">
    {text}
  </div>
);



/* ================= RIGHT SIDE ================= */

const QuickActions = ({ navigate }) => {
  return (
    <div className="bg-white p-5 rounded-2xl shadow-md space-y-4 sticky top-24">

      <h3 className="text-sm font-semibold text-gray-700">
        Quick Actions
      </h3>

      <div className="flex flex-col gap-3">

        <QuickItem
          text="Apply Leave"
          onClick={() => navigate("/faculty/apply-leave")}
        />

        <QuickItem
          text="Apply Permission"
          onClick={() => navigate("/faculty/apply-permission")}
        />

        <QuickItem
          text="Apply OD"
          onClick={() =>navigate("/faculty/apply-od")}
        />

      </div>

    </div>
  );
};



const QuickItem = ({ text, onClick }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-2 px-4 py-3 rounded-xl 
               bg-gray-50 hover:bg-[#2b3c6b] hover:text-white 
               transition duration-200 text-sm font-medium"
  >
    <PlusCircle size={16} />
    {text}
  </button>
);


const TodayLeaveCard = ({ data }) => {
  return (
    <div className="bg-white p-5 rounded-2xl shadow-md space-y-3">

      <h3 className="text-sm font-semibold text-gray-700">
        Today Leave
      </h3>

      {data.length === 0 ? (
        <p className="text-xs text-gray-400">No one on leave</p>
      ) : (
        data.map((emp, i) => (
          <div key={i} className="flex justify-between text-sm">

            <span className="font-medium text-gray-800">
              {emp.empName} - {emp.empId}
            </span>

            <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded">
              {emp.leaveType.toUpperCase()}
            </span>

          </div>
        ))
      )}

    </div>
  );
};
const BirthdayCard = ({ data }) => {
  return (
    <div className="bg-white p-5 rounded-2xl shadow-md space-y-3">

      <h3 className="text-sm font-semibold text-gray-700">
        🎉 Birthdays Today
      </h3>

      {data.length === 0 ? (
        <p className="text-xs text-gray-400">No birthdays today</p>
      ) : (
        data.map((emp, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">

            <span className="text-pink-500">🎂</span>

            <span className="font-medium text-gray-800">
              {emp.empName} - {emp.empId}
            </span>
            <span className="text-xs px-2 py-1 bg-yellow-100 text-blue-700 rounded">
              {emp.location}
            </span>

          </div>
        ))
      )}

    </div>
  );
};