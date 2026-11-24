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
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#00d294]/10 text-[#00d294] border border-[#00d294]/30 shadow-[0_0_10px_rgba(0,210,148,0.15)]"
          >
            <Check className="w-3.5 h-3.5 text-[#00d294] stroke-[3]" />
            {skill}
          </span>
        ))}

        {/* Additional candidate skills */}
        {additionalSkills
          .slice(0, Math.max(0, maxDisplay - matchedSkills.length))
          .map((skill, idx) => (
            <span
              key={`add-${idx}`}
              className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-zinc-900/80 text-zinc-300 border border-zinc-800"
            >
              {skill}
            </span>
          ))}

        {/* Overflow indicator */}
        {overflowCount > 0 && (
          <span className="text-xs text-zinc-500 font-mono font-medium px-1.5 py-0.5">
            +{overflowCount} more
          </span>
        )}
      </div>

      {/* Missing critical skills warning chip if any */}
      {missingSkills.length > 0 && (
        <div className="flex items-center gap-1 text-[11px] text-zinc-400 pt-1 flex-wrap">
          <span className="flex items-center gap-1 text-[#f99c00] font-medium">
            <AlertCircle className="w-3 h-3" /> Missing required:
          </span>
          {missingSkills.slice(0, 3).map((m, idx) => (
            <span
              key={`miss-${idx}`}
              className="px-2 py-0.5 rounded-md border border-dashed border-[#f99c00]/40 text-[#f99c00] bg-[#f99c00]/10 text-[10px] font-mono"
            >
              {m}
            </span>
          ))}
          {missingSkills.length > 3 && (
            <span className="text-[10px] text-zinc-500 font-mono">
              +{missingSkills.length - 3} more
            </span>
          )}
        </div>
      )}
    </div>
  );
}
