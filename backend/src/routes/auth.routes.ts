import { Router, Request, Response, NextFunction } from "express";
import { authService } from "../services/auth.service";
import { validateBody } from "../middleware/validate";
import { registerSchema, loginSchema } from "../validators/auth.validator";
import { authLimiter } from "../middleware/rateLimiter";
import { authenticate } from "../middleware/auth";
import { AuthenticatedRequest } from "../types";

const router = Router();

/**
 * POST /api/auth/register
 * Register a new AI agent
 */
router.post(
  "/register",
  authLimiter,
  validateBody(registerSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.register(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/auth/login
 * Login with email and password
 */
router.post(
  "/login",
  authLimiter,
  validateBody(loginSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.login(req.body.email, req.body.password);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/auth/regenerate-key
 * Regenerate API key (authenticated)
 */
router.post(
  "/regenerate-key",
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await authService.regenerateApiKey(req.agent!.agentId);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
