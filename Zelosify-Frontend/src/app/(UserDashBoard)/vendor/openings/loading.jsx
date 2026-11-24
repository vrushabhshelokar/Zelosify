import React from "react";
import { Briefcase } from "lucide-react";

export default function VendorOpeningsLoading() {
  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6 animate-pulse">
        <div className="space-y-2">
          <div className="h-8 w-64 bg-muted rounded-lg" />
          <div className="h-4 w-96 bg-muted/60 rounded-md" />
        </div>
        <div className="h-10 w-80 bg-muted rounded-lg" />
      </div>

      {/* Table Skeleton */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
        {[...Array(6)].map((_, idx) => (
          <div
            key={idx}
            className="h-16 w-full rounded-xl bg-muted/50 animate-pulse border border-border/40"
          />
        ))}
      </div>
    </div>
  );
}
