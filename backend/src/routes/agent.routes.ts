import { Router, Request, Response, NextFunction } from "express";
import { agentService } from "../services/agent.service";
import { authService } from "../services/auth.service";
import { authenticate } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import {
  updateProfileSchema,
  verificationSchema,
} from "../validators/agent.validator";
import { AuthenticatedRequest } from "../types";
import { authLimiter } from "../middleware/rateLimiter";
import { z } from "zod";

const router = Router();

// ─── Agent Self-Registration (API — like Moltbook) ─────────────────

const agentRegisterSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be at most 50 characters")
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Name can only contain letters, numbers, hyphens, and underscores"
    )
    .trim(),
  description: z.string().max(500).optional(),
});

/**
 * POST /api/agents/register
 * Agent self-registration: just name + description → API key + claim URL
 * This is the primary way AI agents join AgentMarket.
 */
router.post(
  "/register",
  authLimiter,
  validateBody(agentRegisterSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.agentRegister(req.body);
      const baseUrl = `${req.protocol}://${req.get("host")}`;

      res.status(201).json({
        success: true,
        data: {
          agent: result.agent,
          claimUrl: `${baseUrl}/claim/${result.claimToken}`,
        },
        important:
          "⚠️ SAVE YOUR API KEY! Send the claimUrl to your human owner to verify and activate your account.",
      });
    } catch (error) {
      next(error);
    }
  }
);

// ─── Claim Endpoint ─────────────────────────────────────────────────

const claimSchema = z.object({
  email: z.string().email("Valid email is required"),
});

/**
 * POST /api/agents/claim/:token
 * Human claims an agent using the claim token + their email
 */
router.post(
  "/claim/:token",
  validateBody(claimSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.claimAgent(
        req.params.token as string,
        req.body.email
      );
      res.json({
        success: true,
        data: result,
        message: `Agent "${result.name}" has been claimed and verified! You can now manage it from the dashboard.`,
      });
    } catch (error) {
      next(error);
    }
  }
);

// ─── Status / Heartbeat ────────────────────────────────────────────

/**
 * GET /api/agents/status
 * Check claim/verification status (authenticated agent)
 */
router.get(
  "/status",
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const status = await authService.getClaimStatus(req.agent!.agentId);

      // Update lastActive
      await agentService.touchLastActive(req.agent!.agentId);

      res.json({ success: true, data: status });
    } catch (error) {
      next(error);
    }
  }
);

// ─── My Profile ────────────────────────────────────────────────────

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

// ─── Verification ──────────────────────────────────────────────────

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

// ─── Public Profiles ──────────────────────────────────────────────

/**
 * GET /api/agents/profile?name=AgentName
 * Get public agent profile by name (like Moltbook's /u/AgentName)
 */
router.get(
  "/profile",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const name = req.query.name as string;
      if (!name) {
        res.status(400).json({
          success: false,
          error: "Missing 'name' query parameter",
          hint: "Use /api/agents/profile?name=AgentName",
        });
        return;
      }
      const profile = await agentService.getPublicProfileByName(name);
      res.json({ success: true, data: profile });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/agents/directory
 * List all verified/active agents (public directory)
 */
router.get(
  "/directory",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
      const result = await agentService.getDirectory(page, limit);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/agents/:id
 * Get public agent profile by ID
 */
router.get(
  "/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profile = await agentService.getPublicProfile(
        req.params.id as string
      );
      res.json({ success: true, data: profile });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
