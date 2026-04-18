import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { API_BASE_URL } from "../../../config/api";

const UPLOAD_TYPES = [
  { key: "employee",   label: "Employee data",   desc: "Bulk import employee records"    },
  { key: "attendance", label: "Attendance data",  desc: "Bulk import attendance history"  },
];

const ExcelUpload = () => {
  const [uploadType, setUploadType] = useState("employee");
  const [file, setFile]             = useState(null);
  const [status, setStatus]         = useState("idle"); // idle | uploading | success | error
  const [errorMsg, setErrorMsg]     = useState("");
  const [dragging, setDragging]     = useState(false);
  const inputRef = useRef();

  const token = sessionStorage.getItem("authToken");

  const handleFile = (f) => {
    if (!f) return;
    if (!f.name.endsWith(".xlsx") && !f.name.endsWith(".xls")) {
      toast.error("Only .xlsx or .xls files are allowed");
      return;
    }
    setFile(f);
    setStatus("idle");
    setErrorMsg("");
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    handleFile(f);
  };

 const handleUpload = async () => {
  if (!file) {
    toast.error("Please select a file first");
    return;
  }

  try {
    setStatus("uploading");

    let url = "";

    if (uploadType === "employee") {
      url = `${API_BASE_URL}/faculty/excel/upload`;
    } else if (uploadType === "attendance") {
      url = `${API_BASE_URL}/attendanceInOut`;
    }

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    // 🔥 Proper error handling
    if (!res.ok) {
      let errorText = "Upload failed";

      try {
        const errData = await res.json();
        errorText = errData.message || errorText;
      } catch {
        errorText = await res.text();
      }

      throw new Error(errorText);
    }

    setStatus("success");
    toast.success("File uploaded successfully");

  } catch (e) {
    setStatus("error");
    setErrorMsg(e.message || "Upload failed");
    toast.error(e.message || "Upload failed");
  }
};

  const handleDownloadTemplate = async (type) => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/downloadTemplate?type=${type}`,
        { headers: { Authorization: `Bearer ${token}` } }  //
      );
      if (!res.ok) throw new Error("Failed to download");
      const blob = await res.blob();  //
      const url  = URL.createObjectURL(blob);  //
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `${type}_template.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Template downloaded");
    } catch {
      toast.error("Failed to download template");
    }
  };

  const reset = () => {
    setFile(null);
    setStatus("idle");
    setErrorMsg("");
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="max-w-2xl space-y-6">

      {/* ─── Upload Type Selector ─── */}
      <div className="grid grid-cols-2 gap-3">
        {UPLOAD_TYPES.map((t) => (
          <button
            key={t.key}
            onClick={() => { setUploadType(t.key); reset(); }}
            className={`p-4 rounded-xl border text-left transition-all ${
              uploadType === t.key
                ? "border-indigo-500 bg-indigo-50"
                : "border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            <div className={`text-sm font-medium ${uploadType === t.key ? "text-indigo-700" : "text-gray-700"}`}>
              {t.label}
            </div>
            <div className="text-xs text-gray-400 mt-0.5">{t.desc}</div>
          </button>
        ))}
      </div>

      {/* ─── Drop Zone ─── */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
          dragging
            ? "border-indigo-400 bg-indigo-50"
            : file
            ? "border-green-400 bg-green-50"
            : "border-gray-200 bg-gray-50 hover:border-indigo-300 hover:bg-indigo-50"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={(e) => handleFile(e.target.files[0])}
        />

        {file ? (
          <div className="space-y-2">
            <div className="text-3xl">📄</div>
            <div className="text-sm font-medium text-green-700">{file.name}</div>
            <div className="text-xs text-gray-400">
              {(file.size / 1024).toFixed(1)} KB
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); reset(); }}
              className="text-xs text-red-500 hover:text-red-700 underline"
            >
              Remove file
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-3xl">📂</div>
            <div className="text-sm font-medium text-gray-600">
              {dragging ? "Drop file here" : "Drag & drop your .xlsx file here"}
            </div>
            <div className="text-xs text-gray-400">or click to browse</div>
          </div>
        )}
      </div>

      {/* ─── Status messages ─── */}
      {status === "uploading" && (
        <div className="flex items-center gap-3 text-sm text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-3">
          <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
          </svg>
          Uploading file...
        </div>
      )}
      {status === "success" && (
        <div className="flex items-center gap-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
          <span>✓</span> File uploaded successfully!
          <button onClick={reset} className="ml-auto text-xs underline">Upload another</button>
        </div>
      )}
      {status === "error" && (
        <div className="flex items-center gap-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <span>⚠</span> {errorMsg}
          <button onClick={reset} className="ml-auto text-xs underline">Try again</button>
        </div>
      )}

      {/* ─── Actions ─── */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleUpload}
          disabled={!file || status === "uploading"}
          className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {status === "uploading" ? "Uploading..." : "Upload file"}
        </button>
      </div>

      {/* ─── Template Downloads ─── */}
      <div className="border-t border-gray-200 pt-5">
        <div className="text-xs text-gray-400 mb-3 font-medium uppercase tracking-wide">Download templates</div>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => handleDownloadTemplate("employee")}
            className="flex items-center gap-2 text-sm border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Employee template
          </button>
          <button
            onClick={() => handleDownloadTemplate("attendance")}
            className="flex items-center gap-2 text-sm border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Attendance template
          </button>
        </div>
      </div>

    </div>
  );
};

export default ExcelUpload;
