// hooks/useOdFormUpload.js
import { useState } from "react";
import toast from "react-hot-toast";
import { API_BASE_URL } from "../../config/api";

export function useOdFormUpload() {
  const [loading, setLoading] = useState(false);

  const uploadOdForm = async ({ photo, receipt, studentId, reason }) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("photo", photo);
      if (receipt) formData.append("receipt", receipt);
      formData.append("studentId", studentId);
      formData.append("feeType", reason);

      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/fee-reciepts/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData, // ← Don't set Content-Type; browser sets multipart boundary
      });

      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      toast.success("OD form submitted successfully");
      return data;
    } catch (err) {
      toast.error(err.message || "Upload failed");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { uploadOdForm, loading };
}