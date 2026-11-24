"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import axiosInstance from "@/utils/Axios/AxiosInstance";
import {
  Briefcase,
  MapPin,
  Calendar,
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowLeft,
  FileText,
  Filter,
  Eye,
  AlertCircle,
  Loader2,
  X,
  ShieldCheck,
} from "lucide-react";

export default function HiringManagerOpeningProfilesPage() {
  const params = useParams();
  const router = useRouter();
  const openingId = params?.id;

  const [opening, setOpening] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterBadge, setFilterBadge] = useState("ALL"); // ALL, Recommended, Borderline, Not Recommended
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewTextContent, setPreviewTextContent] = useState(null);
  const [previewFileName, setPreviewFileName] = useState("");
  const [processingId, setProcessingId] = useState(null);

  const fetchProfiles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axiosInstance.get(`/hiring-manager/openings/${openingId}/profiles`);
      if (res.data?.success) {
        setOpening(res.data.data.opening);
        setProfiles(res.data.data.profiles);
      }
    } catch (err) {
      console.error("Error fetching profiles:", err);
      setError(
        err.response?.data?.message || "Failed to load candidate profiles for this requisition."
      );
    } finally {
      setLoading(false);
    }
  }, [openingId]);

  useEffect(() => {
    if (openingId) {
      fetchProfiles();
    }
  }, [openingId, fetchProfiles]);

  // Handle Shortlist action
  const handleShortlist = async (profileId) => {
    try {
      setProcessingId(profileId);
      const res = await axiosInstance.post(`/hiring-manager/profiles/${profileId}/shortlist`);
      if (res.data?.success) {
        setProfiles((prev) =>
          prev.map((p) => (p.id === profileId ? { ...p, status: "SHORTLISTED" } : p))
        );
      }
    } catch (err) {
      alert(err.response?.data?.message || "Error shortlisting profile");
    } finally {
      setProcessingId(null);
    }
  };

  // Handle Reject action
  const handleReject = async (profileId) => {
    try {
      setProcessingId(profileId);
      const res = await axiosInstance.post(`/hiring-manager/profiles/${profileId}/reject`);
      if (res.data?.success) {
        setProfiles((prev) =>
          prev.map((p) => (p.id === profileId ? { ...p, status: "REJECTED" } : p))
        );
      }
    } catch (err) {
      alert(err.response?.data?.message || "Error rejecting profile");
    } finally {
      setProcessingId(null);
    }
  };

  // Secure File Preview via Backend Blob Stream
  const handlePreview = async (profileId, fileName) => {
    try {
      setPreviewLoading(true);
      setPreviewFileName(fileName || "Candidate Document");
      setPreviewUrl(null);
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
        setPreviewUrl(blobUrl);
      }
    } catch (err) {
      console.error("Preview failed:", err);
      alert("Failed to load document preview. Please check backend connection.");
    } finally {
      setPreviewLoading(false);
    }
  };

  const closePreviewModal = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setPreviewTextContent(null);
    setPreviewLoading(false);
  };

  // Filter profiles based on selected badge
  const filteredProfiles = useMemo(() => {
    if (filterBadge === "ALL") return profiles;
    return profiles.filter((p) => p.recommendationBadge === filterBadge);
  }, [profiles, filterBadge]);

  // Virtualization windowing for large candidate pools (>50 records)
  const [visibleCount, setVisibleCount] = useState(50);
  const displayedProfiles = useMemo(() => {
    return filteredProfiles.slice(0, visibleCount);
  }, [filteredProfiles, visibleCount]);

  const loadMore = () => {
    setVisibleCount((prev) => Math.min(filteredProfiles.length, prev + 50));
  };

  // Color & Badge Styling Helpers
  const getBadgeUI = (badge) => {
    switch (badge) {
      case "Recommended":
        return {
          bg: "bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400",
          dot: "bg-emerald-500",
          label: "Recommended",
        };
      case "Borderline":
        return {
          bg: "bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400",
          dot: "bg-amber-500",
          label: "Borderline",
        };
      default:
        return {
          bg: "bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-400",
          dot: "bg-rose-500",
          label: "Not Recommended",
        };
    }
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
      <div className="p-8 max-w-2xl mx-auto text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
        <h2 className="text-xl font-bold text-foreground">Access Restricted</h2>
        <p className="text-sm text-muted-foreground">{error}</p>
        <button
          onClick={() => router.push("/hiring-manager/openings")}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to My Openings
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      {/* Header & Back Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <button
          onClick={() => router.push("/hiring-manager/openings")}
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Managed Openings
        </button>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-muted border border-border text-xs font-semibold">
          {["ALL", "Recommended", "Borderline", "Not Recommended"].map((b) => (
            <button
              key={b}
              onClick={() => {
                setFilterBadge(b);
                setVisibleCount(50);
              }}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterBadge === b
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      {/* Opening Summary Banner */}
      <div className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 mb-3">
            {opening?.contractType || "Contract"} Requisition
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">{opening?.title}</h1>
          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" /> {opening?.location}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Briefcase className="w-3.5 h-3.5" /> Required Exp: {opening?.experienceMin} -{" "}
              {opening?.experienceMax ?? "N/A"} years
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-5 py-3 rounded-xl bg-muted/40 border border-border text-center">
            <p className="text-xl font-bold text-foreground">{profiles.length}</p>
            <p className="text-[11px] font-semibold uppercase text-muted-foreground">Candidates</p>
          </div>
          <div className="px-5 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
              {profiles.filter((p) => p.recommended).length}
            </p>
            <p className="text-[11px] font-semibold uppercase text-emerald-600 dark:text-emerald-400">
              Recommended
            </p>
          </div>
        </div>
      </div>

      {/* Profile Cards Grid / List */}
      {displayedProfiles.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-border rounded-2xl bg-card">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
          <h3 className="text-lg font-bold text-foreground">No candidate profiles found</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {filterBadge !== "ALL"
              ? `No candidates match the "${filterBadge}" filter.`
              : "Vendors have not submitted any candidate profiles for this opening yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Showing {displayedProfiles.length} of {filteredProfiles.length} candidate profiles
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {displayedProfiles.map((p) => {
              const badgeUI = getBadgeUI(p.recommendationBadge);
              const isShortlisted = p.status === "SHORTLISTED";
              const isRejected = p.status === "REJECTED";

              return (
                <div
                  key={p.id}
                  className={`rounded-2xl border bg-card p-6 shadow-sm transition-all hover:shadow-md ${
                    isShortlisted
                      ? "border-emerald-500/40 bg-emerald-500/[0.02]"
                      : isRejected
                      ? "border-rose-500/40 opacity-75"
                      : "border-border"
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    {/* Candidate & Recommendation Details */}
                    <div className="space-y-3 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        {/* File Name */}
                        <div className="flex items-center gap-2 font-bold text-foreground text-base">
                          <FileText className="w-5 h-5 text-primary" />
                          <span>{p.fileName}</span>
                        </div>

                        {/* Status Badge */}
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${badgeUI.bg}`}
                        >
                          <span className={`w-2 h-2 rounded-full ${badgeUI.dot}`} />
                          {badgeUI.label}
                        </span>

                        {/* Workflow Status */}
                        {isShortlisted && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500 text-white">
                            SHORTLISTED
                          </span>
                        )}
                        {isRejected && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500 text-white">
                            REJECTED
                          </span>
                        )}
                      </div>

                      {/* AI Reasoning / Explanation */}
                      <p className="text-sm text-foreground/90 bg-muted/30 p-3 rounded-xl border border-border/50 leading-relaxed">
                        <strong className="text-primary font-semibold">AI Rationale: </strong>
                        {p.explanation}
                      </p>

                      {/* Metadata Row */}
                      <div className="flex flex-wrap items-center gap-5 text-xs text-muted-foreground pt-1">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          Uploaded: {new Date(p.uploadDate).toLocaleDateString()}
                        </span>
                        {p.processingTimeMs && (
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            Latency: {p.processingTimeMs}ms
                          </span>
                        )}
                        <span className="flex items-center gap-1.5 text-foreground font-medium">
                          <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                          Confidence: {p.confidencePercent}%
                        </span>
                      </div>
                    </div>

                    {/* Score Gauges & Action Buttons */}
                    <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-center gap-4 border-t lg:border-t-0 pt-4 lg:pt-0 border-border">
                      {/* Score Meter */}
                      <div className="text-right">
                        <div className="text-2xl font-black text-foreground">
                          {p.scorePercent}
                          <span className="text-xs font-semibold text-muted-foreground"> / 100</span>
                        </div>
                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                          Match Score
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {/* Preview document */}
                        <button
                          onClick={() => handlePreview(p.id, p.fileName)}
                          className="p-2 rounded-xl border border-border bg-background hover:bg-muted text-foreground transition-colors"
                          title="Preview Document"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Shortlist Button */}
                        <button
                          disabled={processingId === p.id || isShortlisted}
                          onClick={() => handleShortlist(p.id)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm disabled:opacity-50 transition-all"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Shortlist
                        </button>

                        {/* Reject Button */}
                        <button
                          disabled={processingId === p.id || isRejected}
                          onClick={() => handleReject(p.id)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-sm disabled:opacity-50 transition-all"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Virtualization / Pagination Load More */}
          {visibleCount < filteredProfiles.length && (
            <div className="text-center pt-4">
              <button
                onClick={loadMore}
                className="px-6 py-2.5 rounded-xl border border-border bg-card text-foreground font-semibold text-xs hover:bg-muted transition-colors shadow-sm"
              >
                Load Next 50 Candidates ({filteredProfiles.length - visibleCount} remaining)
              </button>
            </div>
          )}
        </div>
      )}

      {/* Preview Modal */}
      {(previewUrl || previewTextContent || previewLoading) && (
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
              ) : previewUrl ? (
                <iframe
                  src={previewUrl}
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
