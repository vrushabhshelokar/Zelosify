import { describe, it, expect } from "vitest";
import { runAgentRecommendation } from "../../src/services/ai/agentOrchestrator.js";

describe("Performance & Latency SLA Benchmark (Strict Requirements)", () => {
  it("should evaluate 100 simulated candidate profiles and verify P95 < 2000ms and per-profile < 1500ms", async () => {
    const latencies: number[] = [];
    const sampleKeywords = ["React", "Node.js", "TypeScript", "PostgreSQL", "Docker", "AWS", "Python"];

    console.log("🚀 Starting simulation benchmark across 100 candidate profiles...");

    for (let i = 1; i <= 100; i++) {
      const exp = Math.floor(Math.random() * 10) + 1;
      const skills = sampleKeywords.slice(0, (i % 5) + 2);
      const isRemote = i % 2 === 0;

      const dummyResume = `
        Senior Software Engineer Candidate #${i}
        Professional Summary: Over ${exp} years of hands-on experience building scalable distributed web applications.
        Core Technical Skills: ${skills.join(", ")}
        Location: ${isRemote ? "Remote" : "Gotham City, NY"}
        Education: B.S. in Computer Science
        Experience: Led team of 5 engineers delivering high performance microservices.
      `;

      const result = await runAgentRecommendation({
        profileId: i,
        openingId: "benchmark-opening-uuid",
        openingTitle: "Full Stack Software Engineer",
        openingDescription: "Seeking engineers proficient in React, Node.js, and TypeScript.",
        openingLocation: "Remote",
        experienceMin: 3,
        experienceMax: 8,
        requiredSkills: ["React", "Node.js", "TypeScript"],
        resumeText: dummyResume,
        fileName: `candidate_${i}.pdf`,
      });

      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(1);
      expect(typeof result.recommended).toBe("boolean");
      expect(result.reason.length).toBeGreaterThan(10);

      // MANDATORY SLA: Max processing time per profile <= 1500ms
      expect(result.latencyMs).toBeLessThanOrEqual(1500);

      latencies.push(result.latencyMs);
    }

    latencies.sort((a, b) => a - b);
    const p95Index = Math.floor(latencies.length * 0.95);
    const p95Latency = latencies[p95Index];
    const avgLatency = latencies.reduce((acc, curr) => acc + curr, 0) / latencies.length;

    console.log(`📊 Benchmark Complete:
      - Total Profiles: 100
      - Average Latency: ${avgLatency.toFixed(2)}ms
      - P95 Latency: ${p95Latency}ms (Strict SLA: < 2000ms)
      - Max Latency: ${latencies[latencies.length - 1]}ms (Strict SLA: <= 1500ms)
    `);

    // MANDATORY SLA: P95 latency < 2000ms
    expect(p95Latency).toBeLessThan(2000);
  }, 30000);
});
