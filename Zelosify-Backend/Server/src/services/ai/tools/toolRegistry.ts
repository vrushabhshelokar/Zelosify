import { calculateDeterministicScore, evaluateDecisionThreshold, type ScoringInput, type ScoringOutput } from "./scoringEngine.js";
import { normalizeSkills } from "./skillNormalizer.js";
import { processCandidateFeatures, type CandidateFeatures } from "./featureExtractor.js";
import { parseResumeDocument, type ParsedResumeDocument } from "./resumeParser.js";
import { validateFeatureExtraction, validateScoringOutput } from "../schemaValidator.js";

export interface ToolDefinition {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, any>;
  };
}

/**
 * Formal Tool Registry declarations for LLM Function/Tool-Calling
 */
export const TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "resume_parsing_tool",
      description: "Parse binary resume content (PDF/PPTX) securely retrieved from S3 into sanitized, prompt-injection-safe plain text.",
      parameters: {
        type: "object",
        properties: {
          fileName: { type: "string", description: "The name of the resume file (e.g., candidate_resume.pdf)." },
        },
        required: ["fileName"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "feature_extraction_tool",
      description: "Extract structured candidate profile attributes (experience years, skills, location, education, keywords) from resume content.",
      parameters: {
        type: "object",
        properties: {
          experienceYears: {
            type: "number",
            description: "Total years of relevant professional experience.",
          },
          skills: {
            type: "array",
            items: { type: "string" },
            description: "List of technical skills, frameworks, and programming languages extracted from resume.",
          },
          location: {
            type: "string",
            description: "Candidate's current location or 'Remote'.",
          },
          education: {
            type: "array",
            items: { type: "string" },
            description: "Academic degrees or certifications.",
          },
          keywords: {
            type: "array",
            items: { type: "string" },
            description: "Important domain or industry keywords.",
          },
        },
        required: ["experienceYears", "skills", "location"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "skill_normalization_tool",
      description: "Normalize candidate skills into the canonical technology taxonomy (e.g., 'ReactJS' -> 'React', 'k8s' -> 'Kubernetes').",
      parameters: {
        type: "object",
        properties: {
          skills: {
            type: "array",
            items: { type: "string" },
            description: "List of raw skill strings to normalize.",
          },
        },
        required: ["skills"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "deterministic_matching_engine",
      description: "MANDATORY SCORING TOOL: Computes the exact mathematical match score (0.5*Skill + 0.3*Exp + 0.2*Loc). The LLM must NEVER calculate scores mentally.",
      parameters: {
        type: "object",
        properties: {
          candidateExp: { type: "number", description: "Candidate years of experience." },
          experienceMin: { type: "number", description: "Minimum experience required for opening." },
          experienceMax: { type: "number", description: "Maximum experience threshold if any." },
          candidateSkills: {
            type: "array",
            items: { type: "string" },
            description: "Candidate normalized technical skills.",
          },
          requiredSkills: {
            type: "array",
            items: { type: "string" },
            description: "Required technical skills for the opening.",
          },
          candidateLocation: { type: "string", description: "Candidate location." },
          openingLocation: { type: "string", description: "Opening location." },
        },
        required: ["candidateExp", "candidateSkills", "requiredSkills", "candidateLocation", "openingLocation", "experienceMin"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "scoring_engine",
      description: "Evaluates final decision threshold classification ('Recommended' >= 0.75, 'Borderline' 0.50-0.74, 'Not Recommended' < 0.50).",
      parameters: {
        type: "object",
        properties: {
          finalScore: { type: "number", description: "The calculated final score (0.0 to 1.0)." },
        },
        required: ["finalScore"],
      },
    },
  },
];

/**
 * Tool Registry Dispatcher
 * Dispatches LLM tool call requests to their deterministic implementation functions.
 */
export class ToolRegistry {
  public static async executeTool(
    name: string,
    args: Record<string, any>,
    context?: { fileBuffer?: Buffer; fileName?: string }
  ): Promise<any> {
    switch (name) {
      case "resume_parsing_tool":
      case "parse_resume": {
        const buffer = context?.fileBuffer || Buffer.from("");
        const fileName = args.fileName || context?.fileName || "resume.pdf";
        return await parseResumeDocument(buffer, fileName);
      }

      case "feature_extraction_tool":
      case "extract_candidate_features": {
        const features = processCandidateFeatures(args);
        const validation = validateFeatureExtraction(features);
        if (!validation.isValid) {
          console.warn("[ToolRegistry] Feature extraction validation warnings:", validation.errors);
        }
        return features;
      }

      case "skill_normalization_tool":
      case "normalize_candidate_skills": {
        const rawSkills = Array.isArray(args.skills) ? args.skills : [];
        const normalized = normalizeSkills(rawSkills);
        return { normalizedSkills: normalized };
      }

      case "deterministic_matching_engine":
      case "calculate_deterministic_score": {
        const scoringInput: ScoringInput = {
          candidateExp: args.candidateExp ?? 0,
          experienceMin: args.experienceMin ?? 0,
          experienceMax: args.experienceMax ?? null,
          candidateSkills: args.candidateSkills ?? [],
          requiredSkills: args.requiredSkills ?? [],
          candidateLocation: args.candidateLocation ?? "Remote",
          openingLocation: args.openingLocation ?? "Remote",
        };
        const score = calculateDeterministicScore(scoringInput);
        const validation = validateScoringOutput(score);
        if (!validation.isValid) {
          console.warn("[ToolRegistry] Scoring output validation warnings:", validation.errors);
        }
        return score;
      }

      case "scoring_engine":
      case "evaluate_decision_threshold": {
        const finalScore = typeof args.finalScore === "number" ? args.finalScore : 0;
        return evaluateDecisionThreshold(finalScore);
      }

      default:
        throw new Error(`[ToolRegistry] Unknown tool requested: ${name}`);
    }
  }

  public static getToolDefinitions(): ToolDefinition[] {
    return TOOL_DEFINITIONS;
  }
}
