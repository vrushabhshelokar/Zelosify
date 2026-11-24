import { normalizeSkills } from "./skillNormalizer.js";
import { validateFeatureExtraction } from "../schemaValidator.js";

export interface CandidateFeatures {
  experienceYears: number;
  skills: string[];
  normalizedSkills: string[];
  location: string;
  education: string[];
  keywords: string[];
}

/**
 * Feature Extraction Tool
 * Normalizes, validates, and refines candidate profile features extracted during agent execution.
 */
export function processCandidateFeatures(rawFeatures: {
  experienceYears?: number;
  skills?: string[];
  location?: string;
  education?: string[];
  keywords?: string[];
}): CandidateFeatures {
  const experienceYears = typeof rawFeatures.experienceYears === "number" && !isNaN(rawFeatures.experienceYears)
    ? Math.max(0, rawFeatures.experienceYears)
    : 0;

  const rawSkills = Array.isArray(rawFeatures.skills) ? rawFeatures.skills : [];
  const normalized = normalizeSkills(rawSkills);

  const location = (rawFeatures.location && typeof rawFeatures.location === "string")
    ? rawFeatures.location.trim()
    : "Not Specified";

  const education = Array.isArray(rawFeatures.education) ? rawFeatures.education : [];
  const keywords = Array.isArray(rawFeatures.keywords) ? rawFeatures.keywords : [];

  const candidateFeatures: CandidateFeatures = {
    experienceYears,
    skills: rawSkills,
    normalizedSkills: normalized,
    location,
    education,
    keywords,
  };

  const validation = validateFeatureExtraction(candidateFeatures);
  if (!validation.isValid) {
    console.warn("[FeatureExtractor] Schema validation warnings:", validation.errors);
  }

  return candidateFeatures;
}
