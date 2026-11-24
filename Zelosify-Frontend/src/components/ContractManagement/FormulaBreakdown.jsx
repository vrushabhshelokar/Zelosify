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
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary/60 text-foreground font-medium border border-border/50">
          <Award className="w-3 h-3 text-emerald-500" />
          Skills: {normSkill}% <span className="text-[10px] text-muted-foreground">(50%)</span>
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary/60 text-foreground font-medium border border-border/50">
          <Briefcase className="w-3 h-3 text-sky-500" />
          Exp: {normExp}% <span className="text-[10px] text-muted-foreground">(30%)</span>
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary/60 text-foreground font-medium border border-border/50">
          <MapPin className="w-3 h-3 text-amber-500" />
          Loc: {normLoc}% <span className="text-[10px] text-muted-foreground">(20%)</span>
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/60 bg-card/60 p-3.5 space-y-2.5 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          Deterministic Match Breakdown
        </span>
        <button
          type="button"
          onClick={() => setShowDetails(!showDetails)}
          className="text-[11px] text-primary hover:underline flex items-center gap-1 font-medium transition-colors"
        >
          <Info className="w-3 h-3" />
          {showDetails ? "Hide Formula" : "View Formula"}
        </button>
      </div>

      {showDetails && (
        <div className="text-[11px] text-muted-foreground bg-secondary/40 p-2.5 rounded-lg border border-border/40 font-mono">
          FinalScore = (0.50 × SkillMatch) + (0.30 × ExpMatch) + (0.20 × LocationMatch)
          <div className="text-[10px] text-muted-foreground/80 mt-1 font-sans">
            ✓ Computed deterministically outside the LLM to prevent score hallucinations.
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1">
        {/* Skills */}
        <div className="bg-secondary/30 rounded-lg p-2 border border-border/40">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="flex items-center gap-1 font-medium text-foreground">
              <Award className="w-3.5 h-3.5 text-emerald-500" />
              Skills Match
            </span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">{normSkill}%</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, normSkill))}%` }}
            />
          </div>
          <span className="text-[10px] text-muted-foreground mt-1 block">50% weight in model</span>
        </div>

        {/* Experience */}
        <div className="bg-secondary/30 rounded-lg p-2 border border-border/40">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="flex items-center gap-1 font-medium text-foreground">
              <Briefcase className="w-3.5 h-3.5 text-sky-500" />
              Experience
            </span>
            <span className="font-bold text-sky-600 dark:text-sky-400">{normExp}%</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-sky-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, normExp))}%` }}
            />
          </div>
          <span className="text-[10px] text-muted-foreground mt-1 block">30% weight in model</span>
        </div>

        {/* Location */}
        <div className="bg-secondary/30 rounded-lg p-2 border border-border/40">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="flex items-center gap-1 font-medium text-foreground">
              <MapPin className="w-3.5 h-3.5 text-amber-500" />
              Location
            </span>
            <span className="font-bold text-amber-600 dark:text-amber-400">{normLoc}%</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-amber-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, normLoc))}%` }}
            />
          </div>
          <span className="text-[10px] text-muted-foreground mt-1 block">20% weight in model</span>
        </div>
      </div>
    </div>
  );
}
