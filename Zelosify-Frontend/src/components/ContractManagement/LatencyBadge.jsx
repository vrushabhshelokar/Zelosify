"use client";

import React from "react";
import { Zap, Clock, ShieldCheck, AlertTriangle } from "lucide-react";

export default function LatencyBadge({ latencyMs = 0 }) {
  const isWithinSLA = latencyMs <= 1500;

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
        isWithinSLA
          ? "bg-primary/10 text-primary border-primary/20"
          : "bg-amber-500/10 text-amber-600 border-amber-500/30"
      }`}
      title={`AI Orchestration Latency: ${latencyMs}ms (Target: < 1500ms)`}
    >
      <Zap className="w-3.5 h-3.5 fill-current" />
      <span className="font-semibold">{latencyMs}ms</span>
      <span className="text-[10px] text-muted-foreground hidden sm:inline">
        {isWithinSLA ? "· SLA Met" : "· SLA Exceeded"}
      </span>
    </div>
  );
}
