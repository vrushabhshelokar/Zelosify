import prisma from "../../config/prisma/prisma.js";
import { runAgentRecommendation } from "./agentOrchestrator.js";

/**
 * Executes AI recommendation for a candidate profile against an opening.
 * Ensures ACID transaction integrity:
 * - Reads opening & profile within safety checks
 * - Runs async agent orchestration
 * - Persists recommendation metadata atomically in prisma.$transaction
 */
export async function processProfileRecommendation(
  profileId: number,
  resumeText: string,
  fileName: string
) {
  try {
    const profile = await prisma.hiringProfile.findUnique({
      where: { id: profileId },
      include: { opening: true },
    });

    if (!profile || profile.isDeleted) {
      console.warn(`[RecommendationService] Profile ${profileId} not found or deleted.`);
      return null;
    }

    const opening = profile.opening;
    if (!opening) {
      console.warn(`[RecommendationService] Opening not found for profile ${profileId}.`);
      return null;
    }

    // Parse required skills from opening description or title
    const techSkillKeywords = [
      "React", "Node.js", "TypeScript", "JavaScript", "Python", "Go",
      "AWS", "Docker", "Kubernetes", "PostgreSQL", "MongoDB", "Kafka",
      "Terraform", "FastAPI", "Next.js", "Redis", "C#", ".NET", "Java",
      "SRE", "Observability", "APM", "Prometheus", "Grafana", "Tracing", "Alerting"
    ];
    const requiredSkills = techSkillKeywords.filter((skill) =>
      new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(
        `${opening.title} ${opening.description || ""}`
      )
    );
    if (requiredSkills.length === 0) {
      requiredSkills.push("Software Development", "TypeScript", "Node.js");
    }

    // Run AI Agent Orchestrator
    const result = await runAgentRecommendation({
      profileId: profile.id,
      openingId: opening.id,
      openingTitle: opening.title,
      openingDescription: opening.description || "",
      openingLocation: opening.location || "Remote",
      experienceMin: opening.experienceMin,
      experienceMax: opening.experienceMax,
      requiredSkills,
      resumeText,
      fileName,
    });

    // Atomically persist recommendation within a Prisma transaction
    const updatedProfile = await prisma.$transaction(async (tx: any) => {
      return await tx.hiringProfile.update({
        where: { id: profileId },
        data: {
          recommended: result.recommended,
          recommendationScore: result.score,
          recommendationConfidence: result.confidence,
          recommendationReason: result.reason,
          recommendationLatencyMs: result.latencyMs,
          recommendationVersion: result.version,
          recommendedAt: new Date(),
        },
      });
    });

    console.log(`[RecommendationService] Profile ${profileId} evaluated successfully (Score: ${result.score}, Recommended: ${result.recommended}, Latency: ${result.latencyMs}ms)`);
    return { result, updatedProfile };
  } catch (error: any) {
    console.error(`[RecommendationService] Error evaluating profile ${profileId}:`, error);
    throw error;
  }
}
