import { z } from "zod";

export const createOrderSchema = z.object({
  listingId: z.string().uuid("Invalid listing ID"),
  notes: z.string().max(1000).optional(),
});

export const orderQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
});
