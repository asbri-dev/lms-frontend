import { useEffect, useState } from "react";

const CreateAdminModal = ({ open, faculty, onClose, onSubmit }) => {
  const [form, setForm] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  /* ==============================
     INIT FORM (ONLY WHEN MODAL OPENS)
  ============================== */
  useEffect(() => {
    if (open && faculty) {
      setForm({
        userName: faculty.empId || "",
        password:"",
        email: faculty.email || "",
        contactNumber: faculty.mobileNumber || "",
        adminName: `${faculty.firstName || ""} ${faculty.lastName || ""}`,
        collageLocation: faculty.collegeLocation || "",
        reportingManagerId: faculty.reportingManagerEmpId || "",
      });

      setError("");
    }
  }, [open, faculty]);

  if (!open || !form) return null;

  /* ==============================
     HANDLE CHANGE
  ============================== */
  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  /* ==============================
     VALIDATION
  ============================== */
  const validate = () => {
    if (!form.password) return "Password is required";
    return null;
  };

  /* ==============================
     SUBMIT
  ============================== */
  const handleSubmit = async () => {
    const validationError = validate();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const res = await onSubmit(form); // 🔥 parent handles API

      // If parent returns error string
      if (typeof res === "string") {
        setError(res);
      }

    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  /* ==============================
     UI
  ============================== */
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

      <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-xl">

        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            Create Admin
          </h2>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 text-red-600 text-sm p-2 rounded mb-3">
            {error}
          </div>
        )}

        {/* Form */}
        <div className="space-y-3">

          <Input name="userName" value={form.userName} onChange={handleChange} />
          <Input name="adminName" value={form.adminName} onChange={handleChange} />
          <Input name="email" value={form.email} onChange={handleChange} />
          <Input name="contactNumber" value={form.contactNumber} onChange={handleChange} />
          <Input name="collageLocation" value={form.collageLocation} onChange={handleChange} />
          <Input name="reportingManagerId" value={form.reportingManagerId} onChange={handleChange} />

          {/* Password */}
          <Input
            name="password"
            type="password"
            placeholder="Enter Password"
            value={form.password}
            onChange={handleChange}
          />

        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 mt-5">

          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 rounded-lg"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-[#2b3c6b] text-white rounded-lg disabled:opacity-60"
          >
            {loading ? "Creating..." : "Create Admin"}
          </button>

        </div>
      </div>
    </div>
  );
};

/* ==============================
   REUSABLE INPUT
============================== */
const Input = ({ name, value, onChange, type = "text", placeholder }) => (
  <input
    name={name}
    type={type}
    value={value || ""}
    onChange={onChange}
    placeholder={placeholder || name}
    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#3f548f] outline-none"
  />
);

export default CreateAdminModal;