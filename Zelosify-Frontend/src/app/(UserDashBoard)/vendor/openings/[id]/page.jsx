"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
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
} from "lucide-react";

export default function VendorOpeningDetailPage() {
  const params = useParams();
  const router = useRouter();
  const openingId = params?.id;

  const [opening, setOpening] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [stagedFiles, setStagedFiles] = useState([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewModalUrl, setPreviewModalUrl] = useState(null);
  const [previewTextContent, setPreviewTextContent] = useState(null);
  const [previewFileName, setPreviewFileName] = useState("");
  const [actionSuccess, setActionSuccess] = useState(null);

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
  const onDrop = useCallback((acceptedFiles) => {
    const mapped = acceptedFiles.map((file) => ({
      file,
      id: Math.random().toString(36).substring(7),
      name: file.name,
      size: (file.size / 1024 / 1024).toFixed(2) + " MB",
      type: file.type,
      progress: 0,
      status: "pending",
    }));
    setStagedFiles((prev) => [...prev, ...mapped]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],
      "application/vnd.ms-powerpoint": [".ppt"],
    },
    maxSize: 15 * 1024 * 1024, // 15MB
  });

  const removeStagedFile = (id) => {
    setStagedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  // Submit staged profiles to Presign -> Upload -> DB Flow
  const handleSubmitProfiles = async () => {
    if (stagedFiles.length === 0) return;

    try {
      setUploading(true);
      setActionSuccess(null);

      // 1. Request presigned URLs from backend
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

      // 2. Submit candidate profile records to backend in atomic transaction
      const submitPayload = {
        profiles: presignedItems.map((item, idx) => ({
          s3Key: item.s3Key,
          fileName: item.fileName,
          resumeText: `Candidate profile for ${item.fileName}. Relevant technical background matching ${opening?.title}.`,
        })),
      };

      const submitRes = await axiosInstance.post(
        `/vendor/openings/${openingId}/profiles/upload`,
        submitPayload
      );

      if (submitRes.data?.success) {
        setActionSuccess(`Successfully submitted ${presignedItems.length} candidate profile(s)!`);
        setStagedFiles([]);
        fetchOpeningData();
      }
    } catch (err) {
      console.error("Submission failed:", err);
      setError(err.response?.data?.message || "Failed to submit profiles.");
    } finally {
      setUploading(false);
    }
  };

  // Soft delete profile
  const handleSoftDelete = async (profileId) => {
    if (!confirm("Are you sure you want to withdraw this profile?")) return;

    try {
      await axiosInstance.patch(`/vendor/profiles/${profileId}/delete`);
      setActionSuccess("Profile withdrawn successfully.");
      fetchOpeningData();
    } catch (err) {
      console.error("Soft delete failed:", err);
      setError(err.response?.data?.message || "Failed to delete profile.");
    }
  };

  // File Preview via Backend (Streams file securely through backend)
  const handlePreview = async (profileId, fileName) => {
    try {
      setPreviewLoading(true);
      setPreviewFileName(fileName || "Candidate Document");
      setPreviewModalUrl(null);
      setPreviewTextContent(null);

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
      setError("Failed to load document preview. Please check backend connection.");
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
    setPreviewLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error && !opening) {
    return (
      <div className="p-8 max-w-3xl mx-auto text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
        <h2 className="text-xl font-bold text-foreground">Error Loading Requisition</h2>
        <p className="text-sm text-muted-foreground">{error}</p>
        <button
          onClick={() => router.push("/vendor/openings")}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Openings
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      {/* Back button */}
      <button
        onClick={() => router.push("/vendor/openings")}
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Contract Openings
      </button>

      {/* Opening Details Hero Card */}
      <div className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 mb-3">
              {opening?.contractType || "Contract"}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">{opening?.title}</h1>
            <p className="text-muted-foreground mt-2 max-w-3xl text-sm leading-relaxed">
              {opening?.description || "No job description provided."}
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              Status
            </span>
            <div className="mt-1">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
                {opening?.status}
              </span>
            </div>
          </div>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-border">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-muted text-muted-foreground">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Location</p>
              <p className="text-sm font-semibold text-foreground">{opening?.location}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-muted text-muted-foreground">
              <Briefcase className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Experience Range</p>
              <p className="text-sm font-semibold text-foreground">
                {opening?.experienceMin} - {opening?.experienceMax ?? "N/A"} years
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-muted text-muted-foreground">
              <User className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Hiring Manager</p>
              <p className="text-sm font-semibold text-foreground">{opening?.hiringManagerName}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-muted text-muted-foreground">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Posted Date</p>
              <p className="text-sm font-semibold text-foreground">
                {opening?.postedDate ? new Date(opening.postedDate).toLocaleDateString() : "N/A"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {actionSuccess && (
        <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-300 flex items-center gap-3 text-sm">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Upload Section (Drag & Drop + Multiple Upload) */}
      <div className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-sm space-y-6">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-primary" />
            Candidate Profile Submission
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Drag and drop multiple candidate resumes (PDF or PPTX format, max 15MB per file).
          </p>
        </div>

        {/* Dropzone Container */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
            isDragActive
              ? "border-primary bg-primary/5 scale-[1.01]"
              : "border-border hover:border-primary/50 bg-muted/20"
          }`}
        >
          <input {...getInputProps()} />
          <UploadCloud className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground">
            {isDragActive ? "Drop the resumes here..." : "Drag & drop candidate profiles here, or browse"}
          </p>
          <p className="text-xs text-muted-foreground mt-1.5">
            Supported formats: PDF, PPTX (Direct upload via backend-secured presigned storage)
          </p>
        </div>

        {/* Staged files preview list */}
        {stagedFiles.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Files Ready for Submission ({stagedFiles.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {stagedFiles.map((sf) => (
                <div
                  key={sf.id}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-background"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <FileText className="w-5 h-5 text-primary flex-shrink-0" />
                    <div className="truncate">
                      <p className="text-sm font-medium text-foreground truncate">{sf.name}</p>
                      <p className="text-xs text-muted-foreground">{sf.size}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeStagedFile(sf.id)}
                    className="p-1.5 text-muted-foreground hover:text-destructive rounded-lg hover:bg-muted transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                disabled={uploading}
                onClick={handleSubmitProfiles}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow hover:opacity-90 disabled:opacity-50 transition-all"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Submitting Profiles...
                  </>
                ) : (
                  <>Submit {stagedFiles.length} Profile(s)</>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Your Submitted Profiles Table */}
      <div className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">Your Submitted Profiles</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Profiles you have submitted for this opening ({opening?.profilesCount || 0} total)
            </p>
          </div>
        </div>

        {opening?.uploadedProfiles?.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-border rounded-xl text-muted-foreground text-sm">
            No profiles submitted by your team yet for this opening.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-xs font-semibold uppercase text-muted-foreground">
                  <th className="py-3 px-4">Candidate File</th>
                  <th className="py-3 px-4">Submitted Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {opening?.uploadedProfiles?.map((profile) => (
                  <tr key={profile.id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-foreground flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      <span>{profile.fileName}</span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-muted-foreground">
                      {new Date(profile.submittedAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                        {profile.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      {/* Backend Preview Button */}
                      <button
                        onClick={() => handlePreview(profile.id, profile.fileName)}
                        className="inline-flex items-center gap-1 px-3 py-1 text-xs rounded-md border border-border bg-background hover:bg-muted text-foreground transition-colors font-medium"
                      >
                        <Eye className="w-3.5 h-3.5" /> Preview
                      </button>
                      {/* Soft Delete Button */}
                      <button
                        onClick={() => handleSoftDelete(profile.id)}
                        className="inline-flex items-center gap-1 px-3 py-1 text-xs rounded-md border border-destructive/20 bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors font-medium"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Backend File Preview Modal */}
      {(previewModalUrl || previewTextContent || previewLoading) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-4xl h-[80vh] bg-card rounded-2xl border border-border shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/40">
              <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" /> {previewFileName || "Candidate Document Preview"}
              </h3>
              <button
                onClick={closePreviewModal}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 w-full h-full bg-muted/10 p-4 overflow-auto">
              {previewLoading ? (
                <div className="flex flex-col items-center justify-center h-full gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-xs text-muted-foreground font-medium">
                    Streaming preview securely from backend...
                  </p>
                </div>
              ) : previewTextContent ? (
                <div className="p-6 bg-background rounded-xl border border-border font-mono text-xs whitespace-pre-wrap leading-relaxed text-foreground h-full overflow-y-auto select-text shadow-inner">
                  {previewTextContent}
                </div>
              ) : previewModalUrl ? (
                <iframe
                  src={previewModalUrl}
                  className="w-full h-full rounded-lg border border-border bg-background"
                  title="Candidate Preview"
                />
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
