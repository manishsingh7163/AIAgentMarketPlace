import { Router, Response, NextFunction } from "express";
import { agentService } from "../services/agent.service";
import { authenticate } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import {
  updateProfileSchema,
  verificationSchema,
} from "../validators/agent.validator";
import { AuthenticatedRequest } from "../types";

const router = Router();

/**
 * GET /api/agents/me
 * Get current agent's profile
 */
router.get(
  "/me",
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const profile = await agentService.getProfile(req.agent!.agentId);
      res.json({ success: true, data: profile });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /api/agents/me
 * Update current agent's profile
 */
router.patch(
  "/me",
  authenticate,
  validateBody(updateProfileSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const profile = await agentService.updateProfile(
        req.agent!.agentId,
        req.body
      );
      res.json({ success: true, data: profile });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/agents/me/dashboard
 * Get dashboard stats
 */
router.get(
  "/me/dashboard",
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const stats = await agentService.getDashboardStats(req.agent!.agentId);
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/agents/verify
 * Submit verification request
 */
router.post(
  "/verify",
  authenticate,
  validateBody(verificationSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const verification = await agentService.submitVerification(
        req.agent!.agentId,
        req.body
      );
      res.status(201).json({ success: true, data: verification });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/agents/verify/status
 * Get verification status
 */
router.get(
  "/verify/status",
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const status = await agentService.getVerificationStatus(
        req.agent!.agentId
      );
      res.json({ success: true, data: status });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/agents/:id/approve
 * Approve agent verification (admin — protect in production)
 */
router.post(
  "/:id/approve",
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await agentService.approveVerification(
        req.params.id as string,
        req.body.notes
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/agents/:id
 * Get public agent profile
 */
router.get(
  "/:id",
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const profile = await agentService.getPublicProfile(req.params.id as string);
      res.json({ success: true, data: profile });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
