import { useEffect, useMemo, useState } from "react";
import CreateAdminModal from "../../components/admin/CreateAdminModal";
import DeleteAdminModal from "../../components/admin/DeleteAdminModal";
import { useAuth } from "../../auth/useAuth";
import { API_BASE_URL } from "../../config/api";
//import toast from "react-hot-toast";


/* ==============================
   MAIN COMPONENT
============================== */
const AdminManagement = () => {
    const { user } = useAuth();
  const [tab, setTab] = useState("ADMIN");

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);

  const [actionLoading, setActionLoading] = useState("");

  /* ==============================
     FETCH DATA
  ============================== */
  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(`${API_BASE_URL}/getFacultyAndAdmin?rmEmpId=${user.employeeId}`);
      setData(res);
      const text = await res.text();

      let parsed = null;
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = null;
      }

      if (res.status >= 500) {
        setError("Server error. Please try again later.");
        return;
      }

      if (!res.ok) {
        setError(parsed?.message || text || "Failed to load data");
        return;
      }

      setData(parsed);
    } catch {
      setError("Network error. Please check connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  /* ==============================
     FILTER DATA
  ============================== */
  const filteredFaculty = useMemo(() => {
    if (!data?.FacultyDetails) return [];

    return data.FacultyDetails
      .filter((f) => !f.admin)
      .filter((f) =>
        `${f.firstName} ${f.lastName} ${f.empId}`
          .toLowerCase()
          .includes(search.toLowerCase())
      );
  }, [data, search]);

  const filteredAdmins = useMemo(() => {
    if (!data?.AdminDetails) return [];

    return data.AdminDetails.filter((a) =>
      `${a.adminName} ${a.userName}`
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [data, search]);

  /* ==============================
     CREATE ADMIN
  ============================== */
  const handleCreateAdmin = async (form) => {
    try {
      setActionLoading("create");

      const res = await fetch(`${API_BASE_URL}/createAdmin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if(res.ok) {
        setShowModal(false);
        fetchData();
        return;
      }

      const text = await res.text();

      if (res.status >= 500) {
        setError("Server error while creating admin.");
        return;
      }

      if (!res.ok) {
        setError(text || "Failed to create admin");
        return;
      }

      setShowModal(false);
      fetchData();
    } catch {
      setError("Network error while creating admin.");
    } finally {
      setActionLoading("");
    }
  };

  /* ==============================
     DELETE ADMIN
  ============================== */
  const handleDeleteAdmin = async (empId, newEmpId) => {
  try {
    setActionLoading(empId); // ✅ ADD THIS

    const res = await fetch(
      `${API_BASE_URL}/deleteAdmin?empId=${empId}&newEmpId=${newEmpId}`,
      { method: "DELETE" }
    );

    const text = await res.text();

    if (!res.ok) {
      setError(text || "Failed to delete admin");
      return;
    }

    setDeleteModal(false);
    fetchData();

  } catch {
    setError("Network error");
  } finally {
    setActionLoading(""); // ✅ RESET
  }
};
  /* ==============================
     UI STATES
  ============================== */

  if (loading) {
    return (
      <div className="text-center py-10 text-gray-500">
        Loading Admin Management...
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 text-red-600 p-4 rounded-lg mb-4">
        {error}
      </div>
    );
  }

  /* ==============================
     MAIN UI
  ============================== */
  return (
    <div className="p-6 space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-center ">
        <h2 className="text-xl font-semibold text-gray-800">
          Admin Management
        </h2>

        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border px-3 py-2 rounded-lg text-sm"
        />
      </div>

      {/* TABS */}
      <div className="flex gap-3">
        <button
          onClick={() => setTab("ADMIN")}
          className={tab === "ADMIN" ? "tab-active" : "tab"}
        >
          Admins ({data?.AdminCount || 0})
        </button>

        <button
          onClick={() => setTab("FACULTY")}
          className={tab === "FACULTY" ? "tab-active" : "tab"}
        >
          Faculty ({data?.FacultyCount || 0})
        </button>
        
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow overflow-hidden">

        {/* HEADER */}
        <div className="grid grid-cols-5 bg-gray-100 text-sm font-medium p-3">
          <div>Name</div>
          <div>ID</div>
          {tab==="FACULTY" && <div>Department</div>}
          {tab==="ADMIN" && <div>Email</div>}
          <div>Location</div>
          <div>Action</div>
        </div>

        {/* ADMIN LIST */}
        {tab === "ADMIN" &&
          filteredAdmins.map((a) => (
            <div
              key={a.id}
              className="grid grid-cols-5 p-3 border-t text-sm"
            >
              <div>{a.adminName}</div>
              <div>{a.userName}</div>
              <div>{a.email}</div>
              <div>{a.collageLocation}</div>

              <div>
             <button
  onClick={() => {
    if (data.AdminCount === 1) {
      setError("Cannot delete the only admin");
      return;
    }

    setSelectedAdmin(a);
    setDeleteModal(true);
  }}
  disabled={actionLoading === a.userName}
  className="text-red-600 disabled:opacity-50"
>
  {actionLoading === a.userName ? "Removing..." : "Remove"}
</button>
              </div>
            </div>
          ))}

        {/* FACULTY LIST */}
        {tab === "FACULTY" &&
          filteredFaculty.map((f) => (
            <div
              key={f.id}
              className="grid grid-cols-5 p-3 border-t text-sm"
            >
              <div>
                {f.firstName} {f.lastName}
              </div>
              <div>{f.empId}</div>
              <div>{f.facultyDept}</div>
              <div>{f.collegeLocation}</div>

              <div>
                <button
                  onClick={() => {
                    setSelectedFaculty(f);
                    setShowModal(true);
                  }}
                  className="text-blue-600 hover:underline"
                >
                  Make Admin
                </button>
              </div>
            </div>
          ))}
      </div>

      {/* MODAL */}
      <CreateAdminModal
        open={showModal}
        faculty={selectedFaculty}
        onClose={() => setShowModal(false)}
        onSubmit={handleCreateAdmin}
      />

      <DeleteAdminModal
  open={deleteModal}
  admin={selectedAdmin}
  adminsList={data?.AdminDetails || []}
  onClose={() => setDeleteModal(false)}
  onSubmit={handleDeleteAdmin}
/>
    </div>
  );
};

export default AdminManagement;