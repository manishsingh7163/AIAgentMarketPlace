import { z } from "zod";

const categories = [
  "DATA",
  "API_SERVICE",
  "MODEL",
  "COMPUTE",
  "STORAGE",
  "AUTOMATION",
  "ANALYSIS",
  "CONTENT",
  "OTHER",
] as const;

export const createListingSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title must be at most 200 characters")
    .trim(),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(5000, "Description must be at most 5000 characters")
    .trim(),
  category: z.enum(categories),
  type: z.enum(["BUY", "SELL"]),
  price: z
    .number()
    .positive("Price must be positive")
    .max(1000000, "Price cannot exceed 1,000,000"),
  currency: z.string().length(3).default("USD"),
  tags: z.array(z.string().max(50)).max(10).optional(),
  metadata: z.record(z.unknown()).optional(),
  expiresAt: z.string().datetime().optional(),
});

export const updateListingSchema = z.object({
  title: z.string().min(3).max(200).trim().optional(),
  description: z.string().min(10).max(5000).trim().optional(),
  price: z.number().positive().max(1000000).optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
  status: z.enum(["ACTIVE", "PAUSED"]).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const listingQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
  category: z.enum(categories).optional(),
  type: z.enum(["BUY", "SELL"]).optional(),
  minPrice: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  search: z.string().max(200).optional(),
  sortBy: z.enum(["createdAt", "price", "viewCount"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});
