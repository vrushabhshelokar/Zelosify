import Ajv, { type ValidateFunction } from "ajv";

const ajv = new Ajv({ allErrors: true, coerceTypes: true });

// 1. Resume Feature Extraction Schema
export const FeatureExtractionSchema = {
  type: "object",
  properties: {
    experienceYears: { type: "number", minimum: 0 },
    skills: { type: "array", items: { type: "string" } },
    normalizedSkills: { type: "array", items: { type: "string" } },
    location: { type: "string" },
    education: { type: "array", items: { type: "string" } },
    keywords: { type: "array", items: { type: "string" } },
  },
  required: ["experienceYears", "skills", "location"],
  additionalProperties: true,
};

// 2. Scoring Output Schema
export const ScoringOutputSchema = {
  type: "object",
  properties: {
    skillMatchScore: { type: "number", minimum: 0, maximum: 1 },
    experienceMatchScore: { type: "number", minimum: 0, maximum: 1 },
    locationMatchScore: { type: "number", minimum: 0, maximum: 1 },
    finalScore: { type: "number", minimum: 0, maximum: 1 },
  },
  required: [
    "skillMatchScore",
    "experienceMatchScore",
    "locationMatchScore",
    "finalScore",
  ],
  additionalProperties: false,
};

// 3. Agent Recommendation Output Schema
export const AgentRecommendationSchema = {
  type: "object",
  properties: {
    recommended: { type: "boolean" },
    score: { type: "number", minimum: 0, maximum: 1 },
    confidence: { type: "number", minimum: 0, maximum: 1 },
    reason: { type: "string", minLength: 5 },
  },
  required: ["recommended", "score", "confidence", "reason"],
  additionalProperties: false,
};

const validateFeatureExtractionFn = ajv.compile(FeatureExtractionSchema);
const validateScoringOutputFn = ajv.compile(ScoringOutputSchema);
const validateAgentRecommendationFn = ajv.compile(AgentRecommendationSchema);

export interface ValidationResult<T> {
  isValid: boolean;
  data?: T;
  errors?: string[];
}

export function validateSchema<T>(
  validateFn: ValidateFunction,
  data: unknown
): ValidationResult<T> {
  const isValid = validateFn(data);
  if (isValid) {
    return { isValid: true, data: data as T };
  }
  const errors = validateFn.errors?.map((err) => `${err.instancePath} ${err.message}`) || [
    "Invalid schema",
  ];
  return { isValid: false, errors };
}

export const validateFeatureExtraction = (data: unknown) =>
  validateSchema<{
    experienceYears: number;
    skills: string[];
    normalizedSkills: string[];
    location: string;
    education: string[];
    keywords: string[];
  }>(validateFeatureExtractionFn, data);

export const validateScoringOutput = (data: unknown) =>
  validateSchema<{
    skillMatchScore: number;
    experienceMatchScore: number;
    locationMatchScore: number;
    finalScore: number;
  }>(validateScoringOutputFn, data);

export const validateAgentRecommendation = (data: unknown) =>
  validateSchema<{
    recommended: boolean;
    score: number;
    confidence: number;
    reason: string;
  }>(validateAgentRecommendationFn, data);
