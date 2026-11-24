import { describe, it, expect } from "vitest";
import { ToolRegistry } from "../../src/services/ai/tools/toolRegistry.js";

describe("Phase 2: Tool Registry & Deterministic Tool Definitions", () => {
  it("should declare all required tools with valid OpenAI/Groq function schemas", () => {
    const tools = ToolRegistry.getToolDefinitions();
    const toolNames = tools.map((t) => t.function.name);

    expect(toolNames).toContain("resume_parsing_tool");
    expect(toolNames).toContain("feature_extraction_tool");
    expect(toolNames).toContain("skill_normalization_tool");
    expect(toolNames).toContain("deterministic_matching_engine");
    expect(toolNames).toContain("scoring_engine");

    for (const tool of tools) {
      expect(tool.type).toBe("function");
      expect(tool.function.description.length).toBeGreaterThan(15);
      expect(tool.function.parameters.type).toBe("object");
      expect(Array.isArray(tool.function.parameters.required)).toBe(true);
    }
  });

  it("should execute skill_normalization_tool and map synonyms into canonical taxonomy", async () => {
    const result = await ToolRegistry.executeTool("skill_normalization_tool", {
      skills: ["reactjs", "k8s", "postgres", "nodejs", "aws"],
    });

    expect(result.normalizedSkills).toContain("React");
    expect(result.normalizedSkills).toContain("Kubernetes");
    expect(result.normalizedSkills).toContain("PostgreSQL");
    expect(result.normalizedSkills).toContain("Node.js");
    expect(result.normalizedSkills).toContain("AWS");
  });

  it("should execute feature_extraction_tool and return validated candidate features", async () => {
    const rawFeatures = {
      experienceYears: 6,
      skills: ["Python", "fastapi", "docker"],
      location: "Gotham City, NY",
      education: ["B.S. in Computer Science"],
      keywords: ["backend", "cloud"],
    };

    const result = await ToolRegistry.executeTool("feature_extraction_tool", rawFeatures);

    expect(result.experienceYears).toBe(6);
    expect(result.normalizedSkills).toContain("Python");
    expect(result.normalizedSkills).toContain("FastAPI");
    expect(result.normalizedSkills).toContain("Docker");
    expect(result.location).toBe("Gotham City, NY");
  });

  it("should execute deterministic_matching_engine and return exact formula score", async () => {
    // Skill overlap: 2/4 = 0.5
    // Experience: 5 in [3, 8] = 1.0
    // Location: Exact match = 1.0
    // Formula: (0.5 * 0.5) + (0.3 * 1.0) + (0.2 * 1.0) = 0.25 + 0.30 + 0.20 = 0.75
    const scoringArgs = {
      candidateExp: 5,
      experienceMin: 3,
      experienceMax: 8,
      candidateSkills: ["React", "TypeScript"],
      requiredSkills: ["React", "TypeScript", "Node.js", "PostgreSQL"],
      candidateLocation: "Gotham City",
      openingLocation: "Gotham City",
    };

    const result = await ToolRegistry.executeTool("deterministic_matching_engine", scoringArgs);

    expect(result.skillMatchScore).toBe(0.5);
    expect(result.experienceMatchScore).toBe(1.0);
    expect(result.locationMatchScore).toBe(1.0);
    expect(result.finalScore).toBe(0.75);
  });

  it("should execute scoring_engine and evaluate decision thresholds correctly", async () => {
    const rec = await ToolRegistry.executeTool("scoring_engine", { finalScore: 0.82 });
    expect(rec.recommended).toBe(true);
    expect(rec.category).toBe("Recommended");

    const borderline = await ToolRegistry.executeTool("scoring_engine", { finalScore: 0.65 });
    expect(borderline.recommended).toBe(false);
    expect(borderline.category).toBe("Borderline");

    const rejected = await ToolRegistry.executeTool("scoring_engine", { finalScore: 0.35 });
    expect(rejected.recommended).toBe(false);
    expect(rejected.category).toBe("Not Recommended");
  });
});
