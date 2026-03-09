import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../auth/AuthContext";

const PAGE_SIZE = 10;

const SuperAdminDashboard = () => {
  const { user } = useAuth();

  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState(null);

  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("ALL");
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* ================= FETCH DASHBOARD ================= */
  useEffect(() => {
    if (!user?.employeeId) return;

    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `http://localhost:9090/getFacultyAndAdmin?rmEmpId=${user.employeeId}`
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "Failed to load dashboard");
        }

        setData(result);
      } catch (err) {
        setError(err.message || "Network error");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [user?.employeeId]);

  /* ================= CURRENT LIST ================= */
  const currentList = useMemo(() => {
    if (!data) return [];

    if (activeTab === "faculty") return data.FacultyDetails || [];
    if (activeTab === "admin") return data.AdminDetails || [];

    return [];
  }, [data, activeTab]);

  /* ================= DEPARTMENT OPTIONS ================= */
  const departments = useMemo(() => {
    if (activeTab !== "faculty") return ["ALL"];

    const unique = new Set(
      (data?.FacultyDetails || []).map((f) => f.facultyDept)
    );

    return ["ALL", ...unique];
  }, [data, activeTab]);

  /* ================= FILTER ================= */
  const filteredData = useMemo(() => {
    let list = [...currentList];

    if (activeTab === "faculty" && department !== "ALL") {
      list = list.filter((f) => f.facultyDept === department);
    }

    if (search) {
      const s = search.toLowerCase();

      list = list.filter((item) => {
        const name = `${item.firstName} ${item.lastName}`.toLowerCase();

        return (
          name.includes(s) ||
          item.empId?.toLowerCase().includes(s)
        );
      });
    }

    return list;
  }, [currentList, department, search, activeTab]);

  /* ================= PAGINATION ================= */
  const totalPages = Math.ceil(filteredData.length / PAGE_SIZE);

  const paginatedData = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredData.slice(start, start + PAGE_SIZE);
  }, [filteredData, page]);

  /* ================= LOADING ================= */
  if (loading) {
    return <div className="text-center py-10">Loading dashboard...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-100 text-red-600 p-4 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {/* ================= STAT CARDS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

        <div
          onClick={() => {
            setActiveTab("faculty");
            setPage(1);
          }}
          className="bg-white p-6 rounded-xl shadow-md cursor-pointer hover:shadow-lg"
        >
          <h4 className="text-gray-500">Faculty</h4>
          <div className="text-3xl font-bold text-blue-600">
            {data.FacultyCount}
          </div>
        </div>

        <div
          onClick={() => {
            setActiveTab("admin");
            setPage(1);
          }}
          className="bg-white p-6 rounded-xl shadow-md cursor-pointer hover:shadow-lg"
        >
          <h4 className="text-gray-500">Admins</h4>
          <div className="text-3xl font-bold text-purple-600">
            {data.AdminCount}
          </div>
        </div>

      </div>

      {/* ================= SEARCH + FILTER ================= */}
      {activeTab && (
        <div className="flex flex-wrap gap-4">

          <input
            type="text"
            placeholder="Search name or employee ID"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="border px-3 py-2 rounded-md"
          />

          {activeTab === "faculty" && (
            <select
              value={department}
              onChange={(e) => {
                setDepartment(e.target.value);
                setPage(1);
              }}
              className="border px-3 py-2 rounded-md"
            >
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          )}

        </div>
      )}

      {/* ================= TABLE ================= */}
      {activeTab && (
        <div className="bg-white rounded-xl shadow-md overflow-x-auto">

          <table className="min-w-full">

            <thead className="bg-gray-100">
              <tr>
                <th className="text-left p-3">Emp ID</th>
                <th className="text-left p-3">Name</th>
                <th className="text-left p-3">Department</th>
                <th className="text-left p-3">Designation</th>
                <th className="text-left p-3">Mobile</th>
              </tr>
            </thead>

            <tbody>
              {paginatedData.map((emp) => (
                <tr key={emp.id} className="border-t">

                  <td className="p-3">{emp.empId}</td>

                  <td className="p-3">
                    {emp.firstName} {emp.lastName}
                  </td>

                  <td className="p-3">
                    {activeTab === "faculty"
                      ? emp.facultyDept
                      : emp.adminDept}
                  </td>

                  <td className="p-3">{emp.designation}</td>

                  <td className="p-3">{emp.mobileNumber}</td>

                </tr>
              ))}
            </tbody>

          </table>

        </div>
      )}

      {/* ================= PAGINATION ================= */}
      {activeTab && totalPages > 1 && (
        <div className="flex items-center gap-4">

          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
          >
            Prev
          </button>

          <span>
            Page {page} / {totalPages}
          </span>

          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
          >
            Next
          </button>

        </div>
      )}

    </div>
  );
};

export default SuperAdminDashboard;