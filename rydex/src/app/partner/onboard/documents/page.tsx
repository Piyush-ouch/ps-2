"use client";

import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  UploadCloud,
  FileCheck,
  CheckCircle,
  Pencil,
  ShieldCheck,
  AlertTriangle,
  Calendar,
  CreditCard,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";

type DocKey = "aadhaar" | "license" | "rc";

export default function PartnerDocumentsPage() {
  const router = useRouter();

  const [docs, setDocs] = useState<Record<DocKey, File | null>>({
    aadhaar: null,
    license: null,
    rc: null,
  });

  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [rcNumber, setRcNumber] = useState("");

  const [licenseExpiryDate, setLicenseExpiryDate] = useState("");
  const [rcExpiryDate, setRcExpiryDate] = useState("");

  const [completed, setCompleted] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const [loading, setLoading] = useState(false);
  const [bgcLoading, setBgcLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bgcResult, setBgcResult] = useState<any>(null);

  /* ================= FETCH EXISTING DOCS & VERIFICATION ================= */

  useEffect(() => {
    axios
      .get("/api/partner/documents")
      .then((res) => {
        if (res.data?.documents) {
          const d = res.data.documents;
          setCompleted(true);
          setAadhaarNumber(d.aadhaarNumber || "");
          setLicenseNumber(d.licenseNumber || "");
          setRcNumber(d.rcNumber || "");

          if (d.licenseExpiryDate) {
            setLicenseExpiryDate(
              new Date(d.licenseExpiryDate).toISOString().split("T")[0]
            );
          }
          if (d.rcExpiryDate) {
            setRcExpiryDate(
              new Date(d.rcExpiryDate).toISOString().split("T")[0]
            );
          }
          if (d.backgroundCheckStatus) {
            setBgcResult({
              status: d.backgroundCheckStatus,
              reference: d.backgroundCheckReference,
              completedAt: d.backgroundCheckCompletedAt,
              notes: d.backgroundCheckNotes,
            });
          }
        }
      })
      .catch(() => {});
  }, []);

  const handleFileChange = (key: DocKey, file: File | null) => {
    if (!file) return;
    setDocs((prev) => ({ ...prev, [key]: file }));
  };

  /* ================= SUBMIT DOCUMENTS ================= */

  const submitDocuments = async () => {
    if (completed && !editMode) {
      router.push("/partner/onboard/bank");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      if (docs.aadhaar) formData.append("aadhaar", docs.aadhaar);
      if (docs.license) formData.append("license", docs.license);
      if (docs.rc) formData.append("rc", docs.rc);

      if (aadhaarNumber) formData.append("aadhaarNumber", aadhaarNumber);
      if (licenseNumber) formData.append("licenseNumber", licenseNumber);
      if (rcNumber) formData.append("rcNumber", rcNumber);

      if (licenseExpiryDate) formData.append("licenseExpiryDate", licenseExpiryDate);
      if (rcExpiryDate) formData.append("rcExpiryDate", rcExpiryDate);

      await axios.post("/api/partner/documents", formData);

      setCompleted(true);
      setEditMode(false);
      router.push("/partner/onboard/bank");
    } catch (err: any) {
      setError(
        err?.response?.data?.message || "Document upload and verification submission failed"
      );
    } finally {
      setLoading(false);
    }
  };

  /* ================= TRIGGER BACKGROUND CHECK ================= */

  const triggerBackgroundCheck = async () => {
    setBgcLoading(true);
    setError(null);
    try {
      const res = await axios.post("/api/partner/background-check");
      setBgcResult(res.data.backgroundCheck);
    } catch (err: any) {
      setError(
        err?.response?.data?.message || "Background check verification failed."
      );
    } finally {
      setBgcLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-2xl bg-white rounded-3xl border border-gray-200 shadow-[0_25px_70px_rgba(0,0,0,0.1)] p-6 sm:p-10"
      >
        {/* ================= HEADER ================= */}
        <div className="relative text-center">
          <button
            onClick={() => router.back()}
            className="absolute left-0 top-0 w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition"
          >
            <ArrowLeft size={18} />
          </button>

          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
            Step 2 of 3 • Verification & Expiry Tracking
          </p>

          <h1 className="text-2xl font-bold mt-1">
            Driver Verification & Documents
          </h1>

          <p className="text-sm text-gray-500 mt-1">
            Upload document proofs, numbers, and expiry details
          </p>

          {completed && !editMode && (
            <div className="mt-4 flex flex-col items-center gap-2">
              <div className="flex items-center gap-2 text-emerald-600 text-sm font-semibold">
                <CheckCircle size={16} />
                Documents Uploaded & Saved
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setEditMode(true)}
                className="text-xs font-semibold text-black underline flex items-center gap-1"
              >
                <Pencil size={12} />
                Edit documents & expiry dates
              </motion.button>
            </div>
          )}
        </div>

        {/* ================= BACKGROUND CHECK STATUS BANNER ================= */}
        <div className="mt-6 bg-slate-900 text-white rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-400/20 text-amber-400">
                <ShieldCheck size={24} />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Automated Background Check
                </p>
                <h4 className="text-sm font-bold text-white mt-0.5">
                  {bgcResult?.status === "passed"
                    ? "Passed & Verified"
                    : bgcResult?.status === "flagged"
                    ? "Flagged for Expiry / Verification"
                    : bgcResult?.status === "failed"
                    ? "Verification Failed"
                    : "Not Verified Yet"}
                </h4>
              </div>
            </div>

            <button
              onClick={triggerBackgroundCheck}
              disabled={bgcLoading}
              className="bg-amber-400 hover:bg-amber-300 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5"
            >
              {bgcLoading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Checking...</span>
                </>
              ) : (
                <span>Run Background Check</span>
              )}
            </button>
          </div>

          {bgcResult?.reference && (
            <div className="mt-3 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex flex-wrap justify-between gap-2">
              <span>Ref: <strong className="text-slate-200">{bgcResult.reference}</strong></span>
              {bgcResult.notes && <span className="text-slate-300">{bgcResult.notes}</span>}
            </div>
          )}
        </div>

        {/* ================= DOCUMENT UPLOAD & DETAILS FORM ================= */}
        <div
          className={`mt-6 space-y-6 ${
            completed && !editMode ? "opacity-60 pointer-events-none" : ""
          }`}
        >
          {/* Aadhaar Section */}
          <div className="border border-gray-200 rounded-2xl p-4 space-y-3">
            <DocUpload
              label="Aadhaar / Identity Proof"
              desc="12-digit Government issued ID"
              file={docs.aadhaar}
              onChange={(f) => handleFileChange("aadhaar", f)}
            />
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">
                Aadhaar Number
              </label>
              <div className="flex items-center gap-2 border rounded-xl px-3 py-2 bg-gray-50">
                <CreditCard size={16} className="text-gray-400" />
                <input
                  type="text"
                  placeholder="e.g. 1234 5678 9012"
                  value={aadhaarNumber}
                  onChange={(e) => setAadhaarNumber(e.target.value)}
                  className="w-full text-sm outline-none bg-transparent"
                />
              </div>
            </div>
          </div>

          {/* License Section */}
          <div className="border border-gray-200 rounded-2xl p-4 space-y-3">
            <DocUpload
              label="Driving License"
              desc="Valid driving license document"
              file={docs.license}
              onChange={(f) => handleFileChange("license", f)}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">
                  License Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. DL-1420110012345"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  className="w-full text-sm outline-none border rounded-xl px-3 py-2 bg-gray-50"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">
                  License Expiry Date
                </label>
                <div className="flex items-center gap-2 border rounded-xl px-3 py-2 bg-gray-50">
                  <Calendar size={16} className="text-gray-400" />
                  <input
                    type="date"
                    value={licenseExpiryDate}
                    onChange={(e) => setLicenseExpiryDate(e.target.value)}
                    className="w-full text-sm outline-none bg-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* RC Section */}
          <div className="border border-gray-200 rounded-2xl p-4 space-y-3">
            <DocUpload
              label="Vehicle RC (Registration Certificate)"
              desc="Vehicle registration certificate document"
              file={docs.rc}
              onChange={(f) => handleFileChange("rc", f)}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">
                  RC Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. MH01AB1234"
                  value={rcNumber}
                  onChange={(e) => setRcNumber(e.target.value)}
                  className="w-full text-sm outline-none border rounded-xl px-3 py-2 bg-gray-50"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">
                  RC Expiry Date
                </label>
                <div className="flex items-center gap-2 border rounded-xl px-3 py-2 bg-gray-50">
                  <Calendar size={16} className="text-gray-400" />
                  <input
                    type="date"
                    value={rcExpiryDate}
                    onChange={(e) => setRcExpiryDate(e.target.value)}
                    className="w-full text-sm outline-none bg-transparent"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECURE STORAGE FOOTER */}
        <div className="mt-6 flex items-start gap-3 text-xs text-gray-500">
          <FileCheck size={16} className="mt-0.5 shrink-0" />
          <p>
            Documents & expiry dates are encrypted, monitored periodically, and verified by our compliance team.
          </p>
        </div>

        {/* ERROR BANNER */}
        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2 text-red-600 text-xs">
            <AlertTriangle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* CTA BUTTON */}
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          disabled={loading}
          onClick={submitDocuments}
          className="mt-8 w-full h-14 rounded-2xl bg-black text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-40 transition shadow-lg"
        >
          {completed && !editMode
            ? "Continue"
            : editMode
            ? "Save & Update Verification"
            : loading
            ? "Uploading..."
            : "Save & Continue"}
          <ArrowRight size={18} />
        </motion.button>
      </motion.div>
    </div>
  );
}

function DocUpload({
  label,
  desc,
  file,
  onChange,
}: {
  label: string;
  desc: string;
  file: File | null;
  onChange: (f: File | null) => void;
}) {
  return (
    <label className="flex items-center justify-between p-3.5 rounded-xl border border-gray-200 cursor-pointer hover:border-black transition">
      <div>
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-xs text-gray-500">{desc}</p>
      </div>

      <div className="flex items-center gap-3">
        {file ? (
          <span className="text-xs text-emerald-600 font-medium">Selected</span>
        ) : (
          <span className="text-xs text-gray-400">Upload File</span>
        )}

        <div className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center">
          <UploadCloud size={16} />
        </div>
      </div>

      <input
        type="file"
        accept="image/*,.pdf"
        hidden
        onChange={(e) => onChange(e.target.files?.[0] || null)}
      />
    </label>
  );
}
