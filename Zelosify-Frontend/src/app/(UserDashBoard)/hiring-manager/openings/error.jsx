"use client";

import React, { useEffect } from "react";
import { AlertCircle, RotateCcw } from "lucide-react";

export default function HiringManagerOpeningsError({ error, reset }) {
  useEffect(() => {
    console.error("[HiringManagerOpenings] Route Boundary Error:", error);
  }, [error]);

  return (
    <div className="p-8 max-w-2xl mx-auto my-12 text-center rounded-2xl border border-destructive/20 bg-destructive/5 space-y-4">
      <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
      <h2 className="text-xl font-bold text-foreground">Failed to Load Managed Openings</h2>
      <p className="text-sm text-muted-foreground">
        {error?.message || "An unexpected error occurred while loading your candidate profiles."}
      </p>
      <div className="pt-2">
        <button
          onClick={() => reset()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all shadow-sm"
        >
          <RotateCcw className="w-4 h-4" /> Try Again
        </button>
      </div>
    </div>
  );
}
