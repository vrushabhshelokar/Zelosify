import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getVendorOpenings,
  getVendorOpeningDetails,
  presignProfileUploads,
  submitProfiles,
  softDeleteProfile,
} from "../../../src/controllers/vendor/contractVendorController.js";

// Mock Prisma
vi.mock("../../../src/config/prisma/prisma.js", () => {
  return {
    default: {
      opening: {
        count: vi.fn(),
        findMany: vi.fn(),
        findFirst: vi.fn(),
      },
      user: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
      },
      hiringProfile: {
        count: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      $transaction: vi.fn((callback) =>
        callback({
          hiringProfile: {
            create: vi.fn().mockResolvedValue({
              id: 99,
              openingId: "op-1",
              s3Key: "zel-recruit/tenant-1/op-1/1234_resume.pdf",
              uploadedBy: "vendor-1",
              status: "SUBMITTED",
              submittedAt: new Date(),
            }),
          },
        })
      ),
    },
  };
});

import prisma from "../../../src/config/prisma/prisma.js";

describe("Phase 4: Contract Vendor Controller Unit Tests", () => {
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
      setHeader: vi.fn(),
      send: vi.fn(),
    };
  });

  describe("getVendorOpenings", () => {
    it("should return paginated openings under tenant", async () => {
      const mockReq = {
        user: { tenantId: "tenant-wayne", id: "vendor-1" },
        query: { page: "1", limit: "10" },
      } as any;

      (prisma.opening.count as any).mockResolvedValue(1);
      (prisma.opening.findMany as any).mockResolvedValue([
        {
          id: "op-1",
          title: "Frontend React Specialist",
          location: "Gotham City, NY",
          contractType: "C2H",
          postedDate: new Date(),
          hiringManagerId: "manager-1",
          experienceMin: 3,
          experienceMax: 6,
          status: "OPEN",
        },
      ]);
      (prisma.user.findMany as any).mockResolvedValue([
        { id: "manager-1", firstName: "Rachel", lastName: "Dawes", username: "rachel" },
      ]);

      await getVendorOpenings(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          pagination: expect.objectContaining({ total: 1, page: 1, limit: 10 }),
          data: expect.arrayContaining([
            expect.objectContaining({
              id: "op-1",
              hiringManagerName: "Rachel Dawes",
            }),
          ]),
        })
      );
    });

    it("should return 400 if tenant identification is missing", async () => {
      const mockReq = { user: { id: "vendor-1" }, query: {} } as any;
      await getVendorOpenings(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe("getVendorOpeningDetails", () => {
    it("should return details and sanitize AI recommendations from vendor response", async () => {
      const mockReq = {
        params: { id: "op-1" },
        user: { tenantId: "tenant-wayne", id: "vendor-1" },
      } as any;

      (prisma.opening.findFirst as any).mockResolvedValue({
        id: "op-1",
        title: "Lead Backend Architect",
        description: "Cloud microservices",
        location: "Remote",
        contractType: "Fixed Contract",
        experienceMin: 7,
        experienceMax: 12,
        postedDate: new Date(),
        status: "OPEN",
        hiringManagerId: "manager-1",
      });

      (prisma.user.findUnique as any).mockResolvedValue({
        firstName: "Bruce",
        lastName: "Wayne",
        username: "bruce",
      });

      (prisma.hiringProfile.count as any).mockResolvedValue(1);
      (prisma.hiringProfile.findMany as any).mockResolvedValue([
        {
          id: 10,
          s3Key: "zel-recruit/tenant-wayne/op-1/1700000000_john_resume.pdf",
          submittedAt: new Date(),
          status: "SUBMITTED",
        },
      ]);

      await getVendorOpeningDetails(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            id: "op-1",
            hiringManagerName: "Bruce Wayne",
            profilesCount: 1,
            uploadedProfiles: expect.arrayContaining([
              expect.objectContaining({
                id: 10,
                fileName: "john_resume.pdf",
                status: "SUBMITTED",
              }),
            ]),
          }),
        })
      );

      // Verify AI recommendation fields are NOT leaked in uploadedProfiles
      const resData = mockRes.json.mock.calls[0][0].data;
      expect(resData.uploadedProfiles[0].recommendationScore).toBeUndefined();
      expect(resData.uploadedProfiles[0].recommended).toBeUndefined();
      expect(resData.uploadedProfiles[0].recommendationReason).toBeUndefined();
    });
  });

  describe("presignProfileUploads", () => {
    it("should generate S3 presigned keys strictly following <bucket>/<tenantId>/<openingId>/<timestamp>_<filename>", async () => {
      const mockReq = {
        params: { id: "op-1" },
        user: { tenantId: "tenant-wayne", id: "vendor-1" },
        body: {
          files: [{ fileName: "candidate_alex.pdf", contentType: "application/pdf" }],
        },
      } as any;

      (prisma.opening.findFirst as any).mockResolvedValue({ id: "op-1" });

      await presignProfileUploads(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.arrayContaining([
            expect.objectContaining({
              fileName: "candidate_alex.pdf",
              s3Key: expect.stringMatching(/^zel-recruit\/tenant-wayne\/op-1\/\d+_candidate_alex\.pdf$/),
            }),
          ]),
        })
      );
    });
  });

  describe("submitProfiles", () => {
    it("should submit profiles within a Prisma transaction", async () => {
      const mockReq = {
        params: { id: "op-1" },
        user: { tenantId: "tenant-wayne", id: "vendor-1" },
        body: {
          profiles: [
            { s3Key: "zel-recruit/tenant-wayne/op-1/1700_resume.pdf", fileName: "resume.pdf" },
          ],
        },
      } as any;

      (prisma.opening.findFirst as any).mockResolvedValue({
        id: "op-1",
        title: "Full Stack Engineer",
      });

      await submitProfiles(mockReq, mockRes);

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.arrayContaining([
            expect.objectContaining({
              id: 99,
              status: "SUBMITTED",
            }),
          ]),
        })
      );
    });
  });

  describe("softDeleteProfile", () => {
    it("should soft delete profile when called by the uploader", async () => {
      const mockReq = {
        params: { id: "10" },
        user: { id: "vendor-1" },
      } as any;

      (prisma.hiringProfile.findUnique as any).mockResolvedValue({
        id: 10,
        uploadedBy: "vendor-1",
        isDeleted: false,
      });

      await softDeleteProfile(mockReq, mockRes);

      expect(prisma.hiringProfile.update).toHaveBeenCalledWith({
        where: { id: 10 },
        data: { isDeleted: true },
      });
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, message: "Profile deleted successfully." })
      );
    });

    it("should deny soft deletion if caller is not the uploader", async () => {
      const mockReq = {
        params: { id: "10" },
        user: { id: "different-vendor" },
      } as any;

      (prisma.hiringProfile.findUnique as any).mockResolvedValue({
        id: 10,
        uploadedBy: "vendor-1",
        isDeleted: false,
      });

      await softDeleteProfile(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });
});
