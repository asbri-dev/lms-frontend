import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

import { API_BASE_URL } from "../../config/api";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

/* =========================================================
 * PDF FILES  (public/documents/...)
 * =========================================================
 * - Code of Conduct is the same for both campuses.
 * - Leave & Resignation Policy is different per campus.
 *
 * Bump PDF_VERSION whenever you replace a PDF so browsers
 * do not show a cached old copy.
 */

const PDF_VERSION = "1"; 
const DOCS_BASE = `${import.meta.env.BASE_URL}documents`;

const withVersion = (file) => `${DOCS_BASE}/${file}?v=${PDF_VERSION}`;

const CODE_OF_CONDUCT_PDF = withVersion("code-of-conduct.pdf");

const LEAVE_POLICY_PDF = {
  CHITTOOR: withVersion("chittoor-leave-policy.pdf"),
  PALAKKAD: withVersion("palakkad-leave-policy.pdf"),
};

/* =========================================================
 * ICONS
 * ========================================================= */

const iconProps = {
  viewBox: "0 0 20 20",
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": "true",
};

const CheckIcon = ({ className = "h-3.5 w-3.5" }) => (
  <svg {...iconProps} strokeWidth="3" className={className}>
    <path d="M4 10.5l4 4 8-9" />
  </svg>
);

const ArrowDownIcon = ({ className = "h-4 w-4" }) => (
  <svg {...iconProps} strokeWidth="2" className={className}>
    <path d="M10 4v12M5 11l5 5 5-5" />
  </svg>
);

const ExternalIcon = ({ className = "h-4 w-4" }) => (
  <svg {...iconProps} strokeWidth="1.8" className={className}>
    <path d="M8 4H5a1 1 0 00-1 1v10a1 1 0 001 1h10a1 1 0 001-1v-3M12 4h4v4M16 4l-7 7" />
  </svg>
);

/* =========================================================
 * PDF PAGE  (renders one page into a canvas)
 * ========================================================= */

const PdfPage = ({ pdf, pageNumber, width, size }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!width) return undefined;

    let cancelled = false;
    let renderTask = null;

    (async () => {
      try {
        const page = await pdf.getPage(pageNumber);
        if (cancelled) return;

        const base = page.getViewport({ scale: 1 });
        const cssScale = width / base.width;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const viewport = page.getViewport({ scale: cssScale * dpr });
    
        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        renderTask = page.render({
          canvasContext: canvas.getContext("2d"),
          viewport,
        });

        await renderTask.promise;
      } catch (err) {
        if (err?.name !== "RenderingCancelledException") {
          console.error(`Failed to render page ${pageNumber}:`, err);
        }
      }
    })();

    return () => {
      cancelled = true;
      if (renderTask) renderTask.cancel();
    };
  }, [pdf, pageNumber, width]);

  return (
    <div
      className="w-full overflow-hidden bg-white shadow-sm md:rounded-md md:border md:border-slate-200 md:shadow-md"
      // Reserve the exact height up front so scroll tracking is correct
      // even before the page is drawn.
      style={{ aspectRatio: `${size.width} / ${size.height}` }}
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
};

/* =========================================================
 * PDF VIEWER
 * ========================================================= */

const PdfViewer = ({ url, onLoaded, onFallbackOpened }) => {
  const wrapperRef = useRef(null);

  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [pdf, setPdf] = useState(null);
  const [sizes, setSizes] = useState([]);
  const [width, setWidth] = useState(0);
  const [attempt, setAttempt] = useState(0);

  /* Load the PDF and read every page size */
  useEffect(() => {
    let cancelled = false;
    const loadingTask = pdfjsLib.getDocument({ url });

    setStatus("loading");
    setPdf(null);
    setSizes([]);

    (async () => {
      try {
        const doc = await loadingTask.promise;
        const pageSizes = [];

        for (let i = 1; i <= doc.numPages; i += 1) {
          const page = await doc.getPage(i);
          const viewport = page.getViewport({ scale: 1 });
          pageSizes.push({ width: viewport.width, height: viewport.height });
        }

        if (cancelled) return;

        setPdf(doc);
        setSizes(pageSizes);
        setStatus("ready");
      } catch (err) {
        if (cancelled) return;
        console.error("Failed to load PDF:", url, err);
        setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
      loadingTask.destroy();
    };
  }, [url, attempt]);

  /* Track available width (debounced) so pages are sharp at any size */
  useEffect(() => {
    const element = wrapperRef.current;
    if (!element) return undefined;

    let timer = null;

    const update = () => {
      setWidth(Math.floor(element.getBoundingClientRect().width));
    };

    update();

    const observer = new ResizeObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(update, 120);
    });

    observer.observe(element);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [status]);

  /* Tell the parent when the layout height is known */
  useEffect(() => {
    if (status === "ready" && onLoaded) {
      const frame = requestAnimationFrame(onLoaded);
      return () => cancelAnimationFrame(frame);
    }
    return undefined;
  }, [status, onLoaded, width]);

  if (status === "loading") {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-slate-500">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-[#2b3c6b]" />
        <p className="text-sm font-medium">Loading document…</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="mx-4 my-10 rounded-xl border border-red-200 bg-white p-6 text-center shadow-sm md:mx-auto md:max-w-md">
        <p className="text-base font-semibold text-slate-900">
          The document could not be loaded
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Check your internet connection and try again, or open the PDF in a
          new tab and read it there.
        </p>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => setAttempt((n) => n + 1)}
            className="rounded-lg bg-[#2b3c6b] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#3f548f]"
          >
            Try again
          </button>

          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onFallbackOpened}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Open PDF
            <ExternalIcon />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className="flex w-full flex-col gap-3 md:gap-5">
      {sizes.map((size, index) => (
        <PdfPage
          key={index}
          pdf={pdf}
          pageNumber={index + 1}
          width={width}
          size={size}
        />
      ))}
    </div>
  );
};

/* =========================================================
 * MAIN COMPONENT
 * ========================================================= */

const FacultyAcknowledgement = ({ employeeId, featureData, onCompleted }) => {
  const documentRef = useRef(null);

  const [currentIndex, setCurrentIndex] = useState(0);
 // const [checked, setChecked] = useState(false);
  const [hasReachedBottom, setHasReachedBottom] = useState(false);
  const [progress, setProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  /* ---------- Build document list ---------- */

  const documents = useMemo(() => {
    const list = [];

    if (featureData?.codeOfConduct === "false") {
      list.push({
        key: "codeOfConduct",
        shortTitle: "Code of Conduct",
        url: CODE_OF_CONDUCT_PDF,
      });
    }

    if (featureData?.leaveAndResignationPolicy === "false") {
      const location = String(featureData?.collegeLocation || "").toUpperCase();
      const url = LEAVE_POLICY_PDF[location];

      if (url) {
        list.push({
          key: "leaveAndResignationPolicy",
          shortTitle: "Leave & Resignation Policy",
          url,
        });
      }
    }

    return list;
  }, [featureData]);

  const currentDocument = documents[currentIndex];
  const isLast = currentIndex === documents.length - 1;

  /* ---------- Nothing to show -> finish ---------- */

  useEffect(() => {
    if (!documents.length && onCompleted) {
      onCompleted();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documents.length]);

  /* ---------- Lock page scroll behind the modal ---------- */

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  /* ---------- Reset when document changes ---------- */

useEffect(() => {
  setError("");
  setHasReachedBottom(false);
  setProgress(0);

  if (documentRef.current) {
    documentRef.current.scrollTop = 0;
  }
}, [currentIndex]);

  /* ---------- Unlock automatically if the document is shorter than the screen ---------- */

  const checkDocumentHeight = useCallback(() => {
    const element = documentRef.current;
    if (!element) return;

    if (element.scrollHeight <= element.clientHeight + 20) {
      setHasReachedBottom(true);
      setProgress(100);
    }
  }, []);

  /* ---------- Scroll handler ---------- */

  const handleDocumentScroll = (event) => {
    const element = event.currentTarget;
    const scrollable = element.scrollHeight - element.clientHeight;

    if (scrollable > 0) {
      setProgress(
        Math.min(100, Math.round((element.scrollTop / scrollable) * 100))
      );
    }

    if (scrollable - element.scrollTop <= 20) {
      setHasReachedBottom(true);
    }
  };

  /* Used only when the PDF could not load and the person opened it manually */
  const handleFallbackOpened = useCallback(() => {
    setHasReachedBottom(true);
    setProgress(100);
  }, []);

  /* ---------- Acknowledge ---------- */

  const handleAcknowledge = async () => {
    if (!hasReachedBottom) {
      setError("Please scroll to the end of the document.");
      return;
    }

 

    setError("");

    if (!isLast) {
      setCurrentIndex((prev) => prev + 1);
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/faculty/seen`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          empId: employeeId,
          codeOfConduct: true,
          leaveAndResignationPolicy: true,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save acknowledgement.");
      }

      if (onCompleted) {
        onCompleted();
      }
    } catch (err) {
      console.error("Acknowledgement failed:", err);
      setError("Unable to save your acknowledgement. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!documents.length) {
    return null;
  }

  const canSubmit = hasReachedBottom && !submitting;

  /* ---------- UI ---------- */

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-stretch justify-center bg-slate-900/70 backdrop-blur-sm md:items-center md:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ack-title"
    >
      <div className="flex h-[100dvh] w-full max-w-5xl flex-col overflow-hidden bg-white shadow-2xl md:h-[92vh] md:rounded-2xl">
        {/* ================= HEADER ================= */}
        <div className="shrink-0 bg-white">
          <div className="flex items-center justify-between gap-3 px-4 pb-3 pt-4 md:px-6 md:pt-5">
            <div className="min-w-0">
              <h1
                id="ack-title"
                className="truncate text-base font-bold text-[#2b3c6b] md:text-xl"
              >
                Important Faculty Documents
              </h1>
              <p className="mt-0.5 text-xs text-slate-500 md:text-sm">
                Read the document to the end, then confirm to continue.
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">


              <div className="rounded-full bg-[#2b3c6b]/10 px-3 py-1.5 text-xs font-semibold text-[#2b3c6b] md:text-sm">
                {currentIndex + 1} / {documents.length}
              </div>
            </div>
          </div>

          {/* Steps: pills on desktop, current title on mobile */}
          <div className="hidden gap-2 px-6 pb-3 md:flex">
            {documents.map((doc, index) => {
              const done = index < currentIndex;
              const active = index === currentIndex;

              return (
                <div
                  key={doc.key}
                  className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium ${
                    active
                      ? "bg-[#2b3c6b] text-white"
                      : done
                      ? "bg-green-100 text-green-700"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {done ? (
                    <CheckIcon />
                  ) : (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-xs">
                      {index + 1}
                    </span>
                  )}
                  {doc.shortTitle}
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between gap-3 px-4 pb-3 md:hidden">
            <p className="min-w-0 truncate text-sm font-semibold text-slate-800">
              {currentDocument.shortTitle}
            </p>
            <a
              href={currentDocument.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-[#2b3c6b] sm:hidden"
            >
              Open PDF
              <ExternalIcon className="h-3.5 w-3.5" />
            </a>
          </div>

          {/* Reading progress */}
          <div className="h-1 w-full bg-slate-200">
            <div
              className={`h-full transition-[width] duration-150 ${
                hasReachedBottom ? "bg-green-500" : "bg-[#2b3c6b]"
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* ================= DOCUMENT ================= */}
        <div
          ref={documentRef}
          onScroll={handleDocumentScroll}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-slate-200 md:px-6 md:py-6"
        >
          <div className="mx-auto w-full max-w-3xl">
            <PdfViewer
              key={currentDocument.key}
              url={currentDocument.url}
              onLoaded={checkDocumentHeight}
              onFallbackOpened={handleFallbackOpened}
            />

            <div className="flex items-center gap-3 px-5 py-6 text-xs font-medium text-slate-500">
              <span className="h-px flex-1 bg-slate-400/50" />
              End of document
              <span className="h-px flex-1 bg-slate-400/50" />
            </div>
          </div>
        </div>

        {/* ================= FOOTER ================= */}
        <div className="shrink-0 border-t border-slate-200 bg-white px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_24px_-12px_rgba(15,23,42,0.18)] md:px-6 md:pb-4 md:pt-4">
          <div className="mx-auto max-w-3xl">
            <div className="mb-3">
              {hasReachedBottom ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                  <CheckIcon className="h-3 w-3" />
                  You have reached the end
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                  <ArrowDownIcon className="h-3 w-3" />
                  Scroll to the end to continue ({progress}%)
                </span>
              )}
            </div>

            {/* <label
              className={`flex items-start gap-3 rounded-lg border p-3 transition ${
                hasReachedBottom && !submitting
                  ? checked
                    ? "cursor-pointer border-[#2b3c6b] bg-[#2b3c6b]/5"
                    : "cursor-pointer border-slate-300 hover:border-[#2b3c6b]/60"
                  : "cursor-not-allowed border-slate-200 bg-slate-50"
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                disabled={!hasReachedBottom || submitting}
                onChange={(event) => {
                  setChecked(event.target.checked);
                  setError("");
                }}
                className="mt-0.5 h-5 w-5 shrink-0 rounded border-slate-300 text-[#2b3c6b] focus:ring-[#2b3c6b]"
              />

              <span
                className={`text-xs leading-5 md:text-sm ${
                  hasReachedBottom ? "text-slate-700" : "text-slate-400"
                }`}
              >
                I have read and understood this document and agree to comply
                with the policies, rules and requirements mentioned above.
              </span>
            </label> */}

            {error && (
              <p
                role="alert"
                className="mt-2 text-xs font-medium text-red-600 md:text-sm"
              >
                {error}
              </p>
            )}

            <div className="mt-3 flex md:justify-end">
              <button
                type="button"
                onClick={handleAcknowledge}
                disabled={!canSubmit}
                className={`w-full rounded-lg px-6 py-3 text-sm font-semibold text-white transition md:w-auto md:px-8 ${
                  canSubmit
                    ? "bg-[#2b3c6b] hover:bg-[#3f548f] active:scale-[0.98]"
                    : "cursor-not-allowed bg-slate-300"
                }`}
              >
                {submitting
                  ? "Saving..."
                  : !isLast
                  ? "Proceed & Next"
                  : "Proceed & Continue"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacultyAcknowledgement;
