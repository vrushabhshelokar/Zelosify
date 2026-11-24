import { Router, type RequestHandler } from "express";
import { authenticateUser } from "../../middlewares/auth/authenticateMiddleware.js";
import { authorizeRole } from "../../middlewares/auth/authorizeMiddleware.js";
import {
  getHiringManagerOpenings,
  getOpeningProfiles,
  shortlistProfile,
  rejectProfile,
} from "../../controllers/hiring/contractHiringManagerController.js";
import { fetchData } from "../../controllers/controllers.js";

const router = Router();

/**
 * =============================================================================
 * HIRING MANAGER CONTRACT MANAGEMENT ROUTES
 * =============================================================================
 */

// 1. Fetch own openings
router.get(
  "/openings",
  authenticateUser as RequestHandler,
  authorizeRole("HIRING_MANAGER") as RequestHandler,
  (async (req, res, next) => {
    try {
      await getHiringManagerOpenings(req as any, res);
    } catch (err) {
      next(err);
    }
  }) as RequestHandler
);

// 2. Fetch profiles with AI recommendation badges, scores, reasons, latency
router.get(
  "/openings/:id/profiles",
  authenticateUser as RequestHandler,
  authorizeRole("HIRING_MANAGER") as RequestHandler,
  (async (req, res, next) => {
    try {
      await getOpeningProfiles(req as any, res);
    } catch (err) {
      next(err);
    }
  }) as RequestHandler
);

// 3. Shortlist candidate
router.post(
  "/profiles/:id/shortlist",
  authenticateUser as RequestHandler,
  authorizeRole("HIRING_MANAGER") as RequestHandler,
  (async (req, res, next) => {
    try {
      await shortlistProfile(req as any, res);
    } catch (err) {
      next(err);
    }
  }) as RequestHandler
);

// 4. Reject candidate
router.post(
  "/profiles/:id/reject",
  authenticateUser as RequestHandler,
  authorizeRole("HIRING_MANAGER") as RequestHandler,
  (async (req, res, next) => {
    try {
      await rejectProfile(req as any, res);
    } catch (err) {
      next(err);
    }
  }) as RequestHandler
);

// Legacy route
router.get(
  "/",
  authenticateUser as RequestHandler,
  authorizeRole("HIRING_MANAGER") as RequestHandler,
  (async (req, res, next) => {
    try {
      await fetchData(req as any, res);
    } catch (error) {
      next(error);
    }
  }) as RequestHandler
);

export default router;
