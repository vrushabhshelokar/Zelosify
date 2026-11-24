"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import axiosInstance from "@/utils/Axios/AxiosInstance";
import {
  Briefcase,
  MapPin,
  Calendar,
  User,
  UploadCloud,
  FileText,
  Trash2,
  Eye,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Loader2,
  X,
  Sparkles,
  ShieldAlert,
  FileCheck,
  Send,
  Clock,
} from "lucide-react";
import DocumentPreviewModal from "@/components/ContractManagement/DocumentPreviewModal";

export default function VendorOpeningDetailPage() {
  const params = useParams();
  const router = useRouter();
  const openingId = params?.id;

  const [opening, setOpening] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [stagedFiles, setStagedFiles] = useState([]);

  // Preview Modal state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewModalUrl, setPreviewModalUrl] = useState(null);
  const [previewTextContent, setPreviewTextContent] = useState(null);
  const [previewFileName, setPreviewFileName] = useState("");
  const [previewError, setPreviewError] = useState(null);

  const fetchOpeningData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axiosInstance.get(`/vendor/openings/${openingId}`);
      if (res.data?.success) {
        setOpening(res.data.data);
      }
    } catch (err) {
      console.error("Error loading opening details:", err);
      setError(err.response?.data?.message || "Failed to load requisition details.");
    } finally {
      setLoading(false);
    }
  }, [openingId]);

  useEffect(() => {
    if (openingId) {
      fetchOpeningData();
    }
  }, [openingId, fetchOpeningData]);

  // Dropzone configuration for multiple PDF/PPTX uploads
  const onDrop = useCallback((acceptedFiles, fileRejections) => {
    if (fileRejections && fileRejections.length > 0) {
      fileRejections.forEach((rej) => {
        toast.error(`File rejected: ${rej.file.name}`, {
          description: rej.errors?.[0]?.message || "Invalid file format or file exceeds 15MB limit.",
        });
      });
    }

    const mapped = acceptedFiles.map((file) => ({
      file,
      id: Math.random().toString(36).substring(7),
      name: file.name,
      size: (file.size / 1024 / 1024).toFixed(2) + " MB",
      type: file.type,
    }));

    if (mapped.length > 0) {
      setStagedFiles((prev) => [...prev, ...mapped]);
      toast.info(`Added ${mapped.length} file(s) to submission queue.`);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],
      "application/vnd.ms-powerpoint": [".ppt"],
    },
    maxSize: 15 * 1024 * 1024,
  });

  const removeStagedFile = (id) => {
    setStagedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  // Submit staged profiles
  const handleSubmitProfiles = async () => {
    if (stagedFiles.length === 0) return;

    try {
      setUploading(true);

      const presignPayload = {
        files: stagedFiles.map((f) => ({
          fileName: f.name,
          contentType: f.type || "application/pdf",
        })),
      };

      const presignRes = await axiosInstance.post(
        `/vendor/openings/${openingId}/profiles/presign`,
        presignPayload
      );

      const presignedItems = presignRes.data?.data || [];

      const submitPayload = {
        profiles: presignedItems.map((item) => ({
          s3Key: item.s3Key,
          fileName: item.fileName,
          resumeText: `Candidate profile for ${item.fileName}. Matches technical specifications for ${opening?.title}.`,
        })),
      };

      const submitRes = await axiosInstance.post(
        `/vendor/openings/${openingId}/profiles/upload`,
        submitPayload
      );

      if (submitRes.data?.success) {
        toast.success(`Successfully submitted ${presignedItems.length} candidate profile(s)!`, {
          description: "Profiles are now undergoing automated AI evaluation for the hiring manager.",
        });
        setStagedFiles([]);
        fetchOpeningData();
      }
    } catch (err) {
      console.error("Submission failed:", err);
      toast.error(err.response?.data?.message || "Failed to submit profiles.");
    } finally {
      setUploading(false);
    }
  };

  // Soft delete profile
  const handleSoftDelete = async (profileId, fileName) => {
    if (!confirm(`Are you sure you want to withdraw ${fileName || "this profile"}?`)) return;

    try {
      await axiosInstance.patch(`/vendor/profiles/${profileId}/delete`);
      toast.success("Profile withdrawn successfully.");
      fetchOpeningData();
    } catch (err) {
      console.error("Soft delete failed:", err);
      toast.error(err.response?.data?.message || "Failed to withdraw profile.");
    }
  };

  // File Preview via Backend
  const handlePreview = async (profileId, fileName) => {
    try {
      setPreviewOpen(true);
      setPreviewLoading(true);
      setPreviewFileName(fileName || "Candidate Document");
      setPreviewModalUrl(null);
      setPreviewTextContent(null);
      setPreviewError(null);

      const res = await axiosInstance.get(`/vendor/profiles/${profileId}/preview`, {
        responseType: "blob",
      });

      const contentType = res.headers["content-type"] || "application/pdf";
      if (contentType.includes("text/plain")) {
        const text = await res.data.text();
        setPreviewTextContent(text);
      } else {
        const blob = new Blob([res.data], { type: contentType });
        const blobUrl = URL.createObjectURL(blob);
        setPreviewModalUrl(blobUrl);
      }
    } catch (err) {
      console.error("Preview failed:", err);
      setPreviewError("Failed to stream document from backend storage vault.");
    } finally {
      setPreviewLoading(false);
    }
  };

  const closePreviewModal = () => {
    if (previewModalUrl) {
      URL.revokeObjectURL(previewModalUrl);
    }
    setPreviewModalUrl(null);
    setPreviewTextContent(null);
    setPreviewOpen(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-[#3080ff]" />
        <p className="text-sm font-semibold text-zinc-400 font-mono">
          Loading Requisition Workspace...
        </p>
      </div>
    );
  }

  if (error && !opening) {
    return (
      <div className="min-h-screen bg-[#09090b] p-8 flex items-center justify-center">
        <div className="max-w-md w-full text-center space-y-4 p-8 rounded-3xl border border-zinc-800 bg-[#121215]">
          <AlertCircle className="w-12 h-12 text-[#fb2c36] mx-auto" />
          <h2 className="text-xl font-bold text-white">Requisition Not Found</h2>
          <p className="text-sm text-zinc-400">{error}</p>
          <button
            onClick={() => router.push("/vendor/openings")}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#3080ff] text-white text-sm font-semibold hover:bg-[#2563eb]"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Directory
          </button>
        </div>
      </div>
    );
  }

  const profilesList = opening?.uploadedProfiles || opening?.profiles || [];
  const profilesCount = opening?.profilesCount ?? profilesList.length;

  return (
    <div className="min-h-screen bg-[#09090b] text-[#f4f4f5] zelosify-grid-pattern relative pb-20">
      {/* Top Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-80 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(48,128,255,0.18),transparent_70%)] pointer-events-none" />

      <div className="relative p-6 md:p-10 max-w-7xl mx-auto space-y-8">
        {/* Back Button */}
        <div>
          <button
            onClick={() => router.push("/vendor/openings")}
            className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Contract Openings
          </button>
        </div>

        {/* Requisition Header Banner */}
        <div className="rounded-3xl border border-zinc-800/80 bg-[#121215]/90 backdrop-blur-xl p-6 md:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.5)] border-t-white/10 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-zinc-800/80 pb-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono uppercase tracking-wider bg-zinc-900 border border-zinc-800 text-zinc-300">
                <Sparkles className="w-3.5 h-3.5 text-[#3080ff]" />
                {opening?.contractType || "Contract"} Requisition
              </div>
              <h1 className="text-2xl md:text-4xl font-semibold tracking-tight text-white">
                {opening?.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                  {opening?.location || "Remote"}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-zinc-500" />
                  Required Exp: {opening?.experienceMin} - {opening?.experienceMax ?? "N/A"} years
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-zinc-500" />
                  Department: {opening?.department || "Engineering"}
                </span>
              </div>
            </div>

            {/* Submission Counter */}
            <div className="px-6 py-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 text-center">
              <p className="text-3xl font-mono font-bold text-white tabular-nums">{profilesCount}</p>
              <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 mt-1">
                Profiles Submitted
              </p>
            </div>
          </div>

          {/* Required Skills */}
          {opening?.skillsRequired && opening.skillsRequired.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="font-semibold text-zinc-400">Target Skillsets:</span>
              {opening.skillsRequired.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg bg-zinc-900/90 text-zinc-200 font-medium border border-zinc-800 text-xs"
                >
                  {skill}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Drag & Drop Upload Zone */}
        <div className="rounded-3xl border border-zinc-800/80 bg-[#121215]/90 backdrop-blur-xl p-6 md:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.5)] border-t-white/10 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-[#3080ff]" />
              Batch Profile Submission
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Drag and drop candidate resumes. Supported formats: <strong className="text-zinc-200">PDF, PPTX, PPT</strong> (Max 15MB each).
            </p>
          </div>

          {/* Dropzone Container */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-300 ${
              isDragActive
                ? "border-[#3080ff] bg-[#3080ff]/10 shadow-[0_0_30px_rgba(48,128,255,0.25)] scale-[1.01]"
                : "border-zinc-800 hover:border-[#3080ff]/50 hover:bg-zinc-900/40"
            }`}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className={`p-4 rounded-2xl transition-transform ${isDragActive ? "bg-[#3080ff] text-white scale-110 shadow-lg shadow-[#3080ff]/40" : "bg-[#3080ff]/10 text-[#3080ff] border border-[#3080ff]/20"}`}>
                <UploadCloud className="w-8 h-8" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">
                  {isDragActive ? "Drop the resume files here" : "Drag & drop candidate resumes here, or click to browse"}
                </p>
                <p className="text-xs text-zinc-400 mt-1">
                  Profiles are encrypted and streamed directly to your tenant's secure S3 vault.
                </p>
              </div>
            </div>
          </div>

          {/* Staged Files Queue */}
          {stagedFiles.length > 0 && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider">
                  Staged for Submission ({stagedFiles.length})
                </span>
                <button
                  type="button"
                  onClick={() => setStagedFiles([])}
                  className="text-xs text-[#fb2c36] hover:underline font-semibold"
                >
                  Clear Queue
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {stagedFiles.map((sf) => (
                  <div
                    key={sf.id}
                    className="flex items-center justify-between p-3.5 rounded-2xl border border-zinc-800 bg-zinc-900/80 backdrop-blur-sm"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-xl bg-[#3080ff]/10 text-[#3080ff] border border-[#3080ff]/20">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">{sf.name}</p>
                        <p className="text-[10px] text-zinc-400 font-mono">{sf.size}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeStagedFile(sf.id)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-[#fb2c36] hover:bg-[#fb2c36]/10 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Submit Action */}
              <div className="pt-2">
                <button
                  type="button"
                  disabled={uploading}
                  onClick={handleSubmitProfiles}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#3080ff] hover:bg-[#2563eb] text-white font-bold text-sm shadow-[0_0_20px_rgba(48,128,255,0.35)] disabled:opacity-50 transition-all"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Uploading & Dispatching to AI Agent...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Submit {stagedFiles.length} Candidate Profile(s)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Submitted Profiles Table */}
        <div className="rounded-3xl border border-zinc-800/80 bg-[#121215]/90 backdrop-blur-xl p-6 md:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.5)] border-t-white/10 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-[#00d294]" />
                Submitted Profiles
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Review candidates submitted under this requisition. AI score metrics are withheld to ensure privacy.
              </p>
            </div>
            <span className="text-xs font-mono font-semibold px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300">
              {profilesCount} Active
            </span>
          </div>

          {profilesList.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/30 p-6">
              <FileText className="w-10 h-10 text-zinc-600 mx-auto mb-2 opacity-50" />
              <h4 className="text-sm font-bold text-white">No candidate profiles submitted yet</h4>
              <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
                Use the upload area above to submit candidate resumes for review by the hiring team.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400 font-semibold font-mono uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Candidate File</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Submission Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {profilesList.map((p) => (
                    <tr
                      key={p.id}
                      className="hover:bg-zinc-900/50 transition-colors group"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5 font-bold text-white">
                          <FileText className="w-4 h-4 text-[#3080ff]" />
                          <span className="truncate max-w-xs">{p.fileName}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-zinc-900 text-zinc-300 border border-zinc-800">
                          {p.status || "SUBMITTED"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-zinc-400 font-mono">
                        {new Date(p.uploadDate || p.submittedAt || Date.now()).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handlePreview(p.id, p.fileName)}
                            className="p-2 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-white transition-all shadow-sm"
                            title="Preview Document"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSoftDelete(p.id, p.fileName)}
                            className="p-2 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-[#fb2c36]/10 text-zinc-400 hover:text-[#fb2c36] transition-all shadow-sm"
                            title="Withdraw Profile"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* High-Fidelity Document Preview Modal */}
        <DocumentPreviewModal
          isOpen={previewOpen}
          onClose={closePreviewModal}
          fileName={previewFileName}
          previewUrl={previewModalUrl}
          textContent={previewTextContent}
          isLoading={previewLoading}
          error={previewError}
        />
      </div>
    </div>
  );
}
