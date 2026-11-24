"use client";

import React, { useState } from "react";
import { Info, Sparkles, Award, MapPin, Briefcase } from "lucide-react";

export default function FormulaBreakdown({
  skillScore = 0,
  expScore = 0,
  locScore = 0,
  compact = false,
}) {
  const [showDetails, setShowDetails] = useState(false);

  // Normalize scores to percentage
  const normSkill = Math.round((skillScore > 1 ? skillScore : skillScore * 100));
  const normExp = Math.round((expScore > 1 ? expScore : expScore * 100));
  const normLoc = Math.round((locScore > 1 ? locScore : locScore * 100));

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-zinc-400 flex-wrap">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900/80 text-zinc-200 font-medium border border-zinc-800/80 shadow-sm">
          <Award className="w-3.5 h-3.5 text-[#00d294]" />
          Skills: <span className="font-mono text-white tabular-nums">{normSkill}%</span>
          <span className="text-[10px] text-zinc-500 font-mono">(50%)</span>
        </span>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900/80 text-zinc-200 font-medium border border-zinc-800/80 shadow-sm">
          <Briefcase className="w-3.5 h-3.5 text-[#3080ff]" />
          Exp: <span className="font-mono text-white tabular-nums">{normExp}%</span>
          <span className="text-[10px] text-zinc-500 font-mono">(30%)</span>
        </span>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900/80 text-zinc-200 font-medium border border-zinc-800/80 shadow-sm">
          <MapPin className="w-3.5 h-3.5 text-[#f99c00]" />
          Loc: <span className="font-mono text-white tabular-nums">{normLoc}%</span>
          <span className="text-[10px] text-zinc-500 font-mono">(20%)</span>
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-4 space-y-3 backdrop-blur-md shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-zinc-400 uppercase tracking-[0.15em] flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#3080ff]" />
          Deterministic Match Model
        </span>
        <button
          type="button"
          onClick={() => setShowDetails(!showDetails)}
          className="text-xs text-[#3080ff] hover:text-[#5b9bff] flex items-center gap-1 font-medium transition-colors"
        >
          <Info className="w-3.5 h-3.5" />
          {showDetails ? "Hide Formula" : "Transparency Formula"}
        </button>
      </div>

      {showDetails && (
        <div className="text-xs text-zinc-300 bg-black/60 p-3 rounded-xl border border-zinc-800 font-mono leading-relaxed shadow-inner">
          <span className="text-[#3080ff] font-bold">FinalScore</span> = (0.50 × SkillMatch) + (0.30 × ExpMatch) + (0.20 × LocationMatch)
          <div className="text-[11px] text-zinc-400 mt-1 font-sans">
            ✓ Evaluated deterministically outside the LLM. 0% hallucination variance guaranteed.
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
        {/* Skills */}
        <div className="bg-zinc-950/70 rounded-xl p-3 border border-zinc-800/80 shadow-sm">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="flex items-center gap-1.5 font-medium text-zinc-200">
              <Award className="w-3.5 h-3.5 text-[#00d294]" />
              Skills Match
            </span>
            <span className="font-mono font-bold text-[#00d294] tabular-nums">{normSkill}%</span>
          </div>
          <div className="w-full bg-zinc-800/60 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-[#00d294] h-1.5 rounded-full transition-all duration-700 shadow-[0_0_8px_rgba(0,210,148,0.5)]"
              style={{ width: `${Math.min(100, Math.max(0, normSkill))}%` }}
            />
          </div>
          <span className="text-[10px] text-zinc-500 font-mono mt-1.5 block">50% weight in model</span>
        </div>

        {/* Experience */}
        <div className="bg-zinc-950/70 rounded-xl p-3 border border-zinc-800/80 shadow-sm">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="flex items-center gap-1.5 font-medium text-zinc-200">
              <Briefcase className="w-3.5 h-3.5 text-[#3080ff]" />
              Experience
            </span>
            <span className="font-mono font-bold text-[#3080ff] tabular-nums">{normExp}%</span>
          </div>
          <div className="w-full bg-zinc-800/60 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-[#3080ff] h-1.5 rounded-full transition-all duration-700 shadow-[0_0_8px_rgba(48,128,255,0.5)]"
              style={{ width: `${Math.min(100, Math.max(0, normExp))}%` }}
            />
          </div>
          <span className="text-[10px] text-zinc-500 font-mono mt-1.5 block">30% weight in model</span>
        </div>

        {/* Location */}
        <div className="bg-zinc-950/70 rounded-xl p-3 border border-zinc-800/80 shadow-sm">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="flex items-center gap-1.5 font-medium text-zinc-200">
              <MapPin className="w-3.5 h-3.5 text-[#f99c00]" />
              Location
            </span>
            <span className="font-mono font-bold text-[#f99c00] tabular-nums">{normLoc}%</span>
          </div>
          <div className="w-full bg-zinc-800/60 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-[#f99c00] h-1.5 rounded-full transition-all duration-700 shadow-[0_0_8px_rgba(249,156,0,0.5)]"
              style={{ width: `${Math.min(100, Math.max(0, normLoc))}%` }}
            />
          </div>
          <span className="text-[10px] text-zinc-500 font-mono mt-1.5 block">20% weight in model</span>
        </div>
      </div>
    </div>
  );
}
