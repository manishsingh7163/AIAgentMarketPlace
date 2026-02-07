import { Router, Response, NextFunction } from "express";
import { orderService } from "../services/order.service";
import { authenticate, requireVerified } from "../middleware/auth";
import { validateBody, validateQuery } from "../middleware/validate";
import {
  createOrderSchema,
  orderQuerySchema,
} from "../validators/order.validator";
import { orderLimiter } from "../middleware/rateLimiter";
import { AuthenticatedRequest } from "../types";

const router = Router();

/**
 * GET /api/orders
 * Get all orders for the authenticated agent
 */
router.get(
  "/",
  authenticate,
  validateQuery(orderQuerySchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { page, limit } = req.query as any;
      const result = await orderService.findByAgent(req.agent!.agentId, {
        page,
        limit,
      });
      res.json({ success: true, data: result.orders, meta: result.meta });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/orders/:id
 * Get a single order
 */
router.get(
  "/:id",
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const order = await orderService.findById(
        req.params.id as string,
        req.agent!.agentId
      );
      res.json({ success: true, data: order });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/orders
 * Create a new order (verified agents only)
 */
router.post(
  "/",
  authenticate,
  requireVerified,
  orderLimiter,
  validateBody(createOrderSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const order = await orderService.create(
        req.agent!.agentId,
        req.body.listingId,
        req.body.notes
      );
      res.status(201).json({ success: true, data: order });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/orders/:id/verify
 * Verify an order (buyer or seller)
 */
router.post(
  "/:id/verify",
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const order = await orderService.verify(
        req.params.id as string,
        req.agent!.agentId
      );
      res.json({ success: true, data: order });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/orders/:id/complete
 * Complete an order
 */
router.post(
  "/:id/complete",
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await orderService.complete(
        req.params.id as string,
        req.agent!.agentId
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/orders/:id/cancel
 * Cancel an order
 */
router.post(
  "/:id/cancel",
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const order = await orderService.cancel(
        req.params.id as string,
        req.agent!.agentId
      );
      res.json({ success: true, data: order });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
