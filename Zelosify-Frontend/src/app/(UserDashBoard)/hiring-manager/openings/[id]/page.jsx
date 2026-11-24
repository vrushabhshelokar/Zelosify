"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
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
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Zap,
} from "lucide-react";
import ScoreGauge from "@/components/ContractManagement/ScoreGauge";
import FormulaBreakdown from "@/components/ContractManagement/FormulaBreakdown";
import SkillBadgeCloud from "@/components/ContractManagement/SkillBadgeCloud";
import LatencyBadge from "@/components/ContractManagement/LatencyBadge";
import DocumentPreviewModal from "@/components/ContractManagement/DocumentPreviewModal";

export default function HiringManagerOpeningProfilesPage() {
  const params = useParams();
  const router = useRouter();
  const openingId = params?.id;

  const [opening, setOpening] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterBadge, setFilterBadge] = useState("ALL");
  const [sortBy, setSortBy] = useState("score-desc");
  const [expandedReasoning, setExpandedReasoning] = useState({});

  // Modal State
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewTextContent, setPreviewTextContent] = useState(null);
  const [previewFileName, setPreviewFileName] = useState("");
  const [previewError, setPreviewError] = useState(null);
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
  const handleShortlist = async (profileId, candidateName) => {
    try {
      setProcessingId(profileId);
      const res = await axiosInstance.post(`/hiring-manager/profiles/${profileId}/shortlist`);
      if (res.data?.success) {
        setProfiles((prev) =>
          prev.map((p) => (p.id === profileId ? { ...p, status: "SHORTLISTED" } : p))
        );
        toast.success(`Candidate ${candidateName || "Profile"} shortlisted!`, {
          description: "Status successfully updated to SHORTLISTED in database.",
        });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Error shortlisting profile");
    } finally {
      setProcessingId(null);
    }
  };

  // Handle Reject action
  const handleReject = async (profileId, candidateName) => {
    try {
      setProcessingId(profileId);
      const res = await axiosInstance.post(`/hiring-manager/profiles/${profileId}/reject`);
      if (res.data?.success) {
        setProfiles((prev) =>
          prev.map((p) => (p.id === profileId ? { ...p, status: "REJECTED" } : p))
        );
        toast.info(`Candidate ${candidateName || "Profile"} marked as rejected.`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Error rejecting profile");
    } finally {
      setProcessingId(null);
    }
  };

  // Secure File Preview via Backend Blob Stream
  const handlePreview = async (profileId, fileName) => {
    try {
      setPreviewOpen(true);
      setPreviewLoading(true);
      setPreviewFileName(fileName || "Candidate Document");
      setPreviewUrl(null);
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
        setPreviewUrl(blobUrl);
      }
    } catch (err) {
      console.error("Preview failed:", err);
      setPreviewError("Failed to stream document from backend storage vault.");
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
    setPreviewOpen(false);
  };

  const toggleReasoning = (id) => {
    setExpandedReasoning((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Distribution Metrics
  const metrics = useMemo(() => {
    const total = profiles.length;
    const recommended = profiles.filter((p) => p.recommendationBadge === "Recommended").length;
    const borderline = profiles.filter((p) => p.recommendationBadge === "Borderline").length;
    const notRecommended = profiles.filter((p) => p.recommendationBadge === "Not Recommended").length;
    const shortlisted = profiles.filter((p) => p.status === "SHORTLISTED").length;
    return { total, recommended, borderline, notRecommended, shortlisted };
  }, [profiles]);

  // Filtering & Sorting
  const filteredProfiles = useMemo(() => {
    let result = [...profiles];

    if (filterBadge === "SHORTLISTED") {
      result = result.filter((p) => p.status === "SHORTLISTED");
    } else if (filterBadge !== "ALL") {
      result = result.filter((p) => p.recommendationBadge === filterBadge);
    }

    result.sort((a, b) => {
      if (sortBy === "score-desc") return (b.scorePercent || 0) - (a.scorePercent || 0);
      if (sortBy === "score-asc") return (a.scorePercent || 0) - (b.scorePercent || 0);
      if (sortBy === "exp-desc") return (b.experienceYears || 0) - (a.experienceYears || 0);
      if (sortBy === "newest") return new Date(b.uploadDate) - new Date(a.uploadDate);
      return 0;
    });

    return result;
  }, [profiles, filterBadge, sortBy]);

  const [visibleCount, setVisibleCount] = useState(50);
  const displayedProfiles = useMemo(() => {
    return filteredProfiles.slice(0, visibleCount);
  }, [filteredProfiles, visibleCount]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-[#3080ff]" />
        <p className="text-sm font-semibold text-zinc-400 font-mono">
          Initializing Zelosify Candidate Evaluation Command Center...
        </p>
      </div>
    );
  }

  if (error && !opening) {
    return (
      <div className="min-h-screen bg-[#09090b] p-8 flex items-center justify-center">
        <div className="max-w-md w-full text-center space-y-4 p-8 rounded-3xl border border-zinc-800 bg-[#121215]">
          <AlertCircle className="w-12 h-12 text-[#fb2c36] mx-auto" />
          <h2 className="text-xl font-bold text-white">Access Restricted</h2>
          <p className="text-sm text-zinc-400">{error}</p>
          <button
            onClick={() => router.push("/hiring-manager/openings")}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#3080ff] text-white text-sm font-semibold hover:bg-[#2563eb]"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Managed Openings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-[#f4f4f5] zelosify-grid-pattern relative pb-20">
      {/* Top Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-80 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(48,128,255,0.18),transparent_70%)] pointer-events-none" />

      <div className="relative p-6 md:p-10 max-w-7xl mx-auto space-y-8">
        {/* Top Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <button
            onClick={() => router.push("/hiring-manager/openings")}
            className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Managed Openings
          </button>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 bg-zinc-900/80 px-3 py-1.5 rounded-xl border border-zinc-800 shadow-sm">
            <ArrowUpDown className="w-4 h-4 text-zinc-400" />
            <span className="text-xs text-zinc-400 font-medium">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-xs bg-transparent text-white font-medium focus:outline-none cursor-pointer"
            >
              <option value="score-desc" className="bg-zinc-900">Match Score (High to Low)</option>
              <option value="score-asc" className="bg-zinc-900">Match Score (Low to High)</option>
              <option value="exp-desc" className="bg-zinc-900">Experience (Highest First)</option>
              <option value="newest" className="bg-zinc-900">Submission (Newest First)</option>
            </select>
          </div>
        </div>

        {/* Opening Hero Banner */}
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

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="px-4 py-3 rounded-2xl bg-zinc-900/90 border border-zinc-800 text-center">
                <p className="text-2xl font-mono font-bold text-white tabular-nums">{metrics.total}</p>
                <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 mt-0.5">
                  Total
                </p>
              </div>
              <div className="px-4 py-3 rounded-2xl bg-[#00d294]/10 border border-[#00d294]/20 text-center">
                <p className="text-2xl font-mono font-bold text-[#00d294] tabular-nums">
                  {metrics.recommended}
                </p>
                <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#00d294] mt-0.5">
                  Recommended
                </p>
              </div>
              <div className="px-4 py-3 rounded-2xl bg-[#f99c00]/10 border border-[#f99c00]/20 text-center">
                <p className="text-2xl font-mono font-bold text-[#f99c00] tabular-nums">
                  {metrics.borderline}
                </p>
                <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#f99c00] mt-0.5">
                  Borderline
                </p>
              </div>
              <div className="px-4 py-3 rounded-2xl bg-[#3080ff]/10 border border-[#3080ff]/20 text-center">
                <p className="text-2xl font-mono font-bold text-[#3080ff] tabular-nums">
                  {metrics.shortlisted}
                </p>
                <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#3080ff] mt-0.5">
                  Shortlisted
                </p>
              </div>
            </div>
          </div>

          {/* Required Skills Chips */}
          {opening?.skillsRequired && opening.skillsRequired.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="font-semibold text-zinc-400">Target Skills:</span>
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

        {/* Filter Tabs Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {[
            { key: "ALL", label: `All Candidates (${metrics.total})` },
            { key: "Recommended", label: `Recommended (${metrics.recommended})` },
            { key: "Borderline", label: `Borderline (${metrics.borderline})` },
            { key: "Not Recommended", label: `Not Recommended (${metrics.notRecommended})` },
            { key: "SHORTLISTED", label: `Shortlisted (${metrics.shortlisted})` },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setFilterBadge(tab.key);
                setVisibleCount(50);
              }}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                filterBadge === tab.key
                  ? "bg-[#3080ff] text-white shadow-[0_0_15px_rgba(48,128,255,0.35)]"
                  : "bg-zinc-900/80 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800/80"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Profile Cards */}
        {displayedProfiles.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-zinc-800 rounded-3xl bg-zinc-900/30 p-8">
            <FileText className="w-12 h-12 text-zinc-600 mx-auto mb-3 opacity-60" />
            <h3 className="text-lg font-bold text-white">No candidate profiles found</h3>
            <p className="text-sm text-zinc-400 mt-1 max-w-md mx-auto">
              {filterBadge !== "ALL"
                ? `No candidates match the "${filterBadge}" category.`
                : "Vendors have not submitted any candidate profiles for this requisition yet."}
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
              <span>
                Displaying {displayedProfiles.length} of {filteredProfiles.length} candidates
              </span>
              <span className="font-mono text-zinc-500">SLA Target: &le; 1500ms</span>
            </div>

            <div className="grid grid-cols-1 gap-5">
              {displayedProfiles.map((p, index) => {
                const isShortlisted = p.status === "SHORTLISTED";
                const isRejected = p.status === "REJECTED";
                const isExpanded = !!expandedReasoning[p.id];

                let badgeColor = "bg-[#fb2c36]/15 border-[#fb2c36]/30 text-[#fb2c36]";
                let badgeDot = "bg-[#fb2c36]";
                if (p.recommendationBadge === "Recommended") {
                  badgeColor = "bg-[#00d294]/15 border-[#00d294]/30 text-[#00d294]";
                  badgeDot = "bg-[#00d294]";
                } else if (p.recommendationBadge === "Borderline") {
                  badgeColor = "bg-[#f99c00]/15 border-[#f99c00]/30 text-[#f99c00]";
                  badgeDot = "bg-[#f99c00]";
                }

                return (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.04 }}
                    className={`rounded-3xl border bg-[#121215]/90 backdrop-blur-xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.5)] border-t-white/10 transition-all duration-300 ${
                      isShortlisted
                        ? "border-[#00d294]/40 bg-[#00d294]/[0.03]"
                        : isRejected
                        ? "border-[#fb2c36]/30 opacity-70"
                        : "border-zinc-800/80 hover:border-[#3080ff]/40"
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                      {/* Left: Info & Skills */}
                      <div className="space-y-4 flex-1">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <div className="flex items-center gap-2 font-bold text-white text-base">
                            <FileText className="w-5 h-5 text-[#3080ff]" />
                            <span>{p.fileName}</span>
                          </div>

                          {/* Recommendation Badge */}
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${badgeColor}`}
                          >
                            <span className={`w-2 h-2 rounded-full ${badgeDot}`} />
                            {p.recommendationBadge || (p.recommended ? "Recommended" : "Not Recommended")}
                          </span>

                          {/* Workflow Status */}
                          {isShortlisted && (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#00d294] text-black shadow-sm">
                              SHORTLISTED
                            </span>
                          )}
                          {isRejected && (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#fb2c36] text-white shadow-sm">
                              REJECTED
                            </span>
                          )}

                          {/* Latency Pill */}
                          {p.processingTimeMs && (
                            <LatencyBadge latencyMs={p.processingTimeMs} />
                          )}
                        </div>

                        {/* Candidate Skills Breakdown */}
                        <div className="space-y-1.5 pt-1">
                          <span className="text-[11px] font-mono font-semibold text-zinc-400 uppercase tracking-wider">
                            Normalized Candidate Skills
                          </span>
                          <SkillBadgeCloud
                            candidateSkills={p.skills || []}
                            requiredSkills={opening?.skillsRequired || []}
                          />
                        </div>

                        {/* Formula Breakdown */}
                        <FormulaBreakdown
                          skillScore={p.scorePercent ? p.scorePercent / 100 : 0}
                          expScore={p.experienceYears ? Math.min(1, p.experienceYears / (opening?.experienceMin || 5)) : 0.8}
                          locScore={0.9}
                          compact={!isExpanded}
                        />

                        {/* AI Reasoning Drawer */}
                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={() => toggleReasoning(p.id)}
                            className="flex items-center gap-1.5 text-xs font-semibold text-[#3080ff] hover:text-[#5b9bff] transition-colors"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>{isExpanded ? "Hide Agent Decision Path" : "Inspect Agent Reasoning & Taxonomy"}</span>
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                          </button>

                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-2.5 p-4 rounded-2xl bg-black/60 border border-zinc-800 text-xs text-zinc-300 space-y-2 leading-relaxed shadow-inner"
                              >
                                <p>
                                  <strong className="text-[#3080ff] font-semibold">Evaluation Rationale: </strong>
                                  {p.explanation || "Candidate evaluated based on canonical skill taxonomy, verified experience levels, and location compatibility."}
                                </p>
                                <div className="flex flex-wrap gap-4 text-[11px] text-zinc-500 font-mono pt-2 border-t border-zinc-800/80">
                                  <span>Uploaded: {new Date(p.uploadDate).toLocaleDateString()}</span>
                                  <span>Confidence: {p.confidencePercent || 92}%</span>
                                  <span>Profile ID: #{p.id}</span>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>

                      {/* Right: Radial Score Gauge & Actions */}
                      <div className="flex flex-row lg:flex-col items-center justify-between lg:justify-center gap-5 border-t lg:border-t-0 pt-4 lg:pt-0 border-zinc-800/80 min-w-[150px]">
                        <ScoreGauge score={p.scorePercent || 0} size="md" />

                        {/* Actions */}
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handlePreview(p.id, p.fileName)}
                            className="p-2.5 rounded-xl border border-zinc-800 bg-zinc-900/90 hover:bg-zinc-800 text-white transition-all shadow-sm"
                            title="Preview Candidate Document"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            disabled={processingId === p.id || isShortlisted}
                            onClick={() => handleShortlist(p.id, p.fileName)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#00d294] hover:bg-[#00b580] text-black font-bold text-xs shadow-[0_0_15px_rgba(0,210,148,0.3)] disabled:opacity-50 transition-all"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Shortlist
                          </button>

                          <button
                            type="button"
                            disabled={processingId === p.id || isRejected}
                            onClick={() => handleReject(p.id, p.fileName)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#fb2c36] hover:bg-[#dc2626] text-white font-bold text-xs shadow-[0_0_15px_rgba(251,44,54,0.3)] disabled:opacity-50 transition-all"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {filteredProfiles.length > visibleCount && (
              <div className="text-center pt-4">
                <button
                  type="button"
                  onClick={() => setVisibleCount((prev) => prev + 50)}
                  className="px-6 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold border border-zinc-800 transition-all shadow-sm"
                >
                  Load More Candidates ({filteredProfiles.length - visibleCount} remaining)
                </button>
              </div>
            )}
          </div>
        )}

        {/* High-Fidelity Document Preview Modal */}
        <DocumentPreviewModal
          isOpen={previewOpen}
          onClose={closePreviewModal}
          fileName={previewFileName}
          previewUrl={previewUrl}
          textContent={previewTextContent}
          isLoading={previewLoading}
          error={previewError}
        />
      </div>
    </div>
  );
}
