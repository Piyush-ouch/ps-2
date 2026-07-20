"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  CheckCircle,
  XCircle,
  ShieldCheck,
  Calendar,
  AlertTriangle,
  FileText,
  User,
  Loader2,
  ExternalLink,
} from "lucide-react";
import axios from "axios";

interface AdminVerificationModalProps {
  document: any;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void;
}

export default function AdminVerificationModal({
  document: doc,
  isOpen,
  onClose,
  onUpdate,
}: AdminVerificationModalProps) {
  const [aadhaarStatus, setAadhaarStatus] = useState<"pending" | "approved" | "rejected">(
    doc?.aadhaarStatus || "pending"
  );
  const [licenseStatus, setLicenseStatus] = useState<"pending" | "approved" | "rejected">(
    doc?.licenseStatus || "pending"
  );
  const [rcStatus, setRcStatus] = useState<"pending" | "approved" | "rejected">(
    doc?.rcStatus || "pending"
  );

  const [rejectionReason, setRejectionReason] = useState(doc?.rejectionReason || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !doc) return null;

  const handleVerify = async () => {
    setLoading(true);
    setError(null);
    try {
      await axios.post("/api/admin/documents", {
        documentId: doc._id,
        aadhaarStatus,
        licenseStatus,
        rcStatus,
        rejectionReason,
      });

      if (onUpdate) onUpdate();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update verification status.");
    } finally {
      setLoading(false);
    }
  };

  const isLicenseExpired = doc.isLicenseExpired || (doc.licenseExpiryDate && new Date(doc.licenseExpiryDate) < new Date());
  const isRcExpired = doc.isRcExpired || (doc.rcExpiryDate && new Date(doc.rcExpiryDate) < new Date());

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl text-white max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                Admin Verification Workflow
              </span>
              <h2 className="text-xl font-bold text-white mt-0.5">
                Driver Document Review
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-900"
            >
              <X size={20} />
            </button>
          </div>

          {/* Driver Summary */}
          <div className="mt-4 bg-zinc-900 rounded-2xl p-4 flex items-center gap-4 border border-zinc-800">
            <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center flex-shrink-0">
              <User size={24} className="text-zinc-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-base truncate">
                {doc.owner?.name || "Driver Partner"}
              </p>
              <p className="text-zinc-400 text-xs truncate">
                {doc.owner?.email} • {doc.owner?.mobileNumber || "No phone"}
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-zinc-800 text-amber-400 border border-amber-400/20">
                {doc.status}
              </span>
            </div>
          </div>

          {/* Background Check Card */}
          <div className="mt-4 bg-slate-900 rounded-2xl p-4 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider">
                <ShieldCheck size={16} />
                Background Verification Engine
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
                {doc.backgroundCheckStatus || "not_started"}
              </span>
            </div>
            {doc.backgroundCheckReference && (
              <p className="text-xs text-slate-400">
                Ref ID: <span className="text-slate-200 font-mono">{doc.backgroundCheckReference}</span>
              </p>
            )}
            {doc.backgroundCheckNotes && (
              <p className="text-xs text-slate-300 italic">{doc.backgroundCheckNotes}</p>
            )}
          </div>

          {/* Granular Per-Document Verification */}
          <div className="mt-6 space-y-4">
            <h3 className="text-sm font-bold text-zinc-300">
              Document Checks & Expiry Status
            </h3>

            {/* Aadhaar */}
            <DocRow
              title="Aadhaar / ID Proof"
              number={doc.aadhaarNumber || "Not provided"}
              url={doc.aadhaarUrl}
              status={aadhaarStatus}
              setStatus={setAadhaarStatus}
            />

            {/* Driving License */}
            <DocRow
              title="Driving License"
              number={doc.licenseNumber || "Not provided"}
              expiry={doc.licenseExpiryDate}
              isExpired={isLicenseExpired}
              url={doc.licenseUrl}
              status={licenseStatus}
              setStatus={setLicenseStatus}
            />

            {/* Vehicle RC */}
            <DocRow
              title="Registration Certificate (RC)"
              number={doc.rcNumber || "Not provided"}
              expiry={doc.rcExpiryDate}
              isExpired={isRcExpired}
              url={doc.rcUrl}
              status={rcStatus}
              setStatus={setRcStatus}
            />
          </div>

          {/* Rejection Reason Input */}
          {(aadhaarStatus === "rejected" || licenseStatus === "rejected" || rcStatus === "rejected") && (
            <div className="mt-4">
              <label className="text-xs font-semibold text-rose-400 block mb-1">
                Rejection Reason / Notes
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Specify rejection details for the driver..."
                rows={2}
                className="w-full bg-zinc-900 border border-rose-500/30 rounded-xl p-3 text-xs text-zinc-200 focus:outline-none"
              />
            </div>
          )}

          {error && (
            <div className="mt-4 bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 text-xs text-rose-400 flex items-center gap-2">
              <AlertTriangle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-6 flex gap-3 pt-4 border-t border-zinc-800">
            <button
              onClick={onClose}
              className="flex-1 bg-zinc-900 border border-zinc-800 text-zinc-300 py-3 rounded-xl text-xs font-bold hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              onClick={handleVerify}
              disabled={loading}
              className="flex-1 bg-amber-400 hover:bg-amber-300 text-zinc-950 py-3 rounded-xl text-xs font-bold transition-all shadow-lg flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Verification</span>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function DocRow({
  title,
  number,
  expiry,
  isExpired,
  url,
  status,
  setStatus,
}: {
  title: string;
  number: string;
  expiry?: Date;
  isExpired?: boolean;
  url?: string;
  status: "pending" | "approved" | "rejected";
  setStatus: (s: "pending" | "approved" | "rejected") => void;
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <FileText size={16} className="text-amber-400" />
          <h4 className="text-sm font-bold text-white">{title}</h4>
          {url && (
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-amber-400 hover:underline flex items-center gap-0.5 ml-1"
            >
              View Document <ExternalLink size={12} />
            </a>
          )}
        </div>
        <p className="text-xs text-zinc-400">
          No: <span className="text-zinc-200 font-mono">{number}</span>
        </p>
        {expiry && (
          <p className="text-[11px] text-zinc-500 flex items-center gap-1">
            <Calendar size={12} /> Expiry: {new Date(expiry).toLocaleDateString()}
            {isExpired && (
              <span className="text-rose-400 font-bold ml-1">(Expired)</span>
            )}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => setStatus("approved")}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all ${
            status === "approved"
              ? "bg-emerald-500 text-zinc-950 shadow-md font-bold"
              : "bg-zinc-800 text-zinc-400 hover:text-white"
          }`}
        >
          <CheckCircle size={14} /> Approve
        </button>

        <button
          onClick={() => setStatus("rejected")}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all ${
            status === "rejected"
              ? "bg-rose-500 text-white shadow-md font-bold"
              : "bg-zinc-800 text-zinc-400 hover:text-white"
          }`}
        >
          <XCircle size={14} /> Reject
        </button>
      </div>
    </div>
  );
}
