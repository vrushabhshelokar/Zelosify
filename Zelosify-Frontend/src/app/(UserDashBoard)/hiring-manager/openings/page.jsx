"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import axiosInstance from "@/utils/Axios/AxiosInstance";
import {
  Briefcase,
  MapPin,
  Calendar,
  Users,
  ChevronRight,
  Search,
  Sparkles,
  Award,
  AlertCircle,
  Loader2,
  TrendingUp,
  Layers,
  ArrowRight,
  ShieldCheck,
  Bot,
} from "lucide-react";

export default function HiringManagerOpeningsPage() {
  const [openings, setOpenings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchOpenings = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axiosInstance.get("/hiring-manager/openings");
      if (res.data?.success) {
        setOpenings(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching hiring manager openings:", err);
      setError(err.response?.data?.message || "Failed to load managed openings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpenings();
  }, []);

  const filtered = useMemo(() => {
    return openings.filter(
      (o) =>
        o.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.contractType?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [openings, searchTerm]);

  // Aggregate Metrics
  const totalOpenings = openings.length;
  const totalCandidates = openings.reduce(
    (acc, o) => acc + (o.metrics?.totalProfiles ?? o._count?.profiles ?? 0),
    0
  );
  const activeLocations = new Set(openings.map((o) => o.location).filter(Boolean)).size;

  return (
    <div className="min-h-screen bg-[#09090b] text-[#f4f4f5] zelosify-grid-pattern relative pb-16">
      {/* Top Ambient Glow matching zelosify.com */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-80 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(48,128,255,0.18),transparent_70%)] pointer-events-none" />

      <div className="relative p-6 md:p-10 max-w-7xl mx-auto space-y-10">
        {/* Command Center Tag & Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-zinc-800/80 pb-8">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full text-xs font-medium bg-zinc-900/90 border border-zinc-800 text-zinc-300 shadow-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00d294] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00d294]"></span>
              </span>
              <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-400">
                Zelosify AI VendorOps
              </span>
              <span className="text-zinc-600">|</span>
              <span>Requisition Command Center</span>
            </div>

            <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-white">
              Hiring Manager Requisitions
            </h1>
            <p className="text-zinc-400 text-sm md:text-base max-w-2xl leading-relaxed">
              Real-time candidate evaluation powered by deterministic matching tools and Llama 3.3 70B AI agent orchestration.
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-84">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search requisitions by role or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-zinc-800 bg-zinc-900/90 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-[#3080ff]/50 text-white placeholder-zinc-500 shadow-inner"
            />
          </div>
        </div>

        {/* Executive Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="rounded-2xl border border-zinc-800/80 bg-[#121215]/80 backdrop-blur-xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.5)] border-t-white/10 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-[0.15em] font-mono">
                Managed Openings
              </p>
              <p className="text-3xl font-mono font-bold text-white mt-1 tabular-nums">
                {totalOpenings}
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-[#3080ff]/10 text-[#3080ff] border border-[#3080ff]/20">
              <Briefcase className="w-5 h-5" />
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800/80 bg-[#121215]/80 backdrop-blur-xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.5)] border-t-white/10 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-[0.15em] font-mono">
                Evaluated Candidates
              </p>
              <p className="text-3xl font-mono font-bold text-[#00d294] mt-1 tabular-nums">
                {totalCandidates}
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-[#00d294]/10 text-[#00d294] border border-[#00d294]/20 shadow-[0_0_15px_rgba(0,210,148,0.2)]">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800/80 bg-[#121215]/80 backdrop-blur-xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.5)] border-t-white/10 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-[0.15em] font-mono">
                Active Locations
              </p>
              <p className="text-3xl font-mono font-bold text-[#f99c00] mt-1 tabular-nums">
                {activeLocations}
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-[#f99c00]/10 text-[#f99c00] border border-[#f99c00]/20">
              <MapPin className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="p-4 rounded-xl bg-[#fb2c36]/10 border border-[#fb2c36]/30 text-[#fb2c36] flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">{error}</p>
            <button
              onClick={fetchOpenings}
              className="ml-auto text-xs underline font-semibold hover:opacity-80"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading Skeleton */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-64 rounded-2xl bg-zinc-900/60 animate-pulse border border-zinc-800/80"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-zinc-800 rounded-3xl bg-zinc-900/30 p-8">
            <Users className="w-12 h-12 text-zinc-600 mx-auto mb-3 opacity-60" />
            <h3 className="text-lg font-bold text-white">No Managed Requisitions Found</h3>
            <p className="text-sm text-zinc-400 mt-1 max-w-md mx-auto">
              {searchTerm
                ? `No requisitions match "${searchTerm}".`
                : "You do not have any contract openings assigned to your account yet."}
            </p>
          </div>
        ) : (
          /* Requisitions Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((opening, idx) => {
              const candidateCount = opening.metrics?.totalProfiles ?? opening._count?.profiles ?? 0;
              return (
                <motion.div
                  key={opening.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: idx * 0.05 }}
                  className="group relative flex flex-col justify-between rounded-3xl border border-zinc-800/80 bg-[#121215]/90 hover:bg-[#15151a] backdrop-blur-xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.5)] border-t-white/10 hover:border-[#3080ff]/50 transition-all duration-300"
                >
                  <div className="space-y-4">
                    {/* Header Badges */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-mono uppercase tracking-wider bg-zinc-800/80 text-zinc-300 border border-zinc-700/60">
                        {opening.contractType || "Contract"}
                      </span>
                      <span className="flex items-center gap-1.5 text-xs text-[#00d294] font-semibold bg-[#00d294]/10 px-2.5 py-1 rounded-full border border-[#00d294]/20 shadow-[0_0_10px_rgba(0,210,148,0.15)]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#00d294] animate-pulse" />
                        Active
                      </span>
                    </div>

                    {/* Title */}
                    <div>
                      <h3 className="text-lg font-semibold text-white group-hover:text-[#3080ff] transition-colors line-clamp-1">
                        {opening.title}
                      </h3>
                      <p className="text-xs text-zinc-400 mt-2 line-clamp-2 leading-relaxed">
                        {opening.description || "Contract requisition requirements and specifications."}
                      </p>
                    </div>

                    {/* Chips */}
                    <div className="flex flex-wrap gap-2 text-xs text-zinc-400 pt-1">
                      <span className="inline-flex items-center gap-1 bg-zinc-900/90 px-2.5 py-1 rounded-lg border border-zinc-800 text-zinc-300">
                        <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                        {opening.location || "Remote"}
                      </span>
                      <span className="inline-flex items-center gap-1 bg-zinc-900/90 px-2.5 py-1 rounded-lg border border-zinc-800 text-zinc-300">
                        <Briefcase className="w-3.5 h-3.5 text-zinc-500" />
                        {opening.experienceMin}-{opening.experienceMax || "10+"} yrs
                      </span>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="mt-6 pt-4 border-t border-zinc-800/80 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-zinc-900 text-zinc-300 border border-zinc-800">
                        <Users className="w-4 h-4 text-[#3080ff]" />
                      </div>
                      <div>
                        <span className="text-sm font-mono font-bold text-white tabular-nums">
                          {candidateCount}
                        </span>
                        <span className="text-xs text-zinc-400 ml-1.5">
                          {candidateCount === 1 ? "Candidate" : "Candidates"}
                        </span>
                      </div>
                    </div>

                    <Link
                      href={`/hiring-manager/openings/${opening.id}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#3080ff] hover:bg-[#2563eb] text-white text-xs font-semibold shadow-[0_0_18px_rgba(48,128,255,0.3)] transition-all"
                    >
                      <span>Evaluate</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
