import { useEffect, useMemo, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { useAuth } from "../../auth/useAuth";

import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";

// IMPORTANT: worker configuration must be in the same file
// where Document and Page are used.
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const doc = (fileName) => `${BASE}/documents/${fileName}`;

const POLICIES = {
  PALAKKAD: [
    {
      key: "coc",
      title: "Code of Conduct",
      url: doc("code-of-conduct.pdf"),
    },
    {
      key: "leave",
      title: "Leave Policy",
      url: doc("palakkad-leave-policy.pdf"),
    },
  ],

  CHITTOOR: [
    {
      key: "coc",
      title: "Code of Conduct",
      url: doc("code-of-conduct.pdf"),
    },
    {
      key: "leave",
      title: "Leave Policy",
      url: doc("chittoor-leave-policy.pdf"),
    },
  ],
};

const resolveCampus = (user = {}) => {
  const fields = [
    user.collegeLocation,
    user.campus,
    user.location,
    user.college,
    user.collegeName,
  ];

  for (const field of fields) {
    const value = String(field || "").toUpperCase();

    if (value.includes("PALAKKAD")) {
      return "PALAKKAD";
    }

    if (value.includes("CHITTOOR")) {
      return "CHITTOOR";
    }
  }

  const empId = String(
    user.empId ||
      user.employeeId ||
      user.username ||
      user.userId ||
      ""
  ).toUpperCase();

  if (empId.startsWith("AREP")) {
    return "PALAKKAD";
  }

  if (empId.startsWith("AREC")) {
    return "CHITTOOR";
  }

  return "";
};

export default function PolicyDocuments() {
  const { user = {} } = useAuth();

  const campus = useMemo(
    () => resolveCampus(user),
    [user]
  );

  const docs = POLICIES[campus];

  const [active, setActive] = useState("coc");
  const [numPages, setNumPages] = useState(null);
  const [pdfError, setPdfError] = useState("");

  const [width, setWidth] = useState(800);

  const viewerRef = useRef(null);

  // ---------------------------------------------
  // Calculate PDF width
  // ---------------------------------------------
  useEffect(() => {
    if (!viewerRef.current) return;

    const updateWidth = () => {
      const containerWidth =
        viewerRef.current.clientWidth;

      if (containerWidth > 0) {
        setWidth(
          Math.min(containerWidth - 24, 1000)
        );
      }
    };

    updateWidth();

    const observer = new ResizeObserver(updateWidth);

    observer.observe(viewerRef.current);

    window.addEventListener("resize", updateWidth);

    return () => {
      observer.disconnect();
      window.removeEventListener(
        "resize",
        updateWidth
      );
    };
  }, []);

  // ---------------------------------------------
  // Reset PDF when changing document
  // ---------------------------------------------
  useEffect(() => {
    setNumPages(null);
    setPdfError("");
  }, [active, campus]);

  // ---------------------------------------------
  // Disable save / print shortcuts
  // ---------------------------------------------
  useEffect(() => {
    const handleKeyDown = (event) => {
      const key = event.key.toLowerCase();

      if (
        (event.ctrlKey || event.metaKey) &&
        ["s", "p", "u"].includes(key)
      ) {
        event.preventDefault();
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, []);

  // ---------------------------------------------
  // Campus not detected
  // ---------------------------------------------
  if (!docs) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-5">
          <h2 className="font-semibold text-red-700">
            Campus not found
          </h2>

          <p className="mt-2 text-sm text-red-600">
            Unable to determine the campus for this
            logged-in user.
          </p>

          <pre className="mt-4 overflow-auto rounded bg-white p-3 text-xs">
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>
      </div>
    );
  }

  const current =
    docs.find((item) => item.key === active) ||
    docs[0];

  const watermark = `${user.empName || user.name || ""} • ${
    user.empId || user.employeeId || ""
  }`;

  // ---------------------------------------------
  // PDF loaded
  // ---------------------------------------------
  const handlePDFSuccess = ({ numPages }) => {
    console.log(
      "PDF loaded successfully:",
      current.url
    );

    console.log("Total pages:", numPages);

    setNumPages(numPages);
    setPdfError("");
  };

  // ---------------------------------------------
  // PDF failed
  // ---------------------------------------------
  const handlePDFError = (error) => {
    console.error(
      "PDF LOAD ERROR:",
      error
    );

    setPdfError(
      error?.message ||
        "Unknown PDF loading error"
    );

    setNumPages(null);
  };

  return (
    <div
      className="space-y-5 p-6 select-none print:hidden"
      onContextMenu={(event) =>
        event.preventDefault()
      }
    >
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Policy Documents
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          {campus} Campus • View Only
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {docs.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => {
              console.log(
                "Selected document:",
                item
              );

              setActive(item.key);
            }}
            className={`-mb-px border-b-2 px-5 py-3 text-sm font-medium transition ${
              active === item.key
                ? "border-[#2b3c6b] text-[#2b3c6b]"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            {item.title}
          </button>
        ))}
      </div>

      {/* Current document URL debug */}
      <div className="rounded-lg bg-gray-50 px-4 py-2 text-xs text-gray-500">
        Loading:{" "}
        <span className="font-medium text-gray-700">
          {current.url}
        </span>
      </div>

      {/* Viewer */}
      <div
        ref={viewerRef}
        className="mx-auto max-w-[1000px] rounded-xl border border-gray-200 bg-gray-100 p-3"
      >
        {pdfError ? (
          <div className="rounded-lg bg-red-50 p-8 text-center">
            <h3 className="font-semibold text-red-700">
              PDF could not be loaded
            </h3>

            <p className="mt-2 text-sm text-red-600">
              {pdfError}
            </p>

            <p className="mt-4 text-xs text-gray-500">
              File:
            </p>

            <p className="break-all text-xs text-gray-700">
              {current.url}
            </p>
          </div>
        ) : (
          <Document
            key={`${campus}-${active}`}
            file={current.url}
            onLoadSuccess={handlePDFSuccess}
            onLoadError={handlePDFError}
            loading={
              <div className="py-20 text-center">
                <div className="text-sm text-gray-500">
                  Loading PDF...
                </div>

                <div className="mt-2 text-xs text-gray-400">
                  {current.url}
                </div>
              </div>
            }
          >
            {numPages &&
              Array.from(
                { length: numPages },
                (_, index) => (
                  <div
                    key={`page-${index + 1}`}
                    className="relative mb-4 overflow-hidden bg-white shadow"
                  >
                    <Page
                      pageNumber={index + 1}
                      width={width}
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                    />

                    {/* Watermark */}
                    <div className="pointer-events-none absolute inset-0 grid grid-cols-2 grid-rows-6 place-items-center overflow-hidden opacity-[0.08]">
                      {Array.from(
                        { length: 12 }
                      ).map((_, i) => (
                        <span
                          key={i}
                          className="whitespace-nowrap text-lg font-bold text-gray-900"
                          style={{
                            transform:
                              "rotate(-30deg)",
                          }}
                        >
                          {watermark}
                        </span>
                      ))}
                    </div>

                    {/* Page number */}
                    <div className="absolute bottom-2 right-2 rounded bg-white/80 px-2 py-1 text-[10px] text-gray-500">
                      Page {index + 1} / {numPages}
                    </div>
                  </div>
                )
              )}
          </Document>
        )}
      </div>
    </div>
  );
}