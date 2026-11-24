import { describe, it, expect } from "vitest";
import { runAgentRecommendation } from "../../src/services/ai/agentOrchestrator.js";
import { ObservabilityLogger } from "../../src/services/ai/observabilityLogger.js";
import { validateAgentRecommendation } from "../../src/services/ai/schemaValidator.js";

describe("Phase 3: AI Recommendation Agent Orchestrator & Observability", () => {
  it("should run agent recommendation and produce complete result satisfying latency constraints", async () => {
    const input = {
      profileId: 101,
      openingId: "test-opening-id",
      openingTitle: "Senior TypeScript Engineer",
      openingDescription: "We need an engineer experienced with React, Node.js, and TypeScript.",
      openingLocation: "Remote",
      experienceMin: 4,
      experienceMax: 8,
      requiredSkills: ["React", "Node.js", "TypeScript"],
      resumeText: "Experienced Software Engineer with 6 years working on scalable React and Node.js microservices. Location: Remote. Education: B.S. in CS.",
      fileName: "john_doe_resume.pdf",
    };

    const result = await runAgentRecommendation(input);

    expect(result.profileId).toBe(101);
    expect(result.recommended).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(0.75); // Should be recommended
    expect(result.confidence).toBeGreaterThanOrEqual(0.7);
    expect(result.reason).toContain("Recommended");
    expect(result.latencyMs).toBeLessThanOrEqual(1500); // Strict SLA
    expect(result.tokenUsage.totalTokens).toBeGreaterThan(0);
    expect(result.version).toBe("zelosify-ai-agent-v1.0");
  });

  it("should enforce schema validation layer and reject malformed agent outputs", () => {
    const malformedOutput1 = {
      recommended: "yes", // should be boolean
      score: 1.5, // should be <= 1.0
      confidence: 0.9,
      // missing reason
    };

    const validation1 = validateAgentRecommendation(malformedOutput1);
    expect(validation1.isValid).toBe(false);
    expect(validation1.errors?.length).toBeGreaterThan(0);

    const validOutput = {
      recommended: true,
      score: 0.85,
      confidence: 0.92,
      reason: "Strong skill and experience alignment with requisition requirements.",
    };

    const validation2 = validateAgentRecommendation(validOutput);
    expect(validation2.isValid).toBe(true);
  });

  it("should write structured JSON log entries complying with observability requirements", () => {
    const entry = ObservabilityLogger.log({
      profileId: 50,
      openingId: "op-uuid-1",
      startTime: new Date().toISOString(),
      parsingTimeMs: 12,
      matchingTimeMs: 4,
      finalScore: 0.88,
      tokenUsage: { promptTokens: 350, completionTokens: 80, totalTokens: 430 },
      latencyMs: 125,
      errors: [],
    });

    expect(entry.profileId).toBe(50);
    expect(entry.parsingTimeMs).toBe(12);
    expect(entry.matchingTimeMs).toBe(4);
    expect(entry.finalScore).toBe(0.88);
    expect(entry.tokenUsage.totalTokens).toBe(430);
    expect(entry.timestamp).toBeDefined();
  });
});
