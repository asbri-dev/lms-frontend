import { useState, useRef } from "react";
import { Upload, FileCheck, FileSpreadsheet,IndianRupee, Users, GraduationCap, X, CloudUpload,CalendarDays,ClipboardPen } from "lucide-react";
import toast from "react-hot-toast";
import { API_BASE_URL } from "../../config/api";

const UPLOAD_CONFIG = {
  faculty: {
    title: "Faculty Data",
    subtitle: "Import faculty records",
    icon: Users,
    endpoint: (base) => `${base}/faculty/excel/upload`,
    color: "blue",
    gradient: "from-blue-500 to-blue-600",
    light: "bg-blue-50 text-blue-700 border-blue-200",
    ring: "ring-blue-400",
  },
   attendance: {
    title: "Attendance Data",
    subtitle: "Import attendance logs",
    icon: FileSpreadsheet,
    endpoint: (base) => `${base}/attendanceInOut`,
    color: "green",
    gradient: "from-emerald-500 to-emerald-600",
    light: "bg-emerald-50 text-emerald-700 border-emerald-200",
    ring: "ring-emerald-400",
  },
  Leave: {
    title: "Leave Data",
    subtitle: "Import leave records",
    icon: CalendarDays,
    endpoint: (base) => `${base}/leaveExcelUpload`,
    color: "red",
    gradient: "from-red-500 to-red-600",
    light: "bg-red-50 text-red-700 border-red-200",
    ring: "ring-red-400",
  },
  modifier: {
    title: "Attendance Modifier",
    subtitle: "Import modifier records",
    icon: ClipboardPen,
    endpoint: (base) => `${base}/bulkAttendanceOverRide`,
    color: "amber",
    gradient: "from-amber-500 to-amber-600",
    light: "bg-amber-50 text-amber-700 border-amber-200",
    ring: "ring-amber-400",
  },
  student: {
    title: "Student Data",
    subtitle: "Import student records",
    icon: GraduationCap,
    endpoint: (base) => `${base}/studentExcelUpload`,
    color: "violet",
    gradient: "from-violet-500 to-violet-600",
    light: "bg-violet-50 text-violet-700 border-violet-200",
    ring: "ring-violet-400",
  },
 
  fee: {
    title: "Fee Data",
    subtitle: "Import fee records",
    icon: IndianRupee,
    endpoint: (base) => `${base}/feeStructureExcelUpload`,
    color: "green",
    gradient: "from-green-500 to-green-600",
    light: "bg-green-50 text-green-700 border-green-200",
    ring: "ring-green-400",
  },
};

const UploadCard = ({ type, config, file, onFileChange, onClear, uploading }) => {
  const inputRef = useRef(null);
  const Icon = config.icon;
 // const isDragging = false;

  return (
    <div
      className={`
        relative bg-white rounded-2xl border border-gray-100 shadow-sm
        overflow-hidden transition-all duration-300
        hover:shadow-lg hover:-translate-y-0.5
      `}
    >
      {/* Top gradient bar */}
      <div className={`h-1.5 w-full bg-gradient-to-r ${config.gradient}`} />

      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl bg-gradient-to-br ${config.gradient} shadow-sm`}>
              <Icon size={20} className="text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-base leading-tight">{config.title}</h3>
              <p className="text-xs text-gray-400 mt-0.5">{config.subtitle}</p>
            </div>
          </div>
          <span className="text-[10px] font-medium uppercase tracking-wider text-gray-300 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
            .xlsx / .csv
          </span>
        </div>

        {/* Drop zone */}
       <div
  onClick={() => !file && inputRef.current?.click()}

  onDragOver={(e) => {
    e.preventDefault();
    e.stopPropagation();
  }}

  onDrop={(e) => {
    e.preventDefault();
    e.stopPropagation();

    const droppedFile = e.dataTransfer.files[0];

    if (droppedFile) {
      onFileChange(
        { target: { files: [droppedFile] } },
        type
      );
    }
  }}

  className={`
    relative rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer
    ${file
      ? `border-transparent ${config.light} border`
      : `border-gray-200 bg-gray-50`
    }
  `}
>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={(e) => onFileChange(e, type)}
            className="hidden"
          />

          {file ? (
            <div className="flex items-center justify-between px-4 py-3.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <FileCheck size={16} className={`text-${config.color}-600 shrink-0`} />
                <span className="text-sm font-medium text-gray-700 truncate">{file.name}</span>
                <span className="text-[10px] text-gray-400 shrink-0">
                  {(file.size / 1024).toFixed(0)} KB
                </span>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onClear(type); }}
                className="ml-2 p-1 rounded-md hover:bg-white/70 text-gray-400 hover:text-gray-600 transition shrink-0"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <CloudUpload size={28} className="text-gray-300" />
              <p className="text-sm text-gray-400">
                <span className={`font-medium text-${config.color}-500`}>Click to browse</span>
                {" "}or drag & drop
              </p>
            </div>
          )}
        </div>

        {/* Upload button */}
        <button
          onClick={() => onFileChange(null, type, true)}
          disabled={!file || uploading === type}
          className={`
            mt-4 w-full py-2.5 px-4 rounded-xl font-medium text-sm
            flex items-center justify-center gap-2
            transition-all duration-200
            disabled:opacity-40 disabled:cursor-not-allowed
            ${file && uploading !== type
              ? `bg-gradient-to-r ${config.gradient} text-white shadow-sm hover:shadow-md hover:opacity-90`
              : "bg-gray-100 text-gray-400"
            }
          `}
        >
          {uploading === type ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Uploading...
            </>
          ) : (
            <>
              <Upload size={15} />
              Upload {config.title}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

const ExcelUploads = () => {
  const [files, setFiles] = useState({ faculty: null, student: null, attendance: null });
  const [uploading, setUploading] = useState(null);
  const fileInputRefs = useRef({});

  const handleFileChange = async (e, type, triggerUpload = false) => {
    if (triggerUpload) {
      await handleUpload(type);
      return;
    }
    const file = e?.target?.files?.[0];
    if (file) setFiles((prev) => ({ ...prev, [type]: file }));
  };

  const handleClear = (type) => {
    setFiles((prev) => ({ ...prev, [type]: null }));
    if (fileInputRefs.current[type]) fileInputRefs.current[type].value = "";
  };

  const handleUpload = async (type) => {
    const file = files[type];
    if (!file) return;

    const config = UPLOAD_CONFIG[type];
    const endpoint = config.endpoint(API_BASE_URL);

    const formData = new FormData();
    formData.append("file", file);

    setUploading(type);

    const toastId = toast.loading(`Uploading ${config.title}...`, {
      style: { borderRadius: "12px", fontFamily: "inherit", fontSize: "14px" },
    });

    try {
      const response = await fetch(endpoint, { method: "POST", body: formData });

      if (response.ok) {
        toast.success(`${config.title} uploaded successfully!`, {
          id: toastId,
          duration: 3500,
          style: { borderRadius: "12px", fontFamily: "inherit", fontSize: "14px" },
          iconTheme: { primary: "#10b981", secondary: "#fff" },
        });
        // Auto-clear file after success
        setFiles((prev) => ({ ...prev, [type]: null }));
      } else {
        const errText = await response.text().catch(() => "Unknown error");
        toast.error(`Upload failed: ${errText || response.statusText}`, {
          id: toastId,
          duration: 4000,
          style: { borderRadius: "12px", fontFamily: "inherit", fontSize: "14px" },
        });
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(`Network error. Please try again.`, {
        id: toastId,
        duration: 4000,
        style: { borderRadius: "12px", fontFamily: "inherit", fontSize: "14px" },
      });
    } finally {
      setUploading(null);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-100 p-6 md:p-10">
      {/* Page header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-gradient-to-br from-slate-700 to-slate-900 rounded-xl shadow">
            <FileSpreadsheet size={20} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Excel Uploads</h1>
        </div>
        <p className="text-gray-500 text-sm ml-[52px]">
          Import faculty, student, and attendance data via Excel or CSV files
        </p>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl">
        {Object.entries(UPLOAD_CONFIG).map(([type, config]) => (
          <UploadCard
            key={type}
            type={type}
            config={config}
            file={files[type]}
            onFileChange={handleFileChange}
            onClear={handleClear}
            uploading={uploading}
          />
        ))}
      </div>

      {/* Footer hint */}
      <p className="mt-8 text-xs text-gray-400 max-w-5xl">
        Supported formats: <span className="font-medium text-gray-500">.xlsx, .xls, .csv</span> — Files are processed immediately after upload. Duplicate entries may be skipped depending on server configuration.
      </p>
    </div>
  );
};

export default ExcelUploads;
