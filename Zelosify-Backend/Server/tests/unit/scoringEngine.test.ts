import { describe, it, expect } from "vitest";
import {
  calculateDeterministicScore,
  evaluateDecisionThreshold,
} from "../../src/services/ai/tools/scoringEngine.js";

describe("Deterministic Scoring Engine & Decision Thresholds", () => {
  describe("1. Experience Boundary Tests", () => {
    it("should return experienceMatchScore = 0 when candidateExp < min", () => {
      const result = calculateDeterministicScore({
        candidateExp: 2,
        experienceMin: 5,
        experienceMax: 8,
        candidateSkills: ["React"],
        requiredSkills: ["React"],
        candidateLocation: "Remote",
        openingLocation: "Remote",
      });
      expect(result.experienceMatchScore).toBe(0);
    });

    it("should return experienceMatchScore = 1 when candidateExp is within range [min, max]", () => {
      const result = calculateDeterministicScore({
        candidateExp: 5,
        experienceMin: 5,
        experienceMax: 8,
        candidateSkills: ["React"],
        requiredSkills: ["React"],
        candidateLocation: "Remote",
        openingLocation: "Remote",
      });
      expect(result.experienceMatchScore).toBe(1);

      const resultUpper = calculateDeterministicScore({
        candidateExp: 8,
        experienceMin: 5,
        experienceMax: 8,
        candidateSkills: ["React"],
        requiredSkills: ["React"],
        candidateLocation: "Remote",
        openingLocation: "Remote",
      });
      expect(resultUpper.experienceMatchScore).toBe(1);
    });

    it("should return experienceMatchScore = 0.8 when candidateExp > max", () => {
      const result = calculateDeterministicScore({
        candidateExp: 10,
        experienceMin: 5,
        experienceMax: 8,
        candidateSkills: ["React"],
        requiredSkills: ["React"],
        candidateLocation: "Remote",
        openingLocation: "Remote",
      });
      expect(result.experienceMatchScore).toBe(0.8);
    });
  });

  describe("2. Skill Overlap Accuracy Tests", () => {
    const requiredSkills = ["React", "Node.js", "TypeScript", "PostgreSQL"];

    it("should return skillMatchScore = 0.0 when 0 skills overlap", () => {
      const result = calculateDeterministicScore({
        candidateExp: 5,
        experienceMin: 3,
        experienceMax: 7,
        candidateSkills: ["PHP", "Ruby"],
        requiredSkills,
        candidateLocation: "Remote",
        openingLocation: "Remote",
      });
      expect(result.skillMatchScore).toBe(0);
    });

    it("should return skillMatchScore = 0.5 when 2 out of 4 skills overlap", () => {
      const result = calculateDeterministicScore({
        candidateExp: 5,
        experienceMin: 3,
        experienceMax: 7,
        candidateSkills: ["React", "TypeScript", "Python"],
        requiredSkills,
        candidateLocation: "Remote",
        openingLocation: "Remote",
      });
      expect(result.skillMatchScore).toBe(0.5);
    });

    it("should return skillMatchScore = 1.0 when all required skills overlap", () => {
      const result = calculateDeterministicScore({
        candidateExp: 5,
        experienceMin: 3,
        experienceMax: 7,
        candidateSkills: ["React", "Node.js", "TypeScript", "PostgreSQL", "Docker"],
        requiredSkills,
        candidateLocation: "Remote",
        openingLocation: "Remote",
      });
      expect(result.skillMatchScore).toBe(1.0);
    });
  });

  describe("3. Location Match Logic", () => {
    it("should return locationMatchScore = 1.0 when candidate or opening is Remote", () => {
      const result = calculateDeterministicScore({
        candidateExp: 5,
        experienceMin: 3,
        candidateSkills: ["React"],
        requiredSkills: ["React"],
        candidateLocation: "Remote",
        openingLocation: "New York, NY",
      });
      expect(result.locationMatchScore).toBe(1.0);
    });

    it("should return locationMatchScore = 1.0 when location matches exactly", () => {
      const result = calculateDeterministicScore({
        candidateExp: 5,
        experienceMin: 3,
        candidateSkills: ["React"],
        requiredSkills: ["React"],
        candidateLocation: "Gotham City",
        openingLocation: "Gotham City",
      });
      expect(result.locationMatchScore).toBe(1.0);
    });

    it("should return locationMatchScore = 0.5 on onsite mismatch", () => {
      const result = calculateDeterministicScore({
        candidateExp: 5,
        experienceMin: 3,
        candidateSkills: ["React"],
        requiredSkills: ["React"],
        candidateLocation: "Seattle, WA",
        openingLocation: "Gotham City, NY",
      });
      expect(result.locationMatchScore).toBe(0.5);
    });
  });

  describe("4. Mandatory Score Formula Correctness", () => {
    it("should calculate FinalScore = 0.5*Skill + 0.3*Exp + 0.2*Loc exactly", () => {
      // Skill: 2/4 = 0.5
      // Exp: 5 in [3, 7] = 1.0
      // Loc: Onsite mismatch = 0.5
      // Formula: (0.5 * 0.5) + (0.3 * 1.0) + (0.2 * 0.5) = 0.25 + 0.30 + 0.10 = 0.65
      const result = calculateDeterministicScore({
        candidateExp: 5,
        experienceMin: 3,
        experienceMax: 7,
        candidateSkills: ["React", "TypeScript"],
        requiredSkills: ["React", "TypeScript", "Node.js", "PostgreSQL"],
        candidateLocation: "Chicago, IL",
        openingLocation: "Gotham City, NY",
      });

      expect(result.skillMatchScore).toBe(0.5);
      expect(result.experienceMatchScore).toBe(1.0);
      expect(result.locationMatchScore).toBe(0.5);
      expect(result.finalScore).toBe(0.65);
    });
  });

  describe("5. Decision Thresholds", () => {
    it("should classify >= 0.75 as Recommended", () => {
      const res = evaluateDecisionThreshold(0.75);
      expect(res.recommended).toBe(true);
      expect(res.category).toBe("Recommended");

      const resHigh = evaluateDecisionThreshold(0.92);
      expect(resHigh.recommended).toBe(true);
      expect(resHigh.category).toBe("Recommended");
    });

    it("should classify 0.50 to 0.74 as Borderline", () => {
      const res = evaluateDecisionThreshold(0.65);
      expect(res.recommended).toBe(false);
      expect(res.category).toBe("Borderline");

      const resLower = evaluateDecisionThreshold(0.50);
      expect(resLower.recommended).toBe(false);
      expect(resLower.category).toBe("Borderline");
    });

    it("should classify < 0.50 as Not Recommended", () => {
      const res = evaluateDecisionThreshold(0.48);
      expect(res.recommended).toBe(false);
      expect(res.category).toBe("Not Recommended");

      const resZero = evaluateDecisionThreshold(0.15);
      expect(resZero.recommended).toBe(false);
      expect(resZero.category).toBe("Not Recommended");
    });
  });
});
