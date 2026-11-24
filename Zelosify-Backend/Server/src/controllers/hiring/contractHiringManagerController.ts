import type { Response } from "express";
import prisma from "../../config/prisma/prisma.js";
import { evaluateDecisionThreshold } from "../../services/ai/tools/scoringEngine.js";
import type { AuthenticatedRequest } from "../../types/typeIndex.js";

/**
 * GET /api/v1/hiring-manager/openings
 * Only retrieves openings owned by the logged-in hiring manager.
 */
export async function getHiringManagerOpenings(req: AuthenticatedRequest, res: Response): Promise<any> {
  try {
    const hiringManagerId = req.user?.id;
    const tenantId = (req.user as any)?.tenant?.tenantId || (req.user as any)?.tenantId;

    if (!hiringManagerId || !tenantId) {
      return res.status(401).json({ message: "Unauthorized request." });
    }

    const openings = await prisma.opening.findMany({
      where: {
        hiringManagerId,
        tenantId,
      },
      include: {
        hiringProfiles: {
          where: { isDeleted: false },
          select: {
            id: true,
            status: true,
            recommended: true,
          },
        },
      },
      orderBy: { postedDate: "desc" },
    });

    const formatted = openings.map((o: any) => {
      const totalProfiles = o.hiringProfiles.length;
      const recommendedCount = o.hiringProfiles.filter((p: any) => p.recommended === true).length;
      const shortlistedCount = o.hiringProfiles.filter((p: any) => p.status === "SHORTLISTED").length;

      return {
        id: o.id,
        title: o.title,
        description: o.description,
        location: o.location || "Remote",
        contractType: o.contractType || "Contract",
        experienceMin: o.experienceMin,
        experienceMax: o.experienceMax,
        postedDate: o.postedDate,
        status: o.status,
        metrics: {
          totalProfiles,
          recommendedCount,
          shortlistedCount,
        },
        _count: {
          profiles: totalProfiles,
        },
      };
    });

    return res.json({
      success: true,
      data: formatted,
    });
  } catch (err: any) {
    console.error("[HiringManagerController] getHiringManagerOpenings error:", err);
    return res.status(500).json({ message: "Internal server error", error: err.message });
  }
}

/**
 * GET /api/v1/hiring-manager/openings/:id/profiles
 * Fetches submitted profiles for an opening.
 * Mandatory condition: opening.hiringManagerId === loggedInUser.id
 * Returns: Recommendation badge, Score %, Confidence %, Explanation, Latency.
 */
export async function getOpeningProfiles(req: AuthenticatedRequest, res: Response): Promise<any> {
  try {
    const { id: openingId } = req.params;
    const hiringManagerId = req.user?.id;
    const tenantId = (req.user as any)?.tenant?.tenantId || (req.user as any)?.tenantId;

    if (!hiringManagerId || !tenantId) {
      return res.status(401).json({ message: "Unauthorized request." });
    }

    // MANDATORY VALIDATION: Manager must own the opening
    const opening = await prisma.opening.findFirst({
      where: {
        id: openingId,
        tenantId,
      },
    });

    if (!opening) {
      return res.status(404).json({ message: "Opening not found." });
    }

    if (opening.hiringManagerId !== hiringManagerId) {
      return res.status(403).json({
        message: "Forbidden: You are not authorized to view profiles for another manager's opening.",
      });
    }

    const profiles = await prisma.hiringProfile.findMany({
      where: {
        openingId,
        isDeleted: false,
      },
      orderBy: { submittedAt: "desc" },
    });

    const formattedProfiles = profiles.map((p: any) => {
      const score = p.recommendationScore ?? 0;
      const decision = evaluateDecisionThreshold(score);

      // Parse file name cleanly from s3Key
      const rawFileName = p.s3Key.split("/").pop() || "Resume";
      const fileName = rawFileName.replace(/^\d+_/, "");

      return {
        id: p.id,
        fileName,
        s3Key: p.s3Key,
        uploadDate: p.submittedAt,
        status: p.status,
        // AI Recommendation Fields
        recommendationBadge: decision.category, // "Recommended" | "Borderline" | "Not Recommended"
        recommended: p.recommended ?? false,
        scorePercent: Math.round(score * 100),
        confidencePercent: Math.round((p.recommendationConfidence ?? 0.85) * 100),
        explanation: p.recommendationReason || "Pending AI Agent evaluation...",
        processingTimeMs: p.recommendationLatencyMs ?? null,
        shortlistedBy: p.shortlistedBy,
        shortlistedAt: p.shortlistedAt,
        rejectedBy: p.rejectedBy,
        rejectedAt: p.rejectedAt,
      };
    });

    return res.json({
      success: true,
      data: {
        opening: {
          id: opening.id,
          title: opening.title,
          location: opening.location,
          contractType: opening.contractType,
          experienceMin: opening.experienceMin,
          experienceMax: opening.experienceMax,
        },
        profiles: formattedProfiles,
      },
    });
  } catch (err: any) {
    console.error("[HiringManagerController] getOpeningProfiles error:", err);
    return res.status(500).json({ message: "Internal server error", error: err.message });
  }
}

/**
 * POST /api/v1/hiring-manager/profiles/:id/shortlist
 * Shortlists candidate profile.
 * Verifies opening ownership: opening.hiringManagerId === loggedInUser.id
 */
export async function shortlistProfile(req: AuthenticatedRequest, res: Response): Promise<any> {
  try {
    const { id } = req.params;
    const profileId = parseInt(id, 10);
    const hiringManagerId = req.user?.id;

    if (isNaN(profileId) || !hiringManagerId) {
      return res.status(400).json({ message: "Invalid profile ID or user." });
    }

    const profile = await prisma.hiringProfile.findUnique({
      where: { id: profileId },
      include: { opening: true },
    });

    if (!profile || profile.isDeleted) {
      return res.status(404).json({ message: "Profile not found." });
    }

    if (profile.opening.hiringManagerId !== hiringManagerId) {
      return res.status(403).json({
        message: "Forbidden: Cannot shortlist candidates for an opening you do not manage.",
      });
    }

    const updated = await prisma.hiringProfile.update({
      where: { id: profileId },
      data: {
        status: "SHORTLISTED",
        shortlistedBy: hiringManagerId,
        shortlistedAt: new Date(),
      },
    });

    return res.json({
      success: true,
      message: "Candidate profile shortlisted successfully.",
      data: updated,
    });
  } catch (err: any) {
    console.error("[HiringManagerController] shortlistProfile error:", err);
    return res.status(500).json({ message: "Internal server error", error: err.message });
  }
}

/**
 * POST /api/v1/hiring-manager/profiles/:id/reject
 * Rejects candidate profile.
 * Verifies opening ownership: opening.hiringManagerId === loggedInUser.id
 */
export async function rejectProfile(req: AuthenticatedRequest, res: Response): Promise<any> {
  try {
    const { id } = req.params;
    const profileId = parseInt(id, 10);
    const hiringManagerId = req.user?.id;

    if (isNaN(profileId) || !hiringManagerId) {
      return res.status(400).json({ message: "Invalid profile ID or user." });
    }

    const profile = await prisma.hiringProfile.findUnique({
      where: { id: profileId },
      include: { opening: true },
    });

    if (!profile || profile.isDeleted) {
      return res.status(404).json({ message: "Profile not found." });
    }

    if (profile.opening.hiringManagerId !== hiringManagerId) {
      return res.status(403).json({
        message: "Forbidden: Cannot reject candidates for an opening you do not manage.",
      });
    }

    const updated = await prisma.hiringProfile.update({
      where: { id: profileId },
      data: {
        status: "REJECTED",
        rejectedBy: hiringManagerId,
        rejectedAt: new Date(),
      },
    });

    return res.json({
      success: true,
      message: "Candidate profile rejected.",
      data: updated,
    });
  } catch (err: any) {
    console.error("[HiringManagerController] rejectProfile error:", err);
    return res.status(500).json({ message: "Internal server error", error: err.message });
  }
}
