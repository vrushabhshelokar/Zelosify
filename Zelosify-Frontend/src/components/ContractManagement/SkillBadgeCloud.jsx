"use client";

import React from "react";
import { Check, AlertCircle } from "lucide-react";

export default function SkillBadgeCloud({
  candidateSkills = [],
  requiredSkills = [],
  maxDisplay = 8,
}) {
  const normCandidate = Array.isArray(candidateSkills)
    ? candidateSkills.map((s) => (typeof s === "string" ? s.trim() : ""))
    : [];
  const normRequired = Array.isArray(requiredSkills)
    ? requiredSkills.map((s) => (typeof s === "string" ? s.trim() : ""))
    : [];

  // Match canonical names case-insensitively
  const matchedSkills = normCandidate.filter((cSkill) =>
    normRequired.some((rSkill) => rSkill.toLowerCase() === cSkill.toLowerCase())
  );

  const additionalSkills = normCandidate.filter(
    (cSkill) => !normRequired.some((rSkill) => rSkill.toLowerCase() === cSkill.toLowerCase())
  );

  const missingSkills = normRequired.filter(
    (rSkill) => !normCandidate.some((cSkill) => cSkill.toLowerCase() === rSkill.toLowerCase())
  );

  const totalVisible = matchedSkills.length + additionalSkills.length;
  const overflowCount = Math.max(0, totalVisible - maxDisplay);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 flex-wrap">
        {/* Matched Skills */}
        {matchedSkills.slice(0, maxDisplay).map((skill, idx) => (
          <span
            key={`match-${idx}`}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
          >
            <Check className="w-3 h-3 text-emerald-500 stroke-[3]" />
            {skill}
          </span>
        ))}

        {/* Additional candidate skills */}
        {additionalSkills
          .slice(0, Math.max(0, maxDisplay - matchedSkills.length))
          .map((skill, idx) => (
            <span
              key={`add-${idx}`}
              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground border border-border/50"
            >
              {skill}
            </span>
          ))}

        {/* Overflow indicator */}
        {overflowCount > 0 && (
          <span className="text-xs text-muted-foreground font-medium px-1.5 py-0.5">
            +{overflowCount} more
          </span>
        )}
      </div>

      {/* Missing critical skills warning chip if any */}
      {missingSkills.length > 0 && (
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground pt-1 flex-wrap">
          <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
            <AlertCircle className="w-3 h-3" /> Missing required:
          </span>
          {missingSkills.slice(0, 3).map((m, idx) => (
            <span
              key={`miss-${idx}`}
              className="px-1.5 py-0.5 rounded border border-dashed border-amber-500/40 text-amber-700 dark:text-amber-300 bg-amber-500/10 text-[10px]"
            >
              {m}
            </span>
          ))}
          {missingSkills.length > 3 && (
            <span className="text-[10px] text-muted-foreground">
              +{missingSkills.length - 3} more
            </span>
          )}
        </div>
      )}
    </div>
  );
}
