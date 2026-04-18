import { useState } from "react";
import { Upload, FileCheck, AlertCircle } from "lucide-react";
import { API_BASE_URL } from "../../config/api";

const UploadCard = ({ title, type, icon, uploads, uploadStatus, handleFileChange, handleUpload }) => {
  const IconComponent = icon;
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-3 mb-4">
        <IconComponent size={24} className="text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
      </div>

      <div className="mb-4">
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={(e) => handleFileChange(e, type)}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
        />
      </div>

      {uploads[type] && (
        <p className="text-sm text-gray-600 mb-3">
          Selected: <span className="font-medium">{uploads[type].name}</span>
        </p>
      )}

      <button
        onClick={() => handleUpload(type)}
        disabled={!uploads[type]}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
      >
        <Upload size={18} />
        Upload {title}
      </button>

      {uploadStatus[type] && (
        <div
          className={`mt-4 p-3 rounded-lg flex items-center gap-2 text-sm ${
            uploadStatus[type].type === "success"
              ? "bg-green-50 text-green-700"
              : uploadStatus[type].type === "error"
              ? "bg-red-50 text-red-700"
              : "bg-blue-50 text-blue-700"
          }`}
        >
          {uploadStatus[type].type === "success" ? (
            <FileCheck size={18} />
          ) : (
            <AlertCircle size={18} />
          )}
          {uploadStatus[type].message}
        </div>
      )}
    </div>
  );
};

const ExcelUploads = () => {
  const [uploads, setUploads] = useState({
    faculty: null,
    admin: null,
    attendance: null,
  });

  const [uploadStatus, setUploadStatus] = useState({
    faculty: null,
    admin: null,
    attendance: null,
  });

  const handleFileChange = (e, uploadType) => {
    const file = e.target.files[0];
    if (file) {
      setUploads((prev) => ({
        ...prev,
        [uploadType]: file,
      }));
    }
  };

  const handleUpload = async (uploadType) => {
    const file = uploads[uploadType];
    if (!file) {
      setUploadStatus((prev) => ({
        ...prev,
        [uploadType]: { type: "error", message: "Please select a file" },
      }));
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploadStatus((prev) => ({
        ...prev,
        [uploadType]: { type: "loading", message: "Uploading..." },
      }));

      // API endpoints based on upload type
      const endpoint =
        uploadType === "faculty"
          ? `${API_BASE_URL}/faculty/excel/upload`
          : uploadType === "admin"
          ? `${API_BASE_URL}/admin/excel/upload`
          : `${API_BASE_URL}/attendanceInOut`;

      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        setUploadStatus((prev) => ({
          ...prev,
          [uploadType]: { type: "success", message: "Upload successful!" },
        }));
        setUploads((prev) => ({
          ...prev,
          [uploadType]: null,
        }));
      } else {
        setUploadStatus((prev) => ({
          ...prev,
          [uploadType]: { type: "error", message: "Upload failed" },
        }));
      }
    } catch (error) {
      console.error("Upload error:", error);
      setUploadStatus((prev) => ({
        ...prev,
        [uploadType]: { type: "error", message: "Error uploading file" },
      }));
    }
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Excel Uploads</h1>
        <p className="text-gray-600">
          Upload Excel files to import faculty, admin, and attendance data
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <UploadCard
          title="Faculty Excel Upload"
          type="faculty"
          icon={Upload}
          uploads={uploads}
          uploadStatus={uploadStatus}
          handleFileChange={handleFileChange}
          handleUpload={handleUpload}
        />
        <UploadCard
          title="Admin Excel Upload"
          type="admin"
          icon={Upload}
          uploads={uploads}
          uploadStatus={uploadStatus}
          handleFileChange={handleFileChange}
          handleUpload={handleUpload}
        />
        <UploadCard
          title="Attendance Excel Upload"
          type="attendance"
          icon={Upload}
          uploads={uploads}
          uploadStatus={uploadStatus}
          handleFileChange={handleFileChange}
          handleUpload={handleUpload}
        />
      </div>
    </div>
  );
};

export default ExcelUploads;