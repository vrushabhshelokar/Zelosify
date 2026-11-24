import React from "react";

export default function HiringManagerOpeningsLoading() {
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

      {/* Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, idx) => (
          <div
            key={idx}
            className="h-64 rounded-2xl bg-muted/50 animate-pulse border border-border/50"
          />
        ))}
      </div>
    </div>
  );
}
