import { useEffect, useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { API_BASE_URL } from "../../../config/api";

// Module-level cache so the same empId is never fetched twice,
// even across re-sorts/re-filters that remount cards.
const imageCache = new Map(); // empId -> objectURL | "ERROR"
const inFlight = new Map(); // empId -> Promise

// Cross-instance sync: when one EmployeeAvatar (e.g. the modal) uploads a
// new photo, every other mounted instance for the same empId (e.g. the
// grid card) updates too, without needing a shared parent/context.
const listeners = new Map(); // empId -> Set<(url) => void>

const notify = (empId, url) => {
  listeners.get(empId)?.forEach((fn) => fn(url));
};

const AVATAR_COLORS = [
  "bg-indigo-100 text-indigo-700 ring-indigo-200",
  "bg-emerald-100 text-emerald-700 ring-emerald-200",
  "bg-rose-100 text-rose-700 ring-rose-200",
  "bg-amber-100 text-amber-700 ring-amber-200",
  "bg-cyan-100 text-cyan-700 ring-cyan-200",
  "bg-purple-100 text-purple-700 ring-purple-200",
];

const getInitials = (name = "") =>
  name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

const avatarColor = (id = "") =>
  id ? AVATAR_COLORS[id.charCodeAt(id.length - 1) % AVATAR_COLORS.length] : AVATAR_COLORS[0];

/**
 * Drop-in avatar: shows colored initials immediately, swaps in the real
 * photo once it loads (only fetched when the card is actually visible).
 *
 * Props:
 *  - empId, name: same as before
 *  - token: JWT (pass user's authToken; omit if endpoint is public)
 *  - size: tailwind size classes, defaults to card size (include rounded-* here)
 *  - editable: shows a camera overlay to upload a new photo (used in the modal)
 */
const EmployeeAvatar = ({ empId, name, token, size = "w-10 h-10 text-sm rounded-xl", editable = false }) => {
  const [src, setSrc] = useState(() =>
    imageCache.has(empId) && imageCache.get(empId) !== "ERROR" ? imageCache.get(empId) : null
  );
  const [failed, setFailed] = useState(() => imageCache.get(empId) === "ERROR");
  const [uploading, setUploading] = useState(false);
  const ref = useRef(null);
  const fileInputRef = useRef(null);

  // Subscribe to cache updates for this empId (covers uploads from other instances).
  useEffect(() => {
    if (!empId) return;
    const setter = (url) => {
      setSrc(url);
      setFailed(false);
    };
    if (!listeners.has(empId)) listeners.set(empId, new Set());
    listeners.get(empId).add(setter);
    return () => listeners.get(empId)?.delete(setter);
  }, [empId]);



  const loadImage = async () => {
    if (imageCache.has(empId)) {
      const cached = imageCache.get(empId);
      if (cached === "ERROR") setFailed(true);
      else setSrc(cached);
      return;
    }

    if (inFlight.has(empId)) {
      const url = await inFlight.get(empId);
      if (url === "ERROR") setFailed(true);
      else setSrc(url);
      return;
    }

    const promise = (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/image/${empId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error("no image");
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        imageCache.set(empId, url);
        return url;
      } catch {
        imageCache.set(empId, "ERROR");
        return "ERROR";
      } finally {
        inFlight.delete(empId);
      }
    })();

    inFlight.set(empId, promise);
    const url = await promise;
    if (url === "ERROR") setFailed(true);
    else setSrc(url);
  };
  useEffect(() => {
    if (!empId || src || failed) return;

    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          observer.disconnect();
          loadImage();
        }
      },
      { rootMargin: "100px" } // start fetching just before it scrolls into view
    );
    observer.observe(el);

    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empId]);
  const handlePickFile = (e) => {
    e.stopPropagation(); // avoid triggering a card's onClick (opens the modal)
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow picking the same file again later
    if (!file || !empId) return;

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/uploadProfile/${empId}`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        // NOTE: do not set Content-Type manually — the browser sets the
        // multipart boundary itself when the body is a FormData instance.
        body: formData,
      });
      if (!res.ok) throw new Error(`Upload failed: ${res.status}`);

      // Optimistic preview: show the picked file immediately instead of
      // re-fetching from the server.
      const previewUrl = URL.createObjectURL(file);
      imageCache.set(empId, previewUrl);
      setSrc(previewUrl);
      setFailed(false);
      notify(empId, previewUrl); // sync any other avatar showing this empId

      toast.success("Profile photo updated");
    } catch (err) {
      toast.error(err.message || "Failed to upload photo");
    } finally {
      setUploading(false);
    }
  };

  const overlay = editable && (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      <button
        type="button"
        onClick={handlePickFile}
        disabled={uploading}
        className="absolute -bottom-1 -right-1 w-6 h-6 flex items-center justify-center rounded-full bg-[#3D7DFC] text-white shadow-md ring-2 ring-white hover:bg-blue-600 transition-colors disabled:opacity-60"
        title="Change photo"
      >
        {uploading ? <Loader2 size={12} className="animate-spin" /> : <Camera size={12} />}
      </button>
    </>
  );

  if (src) {
    return (
      <div className="relative inline-flex shrink-0">
        <img
          ref={ref}
          src={src}
          alt={name}
          className={`${size} object-cover ring-1 ring-slate-200 ${uploading ? "opacity-60" : ""}`}
        />
        {overlay}
      </div>
    );
  }

  return (
    <div className="relative inline-flex shrink-0">
      <div
        ref={ref}
        className={`${size} flex items-center justify-center font-semibold ${avatarColor(empId)} ${uploading ? "opacity-60" : ""}`}
      >
        {getInitials(name)}
      </div>
      {overlay}
    </div>
  );
};

export default EmployeeAvatar;
