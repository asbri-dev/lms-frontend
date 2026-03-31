import { useState } from "react";

const DeleteAdminModal = ({
  open,
  onClose,
  admin,
  adminsList,
  onSubmit,
}) => {
  const [newAdmin, setNewAdmin] = useState("");
  const [error, setError] = useState("");

  if (!open || !admin) return null;

  const filteredAdmins = adminsList.filter(
    (a) => a.userName !== admin.userName
  );

  const handleSubmit = () => {
    if (!newAdmin) {
      setError("Please select replacement admin");
      return;
    }

    onSubmit(admin.userName, newAdmin);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

      <div className="bg-white w-full max-w-md rounded-xl p-6 shadow-lg">

        <h2 className="text-lg font-semibold mb-4">
          Transfer & Remove Admin
        </h2>

        {/* Info */}
        <p className="text-sm text-gray-600 mb-3">
          You are removing:
          <span className="font-medium"> {admin.adminName}</span>
        </p>

        {/* Dropdown */}
        <select
          value={newAdmin}
          onChange={(e) => {
            setNewAdmin(e.target.value);
            setError("");
          }}
          className="w-full border px-3 py-2 rounded-lg"
        >
          <option value="">Select Replacement Admin</option>

          {filteredAdmins.map((a) => (
            <option key={a.userName} value={a.userName}>
              {a.adminName} ({a.userName})
            </option>
          ))}
        </select>

        {/* Error */}
        {error && (
          <p className="text-red-600 text-sm mt-2">{error}</p>
        )}

        {/* Buttons */}
        <div className="flex justify-end gap-3 mt-5">

          <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-red-600 text-white rounded"
          >
            Transfer & Remove
          </button>

        </div>
      </div>
    </div>
  );
};

export default DeleteAdminModal;