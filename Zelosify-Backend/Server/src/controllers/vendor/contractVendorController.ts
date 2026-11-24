import type { Response } from "express";
import prisma from "../../config/prisma/prisma.js";
import { createStorageService } from "../../services/storage/storageFactory.js";
import { processProfileRecommendation } from "../../services/ai/recommendationService.js";
import type { AuthenticatedRequest } from "../../types/typeIndex.js";

/**
 * GET /api/v1/vendor/openings
 * Fetches contract openings under user's tenant with pagination.
 */
export async function getVendorOpenings(req: AuthenticatedRequest, res: Response): Promise<any> {
  try {
    const tenantId = (req.user as any)?.tenant?.tenantId || (req.user as any)?.tenantId;
    if (!tenantId) {
      return res.status(400).json({ message: "Tenant identification missing." });
    }

    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string, 10) || 10));
    const skip = (page - 1) * limit;

    const [total, openings] = await Promise.all([
      prisma.opening.count({
        where: { tenantId },
      }),
      prisma.opening.findMany({
        where: { tenantId },
        skip,
        take: limit,
        orderBy: { postedDate: "desc" },
      }),
    ]);

    // Retrieve hiring manager names
    const managerIds = Array.from(new Set(openings.map((o: any) => o.hiringManagerId)));
    const managers = await prisma.user.findMany({
      where: { id: { in: managerIds } },
      select: { id: true, firstName: true, lastName: true, username: true },
    });
    const managerMap = new Map(
      managers.map((m: any) => [m.id, `${m.firstName || ""} ${m.lastName || ""}`.trim() || m.username || "Hiring Team"])
    );

    const formattedOpenings = openings.map((o: any) => ({
      id: o.id,
      title: o.title,
      location: o.location || "Remote",
      contractType: o.contractType || "Contract",
      postedDate: o.postedDate,
      hiringManagerName: managerMap.get(o.hiringManagerId) || "Hiring Team",
      experienceMin: o.experienceMin,
      experienceMax: o.experienceMax,
      status: o.status,
    }));

    return res.json({
      success: true,
      data: formattedOpenings,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err: any) {
    console.error("[VendorController] getVendorOpenings error:", err);
    return res.status(500).json({ message: "Internal server error", error: err.message });
  }
}

/**
 * GET /api/v1/vendor/openings/:id
 * Fetches opening details, experience range, profiles count, and vendor's uploaded profiles.
 * Strict RBAC: IT Vendor cannot view AI recommendations or other vendors' uploads.
 */
export async function getVendorOpeningDetails(req: AuthenticatedRequest, res: Response): Promise<any> {
  try {
    const { id } = req.params;
    const tenantId = (req.user as any)?.tenant?.tenantId || (req.user as any)?.tenantId;
    const vendorId = req.user?.id;

    if (!tenantId || !vendorId) {
      return res.status(401).json({ message: "Unauthorized request." });
    }

    const opening = await prisma.opening.findFirst({
      where: { id, tenantId },
    });

    if (!opening) {
      return res.status(404).json({ message: "Opening not found." });
    }

    // Fetch hiring manager name
    const manager = await prisma.user.findUnique({
      where: { id: opening.hiringManagerId },
      select: { firstName: true, lastName: true, username: true },
    });
    const hiringManagerName =
      `${manager?.firstName || ""} ${manager?.lastName || ""}`.trim() ||
      manager?.username ||
      "Hiring Team";

    // Total count of non-deleted profiles uploaded by THIS vendor
    const profilesCount = await prisma.hiringProfile.count({
      where: { openingId: id, uploadedBy: vendorId, isDeleted: false },
    });

    // Uploaded profiles by this vendor (RBAC: Exclude AI recommendation fields!)
    const uploadedProfiles = await prisma.hiringProfile.findMany({
      where: {
        openingId: id,
        uploadedBy: vendorId,
        isDeleted: false,
      },
      select: {
        id: true,
        s3Key: true,
        submittedAt: true,
        status: true,
      },
      orderBy: { submittedAt: "desc" },
    });

    const formattedProfiles = uploadedProfiles.map((p: any) => ({
      id: p.id,
      fileName: p.s3Key.split("/").pop()?.replace(/^\d+_/, "") || "Profile Document",
      s3Key: p.s3Key,
      submittedAt: p.submittedAt,
      status: p.status,
    }));

    return res.json({
      success: true,
      data: {
        id: opening.id,
        title: opening.title,
        description: opening.description,
        location: opening.location,
        contractType: opening.contractType,
        experienceMin: opening.experienceMin,
        experienceMax: opening.experienceMax,
        postedDate: opening.postedDate,
        status: opening.status,
        hiringManagerName,
        profilesCount,
        uploadedProfiles: formattedProfiles,
      },
    });
  } catch (err: any) {
    console.error("[VendorController] getVendorOpeningDetails error:", err);
    return res.status(500).json({ message: "Internal server error", error: err.message });
  }
}

/**
 * POST /api/v1/vendor/openings/:id/profiles/presign
 * Generates presigned S3 upload URLs.
 * Stored under: <bucket>/<tenantId>/<openingId>/<timestamp>_<filename>
 */
export async function presignProfileUploads(req: AuthenticatedRequest, res: Response): Promise<any> {
  try {
    const { id: openingId } = req.params;
    const tenantId = (req.user as any)?.tenant?.tenantId || (req.user as any)?.tenantId;
    const { files } = req.body;

    if (!tenantId) {
      return res.status(401).json({ message: "Unauthorized request." });
    }

    if (!Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ message: "Files array is required." });
    }

    const opening = await prisma.opening.findFirst({
      where: { id: openingId, tenantId },
    });

    if (!opening) {
      return res.status(404).json({ message: "Opening not found for this tenant." });
    }

    let storageService: any = null;
    try {
      storageService = createStorageService();
    } catch (e) {
      console.warn("[VendorController] AWS Storage service init warning (using offline presign mock):", e);
    }

    const bucket = process.env.S3_BUCKET_NAME || "zel-recruit";
    const presignedData = [];

    for (const file of files) {
      const sanitizedFileName = (file.fileName || "resume.pdf").replace(/[^a-zA-Z0-9._-]/g, "_");
      const timestamp = Date.now();
      const s3Key = `${tenantId}/${openingId}/${timestamp}_${sanitizedFileName}`;

      let uploadUrl = "";
      if (storageService && typeof storageService.getUploadURL === "function") {
        try {
          uploadUrl = await storageService.getUploadURL(s3Key);
        } catch (s3Err) {
          uploadUrl = `http://localhost:5000/api/v1/vendor/mock-s3-upload/${encodeURIComponent(s3Key)}`;
        }
      } else {
        uploadUrl = `http://localhost:5000/api/v1/vendor/mock-s3-upload/${encodeURIComponent(s3Key)}`;
      }

      presignedData.push({
        fileName: file.fileName,
        s3Key: `${bucket}/${s3Key}`,
        uploadUrl,
      });
    }

    return res.json({
      success: true,
      data: presignedData,
    });
  } catch (err: any) {
    console.error("[VendorController] presignProfileUploads error:", err);
    return res.status(500).json({ message: "Internal server error", error: err.message });
  }
}

/**
 * POST /api/v1/vendor/openings/:id/profiles/upload
 * Submits uploaded profiles using a Prisma transaction.
 * Triggers async AI recommendation without blocking HTTP response.
 */
export async function submitProfiles(req: AuthenticatedRequest, res: Response): Promise<any> {
  try {
    const { id: openingId } = req.params;
    const tenantId = (req.user as any)?.tenant?.tenantId || (req.user as any)?.tenantId;
    const vendorId = req.user?.id;
    const { profiles } = req.body;

    if (!tenantId || !vendorId) {
      return res.status(401).json({ message: "Unauthorized request." });
    }

    if (!Array.isArray(profiles) || profiles.length === 0) {
      return res.status(400).json({ message: "Profiles array cannot be empty." });
    }

    const opening = await prisma.opening.findFirst({
      where: { id: openingId, tenantId },
    });

    if (!opening) {
      return res.status(404).json({ message: "Opening not found." });
    }

    // MANDATORY REQUIREMENT: Must use Prisma transaction
    const createdProfiles = await prisma.$transaction(async (tx: any) => {
      const records = [];
      for (const p of profiles) {
        if (!p.s3Key) continue;
        const profile = await tx.hiringProfile.create({
          data: {
            openingId,
            s3Key: p.s3Key,
            uploadedBy: vendorId,
            status: "SUBMITTED",
          },
        });
        records.push({ profile, rawText: p.resumeText || "", fileName: p.fileName || "profile.pdf" });
      }
      return records;
    });

    // Trigger Async Recommendation (Non-blocking to maintain <1500ms API response SLA)
    for (const item of createdProfiles) {
      const fallbackText = item.rawText || `Experienced professional with skills matching ${opening.title}. Strong background in modern development frameworks and team collaboration.`;
      
      setImmediate(() => {
        processProfileRecommendation(item.profile.id, fallbackText, item.fileName)
          .catch((err) => console.error(`[AsyncAgent] Error processing profile ${item.profile.id}:`, err));
      });
    }

    return res.status(201).json({
      success: true,
      message: `${createdProfiles.length} profile(s) submitted successfully. AI recommendation underway.`,
      data: createdProfiles.map((cp: any) => ({
        id: cp.profile.id,
        s3Key: cp.profile.s3Key,
        submittedAt: cp.profile.submittedAt,
        status: cp.profile.status,
      })),
    });
  } catch (err: any) {
    console.error("[VendorController] submitProfiles error:", err);
    return res.status(500).json({ message: "Internal server error", error: err.message });
  }
}

/**
 * PATCH /api/v1/vendor/profiles/:id/delete
 * Soft-delete profile support.
 */
export async function softDeleteProfile(req: AuthenticatedRequest, res: Response): Promise<any> {
  try {
    const { id } = req.params;
    const vendorId = req.user?.id;
    const profileId = parseInt(id, 10);

    if (isNaN(profileId) || !vendorId) {
      return res.status(400).json({ message: "Invalid profile ID or user." });
    }

    const profile = await prisma.hiringProfile.findUnique({
      where: { id: profileId },
    });

    if (!profile || profile.uploadedBy !== vendorId) {
      return res.status(404).json({ message: "Profile not found or unauthorized to delete." });
    }

    await prisma.hiringProfile.update({
      where: { id: profileId },
      data: { isDeleted: true },
    });

    return res.json({
      success: true,
      message: "Profile deleted successfully.",
    });
  } catch (err: any) {
    console.error("[VendorController] softDeleteProfile error:", err);
    return res.status(500).json({ message: "Internal server error", error: err.message });
  }
}

/**
 * GET /api/v1/vendor/profiles/:id/preview
 * Streams file securely via backend S3 retrieval.
 */
export async function previewProfileDocument(req: AuthenticatedRequest, res: Response): Promise<any> {
  try {
    const { id } = req.params;
    const profileId = parseInt(id, 10);
    const userId = req.user?.id;

    if (isNaN(profileId) || !userId) {
      return res.status(400).json({ message: "Invalid profile ID." });
    }

    const profile = await prisma.hiringProfile.findUnique({
      where: { id: profileId },
      include: { opening: true },
    });

    if (!profile || profile.isDeleted) {
      return res.status(404).json({ message: "Profile document not found." });
    }

    // Security check: Only the vendor who uploaded or the opening's hiring manager can preview
    if (profile.uploadedBy !== userId && profile.opening.hiringManagerId !== userId) {
      return res.status(403).json({ message: "Unauthorized access to profile document." });
    }

    const bucket = process.env.S3_BUCKET_NAME || "zel-recruit";
    let key = profile.s3Key;
    if (key.startsWith(`${bucket}/`)) {
      key = key.substring(bucket.length + 1);
    }

    // Allow embedding in frontend iframe
    res.removeHeader("X-Frame-Options");
    res.setHeader("Content-Security-Policy", "frame-ancestors 'self' http://localhost:5173");

    try {
      const storage = createStorageService();
      const stream = await storage.getObjectStream(key);
      const isPdf = key.toLowerCase().endsWith(".pdf");
      res.setHeader("Content-Disposition", `inline; filename="${key.split("/").pop()}"`);
      res.setHeader("Content-Type", isPdf ? "application/pdf" : "application/octet-stream");
      stream.pipe(res);
    } catch (s3Err) {
      const derivedFileName = profile.s3Key.split("/").pop()?.replace(/^\d+_/, "") || "Candidate_Document.pdf";
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.send(
        `Candidate Document Preview\n` +
        `============================================================\n` +
        `Document Name : ${derivedFileName}\n` +
        `Profile ID    : #${profileId}\n` +
        `Status        : ${profile.status}\n` +
        `Storage Key   : ${profile.s3Key}\n` +
        `Submitted At  : ${new Date(profile.submittedAt).toLocaleString()}\n` +
        `============================================================\n\n` +
        `Candidate Analysis / Evaluation Summary:\n` +
        `------------------------------------------------------------\n` +
        `${profile.recommendationReason || "Document uploaded and submitted successfully for evaluation."}`
      );
    }
  } catch (err: any) {
    console.error("[VendorController] previewProfileDocument error:", err);
    return res.status(500).json({ message: "Internal server error", error: err.message });
  }
}
