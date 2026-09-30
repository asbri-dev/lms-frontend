import { useState } from "react";
import toast from "react-hot-toast";

import { useOdFormUpload } from "./useOdFormUpload";

export default function OdForm()  {
  const { uploadOdForm, getFileUrl, loading } = useOdFormUpload();

  const [photo, setPhoto] = useState(null);
  const [receipt, setReceipt] = useState(null);

  const [studentId, setStudentId] = useState("");
  const [reason, setReason] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!photo) {
      toast.error("Please select a photo");
      return;
    }

    try {
      await uploadOdForm({
        photo,
        receipt,
        studentId,
        reason,
      });

      // Clear form after successful upload
      setPhoto(null);
      setReceipt(null);
      setStudentId("");
      setReason("");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">

      {/* =========================
          UPLOAD FORM
      ========================== */}

      <div className="bg-white rounded-xl shadow p-6">

        <h2 className="text-xl font-semibold mb-6">
          Submit OD Form
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Student ID */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Student ID
            </label>

            <input
              type="text"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="w-full border rounded-lg px-4 py-2"
              placeholder="Enter student ID"
            />
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Reason
            </label>

            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full border rounded-lg px-4 py-2"
              rows={4}
              placeholder="Enter OD reason"
            />
          </div>

          {/* Photo */}
          <div>
            <label className="block text-sm font-medium mb-2">
              OD Photo
            </label>

            <input
              type="file"
              accept="image/*"
              onChange={(e) => setPhoto(e.target.files[0])}
              className="w-full"
            />
          </div>

          {/* Receipt */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Receipt
            </label>

            <input
              type="file"
              accept="application/pdf,image/*"
              onChange={(e) => setReceipt(e.target.files[0])}
              className="w-full"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Uploading..." : "Submit OD Form"}
          </button>

        </form>
      </div>


      {/* =========================
          FILE PREVIEW
      ========================== */}

      {/* Example paths returned from backend */}

      {/* 
        Replace these with your actual backend values:

        photoPath:
        fee-reciepts/OD123/photo.jpg

        receiptPath:
        fee-reciepts/OD123/receipt.pdf
      */}

      {/*
      <div className="bg-white rounded-xl shadow p-6 mt-6">

        <h3 className="font-semibold mb-4">
          Uploaded Files
        </h3>

        <img
          src={getFileUrl(photoPath)}
          alt="OD Photo"
          className="w-full max-h-96 object-contain rounded-lg"
        />

        <a
          href={getFileUrl(receiptPath)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-4 text-blue-600 underline"
        >
          View Receipt
        </a>

      </div>
      */}

    </div>
  );
}
