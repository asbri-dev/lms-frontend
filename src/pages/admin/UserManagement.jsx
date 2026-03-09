import React, { useState, useEffect } from "react";
import { Download, UserPlus, Search, Mail, Shield, Trash2 } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";

// reusable info row used in multiple sections
const Info = ({ label, value }) => (
  <div className="flex justify-between bg-gray-50 px-4 py-2 rounded-lg">
    <span className="text-gray-600 font-medium">{label}</span>
    <span className="text-gray-800 text-sm">{value || "N/A"}</span>
  </div>
);

const EmployeeDetailsModal = ({ selectedUser, setSelectedUser }) => {
  if (!selectedUser) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-50 rounded-2xl w-full max-w-6xl shadow-2xl overflow-hidden max-h-[95vh] overflow-y-auto">

        {/* HEADER */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 relative">
          <button
            onClick={() => setSelectedUser(null)}
            className="absolute top-4 right-4 text-xl"
          >
            ✕
          </button>

          <h2 className="text-2xl font-bold">
            {selectedUser.personalDetails?.firstName}{" "}
            {selectedUser.personalDetails?.lastName}
          </h2>
          <p className="text-sm opacity-90">
            Employee ID: {selectedUser.personalDetails?.empId}
          </p>
        </div>

        <div className="p-6 space-y-6">

          {/* PERSONAL DETAILS */}
          <Section title="Personal Details" color="blue">
            <Info label="Middle Name" value={selectedUser.personalDetails?.middleName} />
            <Info label="Blood Group" value={selectedUser.personalDetails?.bloodGroup} />
            <Info label="Date of Birth" value={selectedUser.personalDetails?.dateOfBirth} />
            <Info label="Marital Status" value={selectedUser.personalDetails?.maritalStatus} />
            <Info label="Marriage Date" value={selectedUser.personalDetails?.marriageDate} />
            <Info label="Mobile Number" value={selectedUser.personalDetails?.mobileNumber} />
            <Info label="Email" value={selectedUser.personalDetails?.email} />
            <Info label="Alternate Email" value={selectedUser.personalDetails?.alternateEmail} />
            <Info label="Aadhar Number" value={selectedUser.personalDetails?.aadharNumber} />
            <Info label="PAN Number" value={selectedUser.personalDetails?.panNumber} />
            <Info label="Department" value={selectedUser.personalDetails?.facultyDept || selectedUser.personalDetails?.adminDept} />
            <Info label="Reporting Manager" value={selectedUser.personalDetails?.reportingManager} />
            <Info label="Reporting Manager ID" value={selectedUser.personalDetails?.reportingManagerEmpId} />
            <Info label="Salary Mode" value={selectedUser.personalDetails?.salaryPaymentMode} />
            <Info label="Date Of Joining" value={selectedUser.personalDetails?.dateOfJoining} />
            <Info label="Employee Status" value={selectedUser.personalDetails?.employeeStatus} />
            <Info label="Confirmation Date" value={selectedUser.personalDetails?.confirmationDate} />
            <Info label="Probation Period (Months)" value={selectedUser.personalDetails?.probationPeriod} />
            <Info label="Notice Period (Months)" value={selectedUser.personalDetails?.noticePeriod} />
            <Info label="Physically Challenged" value={selectedUser.personalDetails?.isPhysicallyChallenged ? "Yes" : "No"} />
            <Info label="International Employee" value={selectedUser.personalDetails?.isInternationalEmployee ? "Yes" : "No"} />
            <Info label="BGV Completed On" value={selectedUser.personalDetails?.bgvCompletedOn} />
            <Info label="Casual Leaves" value={selectedUser.personalDetails?.casualLeaves} />
            <Info label="Medical Leaves" value={selectedUser.personalDetails?.medicalLeaves} />
          </Section>

          {/* CONTACT DETAILS */}
          <Section title="Contact Details" color="purple">
            <Info label="Father Name" value={selectedUser.contactDetails?.fatherName} />
            <Info label="Mother Name" value={selectedUser.contactDetails?.motherName} />
            <Info label="Spouse Name" value={selectedUser.contactDetails?.spouseName} />
            <Info label="Emergency Contact Name" value={selectedUser.contactDetails?.emergencyContactName} />
            <Info label="Emergency Contact Relation" value={selectedUser.contactDetails?.emergencyContactRelation} />
            <Info label="Emergency Contact Mobile" value={selectedUser.contactDetails?.emergencyContactMobileNumber} />
            <Info label="Emergency Contact Email" value={selectedUser.contactDetails?.emergencyContactEmail} />
            <Info label="Nearby Railway Station" value={selectedUser.contactDetails?.nearByRailWayStation} />
            <Info label="Nearby Post Office" value={selectedUser.contactDetails?.nearByPostOffice} />
            <Info label="Post Office Pin Code" value={selectedUser.contactDetails?.postOfficePinCode} />
          </Section>

          {/* ADDRESS DETAILS */}
          <Section title="Address Details" color="green">
            <Info label="Nationality" value={selectedUser.addressDetails?.nationality} />
            <Info label="Current State" value={selectedUser.addressDetails?.currentState} />
            <Info label="Current District" value={selectedUser.addressDetails?.currentDistrict} />
            <Info label="Current City" value={selectedUser.addressDetails?.currentCity} />
            <Info label="Postal Code" value={selectedUser.addressDetails?.postalCode} />
            <Info label="Street / Area" value={selectedUser.addressDetails?.streetAreaHno} />
            <Info label="Permanent State" value={selectedUser.addressDetails?.permanentState} />
            <Info label="Permanent District" value={selectedUser.addressDetails?.permanentDistrict} />
            <Info label="Permanent City" value={selectedUser.addressDetails?.permanentCity} />
            <Info label="Permanent Postal Code" value={selectedUser.addressDetails?.permanentPostalCode} />
            <Info label="Permanent Street" value={selectedUser.addressDetails?.permanentStreetAreaHno} />
          </Section>

          {/* BANK DETAILS */}
          <Section title="Bank Details" color="yellow">
            <Info label="Name As Per Bank" value={selectedUser.bankDetails?.nameAsPerBankRecords} />
            <Info label="Bank Name" value={selectedUser.bankDetails?.bankName} />
            <Info label="Branch" value={selectedUser.bankDetails?.bankBranch} />
            <Info label="Account Number" value={selectedUser.bankDetails?.accountNumber} />
            <Info label="IFSC Code" value={selectedUser.bankDetails?.ifscCode} />
            <Info label="Account Type" value={selectedUser.bankDetails?.typeOfAccount} />
            <Info label="PF Eligible" value={selectedUser.bankDetails?.eligibleForPf ? "Yes" : "No"} />
            <Info label="PF Number" value={selectedUser.bankDetails?.pfNumber} />
            <Info label="PF Scheme" value={selectedUser.bankDetails?.pfScheme} />
            <Info label="PF Joining Date" value={selectedUser.bankDetails?.pfJoiningDate} />
            <Info label="UAN" value={selectedUser.bankDetails?.universalAccountNumber} />
          </Section>

          {/* EDUCATION DETAILS */}
          <Section title="Education Details" color="indigo">
            <Info label="Highest Qualification" value={selectedUser.educationDetails?.highestQualification} />

            <div className="col-span-2 font-semibold text-gray-700 mt-4">
              UG Details
            </div>
            <Info label="Course" value={selectedUser.educationDetails?.ugCourse} />
            <Info label="Specialization" value={selectedUser.educationDetails?.ugSpecialization} />
            <Info label="College" value={selectedUser.educationDetails?.ugCollegeName} />
            <Info label="University" value={selectedUser.educationDetails?.ugUniversityName} />
            <Info label="Start Date" value={selectedUser.educationDetails?.ugStartDate} />
            <Info label="End Date" value={selectedUser.educationDetails?.ugEndDate} />
            <Info label="Status" value={selectedUser.educationDetails?.ugStatus} />

            <div className="col-span-2 font-semibold text-gray-700 mt-4">
              PG Details
            </div>
            <Info label="Course" value={selectedUser.educationDetails?.pgCourse} />
            <Info label="Specialization" value={selectedUser.educationDetails?.pgSpecialization} />
            <Info label="College" value={selectedUser.educationDetails?.pgCollegeName} />
            <Info label="University" value={selectedUser.educationDetails?.pgUniversityName} />
            <Info label="Start Date" value={selectedUser.educationDetails?.pgStartDate} />
            <Info label="End Date" value={selectedUser.educationDetails?.pgEndDate} />
            <Info label="Status" value={selectedUser.educationDetails?.pgStatus} />

            <div className="col-span-2 font-semibold text-gray-700 mt-4">
              PhD Details
            </div>
            <Info label="Specialization" value={selectedUser.educationDetails?.phDSpecialization} />
            <Info label="College" value={selectedUser.educationDetails?.phDCollegeName} />
            <Info label="University" value={selectedUser.educationDetails?.phDUniversityName} />
            <Info label="Start Date" value={selectedUser.educationDetails?.phDStartDate} />
            <Info label="End Date" value={selectedUser.educationDetails?.phDEndDate} />
            <Info label="Status" value={selectedUser.educationDetails?.phDStatus} />
          </Section>

        </div>
      </div>
    </div>
  );
};

/* Reusable Section Component */
const Section = ({ title, children, color }) => {
  const borderColor = {
    blue: "border-blue-500",
    purple: "border-purple-500",
    green: "border-green-500",
    yellow: "border-yellow-500",
    indigo: "border-indigo-500",
  };

  const textColor = {
    blue: "text-blue-600",
    purple: "text-purple-600",
    green: "text-green-600",
    yellow: "text-yellow-600",
    indigo: "text-indigo-600",
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm p-5 border-l-4 ${borderColor[color]}`}>
      <h3 className={`text-lg font-semibold mb-4 ${textColor[color]}`}>
        {title}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {children}
      </div>
    </div>
  );
};

// main user management view
export function UserManagement() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterDepartment, setFilterDepartment] = useState("all");

  const [users, setUsers] = useState([]); // array of normalized objects (with raw data)
  const [selectedUser, setSelectedUser] = useState(null); // raw record for detail view
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // fetch users from API and normalize the nested response structure
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        // user may be null initially, api needs employeeId
        const resp = await fetch(`http://localhost:9090/faculty/getAllRegFacultyDetails?rmEmpId=${user?.employeeId}`);
        if (!resp.ok) throw new Error("Failed to load user list");
        const data = await resp.json();

        // backend returns either a single object or an array of objects
        const list = Array.isArray(data) ? data : [data];

        // flatten each faculty record so the UI can work with simple keys
        const normalized = list.map((item) => {
          const pd = item.personalDetails || {};
          const cd = item.contactDetails || {};

          return {
            raw: item,
            id: pd.id || item.id || item.EmployeeId,
            name: `${pd.firstName || ""} ${pd.middleName || ""} ${pd.lastName || ""}`.trim() || pd.empId || "",
            empId: pd.empId || item.EmployeeId || "",
            email: pd.email || cd.emergencyContactEmail || "",
            department: pd.facultyDept || pd.adminDept || "",
            designation: pd.designation || "",
            role: "faculty",
            status: (pd.employeeStatus || "").toLowerCase(),
            joinedOn: pd.dateOfJoining || pd.confirmationDate || "",
          };
        });

        setUsers(normalized);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (user?.employeeId) {
      fetchUsers();
    }
  }, [user]);

  const departments = [
    "IT",
    "Computer Science",
    "Electronics",
    "Mechanical",
    "Civil",
  ];

  const filteredUsers = users.filter((user) => {
    const name = user.name || "";
    const empId = user.empId || user.employeeId || "";
    const email = user.email || "";

    const matchesSearch =
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      empId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole =
      filterRole === "all" || (user.role || "").toLowerCase() === filterRole;

    const matchesDept =
      filterDepartment === "all" ||
      (user.department || "").toLowerCase() === filterDepartment.toLowerCase();

    return matchesSearch && matchesRole && matchesDept;
  });

  const getRoleBadge = (role) => {
    switch (role) {
      case "developer":
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-600">
            Super Admin
          </span>
        );
      case "semi-admin":
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-600">
            HOD/Dean
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600">
            Faculty
          </span>
        );
    }
  };

  const getStatusBadge = (status) => {
    const s = (status || "").toLowerCase();
    const isActive = s === "active" || s === "permanent" || s === "working";
    return isActive ? (
      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-600">
        Active
      </span>
    ) : (
      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600">
        Inactive
      </span>
    );
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-gray-500">
            Manage faculty and admin accounts
          </p>
        </div>

      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border px-3 py-2 rounded-lg w-full pl-9"
          />
        </div>

        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="border px-3 py-2 rounded-lg"
        >
          <option value="all">All Roles</option>
          <option value="developer">Super Admin</option>
          <option value="semi-admin">HOD/Dean</option>
          <option value="faculty">Faculty</option>
        </select>

        <select
          value={filterDepartment}
          onChange={(e) => setFilterDepartment(e.target.value)}
          className="border px-3 py-2 rounded-lg"
        >
          <option value="all">All Departments</option>
          {departments.map((dept) => (
            <option key={dept} value={dept}>
              {dept}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="p-8 text-center">Loading users...</div>
      ) : error ? (
        <div className="p-8 text-center text-red-500">{error}</div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3">User</th>
                <th className="p-3">Department</th>
                <th className="p-3">Email</th>
                <th className="p-3">Role</th>
                <th className="p-3">Status</th>
                <th className="p-3">Joined</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id || user.employeeId} className="border-t hover:bg-gray-50 group">
                  <td className="p-3">
                    <button
                      onClick={() => setSelectedUser(user.raw)}
                      className="w-full text-left"
                    >
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-gray-500">
                          {user.empId || user.employeeId} 
                        </p>
                      </div>
                    </button>
                  </td>
                  <td className="p-3">{user.department}</td>
                  <td className="p-3">{user.email}</td>
                  <td className="p-3">{getRoleBadge(user.role)}</td>
                  <td className="p-3">{getStatusBadge(user.status)}</td>
                  <td className="p-3 text-gray-500">{user.joinedOn}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                      <button title="Email"> <Mail size={16} className="text-gray-500 hover:text-blue-600" /> </button>
                      <button title="Change Role"> <Shield size={16} className="text-gray-500 hover:text-purple-600" /> </button>
                      <button title="Delete User"> <Trash2 size={16} className="text-gray-500 hover:text-red-600" /> </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredUsers.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              No users found
            </div>
          )}
        </div>
      )}

      <EmployeeDetailsModal selectedUser={selectedUser} setSelectedUser={setSelectedUser} />
    </div>
  );
}