"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import axiosInstance from "@/utils/Axios/AxiosInstance";
import {
  Briefcase,
  MapPin,
  Calendar,
  ChevronRight,
  Search,
  ArrowUpDown,
  Loader2,
  AlertCircle,
  FileUp,
  Layers,
  ArrowRight,
  Clock,
  Sparkles,
} from "lucide-react";

export default function VendorOpeningsPage() {
  const [openings, setOpenings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1, total: 0 });

  const fetchOpenings = async (targetPage = 1) => {
    try {
      setLoading(true);
      setError(null);
      const res = await axiosInstance.get(`/vendor/openings?page=${targetPage}&limit=12`);
      if (res.data?.success) {
        setOpenings(res.data.data);
        setPagination(res.data.pagination);
        setPage(targetPage);
      }
    } catch (err) {
      console.error("Error fetching vendor openings:", err);
      setError(err.response?.data?.message || "Failed to load contract openings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpenings(page);
  }, [page]);

  const filteredOpenings = useMemo(() => {
    return openings.filter(
      (op) =>
        op.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        op.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        op.contractType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        op.department?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [openings, searchTerm]);

  return (
    <div className="min-h-screen bg-[#09090b] text-[#f4f4f5] zelosify-grid-pattern relative pb-20">
      {/* Top Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-80 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(48,128,255,0.18),transparent_70%)] pointer-events-none" />

      <div className="relative p-6 md:p-10 max-w-7xl mx-auto space-y-10">
        {/* Command Center Tag & Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-zinc-800/80 pb-8">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full text-xs font-medium bg-zinc-900/90 border border-zinc-800 text-zinc-300 shadow-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3080ff] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#3080ff]"></span>
              </span>
              <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-400">
                Zelosify VendorOps
              </span>
              <span className="text-zinc-600">|</span>
              <span>Talent Submission Portal</span>
            </div>

            <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-white">
              Contract Openings Directory
            </h1>
            <p className="text-zinc-400 text-sm md:text-base max-w-2xl leading-relaxed">
              Explore active requisitions published by hiring managers under your tenant and submit qualified candidate profiles.
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-84">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search by role, location, contract..."
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
                Total Openings
              </p>
              <p className="text-3xl font-mono font-bold text-white mt-1 tabular-nums">
                {pagination.total || openings.length}
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-[#3080ff]/10 text-[#3080ff] border border-[#3080ff]/20">
              <Briefcase className="w-5 h-5" />
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800/80 bg-[#121215]/80 backdrop-blur-xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.5)] border-t-white/10 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-[0.15em] font-mono">
                Active Contracts
              </p>
              <p className="text-3xl font-mono font-bold text-[#00d294] mt-1 tabular-nums">
                {openings.filter((o) => o.status === "ACTIVE" || !o.status).length}
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-[#00d294]/10 text-[#00d294] border border-[#00d294]/20 shadow-[0_0_15px_rgba(0,210,148,0.2)]">
              <Layers className="w-5 h-5" />
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800/80 bg-[#121215]/80 backdrop-blur-xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.5)] border-t-white/10 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-[0.15em] font-mono">
                Active Page
              </p>
              <p className="text-3xl font-mono font-bold text-[#f99c00] mt-1 tabular-nums">
                {page} / {pagination.totalPages || 1}
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-[#f99c00]/10 text-[#f99c00] border border-[#f99c00]/20">
              <Clock className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="p-4 rounded-xl bg-[#fb2c36]/10 border border-[#fb2c36]/30 text-[#fb2c36] flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">{error}</p>
            <button
              onClick={() => fetchOpenings(page)}
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
        ) : filteredOpenings.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-zinc-800 rounded-3xl bg-zinc-900/30 p-8">
            <Briefcase className="w-12 h-12 text-zinc-600 mx-auto mb-3 opacity-60" />
            <h3 className="text-lg font-bold text-white">No Contract Openings Found</h3>
            <p className="text-sm text-zinc-400 mt-1 max-w-md mx-auto">
              {searchTerm
                ? `No openings match "${searchTerm}".`
                : "No requisitions have been published under your tenant."}
            </p>
          </div>
        ) : (
          /* Requisitions Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOpenings.map((op, idx) => (
              <motion.div
                key={op.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: idx * 0.04 }}
                className="group relative flex flex-col justify-between rounded-3xl border border-zinc-800/80 bg-[#121215]/90 hover:bg-[#15151a] backdrop-blur-xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.5)] border-t-white/10 hover:border-[#3080ff]/50 transition-all duration-300"
              >
                <div className="space-y-4">
                  {/* Header Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-mono uppercase tracking-wider bg-zinc-800/80 text-zinc-300 border border-zinc-700/60">
                      {op.contractType || "Contract"}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-[#00d294] font-semibold bg-[#00d294]/10 px-2.5 py-1 rounded-full border border-[#00d294]/20 shadow-[0_0_10px_rgba(0,210,148,0.15)]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00d294] animate-pulse" />
                      Accepting Profiles
                    </span>
                  </div>

                  {/* Title & Desc */}
                  <div>
                    <h3 className="text-lg font-semibold text-white group-hover:text-[#3080ff] transition-colors line-clamp-1">
                      {op.title}
                    </h3>
                    <p className="text-xs text-zinc-400 mt-2 line-clamp-2 leading-relaxed">
                      {op.description || "Contract requisition requirements and specifications."}
                    </p>
                  </div>

                  {/* Chips */}
                  <div className="flex flex-wrap gap-2 text-xs text-zinc-400 pt-1">
                    <span className="inline-flex items-center gap-1 bg-zinc-900/90 px-2.5 py-1 rounded-lg border border-zinc-800 text-zinc-300">
                      <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                      {op.location || "Remote"}
                    </span>
                    <span className="inline-flex items-center gap-1 bg-zinc-900/90 px-2.5 py-1 rounded-lg border border-zinc-800 text-zinc-300">
                      <Briefcase className="w-3.5 h-3.5 text-zinc-500" />
                      {op.experienceMin}-{op.experienceMax || "10+"} yrs
                    </span>
                  </div>

                  {/* Skills Preview */}
                  {op.skillsRequired && op.skillsRequired.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {op.skillsRequired.slice(0, 3).map((s, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md bg-zinc-900 text-[11px] font-mono text-zinc-400 border border-zinc-800"
                        >
                          {s}
                        </span>
                      ))}
                      {op.skillsRequired.length > 3 && (
                        <span className="text-[11px] text-zinc-500 font-mono py-0.5">
                          +{op.skillsRequired.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer Action */}
                <div className="mt-6 pt-4 border-t border-zinc-800/80 flex items-center justify-between">
                  <span className="text-xs text-zinc-500 font-mono">
                    Dept: {op.department || "Engineering"}
                  </span>

                  <Link
                    href={`/vendor/openings/${op.id}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#3080ff] hover:bg-[#2563eb] text-white text-xs font-semibold shadow-[0_0_18px_rgba(48,128,255,0.3)] transition-all"
                  >
                    <span>Submit Profiles</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 pt-6">
            <button
              disabled={page <= 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              className="px-4 py-2 rounded-xl border border-zinc-800 bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-800 disabled:opacity-40 transition-all shadow-sm"
            >
              Previous
            </button>
            <span className="text-xs font-mono font-medium text-zinc-400">
              Page {page} of {pagination.totalPages}
            </span>
            <button
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((prev) => Math.min(pagination.totalPages, prev + 1))}
              className="px-4 py-2 rounded-xl border border-zinc-800 bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-800 disabled:opacity-40 transition-all shadow-sm"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
