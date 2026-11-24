import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getHiringManagerOpenings,
  getOpeningProfiles,
  shortlistProfile,
  rejectProfile,
} from "../../../src/controllers/hiring/contractHiringManagerController.js";

// Mock Prisma
vi.mock("../../../src/config/prisma/prisma.js", () => {
  return {
    default: {
      opening: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
      },
      hiringProfile: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
      },
    },
  };
});

import prisma from "../../../src/config/prisma/prisma.js";

describe("Phase 4: Contract Hiring Manager Controller Unit Tests", () => {
  let mockRes: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRes = {
      status: vi.fn(function () {
        return this;
      }),
      json: vi.fn(function () {
        return this;
      }),
    };
  });

  describe("getHiringManagerOpenings", () => {
    it("should retrieve only openings owned by logged in hiring manager", async () => {
      const mockReq = {
        user: { id: "manager-1", tenantId: "tenant-wayne" },
      } as any;

      (prisma.opening.findMany as any).mockResolvedValue([
        {
          id: "op-10",
          title: "Senior AI Engineer",
          description: "LLM agents",
          location: "Remote",
          contractType: "C2H",
          experienceMin: 4,
          experienceMax: 8,
          postedDate: new Date(),
          status: "OPEN",
          hiringProfiles: [
            { id: 1, status: "SUBMITTED", recommended: true },
            { id: 2, status: "SHORTLISTED", recommended: true },
            { id: 3, status: "REJECTED", recommended: false },
          ],
        },
      ]);

      await getHiringManagerOpenings(mockReq, mockRes);

      expect(prisma.opening.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            hiringManagerId: "manager-1",
            tenantId: "tenant-wayne",
          },
        })
      );

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.arrayContaining([
            expect.objectContaining({
              id: "op-10",
              metrics: {
                totalProfiles: 3,
                recommendedCount: 2,
                shortlistedCount: 1,
              },
            }),
          ]),
        })
      );
    });
  });

  describe("getOpeningProfiles", () => {
    it("should return profiles with AI badges and scores when manager owns opening", async () => {
      const mockReq = {
        params: { id: "op-10" },
        user: { id: "manager-1", tenantId: "tenant-wayne" },
      } as any;

      (prisma.opening.findFirst as any).mockResolvedValue({
        id: "op-10",
        hiringManagerId: "manager-1",
        title: "Senior AI Engineer",
        location: "Remote",
        contractType: "C2H",
        experienceMin: 4,
        experienceMax: 8,
      });

      (prisma.hiringProfile.findMany as any).mockResolvedValue([
        {
          id: 1,
          s3Key: "zel-recruit/tenant-wayne/op-10/1234_profile.pdf",
          submittedAt: new Date(),
          status: "SUBMITTED",
          recommended: true,
          recommendationScore: 0.88,
          recommendationConfidence: 0.92,
          recommendationReason: "Strong candidate matching all technical skills.",
          recommendationLatencyMs: 145,
        },
      ]);

      await getOpeningProfiles(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            opening: expect.objectContaining({ id: "op-10" }),
            profiles: expect.arrayContaining([
              expect.objectContaining({
                id: 1,
                fileName: "profile.pdf",
                recommendationBadge: "Recommended",
                recommended: true,
                scorePercent: 88,
                confidencePercent: 92,
                processingTimeMs: 145,
              }),
            ]),
          }),
        })
      );
    });

    it("should return 403 Forbidden if opening belongs to another manager", async () => {
      const mockReq = {
        params: { id: "op-10" },
        user: { id: "manager-unauthorized", tenantId: "tenant-wayne" },
      } as any;

      (prisma.opening.findFirst as any).mockResolvedValue({
        id: "op-10",
        hiringManagerId: "manager-1", // Different manager
      });

      await getOpeningProfiles(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining("Forbidden"),
        })
      );
    });
  });

  describe("shortlistProfile", () => {
    it("should shortlist candidate if manager owns the opening", async () => {
      const mockReq = {
        params: { id: "1" },
        user: { id: "manager-1" },
      } as any;

      (prisma.hiringProfile.findUnique as any).mockResolvedValue({
        id: 1,
        isDeleted: false,
        opening: { hiringManagerId: "manager-1" },
      });

      (prisma.hiringProfile.update as any).mockResolvedValue({
        id: 1,
        status: "SHORTLISTED",
      });

      await shortlistProfile(mockReq, mockRes);

      expect(prisma.hiringProfile.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: expect.objectContaining({
            status: "SHORTLISTED",
            shortlistedBy: "manager-1",
          }),
        })
      );
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "Candidate profile shortlisted successfully.",
        })
      );
    });

    it("should reject shortlist action with 403 if manager does not own the opening", async () => {
      const mockReq = {
        params: { id: "1" },
        user: { id: "manager-unauthorized" },
      } as any;

      (prisma.hiringProfile.findUnique as any).mockResolvedValue({
        id: 1,
        isDeleted: false,
        opening: { hiringManagerId: "manager-1" }, // belongs to manager-1
      });

      await shortlistProfile(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
    });
  });

  describe("rejectProfile", () => {
    it("should reject candidate if manager owns the opening", async () => {
      const mockReq = {
        params: { id: "1" },
        user: { id: "manager-1" },
      } as any;

      (prisma.hiringProfile.findUnique as any).mockResolvedValue({
        id: 1,
        isDeleted: false,
        opening: { hiringManagerId: "manager-1" },
      });

      (prisma.hiringProfile.update as any).mockResolvedValue({
        id: 1,
        status: "REJECTED",
      });

      await rejectProfile(mockReq, mockRes);

      expect(prisma.hiringProfile.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: expect.objectContaining({
            status: "REJECTED",
            rejectedBy: "manager-1",
          }),
        })
      );
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "Candidate profile rejected.",
        })
      );
    });

    it("should return 403 if unauthorized manager attempts to reject profile", async () => {
      const mockReq = {
        params: { id: "1" },
        user: { id: "manager-unauthorized" },
      } as any;

      (prisma.hiringProfile.findUnique as any).mockResolvedValue({
        id: 1,
        isDeleted: false,
        opening: { hiringManagerId: "manager-1" },
      });

      await rejectProfile(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
    });
  });
});
