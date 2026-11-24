import express, { type RequestHandler } from "express";
import vendorRequestRoutes from "./vendorRequestRoutes.js";
import { authenticateUser } from "../../middlewares/auth/authenticateMiddleware.js";
import { authorizeRole } from "../../middlewares/auth/authorizeMiddleware.js";
import {
  getVendorOpenings,
  getVendorOpeningDetails,
  presignProfileUploads,
  submitProfiles,
  softDeleteProfile,
  previewProfileDocument,
} from "../../controllers/vendor/contractVendorController.js";

const router = express.Router();

/**
 * =============================================================================
 * IT VENDOR CONTRACT MANAGEMENT ROUTES
 * =============================================================================
 */

// 1. Fetch Openings under tenant (Paginated)
router.get(
  "/openings",
  authenticateUser as RequestHandler,
  authorizeRole("IT_VENDOR") as RequestHandler,
  (async (req, res, next) => {
    try {
      await getVendorOpenings(req as any, res);
    } catch (err) {
      next(err);
    }
  }) as RequestHandler
);

// 2. Fetch Opening Details (Excludes other vendors & AI recommendations)
router.get(
  "/openings/:id",
  authenticateUser as RequestHandler,
  authorizeRole("IT_VENDOR") as RequestHandler,
  (async (req, res, next) => {
    try {
      await getVendorOpeningDetails(req as any, res);
    } catch (err) {
      next(err);
    }
  }) as RequestHandler
);

// 3. Presign Profile Upload URLs
router.post(
  "/openings/:id/profiles/presign",
  authenticateUser as RequestHandler,
  authorizeRole("IT_VENDOR") as RequestHandler,
  (async (req, res, next) => {
    try {
      await presignProfileUploads(req as any, res);
    } catch (err) {
      next(err);
    }
  }) as RequestHandler
);

// 4. Submit Uploaded Profiles (Prisma transaction)
router.post(
  "/openings/:id/profiles/upload",
  authenticateUser as RequestHandler,
  authorizeRole("IT_VENDOR") as RequestHandler,
  (async (req, res, next) => {
    try {
      await submitProfiles(req as any, res);
    } catch (err) {
      next(err);
    }
  }) as RequestHandler
);

// 5. Soft Delete Profile
router.patch(
  "/profiles/:id/delete",
  authenticateUser as RequestHandler,
  authorizeRole("IT_VENDOR") as RequestHandler,
  (async (req, res, next) => {
    try {
      await softDeleteProfile(req as any, res);
    } catch (err) {
      next(err);
    }
  }) as RequestHandler
);

router.delete(
  "/profiles/:id",
  authenticateUser as RequestHandler,
  authorizeRole("IT_VENDOR") as RequestHandler,
  (async (req, res, next) => {
    try {
      await softDeleteProfile(req as any, res);
    } catch (err) {
      next(err);
    }
  }) as RequestHandler
);

// 6. Secure Document Preview Stream
router.get(
  "/profiles/:id/preview",
  authenticateUser as RequestHandler,
  (async (req, res, next) => {
    try {
      await previewProfileDocument(req as any, res);
    } catch (err) {
      next(err);
    }
  }) as RequestHandler
);

// Backward-compatible vendor request routes
router.use("/requests", vendorRequestRoutes);

export default router;
