export interface ScoringInput {
  candidateExp: number;
  experienceMin: number;
  experienceMax?: number | null;
  candidateSkills: string[];
  requiredSkills: string[];
  candidateLocation: string;
  openingLocation: string;
}

export interface ScoringOutput {
  skillMatchScore: number;
  experienceMatchScore: number;
  locationMatchScore: number;
  finalScore: number;
}

/**
 * Deterministic Scoring Engine
 * Mandated Formula:
 * FinalScore = (0.5 * skillMatchScore) + (0.3 * experienceMatchScore) + (0.2 * locationMatchScore)
 * 
 * Rules:
 * - Experience Logic:
 *   if candidateExp < min -> 0
 *   if within range [min, max] -> 1
 *   if above max -> 0.8
 * - Skill Match:
 *   overlap / requiredSkills
 * - Location Match:
 *   Remote -> 1
 *   Onsite mismatch -> 0.5
 *   Exact match -> 1
 */
export function calculateDeterministicScore(input: ScoringInput): ScoringOutput {
  const {
    candidateExp,
    experienceMin,
    experienceMax,
    candidateSkills = [],
    requiredSkills = [],
    candidateLocation = "",
    openingLocation = "",
  } = input;

  // 1. Experience Score
  let experienceMatchScore = 0;
  if (candidateExp < experienceMin) {
    experienceMatchScore = 0;
  } else if (experienceMax != null && candidateExp > experienceMax) {
    experienceMatchScore = 0.8;
  } else {
    experienceMatchScore = 1.0;
  }

  // 2. Skill Match Score (Case-insensitive overlap ratio)
  let skillMatchScore = 1.0;
  if (requiredSkills.length > 0) {
    const normalizedCandidateSkills = new Set(
      candidateSkills.map((s) => s.trim().toLowerCase())
    );

    let overlapCount = 0;
    for (const reqSkill of requiredSkills) {
      const normalizedReq = reqSkill.trim().toLowerCase();
      if (
        normalizedCandidateSkills.has(normalizedReq) ||
        Array.from(normalizedCandidateSkills).some((c) => c.includes(normalizedReq) || normalizedReq.includes(c))
      ) {
        overlapCount++;
      }
    }
    skillMatchScore = Math.min(1.0, Math.max(0.0, overlapCount / requiredSkills.length));
  }

  // 3. Location Match Score
  let locationMatchScore = 0.5;
  const candLocNorm = candidateLocation.trim().toLowerCase();
  const openLocNorm = openingLocation.trim().toLowerCase();

  if (
    candLocNorm.includes("remote") ||
    openLocNorm.includes("remote") ||
    candLocNorm === "anywhere"
  ) {
    locationMatchScore = 1.0;
  } else if (
    candLocNorm === openLocNorm ||
    candLocNorm.includes(openLocNorm) ||
    openLocNorm.includes(candLocNorm)
  ) {
    locationMatchScore = 1.0;
  } else {
    locationMatchScore = 0.5; // Onsite mismatch
  }

  // 4. Mandatory Weighted Formula
  const rawFinalScore =
    0.5 * skillMatchScore +
    0.3 * experienceMatchScore +
    0.2 * locationMatchScore;

  // Round to 2 decimal places
  const finalScore = Math.round(rawFinalScore * 100) / 100;

  return {
    skillMatchScore: Math.round(skillMatchScore * 100) / 100,
    experienceMatchScore: Math.round(experienceMatchScore * 100) / 100,
    locationMatchScore: Math.round(locationMatchScore * 100) / 100,
    finalScore,
  };
}

export type DecisionCategory = "Recommended" | "Borderline" | "Not Recommended";

export function evaluateDecisionThreshold(finalScore: number): {
  recommended: boolean;
  category: DecisionCategory;
} {
  if (finalScore >= 0.75) {
    return { recommended: true, category: "Recommended" };
  } else if (finalScore >= 0.5) {
    return { recommended: false, category: "Borderline" };
  } else {
    return { recommended: false, category: "Not Recommended" };
  }
}
