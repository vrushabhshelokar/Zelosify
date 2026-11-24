"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import axiosInstance from "@/utils/Axios/AxiosInstance";
import {
  Briefcase,
  MapPin,
  Calendar,
  Users,
  ChevronRight,
  Search,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Loader2,
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

  const filtered = openings.filter((o) =>
    o.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.contractType?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" />
            My Managed Openings
          </h1>
          <p className="text-muted-foreground mt-1">
            Review AI recommendation candidate scores and shortlist profiles for your requisitions.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search your openings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
          />
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
          <button
            onClick={fetchOpenings}
            className="ml-auto text-xs underline font-medium hover:opacity-80"
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
              className="h-56 rounded-2xl bg-muted/60 animate-pulse border border-border"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-border rounded-2xl bg-card">
          <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
          <h3 className="text-lg font-medium text-foreground">No openings assigned to you</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Openings created for your user ID will appear here.
          </p>
        </div>
      ) : (
        /* Openings Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((op) => (
            <div
              key={op.id}
              className="flex flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-md hover:border-primary/40 transition-all group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-secondary text-secondary-foreground border border-border">
                    {op.contractType}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Exp: {op.experienceMin}-{op.experienceMax ?? "N/A"} yrs
                  </span>
                </div>

                <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                  {op.title}
                </h3>

                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{op.location}</span>
                </div>

                <p className="text-xs text-muted-foreground mt-3 line-clamp-2 leading-relaxed">
                  {op.description || "No description provided."}
                </p>
              </div>

              <div className="pt-5 mt-5 border-t border-border space-y-3">
                {/* Metrics Badges */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded-lg bg-muted/50 border border-border/40">
                    <p className="text-base font-bold text-foreground">{op.metrics.totalProfiles}</p>
                    <p className="text-[10px] uppercase font-semibold text-muted-foreground mt-0.5">Total</p>
                  </div>
                  <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400">
                    <p className="text-base font-bold flex items-center justify-center gap-0.5">
                      <Sparkles className="w-3 h-3" />
                      {op.metrics.recommendedCount}
                    </p>
                    <p className="text-[10px] uppercase font-semibold mt-0.5">AI Rec</p>
                  </div>
                  <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400">
                    <p className="text-base font-bold flex items-center justify-center gap-0.5">
                      <CheckCircle className="w-3 h-3" />
                      {op.metrics.shortlistedCount}
                    </p>
                    <p className="text-[10px] uppercase font-semibold mt-0.5">Shortlist</p>
                  </div>
                </div>

                <Link
                  href={`/hiring-manager/openings/${op.id}`}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs shadow hover:opacity-90 transition-all"
                >
                  Review AI Profiles
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
