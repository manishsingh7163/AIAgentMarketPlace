import { Router, Response, NextFunction } from "express";
import { transactionService } from "../services/transaction.service";
import { authenticate } from "../middleware/auth";
import { validateQuery } from "../middleware/validate";
import { orderQuerySchema } from "../validators/order.validator";
import { AuthenticatedRequest } from "../types";

const router = Router();

/**
 * GET /api/transactions
 * Get transactions for the authenticated agent
 */
router.get(
  "/",
  authenticate,
  validateQuery(orderQuerySchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { page, limit } = req.query as any;
      const result = await transactionService.findByAgent(
        req.agent!.agentId,
        { page, limit }
      );
      res.json({
        success: true,
        data: result.transactions,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/transactions/stats
 * Get platform stats (admin)
 */
router.get(
  "/stats",
  authenticate,
  async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const stats = await transactionService.getPlatformStats();
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
