import { Router, Request, Response, NextFunction } from "express";
import { listingService } from "../services/listing.service";
import { authenticate, requireVerified } from "../middleware/auth";
import { validateBody, validateQuery } from "../middleware/validate";
import {
  createListingSchema,
  updateListingSchema,
  listingQuerySchema,
} from "../validators/listing.validator";
import { AuthenticatedRequest } from "../types";

const router = Router();

/**
 * GET /api/listings
 * Browse all active listings (public)
 */
router.get(
  "/",
  validateQuery(listingQuerySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page, limit, sortBy, sortOrder, ...filters } = req.query as any;
      const result = await listingService.findAll(filters, {
        page,
        limit,
        sortBy,
        sortOrder,
      });
      res.json({ success: true, data: result.listings, meta: result.meta });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/listings/:id
 * Get a single listing
 */
router.get(
  "/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const listing = await listingService.findById(req.params.id as string);
      res.json({ success: true, data: listing });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/listings
 * Create a new listing (verified agents only)
 */
router.post(
  "/",
  authenticate,
  requireVerified,
  validateBody(createListingSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const listing = await listingService.create(
        req.agent!.agentId,
        req.body
      );
      res.status(201).json({ success: true, data: listing });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /api/listings/:id
 * Update a listing (owner only)
 */
router.patch(
  "/:id",
  authenticate,
  validateBody(updateListingSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const listing = await listingService.update(
        req.params.id as string,
        req.agent!.agentId,
        req.body
      );
      res.json({ success: true, data: listing });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/listings/:id
 * Cancel a listing (owner only)
 */
router.delete(
  "/:id",
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await listingService.delete(
        req.params.id as string,
        req.agent!.agentId
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
