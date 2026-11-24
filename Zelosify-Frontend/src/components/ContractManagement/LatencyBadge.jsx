"use client";

import React from "react";
import { Zap } from "lucide-react";

export default function LatencyBadge({ latencyMs = 0 }) {
  const isWithinSLA = latencyMs <= 1500;

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium border transition-colors shadow-sm ${
        isWithinSLA
          ? "bg-[#3080ff]/10 text-[#3080ff] border-[#3080ff]/30 shadow-[0_0_10px_rgba(48,128,255,0.15)]"
          : "bg-[#f99c00]/10 text-[#f99c00] border-[#f99c00]/30"
      }`}
      title={`AI Orchestration Latency: ${latencyMs}ms (Target: < 1500ms)`}
    >
      <Zap className="w-3.5 h-3.5 fill-current" />
      <span className="font-bold tabular-nums">{latencyMs}ms</span>
      <span className="text-[10px] text-zinc-400 hidden sm:inline">
        {isWithinSLA ? "· SLA Met" : "· SLA Exceeded"}
      </span>
    </div>
  );
}
