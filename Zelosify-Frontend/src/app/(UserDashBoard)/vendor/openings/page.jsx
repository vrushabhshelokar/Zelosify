"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import axiosInstance from "@/utils/Axios/AxiosInstance";
import {
  Briefcase,
  MapPin,
  Calendar,
  User,
  ChevronRight,
  Search,
  ArrowUpDown,
  Loader2,
  AlertCircle,
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
      const res = await axiosInstance.get(`/vendor/openings?page=${targetPage}&limit=10`);
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

  const filteredOpenings = openings.filter((op) =>
    op.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    op.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    op.contractType?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <Briefcase className="w-8 h-8 text-primary" />
            Contract Openings
          </h1>
          <p className="text-muted-foreground mt-1">
            Browse active contract requisitions under your tenant and submit candidate profiles.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by title, location, type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
          />
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
          <button
            onClick={() => fetchOpenings(page)}
            className="ml-auto text-xs underline font-medium hover:opacity-80"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-16 rounded-xl bg-muted/60 animate-pulse border border-border/50"
            />
          ))}
        </div>
      ) : filteredOpenings.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-xl bg-card">
          <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
          <h3 className="text-lg font-medium text-foreground">No contract openings found</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Check back later or adjust your search filter.
          </p>
        </div>
      ) : (
        /* Openings Table */
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="py-3.5 px-6">Title</th>
                  <th className="py-3.5 px-6">Location</th>
                  <th className="py-3.5 px-6">Contract Type</th>
                  <th className="py-3.5 px-6">Posted Date</th>
                  <th className="py-3.5 px-6">Hiring Manager</th>
                  <th className="py-3.5 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {filteredOpenings.map((opening) => (
                  <tr
                    key={opening.id}
                    className="hover:bg-muted/30 transition-colors group cursor-pointer"
                  >
                    <td className="py-4 px-6 font-medium text-foreground">
                      <div className="flex flex-col">
                        <span className="font-semibold text-base group-hover:text-primary transition-colors">
                          {opening.title}
                        </span>
                        <span className="text-xs text-muted-foreground mt-0.5">
                          Req Exp: {opening.experienceMin} - {opening.experienceMax ?? "N/A"} years
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-muted-foreground/70" />
                        <span>{opening.location}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground border border-border">
                        {opening.contractType}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-muted-foreground text-xs">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground/70" />
                        <span>{new Date(opening.postedDate).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-foreground font-medium text-xs">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-muted-foreground/70" />
                        <span>{opening.hiringManagerName}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Link
                        href={`/vendor/openings/${opening.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline group-hover:translate-x-0.5 transition-transform"
                      >
                        Submit Profiles
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/20 text-xs text-muted-foreground">
              <span>
                Showing page <strong className="text-foreground">{pagination.page}</strong> of{" "}
                <strong className="text-foreground">{pagination.totalPages}</strong> (
                {pagination.total} openings)
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded border border-border bg-background disabled:opacity-40 hover:bg-muted font-medium transition-colors"
                >
                  Previous
                </button>
                <button
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  className="px-3 py-1.5 rounded border border-border bg-background disabled:opacity-40 hover:bg-muted font-medium transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
